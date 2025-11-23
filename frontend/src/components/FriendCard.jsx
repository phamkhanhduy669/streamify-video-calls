import { Link } from "react-router";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useEffect, useState } from "react";
import { useStreamChat } from "../context/StreamChatProvider";
import { safeBio, capitialize } from "../lib/utils"; // ✅ use your util versions

// Helper: get flag image
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

const FriendCard = ({ friend, onDelete }) => {
  const { chatClient } = useStreamChat();
  const [hasUnread, setHasUnread] = useState(false);
  const bio = safeBio(friend.bio);

  // Helper: get channelId safely
  const getChannelId = () => {
    if (!chatClient || !chatClient.user || !friend?._id) return null;
    return [chatClient.user.id, friend._id].sort().join("-");
  };

  // 🧩 Handle Delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete your friend ${friend.fullName}?`)) {
      if (onDelete) onDelete(friend._id);
    }
  };

  // 🔔 Check unread messages & listen for events
  useEffect(() => {
    if (!chatClient || !chatClient.user || !friend?._id) return;

    const channelId = getChannelId();
    if (!channelId) return;
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

    // 🟢 Listen for new messages
    const onMessageNew = (event) => {
      if (event.user.id !== chatClient.user.id) {
        setHasUnread(true);
      }
    };
    channel.on("message.new", onMessageNew);

    // 🟣 Listen for read events
    const onMessageRead = (event) => {
      if (event.user.id === chatClient.user.id) {
        setHasUnread(false);
      }
    };
    channel.on("message.read", onMessageRead);

    return () => {
      channel.off("message.new", onMessageNew);
      channel.off("message.read", onMessageRead);
    };
  }, [chatClient, friend?._id, getChannelId]);

  return (
    <div className="card h-full bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4 flex flex-col justify-between h-full min-h-[220px]">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar size-12">
            <img
              src={friend.profilePic || "/i.png"}
              alt={friend.fullName || "Unknown"}
            />
          </div>
          <h3 className="font-semibold truncate">
            {friend.fullName || "Unknown"}
          </h3>
        </div>

        {/* LANGUAGE INFO */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge badge-secondary text-xs">
            {getLanguageFlag(friend.nativeLanguage)}
            Native: {capitialize(friend.nativeLanguage)}
          </span>
          <span className="badge badge-outline text-xs">
            {getLanguageFlag(friend.learningLanguage)}
            Learning: {capitialize(friend.learningLanguage)}
          </span>
        </div>

        {/* BIO */}
        {bio && <p className="text-sm opacity-70 mb-3">{bio}</p>}

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 mt-2">
          <Link
            to={getChannelId() ? `/chat/${getChannelId()}` : "#"}
            className="btn btn-outline flex-1 relative"
            disabled={!getChannelId()}
          >
            Message
            {/* 🔴 Unread indicator */}
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
