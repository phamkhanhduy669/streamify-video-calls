import { useState } from "react";
import { ChannelHeader, useChannelStateContext, useChatContext } from "stream-chat-react";
import { useNavigate } from "react-router"; // Import navigate
import AddMemberModal from "./AddMemberModal";
import GroupSettingsModal from "./GroupSettingsModal";
import { UserPlus, Settings, Video } from "lucide-react"; // Import icon Video
import useAuthUser from "../hooks/useAuthUser"; // Import hook lấy user
import toast from "react-hot-toast"; // Import toast

const CustomChannelHeader = () => {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const { authUser } = useAuthUser(); // Lấy thông tin user hiện tại
  const navigate = useNavigate(); // Hook chuyển trang

  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isGroup = Object.prototype.hasOwnProperty.call(channel.data, 'name') && channel.data.name;

  // --- LOGIC GỌI VIDEO (Chuyển từ ChatPage sang) ---
  const handleVideoCall = async () => {
    if (!channel) return;

    // Tạo Call ID duy nhất
    const callId = `${channel.id}_${Date.now()}`;
    const callUrl = `${window.location.origin}/call/${callId}`;

    try {
      // Gửi tin nhắn kích hoạt thông báo toàn cục
      await channel.sendMessage({
        text: `📞 I've started a video call. If you don't see the notification, click here: ${callUrl}`,
        custom_type: "call_ring",
        callId,
        callerName: authUser.fullName || authUser.name || "Friend",
        callerImage: authUser.profilePic || "",
        attachments: [{ type: "video_call", call_url: callUrl }],
      });

      // Chuyển hướng người gọi
      navigate(`/call/${callId}`);
      toast.success("Starting video call...");
    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Failed to start call");
    }
  };

  return (
      <div className="relative">
        <ChannelHeader />

        {/* --- Nút gọi Video (Mới thêm) --- */}
        <button
            className={`absolute top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip z-50 ${
                isGroup ? "right-44" : "right-4"
            }`} // Logic vị trí: Nếu là nhóm thì đẩy sang trái (tránh đè nút Settings), nếu không thì sát phải
            data-tip="Video Call"
            onClick={handleVideoCall}
        >
          <Video size={20} />
        </button>

        {isGroup && (
            <>
              <button
                  className="absolute right-32 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip z-50"
                  data-tip="Add Members"
                  onClick={() => setIsAddMemberModalOpen(true)}
              >
                <UserPlus size={20} />
              </button>
              <button
                  className="absolute right-20 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip z-50"
                  data-tip="Group Settings"
                  onClick={() => setIsSettingsModalOpen(true)}
              >
                <Settings size={20} />
              </button>
            </>
        )}

        {isAddMemberModalOpen && <AddMemberModal onClose={() => setIsAddMemberModalOpen(false)} />}
        {isSettingsModalOpen && (
            <GroupSettingsModal
                channel={channel}
                currentUserId={client.userID}
                onClose={() => setIsSettingsModalOpen(false)}
            />
        )}
      </div>
  );
};

export default CustomChannelHeader;