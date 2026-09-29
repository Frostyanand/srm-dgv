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
   */
  async initializeWorkflow(documentId, requiredApprovers) {
    if (!requiredApprovers || requiredApprovers.length === 0) {
      throw new IntegrityError('At least one approver must be selected.');
    }

    const workflowData = {
      documentId,
      templateId: 'CUSTOM', // Replaced static template with custom
      status: 'PENDING',
      requiredApprovers,
      approvedBy: [], // Array of roleOrUserId that have approved
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

    // Verify current signatory is in the required approvers list
    const isRequired = workflow.requiredApprovers.includes(signatory.id) || workflow.requiredApprovers.includes(signatory.role);
    if (!isRequired) {
      throw new UnauthorizedError('Signatory is not required for this workflow.');
    }

    const identifierUsed = workflow.requiredApprovers.includes(signatory.id) ? signatory.id : signatory.role;

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
      // Any rejection fails the entire workflow
      await workflowRepository.update(workflow.id, { status: 'REJECTED' });
      await documentRepository.update(documentId, { status: 'REJECTED' });
      return;
    }

    // Action === 'APPROVE'
    const newApprovedBy = [...workflow.approvedBy, identifierUsed];
    const isFullyApproved = workflow.requiredApprovers.every(req => newApprovedBy.includes(req));

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
      // Mark this individual's approval
      await workflowRepository.update(workflow.id, {
        approvedBy: newApprovedBy
      });
    }
  }

  /**
   * Retrieves pending workflows for a signatory
   * @param {string} signatoryId 
   * @param {string} role 
   */
  async getPendingWorkflowsForSignatory(signatoryId, role) {
    // A more advanced query would be done in repository. For now we fetch all pending and filter.
    const allWorkflows = await workflowRepository.findAll();
    const pending = allWorkflows.filter(wf => wf.status === 'PENDING');
    
    const results = [];
    for (const wf of pending) {
      const isRequired = wf.requiredApprovers.includes(signatoryId) || wf.requiredApprovers.includes(role);
      const identifierUsed = wf.requiredApprovers.includes(signatoryId) ? signatoryId : role;
      const hasApproved = wf.approvedBy.includes(identifierUsed);

      if (isRequired && !hasApproved) {
        try {
          // Fetch document metadata for context
          const doc = await documentRepository.findById(wf.documentId);
          results.push({
            id: wf.documentId, // Changed to documentId so that ReviewSignModal fetches correctly!
            workflowId: wf.id,
            title: doc.title,
            departmentId: doc.departmentId,
            date: new Date(wf.createdAt).toISOString().split('T')[0],
            requiredApprovers: wf.requiredApprovers,
            approvedBy: wf.approvedBy
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
