import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStreamChat } from "../context/StreamChatProvider";
import useAuthUser from "../hooks/useAuthUser";

import {
  Channel,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import toast from "react-hot-toast";
import CustomChannelHeader from "../components/CustomChannelHeader";

const ChatPage = () => {
  const { id: channelId } = useParams();
  // Lấy thêm isChatClientReady từ Context để biết khi nào Stream đã kết nối xong
  const { chatClient, isChatClientReady } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup channel
  useEffect(() => {
    // Chỉ chạy logic khi:
    // 1. Client đã sẵn sàng (isChatClientReady = true)
    // 2. Đã có user đăng nhập
    // 3. Có channelId trên URL
    if (!isChatClientReady || !chatClient || !authUser || !channelId) return;

    let isMounted = true;

    const setupChannel = async () => {
      try {
        // Không cần gọi connectUser ở đây nữa vì Provider đã làm rồi.
        // Chỉ cần khởi tạo channel:
        const currChannel = chatClient.channel("messaging", channelId);

        await currChannel.watch();

        // Mark read nếu cần
        // await currChannel.markRead();

        if (isMounted) {
          setChannel(currChannel);
          setLoading(false);
        }
      } catch (err) {
        console.error("Chat channel setup error:", err);
        if (isMounted) {
          toast.error("Could not load chat.");
          setLoading(false);
        }
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      setChannel(null);
      setLoading(true);
    };
  }, [isChatClientReady, chatClient, authUser, channelId]);

  // Handle member removed event
  useEffect(() => {
    if (!channel || !chatClient?.user?.id) return;

    const handleMemberRemoved = (event) => {
      if (event.user?.id === chatClient.user.id) {
        window.location.href = "/";
      }
    };

    channel.on("member.removed", handleMemberRemoved);

    return () => {
      channel.off("member.removed", handleMemberRemoved);
    };
  }, [channel, chatClient]);

  // Guard Clause: Hiện loader nếu chưa có user, chưa connect xong, hoặc đang load channel
  if (!authUser || !isChatClientReady || loading || !channel) return <ChatLoader />;

  const handleVideoCall = () => {
    const callUrl = `${window.location.origin}/call/${channel.id}`;
    channel.sendMessage({
      text: `I've started a video call. Join me here: ${callUrl}`,
    });
    toast.success("Video call link sent successfully!");
  };

  return (
      <div className="h-[93vh]">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="flex h-full w-full overflow-hidden">

              <div className="flex-1 relative w-full h-full">
                <Window>
                  <CustomChannelHeader />
                  <MessageList />
                  <MessageInput focus />
                </Window>

                {/* --- SỬA Ở ĐÂY --- */}
                {/* 1. Di chuyển CallButton xuống dưới Window để không bị che */}
                {/* 2. Bọc trong div absolute + z-50 để ghim cứng vào góc phải và nổi lên trên */}
                <div className="absolute top-2 right-2 z-50">
                  <CallButton handleVideoCall={handleVideoCall} />
                </div>
                {/* ----------------- */}

              </div>

              <Thread />
            </div>
          </Channel>
        </Chat>
      </div>
  );
};

export default ChatPage;