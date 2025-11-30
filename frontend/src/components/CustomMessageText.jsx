import { useState } from "react";
import {
  Languages, Loader2, Check, CheckCheck, Video, Phone,
  Trash2, Pin, MessageSquare, Heart, Ban, Reply
} from "lucide-react";
import {
  useMessageContext,
  useChatContext,
  Attachment
} from "stream-chat-react";
import { translateText } from "../lib/translateAPI";
import toast from "react-hot-toast";
import useAuthUser from "../hooks/useAuthUser";
import { useReplyContext } from "../context/ReplyContext";

const LANGUAGE_CODES = {
  english: "gb",
  spanish: "es",
  french: "fr",
  german: "de",
  mandarin: "cn",
  japanese: "jp",
  korean: "kr",
  hindi: "in",
  russian: "ru",
  portuguese: "pt",
  arabic: "sa",
  italian: "it",
  turkish: "tr",
  dutch: "nl",
  vietnamese: "vn",
  chinese: "cn",
  swedish: "se",
  polish: "pl",
  thai: "th",
  indonesian: "id",
};

const CustomMessageText = (props) => {
  const messageContext = useMessageContext();
  const { client } = useChatContext();
  const { setReplyMessage } = useReplyContext();
  const { authUser } = useAuthUser();
  const [translatedText, setTranslatedText] = useState(null);
  const [showOriginal, setShowOriginal] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const message = messageContext?.message || props.message;

  // Lấy handleAction từ context để xử lý các sự kiện click trên attachment (nếu có)
  const { handleAction } = messageContext || {};

  if (!message || !message.user) return null;
  const isMyMessage = message.user.id === client.userID;

  // --- LOGIC 1: TIN NHẮN ĐÃ THU HỒI ---
  const isDeleted = Boolean(message.deleted_at);

  // --- LOGIC DỊCH ---
  const enableTranslation = authUser?.enableTranslation !== false;
  const targetLang = authUser?.targetLanguage || authUser?.nativeLanguage || "english";
  const targetCode = LANGUAGE_CODES[targetLang.toLowerCase()] || 'en';

  const handleTranslate = async () => {
    if (!showOriginal) { setShowOriginal(true); return; }
    if (translatedText) { setShowOriginal(false); return; }
    setIsLoading(true);
    try {
      const result = await translateText(message.text, targetCode);
      setTranslatedText(result);
      setShowOriginal(false);
    } catch {
      toast.error("Translation failed");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ACTIONS ---
  const handleReaction = async () => {
    try {
      const ownReaction = message.own_reactions?.find(r => r.type === 'love');
      if (ownReaction) {
        await client.channel('messaging', message.cid.split(':')[1]).deleteReaction(message.id, 'love');
      } else {
        await client.channel('messaging', message.cid.split(':')[1]).sendReaction(message.id, { type: 'love' });
      }
    } catch (err) { console.error(err); }
  };

  const handleReply = () => {
    setReplyMessage(message);
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to revoke this message?")) return;
    try {
      await client.deleteMessage(message.id);
    } catch {
      toast.error("Failed to revoke message");
    }
  };

  const handlePin = async () => {
    try {
      if (message.pinned) {
        await client.unpinMessage(message);
        toast.success("Unpinned");
      } else {
        await client.pinMessage(message);
        toast.success("Pinned");
      }
    } catch {
      toast.error("Failed to pin");
    }
  };

  // --- RENDER NỘI DUNG ---
  const renderContent = () => {
    // If the message was deleted, show a styled revoked-message bubble
    if (isDeleted) {
      const deletedClass = isMyMessage
          ? "bg-primary text-primary-content rounded-2xl rounded-tr-sm"
          : "bg-base-200 text-base-content font-medium rounded-2xl rounded-tl-sm border border-base-300";
      return (
          <div className={`p-2 px-3 shadow-sm transition-all duration-200 w-fit max-w-full ${deletedClass}`}>
            <div className="flex items-center gap-2">
              <Ban className="w-4 h-4 opacity-70" />
              <span className="italic text-sm opacity-80">Message has been revoked</span>
            </div>
          </div>
      );
    }
    // A. Thẻ Gọi Điện (Giữ nguyên code gốc của bạn)
    const callAttachment = message.attachments?.find((a) => a.type === "video_call");
    if (callAttachment) {
      const outerBg = isMyMessage ? "bg-primary" : "bg-base-100";
      const outerBorder = isMyMessage ? "border-primary/20" : "border-base-300";
      const outerText = isMyMessage ? "text-primary-content" : "text-base-content";
      const badgeBg = isMyMessage ? "bg-white/20" : "bg-primary/10";
      const badgeText = isMyMessage ? "text-primary-content" : "text-primary";
      const buttonVariant = isMyMessage ? "bg-white text-primary hover:bg-white/90" : "btn-primary text-primary-content";

      return (
          <div className={`p-4 rounded-2xl shadow-lg w-64 border transition-all ${outerBg} ${outerBorder} ${outerText}`}>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-3 rounded-full shadow-sm ${badgeBg} ${badgeText}`}>
                <Video className="w-6 h-6" />
              </div>
              <div>
                <h3 className={`font-bold text-sm uppercase opacity-90 ${outerText}`}>{isMyMessage ? "Outgoing Call" : "Incoming Call"}</h3>
                <p className={`text-xs opacity-70 ${outerText}`}>Video Room</p>
              </div>
            </div>
            <button onClick={() => window.open(callAttachment.call_url, "_blank")}
                    className={`btn btn-sm w-full border-none gap-2 font-bold shadow-sm ${buttonVariant}`}>
              <Phone className="w-4 h-4" /> JOIN ROOM
            </button>
          </div>
      );
    }

    // B. Tin nhắn Text & Attachments
    const hasAttachments = message.attachments && message.attachments.length > 0;
    if (!message.text && !message.quoted_message && !hasAttachments) return null;

    return (
        <div className={`p-2 px-3 shadow-sm transition-all duration-200 w-fit max-w-full ${
            isMyMessage
                ? "bg-primary text-primary-content rounded-2xl rounded-tr-sm"
                : "bg-base-200 text-base-content font-medium rounded-2xl rounded-tl-sm border border-base-300"
        }`}>

          {/* HIỂN THỊ PHẦN TRÍCH DẪN */}
          {message.quoted_message && (
              <div className={`mb-2 p-2 rounded-lg text-xs border-l-4 opacity-90 shadow-sm select-none ${
                  isMyMessage
                      ? "bg-black/10 border-white/50 text-white"
                      : "bg-base-300/50 border-primary text-base-content"
              }`}>
                <div className="font-bold mb-0.5 flex items-center gap-1 opacity-90">
                  <Reply className="w-3 h-3" />
                  {message.quoted_message.user?.name || "User"}
                </div>
                <div className="truncate max-w-[200px] italic opacity-80">
                  {message.quoted_message.text || "Attachment"}
                </div>
              </div>
          )}

          {/* 3. HIỂN THỊ ATTACHMENTS (ĐÃ FIX LỖI) */}
          {hasAttachments && (
              <div className="flex flex-col gap-2 mb-1">
                {message.attachments.map((attachment, index) => (
                    <Attachment
                        key={`${message.id}-${index}`}
                        attachment={attachment}
                        attachments={message.attachments} /* <--- QUAN TRỌNG: Thêm dòng này để fix lỗi undefined filter */
                        actionHandler={handleAction}      /* <--- Thêm dòng này để hỗ trợ các action mặc định */
                    />
                ))}
              </div>
          )}

          {/* Text tin nhắn */}
          {message.text && (
              <p className="whitespace-pre-wrap break-words text-sm md:text-base leading-relaxed">
                {showOriginal ? message.text : translatedText}
              </p>
          )}

          <div className="flex items-center justify-end gap-2 mt-1 select-none">
            {/* Nút Dịch */}
            {!isMyMessage && enableTranslation && message.text && (
                <button onClick={handleTranslate} disabled={isLoading}
                        className="text-[10px] flex items-center gap-1 font-medium opacity-60 hover:opacity-100 transition-opacity">
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
                  <span>{isLoading ? "..." : showOriginal ? "Translate" : "Original"}</span>
                </button>
            )}
            {/* Status */}
            {isMyMessage && (
                <span className="opacity-70 flex items-center">
              {message.readBy?.filter(u => u.id !== client.userID).length > 0
                  ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            </span>
            )}
          </div>
        </div>
    );
  };

  return (
      <div className={`flex w-full mb-2 group ${isMyMessage ? "justify-end" : "justify-start"}`}>

        {/* Avatar */}
        {!isMyMessage && (
            <div className="flex flex-col justify-end mr-2 pb-1">
              <div className="avatar">
                <div className="w-8 h-8 rounded-full ring-1 ring-base-300">
                  <img src={message.user.image || "/i.png"} alt="avatar" />
                </div>
              </div>
            </div>
        )}

        {/* Content + Toolbar */}
        <div className={`flex flex-col max-w-[80%] ${isMyMessage ? "items-end" : "items-start"}`}>

          {!isMyMessage && (
              <span className="text-[10px] text-base-content/50 ml-1 mb-0.5">{message.user.name}</span>
          )}

          <div className="flex items-center gap-2 relative">

            {/* Toolbar (My Message) */}
            {isMyMessage && !message.deleted_at && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-base-100 p-1 rounded-full shadow-sm border border-base-200 absolute right-full mr-2 z-10">
                  <button onClick={handleReply} className="btn btn-ghost btn-xs btn-circle text-base-content/70" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                  <button onClick={handlePin} className="btn btn-ghost btn-xs btn-circle text-base-content/70" title="Pin"><Pin className={`w-3.5 h-3.5 ${message.pinned ? "fill-current" : ""}`} /></button>
                  <button onClick={handleDelete} className="btn btn-ghost btn-xs btn-circle text-error" title="Thu hồi"><Trash2 className="w-3.5 h-3.5" /></button>
                  <button onClick={handleDelete} className="btn btn-ghost btn-xs btn-circle text-error" title="Revoke"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
            )}

            {renderContent()}

            {/* Toolbar (Other Message) */}
            {!isMyMessage && !message.deleted_at && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-base-100 p-1 rounded-full shadow-sm border border-base-200 absolute left-full ml-2 z-10">
                  <button onClick={handleReaction} className={`btn btn-ghost btn-xs btn-circle ${message.own_reactions?.some(r => r.type === 'love') ? "text-red-500" : "text-base-content/70"}`} title="Like">
                    <Heart className={`w-3.5 h-3.5 ${message.own_reactions?.some(r => r.type === 'love') ? "fill-current" : ""}`} />
                  </button>
                  <button onClick={handleReply} className="btn btn-ghost btn-xs btn-circle text-base-content/70" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                  <button onClick={handlePin} className="btn btn-ghost btn-xs btn-circle text-base-content/70" title="Pin"><Pin className={`w-3.5 h-3.5 ${message.pinned ? "fill-current" : ""}`} /></button>
                </div>
            )}
          </div>

          {/* Reactions */}
          {message.reaction_counts?.love > 0 && !message.deleted_at && (
              <div className={`mt-[-10px] z-10 bg-base-100 border border-base-200 p-0.5 px-1.5 rounded-full shadow-sm flex items-center gap-1 text-[10px] ${isMyMessage ? "mr-1" : "ml-1"}`}>
                <Heart className="w-3 h-3 text-red-500 fill-current" />
                <span>{message.reaction_counts.love}</span>
              </div>
          )}
        </div>
      </div>
  );
};

export default CustomMessageText;