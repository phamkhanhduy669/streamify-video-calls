import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, UserCheckIcon, CheckIcon } from "lucide-react";
import { getFriendRequests, acceptFriendRequest, markNotificationRead } from "../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router";

const NotificationDropdown = () => {
  const queryClient = useQueryClient();

  // 1. Lấy dữ liệu
  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // 2. Mutation: Chấp nhận kết bạn
  const { mutate: acceptRequest, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
  });

  // 3. Mutation: Đánh dấu đã đọc (Cập nhật Cache + Log Debug)
  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, requestId) => {
      console.log("✅ [Dropdown] Đánh dấu đã đọc thành công!");
      // Cập nhật Cache: Tìm item đó và set read = true (thay vì xóa)
      queryClient.setQueryData(["friendRequests"], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          acceptedReqs: oldData.acceptedReqs.map((req) => 
            req._id === requestId ? { ...req, read: true } : req
          ),
        };
      });
    },
    onError: (err) => {
      console.error("❌ [Dropdown] Lỗi gọi API markRead:", err);
    }
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  
  // Tính số lượng thông báo chưa đọc
  const notifCount = incomingRequests.length + acceptedRequests.filter(req => !req.read).length;

  // --- HÀM XỬ LÝ CLICK (DEBUG PHƯƠNG ÁN A) ---
  const handleNotificationClick = (notification) => {
    console.log("🖱️ [Dropdown] Đã bấm vào thông báo:", notification._id);
    console.log("👉 Trạng thái read hiện tại:", notification.read);

    if (notification.read) {
      console.log("⚠️ Thông báo này đã đọc rồi -> Không gọi API nữa.");
      return;
    }

    console.log("🚀 Đang gọi hàm markRead...");
    markRead(notification._id);
  };

  return (
    <div className="dropdown dropdown-end">
      {/* Nút Chuông */}
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle">
        <div className="indicator">
          <BellIcon className="h-6 w-6 text-base-content opacity-80" />
          {notifCount > 0 && (
            <span className="badge badge-sm badge-error indicator-item border-none text-white shadow-sm scale-90">
              {notifCount > 9 ? "9+" : notifCount}
            </span>
          )}
        </div>
      </div>

      {/* Nội dung Dropdown */}
      <div
        tabIndex={0}
        className="dropdown-content z-[50] card card-compact w-80 sm:w-96 p-0 shadow-2xl bg-base-100 border border-base-300 mt-2 rounded-box overflow-hidden"
      >
        <div className="flex flex-col max-h-[80vh]">
           {/* Header đơn giản */}
           <div className="px-4 py-3 border-b border-base-300 bg-base-200/30 font-semibold text-base-content flex justify-between items-center">
              <span>Notifications</span>
              {notifCount > 0 && <span className="badge badge-primary badge-sm">{notifCount}</span>}
           </div>

           {/* Danh sách thông báo */}
           <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-base-300 scrollbar-track-transparent max-h-[350px]">
              {isLoading ? (
                 <div className="flex justify-center py-8">
                   <span className="loading loading-spinner loading-md text-primary"></span>
                 </div>
              ) : (
                 <>
                    {incomingRequests.length === 0 && acceptedRequests.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-10 text-base-content/50">
                          <BellIcon className="h-10 w-10 mb-2 opacity-20" />
                          <p>No new notifications</p>
                       </div>
                    ) : (
                       <div className="flex flex-col">
                          {/* Danh sách lời mời kết bạn (Incoming) */}
                          {incomingRequests.map((req) => (
                            <div key={req._id} className="flex items-center gap-3 p-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-none">
                              <div className="avatar">
                                <div className="w-10 h-10 rounded-full">
                                  <img src={req.sender.profilePic || "/avatar.png"} alt={req.sender.fullName} />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-base-content truncate">{req.sender.fullName}</p>
                                <p className="text-xs text-base-content/70">Sent you a friend request</p>
                              </div>
                              
                              <button 
                                className="btn btn-sm btn-primary btn-circle"
                                onClick={() => acceptRequest(req._id)}
                                disabled={isAccepting}
                                title="Accept"
                              >
                                <CheckIcon size={16} />
                              </button>
                            </div>
                          ))}

                          {/* Thông báo đã được chấp nhận (Accepted) - Có Debug Log */}
                          {acceptedRequests.map((notif) => (
                            <div 
                              key={notif._id} 
                              // 👇 Gọi hàm xử lý click mới
                              onClick={() => handleNotificationClick(notif)}
                              className={`flex items-center gap-3 p-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-none cursor-pointer group relative ${notif.read ? 'opacity-50 bg-base-100' : 'bg-base-200/30'}`}
                            >
                              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-success/20 text-success">
                                 <UserCheckIcon size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-base-content">
                                  <span className="font-bold">{notif.recipient.fullName}</span> accepted your request.
                                </p>
                                {/* Chỉ hiện dấu chấm xanh nếu chưa đọc */}
                                {!notif.read && (
                                  <span className="absolute top-4 right-4 w-2 h-2 bg-primary rounded-full"></span>
                                )}
                              </div>
                            </div>
                          ))}
                       </div>
                    )}
                 </>
              )}
           </div>

           {/* Footer */}
           <div className="p-2 bg-base-200/50 border-t border-base-300 text-center">
              <Link to="/notifications" className="link link-hover text-xs font-semibold text-base-content/70 hover:text-primary">
                View all notifications
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDropdown;