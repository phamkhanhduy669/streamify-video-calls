//
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

          // --- [START] LOGIC HIỂN THỊ THÔNG BÁO CUỘC GỌI ---
          if (event.message.custom_type === "call_ring") {
            const { callId, callerName, callerImage } = event.message;

            // Phát âm thanh
            try {
              const audio = new Audio("/sound/notification.mp3");
              audio.play().catch(() => {});
            } catch (e) {
              // Ignore audio error
            }

            // Hiển thị Toast thông báo cuộc gọi
            toast.custom(
                (t) => (
                    <div
                        className={`${
                            t.visible ? "animate-enter" : "animate-leave"
                        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
                    >
                      <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={callerImage || "https://avatar.iran.liara.run/public"}
                                alt={callerName}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              Incoming Call
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {callerName} is calling you...
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-gray-200">
                        <button
                            onClick={() => {
                              toast.dismiss(t.id);
                              // Chuyển hướng đến trang cuộc gọi
                              window.location.href = `/call/${callId}`;
                            }}
                            className="w-full border border-transparent rounded-tr-lg p-3 flex items-center justify-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          Accept
                        </button>
                        <button
                            onClick={() => toast.dismiss(t.id)}
                            className="w-full border-t border-gray-200 rounded-br-lg p-3 flex items-center justify-center text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                ),
                {
                  duration: 20000, // Đổ chuông 20 giây
                  position: "top-center",
                  id: callId, // [QUAN TRỌNG] Gán ID để tránh trùng lặp, nhưng vẫn đảm bảo hiện nếu ID khác nhau
                }
            );
            return; // Dừng xử lý, không hiện thông báo tin nhắn thường
          }
          // --- [END] LOGIC CUỘC GỌI ---

          // Logic tin nhắn thường (Giữ nguyên)
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
            // ignore
          }
          if (!event.channel || !event.channel.state?.members) {
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
          const icon = type === "like" ? "❤️" : "💬";

          toast(message, {
            icon: icon,
            duration: 4000,
            position: "top-right",
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
              // ignore
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