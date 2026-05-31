import { useEffect, useRef, useState } from 'react';

export const useAsyncData = (loader, dependencies = [], options = {}) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const pollIntervalMs = options.pollIntervalMs || 0;
  const dataRef = useRef(data);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    let active = true;
    let timeoutId;

    const run = async ({ preserveData = false } = {}) => {
      const hasData = dataRef.current !== null;

      if (!preserveData) {
        setLoading(true);
      } else if (hasData) {
        setLoading(false);
      }

      setError('');

      try {
        const result = await loader();

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active && (!hasData || !preserveData)) {
          setError(err.message || 'Unable to load data');
        }
      } finally {
        if (active) {
          setLoading(false);

          if (pollIntervalMs > 0) {
            timeoutId = window.setTimeout(() => {
              run({ preserveData: true });
            }, pollIntervalMs);
          }
        }
      }
    };

    run();

    return () => {
      active = false;
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [...dependencies, pollIntervalMs]);

  return { data, error, loading, setData };
};
