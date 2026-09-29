import { NextResponse } from 'next/server';
import { documentService } from '@/services/DocumentService';
import { authService } from '@/services/AuthService';

export async function DELETE(request, { params }) {
  try {
    const { documentId } = await params;
    
    // Verify Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    // Only allow Department Users and Super Admins
    if (user.role !== 'DEPARTMENT_USER' && user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await documentService.deleteDocument(documentId, user.id);

    return NextResponse.json({ success: true, message: 'Document recalled successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Delete Document Error:', error);
    const status = error.name === 'IntegrityError' ? 400 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
