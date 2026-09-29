import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import qrcode from 'qrcode';
import { adminDb } from '@/lib/firebase/admin';

class CertificateService {
  /**
   * Generates a Certificate of Completion PDF Buffer
   * @param {string} documentId 
   * @param {string} verifyUrl Base URL to the verify page (e.g. http://localhost:3000/verify)
   * @returns {Promise<Buffer>}
   */
  async generateCertificate(documentId, verifyUrl) {
    // 1. Fetch Document Data
    const docSnap = await adminDb.collection('documents').doc(documentId).get();
    if (!docSnap.exists) throw new Error('Document not found');
    const docData = docSnap.data();

    // 2. Fetch Workflow & Approvals
    const workflowSnap = await adminDb.collection('workflows')
      .where('documentId', '==', documentId)
      .limit(1)
      .get();
    
    let signers = [];
    if (!workflowSnap.empty) {
      const approvalsSnap = await adminDb.collection('approvals')
        .where('documentId', '==', documentId)
        .get();
      
      const approvals = approvalsSnap.docs.map(d => d.data());
      for (const approval of approvals) {
        if (approval.action === 'APPROVE') {
          const userSnap = await adminDb.collection('users').doc(approval.approverId).get();
          if (userSnap.exists) {
            const user = userSnap.data();
            signers.push({
              name: user.name,
              email: user.email,
              role: user.role,
              timestamp: approval.timestamp,
              signature: approval.signature,
            });
          }
        }
      }
      signers.sort((a, b) => a.timestamp - b.timestamp);
    }

    // 3. Create PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]); // Custom dimensions
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    // Header
    page.drawText('SRM Digital Verification Platform', {
      x: 50, y: height - 60, size: 20, font: fontBold, color: rgb(0.1, 0.1, 0.4)
    });
    
    page.drawText('Certificate of Completion', {
      x: 50, y: height - 90, size: 24, font: fontBold, color: rgb(0, 0, 0)
    });

    // Disclaimer Block
    const disclaimer = "This document has been digitally signed using enterprise-grade Elliptic Curve Cryptography.\nIt does not require a physical signature. The integrity of this document and the identities\nof the signatories are mathematically guaranteed by the SRM immutable ledger.";
    
    page.drawText(disclaimer, {
      x: 50, y: height - 130, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3), lineHeight: 14
    });

    // Document Meta
    page.drawText('Document Meta', { x: 50, y: height - 200, size: 14, font: fontBold });
    page.drawText(`Title: ${docData.title}`, { x: 50, y: height - 220, size: 12, font: fontRegular });
    page.drawText(`System ID: ${documentId}`, { x: 50, y: height - 240, size: 10, font: fontMono, color: rgb(0.4, 0.4, 0.4) });

    // Signatories
    page.drawText('Official Signatories', { x: 50, y: height - 280, size: 14, font: fontBold });

    let currentY = height - 310;
    for (const signer of signers) {
      if (currentY < 150) {
        // Handle pagination if too many signers (simplified for now)
        page.drawText('... (more signatories on ledger)', { x: 50, y: currentY, size: 10, font: fontRegular });
        break;
      }
      
      // Draw Checkmark or bullet (using standard WinAnsi characters)
      page.drawText('[+]', { x: 50, y: currentY, size: 12, font: fontBold, color: rgb(0.1, 0.6, 0.2) });
      
      page.drawText(`${signer.name} (${signer.role})`, { x: 75, y: currentY, size: 12, font: fontBold });
      page.drawText(`${signer.email}  |  Signed: ${new Date(signer.timestamp).toLocaleString()}`, { x: 75, y: currentY - 15, size: 10, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
      
      // Truncate signature hash for display
      const shortSig = signer.signature.substring(0, 40) + '...';
      page.drawText(`ECDSA Sig: ${shortSig}`, { x: 70, y: currentY - 30, size: 8, font: fontMono, color: rgb(0.6, 0.6, 0.6) });

      currentY -= 60;
    }

    // QR Code Generation
    const qrImageUri = await qrcode.toDataURL(verifyUrl, { margin: 1, width: 120 });
    const qrImageBytes = Buffer.from(qrImageUri.split(',')[1], 'base64');
    const qrImage = await pdfDoc.embedPng(qrImageBytes);

    page.drawImage(qrImage, {
      x: width - 150,
      y: 50,
      width: 100,
      height: 100,
    });

    page.drawText('Scan to Verify instantly', {
      x: width - 150, y: 35, size: 9, font: fontBold, color: rgb(0.1, 0.1, 0.4)
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
}

export const certificateService = new CertificateService();
