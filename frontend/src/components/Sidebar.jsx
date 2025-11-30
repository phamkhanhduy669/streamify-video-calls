import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, ShipWheelIcon, UsersIcon, UserPlus, MessagesSquare, MessageCirclePlus} from "lucide-react"; // ✅ Import UserPlus
import { useStreamChat } from "../context/StreamChatProvider";
import { useQuery } from "@tanstack/react-query";
import { getFriendRequests } from "../lib/api";

const Sidebar = () => {
  const { data: notificationData } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });
  const notificationCount = notificationData?.incomingReqs?.length || 0;

  const { unreadMap } = useStreamChat();
  const unreadCount = Object.values(unreadMap || {}).reduce((acc, count) => acc + count, 0);

  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
            Streamify
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {/* 1. HOME */}
        <Link
          to="/"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/" ? "btn-active" : ""
          }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Home</span>
        </Link>

        {/* 2. ADD FRIEND (MỚI) */}
        <Link
          to="/add-friend"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/add-friend" ? "btn-active" : ""
          }`}
        >
          <UserPlus className="size-5 text-base-content opacity-70" />
          <span>Add Friend</span>
        </Link>

        {/* 3. FRIENDS */}
        <Link
          to="/friends"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case relative ${
            currentPath === "/friends" ? "btn-active" : ""
          }`}
        >
          <UsersIcon className="size-5 text-base-content opacity-70" />
          <span>Friends</span>
          {unreadCount > 0 && (
            <span className="absolute top-2 right-4 badge badge-primary badge-sm">
              {unreadCount}
            </span>
          )}
        </Link>

        <Link
          to="/groups"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/groups" ? "btn-active" : ""
          }`}
        >
          <MessageCirclePlus className="size-5 text-base-content opacity-70" />
          <span>Groups</span>
        </Link>

        <Link
          to="/forum"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/forum" ? "btn-active" : ""  
          }`}
        >
          <MessagesSquare className="size-5 text-base-content opacity-70" />
          <span>Forum</span>
        </Link>
        

        {/* 4. NOTIFICATIONS */}
        <Link
          to="/notifications"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case relative ${
            currentPath === "/notifications" ? "btn-active" : ""
          }`}
        >
          <BellIcon className="size-5 text-base-content opacity-70" />
          <span>Notifications</span>
          {notificationCount > 0 && (
            <span className="absolute top-2 right-4 badge badge-error badge-sm">
              {notificationCount}
            </span>
          )}
        </Link>
      </nav>

      {/* USER PROFILE */}
      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
            {/* ... (giữ nguyên phần profile của bạn) ... */}
           <div className="avatar">
            <div className="w-10 rounded-full">
              <img src={authUser?.profilePic} alt="User Avatar" />
            </div>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;