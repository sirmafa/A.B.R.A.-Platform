A.B.R.A. Platform: Application and Backend Architecture

Overview

The Atomic Blockchain Ransomware Anchor (A.B.R.A.) is a dual-mode cybersecurity platform designed to mitigate ransomware risks stemming from Governance Failure (unsecured access) and Operational Resilience Failure (compromised backups). The entire solution is built on a Zero Trust Architecture (ZTA) pattern using native AWS services integrated with a private Distributed Ledger Technology (DLT) for immutability.

The Problem (Why A.B.R.A. Exists)

Access Control Gap: Demonstrated by the Change Healthcare breach, where missing MFA allowed initial access via compromised credentials.

Data Integrity Gap: Demonstrated by the NHLS attack, where attackers successfully deleted backups, ensuring BCP failure.

Backend Architecture: AWS & DLT Integration

The core services rely on temporary authorization and unalterable storage.

Mode 1: Breach Prevention (Privileged Access Gate - PAG)

Purpose: To eliminate standing access to critical infrastructure (like backup systems) via Just-In-Time (JIT) access.

User Flow: A privileged user (Engineer persona) initiates a request for elevated permissions through the React Portal's "Request PAT" button.

AWS Components:

Identity (IdP): AWS Cognito User Pools (Manages users and enforces MFA).

Authorization Engine: AWS Lambda (Pre-Token Generation Trigger) which generates the PAT and anchors its hash to the DLT.

Access Grant: AWS IAM Identity Center dynamically grants a Permission Set for a maximum of 15 minutes.

Key API Endpoint: /request-pat (Generates the JIT access token).

Mode 2: Resilient Recovery (Integrity Anchor)

Purpose: To provide mathematically verifiable proof that a backup volume is clean and uncompromised.

Storage: Critical backups are held on AWS S3 configured with Object Lock (WORM policy) to prevent deletion.

Verification: The backup system calculates the volume's SHA-256 hash and sends it to the API.

Anchoring: The API's Lambda function validates the hash and records it permanently on the DLT Ledger (simulated immutable table).

Key API Endpoints: /anchor-proof (Writes hash to DLT) and /verify-proof (Compares compromised hash to immutable anchor).

Deployment and Security Best Practices

Frontend (React Application)

The code uses React and is primarily focused on presenting the API interfaces.

Must adhere to the security-guardrails.md rules (especially XSS prevention and no hard-coded secrets).

All sensitive API communication must use HTTPS/TLS.

Environment Variables

VITAL: All sensitive configuration values must be loaded at runtime from a secure store (e.g., AWS Secrets Manager), not hard-coded.

Required Variables (Minimum): ABRA_API_URL, COGNITO_USER_POOL_ID, COGNITO_APP_CLIENT_ID.

⚙️ Hooking Up the Project Files (MANDATORY STEPS)

To ensure Amazon Q uses these instructions, follow these steps in your project's root directory:

Create the Rules Directory: Amazon Q automatically scans for rule files in this specific path.

mkdir -p .amazonq/rules
