import { apiClient } from './api-client';

export const AUTH_TOKEN_KEY = 'accessToken';
export const USER_KEY = 'user';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const setStoredAuth = (token: string, user: any) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    apiClient.setAccessToken(token);
  }
};

export const clearStoredAuth = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    apiClient.setAccessToken('');
  }
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!getStoredToken();
};

export const login = async (email: string, password: string, rememberMe: boolean = false) => {
  const response = await apiClient.login(email, password, rememberMe);
  if (response.success && response.tokens.access_token && response.data) {
    setStoredAuth(response.tokens.access_token, response.data);
    return response.data;
  }
  throw new Error('Login failed');
};

export const register = async (
  email: string,
  password: string,
  firstName: string,
  lastName: string
) => {
  const response = await apiClient.register(email, password, firstName, lastName);
  if (response.success && response.tokens.access_token && response.data) {
    setStoredAuth(response.tokens.access_token, response.data);
    return response.data;
  }
  throw new Error('Registration failed');
};

export const logout = async () => {
  try {
    await apiClient.logout();
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearStoredAuth();
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await apiClient.getCurrentUser();
    if (response.success && response.data) {
      const user = response.data;
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    }
  } catch (error) {
    console.error('Get user error:', error);
    clearStoredAuth();
  }
  return null;
};
