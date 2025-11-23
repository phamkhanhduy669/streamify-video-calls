import { useEffect, useRef } from "react";
import { VideoIcon, PhoneOff } from "lucide-react";
import { useStreamChat } from "../context/StreamChatProvider";
import { useNavigate } from "react-router-dom";

const IncomingCallModal = () => {
    const { incomingCall, rejectCall, acceptCall } = useStreamChat();
    const navigate = useNavigate();
    const audioRef = useRef(null);

    if (!incomingCall) return null;

    useEffect(() => {
        let audio;
        try {
            const audioUrl = "/sound/notification.mp3";

            // Kiểm tra file có tồn tại trước khi tạo Audio
            fetch(audioUrl)
                .then(res => {
                    if (!res.ok) {
                        console.warn("Audio file missing:", audioUrl);
                        return;
                    }

                    audio = new Audio(audioUrl);
                    audio.loop = true;

                    const playPromise = audio.play();
                    if (playPromise) {
                        playPromise.catch(err => {
                            console.warn("Autoplay prevented:", err);
                        });
                    }
                });

        } catch (err) {
            console.error("Audio error:", err);
        }

        return () => {
            if (audio) audio.pause();
        };
    }, [incomingCall]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-base-100 p-8 rounded-2xl shadow-2xl w-80 text-center border border-base-300 transform transition-all scale-100">
                <div className="avatar mb-4 animate-bounce">
                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 mx-auto">
                        <img
                            src={incomingCall.callerImage || "/avatar.png"}
                            alt={incomingCall.callerName}
                            className="object-cover"
                        />
                    </div>
                </div>

                <h3 className="text-2xl font-bold mb-2 text-base-content">{incomingCall.callerName}</h3>
                <p className="text-base-content/70 mb-8 flex items-center justify-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
          </span>
                    Đang gọi video cho bạn...
                </p>

                <div className="flex justify-center gap-8">
                    {/* Nút Từ chối */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={rejectCall}
                            className="btn btn-error btn-circle btn-lg text-white shadow-lg hover:scale-110 transition-transform"
                        >
                            <PhoneOff className="size-8" />
                        </button>
                        <span className="text-xs font-medium opacity-70">Từ chối</span>
                    </div>

                    {/* Nút Chấp nhận */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={handleAccept}
                            className="btn btn-success btn-circle btn-lg text-white shadow-lg hover:scale-110 transition-transform animate-pulse"
                        >
                            <VideoIcon className="size-8" />
                        </button>
                        <span className="text-xs font-medium opacity-70">Trả lời</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IncomingCallModal;