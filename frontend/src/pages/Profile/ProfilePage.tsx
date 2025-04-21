import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { fetchEvents } from '../../features/events/eventsThunks';
import { useNavigate } from 'react-router-dom';
import styles from './ProfilePage.module.scss';

const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const { events } = useAppSelector((state) => state.events);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchEvents({ createdBy: user.id }));
    }
  }, [dispatch, user?.id]);

  useEffect(() => {
    console.log('Текущий пользователь:', user);
  }, [user]);

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
              <h3>{event.title}</h3>
              <p>{event.description}</p>
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
    </div>
  );
};

export default ProfilePage;