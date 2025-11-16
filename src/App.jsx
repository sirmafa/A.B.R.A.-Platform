import React, { useState, useReducer, useCallback } from 'react';

// A.B.R.A. Configuration for Amplify deployment
const API_BASE_URL = import.meta.env.VITE_ABRA_API_URL || 'https://your-api-gateway-url.amazonaws.com/prod';

const api = {
    requestPat: async (user, companyId) => {
        const response = await fetch(`${API_BASE_URL}/request-pat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user, companyId })
        });
        return response.json();
    },
    anchorProof: async (hash) => {
        const response = await fetch(`${API_BASE_URL}/anchor-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ hash })
        });
        return response.json();
    },
    verifyProof: async (currentHash) => {
        const response = await fetch(`${API_BASE_URL}/verify-proof`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentHash })
        });
        return response.json();
    }
};

const initialState = {
    isLoggedIn: true,
    userName: 'Dr. Specialist',
    companyId: 'CHG-9240-SA',
    dltAnchorStatus: 'Unanchored',
    dltAnchorHash: null,
    patStatus: 'Inactive',
    patToken: null,
    patExpiry: null,
};

function appReducer(state, action) {
    switch (action.type) {
        case 'SET_ANCHOR_STATUS':
            return { ...state, dltAnchorStatus: action.payload.status, dltAnchorHash: action.payload.hash || null };
        case 'ISSUE_PAT':
            return { ...state, patStatus: 'Active', patToken: action.payload.token, patExpiry: action.payload.expiry };
        case 'REVOKE_PAT':
            return { ...state, patStatus: 'Inactive', patToken: null, patExpiry: null };
        default:
            return state;
    }
}

const App = () => {
    const [state, dispatch] = useReducer(appReducer, initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [currentHash] = useState('0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF');
    const [hashResult, setHashResult] = useState(null);
    const [isAnchoring, setIsAnchoring] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    const handleRequestPat = useCallback(async () => {
        if (state.patStatus === 'Active' || isLoading) return;
        setIsLoading(true);
        try {
            const result = await api.requestPat(state.userName, state.companyId);
            dispatch({ type: 'ISSUE_PAT', payload: { token: result.token, expiry: new Date(result.expiry).toLocaleTimeString() } });
        } catch (error) {
            alert('Failed to request token: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    }, [state.patStatus, isLoading, state.userName, state.companyId]);

    const handleAnchorProof = useCallback(async () => {
        if (isAnchoring) return;
        setIsAnchoring(true);
        setHashResult(null);
        try {
            const result = await api.anchorProof(currentHash);
            if (result.success) {
                dispatch({ type: 'SET_ANCHOR_STATUS', payload: { status: 'Verified', hash: result.hash } });
                setHashResult({ status: 'Success', message: 'Immutable anchor recorded on DLT.' });
            }
        } catch (error) {
            setHashResult({ status: 'Error', message: error.message });
        } finally {
            setIsAnchoring(false);
        }
    }, [currentHash, isAnchoring]);

    const handleVerifyProof = useCallback(async () => {
        if (isVerifying) return;
        setIsVerifying(true);
        setHashResult(null);
        try {
            const result = await api.verifyProof(currentHash);
            setHashResult({ 
                status: result.status, 
                message: result.isMatch ? 'MATCH! Backup is pristine.' : 'COMPROMISED! Data altered.',
                isMatch: result.isMatch
            });
        } catch (error) {
            setHashResult({ status: 'Error', message: error.message });
        } finally {
            setIsVerifying(false);
        }
    }, [currentHash, isVerifying]);

    return (
        <div className="min-h-screen bg-gray-950 font-sans text-white">
            <header className="p-4 bg-gray-900 shadow-xl">
                <div className="flex justify-between items-center max-w-7xl mx-auto">
                    <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
                        🛡️ A.B.R.A. Platform - AWS Amplify
                    </h1>
                    <div className="text-right">
                        <p className="text-sm text-gray-400">Welcome, {state.userName} ({state.companyId})</p>
                        <p className="text-xs text-green-400">Deployed on AWS Amplify</p>
                    </div>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto p-4 md:p-8">
                <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
                    
                    <div className="w-full md:w-1/2">
                        <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
                            <h2 className="text-xl font-semibold text-teal-400 flex items-center mb-4 border-b border-teal-500/30 pb-2">
                                ⚡ Mode 1: Breach Prevention (JIT Access Gate)
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                AWS Lambda integration - creates temporary roles with DLT anchoring
                            </p>

                            <div className="flex items-center justify-between p-4 mb-4 bg-gray-700 rounded-lg">
                                <p className="text-gray-200 font-medium">Privileged Access Status:</p>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold leading-none rounded-full ${
                                    state.patStatus === 'Active' ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'
                                } shadow-md`}>
                                    Token {state.patStatus}
                                </span>
                            </div>

                            {state.patStatus === 'Active' ? (
                                <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-100">
                                    <p className="font-bold">Active Token: {state.patToken}</p>
                                    <p className="text-sm">Expires at: {state.patExpiry}</p>
                                    <p className="text-xs mt-2">IAM role created with DLT proof</p>
                                </div>
                            ) : (
                                <button
                                    onClick={handleRequestPat}
                                    disabled={isLoading}
                                    className={`w-full py-3 mt-4 text-white font-bold rounded-lg transition ${
                                        !isLoading ? 'bg-red-600 hover:bg-red-700 shadow-xl' : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {isLoading ? 'Creating IAM Role & DLT Anchor...' : 'Request Privileged Access Token (PAT)'}
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="w-full md:w-1/2">
                        <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
                            <h2 className="text-xl font-semibold text-teal-400 flex items-center mb-4 border-b border-teal-500/30 pb-2">
                                🔍 Mode 2: Resilient Recovery (DynamoDB DLT)
                            </h2>
                            <p className="text-sm text-gray-400 mb-4">
                                AWS DynamoDB integration - immutable ledger with cryptographic proofs
                            </p>

                            <div className="mb-4">
                                <p className="text-gray-200 font-medium mb-2">Current Backup Proof (SHA-256):</p>
                                <div className="p-3 break-all bg-gray-700 text-sm rounded font-mono text-gray-300">{currentHash}</div>
                            </div>

                            <div className="flex space-x-4 mb-4">
                                <button
                                    onClick={handleAnchorProof}
                                    disabled={isAnchoring}
                                    className={`flex-1 py-3 text-white font-bold rounded-lg transition ${
                                        !isAnchoring ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {isAnchoring ? 'Writing to DynamoDB...' : '1. Anchor to DLT'}
                                </button>

                                <button
                                    onClick={handleVerifyProof}
                                    disabled={isVerifying || state.dltAnchorStatus === 'Unanchored'}
                                    className={`flex-1 py-3 text-white font-bold rounded-lg transition ${
                                        state.dltAnchorStatus === 'Verified' && !isVerifying
                                            ? 'bg-purple-600 hover:bg-purple-700 shadow-lg'
                                            : 'bg-gray-600 cursor-not-allowed'
                                    }`}
                                >
                                    {isVerifying ? 'Querying DynamoDB...' : '2. Verify Integrity'}
                                </button>
                            </div>

                            <div className="p-4 mt-4 bg-gray-700 rounded-lg">
                                <p className="text-gray-200 font-medium mb-2">DLT Anchor Status:</p>
                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold leading-none rounded-full ${
                                    state.dltAnchorStatus === 'Verified' ? 'bg-green-500 text-green-900' : 'bg-red-500 text-red-900'
                                } shadow-md`}>
                                    {state.dltAnchorStatus}
                                </span>
                                {state.dltAnchorHash && <p className="text-xs text-gray-400 mt-1 break-all">Hash: {state.dltAnchorHash}</p>}
                            </div>

                            {hashResult && (
                                <div className={`p-4 mt-4 rounded-lg shadow-inner ${
                                    hashResult.status === 'VERIFIED-CLEAN' ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'
                                } border`}>
                                    <p className="font-bold text-lg text-white">{hashResult.status}</p>
                                    <p className="text-sm text-white/80">{hashResult.message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <section className="mt-8 p-4 bg-gray-900 rounded-xl border border-yellow-500/20">
                    <h3 className="text-lg font-bold text-yellow-300 mb-2">🚀 AWS Amplify Deployment</h3>
                    <p className="text-sm text-gray-400">
                        A.B.R.A. Platform deployed on AWS Amplify with Lambda backend integration.
                        Configure VITE_ABRA_API_URL environment variable to point to your API Gateway.
                    </p>
                </section>
            </main>
        </div>
    );
};

export default App;