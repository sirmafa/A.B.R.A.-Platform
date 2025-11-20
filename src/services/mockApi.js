const API_BASE_URL = 'https://72a2dojacb.execute-api.us-east-1.amazonaws.com/prod';

export const mockApi = {
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
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }
    return response.json();
  },

  verifyProof: async (currentHash) => {
    const response = await fetch(`${API_BASE_URL}/verify-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentHash })
    });
    return response.json();
  },
};