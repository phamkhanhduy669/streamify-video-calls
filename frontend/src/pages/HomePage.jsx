import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  sendFriendRequest,
  searchUsers,
} from "../lib/api";
import { Link } from "react-router";

import { capitialize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import {
  CheckCircleIcon,
  MapPinIcon,
  UserPlusIcon,
  UsersIcon,
  Search,
  X,
} from "lucide-react";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recommendedUsers = [], isLoading: loadingRec } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });
  const { data: searchResults = [], isLoading: loadingSearch } = useQuery({
    queryKey: ["searchUsers", searchQuery],
    queryFn: () => searchUsers(searchQuery),
    enabled: searchQuery.length > 0, // Chỉ fetch khi user gõ chữ
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { mutate: sendRequestMutation, isPending } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] }),
  });

  const isSearching = searchQuery.length > 0;
  const usersToDisplay = isSearching ? searchResults : recommendedUsers;
  const isLoadingUsers = isSearching ? loadingSearch : loadingRec;

  useEffect(() => {
    const outgoingIds = new Set();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
      });
      setOutgoingRequestsIds(outgoingIds);
    }
  }, [outgoingFriendReqs]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  {isSearching ? "Search Results" : "Meet New Learners"}
                </h2>
                <p className="opacity-70">
                  {isSearching
                    ? `Found ${usersToDisplay.length} users matching "${searchQuery}"`
                    : "Discover perfect language exchange partners based on your profile"}
                </p>
              </div>

              {/* ✅ 6. THANH TÌM KIẾM */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="input input-bordered w-full pl-10 pr-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-base-content/50" />
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
          </div>

          {isLoadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : usersToDisplay.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                {isSearching ? "No users found" : "No recommendations available"}
              </h3>
              <p className="text-base-content opacity-70">
                {isSearching
                  ? "Try searching with a different name or email."
                  : "Check back later for new language partners!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {usersToDisplay.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);
                /* Format user bio */
                user.bio = (user.bio || "").trim();
                user.bio = (user.bio) ? user.bio : 'No bio provided';
                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Languages with flags */}
                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>
                      {/* Bio */}
                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      {/* Action button */}
                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-disabled" : "btn-primary"
                        } `}
                        onClick={() => sendRequestMutation(user._id)}
                        disabled={hasRequestBeenSent || isPending}
                      >
                        {hasRequestBeenSent ? (
                          <>
                            <CheckCircleIcon className="size-4 mr-2" />
                            Request Sent
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default HomePage;