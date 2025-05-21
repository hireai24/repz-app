// RevenueCat configuration module for REPZ app

const REVENUECAT_PUBLIC_KEY = process.env.REVENUECAT_PUBLIC_KEY;

const revenueCatConfig = {
  publicApiKey: REVENUECAT_PUBLIC_KEY,

  // Product IDs used in RevenueCat dashboard and mobile subscriptions
  offerings: {
    pro: "repz_pro_monthly",   // Match with RevenueCat Offering ID
    elite: "repz_elite_monthly", // Match with RevenueCat Offering ID
  },

  // Entitlement IDs used to check access on RevenueCat
  entitlementNames: {
    pro: "pro_access",
    elite: "elite_access",
  },

  // Optional debug mode
  debug: process.env.NODE_ENV !== "production",
};

export default revenueCatConfig;
