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

    const historyDocs = await workflowService.getHistoryForSignatory(user.id, user.role);

    return NextResponse.json({ historyDocs }, { status: 200 });
  } catch (error) {
    console.error('Fetch History Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
