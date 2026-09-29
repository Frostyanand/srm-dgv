import { NextResponse } from 'next/server';
import { workflowService } from '@/services/WorkflowService';
import { authService } from '@/services/AuthService';

export async function POST(request) {
  try {
    // 1. Verify Authentication & REAUTHENTICATION
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    
    // Removed explicit Reauthentication check for approvals per architectural changes
    
    const user = await authService.verifySession(token);

    // 2. Parse body
    const body = await request.json();
    const { documentId, action, remarks } = body;

    if (!documentId || !action || !['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3. Process Approval
    await workflowService.processApproval(documentId, user.id, action, remarks);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Approval Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
