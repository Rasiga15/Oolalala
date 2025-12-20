// settingsApi.ts
const BASE_URL = 'http://18.61.216.57:4500/api';

export interface Settings {
  fare_per_km_car: string;
  fare_per_km_van: string;
  fare_per_km_bus: string;
  fare_per_km_auto: string;
  fare_per_km_bike: string;
  cancellation_free_window_hours: string;
  cancellation_fee_percentage: string;
  platform_commission_percent: string;
  referral_bonus_rider: string;
  referral_bonus_partner: string;
}

// Get auth token from localStorage
const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

export const fetchSettings = async (): Promise<Settings> => {
  try {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/settings`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // If unauthorized, try without token
        const retryResponse = await fetch(`${BASE_URL}/settings`, {
          method: 'GET',
          headers: { 'accept': 'application/json' },
        });
        
        if (retryResponse.ok) {
          return await retryResponse.json();
        }
      }
      
      // Return default settings if API fails
      return {
        fare_per_km_car: '12',
        fare_per_km_van: '15',
        fare_per_km_bus: '20',
        fare_per_km_auto: '8',
        fare_per_km_bike: '5',
        cancellation_free_window_hours: '24',
        cancellation_fee_percentage: '10',
        platform_commission_percent: '15',
        referral_bonus_rider: '100',
        referral_bonus_partner: '200'
      };
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching settings:', error);
    // Return default settings
    return {
      fare_per_km_car: '12',
      fare_per_km_van: '15',
      fare_per_km_bus: '20',
      fare_per_km_auto: '8',
      fare_per_km_bike: '5',
      cancellation_free_window_hours: '24',
      cancellation_fee_percentage: '10',
      platform_commission_percent: '15',
      referral_bonus_rider: '100',
      referral_bonus_partner: '200'
    };
  }
};

export const fetchPreferences = async (): Promise<string[]> => {
  try {
    const token = getAuthToken();
    const headers: HeadersInit = {
      'accept': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}/master/preferences`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // If unauthorized, return default preferences
        return ['Ladies only', 'Kids Only', 'Senior Citizens', 'Students only', 'Professionals only'];
      }
      throw new Error(`Failed to fetch preferences: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : ['Ladies only', 'Kids Only', 'Senior Citizens'];
  } catch (error) {
    console.error('Error fetching preferences:', error);
    // Return default preferences
    return ['Ladies only', 'Kids Only', 'Senior Citizens', 'Students only', 'Professionals only'];
  }
};