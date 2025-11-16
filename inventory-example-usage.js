// Example: How to use A.B.R.A. with your Inventory Management System
const express = require('express');
const InventoryABRAIntegration = require('./inventory-abra-integration');

const app = express();
const abra = new InventoryABRAIntegration();

app.use(express.json());

// Apply A.B.R.A. protection to all inventory routes
app.use('/api/inventory', abra.abraProtectionMiddleware());

// Protected inventory endpoints
app.get('/api/inventory', async (req, res) => {
    try {
        const [rows] = await req.secureDB.execute('SELECT * FROM inventory_items');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/inventory', async (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        
        // Execute database operation
        const [result] = await req.secureDB.execute(
            'INSERT INTO inventory_items (name, quantity, price) VALUES (?, ?, ?)',
            [name, quantity, price]
        );
        
        // Record critical transaction in A.B.R.A. DLT
        await req.recordTransaction({
            type: 'ITEM_ADDED',
            itemId: result.insertId,
            itemName: name,
            quantity,
            price
        });
        
        res.json({ success: true, itemId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/inventory/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;
        
        // Get current item for audit trail
        const [current] = await req.secureDB.execute('SELECT * FROM inventory_items WHERE id = ?', [id]);
        
        // Update inventory
        await req.secureDB.execute(
            'UPDATE inventory_items SET quantity = ? WHERE id = ?',
            [quantity, id]
        );
        
        // Record critical transaction
        await req.recordTransaction({
            type: 'STOCK_UPDATE',
            itemId: id,
            oldQuantity: current[0]?.quantity,
            newQuantity: quantity
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Backup management endpoints
app.post('/api/backup/create', async (req, res) => {
    try {
        const backup = await abra.createSecureInventoryBackup();
        res.json(backup);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/backup/verify', async (req, res) => {
    try {
        const { backupKey } = req.body;
        const verification = await abra.verifyInventoryBackup(backupKey);
        res.json(verification);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Inventory Management System with A.B.R.A. protection running on port ${PORT}`);
});

// Schedule daily backups
setInterval(async () => {
    try {
        console.log('Creating scheduled backup...');
        const backup = await abra.createSecureInventoryBackup();
        console.log('Backup created:', backup.backupKey);
    } catch (error) {
        console.error('Scheduled backup failed:', error);
    }
}, 24 * 60 * 60 * 1000); // Daily