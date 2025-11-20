# A.B.R.A. Platform Architecture

## System Overview

```mermaid
graph TB
    subgraph "Client Applications"
        WEB[Web Applications]
        MOBILE[Mobile Apps]
        API_CLIENT[API Clients]
        BACKEND[Backend Services]
    end

    subgraph "AWS Cloud Infrastructure"
        subgraph "Frontend Layer"
            AMPLIFY[AWS Amplify<br/>React Dashboard<br/>main.d1lcyvw1emmtji.amplifyapp.com]
        end

        subgraph "API Layer"
            APIGW[API Gateway<br/>72a2dojacb.execute-api.us-east-1.amazonaws.com/prod]
            CORS[CORS Handler<br/>Cross-Origin Support]
        end

        subgraph "Compute Layer"
            LAMBDA1[Lambda Function<br/>request-pat<br/>JIT Access Gate]
            LAMBDA2[Lambda Function<br/>anchor-proof<br/>DLT Anchoring]
            LAMBDA3[Lambda Function<br/>verify-proof<br/>Integrity Verification]
        end

        subgraph "Data Layer"
            DDB[DynamoDB<br/>abra-platform-dlt-ledger-prod<br/>Immutable Ledger]
            S3[S3 Bucket<br/>abra-backup-898133201826<br/>WORM Storage]
        end

        subgraph "Security Layer"
            IAM[IAM Roles<br/>Temporary JIT Access]
            COGNITO[Cognito<br/>MFA Validation]
        end

        subgraph "Monitoring Layer"
            CW[CloudWatch<br/>Logs & Metrics]
            XRAY[X-Ray<br/>Distributed Tracing]
        end
    end

    %% Client Connections
    WEB --> AMPLIFY
    MOBILE --> APIGW
    API_CLIENT --> APIGW
    BACKEND --> APIGW

    %% Frontend to API
    AMPLIFY --> APIGW

    %% API Gateway to Lambda
    APIGW --> CORS
    CORS --> LAMBDA1
    CORS --> LAMBDA2
    CORS --> LAMBDA3

    %% Lambda to Data
    LAMBDA1 --> DDB
    LAMBDA1 --> IAM
    LAMBDA1 --> COGNITO
    LAMBDA2 --> DDB
    LAMBDA3 --> DDB

    %% Backup Storage
    LAMBDA2 --> S3

    %% Monitoring
    LAMBDA1 --> CW
    LAMBDA2 --> CW
    LAMBDA3 --> CW
    APIGW --> CW

    %% Styling
    classDef aws fill:#FF9900,stroke:#232F3E,stroke-width:2px,color:#fff
    classDef client fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef security fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    classDef data fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff

    class AMPLIFY,APIGW,LAMBDA1,LAMBDA2,LAMBDA3,CW,XRAY aws
    class WEB,MOBILE,API_CLIENT,BACKEND client
    class IAM,COGNITO,CORS security
    class DDB,S3 data
```

## Data Flow Architecture

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as API Gateway
    participant L1 as request-pat λ
    participant L2 as anchor-proof λ
    participant L3 as verify-proof λ
    participant DDB as DynamoDB DLT
    participant IAM as IAM Service
    participant S3 as S3 WORM Storage

    %% Mode 1: JIT Access Gate
    Note over Client,S3: Mode 1: Breach Prevention (JIT Access Gate)
    Client->>API: POST /request-pat {userId, companyId}
    API->>L1: Forward request
    L1->>IAM: Create temporary role
    L1->>DDB: Anchor PAT hash to DLT
    L1-->>API: {token, expiry, roleArn}
    API-->>Client: PAT Token (15min expiry)

    %% Mode 2: Backup Protection
    Note over Client,S3: Mode 2: Resilient Recovery (Backup Anchoring)
    Client->>API: POST /anchor-proof {hash}
    API->>L2: Forward backup hash
    L2->>DDB: Store immutable proof
    L2->>S3: Store backup metadata
    L2-->>API: {success, anchorId, blockHeight}
    API-->>Client: Anchor confirmation

    %% Mode 3: Integrity Verification
    Note over Client,S3: Ransomware Detection & Recovery
    Client->>API: POST /verify-proof {currentHash}
    API->>L3: Forward hash for verification
    L3->>DDB: Query anchored proof
    L3-->>API: {isMatch, status, anchoredHash}
    API-->>Client: VERIFIED-CLEAN or COMPROMISED
```

## Security Architecture

```mermaid
graph LR
    subgraph "Zero Trust Principles"
        ZT1[Never Trust<br/>Always Verify]
        ZT2[Least Privilege<br/>Access]
        ZT3[Assume Breach<br/>Mindset]
    end

    subgraph "Authentication Layer"
        MFA[Multi-Factor<br/>Authentication]
        PAT[Personal Access<br/>Tokens (15min)]
        JIT[Just-In-Time<br/>Access]
    end

    subgraph "Authorization Layer"
        TEMP_IAM[Temporary<br/>IAM Roles]
        POLICY[Least Privilege<br/>Policies]
        EXPIRE[Auto-Expiry<br/>Mechanism]
    end

    subgraph "Data Protection"
        HASH[SHA-256<br/>Hashing]
        DLT[Immutable<br/>DLT Ledger]
        WORM[Write-Once<br/>Read-Many]
    end

    subgraph "Network Security"
        HTTPS[HTTPS/TLS 1.3]
        CORS_SEC[CORS Policy]
        WAF[Web Application<br/>Firewall]
    end

    ZT1 --> MFA
    ZT2 --> PAT
    ZT3 --> JIT

    MFA --> TEMP_IAM
    PAT --> POLICY
    JIT --> EXPIRE

    TEMP_IAM --> HASH
    POLICY --> DLT
    EXPIRE --> WORM

    HASH --> HTTPS
    DLT --> CORS_SEC
    WORM --> WAF

    classDef security fill:#F44336,stroke:#C62828,stroke-width:2px,color:#fff
    classDef data fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff
    classDef network fill:#9C27B0,stroke:#6A1B9A,stroke-width:2px,color:#fff

    class ZT1,ZT2,ZT3,MFA,PAT,JIT,TEMP_IAM,POLICY,EXPIRE security
    class HASH,DLT,WORM data
    class HTTPS,CORS_SEC,WAF network
```

## Component Architecture

### Frontend (React + Vite)
- **Framework**: React 18 with modern hooks
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with PostCSS processing
- **State Management**: useReducer for predictable state updates
- **API Layer**: Fetch API with error handling and CORS support

### Backend (AWS Serverless)
- **Runtime**: Node.js 18 with AWS SDK v3
- **Functions**: 3 Lambda functions with single responsibility
- **Database**: DynamoDB with on-demand scaling
- **Storage**: S3 with Object Lock for WORM compliance
- **API**: API Gateway with CORS and rate limiting

### Security Implementation
- **Zero Trust**: No permanent credentials stored
- **JIT Access**: 15-minute token expiry with automatic cleanup
- **Immutable Audit**: DLT anchoring prevents tampering
- **Encryption**: SHA-256 hashing with cryptographic signatures

## Deployment Architecture

```mermaid
graph TB
    subgraph "Development"
        DEV_CODE[Source Code<br/>GitHub Repository]
        DEV_LOCAL[Local Development<br/>Vite + Node.js]
    end

    subgraph "CI/CD Pipeline"
        GIT_PUSH[Git Push]
        AMPLIFY_BUILD[Amplify Build<br/>Automatic Deployment]
        LAMBDA_DEPLOY[Serverless Deploy<br/>AWS Lambda]
    end

    subgraph "Production Environment"
        PROD_FRONTEND[Amplify Hosting<br/>Global CDN]
        PROD_API[API Gateway<br/>Multi-AZ]
        PROD_COMPUTE[Lambda Functions<br/>Auto-scaling]
        PROD_DATA[DynamoDB + S3<br/>Cross-region Backup]
    end

    DEV_CODE --> GIT_PUSH
    DEV_LOCAL --> GIT_PUSH
    GIT_PUSH --> AMPLIFY_BUILD
    GIT_PUSH --> LAMBDA_DEPLOY
    AMPLIFY_BUILD --> PROD_FRONTEND
    LAMBDA_DEPLOY --> PROD_API
    PROD_API --> PROD_COMPUTE
    PROD_COMPUTE --> PROD_DATA

    classDef dev fill:#4CAF50,stroke:#2E7D32,stroke-width:2px,color:#fff
    classDef cicd fill:#FF9800,stroke:#E65100,stroke-width:2px,color:#fff
    classDef prod fill:#2196F3,stroke:#1565C0,stroke-width:2px,color:#fff

    class DEV_CODE,DEV_LOCAL dev
    class GIT_PUSH,AMPLIFY_BUILD,LAMBDA_DEPLOY cicd
    class PROD_FRONTEND,PROD_API,PROD_COMPUTE,PROD_DATA prod
```

## Technology Stack

### Frontend Stack
- **React 18**: Modern component-based UI framework
- **Vite**: Next-generation frontend build tool
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **AWS Amplify**: Hosting and CI/CD platform

### Backend Stack
- **AWS Lambda**: Serverless compute platform
- **Node.js 18**: JavaScript runtime with AWS SDK v3
- **API Gateway**: RESTful API management
- **DynamoDB**: NoSQL database with global tables
- **S3**: Object storage with WORM compliance

### DevOps Stack
- **GitHub**: Version control and collaboration
- **AWS CloudFormation**: Infrastructure as Code
- **CloudWatch**: Monitoring and logging
- **AWS X-Ray**: Distributed tracing (optional)

## Performance Characteristics

### Scalability
- **Lambda**: Auto-scales from 0 to 1000+ concurrent executions
- **DynamoDB**: On-demand scaling with burst capacity
- **API Gateway**: Handles millions of requests per second
- **Amplify CDN**: Global edge locations for low latency

### Availability
- **SLA**: 99.9% uptime with multi-AZ deployment
- **Recovery**: Cross-region backup and failover
- **Monitoring**: Real-time health checks and alerts

### Security
- **Encryption**: Data encrypted in transit and at rest
- **Access Control**: IAM roles with least privilege
- **Audit Trail**: Immutable DLT logging
- **Compliance**: WORM storage for regulatory requirements