import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { getMe, logout as apiLogout } from '../api';
import { getStoredToken, removeStoredToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start / page refresh
  useEffect(() => {
    (async () => {
      try {
        if (Platform.OS !== 'web') {
          // Native: token is in AsyncStorage — skip getMe if no token stored
          const token = await getStoredToken();
          if (!token) { setLoading(false); return; }
        }
        // Web: cookie is in browser automatically, just verify with getMe
        const data = await getMe();
        if (data?.user) setUser(data.user);
      } catch {
        if (Platform.OS !== 'web') await removeStoredToken();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = (userData) => setUser(userData);

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    await removeStoredToken();
    setUser(null);
  };

  const updateUser = (fields) => setUser((prev) => ({ ...prev, ...fields }));

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
