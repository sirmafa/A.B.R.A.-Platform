# A.B.R.A. SDK Integration Steps

## Step 1: Install Dependencies
```bash
npm install aws-sdk crypto
```

## Step 2: Configure AWS SDK
```javascript
const AWS = require('aws-sdk');

AWS.config.update({
    region: 'us-east-1',
    credentials: new AWS.CognitoIdentityCredentials({
        IdentityPoolId: 'us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea'
    })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const iam = new AWS.IAM();
const s3 = new AWS.S3();
```

## Step 3: Create A.B.R.A. SDK Class
```javascript
const crypto = require('crypto');

class ABRASDK {
    constructor() {
        this.dynamodb = new AWS.DynamoDB.DocumentClient();
        this.s3 = new AWS.S3();
        this.iam = new AWS.IAM();
        this.tableName = 'ABRA-DLT-Ledger';
    }

    // Mode 1: Request temporary access
    async requestPAT(userId, companyId) {
        const patToken = 'PAT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        const expiry = Date.now() + 900000;
        
        // Anchor PAT in DLT
        await this.anchorHash(
            crypto.createHash('sha256').update(patToken + userId).digest('hex'),
            'PAT_ISSUED',
            { userId, companyId, expiry }
        );
        
        return { token: patToken, expiry };
    }

    // Mode 2: Anchor backup proof
    async anchorProof(hash, metadata = {}) {
        return await this.anchorHash(hash, 'BACKUP_PROOF', metadata);
    }

    // Mode 2: Verify backup integrity
    async verifyProof(currentHash) {
        const result = await this.dynamodb.query({
            TableName: this.tableName,
            IndexName: 'TypeTimestampIndex',
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': 'BACKUP_PROOF' },
            ScanIndexForward: false,
            Limit: 1
        }).promise();

        const anchoredProof = result.Items[0];
        const isMatch = currentHash === anchoredProof?.hash;
        
        return {
            isMatch,
            status: isMatch ? 'VERIFIED-CLEAN' : 'COMPROMISED',
            anchoredHash: anchoredProof?.hash
        };
    }

    // Core DLT anchoring function
    async anchorHash(hash, type, metadata = {}) {
        const anchorId = crypto.randomUUID();
        
        await this.dynamodb.put({
            TableName: this.tableName,
            Item: {
                anchorId,
                hash,
                type,
                timestamp: Date.now(),
                metadata
            }
        }).promise();
        
        return { anchorId, hash };
    }

    // Create WORM-compliant backup
    async createSecureBackup(data, bucketName = 'abra-backup-898133201826') {
        const backupKey = `backup-${Date.now()}.data`;
        
        await this.s3.putObject({
            Bucket: bucketName,
            Key: backupKey,
            Body: data,
            ObjectLockMode: 'COMPLIANCE',
            ObjectLockRetainUntilDate: new Date(Date.now() + 7 * 365 * 24 * 60 * 60 * 1000)
        }).promise();
        
        const hash = crypto.createHash('sha256').update(data).digest('hex');
        await this.anchorProof(hash, { backupKey });
        
        return { backupKey, hash };
    }
}

module.exports = ABRASDK;
```

## Step 4: Basic Usage Examples

### Protect Database Access:
```javascript
const ABRASDK = require('./abra-sdk');
const abra = new ABRASDK();

async function secureDBAccess(userId) {
    // Get temporary access token
    const pat = await abra.requestPAT(userId, 'MY-COMPANY');
    
    // Use token for database connection
    const db = createConnection({
        host: 'localhost',
        user: 'temp_user',
        password: pat.token,
        timeout: 900000
    });
    
    return db;
}
```

### Secure Backup Creation:
```javascript
async function createSecureBackup(data) {
    const backup = await abra.createSecureBackup(data);
    console.log(`Backup created: ${backup.backupKey}`);
    return backup;
}
```

### Verify Backup Integrity:
```javascript
async function verifyBackup(backupKey) {
    // Get backup from S3
    const backup = await abra.s3.getObject({
        Bucket: 'abra-backup-898133201826',
        Key: backupKey
    }).promise();
    
    // Calculate current hash
    const currentHash = crypto.createHash('sha256').update(backup.Body).digest('hex');
    
    // Verify against DLT
    const verification = await abra.verifyProof(currentHash);
    
    if (!verification.isMatch) {
        throw new Error('BACKUP COMPROMISED');
    }
    
    return verification;
}
```

## Step 5: Express.js Middleware
```javascript
function abraMiddleware(req, res, next) {
    req.abra = new ABRASDK();
    
    req.secureAccess = async (userId) => {
        return await req.abra.requestPAT(userId, 'MY-COMPANY');
    };
    
    req.anchorTransaction = async (data) => {
        const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
        return await req.abra.anchorHash(hash, 'TRANSACTION', data);
    };
    
    next();
}

app.use(abraMiddleware);
```

## Step 6: Complete Integration Example
```javascript
const express = require('express');
const ABRASDK = require('./abra-sdk');

const app = express();
const abra = new ABRASDK();

app.use(express.json());

// Protected endpoint
app.post('/api/secure-operation', async (req, res) => {
    try {
        const { userId, data } = req.body;
        
        // 1. Get temporary access
        const pat = await abra.requestPAT(userId, 'MY-COMPANY');
        
        // 2. Perform operation with temporary credentials
        const result = await performOperation(data, pat.token);
        
        // 3. Anchor operation in DLT
        const hash = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
        await abra.anchorHash(hash, 'OPERATION', { userId, operation: 'secure-operation' });
        
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Backup endpoint
app.post('/api/backup', async (req, res) => {
    try {
        const { data } = req.body;
        const backup = await abra.createSecureBackup(JSON.stringify(data));
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Verify endpoint
app.post('/api/verify', async (req, res) => {
    try {
        const { hash } = req.body;
        const verification = await abra.verifyProof(hash);
        res.json(verification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => {
    console.log('A.B.R.A. protected application running on port 3000');
});
```

## Step 7: Test Your Integration
```bash
# Test PAT request
node -e "
const ABRASDK = require('./abra-sdk');
const abra = new ABRASDK();
abra.requestPAT('testuser', 'TEST-COMPANY').then(console.log);
"

# Test backup creation
node -e "
const ABRASDK = require('./abra-sdk');
const abra = new ABRASDK();
abra.createSecureBackup('test data').then(console.log);
"

# Test verification
node -e "
const ABRASDK = require('./abra-sdk');
const abra = new ABRASDK();
abra.verifyProof('your-hash-here').then(console.log);
"
```

## Step 8: Environment Variables
```bash
# .env file
AWS_REGION=us-east-1
ABRA_IDENTITY_POOL_ID=us-east-1:76e78d3a-ca17-45b1-a3ea-5e1dffa721ea
ABRA_DLT_TABLE=ABRA-DLT-Ledger
ABRA_BACKUP_BUCKET=abra-backup-898133201826
```

**Your application is now protected with A.B.R.A. SDK integration!**