import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.post("/ask", async (req, res) => {
  const { question } = req.body;

  if (!question || question.trim() === "") {
    return res.json({ answer: "Please select some text first." });
  }

  try {
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: question }] }]
        })
      }
    );

    const data = await geminiResponse.json();
    console.log("Gemini raw response:", JSON.stringify(data, null, 2)); // DEBUG

    let answer = "Sorry, no response from Gemini.";

    if (
      data?.candidates?.length &&
      data.candidates[0]?.content?.parts?.length &&
      data.candidates[0].content.parts[0]?.text
    ) {
      answer = data.candidates[0].content.parts[0].text;
    }

    res.json({ answer });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Gemini API call failed." });
  }
});

app.listen(3000, () => {
  console.log("✅ Gemini AI server running on http://localhost:3000");
});
