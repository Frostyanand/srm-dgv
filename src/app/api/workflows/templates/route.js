import { NextResponse } from 'next/server';
import { workflowTemplateService } from '@/services/WorkflowTemplateService';
import { authService } from '@/services/AuthService';

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    if (user.role !== 'SUPER_ADMIN' && user.role !== 'DEPARTMENT_USER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templates = await workflowTemplateService.getAllTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
