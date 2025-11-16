const crypto = require('crypto');
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
        const { hash } = JSON.parse(event.body);
        
        // Validate SHA-256 format
        if (!hash || hash.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(hash)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid hash format. Must be SHA-256.' })
            };
        }
        
        // Anchor hash to DLT with immutable timestamp
        const anchorResult = await dlt.anchorHash(hash, 'BACKUP_PROOF', {
            timestamp: Date.now(),
            blockHeight: await dlt.getCurrentBlockHeight()
        });
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                success: true,
                message: 'Backup Proof successfully anchored to DLT.',
                hash,
                anchorId: anchorResult.anchorId,
                blockHeight: anchorResult.blockHeight
            })
        };
        
    } catch (error) {
        console.error('Anchor proof failed:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Failed to anchor proof' })
        };
    }
};