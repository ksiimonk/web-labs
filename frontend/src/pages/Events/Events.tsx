import { useEffect, useState } from 'react';
import { getEvents, Event } from '../../api/eventService';
import styles from './Events.module.scss';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [startDate, endDate] = dateRange;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents(
          startDate?.toISOString(),
          endDate?.toISOString()
        );
        setEvents(data);
      } catch (err) {
        setError('Не удалось загрузить мероприятия');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [startDate, endDate]);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
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
              <span>📅</span>
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