import { useReducer, useEffect } from 'react';

const initialState = {
  isLoggedIn: false,
  userName: '',
  companyId: 'CHG-9240-SA',
  dltAnchorStatus: 'Unanchored',
  dltAnchorHash: null,
  patStatus: 'Inactive',
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

export const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    if (!state.isLoggedIn) {
      dispatch({ type: 'LOGIN', payload: { name: 'Dr. Specialist', email: 'dr.s@abra.com' } });
    }
  }, [state.isLoggedIn]);

  return [state, dispatch];
};