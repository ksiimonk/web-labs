import { useEffect, useState } from 'react';
import { getEvents } from '../../api/eventService';
import styles from './Events.module.scss';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents();
        setEvents(data);
      } catch (err) {
        setError('Не удалось загрузить мероприятия');
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (loading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.eventsPage}>
      <h1>Мероприятия</h1>
      
      <div className={styles.eventsGrid}>
        {events.map(event => (
          <div key={event.id} className={styles.eventCard}>
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <div className={styles.date}>
              <span>📅</span>
              {new Date(event.date).toLocaleDateString('ru-RU')}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Events;