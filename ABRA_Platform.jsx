import React, { useState, useEffect, useReducer, useCallback } from 'react';
import { ShieldAlert, Fingerprint, Lock, CheckCircle, Clock, XCircle, Zap } from 'lucide-react';

// --- Global State Management for Demo ---
const initialState = {
  isLoggedIn: false,
  userName: '',
  companyId: 'CHG-9240-SA', // Mock company ID based on report context (Change Healthcare / SA)
  dltAnchorStatus: 'Unanchored', // Status of the immutable backup anchor
  dltAnchorHash: null,
  patStatus: 'Inactive', // Privileged Access Token status
  patToken: null,
  patExpiry: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, isLoggedIn: true, userName: action.payload.name };
    case 'LOGOUT':
      return { ...initialState };
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

// --- Mock API Simulation ---
const mockApi = {
  // Mode 1: Breach Prevention - Request Token (Simulates Cognito + DLT Anchor)
  requestPat: (user, companyId) => new Promise((resolve) => {
    setTimeout(() => {
      const token = 'PAT-' + Math.random().toString(36).substring(2, 10).toUpperCase();
      const expiry = Date.now() + 900000; // 15 minutes
      resolve({ token, expiry, message: 'PAT issued via JIT Access Gate. Hash anchored on DLT.' });
    }, 1500);
  }),
  // Mode 2: Resilient Recovery - Anchor Proof
  anchorProof: (hash) => new Promise((resolve, reject) => {
    if (hash.length !== 64) {
      reject(new Error("Invalid hash format. Must be SHA-256."));
      return;
    }
    setTimeout(() => {
      resolve({ success: true, message: 'Backup Proof successfully anchored to DLT.', hash });
    }, 2000);
  }),
  // Mode 2: Resilient Recovery - Verify Proof
  verifyProof: (currentHash) => new Promise((resolve) => {
    setTimeout(() => {
      const DLT_ANCHOR = initialState.dltAnchorHash || 'CLEAN_BACKUP_HASH_987654321ABCDEF0123456789ABCDEF0123456789';
      const isMatch = currentHash === DLT_ANCHOR;
      const status = isMatch ? 'VERIFIED-CLEAN' : 'COMPROMISED';
      resolve({ isMatch, status, anchoredHash: DLT_ANCHOR });
    }, 2500);
  }),
};

// --- Custom Components ---

const StatusBadge = ({ status, text }) => {
  let color = '';
  let Icon = ShieldAlert;
  if (status === 'Active' || status === 'Verified' || status === 'VERIFIED-CLEAN') {
    color = 'bg-green-500 text-green-900';
    Icon = CheckCircle;
  } else if (status === 'Inactive' || status === 'Unanchored' || status === 'COMPROMISED') {
    color = 'bg-red-500 text-red-900';
    Icon = XCircle;
  } else if (status === 'Pending' || status === 'Requesting') {
    color = 'bg-yellow-500 text-yellow-900';
    Icon = Clock;
  }
  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-bold leading-none rounded-full ${color} shadow-md`}>
      <Icon className="w-3 h-3 mr-1" />
      {text || status}
    </span>
  );
};

const Header = ({ state, dispatch }) => (
  <header className="p-4 bg-gray-900 shadow-xl">
    <div className="flex justify-between items-center max-w-7xl mx-auto">
      <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-green-400">
        <ShieldAlert className="inline-block w-6 h-6 mr-2" />
        A.B.R.A. Cybersecurity Platform
      </h1>
      <div className="text-right">
        {state.isLoggedIn ? (
          <>
            <p className="text-sm text-gray-400">Welcome, {state.userName} ({state.companyId})</p>
            <button
              onClick={() => dispatch({ type: 'LOGOUT' })}
              className="mt-1 text-red-400 hover:text-red-300 transition"
            >
              (Log Out)
            </button>
          </>
        ) : (
          <button
            onClick={() => dispatch({ type: 'LOGIN', payload: { name: 'Dr. Specialist', email: 'dr.s@abra.com' } })}
            className="px-4 py-2 text-white bg-teal-600 rounded-lg hover:bg-teal-700 shadow-lg transition"
          >
            Sign In (Demo)
          </button>
        )}
      </div>
    </div>
  </header>
);

// --- Mode 1: Breach Prevention (PAG) Component ---
const AccessGateModule = ({ state, dispatch }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestPat = useCallback(async () => {
    if (!state.isLoggedIn || state.patStatus === 'Active' || isLoading) return;
    setIsLoading(true);

    try {
      const result = await mockApi.requestPat(state.userName, state.companyId);
      dispatch({ type: 'ISSUE_PAT', payload: { token: result.token, expiry: new Date(result.expiry).toLocaleTimeString() } });
    } catch (error) {
      console.error(error);
      alert('Failed to request token.');
    } finally {
      setIsLoading(false);
      // Automatically revoke the token after 15 minutes for security demo
      setTimeout(() => {
        dispatch({ type: 'REVOKE_PAT' });
      }, 900000);
    }
  }, [state.isLoggedIn, state.patStatus, isLoading, state.userName, state.companyId, dispatch]);

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 className="text-xl font-semibold text-teal-400 flex items-center mb-4 border-b border-teal-500/30 pb-2">
        <Zap className="w-5 h-5 mr-2" /> Mode 1: Breach Prevention (JIT Access Gate)
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Addresses Governance Failure (MFA Gap) - enforces Just-In-Time access for privileged operations.
      </p>

      <div className="flex items-center justify-between p-4 mb-4 bg-gray-700 rounded-lg">
        <p className="text-gray-200 font-medium">Privileged Access Status:</p>
        <StatusBadge status={state.patStatus} text={`Token ${state.patStatus}`} />
      </div>

      {state.patStatus === 'Active' ? (
        <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg text-yellow-100">
          <p className="font-bold">Active Token: {state.patToken}</p>
          <p className="text-sm">Expires at: {state.patExpiry}</p>
          <p className="text-xs mt-2">Access to critical systems granted. This token's anchor proof is immutably logged.</p>
        </div>
      ) : (
        <button
          onClick={handleRequestPat}
          disabled={!state.isLoggedIn || isLoading}
          className={`w-full py-3 mt-4 text-white font-bold rounded-lg transition ${
            state.isLoggedIn && !isLoading
              ? 'bg-red-600 hover:bg-red-700 shadow-xl'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Requesting PAT via MFA...' : 'Request Privileged Access Token (PAT)'}
        </button>
      )}
    </div>
  );
};

// --- Mode 2: Resilient Recovery (Anchor) Component ---
const RecoveryAnchorModule = ({ state, dispatch }) => {
  const [currentHash, setCurrentHash] = useState('0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF'); // Mock initial clean hash
  const [verificationHash, setVerificationHash] = useState('');
  const [hashResult, setHashResult] = useState(null);
  const [isAnchoring, setIsAnchoring] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleAnchorProof = useCallback(async () => {
    if (!state.isLoggedIn || isAnchoring) return;
    setIsAnchoring(true);
    setHashResult(null);

    try {
      const result = await mockApi.anchorProof(currentHash);
      if (result.success) {
        dispatch({ type: 'SET_ANCHOR_STATUS', payload: { status: 'Verified', hash: result.hash } });
        setHashResult({ status: 'Success', message: 'Immutable anchor recorded on DLT.' });
      }
    } catch (error) {
      setHashResult({ status: 'Error', message: error.message });
    } finally {
      setIsAnchoring(false);
    }
  }, [state.isLoggedIn, currentHash, isAnchoring, dispatch]);

  const handleVerifyProof = useCallback(async () => {
    if (!state.isLoggedIn || isVerifying) return;
    setIsVerifying(true);
    setHashResult(null);

    // Mock hash compromise for demo: if verification field is empty, simulate data corruption
    const hashToVerify = verificationHash || (state.dltAnchorHash ? state.dltAnchorHash.slice(0, -1) + 'X' : currentHash);

    try {
      const result = await mockApi.verifyProof(hashToVerify);
      setHashResult({ 
        status: result.status, 
        message: result.isMatch 
          ? `MATCH! Backup is pristine. RTO: < 5 min.`
          : `COMPROMISED! Data altered. Anchored hash: ${result.anchoredHash}`,
        isMatch: result.isMatch
      });
    } catch (error) {
      setHashResult({ status: 'Error', message: error.message });
    } finally {
      setIsVerifying(false);
    }
  }, [state.isLoggedIn, verificationHash, state.dltAnchorHash, currentHash, isVerifying]);

  return (
    <div className="p-6 bg-gray-800 rounded-xl shadow-2xl">
      <h2 className="text-xl font-semibold text-teal-400 flex items-center mb-4 border-b border-teal-500/30 pb-2">
        <Fingerprint className="w-5 h-5 mr-2" /> Mode 2: Resilient Recovery (Integrity Anchor)
      </h2>
      <p className="text-sm text-gray-400 mb-4">
        Addresses BCP Failure/Backup Deletion - guarantees clean recovery post-attack.
      </p>

      <div className="mb-4">
        <p className="text-gray-200 font-medium mb-2">Current Backup Proof (SHA-256):</p>
        <div className="p-3 break-all bg-gray-700 text-sm rounded font-mono text-gray-300">{currentHash}</div>
        <p className="text-xs mt-1 text-gray-500">This is the hash of the latest backup volume.</p>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleAnchorProof}
          disabled={!state.isLoggedIn || isAnchoring}
          className={`flex-1 py-3 text-white font-bold rounded-lg transition ${
            state.isLoggedIn && !isAnchoring
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {isAnchoring ? 'Anchoring...' : '1. Anchor Proof on DLT'}
        </button>

        <button
          onClick={handleVerifyProof}
          disabled={!state.isLoggedIn || isVerifying || state.dltAnchorStatus === 'Unanchored'}
          className={`flex-1 py-3 text-white font-bold rounded-lg transition ${
            state.dltAnchorStatus === 'Verified' && !isVerifying
              ? 'bg-purple-600 hover:bg-purple-700 shadow-lg'
              : 'bg-gray-600 cursor-not-allowed'
          }`}
        >
          {isVerifying ? 'Verifying...' : '2. Verify Integrity Anchor'}
        </button>
      </div>

      <div className="p-4 mt-4 bg-gray-700 rounded-lg">
        <p className="text-gray-200 font-medium mb-2">DLT Anchor Status:</p>
        <StatusBadge status={state.dltAnchorStatus} />
        {state.dltAnchorHash && <p className="text-xs text-gray-400 mt-1 break-all">Anchored Hash: {state.dltAnchorHash}</p>}
      </div>

      {hashResult && (
        <div className={`p-4 mt-4 rounded-lg shadow-inner ${
          hashResult.status === 'VERIFIED-CLEAN' ? 'bg-green-900/50 border-green-700' : 'bg-red-900/50 border-red-700'
        } border`}>
          <p className="font-bold text-lg text-white">{hashResult.status === 'VERIFIED-CLEAN' ? 'VERIFIED-CLEAN' : 'COMPROMISE ALERT'}</p>
          <p className="text-sm text-white/80">{hashResult.message}</p>
          {hashResult.status === 'COMPROMISED' && (
            <p className="text-xs mt-2 text-white/60">
              Ransomware tactic detected. Restoration MUST proceed from an earlier, verified anchor point.
            </p>
          )}
        </div>
      )}
    </div>
  );
};


const App = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Auto-login for demo simplicity
  useEffect(() => {
    if (!state.isLoggedIn) {
      dispatch({ type: 'LOGIN', payload: { name: 'Dr. Specialist', email: 'dr.s@abra.com' } });
    }
  }, [state.isLoggedIn]);

  if (!state.isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        Loading Platform...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 font-sans text-white">

      <Header state={state} dispatch={dispatch} />
      
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-8">
          
          {/* Left Column: Breach Prevention */}
          <div className="w-full md:w-1/2">
            <AccessGateModule state={state} dispatch={dispatch} />
          </div>

          {/* Right Column: Resilient Recovery */}
          <div className="w-full md:w-1/2">
            <RecoveryAnchorModule state={state} dispatch={dispatch} />
          </div>
        </div>

        {/* Footer/Report Insights */}
        <section className="mt-12 p-6 bg-gray-900 rounded-xl shadow-inner border border-teal-500/20">
          <h2 className="text-lg font-bold text-teal-300 flex items-center">
            <ShieldAlert className="w-4 h-4 mr-2" /> Report Context: Strategic Risk Mitigation
          </h2>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            
            <div className="p-3 border-l-4 border-red-600 bg-red-900/20 rounded-md">
              <p className="font-bold text-red-400">Mitigating Governance Failure</p>
              <p className="text-gray-400 mt-1">Change Healthcare IAV: PAG Mode enforces mandatory MFA and JIT access, eliminating the Tier 4 Willful Neglect vulnerability.</p>
            </div>
            
            <div className="p-3 border-l-4 border-blue-600 bg-blue-900/20 rounded-md">
              <p className="font-bold text-blue-400">Guaranteed Operational Resilience</p>
              <p className="text-gray-400 mt-1">NHLS BCP Failure: Anchor Mode uses DLT proof to guarantee a clean, uncompromised restore point, achieving rapid RTO.</p>
            </div>
            
            <div className="p-3 border-l-4 border-purple-600 bg-purple-900/20 rounded-md">
              <p className="font-bold text-purple-400">Financial & Legal Shield</p>
              <p className="text-gray-400 mt-1">Cencora Precedent: Immutable audit and recovery guarantee removes the incentive to pay ransom and mitigates compounding class action costs.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;