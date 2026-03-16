import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, authStorage, type AuthUser } from '../lib/api';

export type UserRole = 'employee' | 'supervisor' | 'admin';

export interface User extends AuthUser {
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ token: string; user: User }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const withAvatar = (user: AuthUser): User => ({
  ...user,
  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.name)}`
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = authStorage.getUser();
    return stored ? withAvatar(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = authStorage.getUser();

      if (!storedUser) {
        setIsLoading(false);
        return;
      }

      try {
        const authenticatedUser = await api.me();
        const token =
          localStorage.getItem('meureembolso_token') ??
          localStorage.getItem('km_presencial_token');

        if (token) {
          authStorage.setSession(token, authenticatedUser);
        }

        setUser(withAvatar(authenticatedUser));
      } catch (error) {
        authStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const result = await api.login(email, password);
      authStorage.setSession(result.token, result.user);
      const userWithAvatar = withAvatar(result.user);
      setUser(userWithAvatar);
      return {
        token: result.token,
        user: userWithAvatar
      };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
