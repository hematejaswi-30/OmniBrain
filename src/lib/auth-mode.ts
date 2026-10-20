// src/lib/auth-mode.ts
'use client';

export type UserMode = 'guest' | 'clean_user' | 'authenticated';

export interface SimulatedUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  isSimulated: boolean;
}

const STORAGE_KEY = 'omnibrain_simulated_user';

export const getSimulatedUser = (): SimulatedUser | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setSimulatedUser = (user: SimulatedUser | null): void => {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event('omnibrain_auth_change'));
  } catch (err) {
    console.error('Failed to update simulated user', err);
  }
};
