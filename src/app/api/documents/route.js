import { NextResponse } from 'next/server';
import { documentService } from '@/services/DocumentService';
import { authService } from '@/services/AuthService';
import { validateFileUpload } from '@/lib/utils/validators';
import { securityEventService } from '@/services/SecurityEventService';

export async function POST(request) {
  try {
    // 1. Verify Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    // Only Dept Users or Super Admins can upload
    if (user.role !== 'DEPARTMENT_USER' && user.role !== 'SUPER_ADMIN') {
      await securityEventService.logSecurityEvent('PERMISSION_DENIED', { 
        userId: user.id, 
        role: user.role, 
        action: 'UPLOAD_DOCUMENT' 
      }, {
        ipAddress: request.ip || 'UNKNOWN',
        userAgent: request.headers.get('user-agent')
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Parse FormData (supports streaming upload)
    const formData = await request.formData();
    const file = formData.get('file');
    const title = formData.get('title');
    const description = formData.get('description');
    const requiredApproversRaw = formData.get('requiredApprovers');

    let requiredApprovers = [];
    if (requiredApproversRaw) {
      try {
        requiredApprovers = JSON.parse(requiredApproversRaw);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid requiredApprovers format' }, { status: 400 });
      }
    }

    if (!file || !title || requiredApprovers.length === 0) {
      return NextResponse.json({ error: 'Missing required fields or no approvers selected' }, { status: 400 });
    }

    // Input Validation (MIME & Size)
    validateFileUpload(file);

    const docData = {
      departmentId: user.departmentId || 'DEFAULT_DEPT',
      submitterId: user.id,
      title,
      description,
      mimeType: file.type,
      originalName: file.name,
    };

    // 3. Upload & Initialize Workflow
    const documentId = await documentService.uploadDocument(docData, file.stream(), requiredApprovers);

    return NextResponse.json({ success: true, documentId }, { status: 201 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
