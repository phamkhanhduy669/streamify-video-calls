import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Channel,
  ChannelHeader,
  MessageInput,
  MessageList,
  Window,
  useChannelStateContext,
} from "stream-chat-react";
import { useStreamChat } from "../context/StreamChatProvider";
import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import { Menu } from "lucide-react";

// Component con để nhúng CallButton vào Header
// Chúng ta cần component này để truy cập Context của Channel
const CustomHeaderWithCall = ({ onMenuClick }) => {
  const { channel } = useChannelStateContext();
  const navigate = useNavigate();

  const handleVideoCall = async () => {
    try {
      // 1. Tạo một ID ngẫu nhiên cho cuộc gọi
      const callId = crypto.randomUUID();

      // 2. Gửi sự kiện 'call.ringing' tới channel hiện tại
      // Sự kiện này sẽ được StreamChatProvider bên người nhận bắt được
      await channel.sendEvent({
        type: "call.ringing",
        callId: callId,
        cid: channel.cid,
      });

      // 3. Chuyển người gọi tới trang CallPage
      navigate(`/call/${callId}`);
    } catch (error) {
      console.error("Failed to start call:", error);
    }
  };

  return (
      <div className="flex items-center justify-between p-3 border-b border-base-300 bg-base-100">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="lg:hidden btn btn-ghost btn-circle btn-sm">
            <Menu className="size-5" />
          </button>
          <div className="font-bold text-lg truncate max-w-[200px] sm:max-w-md">
            {channel.data?.name || "Chat"}
          </div>
        </div>

        {/* Nút gọi video với logic mới */}
        <CallButton handleVideoCall={handleVideoCall} />
      </div>
  );
};

const ChatPage = () => {
  const { id } = useParams();
  const { chatClient, isChatClientReady } = useStreamChat();
  const [channel, setChannel] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isChatClientReady || !chatClient || !id) return;

    // Tìm hoặc tạo channel messaging với id được cung cấp
    const newChannel = chatClient.channel("messaging", id);
    setChannel(newChannel);

    // Watch channel để bắt đầu nhận tin nhắn
    newChannel.watch().catch((err) => {
      console.error("Failed to watch channel:", err);
      // Nếu lỗi (ví dụ không có quyền), có thể quay lại trang chủ
      // navigate("/");
    });

    return () => {
      // Cleanup nếu cần
    };
  }, [chatClient, isChatClientReady, id, navigate]);

  // Handler để mở sidebar trên mobile (nếu Layout hỗ trợ toggle)
  const handleToggleSidebar = () => {
    // Logic mở sidebar, có thể dùng dispatch event hoặc context UI nếu có
    // Ở đây minh họa đơn giản
    const drawerCheckbox = document.getElementById('my-drawer-2');
    if (drawerCheckbox) drawerCheckbox.checked = true;
  };

  if (!isChatClientReady || !channel) {
    return (
        <div className="h-full flex items-center justify-center">
          <ChatLoader />
        </div>
    );
  }

  return (
      <div className="h-full w-full bg-base-100 flex flex-col">
        <Channel channel={channel}>
          <Window>
            {/* Sử dụng Header tùy chỉnh chứa logic gọi */}
            <CustomHeaderWithCall onMenuClick={handleToggleSidebar} />

            <MessageList />
            <MessageInput />
          </Window>
        </Channel>
      </div>
  );
};

export default ChatPage;