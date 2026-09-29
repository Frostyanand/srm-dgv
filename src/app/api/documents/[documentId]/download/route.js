import { NextResponse } from 'next/server';
import { documentService } from '@/services/DocumentService';
import { authService } from '@/services/AuthService';
import { Readable, PassThrough } from 'stream';
import { ZipArchive } from 'archiver';
import { certificateService } from '@/services/CertificateService';

export async function GET(request, { params }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];
    const user = await authService.verifySession(token);

    const { documentId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const versionId = searchParams.get('versionId');

    // 1. Fetch document metadata to verify access
    const document = await documentService.getDocument(documentId);
    
    // AuthZ Check: Only submitter, signatories, or super admins can download
    // For now, allow DEPARTMENT_USER (if they belong to the dept or submitted it), SIGNATORY, SUPER_ADMIN
    if (user.role === 'DEPARTMENT_USER' && user.departmentId !== document.departmentId) {
       return NextResponse.json({ error: 'Forbidden. You do not have access to this document.' }, { status: 403 });
    }

    const targetVersionId = versionId || document.currentVersionId;
    
    // 2. Fetch the decrypted stream
    const { stream, mimeType, originalName } = await documentService.downloadDocumentVersion(documentId, targetVersionId);

    // If the document is fully APPROVED, return a Sidecar ZIP bundle
    if (document.status === 'APPROVED') {
      const archive = new ZipArchive({ zlib: { level: 9 } });
      const passThrough = new PassThrough();
      
      archive.pipe(passThrough);

      // Add the original pristine file
      archive.append(stream, { name: originalName || 'document.bin' });

      // Add the Certificate of Completion
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('host');
      const verifyUrl = `${protocol}://${host}/verify`;
      
      const certBuffer = await certificateService.generateCertificate(documentId, verifyUrl);
      archive.append(certBuffer, { name: 'Certificate_of_Completion.pdf' });

      archive.finalize();

      const webStream = Readable.toWeb(passThrough);

      return new NextResponse(webStream, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${(originalName || 'document').replace(/\.[^/.]+$/, "")}_Verified_Bundle.zip"`,
        },
      });
    }

    // Convert Node Readable stream to Web ReadableStream
    const webStream = Readable.toWeb(stream);

    // 3. Stream it directly to the client
    return new NextResponse(webStream, {
      headers: {
        'Content-Type': mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${originalName || 'document.bin'}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode || 500 });
  }
}
