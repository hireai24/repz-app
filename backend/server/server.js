// backend/server/server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import "../firebase/init.js";

// === ROUTE IMPORTS ===
import analyzeFormRoutes from "./routes/analyzeForm.routes.js";
import generateWorkoutRoutes from "./routes/generateWorkout.routes.js";
import generateMealPlanRoutes from "./routes/generateMealPlan.routes.js";
import saveUserPlanRoutes from "./routes/saveUserPlan.routes.js";
import trackXPRoutes from "./routes/trackXP.routes.js";
import weeklySummaryRoutes from "./routes/weeklySummary.routes.js";
import gymRoutes from "./routes/gymRoutes.js";
import challengeWagerRoutes from "./routes/challengeWager.routes.js";
import openaiRoutes from "./routes/openai.routes.js";
import photoAnalysisRoutes from "./routes/photoAnalysis.routes.js";
import adminDashboardRoutes from "../admin/dashboard/index.js";
import partnerRoutes from "./routes/partner.routes.js";
import leaderboardRoutes from "./routes/leaderboard.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import purchaseHistoryRoutes from "./routes/purchaseHistory.routes.js";
import userRoutes from "./routes/user.routes.js";
import mealManagementRoutes from "./routes/mealManagement.routes.js";

// === PAYMENTS ===
import connectTrainerPayout from "../payments/stripe/connectTrainerPayout.js";
import createCheckoutSession from "../payments/stripe/createCheckoutSession.js";
import purchasePlan from "../payments/stripe/purchasePlan.js";
import handleStripeWebhook from "../payments/stripe/handleWebhooks.js";

// === ENV SETUP ===
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// === STRIPE RAW WEBHOOK (MUST be first for signature verification) ===
app.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook,
);

// === MIDDLEWARES ===
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// === MAIN ROUTES ===
app.use("/api/form", analyzeFormRoutes);
app.use("/api/workout", generateWorkoutRoutes);
app.use("/api/meal", generateMealPlanRoutes);
app.use("/api/save-plan", saveUserPlanRoutes);
app.use("/api/xp", trackXPRoutes);
app.use("/api/weekly-summary", weeklySummaryRoutes);
app.use("/api/gyms", gymRoutes);
app.use("/api/wager", challengeWagerRoutes);
app.use("/api/openai", openaiRoutes);
app.use("/api/photo-analysis", photoAnalysisRoutes);
app.use("/api/partner", partnerRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notify", notificationRoutes);
app.use("/api/purchases", purchaseHistoryRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-meals", mealManagementRoutes);

// === PAYMENTS ===
app.use("/api/stripe/connect", connectTrainerPayout);
app.use("/api/stripe/checkout", createCheckoutSession);
app.use("/api/stripe/purchase-plan", purchasePlan);

// === ROOT CHECK ===
app.get("/", (_, res) => res.send("✅ REPZ Backend API is live."));

// === GLOBAL ERROR HANDLER (No unused next) ===
app.use((err, req, res) => {
  // Remove all console statements for lint. (Swap for logger if needed)
  // (If you want, plug in a logger here)
  res.status(err.status || 500).json({
    success: false,
    error:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred."
        : err.message || "Internal Server Error",
  });
});

// === START SERVER ===
app.listen(PORT, () => {
  // Remove console for lint compliance; add logger if needed.
  // If you want server logs locally, swap this for a logger.
});

export default app;
