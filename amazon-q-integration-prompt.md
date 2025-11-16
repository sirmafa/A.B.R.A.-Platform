# Amazon Q Prompt for A.B.R.A. Integration

## Copy and paste this prompt into Amazon Q when working on another application:

---

**Integrate my application with A.B.R.A. Platform for ransomware protection. A.B.R.A. provides:**

**Mode 1 (JIT Access):** Replace permanent credentials with 15-minute temporary access tokens
**Mode 2 (Backup Protection):** Immutable backup verification using DLT anchoring

**A.B.R.A. Configuration:**
- Identity Pool: `us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea`
- DynamoDB Table: `ABRA-DLT-Ledger`
- S3 Bucket: `abra-backup-898133201826`
- API Base URL: `http://localhost:3002`

**Integration Requirements:**
1. Replace permanent AWS/database credentials with A.B.R.A. PAT requests
2. Add backup hash anchoring to DLT for integrity verification
3. Implement WORM-compliant backup storage
4. Add middleware for protected API endpoints

**API Endpoints:**
- `POST /request-pat` - Get temporary access token
- `POST /anchor-proof` - Anchor backup hash to DLT
- `POST /verify-proof` - Verify backup integrity

**Dependencies needed:**
```bash
npm install aws-sdk crypto
```

**AWS SDK Configuration:**
```javascript
AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea'
    })
});
```

**Please:**
1. Analyze my current application architecture
2. Identify where permanent credentials are used
3. Show how to replace them with A.B.R.A. PAT requests
4. Add backup protection with hash anchoring
5. Create middleware for API protection
6. Provide testing examples

**Focus on security best practices and minimal code changes to existing application.**

---

## Alternative Short Prompt:

**Connect my app to A.B.R.A. ransomware protection platform. Replace permanent credentials with JIT access tokens and add immutable backup verification. A.B.R.A. API: http://localhost:3002, Identity Pool: us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea, DLT Table: ABRA-DLT-Ledger. Show integration steps.**