# A.B.R.A. Backend

AWS Serverless backend providing ransomware protection APIs.

## Architecture

- **Lambda Functions**: 3 serverless functions
- **DynamoDB**: Immutable DLT ledger
- **API Gateway**: RESTful API with CORS
- **S3**: WORM-compliant backup storage

## Local Development

```bash
npm install
npm start  # Port 3001
```

## Deployment

```bash
# Production
npm run deploy:prod

# Development  
npm run deploy:dev
```

## Environment Variables

Copy `.env.example` to `.env`:

```
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=898133201826
DLT_TABLE_NAME=abra-platform-dlt-ledger-prod
DLT_SECRET_KEY=your-secret-key
COGNITO_USER_POOL_ID=us-east-1_PROD123
COGNITO_APP_CLIENT_ID=prod123client456
```

## API Endpoints

- `POST /request-pat` - Issue temporary access tokens
- `POST /anchor-proof` - Anchor backup hashes to DLT
- `POST /verify-proof` - Verify backup integrity

See [Operators Manual](../OPERATORS-MANUAL.md) for complete API documentation.