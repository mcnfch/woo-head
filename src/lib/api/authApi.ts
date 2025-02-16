import axios from 'axios';
import Cookies from 'js-cookie';
import type { AuthResponse, User, UserRegistrationData, UserUpdateData } from '@/lib/types/auth';
import { woocommerce } from '@/lib/woocommerce';

const API_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_URL;
const WC_CONSUMER_KEY = process.env.NEXT_PUBLIC_WC_CONSUMER_KEY;
const WC_CONSUMER_SECRET = process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET;

interface WPUserResponse {
  id: number;
  username: string;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
  roles: string[];
  avatar_urls: Record<string, string>;
}

class AuthAPI {
  private static instance: AuthAPI;
  private token: string | null = null;

  private constructor() {
    // Initialize with token from storage if available
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token') || Cookies.get('auth_token') || null;
    }
  }

  public static getInstance(): AuthAPI {
    if (!AuthAPI.instance) {
      AuthAPI.instance = new AuthAPI();
    }
    return AuthAPI.instance;
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
  }

  private formatUser(wpUser: WPUserResponse): User {
    return {
      id: wpUser.id,
      username: wpUser.username,
      firstName: wpUser.first_name,
      lastName: wpUser.last_name,
      email: wpUser.email,
      roles: wpUser.roles,
      avatarUrl: wpUser.avatar_urls['96'] || ''
    };
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
        // Set cookie with same-site attribute
        Cookies.set('auth_token', token, { 
          expires: 7,
          sameSite: 'strict',
          secure: window.location.protocol === 'https:'
        });
      } else {
        localStorage.removeItem('auth_token');
        Cookies.remove('auth_token');
      }
    }
  }

  public async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/wp-json/jwt-auth/v1/token`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const { token, user_email, user_nicename, user_display_name } = response.data;
      
      this.setToken(token);
      
      return {
        token,
        user: {
          id: response.data.user_id,
          email: user_email,
          username: user_nicename,
          firstName: response.data.first_name || '',
          lastName: response.data.last_name || '',
          roles: ['customer'],
          avatarUrl: ''
        }
      };
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  public async getProfile(): Promise<User> {
    try {
      if (!this.token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(
        `${API_URL}/wp-json/wp/v2/users/me`,
        { headers: this.getHeaders() }
      );

      return this.formatUser(response.data);
    } catch (error: any) {
      console.error('Get profile error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to get profile');
    }
  }

  public async register(data: UserRegistrationData): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/wp-json/wp/v2/users/register`,
        data,
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Registration error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  public async updateProfile(data: UserUpdateData): Promise<User> {
    try {
      if (!this.token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.post(
        `${API_URL}/wp-json/wp/v2/users/me`,
        data,
        { headers: this.getHeaders() }
      );

      return this.formatUser(response.data);
    } catch (error: any) {
      console.error('Update profile error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to update profile');
    }
  }

  public logout(): void {
    this.setToken(null);
  }

  public async resetPassword(email: string): Promise<void> {
    try {
      await axios.post(
        `${API_URL}/wp-json/wp/v2/users/lost-password`,
        { email },
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error: any) {
      console.error('Reset password error:', error.response?.data || error);
      throw new Error(error.response?.data?.message || 'Failed to reset password');
    }
  }
}

export const authApi = AuthAPI.getInstance();
