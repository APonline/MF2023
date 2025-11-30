/* eslint-disable no-console */
const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const http = require("http");
const os = require("os");

process.env.TZ = "America/Toronto";

const BASE_URL = "https://musefactory.app";

// --- helpers ---------------------------------------------------------------

/** Build a base URL (fixed to main domain in prod) */
function getBaseUrl() {
    return BASE_URL;
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

// Per-request baseUrl (fixed)
app.use((req, res, next) => {
    res.locals.baseUrl = getBaseUrl();
    next();
});

// CORS: only allow the main domain and its ports
const allowedOrigins = [
    "https://musefactory.app",
    "https://musefactory.app:3001",
    "https://musefactory.app:4000",
    "https://musefactory.app:4001"
];

app.use(
    cors({
        origin: (origin, cb) => {
            if (!origin) return cb(null, true); // curl/postman/no-origin
            const ok = allowedOrigins.includes(origin);
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

// Cookies: always prod-style for musefactory.app
app.use((req, res, next) => {
    cookieSession({
        name: "mf-session",
        // NOTE: replace with a persisted secret (file read) for real security:
        secret: "REPLACE_ME_WITH_A_PERSISTED_SECRET",
        httpOnly: true,
        sameSite: "none",
        secure: true,                 // only over HTTPS
        domain: "musefactory.app"     // always this domain
    })(req, res, next);
});

// Routes
require("./API/routes")(app);

// Health / debug
app.get("/ping", (req, res) => {
    res.json({
        ok: true,
        baseUrl: res.locals.baseUrl,
        host: req.get("host") || "",
        origin: req.headers.origin || "",
        ip: req.ip
    });
});

// --- Socket.IO -------------------------------------------------------------
const hostname = os.hostname();

const { Server } = require("socket.io");
const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            const ok = allowedOrigins.includes(origin);
            return cb(ok ? null : new Error("Not allowed by CORS"), ok);
        },
        credentials: true
    }
});

require("./socket")(io, hostname);

// --- start -----------------------------------------------------------------
const PORT = 4000;
server.listen(PORT, () => {
    console.log(`listening on ${BASE_URL}:${PORT}`);
});
