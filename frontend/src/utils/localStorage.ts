export const saveToken = (token: string) => {
    localStorage.setItem('token', token);
  };
  
  export const getToken = (): string | null => {
    return localStorage.getItem('token');
  };
  
  export const removeToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
  };
  
  export const saveUsername = (name: string) => {
    localStorage.setItem('username', name);
  };
  
  export const getUsername = (): string | null => {
    return localStorage.getItem('username');
  };
  
  export const isAuthenticated = (): boolean => {
    return !!getToken();
  };
  