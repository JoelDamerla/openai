import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN }));
type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
 
function trimToRecent(messages: ChatMessage[], maxMessages = 8) {
  return messages.length <= maxMessages
    ? messages
    : messages.slice(-maxMessages);
}
 
app.post("/api/chat", async (req, res) => {
  console.log("📩 Received chat request:", req.body);
  try {
    const { messages } = req.body as { messages: ChatMessage[] }; 
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format" });
    }
    const trimmed = trimToRecent(messages, 8);

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}` // still using same env var
      },

      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "llama3-8b-8192",
        messages: trimmed,
        max_tokens: 800,
        temperature: 0.7
      })
    });
 
    const data = await groqRes.json();
    if (!groqRes.ok) {
      console.error("❌ Groq API error:", data);
      return res.status(groqRes.status).json({ error: data });
    }
 
    const reply = data.choices?.[0]?.message?.content || "";
    res.json({
      message: {
        role: "assistant",
        content: reply,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (err: any) {
    console.error("❌ Backend error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});
 
const port = Number(process.env.PORT || 5000);
app.listen(port, () => console.log(`✅ Backend running on port ${port}`));

 