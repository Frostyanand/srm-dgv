# SRM Digital Approval & Document Verification Platform

> A cryptographically verifiable, Zero-Trust digital workflow and approval engine designed specifically for institutional academics and administration at SRM.

## 1. System Overview

The **Digital Verification System** is designed as a strictly hardened **Trust System** rather than a mere document storage portal. Its core mission is to provide an undeniable mathematical proof of institutional workflows:
- **Who** uploaded a document and when.
- **Who** approved it, including exact cryptographic timestamps.
- **Which specific version** of the document was approved.
- That the document has **not been tampered with** (even by a database administrator) since its approval.

By replacing physical ink signatures with ECDSA Cryptographic Signatures and physical filing cabinets with Envelope-Encrypted Cloud Storage, the platform ensures the highest degree of non-repudiation and confidentiality.

---

## 2. Technical Architecture

### Core Stack
- **Frontend Layer**: Next.js (App Router), TailwindCSS, shadcn/ui.
- **Backend API Layer**: Next.js API Routes (Node.js & Edge Runtimes).
- **Service & Repository Layer**: Strictly enforces the Repository Pattern (`API Route -> Service -> Repository -> Database`). API routes never directly touch the database.
- **Database**: Google Cloud Firestore.
- **Authentication**: Firebase Authentication (Email/Password & Google OAuth).
- **Storage**: Supabase Storage.
- **Transactional Email**: Resend API.

---

## 3. Role-Based Access Control (RBAC) & Segregation of Duties

The system adheres strictly to the **Principle of Least Privilege**, ensuring that no single user (including Super Admins) has unilateral control over the document lifecycle.

### 1. Super Admin
- **Role Purpose**: System administration, user provisioning, and monitoring.
- **Allowed Actions**: Add/provision new users, assign roles, view high-level dashboard statistics (total users, active workflows, security events).
- **Hard Restrictions**: **Cannot** view, download, or change the state of any document. **Cannot** alter the approval flow. **Cannot** tamper with audit logs or cryptographic signatures. This ensures that even if an admin account is compromised, the institutional data and approval integrity remain secure.

### 2. Department User (Submitter) (e.g., Exam Cell, Academics)
- **Role Purpose**: Initiating workflows.
- **Allowed Actions**: Upload documents, select required approvers, track the real-time status of their submissions, and recall (delete) documents *only* if they are still in the `PENDING` state.
- **Hard Restrictions**: **Cannot** approve, reject, or modify any approval states. **Cannot** interfere with the workflow once it is in progress or completed. 

### 3. Signatory Authority (e.g., Director, Registrar, Dean)
- **Role Purpose**: Reviewing and approving/rejecting documents.
- **Allowed Actions**: View and download pending documents assigned specifically to them, add remarks, and cryptographically sign approvals or rejections using their private keys.
- **Hard Restrictions**: **Cannot** upload new documents, modify the uploaded file, or delete existing records.


---

## 4. End-to-End User & Data Flow

### 4.1 Document Ingestion & Envelope Encryption
1. A **Department User** initiates a file upload.
2. The file undergoes validation (MIME type, size limits) in both the browser and backend.
3. The server generates a unique, random 32-byte **Data Encryption Key (DEK)** for this specific file.
4. The file is encrypted on-the-fly via a Node.js stream using `AES-256-GCM` with the DEK.
5. Simultaneously, a `SHA-256` hash of the plaintext file is calculated.
6. The DEK itself is then encrypted using the `MASTER_FILE_ENCRYPTION_KEY` (Key Encryption Key) and stored alongside the `SHA-256` hash, IVs, and Auth Tags in Firestore. The encrypted ciphertext is pushed to Cloud Storage. No plaintext is ever written to disk.

### 4.2 Workflow Initialization
1. The system reads the selected required approvers and initializes a workflow record.
2. The document state is marked as `PENDING`.
3. An immutable Audit Log event (`WORKFLOW_CREATE`) is generated using HMAC hash chaining.

### 4.3 The Approval Ceremony
1. A **Signatory Authority** logs into their dashboard and views pending requests.
2. When the Signatory views a document, the server streams the ciphertext from storage, decrypts it on-the-fly, recalculates the `SHA-256` hash to verify integrity against the stored hash, and serves it. If the hashes mismatch, an `IntegrityError` is violently thrown.
3. If the Signatory decides to **Approve**, the system executes a cryptographic signing ceremony.
4. The server retrieves the Signatory's encrypted ECDSA Private Key, decrypts it using the `MASTER_PRIVATE_KEY_ENCRYPTION_KEY`, and signs a payload containing: `[documentId + versionId + documentHash + action + timestamp + approverId]`.
5. This ECDSA `P-256` signature is permanently embedded into the Approval Record.
6. If the document requires multiple approvers, the state remains `PENDING` until all required signatories approve. A single rejection instantly moves the workflow to `REJECTED`.

### 4.4 Audit & Verification
1. An authorized user retrieves the document via the Verification Portal.
2. The system dynamically verifies the ECDSA signatures against the stored public keys.
3. If a malicious actor alters a database flag (e.g., manually changing `PENDING` to `APPROVED`), the cryptographic signature check explicitly fails.

---

## 5. Comprehensive End-to-End Security Audit & Implementation

This platform is built with a paranoid, defense-in-depth security posture designed to withstand institutional audits and malicious insider threats.

### 5.1 Confidentiality via Envelope Encryption (AES-256-GCM)
- **Implementation**: The `SecurityService` dynamically generates a unique DEK for every file upload. The file is stream-encrypted via `AES-256-GCM`, providing both confidentiality and ciphertext integrity (via Auth Tags). The DEK is encrypted using a KEK stored securely in environment variables.
- **Protection Against**: 
  - **Storage Bucket Breaches**: If an attacker gains public or unauthorized access to the storage buckets, they only retrieve useless ciphertext. 
  - **Malicious Cloud Admins**: Even a cloud provider administrator cannot read the documents, as the decryption keys are held separately from the ciphertext.

### 5.2 Document Tamper Resistance (SHA-256 Hashing)
- **Implementation**: During upload, the `DocumentService` pipes the plaintext through a `crypto.createHash('sha256')` stream. During download, the decrypted stream is piped through another hash stream.
- **Protection Against**: 
  - **File Replacement Attacks**: If an attacker substitutes an encrypted file in the storage bucket, the on-the-fly decryption and hashing process will produce a mismatched hash. The system instantly aborts the download, logs a `HASH_MISMATCH` security event, and prevents the tampered document from being viewed or approved.

### 5.3 Cryptographic Verifiability & Non-Repudiation (ECDSA P-256)
- **Implementation**: Database boolean flags (`status: 'APPROVED'`) are legally insufficient. When a Signatory approves a document, their unique Elliptic Curve Digital Signature Algorithm (ECDSA P-256) private key signs the `SHA-256` hash of the document along with the timestamp and action. 
- **Protection Against**: 
  - **Database Manipulation**: A rogue database admin changing `status: 'PENDING'` to `status: 'APPROVED'` will fail cryptographic verification during audits because the required ECDSA signature cannot be forged without the Signatory's private key.
  - **Signatory Repudiation**: A Signatory cannot later claim they did not approve the document; their unique private key signature mathematically binds them to the exact document version hash.

### 5.4 Immutability & Audit Trails (HMAC Hash Chaining)
- **Implementation**: The `AuditService` utilizes an **HMAC Hash Chaining** methodology. Each new log entry mathematically references the hash of the *previous* log entry.
- **Protection Against**: 
  - **Log Tampering & Deletion**: If an attacker gains database access and attempts to delete or alter a past log to cover their tracks, the entire cryptographic chain breaks (the calculated hash will not match the `previousHash` of the next block). This instantly alerts the institution to the breach during `verifyAuditChain()` execution.

### 5.5 Database Hardening (Firestore Default Deny)
- **Implementation**: The Firestore Security Rules (`firestore.rules`) implement a strict **Default Deny** policy (`allow read, write: if false;`).
- **Protection Against**: 
  - **Client-Side Injection & Direct DB Access**: Client-side browsers are physically incapable of writing to or reading from the database directly. All state mutations must pass through the Next.js API layer (which enforces RBAC and cryptographic checks) utilizing the Firebase Admin SDK. 

### 5.6 Threat Detection, SIEM, & Edge Security
- **Implementation**: 
  - **Edge Rate Limiting**: Custom in-memory rate limiters running on the Next.js Edge Middleware block excessive requests.
  - **Edge RBAC**: The Middleware intercepts routing and verifies JWT roles (e.g., blocking `/admin` paths from `DEPARTMENT_USER`).
  - **CSRF Protection**: The Edge Middleware strictly validates `Origin` and `Host` headers for all state-changing `POST/PUT/DELETE` requests.
  - **Internal SIEM**: The `SecurityEventService` actively listens for and permanently logs events like `CSRF_FAILURE`, `RATE_LIMIT_TRIGGER`, `LOGIN_FAILURE`, and `HASH_MISMATCH`.
- **Protection Against**: 
  - **Brute Force & DoS Attacks**: Rate limiting shuts down automated flooding attempts before they hit the Node runtime or database.
  - **Cross-Site Request Forgery (CSRF)**: Strict Origin checking blocks malicious third-party sites from executing state changes on behalf of an authenticated user.
  - **Privilege Escalation**: Edge RBAC ensures users can only access UI and API routes explicitly permitted for their role.

---

## 6. Development & Deployment

### Prerequisites
- Node.js 18+
- Firebase Project (Auth & Firestore)
- Supabase Project (Storage bucket)
- Resend API Account

### Environment Variables
Configure the `.env` file according to the properties validated in `src/config/env.js`. This includes setting up the SDKs, endpoints, Resend keys, and securely generating 32-byte hex hashes for the Master Encryption Keys (`MASTER_FILE_ENCRYPTION_KEY`, `MASTER_PRIVATE_KEY_ENCRYPTION_KEY`, `MASTER_AUDIT_KEY`).

### Running Locally
```bash
npm install
npm run dev
```

> **Future Scalability Roadmap**: The architecture is fully decoupled using Repository patterns and Interfaces, ensuring that future integrations—such as Hardware FIDO2 keys for signing, Google Cloud KMS for master key management, and Redis for distributed rate limiting—can be seamlessly swapped in without systemic refactoring.
