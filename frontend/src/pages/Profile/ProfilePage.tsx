import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchEvents, deleteEvent, fetchEventParticipants } from '../../features/events/eventsThunks';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.scss';
import Modal from '../UI/Modal';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { events, participantsData } = useAppSelector((state) => state.events);
  const [showParticipants, setShowParticipants] = useState(false);
  const [currentEventId, setCurrentEventId] = useState('');

  const handleDelete = (id: string) => {
    dispatch(deleteEvent(id));
  };

  const handleShowParticipants = (eventId: string) => {
    setCurrentEventId(eventId);
    dispatch(fetchEventParticipants(eventId));
    setShowParticipants(true);
  };

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchEvents({ createdBy: user.id }));
    }
  }, [dispatch, user?.id]);

  const handleEdit = (eventId: string) => {
    navigate(`/event/${eventId}/edit`);
  };

  const myEvents = events.filter(event => event.createdBy === user?.id);

  if (!user) {
    return <div className={styles.loading}>Загрузка данных...</div>;
  }

  return (
    <div className={styles.profile}>
      <h1>Профиль</h1>
      <div className={styles.userInfo}>
        <p><strong>Имя:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
      </div>

      <h2>Мои мероприятия</h2>
      {myEvents.length > 0 ? (
        <div className={styles.eventsList}>
          {myEvents.map(event => (
            <div key={event.id} className={styles.eventCard}>
              <button 
                onClick={() => handleDelete(event.id)} 
                className={styles['delete-button']}
              >
                ✖
              </button>
              <h3>{event.title}</h3>
              <p>{event.description}</p>
              
              <div className={styles.participantsInfo}>
                <span 
                  onClick={() => handleShowParticipants(event.id)}
                  className={styles.clickableCounter}
                >
                  Участников: {event.participantsCount}
                </span>
              </div>
              
              <p className={styles.date}>
                {new Date(event.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              <button 
                onClick={() => handleEdit(event.id)}
                className={styles.editButton}
              >
                Редактировать
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p>У вас пока нет мероприятий</p>
      )}

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

export default ProfilePage;