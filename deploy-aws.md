# Deploy A.B.R.A. Platform to AWS

## 1. Deploy Infrastructure

```bash
aws cloudformation create-stack \
  --stack-name abra-platform \
  --template-body file://aws-infrastructure.yml \
  --capabilities CAPABILITY_NAMED_IAM
```

## 2. Get Identity Pool ID

```bash
aws cloudformation describe-stacks \
  --stack-name abra-platform \
  --query 'Stacks[0].Outputs[?OutputKey==`IdentityPoolId`].OutputValue' \
  --output text
```

## 3. Update Application

Replace `YOUR_IDENTITY_POOL_ID` in `aws-app.html` with the actual Identity Pool ID from step 2.

## 4. Open Application

Open `aws-app.html` in your browser. The application will:

- ✅ Connect directly to AWS services
- ✅ Create temporary IAM roles for JIT access
- ✅ Store immutable proofs in DynamoDB
- ✅ Use S3 with Object Lock for WORM compliance

## Security Features

- **Zero Trust**: Browser-based AWS SDK with minimal permissions
- **JIT Access**: Temporary IAM roles created on-demand
- **Immutable Ledger**: DynamoDB with cryptographic signatures
- **WORM Compliance**: S3 Object Lock prevents backup deletion

## Required Permissions

The Cognito Identity Pool provides:
- DynamoDB read/write for DLT operations
- IAM role creation for JIT access
- S3 access for backup verification