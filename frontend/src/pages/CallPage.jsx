import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

// 1. Import StreamChat
import { StreamChat } from "stream-chat";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

// Close call window, pass navigate as argument
const closeCallWindow = (navigate) => {
  if (window.opener) {
    window.close();
  } else {
    navigate("/");
  }
};

const CallPage = () => {
  const { id: callId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    if (!tokenData?.token || !authUser || !callId) return;

    let isUnmounted = false;
    let callInstance = null;

    const videoClient = StreamVideoClient.getOrCreateInstance({
      apiKey: STREAM_API_KEY,
      user: {
        id: authUser._id,
        name: authUser.fullName,
        image: authUser.profilePic,
      },
      token: tokenData.token,
    });

    const initCall = async () => {
      try {
        console.log("Initializing Call...");
        const _call = videoClient.call("default", callId);

        await _call.join({ create: true });

        if (isUnmounted) {
          await _call.leave();
          return;
        }

        setClient(videoClient);
        setCall(_call);
        callInstance = _call;
      } catch (error) {
        console.error("Error joining call:", error);
        if (!isUnmounted) toast.error("Could not join the call.");
      }
    };

    initCall();

    return () => {
      isUnmounted = true;
      if (callInstance) {
        callInstance.leave().catch((err) => console.error("Error leaving call", err));
      }
      setCall(null);
    };
  }, [tokenData, authUser, callId]);

  if (isLoading || !client || !call) return <PageLoader />;

  return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="relative w-full h-full">
          <StreamVideo client={client}>
            {/* Truyền thêm callId để component con xử lý logic kết thúc chat */}
            <StreamCall call={call}>
              <CallContent
                  callId={callId}
                  token={tokenData.token}
                  authUser={authUser}
                  navigate={navigate}
              />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>
  );
};

// --- Component Nội Dung Cuộc Gọi ---
const CallContent = ({ callId, token, authUser, navigate }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();

  const [targetEndTime, setTargetEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  // --- HÀM XỬ LÝ KẾT THÚC CUỘC GỌI & UPDATE CHAT ---
  const endCallSession = async () => {
    try {
      // 1. Kết nối Chat Client (để sửa tin nhắn)
      const chatClient = StreamChat.getInstance(STREAM_API_KEY);
      if (!chatClient.user) {
        await chatClient.connectUser(
            { id: authUser._id },
            token
        );
      }

      // 2. Tách Channel ID từ Call ID (Format: channelId_timestamp)
      // Ví dụ callId: messaging:channel-123_17000000 -> channelId: messaging:channel-123
      const channelIdStr = callId.split('_')[0];

      // Cần đảm bảo đúng định dạng channel type và id
      // Nếu channelIdStr là "messaging:XYZ", ta cần tách ra type="messaging" và id="XYZ"
      const [type, id] = channelIdStr.includes(':')
          ? channelIdStr.split(':')
          : ['messaging', channelIdStr]; // Fallback

      const channel = chatClient.channel(type, id);

      // 3. Tìm tin nhắn mời gọi của cuộc gọi này
      // Cách tốt nhất là query tin nhắn gần đây và filter theo callId
      const { messages } = await channel.query({
        messages: { limit: 30 }, // Tìm trong 30 tin nhắn gần nhất
      });

      // Tìm tin nhắn có custom_type là 'call_ring' và callId khớp
      const callMessage = messages.find(
          (m) => m.custom_type === 'call_ring' && m.callId === callId
      );

      // 4. Cập nhật tin nhắn thành "Call Ended"
      if (callMessage) {
        await chatClient.updateMessage({
          id: callMessage.id,
          text: "🚫 Call has ended",
          custom_type: "call_ended", // Đổi type để UI không hiện nút Join nữa
          attachments: [], // Xóa attachments (link video)
        });
        console.log("Updated chat message to ended.");
      }
    } catch (error) {
      console.error("Error updating chat message:", error);
    }
  };

  // Logic Timer đếm ngược
  useEffect(() => {
    if (participantCount === 1 && !targetEndTime) {
      setTargetEndTime(Date.now() + 90000);
    } else if (participantCount > 1) {
      setTargetEndTime(null);
      setTimeLeft(null);
    }
  }, [participantCount, targetEndTime]);

  // Logic Xử lý Hết giờ
  useEffect(() => {
    if (!targetEndTime) return;

    const interval = setInterval(async () => {
      const now = Date.now();
      const remaining = Math.ceil((targetEndTime - now) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);

        // Hết giờ -> Là người cuối cùng -> Kết thúc session chat
        await endCallSession();

        toast("Call ended because no one else is here.");
        closeCallWindow(navigate);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetEndTime, navigate]);

  // Logic khi bấm nút rời phòng (Leave Button)
  useEffect(() => {
    const handleManualLeave = async () => {
      if (callingState === CallingState.LEFT) {
        // Nếu mình là người cuối cùng (count <= 1), update chat
        if (participantCount <= 1) {
          await endCallSession();
        }
        closeCallWindow(navigate);
      }
    };
    handleManualLeave();
  }, [callingState, navigate, participantCount]);

  return (
      <StreamTheme>
        <div className="h-screen w-full bg-black text-white relative">
          <SpeakerLayout participantsBarPosition="bottom" />
          <CallControls />

          {/* TIMER UI */}
          {timeLeft !== null && timeLeft > 0 && (
              <div className="absolute top-24 left-1/2 -translate-x-1/2 bg-neutral-900/80 backdrop-blur-md text-white px-6 py-3 rounded-full shadow-2xl border border-white/10 z-50 flex items-center gap-3 animate-in fade-in slide-in-from-top-5 duration-300">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="font-medium text-sm tracking-wide">
                    Waiting for others... Ending in <span className="text-red-400 font-bold w-6 inline-block text-center text-lg">{timeLeft}</span>s
                </span>
              </div>
          )}
        </div>
      </StreamTheme>
  );
};

export default CallPage;