import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useStreamChat } from "../context/StreamChatProvider";
import useAuthUser from "../hooks/useAuthUser";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import toast from "react-hot-toast";

const ChatPage = () => {
  const { id: targetUserId } = useParams();
  const { chatClient } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chatClient || !chatClient.user || !authUser) return;
    

    const setupChannel = async () => {
      if (!chatClient || !authUser) {
        console.warn("⚠️ chatClient hoặc authUser chưa sẵn sàng");
        return;
      }

      // 🔹 Chờ cho tới khi connectUser hoàn tất
      if (!chatClient.user) {
        console.warn("⚠️ Chat client chưa connectUser, chờ 500ms...");
        setTimeout(setupChannel, 500);
        return;
      }


      try {
        const channelId = [authUser._id, targetUserId].sort().join("-");
        const currChannel = chatClient.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        await currChannel.markRead();
        setChannel(currChannel);
      } catch (err) {
        console.error("Chat channel setup error:", err);
        toast.error("Could not load chat.");
      } finally {
        setLoading(false);
      }
    };

    setupChannel();
  }, [chatClient, authUser, targetUserId]);

  if (loading || !chatClient || !channel) return <ChatLoader />;

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
          <div className="w-full relative">
            <CallButton handleVideoCall={handleVideoCall} />
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput focus />
            </Window>
          </div>
          <Thread />
        </Channel>
      </Chat>
    </div>
  );
};

export default ChatPage;
