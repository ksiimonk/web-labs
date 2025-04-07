import { Link, useNavigate } from 'react-router-dom';
import styles from './Header.module.scss';
import { getUsername, isAuthenticated, removeToken } from '../../utils/localStorage';

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
            <Link to="/">LOGO</Link>
          </div>
          <div className={styles.nav}>
            {loggedIn ? (
              <>
                <span className={styles.username}>{username}</span>
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