import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Header = ({ state, dispatch }) => (
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