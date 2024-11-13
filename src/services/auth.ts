import { API_URL } from '../config';

interface LoginCredentials {
  username: string;
  password: string;
  role: 'admin' | 'farmer';
}

export async function login(credentials: LoginCredentials) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({
        error: 'An unexpected error occurred'
      }));
      throw new Error(errorData.error || 'Failed to login');
    }

    const data = await response.json();
    if (!data.token) {
      throw new Error('Invalid response from server');
    }

    // Store the token
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));

    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  try {
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
} 