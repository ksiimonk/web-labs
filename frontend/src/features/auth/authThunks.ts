import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { setUser, clearUser, setError } from './authSlice';
import { saveToken, removeToken, saveUsername } from '../../utils/localStorage';
import { setLoading} from '../ui/uiSlice';
import { getToken } from '../../utils/localStorage';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password }: LoginData, { dispatch }) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      
      saveToken(token);
      saveUsername(user.name);
      dispatch(setUser(user));
      
      return user;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка входа';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async ({ name, email, password }: RegisterData, { dispatch }) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Ошибка регистрации';
      dispatch(setError(errorMessage));
      throw error;
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch }) => {
    removeToken();
    dispatch(clearUser());
  }
);

export const fetchUser = createAsyncThunk(
  'auth/fetchUser',
  async (_, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const token = getToken();
      if (!token) {
        throw new Error('Токен отсутствует');
      }
      const response = await api.get('/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      dispatch(setUser(response.data));
      return response.data;
    } catch (error: any) {
      dispatch(clearUser());
      dispatch(setError(error.response?.data?.error || 'Ошибка загрузки данных пользователя'));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);