import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEvents } from '../../features/events/eventsThunks';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './Events.module.scss';

interface EventsFetchParams {
  startDate?: string;
  endDate?: string;
  createdBy?: string; // Добавляем для совместимости
}

const Events = () => {
  const dispatch = useAppDispatch();
  const { events } = useAppSelector((state) => state.events);
  const { isLoading, error } = useAppSelector((state) => state.ui);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const params: EventsFetchParams = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      params.startDate = start.toISOString();
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      params.endDate = end.toISOString();
    }
    
    dispatch(fetchEvents(params));
  }, [dispatch, startDate, endDate]);

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.eventsPage}>
      <h1>Мероприятия</h1>
      
      <div className={styles.dateFilter}>
        <DatePicker
          selectsRange={true}
          startDate={startDate}
          endDate={endDate}
          onChange={(update) => setDateRange(update)}
          isClearable={true}
          placeholderText="Выберите период"
          dateFormat="dd.MM.yyyy"
          className={styles.datePicker}
        />
      </div>
      
      <div className={styles.eventsGrid}>
        {events.map(event => (
          <div key={event.id} className={styles.eventCard}>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <div className={styles.date}>
              {new Date(event.date).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;