import { useCallback, useEffect, useRef, useState } from 'react';

/** Load data with loading / error / pull-to-refresh state. */
export function useAsync<T>(fn: (force: boolean) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const alive = useRef(true);

  const run = useCallback(async (force: boolean) => {
    setError(null);
    try {
      const d = await fn(force);
      if (alive.current) setData(d);
    } catch (e) {
      if (alive.current) setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      if (alive.current) { setLoading(false); setRefreshing(false); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    alive.current = true;
    setLoading(true);
    run(false);
    return () => { alive.current = false; };
  }, [run]);

  const refresh = useCallback(() => { setRefreshing(true); run(true); }, [run]);
  return { data, error, loading, refreshing, refresh, retry: () => { setLoading(true); run(true); } };
}
