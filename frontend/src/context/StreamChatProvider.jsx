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

  // State mới quản lý cuộc gọi đến
  const [incomingCall, setIncomingCall] = useState(null);

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

        // --- Lắng nghe sự kiện Message ---
        client.on("message.new", (event) => {
          if (event.user.id === authUser._id) return;

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

        // --- Lắng nghe sự kiện Friend Request ---
        client.on("friendrequest_new", (event) => {
          const senderName = event.payload?.sender?.name || "Someone";
          toast.success(`💌 ${senderName} sent you a friend request!`);
          queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
        });

        // --- Lắng nghe sự kiện được thêm vào nhóm ---
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

        // --- MỚI: Lắng nghe sự kiện Cuộc gọi đến (Custom Event) ---
        client.on("call.ringing", (event) => {
          console.log("[StreamChat] Incoming call event:", event);

          const caller = event?.caller || event?.user;

          if (!caller) {
            console.warn("call.ringing event does not include caller");
            return;
          }

          console.log("Incoming call event:", event);
          console.log("event.user =", event.user);

          // Bỏ qua nếu chính mình gọi
          if (caller.id === authUser._id) return;

          setIncomingCall({
            callId: event.call_id ?? event.callId,
            callerName: caller.name,
            callerImage: caller.image,
            channelCid: event.cid,
          });
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
      client.off("call.ringing"); // Cleanup listener
      client.disconnectUser();
      setChatClient(null);
      setIsChatClientReady(false);
    };
  }, [authUser, token, queryClient]);

  const markAsRead = (userId) => {
    setUnreadMap((prev) => ({ ...prev, [userId]: 0 }));
  };

  // --- Logic xử lý cuộc gọi ---
  const acceptCall = () => {
    if (!incomingCall) return null;
    const callId = incomingCall.callId;
    setIncomingCall(null); // Đóng modal
    return callId; // Trả về ID để component UI thực hiện navigate
  };

  const rejectCall = () => {
    setIncomingCall(null); // Đóng modal
    // Có thể thêm logic gửi event 'call.rejected' lại cho người gọi nếu muốn
  };

  return (
      <StreamChatContext.Provider
          value={{
            chatClient,
            isChatClientReady,
            unreadMap,
            markAsRead,
            // Expose thêm các giá trị mới
            incomingCall,
            acceptCall,
            rejectCall
          }}
      >
        {children}
      </StreamChatContext.Provider>
  );
};

export const useStreamChat = () => useContext(StreamChatContext);
export default StreamChatProvider;