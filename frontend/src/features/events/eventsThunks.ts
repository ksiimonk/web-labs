import { createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../api/axios';
import { setLoading, setError } from '../ui/uiSlice';
import { getToken } from '../../utils/localStorage';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
}

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
}

export const fetchEvents = createAsyncThunk(
    'events/fetchEvents',
    async (params: { createdBy?: string } | undefined, { dispatch }) => {
      try {
        dispatch(setLoading(true));
        const response = await api.get('/events', {
          params: params || {},
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
        
        if (params?.createdBy) {
          return response.data.filter((event: Event) => event.createdBy === params.createdBy);
        }
        return response.data;
      } catch (error) {
      } finally {
        dispatch(setLoading(false));
      }
    }
  );

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: { title: string; description: string; date: string; createdBy: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await api.post('/events', eventData, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      return response.data as Event;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка создания мероприятия';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateEvent = createAsyncThunk(
    'events/updateEvent',
    async ({ id, ...eventData }: { id: string } & Partial<Event>, { dispatch }) => {
      try {
        dispatch(setLoading(true));
        const response = await api.put(`/events/${id}`, eventData, {
          headers: {
            Authorization: `Bearer ${getToken()}`
          }
        });
        return response.data;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
        dispatch(setError(errorMessage));
        throw error;
      } finally {
        dispatch(setLoading(false));
      }
    }
  );

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (id: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      await api.delete(`/events/${id}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      return id;
    } catch (error) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.message || err.message || 'Ошибка удаления мероприятия';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);