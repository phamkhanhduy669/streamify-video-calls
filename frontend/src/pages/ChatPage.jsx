//
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom"; // Sửa: Dùng react-router-dom
import { useStreamChat } from "../context/StreamChatProvider";
import useAuthUser from "../hooks/useAuthUser";

import {
  Channel,
  Chat,
  MessageList,
  Window,
  Thread,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import toast from "react-hot-toast";
import CustomChannelHeader from "../components/CustomChannelHeader";
import CustomMessageText from "../components/CustomMessageText";

// Import các component tùy chỉnh của bạn
import CustomMessageInput from "../components/CustomMessageInput";
import { ReplyProvider } from "../context/ReplyContext";

const ChatPage = () => {
  const { id: channelId } = useParams();
  const navigate = useNavigate();
  const { chatClient, isChatClientReady } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Channel
  useEffect(() => {
    // Kiểm tra isChatClientReady để tránh lỗi kết nối
    if (!isChatClientReady || !chatClient || !chatClient.user || !authUser) return;

    const setupChannel = async () => {
      try {
        if (!channelId) { setLoading(false); return; }
        const currChannel = chatClient.channel("messaging", channelId);
        await currChannel.watch();
        if (document.hasFocus()) await currChannel.markRead();
        setChannel(currChannel);
      } catch (err) {
        console.error(err);
        toast.error("Could not load chat.");
      } finally {
        setLoading(false);
      }
    };
    setupChannel();
    return () => { setChannel(null); setLoading(true); };
  }, [chatClient, authUser, channelId, isChatClientReady]);

  // --- HÀM GỌI VIDEO MỚI ---
  const handleVideoCall = async () => {
    if (!channel) return;

    // [QUAN TRỌNG] Tạo Call ID duy nhất bằng timestamp
    // Nếu dùng lại channel.id, thông báo lần 2 sẽ bị trùng ID và không hiện
    const callId = `${channel.id}_${Date.now()}`;
    const callUrl = `${window.location.origin}/call/${callId}`;

    try {
      // Gửi tin nhắn kích hoạt thông báo (custom_type="call_ring")
      await channel.sendMessage({
        text: `📞 I've started a video call. If you don't see the notification, click here: ${callUrl}`,
        custom_type: "call_ring",
        // Các dữ liệu này được StreamChatProvider dùng để hiển thị Toast
        callId,
        callerName: authUser.fullName || authUser.name || "Friend",
        callerImage: authUser.profilePic || "",
        // Giữ attachment để hiển thị link nếu cần
        attachments: [{ type: "video_call", call_url: callUrl }],
      });

      // Người gọi tự động vào phòng
      navigate(`/call/${callId}`);
      toast.success("Starting video call...");
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to start call");
    }
  };

  if (!isChatClientReady || loading || !chatClient || !channel) return <ChatLoader />;

  return (
      <div className="h-[93vh] bg-base-200">
        <Chat client={chatClient}>
          <Channel channel={channel} Message={CustomMessageText}>

            <ReplyProvider>
              <div className="w-full relative h-full flex flex-col bg-transparent">

                {/* Nút gọi video */}
                <div className="absolute top-3 right-4 z-50">
                  <CallButton handleVideoCall={handleVideoCall} />
                </div>

                <Window>
                  <CustomChannelHeader />
                  <MessageList />

                  {/* Custom Input */}
                  <CustomMessageInput />

                </Window>
              </div>
            </ReplyProvider>

            <Thread />
          </Channel>
        </Chat>
      </div>
  );
};

export default ChatPage;