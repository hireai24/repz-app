import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";

import { AuthContext } from "./AuthContext";

export const TierContext = createContext();
export const useTier = () => useContext(TierContext);

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const TierProvider = ({ children }) => {
  const { authUser, userToken } = useContext(AuthContext);
  const [tier, setTier] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTier = async () => {
      if (!authUser || !userToken) {
        setTier("Free");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `${BASE_URL}/users/entitlements/${authUser.uid}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          },
        );

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || "Failed to fetch entitlements");
        }

        const { access } = await res.json();

        if (access?.elite) setTier("Elite");
        else if (access?.pro) setTier("Pro");
        else setTier("Free");

        setError(null);
      } catch {
        setTier("Free");
        setError("Failed to determine subscription tier.");
      } finally {
        setLoading(false);
      }
    };

    fetchTier();
  }, [authUser, userToken]);

  const hasAccess = (requiredTier) => {
    const levels = { Free: 0, Pro: 1, Elite: 2 };
    return levels[tier] >= levels[requiredTier];
  };

  const value = useMemo(
    () => ({
      tier,
      hasAccess,
      loading,
      error,
      refreshTier: () => {
        setLoading(true);
        setError(null);
        setTimeout(() => {
          if (authUser && userToken) {
            fetch(`${BASE_URL}/users/entitlements/${authUser.uid}`, {
              headers: { Authorization: `Bearer ${userToken}` },
            })
              .then((res) => res.json())
              .then(({ access }) => {
                if (access?.elite) setTier("Elite");
                else if (access?.pro) setTier("Pro");
                else setTier("Free");
              })
              .catch(() => {
                setError("Failed to refresh tier.");
              })
              .finally(() => setLoading(false));
          } else {
            setTier("Free");
            setLoading(false);
          }
        }, 500);
      },
    }),
    [tier, hasAccess, loading, error],
  );

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
};
