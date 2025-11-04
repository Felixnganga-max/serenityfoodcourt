const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");

// Route imports - single consolidated route file
const cafeRoutes = require("./routes/cafeRoutes");
const cateringRoutes = require("./routes/catering");

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://serenityfoodcourt-5sgp.vercel.app",
      "https://serenityfoodcourt-y7o6.vercel.app",
      "https://serenityfoodcourt.vercel.app",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(express.json());

// Routes - mount all cafe routes under /serenityfoodcourt
app.use("/serenityfoodcourt", cafeRoutes);
app.use("/serenityfoodcourt/outside-catering", cateringRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// 404 handler
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: "Route not found",
//   });
// });

// ✅ Start server only if not in Vercel environment
if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
  });
}

// ✅ Export app for Vercel
module.exports = app;
