import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../../api/authService';
import { saveToken, saveUsername, isAuthenticated } from '../../utils/localStorage';
import styles from './Login.module.scss';

interface LoginResponse {
  token: string;
  user: {
    name: string;
  };
}

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated()) {
    return <Navigate to="/events" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data: LoginResponse = await login({ email, password });
      saveToken(data.token);
      saveUsername(data.user.name);
      navigate('/events');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Ошибка входа');
      } else {
        setError('Неизвестная ошибка входа');
      }
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Войти</button>
      </form>
      <p>
        Нет аккаунта? <a href="/register">Регистрация</a>
      </p>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default Login;