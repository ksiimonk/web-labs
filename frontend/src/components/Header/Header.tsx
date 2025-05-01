import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import { getUsername, isAuthenticated, removeToken } from '../../utils/localStorage';
import logo from '../../assets/logo.svg';

const Header = () => {
  const navigate = useNavigate();
  const loggedIn = isAuthenticated();
  const username = getUsername();

  const handleLogout = () => {
    removeToken();
    navigate('/');
    window.location.reload();
  };

  return (
    <header className={styles.header}>
      <div className={styles.logo}>
        <Link to="/">
          <img src={logo} alt="Логотип" className={styles.logoImage} />
        </Link>
      </div>
      <div className={styles.nav}>
        {loggedIn ? (
          <>
            <Link to="/profile" className={styles.username}>
              {username}
            </Link>
            <Link to="/event/new" className={styles.authButton}>
              Создать мероприятие
            </Link>
            <button onClick={handleLogout}>Выйти</button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.authButton}>Войти</Link>
            <Link to="/register" className={styles.authButton}>Регистрация</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;