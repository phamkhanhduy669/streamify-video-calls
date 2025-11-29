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
  const [isChatClientReady, setIsChatClientReady] = useState(false);
  const [unreadMap, setUnreadMap] = useState({});
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const token = tokenData?.token;

  useEffect(() => {
    if (!authUser || !token) {
      if (chatClient) chatClient.disconnectUser();
      setChatClient(null);
      setIsChatClientReady(false);
      return;
    }

    const client = StreamChat.getInstance(STREAM_API_KEY);

    const connect = async () => {
      try {
        if (!client.user || client.user.id !== authUser._id) {
          await client.connectUser(
            {
              id: authUser._id,
              name: authUser.fullName,
              image: authUser.profilePic,
            },
            token
          );
        }

        client.on("message.new", (event) => {
          if (event.user.id === authUser._id) return;
          // Debug log event
          console.log("[StreamChat] message.new event:", event);
          const senderId = event.user.id;
          setUnreadMap((prev) => ({
            ...prev,
            [senderId]: (prev[senderId] || 0) + 1,
          }));
          try {
            const audio = new Audio("/sound/notification.mp3");
            audio.play().catch(() => {});
          } catch {
            // ignore audio error
          }
          if (!event.channel || !event.channel.state?.members) {
            console.warn("[StreamChat] event.channel is undefined or missing members", event);
            const memberCount = event.channel_member_count || 2;
            const channelName = event.channel_custom?.name || event.cid || "Group";
            if (memberCount > 2) {
              toast(`💬 New group message in ${channelName}`);
            } else {
              toast(`💬 New message from ${event.user.name}`);
            }
            return;
          }
          const channelName = event.channel.data?.name;
          const channelType = event.channel.type;
          const memberCount = event.channel.state?.members
            ? Object.keys(event.channel.state.members).length
            : 2;
          console.log("[StreamChat] memberCount:", memberCount, "channel name:", channelName, "channelType:", channelType);
          console.log("[StreamChat] channel.data:", event.channel.data);
          console.log("[StreamChat] channel:", event.channel);
          // Nếu channel có tên, số thành viên > 2, hoặc type là 'group', thì là nhóm
          if (channelName || memberCount > 2 || channelType === "group") {
            toast.success(
              `💬 Tin nhắn mới trong nhóm: ${channelName || "Group"}`
            );
          } else {
            toast(`💬 New message from ${event.user.name}`);
          }
        });

        client.on("friendrequest_new", (event) => {
          const senderName = event.payload?.sender?.name || "Someone";
          toast.success(`💌 ${senderName} sent you a friend request!`);
          queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        });

        client.on("notification_new", (event) => {
            const { type, message } = event.payload;
            
            // Hiển thị Toast
            // Bạn có thể tùy chỉnh icon dựa trên type (like/comment)
            const icon = type === "like" ? "❤️" : "💬";
            
            toast(message, {
                icon: icon,
                duration: 4000,
                position: "top-right", // Hiện góc trên phải cho dễ thấy
                style: {
                    background: '#333',
                    color: '#fff',
                },
            });
        });

        client.on("member.added", (event) => {
          if (event.user?.id === authUser._id) {
            try {
              const audio = new Audio("/sound/notification.mp3");
              audio.play().catch(() => {});
            } catch {
              // ignore audio error
            }
            toast.success("You have been added to a chat group!");
          }
        });

        setChatClient(client);
        setIsChatClientReady(true);
      } catch (error) {
        console.error("Lỗi kết nối Stream chat:", error);
        setIsChatClientReady(false);
      }
    };

    connect();

    return () => {
      client.off("message.new");
      client.off("friendrequest_new");
      client.off("member.added");
      client.off("notification_new");
      client.disconnectUser();
      setChatClient(null);
      setIsChatClientReady(false);
    };
  }, [authUser, token, queryClient]);

  const markAsRead = (userId) => {
    setUnreadMap((prev) => ({ ...prev, [userId]: 0 }));
  };

  return (
    <StreamChatContext.Provider
      value={{ chatClient, isChatClientReady, unreadMap, markAsRead }}
    >
      {children}
    </StreamChatContext.Provider>
  );
};

export const useStreamChat = () => useContext(StreamChatContext);
export default StreamChatProvider;