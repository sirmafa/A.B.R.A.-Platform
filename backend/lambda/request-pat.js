const AWS = require('aws-sdk');
const crypto = require('crypto');

const cognito = new AWS.CognitoIdentityServiceProvider();
const iam = new AWS.IAM();
const dlt = process.env.NODE_ENV === 'production' 
    ? require('../dlt/anchor-service') 
    : require('../dlt/mock-anchor-service');

exports.handler = async (event) => {
    try {
        const { userId, companyId } = JSON.parse(event.body);
        
        // Mock MFA validation for local development
        if (process.env.NODE_ENV !== 'production') {
            console.log('Mock MFA validation passed for user:', userId);
        } else {
            const userAttributes = await cognito.adminGetUser({
                UserPoolId: process.env.COGNITO_USER_POOL_ID,
                Username: userId
            }).promise();
            
            if (!userAttributes.UserMFASettingList || userAttributes.UserMFASettingList.length === 0) {
                return {
                    statusCode: 403,
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
    
    await iam.createRole({
        RoleName: roleName,
        AssumeRolePolicyDocument: JSON.stringify(assumeRolePolicy)
    }).promise();
    
    await iam.putRolePolicy({
        RoleName: roleName,
        PolicyName: 'ABRAJITPolicy',
        PolicyDocument: JSON.stringify(policyDocument)
    }).promise();
    
    // Schedule role deletion after 15 minutes
    setTimeout(async () => {
        try {
            await iam.deleteRolePolicy({ RoleName: roleName, PolicyName: 'ABRAJITPolicy' }).promise();
            await iam.deleteRole({ RoleName: roleName }).promise();
        } catch (err) {
            console.error('Failed to cleanup role:', err);
        }
    }, 900000);
    
    return `arn:aws:iam::${process.env.AWS_ACCOUNT_ID}:role/${roleName}`;
}