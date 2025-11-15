# A.B.R.A. Platform

**Atomic Blockchain Ransomware Anchor** - A dual-mode cybersecurity platform designed to mitigate ransomware risks through Zero Trust Architecture and immutable backup verification.

## Overview

A.B.R.A. addresses critical ransomware vulnerabilities demonstrated in high-impact incidents like Change Healthcare and NHLS by implementing:

- **Mode 1: Breach Prevention** - JIT access with MFA enforcement
- **Mode 2: Resilient Recovery** - Immutable backup integrity verification

## Architecture

### Frontend (React)
- Modular component structure
- Security-compliant (XSS prevention, no hardcoded secrets)
- Real-time status monitoring

### Backend (AWS Serverless)
- **Lambda Functions**: `/request-pat`, `/anchor-proof`, `/verify-proof`
- **DLT Service**: Immutable hash anchoring
- **Security**: MFA validation, temporary IAM roles, WORM compliance

## Quick Start

### Backend
```bash
cd backend
npm install
npm start  # Local development server on port 3001
```

### Frontend
```bash
# Serve the React application
# Update API endpoints to point to localhost:3001
```

## Security Features

- **Zero Trust**: No standing credentials
- **MFA Enforcement**: All privileged access requires MFA
- **JIT Access**: 15-minute token expiry
- **Immutable Logging**: DLT anchoring prevents tampering
- **WORM Compliance**: S3 Object Lock for backup integrity

## Deployment

### Development
```bash
cd backend
npm run deploy:dev
```

### Production
```bash
cd backend
npm run deploy:prod
```

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:
- AWS credentials and region
- Cognito User Pool settings
- DLT secret key

## License

MIT