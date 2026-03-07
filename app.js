import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import mainRouter from "./routes/index.js";
import { errorHandler } from "./middlewares/error.middleware.js";

const app = express();

// ✅ Root route for testing
app.get("/", (req, res) => {
  res.send("Backend is up and running!");
});

// ✅ CORS origin check
console.log(
  `[CORS Verification] The server is about to configure CORS for origin: ${process.env.CORS_ORIGIN}`
);

// ✅ CORS middleware (corrected and complete)
const allowedOrigins = [
  "http://localhost:3000",
  "https://vedant-fe.vercel.app",
  "https://www.vedantgurukul.com",
  "https://vedantgurukul.com",
  "https://vedant-frontend.vercel.app",
  "https://vedant-frontend.vercel.app/",
  "http://vedant-frontend.vercel.app",
  "http://vedant-frontend.vercel.app/"
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Handle preflight OPTIONS request for all routes
app.options("*", cors({
  origin: allowedOrigins,
  credentials: true,
}));

// ✅ Body and cookie parsers
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true, limit: "500mb" }));
app.use(cookieParser());

// ✅ Static files
app.use(express.static("public"));

// ✅ Main API routes
app.use("/api/v1", mainRouter);

// ✅ Error handler
app.use(errorHandler);

// ✅ Export app
export { app };
