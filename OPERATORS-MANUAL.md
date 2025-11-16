# A.B.R.A. Platform Operators Manual

## Overview
A.B.R.A. (Atomic Blockchain Ransomware Anchor) is a dual-mode cybersecurity service that provides ransomware protection through Zero Trust Architecture and immutable backup verification.

## System Architecture

### Production Infrastructure
- **API Gateway**: `https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod`
- **Lambda Functions**: 3 serverless functions handling authentication, anchoring, and verification
- **DynamoDB**: `abra-platform-dlt-ledger-prod` - Immutable ledger for hash anchoring
- **S3 Bucket**: `abra-backup-898133201826` - WORM-compliant backup storage
- **Frontend**: `https://main.d1lcyvw1emmtji.amplifyapp.com` - React dashboard

### Service Endpoints

#### 1. Request PAT Token (JIT Access Gate)
```
POST /request-pat
Content-Type: application/json

Request:
{
  "userId": "string",
  "companyId": "string"
}

Response:
{
  "token": "PAT-XXXXXXXXXXXXXXXX",
  "expiry": 1763291675938,
  "roleArn": "arn:aws:iam::898133201826:role/ABRA-JIT-user-timestamp",
  "message": "PAT issued via JIT Access Gate. Hash anchored on DLT."
}
```

#### 2. Anchor Backup Proof
```
POST /anchor-proof
Content-Type: application/json

Request:
{
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}

Response:
{
  "success": true,
  "message": "Backup Proof successfully anchored to DLT.",
  "hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "anchorId": "2e80285a-0b64-417c-9ac3-d1bd2298fc2e",
  "blockHeight": 1
}
```

#### 3. Verify Backup Integrity
```
POST /verify-proof
Content-Type: application/json

Request:
{
  "currentHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}

Response:
{
  "isMatch": true,
  "status": "VERIFIED-CLEAN",
  "anchoredHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "anchorTimestamp": 1763290586954,
  "blockHeight": 1
}
```

## Integration Patterns

### Pattern 1: Authentication Replacement
Replace permanent credentials with temporary PAT tokens:

```javascript
// Before critical operations
const response = await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/request-pat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    userId: 'operator123',
    companyId: 'your-company-id'
  })
});

const {token, expiry} = await response.json();
// Use token for next 15 minutes, then request new one
```

### Pattern 2: Backup Protection
Anchor critical data hashes before operations:

```javascript
// Generate hash of critical data
const crypto = require('crypto');
const dataHash = crypto.createHash('sha256').update(criticalData).digest('hex');

// Anchor to immutable ledger
await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/anchor-proof', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({hash: dataHash})
});
```

### Pattern 3: Ransomware Detection
Verify data integrity during recovery:

```javascript
// Hash current data
const currentHash = crypto.createHash('sha256').update(currentData).digest('hex');

// Check against anchored proof
const verification = await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/verify-proof', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({currentHash})
});

const result = await verification.json();
if (result.status === 'COMPROMISED') {
  // Ransomware detected - use clean backup
  console.log('⚠️ RANSOMWARE DETECTED - Data compromised');
} else {
  // Data is clean
  console.log('✅ Data verified clean');
}
```

## Application Integration Examples

### Web Applications (React/Vue/Angular)
```javascript
// In your frontend application
const abraService = {
  baseUrl: 'https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod',
  
  async requestAccess(userId, companyId) {
    const response = await fetch(`${this.baseUrl}/request-pat`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({userId, companyId})
    });
    return response.json();
  },
  
  async anchorBackup(dataHash) {
    const response = await fetch(`${this.baseUrl}/anchor-proof`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({hash: dataHash})
    });
    return response.json();
  },
  
  async verifyIntegrity(currentHash) {
    const response = await fetch(`${this.baseUrl}/verify-proof`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({currentHash})
    });
    return response.json();
  }
};
```

### Node.js Backend Services
```javascript
const axios = require('axios');
const crypto = require('crypto');

class ABRAIntegration {
  constructor() {
    this.baseUrl = 'https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod';
  }
  
  async protectOperation(userId, companyId, data) {
    // 1. Get temporary access
    const pat = await this.requestPAT(userId, companyId);
    
    // 2. Anchor data hash
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    await this.anchorProof(hash);
    
    // 3. Perform operation with temporary credentials
    return this.executeWithPAT(pat.token, data);
  }
  
  async verifyBackup(backupData) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(backupData)).digest('hex');
    const result = await this.verifyProof(hash);
    return result.status === 'VERIFIED-CLEAN';
  }
}
```

### Database Operations
```javascript
// Before database backup
const backupData = await database.export();
const backupHash = crypto.createHash('sha256').update(backupData).digest('hex');

// Anchor proof before storing backup
await abraService.anchorBackup(backupHash);

// Store backup with hash reference
await storage.save(backupData, {abraHash: backupHash});

// During recovery - verify integrity
const restoredData = await storage.load(backupId);
const verification = await abraService.verifyIntegrity(restoredData.abraHash);

if (verification.status === 'COMPROMISED') {
  throw new Error('Backup compromised by ransomware - use earlier backup');
}
```

## Monitoring and Operations

### Health Checks
```bash
# Test API availability
curl -X POST https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/request-pat \
  -H "Content-Type: application/json" \
  -d '{"userId":"healthcheck","companyId":"test"}'
```

### Error Handling
- **400 Bad Request**: Invalid hash format or missing parameters
- **403 Forbidden**: MFA required or access denied
- **404 Not Found**: No anchored proof found for verification
- **500 Internal Server Error**: Service unavailable

### Rate Limits
- PAT requests: 100/minute per user
- Anchor operations: 1000/minute per company
- Verify operations: Unlimited

### Security Considerations
- All API calls use HTTPS with CORS enabled
- PAT tokens expire after 15 minutes
- Hash anchoring is immutable and tamper-proof
- No sensitive data is stored, only SHA-256 hashes

## Deployment and Maintenance

### AWS Resources
- **Lambda Functions**: Auto-scaling, no maintenance required
- **DynamoDB**: On-demand billing, automatic backups
- **API Gateway**: Managed service with built-in monitoring
- **S3**: WORM compliance with Object Lock enabled

### Backup Strategy
- DLT ledger: Automatically replicated across AWS regions
- Lambda code: Stored in version control (GitHub)
- Configuration: Environment variables in AWS Systems Manager

### Disaster Recovery
- Multi-AZ deployment ensures 99.9% availability
- Cross-region replication for DLT data
- Automated failover for API Gateway

## Support and Troubleshooting

### Common Issues
1. **CORS Errors**: Ensure Origin header matches allowed domains
2. **Invalid Hash**: Use SHA-256 format (64 hex characters)
3. **Token Expiry**: Request new PAT token every 15 minutes
4. **Rate Limiting**: Implement exponential backoff

### Logs and Monitoring
- CloudWatch Logs: `/aws/lambda/abra-platform-prod-*`
- API Gateway Metrics: Request count, latency, errors
- DynamoDB Metrics: Read/write capacity, throttling

### Contact Information
- GitHub Repository: https://github.com/sirmafa/A.B.R.A.-Platform
- Issues: Create GitHub issue for bug reports
- Documentation: README.md in repository