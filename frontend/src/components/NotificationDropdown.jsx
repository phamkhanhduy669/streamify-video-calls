import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, UserCheckIcon, UserPlus, Heart, MessageCircle, Check, X } from "lucide-react";
import { getNotifications, markNotificationRead, acceptFriendRequest, declineFriendRequest } from "../lib/api";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router"; // Thêm useNavigate
import { formatDistanceToNow } from "date-fns";

const NotificationDropdown = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Khởi tạo useNavigate

  // 1. Lấy danh sách thông báo
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
  });

  // ... (Giữ nguyên các mutation acceptRequest, declineRequest, markRead) ...
  const { mutate: acceptRequest, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to accept"),
  });

  const { mutate: declineRequest, isPending: isDeclining } = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      toast.success("Friend request declined");
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to decline"),
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifCount = notifications.filter((req) => !req.read).length;

  const renderIcon = (type) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-error fill-current" />;
      case "comment":
        return <MessageCircle className="h-4 w-4 text-primary" />;
      case "friend_request":
        return <UserPlus className="h-4 w-4 text-accent" />;
      default:
        return <UserCheckIcon className="h-4 w-4 text-success" />;
    }
  };

  // ✅ Hàm xử lý click vào thông báo
  const handleNotificationClick = (notif) => {
    // Đánh dấu đã đọc nếu chưa đọc
    if (!notif.read) {
        markRead(notif._id);
    }

    // Đóng dropdown (bằng cách blur phần tử đang focus)
    const elem = document.activeElement;
    if (elem) {
        elem.blur();
    }

    // Điều hướng dựa trên loại thông báo
    if (notif.type === "like" || notif.type === "comment") {
        // Chuyển hướng đến trang Forum và gắn hash là ID bài viết
        // Giả sử backend trả về postId trong object notif (cần kiểm tra backend của bạn)
        // Nếu notif.post hoặc notif.postId tồn tại
        const postId = notif.post || notif.postId; 
        if (postId) {
            navigate(`/forum#${postId}`);
        } else {
             navigate("/forum");
        }
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle relative">
        <div className="indicator">
          <BellIcon className="h-6 w-6 text-base-content opacity-80" />
          {notifCount > 0 && (
            <span className="badge badge-sm badge-error indicator-item border-none text-white shadow-sm scale-90">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </div>
      </div>

      <div
        tabIndex={0}
        className="dropdown-content z-[50] card card-compact w-80 sm:w-96 p-0 shadow-2xl bg-base-100 border border-base-300 mt-2 rounded-box overflow-hidden"
      >
        <div className="flex flex-col max-h-[80vh]">
          <div className="px-4 py-3 border-b border-base-300 bg-base-200/30 font-semibold text-base-content flex justify-between items-center">
            <span>Notifications</span>
            {notifCount > 0 && <span className="badge badge-primary badge-sm">{notifCount} New</span>}
          </div>

          <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent max-h-[350px]">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : (
              <>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-base-content/50">
                    <BellIcon className="h-10 w-10 mb-2 opacity-20" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {notifications.map((notif) => (
                      <div
                        key={notif._id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`flex items-start gap-3 p-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-none cursor-pointer group relative ${
                          notif.read ? "opacity-60 bg-base-100" : "bg-base-200/40"
                        }`}
                      >
                        <div className="avatar mt-1">
                          <div className="w-10 h-10 rounded-full">
                            <img
                              src={notif?.sender?.profilePic || "/avatar.png"}
                              alt={notif?.sender?.fullName || "Unknown User"}
                            />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <p className="text-sm text-base-content">
                              <span className="font-bold mr-1">{notif?.sender?.fullName || "Unknown User"}</span>
                              {notif.type === "like" && "liked your post."}
                              {notif.type === "comment" && "commented on your post."}
                              {notif.type === "friend_request" && "sent you a friend request."}
                            </p>
                          </div>
                          
                          <p className="text-xs text-base-content/50 mt-0.5">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                          </p>

                          {notif.type === "comment" && notif.message && (
                            <p className="text-xs opacity-70 mt-1 italic border-l-2 border-base-300 pl-2 line-clamp-1">
                              "{notif.message.split(': "')[1]?.replace('"', '') || "..."}"
                            </p>
                          )}

                          {/* Actions cho Friend Request */}
                          {notif.type === "friend_request" && (
                            <div className="flex gap-2 mt-2">
                              <button
                                className="btn btn-xs btn-primary gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  acceptRequest(notif._id);
                                }}
                                disabled={isAccepting}
                              >
                                <Check className="size-3" /> Accept
                              </button>
                              <button
                                className="btn btn-xs btn-ghost gap-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  declineRequest(notif._id);
                                }}
                                disabled={isDeclining}
                              >
                                <X className="size-3" /> Decline
                              </button>
                            </div>
                          )}

                          {!notif.read && (
                            <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full shadow-sm"></span>
                          )}
                        </div>

                        <div className={`p-1.5 rounded-full bg-base-100 border border-base-200 flex-shrink-0`}>
                          {renderIcon(notif.type)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="p-2 bg-base-200/50 border-t border-base-300 text-center">
            <Link
              to="/notifications"
              className="link link-hover text-xs font-semibold text-base-content/70 hover:text-primary"
              onClick={() => {
                  const elem = document.activeElement;
                  if(elem) elem.blur();
              }}
            >
              View all notifications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;