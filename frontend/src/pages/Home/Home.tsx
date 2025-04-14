import { Link } from 'react-router-dom';
import styles from './Home.module.scss';
import logo from '../../assets/logo.svg';

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} alt="Логотип приложения" className={styles.logo} />
        <h1 className={styles.title}>Добро пожаловать в EventManager</h1>
      </div>

      <div className={styles.content}>
        <p className={styles.description}>
          EventManager - это удобный веб-сайт для просмотра списка меорприятий.
        </p>

        <div className={styles.buttons}>
          <Link to="/events" className={styles.button}>
            Посмотреть мероприятия
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
