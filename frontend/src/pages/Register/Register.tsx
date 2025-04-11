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
  const [errors, setErrors] = useState<string[]>([]);

  if (isAuthenticated()) {
    return <Navigate to="/events" />;
  }

  const validateForm = (): boolean => {
    const newErrors: string[] = [];

    if (!name.trim()) {
      newErrors.push('Введите имя');
    } else if (name.length < 2) {
      newErrors.push('Имя должно содержать минимум 2 символа');
    }

    if (!email.trim()) {
      newErrors.push('Введите email');
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      newErrors.push('Введите корректный email');
    }

    if (!password.trim()) {
      newErrors.push('Введите пароль');
    } else if (password.length < 8) {
      newErrors.push('Пароль должен содержать минимум 8 символов');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!validateForm()) return;

    try {
      await register({ email, name, password });
      navigate('/login');
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        setErrors(['Пользователь с таким email уже существует']);
      } else if (err.message.includes('validation failed')) {
        setErrors(['Проверьте правильность введенных данных']);
      } else {
        setErrors(['Произошла ошибка при регистрации']);
      }
    }
  };

  return (
    <div className={styles.registerContainer}>
      <h2>Регистрация</h2>
      <form onSubmit={handleSubmit} className={styles.form} noValidate>
        <input
          type="text"
          placeholder="Имя"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
        <button type="submit">Зарегистрироваться</button>
      </form>
      <p>
        Уже есть аккаунт? <Link to="/login">Войти</Link>
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

export default Register;