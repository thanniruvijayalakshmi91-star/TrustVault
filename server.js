
const express = require("express");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send(`
      <h1>Welcome to TrustVault</h1>
      <h2>Secure Document Sharing System</h2>
      <p>Your application is running!</p>
      <p>Manage documents securely.</p>
    `);
});

app.get("/api/health", (req, res) => {
    res.json({
        status: "success",
        message: "TrustVault server is working"
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log("TrustVault started on port " + PORT);
});
