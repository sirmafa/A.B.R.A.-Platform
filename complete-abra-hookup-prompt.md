# Complete A.B.R.A. Integration Prompt

## Copy this entire prompt into Amazon Q or any AI assistant:

---

**I need to completely integrate my application with A.B.R.A. Platform for ransomware protection. Please do EVERYTHING needed:**

**STEP 1: Install all dependencies and setup**
```bash
npm install aws-sdk crypto express cors dotenv mysql2
```

**STEP 2: Create complete A.B.R.A. integration module**
Create `abra-integration.js` with:
- AWS SDK configuration for Identity Pool: `us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea`
- DynamoDB table: `ABRA-DLT-Ledger`
- S3 bucket: `abra-backup-898133201826`
- API endpoints: `http://localhost:3002`

**STEP 3: Replace ALL permanent credentials**
Find and replace:
- Database passwords with A.B.R.A. PAT requests
- AWS access keys with temporary credentials
- API keys with JIT access tokens

**STEP 4: Add backup protection**
- Calculate SHA-256 hashes of all critical data
- Anchor hashes to A.B.R.A. DLT using `/anchor-proof`
- Store backups in WORM-compliant S3 with Object Lock
- Add verification before any restore operations

**STEP 5: Protect all API endpoints**
Create middleware that:
- Requires user ID in headers
- Gets temporary credentials from A.B.R.A.
- Records critical transactions in DLT
- Handles 15-minute token expiry

**STEP 6: Add transaction anchoring**
For critical operations (create, update, delete):
- Generate transaction hash
- Store in A.B.R.A. DLT with metadata
- Provide immutable audit trail

**STEP 7: Create environment configuration**
```env
AWS_REGION=us-east-1
ABRA_IDENTITY_POOL_ID=us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea
ABRA_API_URL=http://localhost:3002
ABRA_DLT_TABLE=ABRA-DLT-Ledger
ABRA_BACKUP_BUCKET=abra-backup-898133201826
```

**STEP 8: Add testing endpoints**
Create test routes for:
- PAT request testing
- Backup creation and verification
- Transaction anchoring
- Credential validation

**STEP 9: Error handling and monitoring**
- Handle A.B.R.A. API failures gracefully
- Log all security events
- Alert on backup integrity failures
- Monitor for unusual access patterns

**STEP 10: Complete integration example**
Show how to:
- Start application with A.B.R.A. protection
- Test all security features
- Verify ransomware protection is active

**Requirements:**
- Make MINIMAL changes to existing code
- Ensure backward compatibility
- Add comprehensive error handling
- Include testing examples
- Focus on security best practices

**My application type:** [DESCRIBE YOUR APP - web app, API, database, etc.]

**Current tech stack:** [LIST YOUR TECHNOLOGIES - Node.js, Python, Java, etc.]

**Critical data to protect:** [DESCRIBE WHAT NEEDS BACKUP PROTECTION]

**Please provide COMPLETE, WORKING code that I can copy-paste to fully integrate A.B.R.A. protection into my application. Include all files, configurations, and step-by-step instructions.**

---

## Alternative Ultra-Simple Prompt:

**Hook up my app to A.B.R.A. ransomware protection. Do EVERYTHING: install dependencies, replace permanent credentials with JIT tokens, add backup hash anchoring, protect API endpoints, create middleware. A.B.R.A. API: http://localhost:3002, Identity Pool: us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea, DLT Table: ABRA-DLT-Ledger. Give me complete working code I can copy-paste.**