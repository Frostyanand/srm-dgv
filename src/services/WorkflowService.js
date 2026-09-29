import { workflowRepository } from '@/repositories/WorkflowRepository';
import { workflowTemplateRepository } from '@/repositories/WorkflowTemplateRepository';
import { approvalRepository } from '@/repositories/ApprovalRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { userRepository } from '@/repositories/UserRepository';
import { securityService } from './SecurityService';
import { auditService } from './AuditService';
import { NotFoundError, IntegrityError, UnauthorizedError } from '@/lib/utils/errors';

class WorkflowService {
  /**
   * Initializes a workflow with dynamically selected approvers
   * @param {string} documentId 
   * @param {Array<string>} requiredApprovers 
   * @param {string} templateId
   */
  async initializeWorkflow(documentId, requiredApprovers, templateId = 'CUSTOM') {
    if (!requiredApprovers || requiredApprovers.length === 0) {
      throw new IntegrityError('At least one approver must be selected.');
    }

    const workflowData = {
      documentId,
      templateId,
      status: 'PENDING',
      requiredApprovers,
      approvedBy: [], // Array of roleOrUserId that have approved in order
    };

    await workflowRepository.create(workflowData);
    
    await auditService.logEvent('SYSTEM', 'SYSTEM', 'WORKFLOW_CREATE', { documentId, approversCount: requiredApprovers.length });
  }

  /**
   * Processes an approval action independently
   * @param {string} documentId 
   * @param {string} signatoryId 
   * @param {string} action 'APPROVE' | 'REJECT'
   * @param {string} remarks 
   * @param {Object} requestInfo 
   */
  async processApproval(documentId, signatoryId, action, remarks, requestInfo = {}) {
    const workflow = await workflowRepository.findByDocumentId(documentId);
    if (!workflow || workflow.status !== 'PENDING') {
      throw new IntegrityError('Workflow is not active.');
    }

    const document = await documentRepository.findById(documentId);
    const version = await documentRepository.getVersion(documentId, document.currentVersionId);
    const signatory = await userRepository.findById(signatoryId);

    // Sequential Gatekeeper Enforcement:
    // Only the current active approver in the sequential pipeline may act
    const currentStepIndex = (workflow.approvedBy || []).length;
    if (currentStepIndex >= workflow.requiredApprovers.length) {
      throw new IntegrityError('All required approvals have already been processed.');
    }

    const currentExpectedApprover = workflow.requiredApprovers[currentStepIndex];
    const isCurrentTurn = (currentExpectedApprover === signatory.id || currentExpectedApprover === signatory.role);

    if (!isCurrentTurn) {
      throw new UnauthorizedError('It is not your turn to sign this document. Awaiting prior stage approval.');
    }

    const identifierUsed = (currentExpectedApprover === signatory.id) ? signatory.id : signatory.role;

    if (workflow.approvedBy.includes(identifierUsed)) {
      throw new IntegrityError('Signatory has already approved this document.');
    }

    // Decrypt user private key for signing
    if (!signatory.encryptedPrivateKey) {
      throw new IntegrityError('Signatory does not have a registered digital signature key.');
    }
    const { encryptedKey, iv, authTag } = signatory.encryptedPrivateKey;
    const privateKeyPem = securityService.decryptPrivateKey(encryptedKey, iv, authTag);

    const timestamp = Date.now();

    // Construct Approval Payload
    const approvalPayload = {
      documentId,
      versionId: version.id,
      documentHash: version.fileHash,
      action,
      timestamp,
      approverId: signatoryId,
    };

    // Sign payload
    const signature = securityService.signPayload(approvalPayload, privateKeyPem);

    // 1. Append Approval Record (Immutable)
    await approvalRepository.create({
      ...approvalPayload,
      remarks,
      signature,
    });

    // 2. Audit Log
    await auditService.logEvent(signatoryId, signatory.role, action, { documentId, versionId: version.id }, requestInfo);

    if (action === 'REJECT') {
      // Rejection immediately stops workflow and rejects document
      await workflowRepository.update(workflow.id, { 
        status: 'REJECTED',
        rejectedBy: identifierUsed,
        rejectedRemarks: remarks
      });
      await documentRepository.update(documentId, { status: 'REJECTED' });
      return;
    }

    // Action === 'APPROVE'
    const newApprovedBy = [...workflow.approvedBy, identifierUsed];
    const isFullyApproved = (newApprovedBy.length === workflow.requiredApprovers.length);

    if (isFullyApproved) {
      // Workflow Complete
      const ledgerEntry = securityService.generateLedgerEntry(version.fileHash);
      await workflowRepository.update(workflow.id, { 
        status: 'COMPLETED',
        approvedBy: newApprovedBy
      });
      await documentRepository.update(documentId, { 
        status: 'APPROVED',
        secureLedger: ledgerEntry
      });
    } else {
      // Advance to next sequential approver
      await workflowRepository.update(workflow.id, {
        approvedBy: newApprovedBy
      });
    }
  }

  /**
   * Retrieves pending workflows for a signatory (Sequential Gatekeeper aware)
   * @param {string} signatoryId 
   * @param {string} role 
   */
  async getPendingWorkflowsForSignatory(signatoryId, role) {
    const allWorkflows = await workflowRepository.findAll();
    const pending = allWorkflows.filter(wf => wf.status === 'PENDING');
    
    const results = [];
    for (const wf of pending) {
      const approvedCount = (wf.approvedBy || []).length;
      if (approvedCount >= wf.requiredApprovers.length) continue;

      // Sequential Gatekeeper: check if it is THIS signatory's turn
      const currentRequired = wf.requiredApprovers[approvedCount];
      const isMyTurn = (currentRequired === signatoryId || currentRequired === role);

      if (isMyTurn) {
        try {
          const doc = await documentRepository.findById(wf.documentId);
          results.push({
            id: wf.documentId,
            workflowId: wf.id,
            title: doc.title,
            departmentId: doc.departmentId,
            date: new Date(wf.createdAt).toISOString().split('T')[0],
            requiredApprovers: wf.requiredApprovers,
            approvedBy: wf.approvedBy,
            currentStep: approvedCount + 1,
            totalSteps: wf.requiredApprovers.length,
            submitterId: doc.submitterId
          });
        } catch (err) {
          console.warn(`Could not find document ${wf.documentId} for workflow ${wf.id}, skipping.`);
        }
      }
    }
    return results;
  }

  /**
   * Retrieves signing history for a signatory
   * @param {string} signatoryId 
   * @param {string} role 
   */
  async getHistoryForSignatory(signatoryId, role) {
    const allApprovals = await approvalRepository.findAll();
    const signatoryApprovals = allApprovals.filter(a => a.approverId === signatoryId);
    
    // Deduplicate by documentId, keeping the most recent action
    const latestApprovalsByDoc = {};
    for (const approval of signatoryApprovals) {
      if (!latestApprovalsByDoc[approval.documentId] || latestApprovalsByDoc[approval.documentId].timestamp < approval.timestamp) {
        latestApprovalsByDoc[approval.documentId] = approval;
      }
    }
    
    const results = [];
    for (const docId of Object.keys(latestApprovalsByDoc)) {
      const approval = latestApprovalsByDoc[docId];
      try {
        const doc = await documentRepository.findById(docId);
        results.push({
          id: docId,
          workflowId: 'N/A',
          title: doc.title,
          departmentId: doc.departmentId,
          signedDate: new Date(approval.timestamp).toISOString().split('T')[0],
          status: doc.status,
          userAction: approval.action
        });
      } catch (err) {
        console.warn(`Could not find document ${docId}, skipping.`);
      }
    }
    
    // Sort by most recently updated
    return results.sort((a, b) => new Date(b.signedDate) - new Date(a.signedDate));
  }
}

export const workflowService = new WorkflowService();
