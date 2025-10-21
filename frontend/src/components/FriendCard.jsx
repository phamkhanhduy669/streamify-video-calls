/* eslint-disable react-refresh/only-export-components */
import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useStreamChat } from "../context/StreamChatProvider";
import { useEffect, useState } from "react"

export function getLanguageFlag(language) {
  if (!language) return null;
  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3 mr-1 inline-block"
      />
    );
  }
  return null;
}

function safeBio(bio) {
  if (!bio) return "";
  return bio.length > 100 ? bio.slice(0, 100) + "..." : bio;
}

function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

const FriendCard = ({ friend, onDelete }) => {
  const { chatClient } = useStreamChat();
  const [hasUnread, setHasUnread] = useState(false);

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete your friend ${friend.fullName}?`)) {
      if (onDelete) onDelete(friend._id);
    }
  };

  // 🔔 Kiểm tra tin nhắn chưa đọc
  useEffect(() => {
    if (!chatClient || !friend?._id) return;

    const channelId = [chatClient.user.id, friend._id].sort().join("-");
    const channel = chatClient.channel("messaging", channelId);

    const checkUnread = async () => {
      try {
        await channel.watch();
        const unreadCount = channel.countUnread();
        setHasUnread(unreadCount > 0);
      } catch (err) {
        console.warn("Unread check error:", err);
      }
    };

    checkUnread();

    // 🟢 Lắng nghe sự kiện tin nhắn mới
    channel.on("message.new", (event) => {
      if (event.user.id !== chatClient.user.id) {
        setHasUnread(true);
      }
    });

    // 🟣 Lắng nghe khi người dùng đọc tin nhắn
    channel.on("message.read", (event) => {
      if (event.user.id === chatClient.user.id) {
        setHasUnread(false);
      }
    });

    return () => {
      channel.off("message.new");
      channel.off("message.read");
    };
  }, [chatClient, friend]);

  return (
    <div className="card bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img src={friend.profilePic} alt={friend.fullName} />
          </div>
          <h3 className="font-semibold truncate">{friend.fullName}</h3>
        </div>

        {/* LANGUAGE INFO */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {friend.nativeLanguage}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {friend.learningLanguage}
          </span>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 relative">
          <Link to={`/chat/${friend._id}`} className="btn btn-outline flex-1 relative">
            Message
            {/* 🔴 Chấm đỏ hiển thị nếu có tin chưa đọc */}
            {hasUnread && (
              <span className="absolute -top-1 -right-1 size-3 bg-red-500 rounded-full"></span>
            )}
          </Link>
          <button onClick={handleDelete} className="btn btn-error flex-1">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};


export default FriendCard;
