import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

// Firebase initialization
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
import mealManagementRoutes from "./routes/mealManagement.routes.js"; // ADDED: New import for meal management

// === PAYMENTS (Stripe only for now) ===
import connectTrainerPayout from "../payments/stripe/connectTrainerPayout.js";
import createCheckoutSession from "../payments/stripe/createCheckoutSession.js";
import purchasePlan from "../payments/stripe/purchasePlan.js";

// Stripe webhook must use raw body parsing (before other middleware)
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
// Configure CORS for production environment (allow specific origin)
const corsOptions = {
  origin: process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL : "*",
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Allow cookies and auth headers
  optionsSuccessStatus: 204
};
app.use(cors(corsOptions)); // Apply CORS middleware

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// === MAIN ROUTES ===
app.use("/api/form", analyzeFormRoutes);
app.use("/api/workout", generateWorkoutRoutes);
app.use("/api/meal", generateMealPlanRoutes); // FOR AI GENERATION
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
app.use("/api/user-meals", mealManagementRoutes); // ADDED: For saving and retrieving user meal plans

// === PAYMENTS ===
app.use("/api/stripe/connect", connectTrainerPayout);
app.use("/api/stripe/checkout", createCheckoutSession);
app.use("/api/stripe/purchase-plan", purchasePlan);

// === ROOT CHECK ===
app.get("/", (_, res) => res.send("✅ REPZ Backend API is live."));

// === GLOBAL ERROR HANDLER (Added for launch readiness) ===
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err); // Log the full error
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === "production"
      ? "An unexpected error occurred."
      : err.message || "Internal Server Error",
  });
});

// === START SERVER ===
app.listen(PORT, () => {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  }
});

export default app;