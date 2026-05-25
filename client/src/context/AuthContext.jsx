import { createContext, useEffect, useMemo, useState } from 'react';

import { authApi } from '../api/services';
import { getStoredAuth, setStoredAuth } from '../api/http';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const storedAuth = getStoredAuth();
  const [auth, setAuth] = useState(storedAuth);
  const [isBootstrapping, setIsBootstrapping] = useState(Boolean(storedAuth?.token));

  useEffect(() => {
    let active = true;

    const hydrate = async () => {
      if (!storedAuth?.token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const user = await authApi.me();
        if (!active) {
          return;
        }

        const nextAuth = { token: storedAuth.token, user };
        setAuth(nextAuth);
        setStoredAuth(nextAuth);
      } catch (_error) {
        if (!active) {
          return;
        }

        setAuth(null);
        setStoredAuth(null);
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    };

    hydrate();

    return () => {
      active = false;
    };
  }, [storedAuth?.token]);

  const login = async (payload) => {
    const data = await authApi.login(payload);
    setAuth(data);
    setStoredAuth(data);
    return data;
  };

  const register = async (payload) => {
    const data = await authApi.register(payload);
    setAuth(data);
    setStoredAuth(data);
    return data;
  };

  const logout = () => {
    setAuth(null);
    setStoredAuth(null);
  };

  const value = useMemo(
    () => ({
      auth,
      user: auth?.user || null,
      token: auth?.token || null,
      isAuthenticated: Boolean(auth?.token),
      isBootstrapping,
      login,
      register,
      logout,
      setAuth
    }),
    [auth, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
