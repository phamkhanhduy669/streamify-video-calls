import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";

import {
  StreamVideo,
  StreamVideoClient,
  StreamCall,
  CallControls,
  SpeakerLayout,
  StreamTheme,
  CallingState,
  useCallStateHooks,
  ParticipantView,
} from "@stream-io/video-react-sdk";

import "@stream-io/video-react-sdk/dist/css/styles.css";
import toast from "react-hot-toast";
import PageLoader from "../components/PageLoader";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const CallPage = () => {
  const { id: callId } = useParams();
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  // Ref để kiểm soát việc join call chỉ chạy 1 lần
  const isJoiningRef = useRef(false);

  const { authUser, isLoading } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    // Nếu thiếu dữ liệu hoặc đang trong quá trình join thì dừng lại
    if (!tokenData?.token || !authUser || !callId || isJoiningRef.current) return;

    // Đánh dấu là đang xử lý để tránh useEffect chạy 2 lần (Strict Mode)
    isJoiningRef.current = true;

    let callInstance;

    // Sử dụng getOrCreateInstance để singleton client, tránh lỗi "Client already exists"
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
        callInstance = videoClient.call("default", callId);

        // Tham gia cuộc gọi
        await callInstance.join({ create: true });
        console.log("Joined call successfully");

        setClient(videoClient);
        setCall(callInstance);
      } catch (error) {
        console.error("Error joining call:", error);
        toast.error("Could not join the call.");
        isJoiningRef.current = false; // Reset nếu lỗi để có thể thử lại
      }
    };

    initCall();

    // Cleanup function
    return () => {
      console.log("Cleaning up CallPage...");
      // Chỉ rời cuộc gọi khi component thực sự unmount (rời trang)
      if (callInstance) {
        callInstance.leave().catch((err) => console.error("Error leaving call", err));
        setCall(null);
      }
      // Reset ref để lần sau vào lại trang có thể join được
      isJoiningRef.current = false;
    };
  }, [tokenData, authUser, callId]);

  if (isLoading || !client || !call) return <PageLoader />;

  return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="relative w-full h-full">
          <StreamVideo client={client}>
            <StreamCall call={call}>
              <CallContent />
            </StreamCall>
          </StreamVideo>
        </div>
      </div>
  );
};

const CallContent = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const navigate = useNavigate();

  useEffect(() => {
    if (callingState === CallingState.LEFT) {
      navigate("/");
    }
  }, [callingState, navigate]);

  return (
      <StreamTheme>
        <div className="h-screen w-full bg-black text-white">
          {/* SpeakerLayout tự động hiển thị người nói chính và danh sách người khác.
             participantsBarPosition="bottom" giúp bố cục gọn gàng hơn */}
          <SpeakerLayout participantsBarPosition="bottom" />
          <CallControls />
        </div>
      </StreamTheme>
  );
};

export default CallPage;