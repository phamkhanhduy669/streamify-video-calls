import { Link } from "react-router"; // ✅ SỬA 1: Import từ 'react-router-dom'
import { LANGUAGE_TO_FLAG } from "../constants";
import { useEffect, useState } from "react";
import { useStreamChat } from "../context/StreamChatProvider";
import useAuthUser from "../hooks/useAuthUser"; // ✅ SỬA 2: Import 'useAuthUser'
import { safeBio, capitialize } from "../lib/utils"; 

// Helper: get flag image
export function getLanguageFlag(language) {
  // ... (Code này của bạn đã đúng) ...
}

const FriendCard = ({ friend, onDelete }) => {
  // ✅ SỬA 3: Gọi hook Ở TRONG component
  const { chatClient, isChatClientReady } = useStreamChat();
  const { authUser } = useAuthUser(); 
  const [hasUnread, setHasUnread] = useState(false);
  const bio = safeBio(friend.bio);

  // 🧩 Handle Delete
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete your friend ${friend.fullName}?`)) {
      if (onDelete) onDelete(friend._id);
    }
  };

  // ✅ SỬA 4: Gộp 2 useEffect thành 1 và thêm logic chờ
  useEffect(() => {
    // 1. CHỜ: Đợi cho đến khi mọi thứ sẵn sàng
    if (!isChatClientReady || !chatClient || !authUser) {
      return; // Chờ...
    }

    // 2. TẠO CHANNEL:
    // (Lưu ý: Chúng ta dùng authUser._id thay vì chatClient.user.id
    // để đảm bảo an toàn nếu 'user' chưa được đính vào 'chatClient')
    const channelId = [authUser._id, friend._id].sort().join("-");
    const channel = chatClient.channel("messaging", channelId, {
      members: [authUser._id, friend._id]
    });

    // 3. KIỂM TRA UNREAD
    const checkUnread = async () => {
      try {
        await channel.watch(); // 'watch' thay vì 'query' để lấy unread
        const unreadCount = channel.countUnread();
        setHasUnread(unreadCount > 0);
      } catch (err) {
        console.warn("Unread check error:", err);
      }
    };

    checkUnread(); // Chạy lần đầu

    // 4. LẮNG NGHE SỰ KIỆN MỚI
    // (Dùng 'channel' đã được định nghĩa ở trên)
    const handleNewMessage = (event) => {
      if (event.user.id !== authUser._id) {
        setHasUnread(true);
      }
    };

    const handleReadEvent = (event) => {
      if (event.user.id === authUser._id) {
        setHasUnread(false);
      }
    };

    channel.on("message.new", handleNewMessage);
    channel.on("message.read", handleReadEvent);

    // 5. DỌN DẸP
    return () => {
      channel.off("message.new", handleNewMessage);
      channel.off("message.read", handleReadEvent);
      // Bạn có thể thêm channel.stopWatching() nếu cần
      // nhưng thường 'off' là đủ cho FriendCard
    };
    
  // ✅ SỬA 5: Dependency array chính xác
  }, [chatClient, friend, isChatClientReady, authUser]);

  return (
    <div className="card h-full bg-base-200 hover:shadow-md transition-shadow">
      <div className="card-body p-4 flex flex-col justify-between h-full min-h-[220px]">
        {/* USER INFO */}
        <div className="flex items-center gap-3 mb-3">
          <div className="avatar">
            {/* Sửa lại size-12 thành w-12 h-12 cho tương thích */}
            <div className="w-12 h-12 rounded-full">
              <img
                src={friend.profilePic || "/i.png"}
                alt={friend.fullName || "Unknown"}
              />
            </div>
          </div>
          <h3 className="font-semibold truncate">
            {friend.fullName || "Unknown"}
          </h3>
        </div>

        {/* LANGUAGE INFO */}
        {/* ... (Code của bạn ở đây đã đúng) ... */}

        {/* BIO */}
        {bio && <p className="text-sm opacity-70 mb-3">{bio}</p>}

        {/* ACTION BUTTONS */}
        <div className="flex gap-2 mt-2">
          <Link
            to={`/chat/${friend._id}`}
            className="btn btn-outline flex-1 relative"
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