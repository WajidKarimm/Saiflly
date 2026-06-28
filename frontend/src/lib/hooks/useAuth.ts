'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '../../types';
import { getStoredUser, isAuthenticated } from '../auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        if (isAuthenticated()) {
          const storedUser = getStoredUser();
          setUser(storedUser);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUser = useCallback((updatedUser: User | null) => {
    setUser(updatedUser);
    if (updatedUser) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }, []);

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    updateUser,
  };
};
