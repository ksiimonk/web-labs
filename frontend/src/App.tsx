import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Events from './pages/Events/Events';
import NotFound from './pages/NotFound/NotFound';
import Header from './components/Header/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ProfilePage from './pages/Profile/ProfilePage';
import EventFormPage from './pages/EventForm/EventFormPage';

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/events" element={<Events />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/event/new" element={<EventFormPage />} />
          <Route path="/event/:id/edit" element={<EventFormPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;