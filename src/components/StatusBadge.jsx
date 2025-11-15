import React from 'react';
import { ShieldAlert, CheckCircle, XCircle, Clock } from 'lucide-react';

export const StatusBadge = ({ status, text }) => {
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