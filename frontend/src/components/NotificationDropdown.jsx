import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellIcon, UserCheckIcon, CheckIcon } from "lucide-react";
import { getFriendRequests, acceptFriendRequest, markNotificationRead } from "../lib/api";
import toast from "react-hot-toast";
import { Link } from "react-router";

const NotificationDropdown = () => {
  const queryClient = useQueryClient();

  const { data: friendRequests, isLoading } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { mutate: acceptRequest, isPending: isAccepting } = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      toast.success("Friend request accepted!");
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: (_, requestId) => {
      // Cập nhật Cache ngay lập tức
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
  });

  const incomingRequests = friendRequests?.incomingReqs || [];
  const acceptedRequests = friendRequests?.acceptedReqs || [];
  
  // Chỉ đếm thông báo CHƯA ĐỌC (read: false)
  const notifCount = incomingRequests.length + acceptedRequests.filter(req => !req.read).length;

  return (
    <div className="dropdown dropdown-end">
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

      <div tabIndex={0} className="dropdown-content z-[50] card card-compact w-80 sm:w-96 p-0 shadow-2xl bg-base-100 border border-base-300 mt-2 rounded-box overflow-hidden">
        <div className="flex flex-col max-h-[80vh]">
           <div className="px-4 py-3 border-b border-base-300 bg-base-200/30 font-semibold text-base-content flex justify-between items-center">
              <span>Notifications</span>
              {notifCount > 0 && <span className="badge badge-primary badge-sm">{notifCount}</span>}
           </div>

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
                              >
                                <CheckIcon size={16} />
                              </button>
                            </div>
                          ))}

                          {acceptedRequests.map((notif) => (
                            <div 
                              key={notif._id} 
                              onClick={() => {
                                if (!notif.read) markRead(notif._id);
                              }}
                              className={`flex items-center gap-3 p-3 hover:bg-base-200 transition-colors border-b border-base-200 last:border-none cursor-pointer group relative ${notif.read ? 'opacity-50 bg-base-100' : 'bg-base-200/30'}`}
                            >
                              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-success/20 text-success">
                                 <UserCheckIcon size={20} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-base-content">
                                  <span className="font-bold">{notif.recipient.fullName}</span> accepted your request.
                                </p>
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