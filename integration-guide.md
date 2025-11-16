# A.B.R.A. Platform Integration Guide

## How A.B.R.A. Connects to Other Applications

### Mode 1: Breach Prevention (JIT Access Gate)

**Integration Points:**
1. **Identity Provider (Cognito)** - Validates MFA before issuing PATs
2. **Target Applications** - Receive temporary IAM roles instead of permanent access
3. **Monitoring Systems** - Receive DLT-anchored audit logs

**Connection Flow:**
```
User Request → A.B.R.A. → Cognito MFA → Create Temp IAM Role → Target App Access
```

### Mode 2: Resilient Recovery (Backup Verification)

**Integration Points:**
1. **Backup Systems** - Send SHA-256 hashes to A.B.R.A. for anchoring
2. **Recovery Systems** - Query A.B.R.A. to verify backup integrity
3. **S3 Buckets** - Protected with Object Lock policies

**Connection Flow:**
```
Backup Created → Hash Generated → A.B.R.A. Anchor → DLT Storage
Recovery Needed → Query A.B.R.A. → Verify Hash → Restore Decision
```

## Integration Methods

### 1. API Integration
Applications call A.B.R.A. REST endpoints:
- `/request-pat` - Request temporary access
- `/anchor-proof` - Store backup hash
- `/verify-proof` - Verify backup integrity

### 2. AWS SDK Integration
Applications use AWS SDK to interact directly with A.B.R.A. resources:
- DynamoDB queries for verification
- IAM role assumptions for access
- S3 Object Lock for backup protection

### 3. Event-Driven Integration
Applications trigger A.B.R.A. via AWS events:
- CloudWatch Events for automated anchoring
- S3 Events for backup verification
- Lambda triggers for real-time processing