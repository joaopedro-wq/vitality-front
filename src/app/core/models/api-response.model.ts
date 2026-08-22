import type { User } from './user.model';

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface LoginResponse {
  status: boolean;
  user: User;
  token: string;
  message: string;
}
