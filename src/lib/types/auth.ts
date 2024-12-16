export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  avatarUrl: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserRegistrationData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
}
