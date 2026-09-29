import { NextResponse } from 'next/server';
import { documentService } from '@/services/DocumentService';
import { authService } from '@/services/AuthService';
import { userRepository } from '@/repositories/UserRepository';
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

    // Permitted roles: DEPARTMENT_USER, SUPER_ADMIN, SIGNATORY (Professors/FAs/AAs/HODs), STUDENT
    const allowedRoles = ['DEPARTMENT_USER', 'SUPER_ADMIN', 'SIGNATORY', 'STUDENT'];
    if (!allowedRoles.includes(user.role)) {
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
    const templateId = formData.get('templateId') || 'CUSTOM';
    const requiredApproversRaw = formData.get('requiredApprovers');
    const clientFaId = formData.get('facultyAdvisorId');

    let requiredApprovers = [];
    if (requiredApproversRaw) {
      try {
        requiredApprovers = JSON.parse(requiredApproversRaw);
      } catch (e) {
        return NextResponse.json({ error: 'Invalid requiredApprovers format' }, { status: 400 });
      }
    }

    // 3. STUDENT Gatekeeper Enforcement
    // If submitter is a student, the document MUST first be routed to their assigned Faculty Advisor (FA)
    if (user.role === 'STUDENT') {
      const studentProfile = await userRepository.findById(user.id);
      const faId = studentProfile?.facultyAdvisorId || clientFaId;

      if (!faId) {
        return NextResponse.json({ 
          error: 'Student must have an assigned Faculty Advisor (FA) as the preliminary gatekeeper.' 
        }, { status: 400 });
      }

      // Ensure FA is prepended at Step 0, avoiding duplicate entries
      requiredApprovers = [faId, ...requiredApprovers.filter(id => id !== faId)];
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

    // 4. Upload & Initialize Workflow
    const documentId = await documentService.uploadDocument(docData, file.stream(), requiredApprovers, templateId);

    return NextResponse.json({ success: true, documentId }, { status: 201 });
  } catch (error) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
