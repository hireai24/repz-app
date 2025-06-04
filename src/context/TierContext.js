import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import PropTypes from "prop-types";
import { AuthContext } from "./AuthContext";

export const TierContext = createContext();
export const useTier = () => useContext(TierContext);

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export const TierProvider = ({ children }) => {
  const { authUser, userToken } = useContext(AuthContext);
  const [tier, setTier] = useState("Free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTier = useCallback(async () => {
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
  }, [authUser, userToken]);

  useEffect(() => {
    fetchTier();
  }, [fetchTier]);

  // ---- FIX: useCallback for hasAccess and refreshTier ----
  const hasAccess = useCallback(
    (requiredTier) => {
      const levels = { Free: 0, Pro: 1, Elite: 2 };
      return levels[tier] >= levels[requiredTier];
    },
    [tier],
  );

  const refreshTier = useCallback(async () => {
    setLoading(true);
    setError(null);
    await fetchTier();
  }, [fetchTier]);

  const value = useMemo(
    () => ({
      tier,
      hasAccess,
      loading,
      error,
      refreshTier,
    }),
    [tier, hasAccess, loading, error, refreshTier],
  );

  return <TierContext.Provider value={value}>{children}</TierContext.Provider>;
};

TierProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
