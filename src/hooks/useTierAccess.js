import { useContext, useMemo } from "react";

import { UserContext } from "../context/UserContext";

const tierLevels = {
  Free: 0,
  Pro: 1,
  Elite: 2,
};

/**
 * Hook to determine user tier access and comparison logic.
 * @param {string} requiredTier - The minimum required tier: 'Free' | 'Pro' | 'Elite'
 * @returns {Object} - access state and tier checks
 */
const useTierAccess = (requiredTier = "Free") => {
  const { userProfile } = useContext(UserContext);

  return useMemo(() => {
    const userTier =
      typeof userProfile?.tier === "string" ? userProfile.tier : "Free";

    const userLevel = tierLevels[userTier] ?? 0;
    const requiredLevel = tierLevels[requiredTier] ?? 0;

    const allowed = userLevel >= requiredLevel;

    return {
      tier: userTier,
      allowed,
      locked: !allowed,
      isFree: userTier === "Free",
      isPro: userTier === "Pro" || userTier === "Elite",
      isElite: userTier === "Elite",
      requiredTier,
    };
  }, [userProfile, requiredTier]);
};

export default useTierAccess;
