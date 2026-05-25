import { useEffect, useState } from 'react';

export const useAsyncData = (loader, dependencies = []) => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await loader();

        if (active) {
          setData(result);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load data');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      active = false;
    };
  }, dependencies);

  return { data, error, loading, setData };
};
