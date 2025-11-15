import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAppState } from './src/hooks/useAppState';
import { Header } from './src/components/Header';
import { AccessGateModule } from './src/components/AccessGateModule';
import { RecoveryAnchorModule } from './src/components/RecoveryAnchorModule';

const App = () => {
  const [state, dispatch] = useAppState();

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
          
          <div className="w-full md:w-1/2">
            <AccessGateModule state={state} dispatch={dispatch} />
          </div>

          <div className="w-full md:w-1/2">
            <RecoveryAnchorModule state={state} dispatch={dispatch} />
          </div>
        </div>

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