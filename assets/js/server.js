// server.js
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.AIzaSyBUtQrpnpTwv9mJoA5RbF1sz1UdepPcNfs}`
      },
      body: JSON.stringify(req.body)
    }
  );

  const data = await response.json();
  res.json(data);
});

app.listen(3000);
