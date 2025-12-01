import { Link } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { MessageCircle, UserPlus, Users, Zap, BookOpen, Star, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getUserFriends, getFriendRequests, getRandomWord } from "../lib/api"; 
import { capitialize } from "../lib/utils";

const HomePage = () => {
  const { authUser } = useAuthUser();

  // Lấy dữ liệu bạn bè
  const { data: friends = [] } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  // Lấy dữ liệu lời mời kết bạn
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  // Ngôn ngữ mục tiêu (Target) và Ngôn ngữ mẹ đẻ (Native)
  const targetLang = authUser?.learningLanguage || "English";
  const nativeLang = authUser?.nativeLanguage || "English"; // ✅ Lấy native language

  // ✅ CẬP NHẬT useQuery CHO WORD OF THE DAY
const { 
    data: wordOfTheDay, 
    isLoading: loadingWord, 
    refetch: refreshWord,
    isRefetching // <--- THÊM DÒNG NÀY
  } = useQuery({
    queryKey: ["wordOfTheDay", targetLang, nativeLang], 
    queryFn: () => getRandomWord(targetLang, nativeLang),
    staleTime: 1000 * 60 * 60 * 24, 
    refetchOnWindowFocus: false,
  });

  // Dữ liệu mặc định lúc đang load
  const displayWord = wordOfTheDay || {
     word: "Loading...",
     pronunciation: "...",
     meaning: "Đang hỏi Google AI...",
     example: "...",
     language: targetLang
  };

  return (
    <div className="p-4 md:p-8 min-h-full">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
              Hello, {authUser?.fullName}! 👋
            </h1>
            <p className="text-base-content/70 mt-2">
              Let's make some progress in <span className="font-bold text-primary">{capitialize(targetLang)}</span> today.
            </p>
          </div>
          
           {/* Stats Badge */}
           <div className="flex gap-3">
             <div className="badge badge-lg badge-primary gap-2 p-4 shadow-md">
                <Zap className="size-4" />
                <span>3 Day Streak</span> 
             </div>
             <div className="badge badge-lg badge-secondary gap-2 p-4 shadow-md">
                <Star className="size-4" />
                <span>Level 1</span> 
             </div>
          </div>
        </div>

        {/* WIDGETS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Widget A: Word of the Day (AI POWERED) */}
            <div className="card bg-base-200 shadow-xl border-l-4 border-accent md:col-span-2 relative group">
                <div className="card-body">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-accent">
                            <BookOpen className="size-5" />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Word of the Day (AI)</h3>
                        </div>
                        {/* Nút Refresh để xin từ khác */}
                        <button 
                            onClick={() => refreshWord()} 
                            className="btn btn-ghost btn-xs btn-circle opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Get new word"
                            disabled={loadingWord || isRefetching}
                        >
                            <RefreshCw className={`size-4 ${loadingWord || isRefetching ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {loadingWord ? (
                         <div className="flex flex-col gap-4 w-full animate-pulse">
                            <div className="h-8 bg-base-300 rounded w-1/3"></div>
                            <div className="h-4 bg-base-300 rounded w-full"></div>
                         </div>
                    ) : (
                        <>
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h2 className="text-3xl font-bold text-base-content">{displayWord.word}</h2>
                                    <p className="opacity-60 text-sm">{displayWord.pronunciation}</p>
                                </div>
                                <div className="text-right hidden sm:block">
                                    <span className="badge badge-outline">{displayWord.language}</span>
                                </div>
                            </div>
                            <div className="divider my-1"></div>
                            <p className="italic text-lg">"{displayWord.meaning}"</p>
                            <p className="text-sm opacity-70 mt-2">Ex: {displayWord.example}</p>
                        </>
                    )}
                </div>
            </div>

            {/* Widget B: Quick Status */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h3 className="card-title text-base mb-4">Your Network</h3>
                    
                    <div className="flex justify-between items-center mb-2">
                        <span className="flex items-center gap-2 opacity-80">
                            <Users className="size-4" /> Friends
                        </span>
                        <span className="font-bold text-xl">{friends.length}</span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        <span className="flex items-center gap-2 opacity-80">
                            <UserPlus className="size-4" /> Requests
                        </span>
                        <span className="font-bold text-xl text-primary">
                            {friendRequests?.incomingReqs?.length || 0}
                        </span>
                    </div>

                    <Link to="/add-friend" className="btn btn-primary btn-sm w-full mt-auto">
                        Find New Partners
                    </Link>
                </div>
            </div>
        </div>

        {/* MAIN ACTIONS */}
        <div>
            <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <Zap className="size-5 text-yellow-500" /> Quick Actions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            <Link to="/add-friend" className="group card bg-base-100 hover:bg-primary hover:text-primary-content transition-all shadow-md border border-base-200 cursor-pointer">
                <div className="card-body items-center text-center p-6">
                <div className="p-3 bg-base-200 rounded-full mb-2 group-hover:bg-white/20 transition-colors">
                    <UserPlus className="size-6 text-primary group-hover:text-white" />
                </div>
                <h2 className="font-bold text-lg">Find Partners</h2>
                <p className="text-sm opacity-70 group-hover:opacity-90">Discover people</p>
                </div>
            </Link>

            <Link to="/friends" className="group card bg-base-100 hover:bg-secondary hover:text-secondary-content transition-all shadow-md border border-base-200 cursor-pointer">
                <div className="card-body items-center text-center p-6">
                <div className="p-3 bg-base-200 rounded-full mb-2 group-hover:bg-white/20 transition-colors">
                    <Users className="size-6 text-secondary group-hover:text-white" />
                </div>
                <h2 className="font-bold text-lg">My Friends</h2>
                <p className="text-sm opacity-70 group-hover:opacity-90">{friends.length} connections</p>
                </div>
            </Link>

            <Link to="/friends" className="group card bg-base-100 hover:bg-accent hover:text-accent-content transition-all shadow-md border border-base-200 cursor-pointer">
                <div className="card-body items-center text-center p-6">
                <div className="p-3 bg-base-200 rounded-full mb-2 group-hover:bg-white/20 transition-colors">
                    <MessageCircle className="size-6 text-accent group-hover:text-white" />
                </div>
                <h2 className="font-bold text-lg">Start Chatting</h2>
                <p className="text-sm opacity-70 group-hover:opacity-90">Practice now</p>
                </div>
            </Link>

            </div>
        </div>

      </div>
    </div>
  );
};

export default HomePage;