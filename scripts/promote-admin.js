require("dotenv").config();
const { Pool } = require("pg");

async function promoteAdmin() {
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Set ADMIN_EMAIL in the server environment before running this command.");
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Add your PostgreSQL connection string.");
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(
      "UPDATE users SET role = 'admin' WHERE LOWER(email) = $1 RETURNING id, name, email, role",
      [email]
    );
    if (result.rowCount === 0) {
      throw new Error("No account found for ADMIN_EMAIL. Register that account first, then run this command.");
    }
    console.log("Administrator role granted to:", result.rows[0].email);
  } finally {
    await pool.end();
  }
}

promoteAdmin().catch(error => {
  console.error("Admin setup failed:", error.message);
  process.exitCode = 1;
});
