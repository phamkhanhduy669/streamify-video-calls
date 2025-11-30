import { Link, useLocation, useNavigate } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import { LogOutIcon, ShipWheelIcon, Search, X } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import NotificationDropdown from "./NotificationDropdown";
import { useState, useRef, useEffect } from "react";
import { useSearchStore } from "../store/useSearchStore";
import { useQuery } from "@tanstack/react-query";
import { getPosts } from "../lib/api";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { logoutMutation } = useLogout();

  // --- XÁC ĐỊNH TRANG HIỆN TẠI ---
  const isChatPage = location.pathname?.startsWith("/chat");
  const isForumPage = location.pathname === "/forum"; 

  // --- LOGIC TÌM KIẾM ---
  const { setSearchQuery } = useSearchStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Chỉ fetch dữ liệu gợi ý khi đang ở trang Forum
  const { data: posts = [] } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
    enabled: !!authUser && isForumPage, 
    staleTime: 5 * 60 * 1000, 
  });

  const suggestions = posts.filter(post => 
    searchTerm && post.content.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  const handleClearSearch = () => {
    setSearchTerm("");
    setSearchQuery(""); 
    setShowSuggestions(false);
  };

  const handleSearch = (termToSearch) => {
    if (!termToSearch.trim()) {
        handleClearSearch();
        return;
    }
    setSearchQuery(termToSearch);
    setShowSuggestions(false);
    if (!isForumPage) navigate("/forum");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch(searchTerm);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between w-full gap-4">
          
          {/* LOGO - CHỈ HIỆN KHI Ở TRANG CHAT */}
          <div className="flex items-center gap-2.5 min-w-fit">
            {isChatPage && (
              <div className="pl-5">
                <Link to="/" className="flex items-center gap-2.5">
                  <ShipWheelIcon className="size-9 text-primary" />
                  <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
                    Streamify
                  </span>
                </Link>
              </div>
            )}
          </div>

          {/* THANH TÌM KIẾM - CHỈ HIỆN KHI Ở TRANG FORUM */}
          {isForumPage && (
            <div className="flex-1 max-w-xl relative mx-auto" ref={searchRef}>
              <div className="relative">
                
                {/* NÚT SEARCH Ở BÊN TRÁI (CLICK ĐƯỢC) */}
                <button 
                    onClick={() => handleSearch(searchTerm)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 btn btn-ghost btn-circle btn-sm text-base-content/50 hover:text-primary z-10"
                    title="Search"
                >
                    <Search className="size-5" />
                </button>

                <input
                  type="text"
                  placeholder="Search forum topics..."
                  // pr-10 để chừa chỗ cho nút X, pl-10 để chừa chỗ cho nút Search
                  className="input input-bordered w-full pr-10 pl-12 focus:outline-none focus:border-primary transition-all"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setShowSuggestions(true)}
                />
                
                {/* NÚT X (CLEAR) Ở BÊN PHẢI - CHỈ HIỆN KHI CÓ TEXT */}
                {searchTerm && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <button onClick={handleClearSearch} className="btn btn-ghost btn-circle btn-xs hover:bg-base-300">
                          <X className="size-4" />
                        </button>
                    </div>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && searchTerm && suggestions.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-base-100 shadow-xl rounded-lg border border-base-300 overflow-hidden z-50">
                   <ul className="menu w-full p-0">
                      <li className="menu-title px-4 py-2 bg-base-200 text-xs font-semibold opacity-70">Suggested Posts</li>
                      {suggestions.map((post) => (
                        <li key={post._id} className="border-b border-base-200 last:border-none">
                          <button 
                            onClick={() => {
                               setSearchTerm(post.content);
                               handleSearch(post.content);
                            }}
                            className="flex flex-col items-start gap-1 py-3 px-4 rounded-none hover:bg-base-200"
                          >
                            <span className="font-medium line-clamp-1 w-full text-left text-sm">
                                {post.content}
                            </span>
                            <span className="text-xs opacity-50 flex items-center gap-1">
                                by {post.author.fullName}
                            </span>
                          </button>
                        </li>
                      ))}
                   </ul>
                </div>
              )}
            </div>
          )}

          {/* RIGHT ACTIONS */}
          <div className="flex items-center gap-3 sm:gap-4 ml-auto min-w-fit justify-end">
            <NotificationDropdown />
            <ThemeSelector />

            <Link to="/profile" className="avatar">
              <div className="w-9 rounded-full">
                <img src={authUser?.profilePic} alt="User Avatar" rel="noreferrer" />
              </div>
            </Link>

            <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;