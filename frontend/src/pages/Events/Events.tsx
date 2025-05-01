import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchEvents, participateEvent, fetchEventParticipants } from '../../features/events/eventsThunks';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Modal from '../UI/Modal';
import styles from './Events.module.scss';
import { useNavigate } from 'react-router-dom';

interface EventsFetchParams {
  startDate?: string;
  endDate?: string;
  createdBy?: string;
}

const Events = () => {
  const dispatch = useAppDispatch();
  const { events, participantsData } = useAppSelector((state) => state.events);
  const { isLoading, error } = useAppSelector((state) => state.ui);
  const currentUser = useAppSelector((state) => state.auth.user);
  const navigate = useNavigate();
  
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentEventId, setCurrentEventId] = useState<string>('');
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

  const handleParticipate = (eventId: string) => {
    dispatch(participateEvent(eventId));
  };

  const handleShowParticipants = (eventId: string) => {
    setCurrentEventId(eventId);
    dispatch(fetchEventParticipants(eventId))
      .unwrap()
      .then(() => {
        console.log('Participants loaded:', participantsData[eventId]?.participants);
      })
      .catch(err => console.error('Error loading participants:', err));
    setShowParticipants(true);
  };

  if (isLoading) return <div className={styles.loading}>Загрузка...</div>;
  if (error) return <div className={styles.error}>{error}</div>;

  console.log('Current participants data:', participantsData[currentEventId]);

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
        {events.map(event => {
          const isCreator = currentUser?.id === event.createdBy;
          const isParticipating = Boolean(currentUser?.id && event.participants.includes(currentUser.id));

          return (
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
              
              <div className={styles.participantsInfo}>
                <span 
                  onClick={() => handleShowParticipants(event.id)}
                  className={styles.clickableCounter}
                >
                  Участников: {event.participantsCount}
                </span>
                
                {isCreator ? (
                  <button 
                    onClick={() => navigate(`/event/${event.id}/edit`)}
                    className={styles.editButton}
                  >
                    Редактировать
                  </button>
                ) : currentUser?.id && (
                  <button
                    onClick={() => handleParticipate(event.id)}
                    disabled={isParticipating}
                    className={`${styles.participateBtn} ${
                      isParticipating ? styles.participating : ''
                    }`}
                  >
                    {isParticipating ? 'Вы участвуете' : 'Участвовать'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showParticipants} onClose={() => setShowParticipants(false)}>
        <h3>Участники мероприятия</h3>
        {participantsData[currentEventId]?.loading ? (
          <div>Загрузка...</div>
        ) : (
          <ul className={styles.participantsList}>
            {participantsData[currentEventId]?.participants?.map((user) => (
              <li key={user.id}>
                {user.name} ({user.email})
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
};

export default Events;