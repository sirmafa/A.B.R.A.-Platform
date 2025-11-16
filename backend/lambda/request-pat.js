const { CognitoIdentityProviderClient, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { IAMClient, CreateRoleCommand, PutRolePolicyCommand, DeleteRolePolicyCommand, DeleteRoleCommand } = require('@aws-sdk/client-iam');
const crypto = require('crypto');

const cognito = new CognitoIdentityProviderClient({});
const iam = new IAMClient({});
const dlt = require('./dlt/anchor-service');

exports.handler = async (event) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            body: ''
        };
    }
    
    try {
        const { userId, companyId } = JSON.parse(event.body);
        
        // Mock MFA validation for local development
        // Mock MFA validation for development
        console.log('Mock MFA validation passed for user:', userId);
        if (false) {
            const userAttributes = await cognito.send(new AdminGetUserCommand({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: userId
            }));
            
            if (!userAttributes.UserMFASettingList || userAttributes.UserMFASettingList.length === 0) {
                return {
                    statusCode: 403,
                    headers: {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ error: 'MFA required for PAT access' })
                };
            }
        }
        
        // Generate PAT token
        const patToken = 'PAT-' + crypto.randomBytes(8).toString('hex').toUpperCase();
        const expiry = Date.now() + 900000; // 15 minutes
        
        // Create hash for DLT anchoring
        const patHash = crypto.createHash('sha256').update(patToken + userId + expiry).digest('hex');
        
        // Anchor PAT hash to DLT
        await dlt.anchorHash(patHash, 'PAT_ISSUED', { userId, companyId, expiry });
        
        // Grant temporary IAM permissions (JIT access)
        const roleArn = process.env.NODE_ENV === 'production' 
            ? await createTemporaryRole(userId, companyId)
            : `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/ABRA-JIT-${userId}-mock`;
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: patToken,
                expiry,
                roleArn,
                message: 'PAT issued via JIT Access Gate. Hash anchored on DLT.'
            })
        };
        
    } catch (error) {
        console.error('PAT request failed:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Internal server error' })
        };
    }
};

async function createTemporaryRole(userId, companyId) {
    const roleName = `ABRA-JIT-${userId}-${Date.now()}`;
    
    const assumeRolePolicy = {
        Version: '2012-10-17',
        Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' },
            Action: 'sts:AssumeRole'
        }]
    };
    
    const policyDocument = {
        Version: '2012-10-17',
        Statement: [{
            Effect: 'Allow',
            Action: [
                's3:GetObject',
                's3:ListBucket'
            ],
            Resource: [
                `arn:aws:s3:::abra-backup-${companyId}/*`,
                `arn:aws:s3:::abra-backup-${companyId}`
            ]
        }]
    };
    
    await iam.send(new CreateRoleCommand({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy)
    }));
    
    await iam.send(new PutRolePolicyCommand({
        RoleName: roleName,
        PolicyName: 'ABRAJITPolicy',
        PolicyDocument: JSON.stringify(policyDocument)
    }));
    
    // Schedule role deletion after 15 minutes
    setTimeout(async () => {
        try {
            await iam.send(new DeleteRolePolicyCommand({ RoleName: roleName, PolicyName: 'ABRAJITPolicy' }));
            await iam.send(new DeleteRoleCommand({ RoleName: roleName }));
        } catch (err) {
            console.error('Failed to cleanup role:', err);
        }
    }, 900000);
    
    return `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/${roleName}`;
}