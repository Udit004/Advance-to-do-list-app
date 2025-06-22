// controllers/aiController.js

const axios = require('axios');

const aiPromptHandler = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "tngtech/deepseek-r1t-chimera:free",
        messages: [
          {
            role: "system",
            content: `You are a helpful AI assistant that converts natural language into structured to-do JSON.
Output must ONLY be JSON with these fields:
{
  "title": "string",
  "description": "string",
  "dueDate": "YYYY-MM-DDTHH:MM",
  "priority": "low|medium|high",
  "category": "personal|work|college|other"
}
Do not include any explanation or extra text.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer YOUR_OPENROUTER_API_KEY`, // Use .env in production
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;

    let taskData;
    try {
      taskData = JSON.parse(content);
    } catch (err) {
      return res.status(500).json({
        error: "AI response was not valid JSON.",
        raw: content,
      });
    }

    return res.status(200).json(taskData);
  } catch (err) {
    console.error("AI Prompt Error:", err?.response?.data || err.message);
    return res.status(500).json({
      error: "Failed to process prompt.",
      details: err.message,
    });
  }
};

module.exports = { aiPromptHandler };
