import { createContext, useContext, useEffect, useState, useRef } from "react";
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

  // Refs
  const ringtoneRef = useRef(null);
  const currentCallIdRef = useRef(null); 

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  const token = tokenData?.token;

  // --- HÀM TẮT CHUÔNG & ĐÓNG TOAST ---
  const stopRingtone = () => {
    // Tắt nhạc
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
      ringtoneRef.current = null;
    }
    // Đóng Toast cũ
    if (currentCallIdRef.current) {
      toast.dismiss(currentCallIdRef.current);
      currentCallIdRef.current = null;
    }
  };

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

        // Xóa listener cũ
        client.off("message.new");
        client.off("message.updated");

        // --- 1. SỰ KIỆN TIN NHẮN MỚI ---
        client.on("message.new", (event) => {
          if (event.user.id === authUser._id) return;

          // [LOGIC CUỘC GỌI]
          if (event.message.custom_type === "call_ring") {
            const { callId, callerName, callerImage } = event.message;

            // [FIX] Kiểm tra trùng lặp: Nếu đang đổ chuông cho cùng callId thì bỏ qua
            if (currentCallIdRef.current === callId) {
              return;
            }

            // Dừng cuộc gọi cũ (nếu có) trước khi nhận mới
            stopRingtone();
            
            // Set ID mới ngay lập tức
            currentCallIdRef.current = callId;

            // Phát nhạc
            try {
              // Đổi lại 'notification.mp3' nếu bạn chưa có file 'ringtone.mp3'
              const audio = new Audio("/sound/ringtone.mp3"); 
              audio.loop = true;
              audio.play().catch((err) => console.warn("Audio play blocked (cần tương tác user):", err));
              ringtoneRef.current = audio;
            } catch (e) {
              console.error("Audio error:", e);
            }

            // Hiển thị Toast (Dùng CSS Tailwind cơ bản để đảm bảo hiện)
            toast.custom(
                (t) => (
                    <div
                        className={`${
                            t.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
                        } max-w-md w-full bg-white shadow-xl rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 transform transition-all duration-300 ease-in-out`}
                    >
                      <div className="flex-1 w-0 p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            <img
                                className="h-10 w-10 rounded-full object-cover"
                                src={callerImage || "/i.png"}
                                alt={callerName}
                            />
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-bold text-gray-900">
                              Incoming Call
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              {callerName} is calling...
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col border-l border-gray-200">
                        <button
                            onClick={() => {
                              stopRingtone(); // Tắt chuông + đóng toast
                              
                              const width = 1280; const height = 720;
                              const left = (window.screen.width - width) / 2;
                              const top = (window.screen.height - height) / 2;
                              const callWindow = window.open(`/call/${callId}`, "StreamCallWindow", `width=${width},height=${height},top=${top},left=${left}`);
                              if (window.focus && callWindow) callWindow.focus();
                            }}
                            className="w-full border border-transparent rounded-tr-lg p-3 flex items-center justify-center text-sm font-medium text-indigo-600 hover:bg-indigo-50 focus:outline-none"
                        >
                          Accept
                        </button>
                        <button
                            onClick={() => {
                              stopRingtone(); // Tắt chuông + đóng toast
                            }}
                            className="w-full border-t border-gray-200 rounded-br-lg p-3 flex items-center justify-center text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none"
                        >
                          Ignore
                        </button>
                      </div>
                    </div>
                ),
                {
                  duration: 90000,
                  position: "top-center",
                  id: callId, // Quan trọng: ID phải khớp để dismiss hoạt động
                }
            );
            return;
          }

          // Tin nhắn thường
          setUnreadMap((prev) => ({ ...prev, [event.user.id]: (prev[event.user.id] || 0) + 1 }));
          try {
             const audio = new Audio("/sound/notification.mp3");
             audio.play().catch(() => {});
          } catch {}
          toast(`💬 New message from ${event.user.name}`);
        });

        // --- 2. SỰ KIỆN UPDATE (Người gọi tắt máy) ---
        client.on("message.updated", (event) => {
            if (event.message.custom_type === "call_ended") {
                // Kiểm tra nếu đúng là cuộc gọi đang đổ chuông thì mới tắt
                if (currentCallIdRef.current === event.message.callId || currentCallIdRef.current === event.message.id) {
                    console.log("Call ended remotely.");
                    stopRingtone();
                } else if (currentCallIdRef.current) {
                    // Fallback: nếu không khớp ID nhưng có tin nhắn call_ended, cũng nên tắt cho chắc
                     stopRingtone();
                }
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
      stopRingtone();
      client.off("message.new");
      client.off("message.updated");
      client.disconnectUser();
      setChatClient(null);
      setIsChatClientReady(false);
    };
  }, [authUser, token, queryClient]);

  const markAsRead = (userId) => setUnreadMap((prev) => ({ ...prev, [userId]: 0 }));

  return (
      <StreamChatContext.Provider value={{ chatClient, isChatClientReady, unreadMap, markAsRead }}>
        {children}
      </StreamChatContext.Provider>
  );
};

export const useStreamChat = () => useContext(StreamChatContext);
export default StreamChatProvider;