import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Добавляем перехватчик ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Обрабатываем ошибки валидации (400)
      if (error.response.status === 400 && error.response.data?.errors) {
        const validationErrors = error.response.data.errors
          .map((err: { msg: string }) => err.msg)
          .join(', ');
        return Promise.reject(new Error(validationErrors));
      }
      // Обрабатываем другие ошибки
      if (error.response.data?.error) {
        return Promise.reject(new Error(error.response.data.error));
      }
    }
    return Promise.reject(error);
  }
);

export default api;