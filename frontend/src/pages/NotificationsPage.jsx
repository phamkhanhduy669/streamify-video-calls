import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { acceptFriendRequest, getFriendRequests, markNotificationRead } from "../lib/api"; // Đảm bảo import đủ
import { BellIcon, ClockIcon, MessageSquareIcon, UserCheckIcon } from "lucide-react";
import NoNotificationsFound from "../components/NoNotificationsFound";

const NotificationsPage = () => {
  const queryClient = useQueryClient();

  // 1. Lấy dữ liệu
  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // 2. Hàm chấp nhận kết bạn
  const { mutate: acceptRequestMutation, isPending } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  // 3. Hàm đánh dấu đã đọc (Có thêm Log Error)
  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      console.log("✅ API báo thành công! Đang refresh lại list...");
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
    },
    onError: (err) => {
      console.error("❌ Lỗi khi gọi API markRead:", err);
    }
  });

  // Hàm tính thời gian
  const formatTime = (dateString) => {
    if (!dateString) return "Recently";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return "Recently";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];

  // Hàm xử lý click (Tách riêng để dễ debug)
  const handleNotificationClick = (notification) => {
    console.log("🖱️ Đã click vào thông báo:", notification._id);
    console.log("👉 Trạng thái hiện tại - read:", notification.read);

    if (notification.read) {
      console.log("⚠️ Thông báo này đã đọc rồi -> Không gọi API.");
      return;
    }
    
    console.log("🚀 Đang gọi hàm markRead...");
    markRead(notification._id);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-6">Notifications</h1>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <>
            {/* SECTION 1: Friend Requests (Giữ nguyên) */}
            {incomingRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <UserCheckIcon className="h-5 w-5 text-primary" />
                  Friend Requests
                  <span className="badge badge-primary ml-2">{incomingRequests.length}</span>
                </h2>
                <div className="space-y-3">
                  {incomingRequests.map((request) => (
                    <div key={request._id} className="card bg-base-200 shadow-sm">
                      <div className="card-body p-4">
                         {/* Nội dung friend request giữ nguyên */}
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="avatar w-14 h-14 rounded-full">
                                    <img src={request.sender.profilePic || "/avatar.png"} alt={request.sender.fullName} />
                                </div>
                                <div>
                                    <h3 className="font-semibold">{request.sender.fullName}</h3>
                                    <p className="text-xs">Sent you a friend request</p>
                                </div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => acceptRequestMutation(request._id)} disabled={isPending}>
                                Accept
                            </button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* SECTION 2: Accepted Requests (CÓ DEBUG LOG) */}
            {acceptedRequests.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-success" />
                  New Connections
                </h2>

                <div className="space-y-3">
                  {acceptedRequests.map((notification) => (
                    <div 
                      key={notification._id} 
                      // 👇 SỬA Ở ĐÂY: Gọi hàm handleNotificationClick
                      onClick={() => handleNotificationClick(notification)}
                      className={`card shadow-sm transition-all cursor-pointer border ${notification.read ? 'bg-base-100 opacity-60 border-transparent' : 'bg-base-200 hover:shadow-md border-base-300'}`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-start gap-3">
                          <div className="avatar mt-1 size-10 rounded-full">
                            <img
                              src={notification.recipient.profilePic || "/avatar.png"}
                              alt={notification.recipient.fullName}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className={`font-semibold ${!notification.read && 'text-primary'}`}>
                                {notification.recipient.fullName}
                            </h3>
                            <p className="text-sm my-1">
                              {notification.recipient.fullName} accepted your friend request
                            </p>
                            <p className="text-xs flex items-center opacity-70">
                              <ClockIcon className="h-3 w-3 mr-1" />
                              {formatTime(notification.updatedAt)} 
                            </p>
                          </div>
                          
                          {!notification.read ? (
                             <div className="badge badge-success text-white gap-1">
                                <MessageSquareIcon className="h-3 w-3" />
                                New
                             </div>
                          ) : (
                             <div className="badge badge-ghost gap-1 opacity-50">
                                Seen
                             </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {incomingRequests.length === 0 && acceptedRequests.length === 0 && (
              <NoNotificationsFound />
            )}
          </>
        )}
      </div>
    </div>
  );
};
export default NotificationsPage;