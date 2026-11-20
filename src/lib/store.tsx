import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { APP_API } from './config';

export type User = { name: string; email: string };
type SavedPost = { id: number; title: string };

type Ctx = {
  user: User | null;
  watchlist: string[];
  saved: SavedPost[];
  isWatched: (s: string) => boolean;
  toggleWatch: (s: string) => void;
  isSaved: (id: number) => boolean;
  toggleSave: (p: SavedPost) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);
const TOKEN = 'mm_token';

async function api<T>(path: string, token: string | null, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${APP_API}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}`, 'X-MM-Token': token } : {}),
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string }).message ?? `Request failed (${res.status})`);
  return body as T;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [saved, setSaved] = useState<SavedPost[]>([]);

  // load local copies on start
  useEffect(() => {
    (async () => {
      const [w, s, u] = await Promise.all([
        AsyncStorage.getItem('mm_watch'), AsyncStorage.getItem('mm_saved'), AsyncStorage.getItem('mm_user'),
      ]).catch(() => [null, null, null]);
      if (w) setWatchlist(JSON.parse(w));
      if (s) setSaved(JSON.parse(s));
      if (u) setUser(JSON.parse(u));
      const t = await SecureStore.getItemAsync(TOKEN).catch(() => null);
      if (t) {
        setToken(t);
        try {
          const me = await api<{ user: User; watchlist: string[] }>('/me', t);
          setUser(me.user);
          if (me.watchlist?.length) setWatchlist((cur) => Array.from(new Set([...me.watchlist, ...cur])));
        } catch {
          /* offline or token expired: keep local data */
        }
      }
    })();
  }, []);

  useEffect(() => { AsyncStorage.setItem('mm_watch', JSON.stringify(watchlist)).catch(() => {}); }, [watchlist]);
  useEffect(() => { AsyncStorage.setItem('mm_saved', JSON.stringify(saved)).catch(() => {}); }, [saved]);

  const pushWatch = useCallback(
    (list: string[]) => { if (token) api('/watchlist', token, { method: 'POST', body: JSON.stringify({ symbols: list }) }).catch(() => {}); },
    [token],
  );

  const toggleWatch = useCallback((s: string) => {
    setWatchlist((cur) => {
      const next = cur.includes(s) ? cur.filter((x) => x !== s) : [s, ...cur];
      pushWatch(next);
      return next;
    });
  }, [pushWatch]);

  const toggleSave = useCallback((p: SavedPost) => {
    setSaved((cur) => (cur.some((x) => x.id === p.id) ? cur.filter((x) => x.id !== p.id) : [p, ...cur]));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const r = await api<{ token: string; user: User; watchlist: string[] }>('/login', null, {
      method: 'POST', body: JSON.stringify({ email, password }),
    });
    await SecureStore.setItemAsync(TOKEN, r.token);
    await AsyncStorage.setItem('mm_user', JSON.stringify(r.user));
    setToken(r.token);
    setUser(r.user);
    setWatchlist((cur) => {
      const merged = Array.from(new Set([...(r.watchlist ?? []), ...cur]));
      api('/watchlist', r.token, { method: 'POST', body: JSON.stringify({ symbols: merged }) }).catch(() => {});
      return merged;
    });
  }, []);

  const logout = useCallback(async () => {
    if (token) await api('/logout', token, { method: 'POST' }).catch(() => {});
    await SecureStore.deleteItemAsync(TOKEN).catch(() => {});
    await AsyncStorage.removeItem('mm_user').catch(() => {});
    setToken(null);
    setUser(null);
  }, [token]);

  const value = useMemo<Ctx>(() => ({
    user, watchlist, saved,
    isWatched: (s) => watchlist.includes(s),
    toggleWatch,
    isSaved: (id) => saved.some((x) => x.id === id),
    toggleSave, login, logout,
  }), [user, watchlist, saved, toggleWatch, toggleSave, login, logout]);

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be inside AppProvider');
  return c;
}
