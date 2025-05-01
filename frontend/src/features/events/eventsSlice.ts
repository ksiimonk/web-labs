import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchEvents, createEvent, updateEvent, deleteEvent, participateEvent, fetchEventParticipants } from './eventsThunks';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  createdBy: string;
  participants: string[];
  participantsCount: number;
  isParticipating?: boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface ParticipantData {
  participants: User[];
  loading: boolean;
  error: string | null;
}

interface EventsState {
  events: Event[];
  participantsData: {
    [eventId: string]: ParticipantData;
  };
  loading: boolean;
  error: string | null;
}

const initialState: EventsState = {
  events: [],
  participantsData: {},
  loading: false,
  error: null
};

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.events = action.payload;
        state.loading = false;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Ошибка загрузки мероприятий';
      })

      .addCase(participateEvent.pending, (state, action) => {
        const eventId = action.meta.arg;
        const event = state.events.find(e => e.id === eventId);
        if (event) {
          event.isParticipating = true;
        }
      })
      .addCase(participateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(participateEvent.rejected, (state, action) => {
        const eventId = action.meta.arg;
        const event = state.events.find(e => e.id === eventId);
        if (event) {
          event.isParticipating = false;
        }
      })

      .addCase(fetchEventParticipants.pending, (state, action) => {
        const eventId = action.meta.arg;
        state.participantsData[eventId] = {
          participants: state.participantsData[eventId]?.participants || [],
          loading: true,
          error: null
        };
      })
      .addCase(fetchEventParticipants.fulfilled, (state, action) => {
        const { eventId, participants } = action.payload;
        console.log('Saving participants:', participants);
        state.participantsData[eventId] = {
          participants: participants || [], 
          loading: false,
          error: null
        };
      })
      .addCase(fetchEventParticipants.rejected, (state, action) => {
        const eventId = action.meta.arg;
        state.participantsData[eventId] = {
          participants: state.participantsData[eventId]?.participants || [],
          loading: false,
          error: action.error.message || 'Ошибка загрузки участников'
        };
      })

      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.events.push(action.payload);
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.events.findIndex(e => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.events = state.events.filter(event => event.id !== action.payload);
      });
  }
});

export default eventsSlice.reducer;