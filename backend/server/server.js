import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";
import bodyParser from "body-parser";

// Firebase initialization
import "../backend/firebase/init.js";

import analyzeFormRoutes from "./routes/analyzeForm.routes.js";
import generateWorkoutRoutes from "./routes/generateWorkout.routes.js";
import generateMealPlanRoutes from "./routes/generateMealPlan.routes.js";
import saveUserPlanRoutes from "./routes/saveUserPlan.routes.js";
import trackXPRoutes from "./routes/trackXP.routes.js";
import weeklySummaryRoutes from "./routes/weeklySummary.routes.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// === MIDDLEWARES ===
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan("dev"));

// === ROUTES ===
app.use("/api/form", analyzeFormRoutes);
app.use("/api/workout", generateWorkoutRoutes);
app.use("/api/meal", generateMealPlanRoutes);
app.use("/api/save-plan", saveUserPlanRoutes);
app.use("/api/xp", trackXPRoutes);
app.use("/api/weekly-summary", weeklySummaryRoutes);

// === ROOT CHECK ===
app.get("/", (_, res) => res.send("✅ REPZ Backend API is live."));

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
