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
Respond ONLY with JSON in this exact format:
{
  "title": "string",
  "description": "string",
  "dueDate": "YYYY-MM-DDTHH:MM",
  "priority": "low|medium|high",
  "category": "personal|work|college|other"
}
Do not explain anything. Do not include markdown or extra characters. ONLY return raw JSON.`,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const content = response.data.choices[0].message.content;

    let taskData;
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```|({[\s\S]*})/);
      if (!jsonMatch) throw new Error("No valid JSON found in AI response.");

      const cleaned = jsonMatch[1] || jsonMatch[0];
      taskData = JSON.parse(cleaned.trim());

      // === ✅ Map AI category to your schema ===
      const categoryMap = {
        personal: 'general',
        work: 'work',
        college: 'education',
        other: 'general',
        groceries: 'groceries',
        house: 'house'
      };

      taskData.category = taskData.category?.toLowerCase();
      taskData.list = categoryMap[taskData.category] || 'general';
      delete taskData.category; // remove raw category to avoid confusion

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
