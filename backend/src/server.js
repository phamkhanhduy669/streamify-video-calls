import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import postRoutes from "./routes/post.route.js"; // Import route bài viết

import { connectDB } from "./lib/db.js";
import "./lib/passport.config.js";
import passport from "passport";
import client from "prom-client";

const app = express();

// --- Cấu hình Metrics (Giữ nguyên) ---
const register = new client.Registry();
client.collectDefaultMetrics({ register });
const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});
register.registerMetric(httpRequestDurationMicroseconds);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use((req, res, next) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  res.on('finish', () => {
    end({ method: req.method, route: req.route ? req.route.path : req.path, code: res.statusCode });
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});
// -------------------------------------

app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

app.use(
    cors({
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    })
);
app.use(passport.initialize());
app.use(cookieParser());

// === KHU VỰC ĐĂNG KÝ API ROUTE (QUAN TRỌNG) ===
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/posts", postRoutes); // <--- ĐÃ CHUYỂN LÊN ĐÂY
app.get("/api/test", (req, res) => {
  res.status(200).json({ message: "API test route is working!" });
});

// === KHU VỰC CẤU HÌNH FRONTEND (PHẢI ĐỂ SAU CÙNG CÁC API) ===
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

// === KHỞI ĐỘNG SERVER ===
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});