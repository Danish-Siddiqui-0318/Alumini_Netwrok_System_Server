const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

// New (optional) packages: npm install helmet compression morgan express-rate-limit
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const db = require("./config/db");

// Route Imports (unchanged)
const profileRoutes = require("./routes/profileRoutes");
const directoryRoutes = require("./routes/directoryRoutes");
const postRoutes = require("./routes/postRoutes");
const authRoutes = require("./routes/authRoutes");
const commentRoutes = require("./routes/commentRoutes");
const likeRoutes = require("./routes/likeRoutes");
const jobRoutes = require("./routes/jobRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const messageRoutes = require("./routes/messageRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";

// If the server runs behind a proxy / load balancer (Nginx, Render, Railway...),
// set TRUST_PROXY=1 so rate limiting and logs see the real client IP.
if (process.env.TRUST_PROXY) {
    app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
}


// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Security headers. "cross-origin" keeps images/files loadable from other
// origins exactly as before.
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// Smaller JSON responses (feeds, job lists, alumni lists).
app.use(compression());

// CORS only controls which WEBSITES (browsers) may call the API. The mobile
// app is never affected by it. Set CORS_ORIGIN in .env:
//   not set                      -> open to every website (same as before)
//   CORS_ORIGIN=none             -> no website may call the API (app only)
//   CORS_ORIGIN=https://a.com,https://b.com -> only those websites
const corsSetting = (process.env.CORS_ORIGIN || "").trim();
let corsOptions; // undefined = default cors() behavior
if (corsSetting.toLowerCase() === "none") {
    corsOptions = { origin: false };
} else if (corsSetting) {
    corsOptions = {
        origin: corsSetting
            .split(",")
            .map((origin) => origin.trim())
            .filter(Boolean)
    };
}
app.use(cors(corsOptions));

// Request log: "dev" format while developing, "combined" in production.
app.use(morgan(isProduction ? "combined" : "dev"));

app.use(express.json());


// ---------------------------------------------------------------------------
// Health check (new): GET /health  ->  { status: "ok" }
// Useful for hosting platforms and for checking the database is reachable.
// ---------------------------------------------------------------------------
app.get("/health", async (req, res) => {
    try {
        await db.query("SELECT 1");
        res.json({ status: "ok", uptime: Math.round(process.uptime()) });
    } catch (error) {
        console.error("Health check failed:", error.message);
        res.status(503).json({
            status: "error",
            message: "Database unavailable"
        });
    }
});


// ---------------------------------------------------------------------------
// Brute-force protection for login / signup.
// Default: 100 requests per 15 minutes per IP (change with AUTH_RATE_LIMIT_MAX).
// ---------------------------------------------------------------------------
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: Number(process.env.AUTH_RATE_LIMIT_MAX) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many attempts. Please try again in a few minutes."
    }
});


// ---------------------------------------------------------------------------
// Routes (same paths, same order as before)
// ---------------------------------------------------------------------------
app.use("/auth", authLimiter, authRoutes);
app.use("/profiles", profileRoutes);
app.use("/users", directoryRoutes); // Alumni APIs
app.use("/posts", postRoutes);
app.use("/api", commentRoutes);
app.use("/api", likeRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api", applicationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);


// ---------------------------------------------------------------------------
// Unknown routes -> JSON instead of Express's default HTML page
// ---------------------------------------------------------------------------
app.use((req, res) => {
    res.status(404).json({
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
});


// ---------------------------------------------------------------------------
// Error handler: any error that is not handled inside a route ends up here.
// Always JSON, and no stack traces or internals are sent to clients.
// ---------------------------------------------------------------------------
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (res.headersSent) {
        return next(err);
    }

    let status = err.status || err.statusCode || 500;
    let message = err.message || "Something went wrong.";

    if (err.type === "entity.parse.failed") {
        status = 400;
        message = "Invalid JSON in request body.";
    } else if (err.type === "entity.too.large") {
        status = 413;
        message = "Request body is too large.";
    } else if (err.code === "LIMIT_FILE_SIZE") {
        // Thrown by multer when an uploaded image is too big.
        status = 413;
        message = "The uploaded file is too large.";
    }

    if (status >= 500) {
        console.error(err);
        if (isProduction) {
            message = "Internal server error.";
        }
    }

    // "error" is included too, in case a client reads that key instead.
    res.status(status).json({ message, error: message });
});


// ---------------------------------------------------------------------------
// Start + graceful shutdown
// ---------------------------------------------------------------------------
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Finish in-flight requests and close the database pool before exiting.
const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down...`);

    server.close(async () => {
        try {
            if (typeof db.end === "function") {
                await db.end();
            }
        } catch (error) {
            console.error("Error closing database pool:", error.message);
        }
        process.exit(0);
    });

    // Force exit if something keeps the server open.
    setTimeout(() => process.exit(1), 10000).unref();
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// A forgotten try/catch in one controller should not take the whole API down.
process.on("unhandledRejection", (reason) => {
    console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught exception:", error);
    shutdown("uncaughtException");
});