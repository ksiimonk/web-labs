import api from './axios';
import { AxiosError } from 'axios';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  name: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    name: string;
  };
}

export const login = async (payload: LoginPayload): Promise<LoginResponse> => {
  try {
    const response = await api.post('/auth/login', payload);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      throw new Error(error.response?.data?.error || error.message || 'Ошибка входа. Проверьте данные и попробуйте снова.');
    }
    throw new Error('Неизвестная ошибка');
  }
};

export const register = async (payload: RegisterPayload) => {
  try {
    const response = await api.post('/auth/register', payload);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError) {
      const serverError = error.response?.data;
      if (serverError?.errors) {
        // Обработка ошибок валидации express-validator
        const errorMessages = serverError.errors.map((err: { msg: string }) => err.msg).join(', ');
        throw new Error(errorMessages);
      }
      throw new Error(serverError?.error || error.message || 'Ошибка регистрации. Проверьте данные и попробуйте снова.');
    }
    throw new Error('Неизвестная ошибка');
  }
};