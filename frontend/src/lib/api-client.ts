import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AuthResponse,
  SearchResponse,
  PropertyDetail,
  SavedPropertiesResponse,
  ApiResponse,
} from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized
          this.accessToken = null;
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on init
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) {
        this.accessToken = token;
      }
    }
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  getAccessToken() {
    return this.accessToken;
  }

  // Auth endpoints
  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await this.client.post<AuthResponse>('/auth/register', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  }

  async login(email: string, password: string, rememberMe: boolean = false) {
    const response = await this.client.post<AuthResponse>('/auth/login', {
      email,
      password,
      remember_me: rememberMe,
    });
    return response.data;
  }

  async refresh() {
    const response = await this.client.post<{ success: boolean; data: { access_token: string; expires_in: number } }>('/auth/refresh');
    return response.data;
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getCurrentUser() {
    const response = await this.client.get<ApiResponse<any>>('/auth/me');
    return response.data;
  }

  // Properties endpoints
  async searchProperties(latitude: number, longitude: number, radiusKm: number = 5, page: number = 1) {
    const response = await this.client.post<SearchResponse>('/properties/search', {
      latitude,
      longitude,
      radius_km: radiusKm,
      page,
      limit: 20,
    });
    return response.data;
  }

  async getPropertyDetail(propertyId: string) {
    const response = await this.client.get<ApiResponse<PropertyDetail>>(`/properties/${propertyId}`);
    return response.data;
  }

  async saveProperty(propertyId: string, notes?: string) {
    const response = await this.client.post(`/properties/${propertyId}/save`, {
      property_id: propertyId,
      notes,
    });
    return response.data;
  }

  async getSavedProperties(page: number = 1) {
    const response = await this.client.get<SavedPropertiesResponse>('/properties/user/saved', {
      params: { page, limit: 20 },
    });
    return response.data;
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get<ApiResponse<any>>('/users/profile');
    return response.data;
  }

  async updateProfile(firstName?: string, lastName?: string, phoneNumber?: string) {
    const response = await this.client.put<ApiResponse<any>>('/users/profile', {
      first_name: firstName,
      last_name: lastName,
      phone_number: phoneNumber,
    });
    return response.data;
  }

  // Scoring endpoints
  async calculateScore(propertyId: string, latitude: number, longitude: number, address: string) {
    const response = await this.client.post<ApiResponse<any>>('/scoring/calculate', {
      property_id: propertyId,
      latitude,
      longitude,
      address,
    });
    return response.data;
  }

  async getScoreBreakdown(propertyId: string) {
    const response = await this.client.get<ApiResponse<any>>(`/scoring/${propertyId}/breakdown`);
    return response.data;
  }
}

export const apiClient = new ApiClient();
