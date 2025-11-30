// Đây là nơi thực sự gọi API dịch
export const translateText = async (text, targetLang = 'en') => {
  try {
    const encodedText = encodeURIComponent(text);
    // Gọi trực tiếp tới server của MyMemory, không qua backend của bạn
    const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=Autodetect|${targetLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200) {
      return data.responseData.translatedText;
    } else {
      console.error("Translation API Error:", data.responseDetails);
      return text; // Nếu lỗi thì trả về text gốc
    }
  } catch (error) {
    console.error("Fetch Error:", error);
    return text;
  }
};