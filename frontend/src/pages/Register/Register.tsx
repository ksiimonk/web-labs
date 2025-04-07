import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { register } from '../../api/authService';
import { isAuthenticated } from '../../utils/localStorage';
import styles from './Register.module.scss';

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated()) {
    return <Navigate to="/events" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register({ email, name, password });
      navigate('/login');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Ошибка регистрации');
      } else {
        setError('Неизвестная ошибка регистрации');
      }
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          placeholder="Имя"
          value={name}
          required
          onChange={(e) => setName(e.target.value)}
        />
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
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
      </p>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
};

export default Register;