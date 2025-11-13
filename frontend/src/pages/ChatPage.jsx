import { useEffect, useState } from "react";
import { useParams } from "react-router";
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
  const { chatClient } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);

  // Khi channelId thay đổi, luôn gọi lại channel.watch và reset state
  useEffect(() => {
    if (!chatClient || !chatClient.user || !authUser) return;

    const setupChannel = async () => {
      if (!chatClient || !authUser) {
        console.warn("⚠️ chatClient hoặc authUser chưa sẵn sàng");
        return;
      }
      if (!chatClient.user) {
        console.warn("⚠️ Chat client chưa connectUser, chờ 500ms...");
        setTimeout(setupChannel, 500);
        return;
      }
      try {
        if (!channelId) {
          console.warn("⚠️ channelId chưa được cung cấp trong route");
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
  }, [chatClient, authUser, channelId]);

  // Nếu bị kick khỏi nhóm, văng về trang chủ
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
  const [loading, setLoading] = useState(true);

  // Khi channelId thay đổi, luôn gọi lại channel.watch và reset state
  useEffect(() => {
    if (!chatClient || !chatClient.user || !authUser) return;

    const setupChannel = async () => {
      if (!chatClient || !authUser) {
        console.warn("⚠️ chatClient hoặc authUser chưa sẵn sàng");
        return;
      }
      if (!chatClient.user) {
        console.warn("⚠️ Chat client chưa connectUser, chờ 500ms...");
        setTimeout(setupChannel, 500);
        return;
      }
      try {
        if (!channelId) {
          console.warn("⚠️ channelId chưa được cung cấp trong route");
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
  }, [chatClient, authUser, channelId]);


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
              <CustomChannelHeader />
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