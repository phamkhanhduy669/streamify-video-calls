// frontend/src/components/UserSearch.jsx
import { useState, useEffect, useMemo } from "react";
import { useStreamChat } from "../context/StreamChatProvider";
import toast from "react-hot-toast";
import { X } from "lucide-react";

/**
 * Component tìm kiếm và hiển thị danh sách người dùng.
 * @param {function} onSelectUser - Callback khi một người dùng được chọn/bỏ chọn.
 * @param {Array<string>} initialSelectedUsers - Danh sách ID người dùng đã được chọn ban đầu (dùng khi thêm thành viên).
 * @param {Array<string>} usersToExclude - Danh sách ID người dùng cần loại trừ khỏi kết quả tìm kiếm (VD: các thành viên đã có trong nhóm).
 */
const UserSearch = ({ onSelectUser, initialSelectedUsers = [], usersToExclude = [] }) => {
  //  1. Lấy thêm isChatClientReady từ context
  const { chatClient, isChatClientReady } = useStreamChat();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [selectedUsersMap, setSelectedUsersMap] = useState(new Map());
  const [loading, setLoading] = useState(false);

  // Initialize selected users map with full user objects
  useEffect(() => {
    if (initialSelectedUsers.length === 0) return;
    
    const initMap = new Map();
    initialSelectedUsers.forEach(id => {
      initMap.set(id, { id, name: "Loading...", image: "" });
    });
    setSelectedUsersMap(initMap);
  }, [initialSelectedUsers]);

  // Memoize the excluded users list to prevent unnecessary re-renders
  const excludedUserIds = useMemo(() => {
    return JSON.stringify([chatClient?.userID, ...usersToExclude].filter(Boolean));
  }, [chatClient?.userID, usersToExclude.join(',')]);

  useEffect(() => {
    const searchUsers = async () => {
      // 👇 2. Kiểm tra thêm điều kiện !isChatClientReady
      if (!searchTerm || !chatClient || !isChatClientReady) {
        setResults([]);
        return;
      }
      
      setLoading(true);
      try {
        const usersToFilterOut = JSON.parse(excludedUserIds);

        const filter = {
          id: { $nin: usersToFilterOut },
          $or: [
            { name: { $autocomplete: searchTerm } },
            { username: { $autocomplete: searchTerm } },
          ],
        };
        
        const response = await chatClient.queryUsers(filter, { id: 1 }, { limit: 10 });
        setResults(response.users || []);
      } catch (err) {
        console.error("Error searching users:", err);
        // Không toast lỗi nếu lỗi là do chưa kết nối (để tránh spam thông báo)
        if (isChatClientReady) {
           toast.error("Cannot search users. Please try again.");
        }
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
    //  3. Thêm isChatClientReady vào dependency array
  }, [searchTerm, chatClient, isChatClientReady, excludedUserIds]);

  const handleSelect = (user) => {
    const newMap = new Map(selectedUsersMap);
    if (newMap.has(user.id)) {
      newMap.delete(user.id);
    } else {
      newMap.set(user.id, user);
    }
    setSelectedUsersMap(newMap);
    onSelectUser(Array.from(newMap.keys())); 
  };

  const handleRemove = (userId) => {
    const newMap = new Map(selectedUsersMap);
    newMap.delete(userId);
    setSelectedUsersMap(newMap);
    onSelectUser(Array.from(newMap.keys()));
  };

  const selectedUsers = Array.from(selectedUsersMap.values());

  return (
    <div className="flex flex-col gap-4">
      {/* Selected Users Display */}
      {selectedUsers.length > 0 && (
        <div className="bg-base-200 rounded-lg p-3">
          <div className="text-sm font-semibold mb-2 text-base-content/70">
            Selected ({selectedUsers.length})
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <div
                key={user.id}
                className="badge badge-lg gap-2 bg-primary text-primary-content"
              >
                <div className="avatar">
                  <div className="w-5 h-5 rounded-full">
                    <img src={user.image} alt={user.name} />
                  </div>
                </div>
                <span>{user.name}</span>
                <button
                  onClick={() => handleRemove(user.id)}
                  className="btn btn-circle btn-ghost btn-xs"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Input */}
      <input
        type="text"
        placeholder={isChatClientReady ? "Search by name or username..." : "Connecting..."}
        //  4. Disable input nếu chưa kết nối xong
        disabled={!isChatClientReady}
        className="input input-bordered w-full text-base-content disabled:bg-base-200 disabled:text-base-content/30"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-4">
          <span className="loading loading-spinner loading-md"></span>
        </div>
      )}

      {/* Search Results */}
      {!loading && results.length > 0 && (
        <div className="max-h-60 overflow-y-auto flex flex-col gap-1 border border-base-300 rounded-lg bg-base-100">
          {results.map((user) => {
            const isSelected = selectedUsersMap.has(user.id);
            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 transition-colors cursor-pointer text-base-content ${
                  isSelected ? "bg-primary/10" : "hover:bg-base-200"
                }`}
                onClick={() => handleSelect(user)}
              >
                <div className="flex items-center gap-3">
                  <div className="avatar">
                    <div className="w-10 rounded-full">
                      <img src={user.image} alt={user.name} />
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-base-content">{user.name}</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={isSelected}
                  readOnly
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!loading && searchTerm && results.length === 0 && isChatClientReady && (
        <div className="text-center py-8 text-base-content/50">
          No users found for "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default UserSearch;