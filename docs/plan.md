# PLAN.md

# SRM Digital Approval & Document Verification Platform

Version: 1.0

Status: Approved Architecture Specification

Purpose: This document serves as the single source of truth for development of the Digital Approval & Verification Platform. All implementation decisions should follow this document unless explicitly revised.

---

# 1. Project Vision

The platform is designed to provide a secure internal workflow for document approval, verification, signing, storage, and audit tracking within SRM.

The primary use case is approval and verification of sensitive institutional documents such as:

* Grade sheets
* Semester results
* Academic approvals
* Administrative approvals
* Official institutional documents

The platform must ensure:

* Authenticity
* Integrity
* Accountability
* Traceability
* Non-repudiation
* Tamper detection

The approved document produced by the system shall be treated as the institution's authoritative document.

---

# 2. Core Principle

The product is NOT a document storage system.

The product is NOT a file upload system.

The product is a trust system.

At any point in time the institution should be able to prove:

* Who uploaded a document
* Who approved it
* When it was approved
* Which version was approved
* Whether the document has been altered after approval

---

# 3. Technology Stack

## Frontend

* Next.js
* TypeScript
* TailwindCSS
* shadcn/ui

## Backend

* Next.js API Routes

## Authentication

Firebase Authentication

Supported methods:

* Email/Password
* Google Sign-In

Future:

* MFA
* FIDO2 Security Keys

## Database

Firestore

Used for:

* User data
* Roles
* Workflow data
* Approvals
* Audit logs
* Metadata
* Cryptographic signatures

## Email

Resend

Used for:

* Approval notifications
* Status updates
* Reminder emails

## File Storage

Current Phase:

Supabase Storage

Reason:

Firebase Storage requires billed plan.

Future Migration:

Firebase Storage Bucket

All file access logic should be abstracted behind a storage service layer so storage backend can be changed without affecting business logic.

---

# 4. User Roles

## Super Admin

Permissions:

* Create signatory accounts
* Create department accounts
* Configure workflows
* Manage system settings

Restrictions:

* Cannot modify approval records
* Cannot modify audit logs
* Cannot modify cryptographic signatures

---

## Department User

Examples:

* Academics
* Examination Cell
* Placement Cell
* Administration

Permissions:

* Upload documents
* Create approval requests
* View request status
* Track approvals

Restrictions:

* Cannot approve
* Cannot reject
* Cannot modify approvals

---

## Signatory Authority

Examples:

* Director
* Registrar
* Dean

Permissions:

* View assigned documents
* Download assigned documents
* Approve documents
* Reject documents
* Add remarks

Restrictions:

* Cannot modify uploaded file
* Cannot delete uploaded file
* Cannot edit approval history

---

## Auditor

Permissions:

* Read-only access
* View logs
* View approvals
* Generate reports

Restrictions:

* No modification rights

---

# 5. Authentication Architecture

Phase 1

Supported:

* Firebase Email/Password
* Google Sign-In

Signatories can use either.

Admin can configure approved Google account.

---

Phase 3

Add:

* MFA
* Authenticator App Support
* FIDO2 Security Keys

Implementation deferred until institution confirms preferred authentication solution.

---

# 6. Complete Approval Workflow

Department User logs in.

↓

Uploads file.

↓

Adds:

* Reason
* Description
* Remarks
* Department
* Submitter information
* Notification email address

↓

System generates:

* Document ID
* SHA256 Hash
* Version Number

↓

Document stored.

↓

Workflow created.

↓

Email notifications sent to signatories.

↓

Signatory logs in.

↓

Views document.

↓

Downloads document if required.

↓

Adds remarks.

↓

Approves or rejects.

↓

Cryptographic signature generated.

↓

Approval stored.

↓

Audit log written.

↓

Notification email sent to submitter.

↓

After final approval document status becomes:

APPROVED

---

# 7. Document Storage Architecture

Current Phase

Storage Backend:

Supabase Storage

Stored Files:

Encrypted Files Only

No plaintext documents stored.

---

Future Phase

Storage Backend:

Firebase Storage Bucket

Migration should be transparent through storage abstraction layer.

---

# 8. Encryption Architecture

Goal:

Protect confidentiality.

Algorithm:

AES-256-GCM

Process:

Upload

↓

Encrypt File

↓

Store Encrypted File

↓

Store Metadata Separately

Metadata:

* Hash
* File Name
* Version
* Workflow ID

Stored in Firestore.

---

# 9. Encryption Key Management

Phase 1

Store master encryption key in:

Vercel Environment Variables

Example:

MASTER_FILE_ENCRYPTION_KEY

---

Future Phase

Migrate to:

Google Cloud KMS

Reason:

Storage and key management should be separated.

---

# 10. File Integrity Verification

Purpose:

Detect document tampering.

Algorithm:

SHA-256

When uploaded:

Generate hash.

Store hash.

Example:

SHA256(document)

↓

ABCD1234...

Stored in Firestore.

Whenever file retrieved:

Recalculate hash.

Compare.

If mismatch:

Raise integrity failure.

Reject document.

---

# 11. Version Control System

Documents must NEVER be overwritten.

Every modification creates a new version.

Example:

GradeSheet_v1

GradeSheet_v2

GradeSheet_v3

Each version has:

* Independent hash
* Independent approval history
* Independent signatures

Approval of Version 2 does not imply approval of Version 3.

Every version requires fresh approval.

---

# 12. Cryptographic Digital Signatures

Purpose:

Provide authenticity and non-repudiation.

A database record alone is insufficient.

We must prove:

* Who approved
* What was approved
* When it was approved

---

## Phase 1 Architecture

Server Managed Signing

Each signatory receives:

Public Key

Private Key

Generated automatically.

User never sees keys.

User never manages keys.

---

Approval Process

Authority clicks Approve.

↓

System verifies session.

↓

System verifies role.

↓

System verifies workflow permissions.

↓

Private key retrieved.

↓

Approval payload signed.

↓

Signature stored.

---

Payload Example

{
documentHash,
documentVersion,
action,
timestamp,
approver
}

Signature generated using ECDSA.

---

Recommended Algorithm

ECDSA P-256

Reason:

* Modern
* Fast
* Smaller signatures

---

# 13. Future Signature Architecture

Phase 3

Support:

* USB Security Keys
* WebAuthn
* FIDO2

Potential devices:

* YubiKey
* Similar institutional security tokens

Private key remains on hardware.

Approval requires physical device.

Implementation deferred until institutional requirements are confirmed.

---

# 14. Approval Records

Every approval stores:

* Approver
* Role
* Timestamp
* Action
* Remarks
* Document Hash
* Signature

Approval records immutable after creation.

---

# 15. Audit Logging Architecture

Every security-relevant event generates an audit record.

Events:

* Login
* Logout
* Upload
* Download
* View
* Approve
* Reject
* User Creation
* Workflow Creation
* Role Changes

---

Audit Record

Contains:

* User ID
* Role
* Action
* Timestamp
* IP Address
* User Agent
* Document IDstill 
* Version ID

---

# 16. Audit Log Immutability

Logs must never be modified.

Logs must never be deleted.

Firestore Rules:

No update.

No delete.

Insert only.

Append-only architecture.

---

Future Enhancement

Hash Chained Audit Logs

Log N stores hash of Log N-1.

Provides tamper evidence.

---

# 17. Firestore Security Model

Security Model:

Default Deny

Everything denied unless explicitly allowed.

---

Department User

Allowed:

* Create requests
* Read own requests

Denied:

* Approvals
* Deletion

---

Signatory

Allowed:

* Read assigned requests
* Approve assigned requests

Denied:

* Modify files
* Delete files

---

Admin

Allowed:

* Account management
* Workflow management

Denied:

* Approval modification
* Audit log modification

---

Auditor

Read-only access.

---

# 18. Download Security

Never expose storage URLs directly.

Generate temporary signed URLs.

Short expiry.

Recommended:

5 minutes

Prevents unauthorized sharing.

---

# 19. Input Validation

Validate:

* File Type
* MIME Type
* File Size

Do not trust extensions.

Example:

virus.exe.pdf

must be rejected.

---

# 20. Session Security

Secure Cookies

Use:

* HttpOnly
* Secure
* SameSite Strict

Session timeout required.

Recommended:

15 minutes inactivity.

---

# 21. XSS Protection

Sanitize all user-generated fields.

Examples:

* Remarks
* Reasons
* Comments

Never render raw HTML.

---

# 22. CSRF Protection

All state-changing endpoints require CSRF protection.

Includes:

* Approval
* Rejection
* Upload
* User Management

---

# 23. Rate Limiting

Protect:

* Login endpoints
* Password reset
* Approval endpoints

Prevent brute force attacks.

---

# 24. Content Security Policy

Enable strict CSP.

Restrict:

* Scripts
* Frames
* External resources

Protect against injected JavaScript.

---

# 25. Monitoring

Track:

* Failed logins
* Excessive downloads
* Unusual activity
* Suspicious IPs

Generate alerts.

---

# 26. Backup Strategy

Daily backups.

Include:

* Firestore
* Storage
* Audit Logs

Retention:

Minimum 30 days.

---

# 27. Notification System

Resend Email Integration

Events:

* Document Submitted
* Approved
* Rejected
* Workflow Completed

Email links never bypass authentication.

Emails only redirect users to login page.

---

# 28. Future Production Hardening

To be implemented after successful demo and institutional approval.

Includes:

* Domain Migration
* College-Owned Firebase Account
* College-Owned Resend Account
* MFA
* FIDO2 Security Keys
* Hardware Signing
* Cloud KMS
* Firebase Storage Migration
* SIEM Integration
* Security Monitoring
* Penetration Testing

---

# 29. Development Phases

## Phase 1

Core Platform

* Authentication
* User Roles
* Upload System
* Approval Workflow
* Remarks
* Notifications
* Firestore Integration
* Supabase Storage
* AES Encryption
* SHA256 Hashing

---

## Phase 2

Security Core

* Cryptographic Signatures
* Immutable Audit Logs
* Version Control
* Firestore Hardening
* Signed Downloads
* Monitoring

---

## Phase 3

Production Deployment

* Domain Migration
* College Ownership Transfer
* Firebase Storage Migration
* MFA
* FIDO2 Security Keys
* Hardware Signing
* Cloud KMS
* Enterprise Hardening

---

# Final System Objective

The platform must ensure that any approved document can later be proven to be:

* Authentic
* Untampered
* Traceable
* Verifiable

and that every action performed on the document can be attributed to a specific authenticated authority with cryptographic evidence and a complete audit trail.
