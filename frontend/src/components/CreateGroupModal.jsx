// frontend/src/components/CreateGroupModal.jsx
import { useState } from "react";
import { useStreamChat } from "../context/StreamChatProvider";
import UserSearch from "./UserSearch";
import toast from "react-hot-toast";
import { X, Users } from "lucide-react";

const CreateGroupModal = ({ onClose }) => {
  const { chatClient } = useStreamChat();
  const [groupName, setGroupName] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error("Please enter a group name");
    if (selectedUserIds.length === 0) return toast.error("Please select at least 1 member");

    setLoading(true);
    try {
      // Only allow a-z, 0-9, -, _, !
      let channelId = groupName.toLowerCase().replace(/\s+/g, "-");
      if (!/^[a-z0-9\-_!]+$/i.test(channelId)) {
        return toast.error("Group name can only contain letters, numbers, -, _, !");
      }
      channelId = channelId + "-" + Date.now();

      const channel = chatClient.channel("messaging", channelId, {
        name: groupName,
        members: [chatClient.userID, ...selectedUserIds],
        created_by_id: chatClient.userID,
      });

      await channel.create();

  // Không phân quyền admin client-side (Stream API không cho phép)

      toast.success("Group created successfully!");
      window.location.reload();
      onClose();
    } catch (err) {
      console.error("Error creating group:", err);
      toast.error("Failed to create group. Group name can only contain letters, numbers, -, _, !");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Create New Group</h3>
              <p className="text-sm text-base-content/60">Create a group chat with your friends</p>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-circle btn-ghost" 
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {/* Group Name Input */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-semibold">Group Name</span>
            <span className="label-text-alt text-base-content/50">
              {groupName.length}/50
            </span>
          </label>
          <input
            type="text"
            placeholder="Enter a group name (e.g., Study Group, Team Project...)"
            className="input input-bordered w-full"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value.slice(0, 50))}
            maxLength={50}
            autoFocus
          />
        </div>

        {/* Add Members Section */}
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-semibold">Add Members</span>
            <span className="label-text-alt text-base-content/50">
              {selectedUserIds.length} selected
            </span>
          </label>
          <UserSearch onSelectUser={setSelectedUserIds} />
        </div>

        {/* Action Buttons */}
        <div className="modal-action">
          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary gap-2" 
            onClick={handleCreateGroup} 
            disabled={loading || !groupName.trim() || selectedUserIds.length === 0}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Creating...
              </>
            ) : (
              <>
                <Users size={18} />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal;