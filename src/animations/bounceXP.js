import { useRef, useEffect, useState } from "react";
import { Animated, Easing, AccessibilityInfo } from "react-native";

const useBounceXP = () => {
  const scale = useRef(new Animated.Value(1)).current;
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let isMounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((result) => {
        if (isMounted) {
          setReduceMotionEnabled(result);
        }
      })
      .catch((error) => {
        console.error("Accessibility info error:", error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const triggerBounce = () => {
    if (reduceMotionEnabled) return;

    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.2,
        duration: 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { scale, triggerBounce };
};

export default useBounceXP;
