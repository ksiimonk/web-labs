import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<h1>Главная</h1>} />
        <Route path="/auth" element={<h1>Авторизация</h1>} />
        <Route path="/register" element={<h1>Регистрация</h1>} />
        <Route path="/events" element={<h1>Мероприятия</h1>} />
        <Route path="*" element={<h1>404</h1>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App