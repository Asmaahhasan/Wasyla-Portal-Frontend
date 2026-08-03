const BASE_URL = import.meta.env.VITE_API_URL || 'https://api.wsyelhi.com/portal-api';
const API_KEY = import.meta.env.VITE_API_KEY || 'wsylh_live_9f82a7b4c6e13095d82f7e41a0b3c69d8e7f1234a5b6c7d8e9f0123456789abc';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

export const fetchApi = async <T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> => {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...options?.headers
      },
      ...options
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    if (json && typeof json === 'object' && 'success' in json) {
      return json as ApiResponse<T>;
    }
    return { success: true, data: json as T, message: null };
  } catch (error: any) {
    console.error(`API Fetch Error [${endpoint}]:`, error);
    return {
      success: false,
      data: [] as unknown as T,
      message: error.message || 'Network error'
    };
  }
};
