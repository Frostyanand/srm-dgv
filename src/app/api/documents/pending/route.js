import { NextResponse } from 'next/server';
import { workflowService } from '@/services/WorkflowService';
import { authService } from '@/services/AuthService';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    if (user.role !== 'SIGNATORY') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const pendingDocs = await workflowService.getPendingWorkflowsForSignatory(user.id, user.role);

    return NextResponse.json({ pendingDocs });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
