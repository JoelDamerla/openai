import express from "express";

import dotenv from "dotenv";

import cors from "cors";

import {FormData} from "undici";
 
dotenv.config();
 
const app = express();

app.use(express.json());
 
// IMPORTANT: set this to your Vite URL (5173). Avoid "*".

app.use(cors({ origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173" }));
 
// ENV expected:

// OPENAI_API_KEY   -> your GROQ key (gsk_...)

// OPENAI_MODEL     -> llama3-8b-8192 (or llama-3.1-8b-instant, etc.)

// STABILITY_API_KEY

// PORT

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
 
// ================== STAGE 1: Basic Chat ==================

app.post("/api/chat", async (req, res) => {

  try {

    const { messages } = req.body || {};

    if (!Array.isArray(messages)) {

      return res.status(400).json({ error: "Invalid messages format" });

    }
 
    const groqRes = await fetch(GROQ_URL, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

      },

      body: JSON.stringify({

        model: process.env.OPENAI_MODEL || "llama3-8b-8192",

        messages,

        max_tokens: 800,

        temperature: 0.7,

      }),

    });
 
    const data = await groqRes.json();

    if (!groqRes.ok) {

      console.error("Stage1 Groq error:", data);

      return res.status(groqRes.status).json({ error: data.error || "Chat failed" });

    }
 
    const message =

      data.choices?.[0]?.message || { role: "assistant", content: "Sorry, no response." };
 
    res.json({ message });

  } catch (err: any) {

    console.error("Chat error:", err);

    res.status(500).json({ error: "Failed to chat" });

  }

});
 
// ================== STAGE 2: World Entity (JSON) ==================

app.post("/api/stage2", async (req, res) => {

  try {

    const { world, name } = req.body || {};

    if (!world || !name) {

      return res.status(400).json({ error: "World and name are required" });

    }
 
    const groqRes = await fetch(GROQ_URL, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

      },

      body: JSON.stringify({

        model: process.env.OPENAI_MODEL || "llama3-8b-8192",

        messages: [

          {

            role: "system",

            content:

              "You are a world entity generator. Respond ONLY with valid JSON. No explanations, no extra text. JSON must have keys: name, type, description, abilities (array of strings).",

          },

          {

            role: "user",

            content: `Generate the entity for "${name}" in the world of "${world}".`,

          },

        ],

        // Some Groq models support this; if not, the system prompt still enforces JSON.

        response_format: { type: "json_object" },

        max_tokens: 600,

        temperature: 0.7,

      }),

    });
 
    const data = await groqRes.json();

    if (!groqRes.ok) {

      console.error("Stage2 Groq error:", data);

      return res.status(groqRes.status).json({ error: data.error || "Stage2 failed" });

    }
 
    let worldEntity: any;

    try {

      const raw = data.choices?.[0]?.message?.content || "{}";

      worldEntity = typeof raw === "string" ? JSON.parse(raw) : raw;

    } catch (e) {

      console.error("Stage2 JSON parse error:", e);

      return res.status(500).json({ error: "Invalid JSON received from model" });

    }
 
    // Normalize abilities to array of strings

    if (Array.isArray(worldEntity?.abilities)) {

      worldEntity.abilities = worldEntity.abilities.map((a: any) =>

        typeof a === "string" ? a : JSON.stringify(a)

      );

    } else {

      worldEntity.abilities = [];

    }
 
    res.json({ worldEntity });

  } catch (err: any) {

    console.error("Stage2 error:", err);

    res.status(500).json({ error: "Failed to generate entity" });

  }

});
 
// ================== STAGE 3: World Entity + Image ==================

app.post("/api/world", async (req, res) => {

  try {

    const { world, name } = req.body || {};
 
    if (!world || !name) {

      return res.status(400).json({ error: "World and name are required" });

    }
 
    // 1) Get JSON entity first (reuse Stage 2 logic)

    const groqRes = await fetch(GROQ_URL, {

      method: "POST",

      headers: {

        "Content-Type": "application/json",

        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,

      },

      body: JSON.stringify({

        model: process.env.OPENAI_MODEL || "llama3-8b-8192",

        messages: [

          {

            role: "system",

            content:

              "You are a world entity generator. Respond ONLY with valid JSON. No explanations, no extra text. JSON must have keys: name, type, description, abilities (array of strings).",

          },

          {

            role: "user",

            content: `Generate the entity for "${name}" in the world of "${world}".`,

          },

        ],

        response_format: { type: "json_object" },

        max_tokens: 600,

        temperature: 0.7,

      }),

    });
 
    const entityData = await groqRes.json();

    if (!groqRes.ok) {

      console.error("Stage3 Groq error:", entityData);

      return res

        .status(groqRes.status)

        .json({ error: entityData.error || "World JSON failed" });

    }
 
    let worldEntity: any;

    try {

      const raw = entityData.choices?.[0]?.message?.content || "{}";

      worldEntity = typeof raw === "string" ? JSON.parse(raw) : raw;

    } catch (e) {

      console.error("Stage3 JSON parse error:", e);

      return res.status(500).json({ error: "Invalid JSON from model" });

    }
 
    // Normalize abilities

    if (Array.isArray(worldEntity?.abilities)) {

      worldEntity.abilities = worldEntity.abilities.map((a: any) =>

        typeof a === "string" ? a : JSON.stringify(a)

      );

    } else {

      worldEntity.abilities = [];

    }
 
    // 2) Use Pollinations.AI for image (no key needed)

    const prompt = `${worldEntity.name}, ${worldEntity.type}. ${worldEntity.description}. Cinematic, detailed, coherent with a ${world} setting.`;

    const polliUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(

      prompt

    )}`;
 
    worldEntity.image = polliUrl;
 
    return res.json({ worldEntity });

  } catch (err: any) {

    console.error("Stage3 error:", err);

    res

      .status(500)

      .json({ error: "Failed to generate entity with image" });

  }

});

 
// ================== SERVER ==================

const PORT = Number(process.env.PORT || 5000);

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

 