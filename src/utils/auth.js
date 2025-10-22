// Utility functions for authentication
export const isTokenValid = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp > currentTime;
  } catch (error) {
    return false;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token || !isTokenValid(token)) {
    clearAuthData();
    return null;
  }
  return { 'Authorization': `Bearer ${token}` };
};