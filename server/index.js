/* eslint-disable no-console */
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const http = require("http");
const os = require("os");
const fs = require("fs");

process.env.TZ = "America/Toronto";

// --- helpers ---------------------------------------------------------------

/** Treat localhost/127.0.0.1 (with or without port) as local */
function isLocalHost(host = "") {
    return /^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(String(host).trim());
}

/** Build a base URL from the actual request (works behind proxies) */
function getBaseUrl(req) {
    const forwardedProto = req.headers["x-forwarded-proto"];
    const proto = (forwardedProto || req.protocol || "http").split(",")[0].trim();
    const host = req.get("host"); // includes port if present
    if (!host) return "http://localhost:4200";
    if (isLocalHost(host)) return "http://localhost:4200";
    return `${proto}://${host}`;
}

/** Fallback base URL for non-HTTP contexts (no env vars). */
function defaultBaseUrl() {
    // Touch a .dev file locally if you want the default to be localhost.
    return fs.existsSync(".dev") ? "http://localhost:4200" : "https://musefactory.app";
}

// --- globals you actually need --------------------------------------------
global.__basedir = __dirname; // keep, other modules may rely on it

// --- db --------------------------------------------------------------------
const db = require("./API/models");
db.sequelize.options.logging = false;
// db.sequelize.sync();

// --- app/server ------------------------------------------------------------
const app = express();
const server = http.createServer(app);

// If behind Nginx/Cloudflare, this ensures req.protocol honors x-forwarded-proto
app.set("trust proxy", 1);

// Per-request baseUrl (no envs, no global)
app.use((req, res, next) => {
    res.locals.baseUrl = getBaseUrl(req);
    next();
});

// CORS: single, consistent policy for Express routes
const allowedOrigins = [
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
    "https://musefactory.app",
    "https://musefactory.app:3001",
    "https://musefactory.app:4000",
    "https://musefactory.app:4001"
];

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true); // curl/postman
            const ok = allowedOrigins.some((rule) =>
                rule instanceof RegExp ? rule.test(origin) : rule === origin
            );
            return cb(ok ? null : new Error("Not allowed by CORS"), ok);
        },
        credentials: true
    })
);

// Let CORS handle preflights cleanly for all routes
app.options("*", cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookies (secure in prod, lax in dev; no env vars)
app.use(
    (req, res, next) =>
        cookieSession({
            name: "mf-session",
            // NOTE: replace with a persisted secret (file read) for real security:
            secret: "REPLACE_ME_WITH_A_PERSISTED_SECRET",
            httpOnly: true,
            sameSite: isLocalHost(req.get("host")) ? "lax" : "none",
            secure: !isLocalHost(req.get("host")), // only secure over HTTPS
            // Set cookie domain in prod; omit in local
            domain: isLocalHost(req.get("host")) ? undefined : "musefactory.app"
        })(req, res, next)
);

// Routes
require("./API/routes")(app);

// Health / debug
app.get("/ping", (req, res) => {
    res.json({
        ok: true,
        baseUrl: res.locals.baseUrl,
        host: req.get("host"),
        ip: req.ip
    });
});

// --- Socket.IO -------------------------------------------------------------
const hostname = os.hostname();

// Socket.IO v4: use options.cors.origin (not "origins")
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            const ok = allowedOrigins.some((rule) =>
                rule instanceof RegExp ? rule.test(origin) : rule === origin
            );
            return cb(ok ? null : new Error("Not allowed by CORS"), ok);
        },
        credentials: true
    }
});

require("./socket")(io, hostname);

// --- start -----------------------------------------------------------------
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`listening on ${defaultBaseUrl()}:${PORT}`);
});
