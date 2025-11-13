// frontend/src/components/AddMemberModal.jsx
import { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { useChannelStateContext } from "stream-chat-react";
import UserSearch from "./UserSearch";
import toast from "react-hot-toast";

const AddMemberModal = ({ onClose }) => {
  const { channel } = useChannelStateContext();
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Lấy danh sách thành viên đã có để loại trừ khỏi tìm kiếm
  const existingMemberIds = Object.keys(channel.state.members);

  const handleAddMembers = async () => {
    if (selectedUserIds.length === 0) return toast.error("Please select at least 1 member");

    setLoading(true);
    try {
      await channel.addMembers(selectedUserIds);
      toast.success("Members added successfully!");
      onClose();
    } catch (err) {
      console.error("Error adding members:", err);
      toast.error("Cannot add members.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-xl text-base-content">Add Members</h3>
          <button className="btn btn-sm btn-circle btn-ghost text-base-content" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <div className="form-control mb-6">
          <label className="label">
            <span className="label-text font-semibold">Search Users</span>
            <span className="label-text-alt text-base-content/50">
              {selectedUserIds.length} selected
            </span>
          </label>
          <div className="bg-base-200 rounded-lg p-2">
            <UserSearch 
              onSelectUser={setSelectedUserIds} 
              usersToExclude={existingMemberIds}
              className="text-base-content"
            />
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost text-base-content" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button 
            className="btn btn-primary gap-2 text-base-content" 
            onClick={handleAddMembers} 
            disabled={loading || selectedUserIds.length === 0}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Adding...
              </>
            ) : (
              <>
                <UserPlus size={18} />
                Add Members
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMemberModal;