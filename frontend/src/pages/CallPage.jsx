import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import { axiosInstance } from "../lib/axios";

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
// Định nghĩa URL Backend để dùng cho sendBeacon (cần URL tuyệt đối)
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

// Helper: Đóng cửa sổ
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
            <StreamCall call={call}>
              <CallContent
                  callId={callId}
                  navigate={navigate}
              />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>
  );
};

// --- Component Nội Dung Cuộc Gọi ---
const CallContent = ({ callId, navigate }) => {
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount(); // Stream SDK tự cập nhật số lượng người

  const [targetEndTime, setTargetEndTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [hasEnded, setHasEnded] = useState(false);

  // --- HÀM GỌI API BACKEND (Dùng cho nút bấm đỏ & hết giờ) ---
  const endCallSession = async () => {
    if (hasEnded) return;
    setHasEnded(true);

    try {
      console.log("Ending call session...");
      await axiosInstance.post("/chat/end-call", { callId });
    } catch (error) {
      console.error("Error ending call session:", error);
    }
  };

  // --- LOGIC MỚI: XỬ LÝ ĐÓNG CỬA SỔ / TAB ---
  // Logic này y hệt logic nút đỏ: Chỉ end call nếu participantCount <= 1
  useEffect(() => {
    const handleWindowClose = () => {
      // Kiểm tra ngay tại thời điểm đóng tab
      if (participantCount <= 1) {
        const url = `${API_URL}/api/chat/end-call`;
        const data = JSON.stringify({ callId });
        
        // Tạo Blob để backend hiểu là application/json
        const blob = new Blob([data], { type: 'application/json' });

        // sendBeacon gửi request ngầm định bất chấp cửa sổ đóng
        navigator.sendBeacon(url, blob);
      }
    };

    window.addEventListener("beforeunload", handleWindowClose);

    return () => {
      window.removeEventListener("beforeunload", handleWindowClose);
    };
  }, [callId, participantCount]); // Dependencies quan trọng để lấy đúng số count mới nhất
  // -----------------------------------------------------------

  // Logic Timer: Nếu còn 1 người -> set thời gian đếm ngược
  useEffect(() => {
    if (participantCount === 1 && !targetEndTime) {
      setTargetEndTime(Date.now() + 90000); // 1.5 phút
    } else if (participantCount > 1) {
      setTargetEndTime(null);
      setTimeLeft(null);
      setHasEnded(false);
    }
  }, [participantCount, targetEndTime]);

  // Logic Timer: Chạy đồng hồ
  useEffect(() => {
    if (!targetEndTime) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.ceil((targetEndTime - now) / 1000);

      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft(0);

        // Hết giờ -> Kết thúc
        endCallSession().then(() => {
            toast("Call ended because no one else is here.");
            closeCallWindow(navigate);
        });
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetEndTime, navigate]);

  // Logic: Rời phòng thủ công (Nút đỏ)
  useEffect(() => {
    const handleManualLeave = async () => {
      if (callingState === CallingState.LEFT) {
        // Logic gốc của bạn: Nếu mình rời đi và phòng không còn ai
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

          {/* UI ĐẾM NGƯỢC */}
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