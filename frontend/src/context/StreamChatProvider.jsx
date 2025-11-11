import { createContext, useContext, useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;
const StreamChatContext = createContext();

export const StreamChatProvider = ({ children }) => {
  const [chatClient, setChatClient] = useState(null);
  // ✅ SỬA LỖI 1: Luôn giữ 'isChatClientReady'
  const [isChatClientReady, setIsChatClientReady] = useState(false); 
  const [unreadMap, setUnreadMap] = useState({});
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient(); 

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  // Lấy token ra
  const token = tokenData?.token;

  useEffect(() => {
    // ✅ SỬA LỖI 2: Logic connect/disconnect an toàn
    if (!authUser || !token) {
      if (chatClient) {
        chatClient.disconnectUser();
      }
      setChatClient(null);
      setIsChatClientReady(false);
      return;
    }

    const client = StreamChat.getInstance(STREAM_API_KEY);

    const connect = async () => {
      // ✅ SỬA LỖI 3: Thêm 'try...catch'
      try {
        // Chỉ connect nếu client chưa được kết nối HOẶC là user khác
        if (!client.user || client.user.id !== authUser._id) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName, // (Đã được 'sanitizeName' ở backend)
              image: authUser.profilePic,
            },
            token
          );
        }

        // 🔔 Lắng nghe tin nhắn chat mới (bạn đã có)
        client.on("message.new", (event) => {
          if (event.user.id === authUser._id) return;
          const senderId = event.user.id;
          setUnreadMap((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
          // (toast, audio...)
          const audio = new Audio("/sound/notification.mp3");
          audio.play().catch(() => {});
          toast(`💬 Tin nhắn mới từ ${event.user.name}`);
        });

        // ✅ TÍNH NĂNG MỚI: Lắng nghe LỜI MỜI KẾT BẠN MỚI
        client.on("friendrequest_new", (event) => {
          const senderName = event.payload?.sender?.name || "Một ai đó";
          toast.success(`💌 ${senderName} đã gửi cho bạn lời mời kết bạn!`);
          queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        });

        setChatClient(client);
        setIsChatClientReady(true); // ✅ Đánh dấu sẵn sàng
      } catch (error) {
        console.error("Lỗi kết nối Stream chat:", error);
        setIsChatClientReady(false);
      }
    };

    connect();

    return () => {
      client.off("message.new");
      client.off("friendrequest_new"); // ✅ Dọn dẹp listener mới
      client.disconnectUser();
      setChatClient(null);
      setIsChatClientReady(false);
    };
  }, [authUser, token, queryClient]); // ✅ Sửa dependency

  const markAsRead = (userId) => {
    setUnreadMap((prev) => ({ ...prev, [userId]: 0 }));
  };

  return (
    <StreamChatContext.Provider value={{ chatClient, isChatClientReady, unreadMap, markAsRead }}>
      {children}
    </StreamChatContext.Provider>
  );
};

export const useStreamChat = () => useContext(StreamChatContext);
export default StreamChatProvider;