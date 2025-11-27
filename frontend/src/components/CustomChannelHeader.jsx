//
import { useState } from "react";
import { ChannelHeader, useChannelStateContext, useChatContext } from "stream-chat-react";
import AddMemberModal from "./AddMemberModal";
import GroupSettingsModal from "./GroupSettingsModal";
import { UserPlus, Settings, Video } from "lucide-react"; // Import thêm icon Video

// Nhận prop handleVideoCall
const CustomChannelHeader = ({ handleVideoCall }) => {
  const { channel } = useChannelStateContext();
  const { client } = useChatContext();
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const isGroup = Object.prototype.hasOwnProperty.call(channel.data, 'name') && channel.data.name;

  return (
      <div className="relative">
        <ChannelHeader />

        {/* Nút gọi Video - Luôn hiển thị */}
        <button
            className={`absolute top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip ${
                isGroup ? "right-44" : "right-4"
            }`} // Nếu là nhóm thì đẩy sang trái để nhường chỗ cho nút khác, nếu không thì sát lề phải
            data-tip="Video Call"
            onClick={handleVideoCall}
        >
          <Video size={20} />
        </button>

        {/* Các nút dành riêng cho Group */}
        {isGroup && (
            <>
              <button
                  className="absolute right-32 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip"
                  data-tip="Add Members"
                  onClick={() => setIsAddMemberModalOpen(true)}
              >
                <UserPlus size={20} />
              </button>
              <button
                  className="absolute right-20 top-1/2 -translate-y-1/2 btn btn-ghost btn-sm btn-circle tooltip"
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