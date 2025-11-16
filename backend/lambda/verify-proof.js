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
        const { currentHash } = JSON.parse(event.body);
        
        // Validate hash format
        if (!currentHash || currentHash.length !== 64 || !/^[a-fA-F0-9]{64}$/.test(currentHash)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid hash format' })
            };
        }
        
        // Retrieve anchored hash from DLT
        const anchoredProof = await dlt.getLatestAnchor('BACKUP_PROOF');
        
        if (!anchoredProof) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'No anchored proof found' })
            };
        }
        
        const isMatch = currentHash === anchoredProof.hash;
        const status = isMatch ? 'VERIFIED-CLEAN' : 'COMPROMISED';
        
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                isMatch,
                status,
                anchoredHash: anchoredProof.hash,
                anchorTimestamp: anchoredProof.timestamp,
                blockHeight: anchoredProof.blockHeight
            })
        };
        
    } catch (error) {
        console.error('Verify proof failed:', error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ error: 'Verification failed' })
        };
    }
};