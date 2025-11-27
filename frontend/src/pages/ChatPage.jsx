//
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import toast from "react-hot-toast";
import CustomChannelHeader from "../components/CustomChannelHeader";

const ChatPage = () => {
  const { id: channelId } = useParams();
  const navigate = useNavigate();
  const { chatClient, isChatClientReady } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isChatClientReady || !chatClient || !chatClient.user || !authUser) return;

    const setupChannel = async () => {
      try {
        if (!channelId) {
          setLoading(false);
          return;
        }
        const currChannel = chatClient.channel("messaging", channelId);
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

    return () => {
      setChannel(null);
      setLoading(true);
    };
  }, [chatClient, authUser, channelId, isChatClientReady]);

  useEffect(() => {
    if (!channel || !chatClient?.user?.id) return;
    const handleMemberRemoved = (event) => {
      if (event.user?.id === chatClient.user.id) {
        window.location.href = "/";
      }
    };
    channel.on('member.removed', handleMemberRemoved);
    return () => {
      channel.off('member.removed', handleMemberRemoved);
    };
  }, [channel, chatClient]);

  if (!isChatClientReady || loading || !chatClient || !channel) return <ChatLoader />;

  const handleVideoCall = async () => {
    if (!channel) return;
    const callId = channel.id;
    const callUrl = `${window.location.origin}/call/${callId}`;

    // Gửi tin nhắn kích hoạt cuộc gọi toàn cục
    await channel.sendMessage({
      text: `📞 I've started a video call. If you don't see the notification, click here: ${callUrl}`,
      custom_type: "call_ring",
      callId,
      callerName: authUser.fullName || authUser.name || "Friend",
      callerImage: authUser.profilePic || "",
    });

    // Người gọi vào phòng
    navigate(`/call/${callId}`);
  };

  return (
      <div className="h-[93vh]">
        <Chat client={chatClient}>
          <Channel channel={channel}>
            <div className="w-full relative">
              <Window>
                <CustomChannelHeader handleVideoCall={handleVideoCall} />
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