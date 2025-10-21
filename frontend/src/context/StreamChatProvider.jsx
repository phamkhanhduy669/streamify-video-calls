
import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const StreamChatContext = createContext();

export const StreamChatProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  const [unreadMap, setUnreadMap] = useState({}); // ✅ userId → số tin chưa đọc
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!authUser || !tokenData?.token) return;
    const client = StreamChat.getInstance(STREAM_API_KEY);

    const connect = async () => {
      await client.connectUser(
        {
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.profilePic,
        },
        tokenData.token
      );

      // 🔔 Sự kiện nhận tin mới
      client.on("message.new", (event) => {
        if (event.user.id === authUser._id) return; // tin mình gửi thì bỏ qua

        const senderId = event.user.id;

        setUnreadMap((prev) => ({
          ...prev,
          [senderId]: (prev[senderId] || 0) + 1,
        }));

        const audio = new Audio("/sound/notification.mp3");
        audio.play().catch(() => {});
        toast(`💬 Tin nhắn mới từ ${event.user.name}`);
      });

      setChatClient(client);
    };

    connect();

    return () => client.disconnectUser();
  }, [authUser, tokenData]);

  // ✅ Khi đọc đoạn chat → reset unread
  const markAsRead = (userId) => {
    setUnreadMap((prev) => ({ ...prev, [userId]: 0 }));
  };

  return (
    <StreamChatContext.Provider value={{ chatClient, unreadMap, markAsRead }}>
      {children}
    </StreamChatContext.Provider>
  );
};

export const useStreamChat = () => useContext(StreamChatContext);
export default StreamChatProvider;
