import { StreamChat } from "stream-chat";
import { generateStreamToken } from "../lib/stream.js";

// Lấy API Key và Secret từ biến môi trường
const apiKey = process.env.STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

// Khởi tạo Server Client (Quyền Admin)
const serverClient = StreamChat.getInstance(apiKey, apiSecret);

export async function getStreamToken(req, res) {
  try {
    const token = generateStreamToken(req.user.id);
    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// --- HÀM XỬ LÝ KẾT THÚC CUỘC GỌI ---
export async function endCall(req, res) {
  try {
    const { callId } = req.body;

    if (!callId) {
      return res.status(400).json({ message: "Call ID is required" });
    }

    // 1. Tách Channel ID từ Call ID
    // Logic: Nếu callId dạng "type:id_timestamp" -> lấy "type:id"
    const channelIdStr = callId.includes('_') ? callId.split('_')[0] : callId;
    
    // Tách channel type và channel id
    const [type, id] = channelIdStr.includes(':') 
        ? channelIdStr.split(':') 
        : ['messaging', channelIdStr]; // Mặc định là messaging nếu thiếu type

    const channel = serverClient.channel(type, id);

    // 2. Tìm tin nhắn mời gọi (call_ring)
    const { messages } = await channel.query({
      messages: { limit: 50 }, // Tìm trong 50 tin nhắn gần nhất
    });

    const callMessage = messages.find(
      (m) => m.custom_type === 'call_ring' && m.callId === callId
    );

    if (callMessage) {
      // 3. Cập nhật tin nhắn
      // QUAN TRỌNG: Phải truyền user_id của người tạo tin nhắn gốc để tránh lỗi permission
      await serverClient.updateMessage({
        id: callMessage.id,
        text: "🚫 Call has ended",
        custom_type: "call_ended",
        attachments: [], 
        user_id: callMessage.user.id, // <--- FIX LỖI TẠI ĐÂY
      });
    }

    res.status(200).json({ message: "Call status updated successfully" });
  } catch (error) {
    console.error("Error in endCall controller:", error.message);
    res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
}