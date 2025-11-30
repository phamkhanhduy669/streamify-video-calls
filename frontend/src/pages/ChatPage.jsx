import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useStreamChat } from "../context/StreamChatProvider";
import useAuthUser from "../hooks/useAuthUser";

import {
  Channel,
  Chat,
  MessageList,
  Window,
  Thread,
  MessageSimple,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import toast from "react-hot-toast";
import CustomChannelHeader from "../components/CustomChannelHeader";
import CustomMessageText from "../components/CustomMessageText";

// 1. IMPORT CÁC FILE BẠN ĐÃ TẠO
import CustomMessageInput from "../components/CustomMessageInput"; 
import { ReplyProvider } from "../context/ReplyContext";

// 2. Wrapper để giữ Avatar + Giao diện của bạn
const CustomMessageWrapper = (props) => {
  return <MessageSimple {...props} MessageText={CustomMessageText} />;
};

const ChatPage = () => {
  const { id: channelId } = useParams();
  const { chatClient } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Channel
  useEffect(() => {
    if (!chatClient || !chatClient.user || !authUser) return;
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
  }, [chatClient, authUser, channelId]);

  const handleVideoCall = () => {
    const callUrl = `${window.location.origin}/call/${channel.id}`;
    channel.sendMessage({
      text: "📞 Incoming Video Call...", 
      attachments: [{ type: "video_call", call_url: callUrl }],
    });
    window.open(callUrl, "_blank");
    toast.success("Starting video call...");
  };

  if (loading || !chatClient || !channel) return <ChatLoader />;

  return (
    <div className="h-[93vh] bg-base-200">
      <Chat client={chatClient}>
        {/* Sử dụng CustomMessageWrapper để có Avatar + Text Custom */}
        <Channel channel={channel} Message={CustomMessageText}>
          
          {/* 3. QUAN TRỌNG: Bọc ReplyProvider để tính năng Reply hoạt động */}
          <ReplyProvider>
            <div className="w-full relative h-full flex flex-col bg-transparent">
                
                {/* Nút gọi video */}
                <div className="absolute top-3 right-4 z-50">
                   <CallButton handleVideoCall={handleVideoCall} />
                </div> 

                <Window>
                  <CustomChannelHeader />
                  <MessageList />
                  
                  {/* 4. DÙNG INPUT TÙY CHỈNH (Thay vì MessageInput gốc) */}
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