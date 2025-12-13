import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import passport from "./auth.js";
import session from "express-session";
import forumRoutes from "./routes/forum.js";
import appointment from "./routes/appointmentroutes.js";
import chatRoutes from "./routes/chatbotRoutes.js";
import wellnessRoutes from "./routes/wellnessRoutes.js";
import userRoutes from "./routes/user.js";
import testRoutes from "./routes/TestRoutes.js";

dotenv.config();
const app = express();

// -------------------------
// FIXED: CORS MUST BE FIRST
// -------------------------
app.use(cors({
  origin: ["http://localhost:5000", "https://psycare-2btm.onrender.com"],
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.options("*", cors()); // allow preflight globally

// Now JSON parsers can run
app.use(express.json());
app.use(bodyParser.json());

// -------------------------
// Routes
// -------------------------
app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/users", userRoutes);
app.use("/api/appointments", appointment);
app.use("/api/wellness", wellnessRoutes);
app.use("/api/forum", forumRoutes);

export default app;
