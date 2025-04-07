import api from './axios';

export interface LoginPayload {
  email: string;
  name?: string;
  password: string;
}

export interface LoginResponse {
    token: string;
    user: {
      name: string;
    };
  }

export const login = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data; // { token, username }
};

export const register = async (payload: {
    email: string;
    name: string;
    password: string;
  }) => {
    const response = await api.post('/auth/register', payload);
    return response.data;
  };