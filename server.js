require("dotenv").config();
const express = require("express");
const session = require("express-session");
const PgSession = require("connect-pg-simple")(session);
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path");
const { pool, initializeDatabase } = require("./db");

const app = express();
app.set("trust proxy", 1);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'self'"], scriptSrc: ["'self'"], styleSrc: ["'self'"], imgSrc: ["'self'", "data:"], connectSrc: ["'self'"] } } }));
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(session({
  name: "trustvault.sid",
  store: new PgSession({ pool, tableName: "user_sessions", createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }
}));
app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }));
app.use("/api/auth/register", rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: "draft-7", legacyHeaders: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/documents", require("./routes/documents"));
app.use("/api/admin", require("./routes/admin"));

app.get("/api/health", async (_req, res) => {
  try { await pool.query("SELECT 1"); res.json({ status: "success", message: "TrustVault server and database are connected." }); }
  catch (error) { console.error("Health check:", error.message); res.status(503).json({ status: "error", message: "Database is unavailable." }); }
});
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ message: "API route not found." });
  res.sendFile(path.join(__dirname, "public", "index.html"), err => { if (err) next(err); });
});

async function start() {
  if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) throw new Error("Set SESSION_SECRET to a random value of at least 32 characters.");
  await initializeDatabase();
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log("TrustVault server running on port " + port));
}
start().catch(error => { console.error("Startup failed:", error.message); process.exit(1); });
