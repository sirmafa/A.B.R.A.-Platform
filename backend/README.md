# A.B.R.A. Platform Backend

AWS-based backend infrastructure for the Atomic Blockchain Ransomware Anchor platform.

## Architecture

### Mode 1: Breach Prevention (PAG)
- **Endpoint**: `/request-pat`
- **Function**: `request-pat.js`
- **Purpose**: Issues JIT access tokens with MFA validation
- **Security**: Anchors PAT hash to DLT, creates temporary IAM roles

### Mode 2: Resilient Recovery
- **Endpoints**: `/anchor-proof`, `/verify-proof`
- **Functions**: `anchor-proof.js`, `verify-proof.js`
- **Purpose**: Immutable backup integrity verification
- **Security**: SHA-256 validation, DLT anchoring with WORM compliance

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
# Edit .env with your AWS configuration
```

3. Deploy to AWS:
```bash
npm run deploy:dev
```

## Security Features

- **MFA Enforcement**: All PAT requests require MFA
- **JIT Access**: Temporary IAM roles (15-minute expiry)
- **Immutable Logging**: DLT anchoring prevents tampering
- **WORM Compliance**: S3 Object Lock for backup integrity
- **Hash Validation**: Strict SHA-256 format enforcement

## Infrastructure

- **AWS Lambda**: Serverless compute
- **DynamoDB**: DLT ledger storage
- **S3**: WORM-compliant backup storage
- **Cognito**: Identity and MFA management
- **IAM**: JIT access control