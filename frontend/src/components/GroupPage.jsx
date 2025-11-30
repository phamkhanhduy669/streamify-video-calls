// frontend/src/pages/GroupsPage.jsx
import { useState, useEffect } from "react";
import { useStreamChat } from "../context/StreamChatProvider";
import CreateGroupModal from "../components/CreateGroupModal";
import ChatLoader from "../components/ChatLoader";
import { Plus, Users, MessageSquare, Clock, MessageCirclePlus } from "lucide-react";
import { useNavigate } from "react-router";

// Custom Group Card Component
const GroupCard = ({ channel, onClick }) => {
  const [lastMessage, setLastMessage] = useState(null);
  const [memberCount, setMemberCount] = useState(0);

  useEffect(() => {
    if (channel) {
      setMemberCount(Object.keys(channel.state.members).length);
      const messages = channel.state.messages;
      if (messages && messages.length > 0) {
        setLastMessage(messages[messages.length - 1]);
      }
    }
  }, [channel]);

  const formatTime = (date) => {
    if (!date) return "";
    const now = new Date();
    const msgDate = new Date(date);
    const diff = now - msgDate;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return "Just now";
  };

  return (
    <div
      onClick={onClick}
      className="mx-3 my-2 p-4 rounded-xl cursor-pointer bg-base-200 hover:bg-base-300 transition-all duration-200 border border-base-content/5 hover:border-primary/30 hover:shadow-md active:scale-[0.98]"
    >
      <div className="flex items-start gap-4">
        {/* Group Avatar */}
        <div className="avatar placeholder">
          <div className="bg-primary text-primary-content rounded-full w-12 h-12">
            <Users size={24} />
          </div>
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-bold text-base-content truncate">
              {channel.data.name || "Unnamed Group"}
            </h3>
            {lastMessage && (
              <span className="text-xs text-base-content/50 flex items-center gap-1">
                <Clock size={12} />
                {formatTime(lastMessage.created_at)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-base-content/60">
            <span className="flex items-center gap-1">
              <Users size={14} />
              {memberCount} members
            </span>
            {lastMessage && (
              <span className="flex items-center gap-1 truncate">
                <MessageSquare size={14} />
                <span className="truncate">
                  {lastMessage.text || "Media message"}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component chính để hiển thị danh sách groups
const GroupChannelList = ({ openCreateModal }) => {
  const { chatClient } = useStreamChat();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchGroups = async () => {
      if (!chatClient) return;

      try {
        setLoading(true);
        const filters = {
          type: "messaging",
          members: { $in: [chatClient.userID] },
          name: { $exists: true },
        };
        const sort = [{ last_message_at: -1 }];
  const channels = await chatClient.queryChannels(filters, sort, { limit: 20 });
  // Lọc bỏ nhóm chỉ có 2 thành viên
  const filtered = channels.filter(c => Object.keys(c.state.members).length >= 2);
  setGroups(filtered);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();

    // Listen for new messages to update list
    const handleEvent = () => {
      fetchGroups();
    };

    chatClient?.on("message.new", handleEvent);
    chatClient?.on("channel.updated", handleEvent);

    return () => {
      chatClient?.off("message.new", handleEvent);
      chatClient?.off("channel.updated", handleEvent);
    };
  }, [chatClient]);

  const handleGroupClick = (channelId) => {
    navigate(`/chat/${channelId}`);
  };

  return (
    <div className="flex flex-col h-full bg-base-100">
      {/* Header */}
      <div className="p-6 pb-4 border-b border-base-content/10 bg-base-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/20 p-3 rounded-xl shadow-sm">
              <MessageCirclePlus className="size-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-base-content">Groups</h1>
              <p className="text-sm text-base-content/60">Chat with your groups</p>
            </div>
          </div>
          <button
            className="btn btn-primary gap-2 shadow-md hover:shadow-lg transition-all hover:scale-105"
            onClick={openCreateModal}
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Create</span>
          </button>
        </div>
      </div>

      {/* Group List */}
      <div className="flex-1 overflow-y-auto bg-base-100 py-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-base-content/50">
            <Users size={48} className="mb-4 opacity-30" />
            <p className="text-lg font-semibold">No groups yet</p>
            <p className="text-sm">Create a group to get started</p>
          </div>
        ) : (
          groups.map((channel) => (
            <GroupCard
              key={channel.id}
              channel={channel}
              onClick={() => handleGroupClick(channel.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

const GroupsPage = () => {
  const { chatClient } = useStreamChat();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!chatClient) return <ChatLoader />;

  return (
    <div className="h-[calc(100vh-var(--navbar-height))]">
      <GroupChannelList openCreateModal={() => setIsModalOpen(true)} />
      {isModalOpen && <CreateGroupModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
};

export default GroupsPage;