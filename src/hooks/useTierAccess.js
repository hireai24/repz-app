import { useContext, useMemo, useDebugValue } from "react";
import { UserContext } from "../context/UserContext";

const tierLevels = {
  Free: 0,
  Pro: 1,
  Elite: 2,
};

const useTierAccess = (requiredTier = "Free") => {
  const { userProfile } = useContext(UserContext);

  const access = useMemo(() => {
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

  useDebugValue(access);

  return access;
};

export default useTierAccess;
