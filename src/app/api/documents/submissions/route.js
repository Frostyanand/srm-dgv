import { NextResponse } from 'next/server';
import { authService } from '@/services/AuthService';
import { documentRepository } from '@/repositories/DocumentRepository';
import { workflowRepository } from '@/repositories/WorkflowRepository';
import { approvalRepository } from '@/repositories/ApprovalRepository';
import { userRepository } from '@/repositories/UserRepository';

export async function GET(request) {
  try {
    // 1. Verify Session
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    const allowedRoles = ['DEPARTMENT_USER', 'SUPER_ADMIN', 'SIGNATORY', 'STUDENT'];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Fetch all documents submitted by this user
    const documents = await documentRepository.findBySubmitter(user.id);

    // 3. Enrich with detailed workflow and tracking history
    const userCache = {}; // Cache to avoid duplicate DB calls for same user/role
    
    const resolveName = async (identifier) => {
      if (identifier === 'SIGNATORY' || identifier === 'SUPER_ADMIN' || identifier === 'DEPARTMENT_USER') {
        return identifier.replace('_', ' '); // Format role names
      }
      if (userCache[identifier]) return userCache[identifier];
      try {
        const u = await userRepository.findById(identifier);
        if (u) {
          userCache[identifier] = u.name;
          return u.name;
        }
      } catch (e) {
        // user not found
      }
      userCache[identifier] = identifier; // fallback
      return identifier;
    };

    const enrichedDocuments = await Promise.all(documents.map(async (doc) => {
      let workflow = null;
      let tracking = {
        requiredApprovers: [],
        approvedBy: [],
        pendingApprovers: [],
        history: [] // Chronological list of actions (approvals/rejections/remarks)
      };

      try {
        workflow = await workflowRepository.findByDocumentId(doc.id);
        if (workflow) {
          // Resolve names for required approvers
          const reqNames = await Promise.all(workflow.requiredApprovers.map(resolveName));
          const appNames = await Promise.all(workflow.approvedBy.map(resolveName));
          
          tracking.requiredApprovers = reqNames;
          tracking.approvedBy = appNames;
          
          // Pending = Required - Approved
          const pendingIds = workflow.requiredApprovers.filter(req => !workflow.approvedBy.includes(req));
          tracking.pendingApprovers = await Promise.all(pendingIds.map(resolveName));
        }

        if (doc.currentVersionId) {
          const approvals = await approvalRepository.findByDocumentVersion(doc.id, doc.currentVersionId);
          
          tracking.history = await Promise.all(approvals.map(async (app) => {
            const approverName = await resolveName(app.approverId);
            return {
              action: app.action, // 'APPROVE' or 'REJECT'
              approverName,
              remarks: app.remarks || '',
              timestamp: app.timestamp,
              signatureHash: app.signature ? app.signature.substring(0, 16) + '...' : null
            };
          }));
        }

      } catch (err) {
        console.error(`Error enriching document ${doc.id}:`, err);
      }

      return {
        id: doc.id,
        title: doc.title,
        description: doc.description,
        status: doc.status,
        createdAt: doc.createdAt,
        originalName: doc.originalName,
        workflowStatus: workflow ? workflow.status : 'UNKNOWN',
        tracking
      };
    }));

    // Sort by newest first
    enrichedDocuments.sort((a, b) => b.createdAt - a.createdAt);

    return NextResponse.json({ submissions: enrichedDocuments });
  } catch (error) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
