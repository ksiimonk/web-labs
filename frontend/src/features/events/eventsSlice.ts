import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchEvents, createEvent, updateEvent } from './eventsThunks';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
}

const eventsSlice = createSlice({
    name: 'events',
    initialState: {
      events: [] as Event[],
      isLoading: false,
      error: null as string | null
    },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.events = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Ошибка загрузки мероприятий';
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.events.push(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      });
  },
});

export default eventsSlice.reducer;