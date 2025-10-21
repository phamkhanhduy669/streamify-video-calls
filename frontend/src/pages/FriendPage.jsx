import { useEffect, useState } from "react";
import axios from "axios";
import FriendCard from "../components/FriendCard.jsx";
import NoFriendsFound from "../components/NoFriendsFound.jsx"; // Optional


const FriendsPage = () => {
    console.log("FriendsPage mounted");
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ✅ Fetch list of friends from backend API
      axios.get("http://localhost:5001/api/users/friends", { withCredentials: true })
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
      // Call your backend API to delete this friend
      await axios.delete(`http://localhost:5001/api/users/friends/${friendId}`, {
        withCredentials: true,
      });

      // Update the local list (remove deleted friend)
      setFriends((prev) => prev.filter((f) => f._id !== friendId));

      console.log(`Friend with ID ${friendId} deleted successfully`);
    } catch (err) {
      console.error("Error deleting friend:", err);
      alert("Failed to delete friend. Please try again.");
    }
  };

  if (loading) return <div className="p-6 text-center">Loading friends...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">👥 My Friends</h1>

      {friends.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {friends.map((friend) => (
            <FriendCard key={friend._id} friend={friend}  onDelete={handleDeleteFriend} />
          ))}
        </div>
      ) : (
        <NoFriendsFound /> // optional, or use <p>No friends yet</p>
      )}
    </div>
  );
};

export default FriendsPage;
