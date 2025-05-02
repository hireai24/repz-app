import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

const useWorkoutTimer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isActive, isPaused]);

  const start = useCallback(() => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
      setSeconds(0);
    }
  }, [isActive]);

  const pause = useCallback(() => {
    if (isActive && !isPaused) {
      setIsPaused(true);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isActive, isPaused]);

  const resume = useCallback(() => {
    if (isActive && isPaused) {
      setIsPaused(false);
    }
  }, [isActive, isPaused]);

  const stop = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stop();
    setSeconds(0);
  }, [stop]);

  const formatted = useMemo(() => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
  }, [seconds]);

  return {
    seconds,
    formatted,
    isRunning: isActive && !isPaused,
    isPaused,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};

export default useWorkoutTimer;
