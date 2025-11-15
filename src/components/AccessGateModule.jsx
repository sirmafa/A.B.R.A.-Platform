import React, { useState, useCallback } from 'react';
import { Zap } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { mockApi } from '../services/mockApi';

export const AccessGateModule = ({ state, dispatch }) => {
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
          <p className="text-xs mt-2">Access to critical systems granted. This token&apos;s anchor proof is immutably logged.</p>
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