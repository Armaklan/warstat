import { useState, useEffect } from 'react';

export function useTimer(startTime?: Date, endTime?: Date) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      const now = endTime ? new Date(endTime).getTime() : Date.now();
      setElapsed(now - new Date(startTime).getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  return elapsed;
}
