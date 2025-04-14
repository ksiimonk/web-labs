import api from './axios';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
}

export const getEvents = async (startDate?: string, endDate?: string): Promise<Event[]> => {
  const params = {
    ...(startDate && { startDate }),
    ...(endDate && { 
      endDate: new Date(new Date(endDate).setHours(23, 59, 59, 999)).toISOString()
    })
  };

  const response = await api.get('/events', { params });
  return response.data;
};