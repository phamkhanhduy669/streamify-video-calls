import "dotenv/config";

export const getRandomWord = async (req, res) => {
  try {
    const { language } = req.params;
    const targetLang = language || "English";
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) throw new Error("API Key not found");
    const modelName = "gemini-2.5-flash"; 

    console.log(`🚀 Đang dùng model: ${modelName} để tạo từ vựng...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const promptText = `
      Generate a random, interesting vocabulary word for a student learning ${targetLang} (Level A2-B2).
      Return ONLY a JSON object with this exact structure (no markdown, no code blocks):
      {
        "word": "The word in ${targetLang}",
        "pronunciation": "IPA pronunciation",
        "meaning": "Meaning in Vietnamese",
        "example": "A simple example sentence in ${targetLang}",
        "language": "${targetLang}"
      }
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Lỗi API:", JSON.stringify(errorData, null, 2));
      throw new Error(errorData.error?.message || "Failed to fetch from Gemini API");
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;

    // Làm sạch JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const wordData = JSON.parse(text);

    console.log("✅ Đã tạo từ:", wordData.word);
    res.status(200).json(wordData);

  } catch (error) {
    console.error("Error generating word (Direct Fetch):", error.message);
    // Fallback
    res.status(200).json({
      word: "Ciao",
      pronunciation: "/tʃaʊ/",
      meaning: "Xin chào (Fallback Mode)",
      example: "Ciao bella!",
      language: "Italian"
    });
  }
};

export const translateText = async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!text) return res.status(400).json({ message: "Text is required" });

    const lang = targetLanguage || "Vietnamese";

    console.log(`🤖 Đang dịch: "${text}" sang ${lang}`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const promptText = `
      Translate the following text into ${lang}. 
      Return ONLY the translated text. Do not add explanations or quotes.
      Text: "${text}"
    `;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
      }),
    });

    const data = await response.json();

    // 🔍 DEBUG: In ra lỗi thực sự từ Google nếu có
    if (!data.candidates || data.candidates.length === 0) {
        console.error("❌ LỖI TỪ GOOGLE API:", JSON.stringify(data, null, 2));
        
        // Trả về thông báo lỗi cho Frontend thay vì làm sập server
        return res.status(500).json({ 
            message: "Translation failed (Google API Error)", 
            details: data.error?.message || "Unknown error"
        });
    }
    
    // Lấy kết quả an toàn
    let translatedText = data.candidates[0].content.parts[0].text;

    res.status(200).json({ translatedText });

  } catch (error) {
    console.error("Translation Internal Error:", error);
    res.status(500).json({ message: "Translation failed" });
  }
};