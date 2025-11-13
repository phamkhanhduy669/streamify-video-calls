// frontend/src/components/GroupSettingsModal.jsx
import { useState, useEffect } from "react";
import { X, Upload, UserMinus, Shield, ShieldOff, LogOut, Users, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const GroupSettingsModal = ({ channel, onClose, currentUserId }) => {
  const [groupName, setGroupName] = useState("");
  const [members, setMembers] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (channel) {
      setGroupName(channel.data.name || "");
      const memberList = Object.values(channel.state.members);
      setMembers(memberList);
      
      // Check if current user is admin (channel owner or has admin role)
      const currentMember = channel.state.members[currentUserId];
      setIsAdmin(currentMember?.role === "admin" || currentMember?.role === "owner");
    }
  }, [channel, currentUserId]);

  const handleUpdateGroupName = async () => {
    if (!groupName.trim()) return toast.error("Group name cannot be empty");
    if (!isAdmin) return toast.error("Only admins can update group name");

    setLoading(true);
    try {
      await channel.update({ name: groupName });
      toast.success("Group name updated!");
    } catch (error) {
      console.error("Error updating group name:", error);
      toast.error("Failed to update group name");
    } finally {
      setLoading(false);
    }
  };

  // Đã loại bỏ hàm handleAvatarUpload

  const handleKickMember = async (userId) => {
    if (!isAdmin) return toast.error("Only admins can kick members");
    if (userId === currentUserId) return toast.error("You cannot kick yourself");

    const member = members.find(m => m.user_id === userId);
    if (member?.role === "owner") return toast.error("Cannot kick the group owner");

        setLoading(true);
        try {
          await channel.removeMembers([userId]);
          await channel.watch(); // cập nhật lại state từ server
          toast.success("Member removed from group");
          setMembers(Object.values(channel.state.members));
        } catch (error) {
          console.error("Error kicking member:", error);
          toast.error("Failed to remove member");
        } finally {
          setLoading(false);
        }
  };

  const handlePromoteToAdmin = async (userId) => {
    if (!isAdmin) return toast.error("Only admins can promote members");
    if (userId === currentUserId) return toast.error("You are already an admin");

        setLoading(true);
        try {
          await channel.assignRoles([{ user_id: userId, role: "channel_moderator" }]);
          await channel.watch();
          toast.success("Member promoted to admin");
          setMembers(Object.values(channel.state.members));
        } catch (error) {
          console.error("Error promoting member:", error);
          toast.error("Failed to promote member");
        } finally {
          setLoading(false);
        }
  };

  const handleDemoteAdmin = async (userId) => {
    if (!isAdmin) return toast.error("Only admins can demote members");
    
    const member = members.find(m => m.user_id === userId);
    if (member?.role === "owner") return toast.error("Cannot demote the group owner");

        setLoading(true);
        try {
          await channel.demoteModerators([userId]);
          await channel.watch();
          toast.success("Admin demoted to member");
          setMembers(Object.values(channel.state.members));
        } catch (error) {
          console.error("Error demoting admin:", error);
          toast.error("Failed to demote admin");
        } finally {
          setLoading(false);
        }
  };

  const handleLeaveGroup = async () => {
    const confirmLeave = window.confirm("Are you sure you want to leave this group?");
    if (!confirmLeave) return;

        setLoading(true);
        try {
          await channel.removeMembers([currentUserId]);
          await channel.watch();
          toast.success("You left the group");
          onClose();
          window.location.href = "/groups"; // Redirect to groups page
        } catch (error) {
          console.error("Error leaving group:", error);
          toast.error("Failed to leave group");
        } finally {
          setLoading(false);
        }
  };

  const getMemberRole = (member) => {
    if (member.role === "owner") return "Owner";
    if (member.role === "admin" || member.role === "channel_moderator") return "Admin";
    return "Member";
  };

  const isMemberAdmin = (member) => {
    return member.role === "owner" || member.role === "admin" || member.role === "channel_moderator";
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-3xl max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-full">
              <Users className="size-6 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-base-content">Group Settings</h3>
              <p className="text-sm text-base-content/60">Manage your group</p>
            </div>
          </div>
          <button className="btn btn-sm btn-circle btn-ghost text-base-content" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="space-y-6">
          {/* Group Avatar + Name */}
          <div className="flex items-center gap-6 mb-6">
            <div className="avatar placeholder">
              <div className="bg-primary text-primary-content rounded-full w-20 h-20 flex items-center justify-center">
                {channel.data.image ? (
                  <img src={channel.data.image} alt="Group" />
                ) : (
                  <Users size={40} />
                )}
              </div>
            </div>
            {isAdmin ? (
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  className="input input-bordered text-base-content font-bold text-xl"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  disabled={loading}
                  maxLength={50}
                  style={{ width: "220px" }}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateGroupName}
                  disabled={loading || groupName === channel.data.name}
                >
                  Update
                </button>
              </div>
            ) : (
              <span className="font-bold text-xl text-base-content">{groupName}</span>
            )}
          </div>

          {/* Group Name */}
          {/* Đã xóa phần Group Name riêng biệt, chỉ giữ phần Group Name cùng hàng avatar */}

          {/* Members List */}
          <div className="form-control">
            <label className="label">
              <span className="label-text font-semibold text-base-content">
                Members ({members.length})
              </span>
            </label>
            <div className="border border-base-300 rounded-lg max-h-80 overflow-y-auto">
              {members.map((member) => (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-3 hover:bg-base-200 border-b border-base-300 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 rounded-full">
                        <img src={member.user?.image} alt={member.user?.name} />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold flex items-center gap-2 text-base-content">
                        {member.user?.name}
                        {member.user_id === currentUserId && (
                          <span className="badge badge-sm badge-primary">You</span>
                        )}
                      </div>
                      <div className="text-sm text-base-content/60 flex items-center gap-2">
                        {isMemberAdmin(member) && <Shield size={12} />}
                        {getMemberRole(member) === "Owner" ? "Group Owner" : getMemberRole(member) === "Admin" ? "Admin" : "Member"}
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions */}
                  {isAdmin && member.user_id !== currentUserId && member.role !== "owner" && (
                    <div className="flex gap-2">
                      {!isMemberAdmin(member) ? (
                        <button
                          className="btn btn-sm btn-ghost gap-1 tooltip text-base-content"
                          data-tip="Promote to admin"
                          onClick={() => handlePromoteToAdmin(member.user_id)}
                          disabled={loading}
                        >
                          <Shield size={16} />
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-ghost gap-1 tooltip text-base-content"
                          data-tip="Demote from admin"
                          onClick={() => handleDemoteAdmin(member.user_id)}
                          disabled={loading}
                        >
                          <ShieldOff size={16} />
                        </button>
                      )}
                      <button
                        className="btn btn-sm btn-error btn-ghost gap-1 tooltip text-base-content"
                        data-tip="Remove from group"
                        onClick={() => handleKickMember(member.user_id)}
                        disabled={loading}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Leave Group Button */}
          <div className="pt-4 border-t border-base-300">
            <button
              className="btn btn-error btn-outline gap-2 w-full text-base-content"
              onClick={handleLeaveGroup}
              disabled={loading}
            >
              <LogOut size={18} />
              Leave Group
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupSettingsModal;
