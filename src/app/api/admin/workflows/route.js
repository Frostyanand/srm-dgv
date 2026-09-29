import { NextResponse } from 'next/server';
import { authService } from '@/services/AuthService';
import { workflowRepository } from '@/repositories/WorkflowRepository';
import { documentRepository } from '@/repositories/DocumentRepository';
import { approvalRepository } from '@/repositories/ApprovalRepository';
import { userRepository } from '@/repositories/UserRepository';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. Fetch all data
    const allWorkflows = await workflowRepository.findAll();
    const allDocuments = await documentRepository.findAll();
    const allApprovals = await approvalRepository.findAll();
    const allUsers = await userRepository.findAll();

    // Helper map for users
    const userMap = {};
    for (const u of allUsers) {
      userMap[u.id] = { name: u.displayName || u.email, role: u.role, email: u.email };
    }

    // Map departments to pretty names if needed, or just use departmentId
    const departmentNames = {
      'ACADEMICS': 'Academics',
      'ADMINISTRATION': 'Administration',
      'FINANCE': 'Finance'
    };

    // 2. Aggregate data
    const aggregatedWorkflows = [];

    for (const wf of allWorkflows) {
      const doc = allDocuments.find(d => d.id === wf.documentId);
      if (!doc) continue; // Orphan workflow, skip

      const submitter = userMap[doc.submitterId] || { name: doc.submitterId, email: doc.submitterId };
      const approvalsForDoc = allApprovals.filter(a => a.documentId === wf.documentId);

      // Build the journey map for required approvers
      const approversJourney = wf.requiredApprovers.map(reqIdOrRole => {
        // Find if this specific person or role has acted
        // Approvals are tied to specific users, not roles directly in the approvals table,
        // but let's see if we can map it.
        const approval = approvalsForDoc.find(a => {
          if (a.approverId === reqIdOrRole) return true;
          const approverUser = userMap[a.approverId];
          if (approverUser && approverUser.role === reqIdOrRole) return true;
          return false;
        });

        // Determine user details for display
        let displayName = reqIdOrRole;
        if (userMap[reqIdOrRole]) {
          displayName = userMap[reqIdOrRole].name;
        } else {
          // It's a role, format it nicely
          displayName = reqIdOrRole.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
        }

        if (approval) {
          const approverUser = userMap[approval.approverId] || { name: approval.approverId, email: approval.approverId };
          return {
            id: reqIdOrRole,
            name: approverUser.name,
            email: approverUser.email,
            roleName: displayName,
            action: approval.action, // 'APPROVE' or 'REJECT'
            timestamp: approval.timestamp
          };
        } else {
          return {
            id: reqIdOrRole,
            name: displayName,
            roleName: displayName,
            action: 'PENDING',
            timestamp: null
          };
        }
      });

      aggregatedWorkflows.push({
        id: wf.id,
        documentId: doc.id,
        title: doc.title,
        department: departmentNames[doc.departmentId] || doc.departmentId,
        submitter: {
          name: submitter.name,
          email: submitter.email
        },
        status: wf.status, // 'PENDING', 'COMPLETED', 'REJECTED'
        createdAt: wf.createdAt,
        updatedAt: wf.updatedAt || wf.createdAt,
        approvers: approversJourney
      });
    }

    // Sort by most recently updated/created (active ones first maybe? Or just recent)
    aggregatedWorkflows.sort((a, b) => b.updatedAt - a.updatedAt);

    return NextResponse.json({ workflows: aggregatedWorkflows }, { status: 200 });
  } catch (error) {
    console.error('Fetch Workflows Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
