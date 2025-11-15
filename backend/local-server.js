const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Mock Lambda handlers for local development
const requestPat = require('./lambda/request-pat');
const anchorProof = require('./lambda/anchor-proof');
const verifyProof = require('./lambda/verify-proof');

// Mock AWS services for local development
process.env.AWS_SDK_LOAD_CONFIG = '1';

app.post('/request-pat', async (req, res) => {
    const event = { body: JSON.stringify(req.body) };
    const result = await requestPat.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/anchor-proof', async (req, res) => {
    const event = { body: JSON.stringify(req.body) };
    const result = await anchorProof.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
});

app.post('/verify-proof', async (req, res) => {
    const event = { body: JSON.stringify(req.body) };
    const result = await verifyProof.handler(event);
    res.status(result.statusCode).json(JSON.parse(result.body));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`A.B.R.A. Backend running on port ${PORT}`);
});