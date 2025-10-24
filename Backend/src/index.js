const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const connectDB = require("./config/db");

// Route imports
const salesRoutes = require("./routes/sales");
const creditsRoutes = require("./routes/credits");
const inventoryRoutes = require("./routes/inventory");

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
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(express.json());

// Routes
app.use("/serenityfoodcourt/sales", salesRoutes);
app.use("/serenityfoodcourt/credits", creditsRoutes);
app.use("/serenityfoodcourt/inventory", inventoryRoutes);

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

// 404 handler (optional)
// app.use("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: "Route not found",
//   });
// });

// ✅ Export app for Vercel (do NOT call app.listen)
module.exports = app;
