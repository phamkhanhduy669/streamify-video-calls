import { MessageInput, useChannelStateContext } from "stream-chat-react";
import { useReplyContext } from "../context/ReplyContext";
import { X, Reply } from "lucide-react";

const CustomMessageInput = () => {
  const { replyMessage, setReplyMessage } = useReplyContext();
  const { channel } = useChannelStateContext();

  // Đổi tên biến tham số thành 'submitData' để tránh nhầm lẫn
  const overrideSubmitHandler = async (submitData) => {
    
    // 1. LẤY DỮ LIỆU TỪ ĐÚNG CHỖ (Dựa trên log của bạn)
    // Log cho thấy cấu trúc là: submitData.message.text
    const messageObj = submitData.message || submitData; 

    const { text, attachments, mentioned_users } = messageObj;

    console.log("Dữ liệu gửi đi:", text); // Debug: Đảm bảo text không bị undefined

    // 2. TẠO MESSAGE SẠCH
    const messageToSend = {
      text: text, 
      attachments: attachments || [],
      mentioned_users: mentioned_users || [],
    };

    // 3. GẮN ID REPLY
    if (replyMessage) {
      messageToSend.quoted_message_id = replyMessage.id;
    }

    try {
      if (channel) {
        await channel.sendMessage(messageToSend);
        setReplyMessage(null); 
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn:", err);
    }
  };

  return (
    <div className="flex flex-col w-full relative px-2 pb-2">
      {/* THANH REPLY */}
      {replyMessage && (
        <div className="flex items-center justify-between bg-base-200/90 backdrop-blur-sm border-t border-x border-base-300 rounded-t-2xl p-3 text-sm animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-primary/10 rounded-full shrink-0">
                <Reply className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0 border-l-2 border-primary pl-2">
              <span className="text-xs font-bold text-primary">
                Trả lời {replyMessage.user?.name || "User"}
              </span>
              <span className="text-xs text-base-content/60 truncate max-w-[200px]">
                {replyMessage.text || "Đính kèm"}
              </span>
            </div>
          </div>
          <button onClick={() => setReplyMessage(null)} className="btn btn-ghost btn-sm btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className={`relative z-20 ${replyMessage ? "rounded-b-2xl border-t-0" : ""}`}>
        <MessageInput 
            overrideSubmitHandler={overrideSubmitHandler}
            focus={!!replyMessage}
        />
      </div>
    </div>
  );
};

export default CustomMessageInput;