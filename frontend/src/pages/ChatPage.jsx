import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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
import toast from "react-hot-toast";
import CustomChannelHeader from "../components/CustomChannelHeader";
import CustomMessageText from "../components/CustomMessageText";
import CustomMessageInput from "../components/CustomMessageInput";
import { ReplyProvider } from "../context/ReplyContext";

const ChatPage = () => {
  const { id: channelId } = useParams();
  const { chatClient, isChatClientReady } = useStreamChat();
  const { authUser } = useAuthUser();

  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);

  // Setup Channel
  useEffect(() => {
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

  if (!isChatClientReady || loading || !chatClient || !channel) return <ChatLoader />;

  return (
      <div className="h-[93vh] bg-base-200">
        <Chat client={chatClient}>
          <Channel channel={channel} Message={CustomMessageText}>
            <ReplyProvider>
              <div className="w-full relative h-full flex flex-col bg-transparent">

                {/* Đã xóa CallButton ở đây */}

                <Window>
                  {/* CustomChannelHeader giờ đã chứa nút gọi video */}
                  <CustomChannelHeader />

                  <MessageList />

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