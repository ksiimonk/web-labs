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
  participants: string[];
  participantsCount: number;
}

interface ApiError {
  response?: {
    data?: {
      error?: string;
      message?: string;
    };
  };
  message: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

export const fetchEvents = createAsyncThunk<Event[], { createdBy?: string } | undefined>(
  'events/fetchEvents',
  async (params, { getState }) => {
    const response = await api.get<Event[]>('/events', {
      params: params || {},
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    
    const state = getState() as { auth: { user?: { id: string } } };
    const currentUserId = state.auth.user?.id || '';
    
    return response.data.map(event => ({
      ...event,
      isParticipating: event.participants.includes(currentUserId)
    }));
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: { title: string; description: string; date: string; createdBy: string }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      const response = await api.post<Event>('/events', eventData, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
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
      const response = await api.put<Event>(`/events/${id}`, eventData, {
        headers: {
          Authorization: `Bearer ${getToken()}`
        }
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
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
    } catch (error: unknown) {
      const err = error as ApiError;
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const participateEvent = createAsyncThunk<Event, string>(
  'events/participate',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await api.post<Event>(`/events/${eventId}/participate`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as ApiError;
      return rejectWithValue(err.response?.data?.message || 'Не удалось присоединиться к мероприятию');
    }
  }
);

export const fetchEventParticipants = createAsyncThunk<{
  eventId: string;
  participants: User[];
}, string>(
  'events/fetchParticipants',
  async (eventId: string) => {
    const response = await api.get<User[]>(`/events/${eventId}/participants`);
    return {
      eventId,
      participants: Array.isArray(response.data) ? response.data : []
    };
  }
);