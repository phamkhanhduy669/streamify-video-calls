import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { getPosts, createPost, likePost, commentPost, deletePost, translateText } from "../lib/api";
import {
  FileText,
  Download,
  MessageSquare,
  Heart,
  Send,
  MessageCircle,
  Paperclip,
  X,
  Trash2,
  Languages,
  Loader2,
  FileSpreadsheet,
  FileCode,
  File
} from "lucide-react";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";

const ForumPage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  
  const [newPostContent, setNewPostContent] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileType, setFileType] = useState("image");
  const fileInputRef = useRef(null);
  
  const [commentInputs, setCommentInputs] = useState({});
  const [translatedPosts, setTranslatedPosts] = useState({});
  const [isTranslating, setIsTranslating] = useState({});

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: getPosts,
  });

  // --- Mutations ---
  const { mutate: createPostMutation, isPending: isCreating } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      setNewPostContent("");
      setSelectedFile(null);
      setFileType("image");
      toast.success("Posted successfully!");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: () => toast.error("Failed to post"),
  });

  const { mutate: deletePostMutation } = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      toast.success("Post deleted");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to delete")
  });

  const { mutate: likeMutation } = useMutation({
    mutationFn: likePost,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  const { mutate: commentMutation } = useMutation({
    mutationFn: commentPost,
    onSuccess: () => {
      toast.success("Comment added");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setCommentInputs({});
    },
  });

  // --- Handlers ---
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
           toast.error("File size too large (Max 10MB)");
           return;
      }

      if (file.type.startsWith("image/")) {
          setFileType("image");
      } else if (file.type.includes("pdf")) {
          setFileType("pdf");
      } else if (file.type.includes("word") || file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
          setFileType("word");
      } else if (file.type.includes("sheet") || file.type.includes("excel") || file.name.endsWith(".xls") || file.name.endsWith(".xlsx")) {
          setFileType("excel");
      } else {
          setFileType("raw");
      }

      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile(reader.result); 
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = (e) => {
    e.preventDefault();
    if (!newPostContent.trim() && !selectedFile) return;
    createPostMutation({ content: newPostContent, image: selectedFile });
  };

  const handleCommentSubmit = (e, postId) => {
    e.preventDefault();
    const text = commentInputs[postId];
    if (!text?.trim()) return;
    commentMutation({ postId, text });
  };

  const handleDeletePost = (postId) => {
      if(!window.confirm("Are you sure you want to delete this post?")) return;
      deletePostMutation(postId);
  };

  const handleTranslate = async (postId, content) => {
    if (translatedPosts[postId]) {
        setTranslatedPosts(prev => {
            const newState = { ...prev };
            delete newState[postId];
            return newState;
        });
        return;
    }

    setIsTranslating(prev => ({ ...prev, [postId]: true }));
    try {
        const targetLang = authUser.nativeLanguage || "Vietnamese";
        const { translatedText } = await translateText({ text: content, targetLanguage: targetLang });
        setTranslatedPosts(prev => ({ ...prev, [postId]: translatedText }));
    } catch (error) {
        toast.error("Translation failed. Try again.");
    } finally {
        setIsTranslating(prev => ({ ...prev, [postId]: false }));
    }
  };

  const renderFileIcon = (type) => {
      switch(type) {
          case "pdf": return <FileText className="size-10 text-red-500" />;
          case "word": return <FileText className="size-10 text-blue-600" />;
          case "excel": return <FileSpreadsheet className="size-10 text-green-600" />;
          case "code": return <FileCode className="size-10 text-yellow-600" />;
          default: return <File className="size-10 text-gray-500" />;
      }
  };

  const renderFilePreview = () => {
      if (!selectedFile) return null;

      if (fileType === "image") {
          return <img src={selectedFile} alt="Selected" className="max-h-60 rounded-lg w-full object-cover" />;
      }

      return (
          <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
              {renderFileIcon(fileType)}
              <div className="flex-1">
                  <span className="text-sm font-medium">File attached</span>
                  <p className="text-xs opacity-60 uppercase">{fileType}</p>
              </div>
          </div>
      );
  };

  // ✅ HÀM XỬ LÝ URL TẢI XUỐNG THÔNG MINH
  const getDownloadUrl = (url, fileType) => {
      if (!url) return "#";
      
      // Nếu là ảnh, thêm fl_attachment để ép tải xuống
      if (fileType === "image" || fileType === "img") {
          return url.replace("/upload/", "/upload/fl_attachment/");
      }
      
      // Nếu là file raw (PDF, Doc...), giữ nguyên URL gốc để tránh lỗi 404/401
      // Trình duyệt sẽ tự xử lý: PDF mở tab mới, Doc tự tải xuống
      return url;
  };

  const renderPostFile = (post) => {
      if (!post.image) return null;

      const isImage = post.fileType === "image" || post.fileType === "img" || post.image.match(/\.(jpeg|jpg|gif|png|webp)$/) != null;

      if (isImage) {
          return (
            <img 
                src={post.image} 
                alt="Post content" 
                className="rounded-lg w-full max-h-[400px] object-cover border border-base-300" 
            />
          );
      }

      let icon = <File className="size-10 text-gray-500" />;
      let label = "Attached File";

      if (post.image.includes(".pdf")) {
          icon = <FileText className="size-10 text-red-500" />;
          label = "PDF Document";
      } else if (post.image.includes(".doc") || post.image.includes(".docx")) {
          icon = <FileText className="size-10 text-blue-600" />;
          label = "Word Document";
      } else if (post.image.includes(".xls") || post.image.includes(".xlsx")) {
          icon = <FileSpreadsheet className="size-10 text-green-600" />;
          label = "Excel Spreadsheet";
      }

      return (
        <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg border border-base-300 hover:bg-base-300 transition-colors group">
            {icon}
            <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-sm truncate">{label}</h4>
                <p className="text-xs opacity-60">Click icon to download</p>
            </div>
            
            {/* ✅ SỬA LỖI: Dùng getDownloadUrl thông minh */}
            <a 
                href={getDownloadUrl(post.image, post.fileType)} 
                className="btn btn-sm btn-ghost btn-circle group-hover:bg-base-100"
                title="Download"
                target="_blank"             // Mở tab mới cho an toàn
                rel="noopener noreferrer"
                download                    // Gợi ý trình duyệt tải xuống
            >
                <Download className="size-5" />
            </a>
        </div>
      );
  };

  if (isLoading) return <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>;

  return (
    <div className="p-4 md:p-8 min-h-screen bg-base-100">
      <div className="max-w-3xl mx-auto space-y-6">
        
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
            <MessageSquare className="size-8 text-primary" /> Community Forum
        </h1>

        {/* CREATE POST WIDGET */}
        <div className="card bg-base-200 shadow-sm border border-base-300">
          <div className="card-body">
            <div className="flex gap-4">
              <div className="avatar">
                <div className="w-10 h-10 rounded-full">
                  <img src={authUser?.profilePic || "/avatar.png"} alt="avatar" />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <form onSubmit={handlePostSubmit}>
                    <textarea
                        className="textarea textarea-bordered w-full text-base resize-none"
                        placeholder="Share your thoughts or ask a question..."
                        rows={3}
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                    />
                    
                    {selectedFile && (
                        <div className="relative mt-3 p-2 border border-base-300 rounded-lg bg-base-100">
                            {renderFilePreview()}
                            
                            <button
                                type="button" 
                                className="absolute -top-2 -right-2 btn btn-circle btn-xs btn-error text-white shadow-md"
                                onClick={() => {
                                    setSelectedFile(null);
                                    if(fileInputRef.current) fileInputRef.current.value = "";
                                }}
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-3">
                        <div 
                            className="cursor-pointer text-primary hover:text-primary-focus flex items-center gap-2 transition-colors"
                            onClick={() => fileInputRef.current.click()}
                        >
                            <Paperclip className="size-5" />
                            <span className="text-sm font-medium">Attach File / Image</span>
                        </div>
                        
                        <input 
                            type="file" 
                            hidden 
                            ref={fileInputRef} 
                            accept="image/*, .pdf, .doc, .docx, .xls, .xlsx, .txt" 
                            onChange={handleFileChange} 
                        />

                        <button 
                            type="submit" 
                            className="btn btn-primary btn-sm"
                            disabled={isCreating || (!newPostContent.trim() && !selectedFile)}
                        >
                            {isCreating ? "Posting..." : "Post"} <Send className="size-4 ml-1" />
                        </button>
                    </div>
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* POSTS FEED */}
        <div className="space-y-4">
          {posts.map((post) => {
            const isLiked = post.likes.includes(authUser._id);
            const isOwner = authUser._id === post.author._id;

            return (
              <div key={post._id} className="card bg-base-100 shadow-lg border border-base-200">
                <div className="card-body p-5">
                  
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="avatar">
                            <div className="w-10 h-10 rounded-full">
                                <img src={post.author.profilePic || "/avatar.png"} alt={post.author.fullName} />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold">{post.author.fullName}</h3>
                            <p className="text-xs opacity-60">{new Date(post.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                    {isOwner && (
                        <button onClick={() => handleDeletePost(post._id)} className="btn btn-ghost btn-circle btn-sm text-error">
                            <Trash2 className="size-5" />
                        </button>
                    )}
                  </div>

                  {/* Content */}
                  <p className="text-base mb-2 whitespace-pre-wrap">{post.content}</p>

                  {/* Translate Button */}
                  <div className="mb-3">
                    <button 
                        onClick={() => handleTranslate(post._id, post.content)}
                        className="btn btn-xs btn-ghost gap-1 text-primary font-normal pl-0 hover:bg-transparent"
                        disabled={isTranslating[post._id]}
                    >
                        {isTranslating[post._id] ? <Loader2 className="size-3 animate-spin" /> : <Languages className="size-3" />}
                        {translatedPosts[post._id] ? "Show Original" : "Translate with AI"}
                    </button>

                    {translatedPosts[post._id] && (
                        <div className="mt-2 p-3 bg-base-200 rounded-lg text-sm border-l-4 border-primary animate-in fade-in slide-in-from-top-2">
                            <p className="opacity-80 italic">{translatedPosts[post._id]}</p>
                        </div>
                    )}
                  </div>

                  {/* File Display */}
                  {renderPostFile(post)}

                  {/* Actions */}
                  <div className="flex items-center gap-4 border-t border-base-200 pt-3 mt-3">
                    <button onClick={() => likeMutation(post._id)} className={`btn btn-ghost btn-sm gap-2 ${isLiked ? "text-error" : ""}`}>
                      <Heart className={`size-5 ${isLiked ? "fill-current" : ""}`} />
                      {post.likes.length}
                    </button>
                    <button className="btn btn-ghost btn-sm gap-2 cursor-default">
                      <MessageCircle className="size-5" />
                      {post.comments.length}
                    </button>
                  </div>

                  {/* Comments */}
                  <div className="bg-base-200 rounded-lg p-3 mt-3 space-y-3">
                    {post.comments.length > 0 && (
                        <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {post.comments.map((comment, idx) => (
                                <div key={idx} className="chat chat-start">
                                    <div className="chat-image avatar">
                                        <div className="w-6 rounded-full">
                                            <img src={comment.author.profilePic || "/avatar.png"} />
                                        </div>
                                    </div>
                                    <div className="chat-header text-xs opacity-50 mb-1 ml-1">
                                        {comment.author.fullName}
                                    </div>
                                    <div className="chat-bubble chat-bubble-secondary min-h-0 py-2 text-sm">
                                        {comment.text}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    <form onSubmit={(e) => handleCommentSubmit(e, post._id)} className="flex gap-2 items-center mt-2">
                        <input 
                            type="text" 
                            className="input input-bordered input-sm w-full rounded-full" 
                            placeholder="Write a comment..."
                            value={commentInputs[post._id] || ""}
                            onChange={(e) => setCommentInputs(prev => ({...prev, [post._id]: e.target.value}))}
                        />
                         <button type="submit" className="btn btn-circle btn-ghost btn-sm">
                             <Send className="size-4 text-primary" />
                         </button>
                    </form>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default ForumPage;