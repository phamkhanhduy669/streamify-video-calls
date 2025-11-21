import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axios.js";
import FriendCard from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriendsFound.jsx";
import { Search, X } from "lucide-react";
import toast from "react-hot-toast"; // Khuyên dùng toast thay vì alert

const FriendsPage = () => {
  console.log("FriendsPage mounted");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // State cho ô tìm kiếm
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    // ✅ Fetch list of friends
    axiosInstance.get("/users/friends")
      .then((res) => {
        console.log("Response data:", res.data);
        setFriends(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching friends:", err);
        setLoading(false);
      });
  }, []);

  const handleDeleteFriend = async (friendId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this friend?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/users/friends/${friendId}`);

      // Cập nhật danh sách local
      setFriends((prev) => prev.filter((f) => f._id !== friendId));
      
      toast.success("Removed friend successfully");
    } catch (err) {
      console.error("Error deleting friend:", err);
      toast.error("Failed to delete friend");
    }
  };

  // ✅ LOGIC LỌC (Client-side filter)
  const filteredFriends = friends.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return (
    <div className="flex justify-center py-12">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-8">
        
        {/* --- HEADER & SEARCH BAR --- */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              My Friends
            </h2>
            <p className="text-base-content/70">
              You have {friends.length} friend{friends.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* ✅ THANH TÌM KIẾM */}
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search friends..."
              className="input input-bordered w-full pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" />
            
            {/* Nút Xóa tìm kiếm */}
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 btn btn-ghost btn-xs btn-circle"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        {/* --- DISPLAY LIST --- */}
        {friends.length === 0 ? (
          // Trường hợp chưa có bạn nào
          <NoFriendsFound />
        ) : filteredFriends.length === 0 ? (
          // Trường hợp có bạn nhưng tìm không thấy ai khớp tên
          <div className="text-center py-12 bg-base-200 rounded-lg">
            <h3 className="text-lg font-medium">No matching friends found</h3>
            <p className="text-base-content/70">
              Try searching for a different name.
            </p>
          </div>
        ) : (
          // ✅ HIỂN THỊ DANH SÁCH ĐÃ LỌC
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFriends.map((friend) => (
              <FriendCard 
                key={friend._id} 
                friend={friend} 
                onDelete={handleDeleteFriend} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;