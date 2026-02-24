const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const subjectsRoutes = require("./routes/subjects");
const studyPlanRoutes = require("./routes/studyPlan");
const performanceRoutes = require("./routes/performance");
const academicRecommendationRoutes = require("./routes/academicRecommendation");
const dashboardRoutes = require("./routes/dashboard");
const schoolsRoutes = require("./routes/schools");
const adminRoutes = require("./routes/admin");
const initDb = require("./config/initDb");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", authRoutes);
app.use("/api/subjects", subjectsRoutes);
app.use("/api/study-plan", studyPlanRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/academic-recommendation", academicRecommendationRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/schools", schoolsRoutes);
app.use("/api/admin", adminRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({ message: "SmartStudy API is running" });
});

// Initialize database and start server
const startServer = async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`SmartStudy server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
