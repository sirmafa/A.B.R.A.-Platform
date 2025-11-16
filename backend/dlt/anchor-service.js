const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(client);

class DLTAnchorService {
    constructor() {
        this.tableName = process.env.DLT_TABLE_NAME || 'ABRA-DLT-Ledger';
    }
    
    async anchorHash(hash, type, metadata = {}) {
        const anchorId = crypto.randomUUID();
        const timestamp = Date.now();
        const blockHeight = await this.getCurrentBlockHeight() + 1;
        
        // Create immutable ledger entry
        const ledgerEntry = {
            anchorId,
            hash,
            type,
            timestamp,
            blockHeight,
            metadata,
            previousHash: await this.getPreviousHash(),
            signature: this.createSignature(hash, timestamp, blockHeight)
        };
        
        await dynamodb.send(new PutCommand({
            TableName: this.tableName,
            Item: ledgerEntry,
            ConditionExpression: 'attribute_not_exists(anchorId)'
        }));
        
        return { anchorId, blockHeight };
    }
    
    async getLatestAnchor(type) {
        const result = await dynamodb.send(new QueryCommand({
            TableName: this.tableName,
            IndexName: 'TypeTimestampIndex',
            KeyConditionExpression: '#type = :type',
            ExpressionAttributeNames: { '#type': 'type' },
            ExpressionAttributeValues: { ':type': type },
            ScanIndexForward: false,
            Limit: 1
        }));
        
        return result.Items[0] || null;
    }
    
    async getCurrentBlockHeight() {
        const result = await dynamodb.send(new ScanCommand({
            TableName: this.tableName,
            Select: 'COUNT'
        }));
        
        return result.Count;
    }
    
    async getPreviousHash() {
        const result = await dynamodb.send(new ScanCommand({
            TableName: this.tableName,
            ProjectionExpression: 'signature',
            Limit: 1
        }));
        
        return result.Items[0]?.signature || '0000000000000000000000000000000000000000000000000000000000000000';
    }
    
    createSignature(hash, timestamp, blockHeight) {
        const data = `${hash}${timestamp}${blockHeight}${process.env.DLT_SECRET_KEY}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = new DLTAnchorService();