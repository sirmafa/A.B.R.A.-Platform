import React, { useState, useCallback } from 'react';
import { Fingerprint } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { mockApi } from '../services/mockApi';

export const RecoveryAnchorModule = ({ state, dispatch }) => {
  const [currentHash, setCurrentHash] = useState('0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF');
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