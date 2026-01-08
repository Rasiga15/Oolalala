import { BASE_URL } from '../config/api';

const getAuthToken = (): string | null => {
  const tokenSources = [
    localStorage.getItem('authToken'),
    localStorage.getItem('token'),
    sessionStorage.getItem('authToken'),
    sessionStorage.getItem('token')
  ];
  
  for (const token of tokenSources) {
    if (token && token !== 'undefined' && token !== 'null') {
      if (token === localStorage.getItem('token') || token === sessionStorage.getItem('token')) {
        localStorage.setItem('authToken', token);
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
      return token;
    }
  }
  
  return null;
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return false;
  }
};

const clearAuthTokens = (): void => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('token');
  localStorage.removeItem('userData');
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userData');
};

// Complete Ride API
export const completeRide = async (rideId: number): Promise<{ message: string; rideId: number }> => {
  try {
    const url = `${BASE_URL}/api/rides/offer/${rideId}/complete`;
    
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }
    
    if (isTokenExpired(token)) {
      clearAuthTokens();
      throw new Error('Your session has expired. Please login again.');
    }
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
    
    console.log(`POST ${url}`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers,
    });
    
    console.log(`API Response:`, response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Details:', errorText);
      
      if (response.status === 401) {
        clearAuthTokens();
        throw new Error('Your session has expired. Please login again.');
      }
      
      if (response.status === 403) {
        throw new Error('You do not have permission to complete this trip.');
      }
      
      let errorMessage = `Failed to complete trip (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    console.log('Complete ride success:', data);
    return data;
  } catch (error: any) {
    console.error('Error completing ride:', error);
    throw error;
  }
};