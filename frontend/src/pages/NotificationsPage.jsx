import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationRead, acceptFriendRequest, declineFriendRequest } from "../lib/api";
import toast from "react-hot-toast";
import { BellIcon, UserPlus, Heart, MessageCircle, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  // 1. Lấy danh sách thông báo
  const { data: notifications = [], isLoading, isError } = useQuery({
    queryKey: ["notifications"], 
    queryFn: getNotifications,   
  });

  // 2. Mutation Chấp nhận
  const { mutate: acceptMutate, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      toast.success("Friend request accepted!");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to accept"),
  });

  // 3. Mutation Từ chối (Đã kiểm tra kỹ)
  const { mutate: declineMutate, isPending: isDeclining } = useMutation({
    mutationFn: declineFriendRequest,
    onSuccess: () => {
      toast.success("Request declined");
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Cũng cần invalidate friendRequests nếu bạn dùng query này ở nơi khác
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to decline"),
  });

  // 4. Mutation Đánh dấu đã đọc
  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const renderIcon = (type) => {
      switch(type) {
          case "like": return <Heart className="size-5 text-error fill-current" />;
          case "comment": return <MessageCircle className="size-5 text-primary" />;
          case "friend_request": return <UserPlus className="size-5 text-accent" />;
          default: return <BellIcon className="size-5" />;
      }
  };

  if (isLoading) {
    return (
        <div className="flex justify-center py-10">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );
  }

  if (isError) {
    return <div className="p-4 text-center text-error">Failed to load notifications.</div>;
  }

  return (
    <div className="p-4 md:p-8 min-h-screen bg-base-100">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
            <BellIcon className="size-8 text-primary" /> Notifications
        </h1>

        {notifications.length === 0 ? (
          <div className="text-center py-12 bg-base-200 rounded-lg border border-base-300">
             <BellIcon className="size-12 opacity-20 mx-auto mb-3" />
             <p className="text-lg opacity-60">You have no notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div 
                key={notif._id} 
                className={`card bg-base-100 shadow-sm border transition-all ${!notif.read ? 'border-primary bg-primary/5' : 'border-base-300 hover:border-base-400'}`}
                onClick={() => !notif.read && markRead(notif._id)}
              >
                <div className="card-body p-4 flex-row items-start gap-4">
                    
                    <div className="avatar mt-1">
                        <div className="w-12 h-12 rounded-full ring ring-base-300 ring-offset-base-100 ring-offset-1">
                            <img src={notif.sender.profilePic || "/avatar.png"} alt={notif.sender.fullName} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                            <p className="font-medium text-base">
                                <span className="font-bold">{notif.sender.fullName}</span> 
                                <span className="opacity-80 ml-1">
                                    {notif.type === 'like' && "liked your post."}
                                    {notif.type === 'comment' && "commented on your post."}
                                    {notif.type === 'friend_request' && "sent you a friend request."}
                                </span>
                            </p>
                            <span className="text-xs opacity-50 whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                            </span>
                        </div>

                        {notif.type === 'comment' && (
                            <p className="text-sm opacity-60 mt-1 italic border-l-2 border-base-300 pl-2 line-clamp-1">
                                "{notif.message?.split(': "')[1]?.replace('"', '') || "..."}"
                            </p>
                        )}

                        {/* Actions cho Friend Request */}
                        {notif.type === 'friend_request' && (
                            <div className="flex gap-3 mt-3">
                                <button 
                                    className="btn btn-primary btn-sm gap-1"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        // QUAN TRỌNG: Truyền notif._id (chính là Request ID)
                                        acceptMutate(notif._id); 
                                    }}
                                    disabled={isAccepting || isDeclining}
                                >
                                    <Check className="size-4" /> Accept
                                </button>
                                <button 
                                    className="btn btn-ghost btn-sm gap-1"
                                    onClick={(e) => { 
                                        e.stopPropagation(); 
                                        // QUAN TRỌNG: Truyền notif._id (chính là Request ID)
                                        declineMutate(notif._id); 
                                    }} 
                                    disabled={isAccepting || isDeclining}
                                >
                                    <X className="size-4" /> Decline
                                </button>
                            </div>
                        )}
                    </div>

                    <div className={`p-2 rounded-full bg-base-200 ${!notif.read ? 'text-primary' : 'opacity-50'}`}>
                        {renderIcon(notif.type)}
                    </div>

                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;