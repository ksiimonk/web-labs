import { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { login } from '../../api/authService';
import { saveToken, saveUsername, isAuthenticated } from '../../utils/localStorage';
import styles from './Login.module.scss';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  if (isAuthenticated()) {
    return <Navigate to="/events" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Валидация
    const validationErrors: string[] = [];
    if (!email.trim()) validationErrors.push('Введите email');
    if (!password.trim()) validationErrors.push('Введите пароль');

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const data = await login({ email, password });
      saveToken(data.token);
      saveUsername(data.user.name);
      navigate('/events');
    } catch (err: any) {
      setErrors(['Неверный email или пароль']);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Войти</button>
      </form>
      <p>
        Нет аккаунта? <Link to="/register">Регистрация</Link>
      </p>
      
      {errors.length > 0 && (
        <div className={styles.error}>
          {errors.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Login;