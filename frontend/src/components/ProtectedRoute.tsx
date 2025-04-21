import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../utils/localStorage';

const ProtectedRoute = () => {
  const isAuth = isAuthenticated();
  return isAuth ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;