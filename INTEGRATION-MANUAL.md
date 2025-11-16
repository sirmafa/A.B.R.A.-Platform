# A.B.R.A. Platform Integration Manual

## Step-by-Step Integration Guide

### Prerequisites
- AWS Account with A.B.R.A. infrastructure deployed
- Identity Pool ID: `us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea`
- DynamoDB Table: `ABRA-DLT-Ledger`

---

## Mode 1: JIT Access Integration (Replace Permanent Credentials)

### Step 1: Install Dependencies
```bash
npm install aws-sdk crypto
```

### Step 2: Replace Permanent AWS Credentials
**Before (Vulnerable):**
```javascript
const s3 = new AWS.S3({
    accessKeyId: 'PERMANENT_KEY',
    secretAccessKey: 'PERMANENT_SECRET'
});
```

**After (A.B.R.A. Protected):**
```javascript
const { requestTemporaryAccess } = require('./abra-integration');

async function getSecureS3Client(userId) {
    const tempAccess = await requestTemporaryAccess(userId);
    return new AWS.S3({
        accessKeyId: tempAccess.AccessKeyId,
        secretAccessKey: tempAccess.SecretAccessKey,
        sessionToken: tempAccess.SessionToken
    });
}
```

### Step 3: Create A.B.R.A. Integration Module
```javascript
// abra-integration.js
const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea'
    })
});

async function requestTemporaryAccess(userId) {
    const response = await fetch('http://localhost:3002/request-pat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, companyId: 'YOUR_COMPANY_ID' })
    });
    
    const result = await response.json();
    
    // Assume the temporary role
    const sts = new AWS.STS();
    const credentials = await sts.assumeRole({
        RoleArn: result.roleArn,
        RoleSessionName: `Session-${userId}-${Date.now()}`,
        DurationSeconds: 900
    }).promise();
    
    return credentials.Credentials;
}

module.exports = { requestTemporaryAccess };
```

### Step 4: Update Application Code
```javascript
// your-application.js
const { requestTemporaryAccess } = require('./abra-integration');

async function accessProtectedResource(userId, bucketName) {
    // Get temporary credentials from A.B.R.A.
    const tempCreds = await requestTemporaryAccess(userId);
    
    // Create temporary S3 client
    const s3 = new AWS.S3({
        accessKeyId: tempCreds.AccessKeyId,
        secretAccessKey: tempCreds.SecretAccessKey,
        sessionToken: tempCreds.SessionToken
    });
    
    // Access resource with temporary credentials
    const objects = await s3.listObjects({ Bucket: bucketName }).promise();
    return objects;
}
```

---

## Mode 2: Backup Verification Integration

### Step 1: Integrate Backup Creation
```javascript
// backup-service.js
const AWS = require('aws-sdk');
const crypto = require('crypto');

class SecureBackupService {
    constructor() {
        this.s3 = new AWS.S3();
        this.dynamodb = new AWS.DynamoDB.DocumentClient();
    }
    
    async createSecureBackup(data) {
        // 1. Create backup
        const backupKey = `backup-${Date.now()}.tar.gz`;
        await this.s3.putObject({
            Bucket: 'abra-backup-898133201826',
            Key: backupKey,
            Body: data,
            ObjectLockMode: 'COMPLIANCE',
            ObjectLockRetainUntilDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
        }).promise();
        
        // 2. Calculate hash
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        
        // 3. Anchor in A.B.R.A. DLT
        await this.anchorBackupProof(hash, backupKey);
        
        return { backupKey, hash };
    }
    
    async anchorBackupProof(hash, backupKey) {
        await this.dynamodb.put({
            TableName: 'ABRA-DLT-Ledger',
            Item: {
                anchorId: crypto.randomUUID(),
                hash,
                type: 'BACKUP_PROOF',
                timestamp: Date.now(),
                metadata: { backupKey }
            }
        }).promise();
    }
}
```

### Step 2: Integrate Backup Verification
```javascript
async function verifyBackupBeforeRestore(backupKey) {
    // 1. Get backup
    const backup = await this.s3.getObject({
        Bucket: 'abra-backup-898133201826',
        Key: backupKey
    }).promise();
    
    // 2. Calculate current hash
    const currentHash = crypto.createHash('sha256').update(backup.Body).digest('hex');
    
    // 3. Get anchored proof
    const result = await this.dynamodb.query({
        TableName: 'ABRA-DLT-Ledger',
        IndexName: 'TypeTimestampIndex',
        KeyConditionExpression: '#type = :type',
        FilterExpression: 'metadata.backupKey = :backupKey',
        ExpressionAttributeNames: { '#type': 'type' },
        ExpressionAttributeValues: { 
            ':type': 'BACKUP_PROOF',
            ':backupKey': backupKey
        }
    }).promise();
    
    const anchoredProof = result.Items[0];
    const isIntact = currentHash === anchoredProof.hash;
    
    if (!isIntact) {
        throw new Error('BACKUP COMPROMISED - DO NOT RESTORE');
    }
    
    return { status: 'VERIFIED-CLEAN', hash: currentHash };
}
```

---

## Integration Examples by Application Type

### Web Application Integration
```javascript
// Express.js middleware
function abraProtection(req, res, next) {
    const userId = req.user.id;
    
    req.getSecureAWS = async () => {
        return await requestTemporaryAccess(userId);
    };
    
    next();
}

app.use(abraProtection);

app.get('/secure-data', async (req, res) => {
    const aws = await req.getSecureAWS();
    // Use temporary credentials
});
```

### Database Backup Integration
```javascript
// PostgreSQL backup with A.B.R.A.
async function createSecurePGBackup() {
    // 1. Create backup
    const backupData = await exec('pg_dump mydb');
    
    // 2. Secure with A.B.R.A.
    const { backupKey, hash } = await createSecureBackup(backupData);
    
    console.log(`Backup secured: ${backupKey}, Hash: ${hash}`);
}
```

### Microservice Integration
```javascript
// Service-to-service authentication
class MicroserviceClient {
    async callSecureService(userId, endpoint, data) {
        const tempCreds = await requestTemporaryAccess(userId);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `AWS4-HMAC-SHA256 ${tempCreds.AccessKeyId}`,
                'X-Amz-Security-Token': tempCreds.SessionToken
            },
            body: JSON.stringify(data)
        });
        
        return response.json();
    }
}
```

---

## Quick Integration Checklist

### For JIT Access (Mode 1):
- [ ] Replace permanent AWS credentials with A.B.R.A. PAT requests
- [ ] Add MFA requirement to user authentication
- [ ] Update application to use temporary credentials
- [ ] Test 15-minute token expiry

### For Backup Verification (Mode 2):
- [ ] Calculate SHA-256 hash of all backups
- [ ] Send hashes to A.B.R.A. for DLT anchoring
- [ ] Verify backup integrity before restoration
- [ ] Use S3 Object Lock for WORM compliance

### For Monitoring:
- [ ] Query A.B.R.A. DLT for audit logs
- [ ] Set up CloudWatch alerts for security events
- [ ] Monitor for compromised backup alerts

---

## Testing Your Integration

### Test JIT Access:
```bash
# Test temporary credential request
curl -X POST http://localhost:3002/request-pat \
  -H "Content-Type: application/json" \
  -d '{"userId":"testuser","companyId":"TEST-123"}'
```

### Test Backup Verification:
```bash
# Test backup proof anchoring
curl -X POST http://localhost:3002/anchor-proof \
  -H "Content-Type: application/json" \
  -d '{"hash":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}'
```

### Test Verification:
```bash
# Test backup integrity verification
curl -X POST http://localhost:3002/verify-proof \
  -H "Content-Type: application/json" \
  -d '{"currentHash":"0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"}'
```

---

## Troubleshooting

### Common Issues:
1. **403 Forbidden**: Check IAM permissions for Identity Pool
2. **Token Expired**: Implement token refresh logic
3. **Hash Mismatch**: Backup may be compromised - investigate immediately
4. **DynamoDB Access Denied**: Verify table permissions

### Support:
- Check `test-aws-connection.html` for connectivity issues
- Monitor CloudWatch logs for detailed error messages
- Verify A.B.R.A. infrastructure deployment status