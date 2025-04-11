import { useNavigate } from 'react-router-dom';
import './NotFound.scss';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <h1 className="not-found-title">404</h1>
      <h2 className="not-found-subtitle">Страница не найдена</h2>
      <p className="not-found-text">
        Извините, запрашиваемая страница не существует или была перемещена.
      </p>
      <button 
        className="not-found-button" 
        onClick={() => navigate('/')}
      >
        Вернуться на главную
      </button>
    </div>
  );
};

export default NotFound;