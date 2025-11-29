import "dotenv/config";
import axios from "axios";

export const getRandomWord = async (req, res) => {
  try {
    const { language } = req.params;
    // Lấy nativeLanguage từ query param (?native=Vietnamese)
    const { native } = req.query; 
    
    const targetLang = language || "English";
    // Nếu không có native, mặc định là English (hoặc Vietnamese tùy bạn)
    const nativeLang = native || "English"; 

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("❌ LỖI: Thiếu API Key trong file .env");
      return res.status(500).json({ message: "Server Error: Missing API Key" });
    }

    console.log(`🤖 Đang gọi AI lấy từ vựng: ${targetLang} (Giải nghĩa bằng: ${nativeLang})...`);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    // Cập nhật prompt: Dùng biến nativeLang
    const promptText = `
      Generate a random, interesting vocabulary word for a student learning ${targetLang} (Level A2-B2).
      Return ONLY a JSON object with this exact structure (no markdown, no code blocks, just raw JSON):
      {
        "word": "The word in ${targetLang}",
        "pronunciation": "IPA pronunciation",
        "meaning": "Meaning in ${nativeLang}", 
        "example": "A simple example sentence in ${targetLang}",
        "language": "${targetLang}"
      }
    `;

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: promptText }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    if (!response.data || !response.data.candidates || response.data.candidates.length === 0) {
      throw new Error("Google API trả về dữ liệu rỗng.");
    }

    let text = response.data.candidates[0].content.parts[0].text;
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    console.log(`✅ AI Trả về (Raw):`, text);

    let wordData;
    try {
        wordData = JSON.parse(text);
    } catch (parseError) {
        console.error("❌ Lỗi Parse JSON:", parseError);
        throw new Error("AI trả về format không đúng chuẩn JSON.");
    }

    console.log(`🎉 Đã tạo thành công từ: ${wordData.word} (${wordData.meaning})`);

    res.status(200).json(wordData);

  } catch (error) {
    console.error("❌ Lỗi trong getRandomWord:", error.response?.data || error.message);
    res.status(200).json({
      word: "Ciao",
      pronunciation: "/tʃaʊ/",
      meaning: "Hello (AI busy)",
      example: "Ciao bella!",
      language: "Italian"
    });
  }
};

// ... (hàm translateText giữ nguyên) ...
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

    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: promptText }] }],
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    let translatedText = response.data.candidates[0].content.parts[0].text;
    translatedText = translatedText.trim();

    console.log(`✅ Kết quả dịch: "${translatedText}"`); 

    res.status(200).json({ translatedText });

  } catch (error) {
    console.error("Translation Error:", error.response?.data || error.message);
    res.status(500).json({ message: "Translation failed" });
  }
};