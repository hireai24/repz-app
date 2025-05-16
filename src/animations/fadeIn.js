import { useRef, useEffect, useState } from "react";
import { Animated, Easing, AccessibilityInfo } from "react-native";

const useFadeIn = (delay = 0, duration = 500) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((result) => {
        if (isMounted) {
          setReduceMotionEnabled(result);
        }
      })
      .catch(() => {
        // Silent fail for accessibility query
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (reduceMotionEnabled) {
      opacity.setValue(1);
      return;
    }

    const timeout = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => {
      clearTimeout(timeout);
      opacity.stopAnimation();
    };
  }, [delay, duration, reduceMotionEnabled, opacity]);

  return opacity;
};

export default useFadeIn;
