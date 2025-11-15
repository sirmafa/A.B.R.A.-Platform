CRITICAL SECURITY GUARDRALIS FOR A.B.R.A. PLATFORM (CIS/NIST Alignment)

Purpose

Enforce mandatory security controls (MFA, PoLP, Immutability) throughout the application development lifecycle to mitigate the Governance and BCP failures cited in high-impact ransomware incidents (Change Healthcare, NHLS).

Priority

CRITICAL: MUST be enforced without exception.

1. Identity & Privileged Access (Mode 1 Prevention Focus)

Guideline

Enforcement Rationale

MFA Mandate

ALWAYS require Multi-Factor Authentication (MFA) for all access to API endpoints, especially /request-pat. Code must assume MFA is enforced by Cognito.

Zero Trust / JIT

NEVER use or suggest standing credentials. All privileged operations must rely on short-lived tokens (PATs) anchored via DLT, aligning with Just-In-Time (JIT) access.

Least Privilege (PoLP)

IAM policies must be scoped to the absolute minimum necessary (e.g., s3:GetObject not s3:*). DO NOT use or suggest policies that grant blanket administrative permissions.

2. Front-End Security (React Code)

Guideline

Enforcement Rationale

XSS Prevention

ALWAYS rely on React's default output encoding. NEVER use dangerouslySetInnerHTML for rendering user-supplied data.

Secret Management

DO NOT include any API keys, credentials, or DLT connection strings directly in .jsx or environment files that are bundled for the browser. Frontend must request secrets securely via an authenticated backend endpoint.

3. Data Integrity & Immutability (Mode 2 Recovery Focus)

Guideline

Enforcement Rationale

WORM Compliance

All data storage used for backups (e.g., S3 Bucket) must be configured to enforce Write-Once, Read-Many (WORM) or Object Lock immutability  .

Immutable Logging

All audit and control logs (CloudTrail, Cognito logs) must be routed to a separate, secured Log Archive S3 Bucket with restricted deletion permissions.

Input Validation (Hashing)

All hash inputs to the DLT-anchoring API (/anchor-proof) must be strictly validated as a well-formed SHA-256 string to prevent corruption of the immutable ledger.