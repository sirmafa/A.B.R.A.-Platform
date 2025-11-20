# A.B.R.A. Platform

**Atomic Blockchain Ransomware Anchor** - A production-ready cybersecurity platform providing dual-mode ransomware protection through Zero Trust Architecture and immutable backup verification.

## 🚀 Live Production System

**API Endpoint**: `https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod`  
**Dashboard**: `https://main.d1lcyvw1emmtji.amplifyapp.com`  
**Repository**: `https://github.com/sirmafa/A.B.R.A.-Platform`

## 📖 Documentation

- **[Portfolio Overview](PROJECT-PORTFOLIO.md)** - Technical achievements and skills demonstrated
- **[System Architecture](ARCHITECTURE.md)** - Detailed architecture diagrams and design
- **[Operators Manual](OPERATORS-MANUAL.md)** - Complete API documentation and usage guide
- **[Integration Guide](ABRA-Integration-Prompt.md)** - Copy-paste integration for other applications
- **[Code Examples](integration-examples/)** - Implementation samples for common use cases

## 🔧 Quick Integration

```javascript
// Request temporary access token
const pat = await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/request-pat', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({userId: 'user123', companyId: 'company456'})
});

// Anchor backup proof
const hash = crypto.createHash('sha256').update(backupData).digest('hex');
await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/anchor-proof', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({hash})
});

// Verify backup integrity
const verification = await fetch('https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod/verify-proof', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({currentHash: hash})
});
// Returns: VERIFIED-CLEAN or COMPROMISED
```

## 🛡️ Security Features

- **Zero Trust**: No permanent credentials
- **JIT Access**: 15-minute token expiry
- **Immutable Ledger**: DLT anchoring prevents tampering
- **Ransomware Detection**: Hash verification detects compromise
- **WORM Compliance**: S3 Object Lock for backup integrity

## 🏗️ Architecture

```
┌─────────────────┐    HTTPS/API    ┌─────────────────┐
│   Your App      │ ──────────────► │   A.B.R.A.      │
│                 │                 │   Service       │
│ - Any System    │ ◄────────────── │                 │
│ - Web/Mobile    │    Protection   │ - AWS Lambda    │
│ - Backend       │                 │ - DynamoDB      │
│ - Database      │                 │ - S3 WORM       │
└─────────────────┘                 └─────────────────┘
```

## 🚀 Development

### Local Backend
```bash
cd backend
npm install
npm start  # Port 3001
```

### Local Frontend
```bash
npm install
npm run dev  # Port 5173
```

### Deploy
```bash
cd backend
npm run deploy:prod
```

## 📄 License

MIT