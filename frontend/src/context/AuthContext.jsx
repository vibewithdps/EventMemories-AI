import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('event_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('event_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);
  const [hasFaceScan, setHasFaceScan] = useState(false);

  // Set default auth header for axios
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }

  const fetchCurrentUser = async () => {
    if (!token) {
      setUser(null);
      localStorage.removeItem('event_user');
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get('/api/auth/me');
      setUser(res.data.user);
      localStorage.setItem('event_user', JSON.stringify(res.data.user));
      setHasFaceScan(res.data.has_face_scan);
    } catch (err) {
      console.error('Failed to load user:', err);
      // Only logout on explicit authentication rejection (401 or 403)
      if (err.response?.status === 401 || err.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    const { access_token, user: loggedUser } = res.data;
    localStorage.setItem('event_token', access_token);
    localStorage.setItem('event_user', JSON.stringify(loggedUser));
    setToken(access_token);
    setUser(loggedUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    await fetchCurrentUser();
    return loggedUser;
  };

  const register = async (email, password, fullName, role = 'guest') => {
    const res = await axios.post('/api/auth/register', {
      email,
      password,
      full_name: fullName,
      role
    });
    const { access_token, user: newUser } = res.data;
    localStorage.setItem('event_token', access_token);
    localStorage.setItem('event_user', JSON.stringify(newUser));
    setToken(access_token);
    setUser(newUser);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    await fetchCurrentUser();
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('event_token');
    localStorage.removeItem('event_user');
    setToken(null);
    setUser(null);
    setHasFaceScan(false);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      hasFaceScan,
      setHasFaceScan,
      login,
      register,
      logout,
      refreshUser: fetchCurrentUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
