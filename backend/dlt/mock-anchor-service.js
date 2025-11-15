const crypto = require('crypto');

class MockDLTAnchorService {
    constructor() {
        this.ledger = new Map();
        this.blockHeight = 0;
    }
    
    async anchorHash(hash, type, metadata = {}) {
        const anchorId = crypto.randomUUID();
        const timestamp = Date.now();
        this.blockHeight++;
        
        const ledgerEntry = {
            anchorId,
            hash,
            type,
            timestamp,
            blockHeight: this.blockHeight,
            metadata,
            previousHash: this.getPreviousHash(),
            signature: this.createSignature(hash, timestamp, this.blockHeight)
        };
        
        this.ledger.set(anchorId, ledgerEntry);
        
        return { anchorId, blockHeight: this.blockHeight };
    }
    
    async getLatestAnchor(type) {
        const entries = Array.from(this.ledger.values())
            .filter(entry => entry.type === type)
            .sort((a, b) => b.timestamp - a.timestamp);
        
        return entries[0] || null;
    }
    
    async getCurrentBlockHeight() {
        return this.blockHeight;
    }
    
    getPreviousHash() {
        const entries = Array.from(this.ledger.values());
        return entries.length > 0 
            ? entries[entries.length - 1].signature 
            : '0000000000000000000000000000000000000000000000000000000000000000';
    }
    
    createSignature(hash, timestamp, blockHeight) {
        const data = `${hash}${timestamp}${blockHeight}${process.env.DLT_SECRET_KEY}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
}

module.exports = new MockDLTAnchorService();