import type { User } from './user.model';

/** Shape padrão de resposta da API Laravel: `{ data, success, message? }`. */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/** Resposta específica do `POST /login` (não segue o shape padrão acima). */
export interface LoginResponse {
  status: boolean;
  token: string;
  user: User;
  message: string;
}
