const express = require("express");
const fetch = require("node-fetch");
const app = express();
const port = 9000;

// CORS middleware
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Chat completion endpoint with SSE
app.post("/chat", async (req, res) => {
  try {
    const apiKey = process.env.deepseekKey;
    if (!apiKey) {
      console.error("API key not found in environment variables");
      return res.status(500).json({ error: "API key not configured" });
    }

    if (!req.body.messages || !Array.isArray(req.body.messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    // Set up SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const requestConfig = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: "deepseek-r1-250120",
        messages: req.body.messages,
        stream: true,
      }),
    };

    console.log("Making request to DeepSeek API...");
    const response = await fetch(
      "https://ark.cn-beijing.volces.com/api/v3/chat/completions",
      requestConfig
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      res.write(
        `data: ${JSON.stringify({
          error: "API request failed",
          details: errorText,
        })}\n\n`
      );
      return res.end();
    }

    // Handle the stream using response.body directly
    response.body.on("data", (chunk) => {
      const lines = chunk.toString().split("\n");
      for (const line of lines) {
        if (line.trim() === "") continue;
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") {
            res.write("data: [DONE]\n\n");
            continue;
          }
          try {
            const parsed = JSON.parse(data);
            res.write(`data: ${JSON.stringify(parsed)}\n\n`);
          } catch (e) {
            console.error("Error parsing JSON:", e);
            console.error("Problematic data:", data);
          }
        }
      }
    });

    response.body.on("end", () => {
      res.end();
    });

    response.body.on("error", (error) => {
      console.error("Stream error:", error);
      res.write(
        `data: ${JSON.stringify({ error: "Stream error occurred" })}\n\n`
      );
      res.end();
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      error: "Internal server error",
      message: error.message,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
