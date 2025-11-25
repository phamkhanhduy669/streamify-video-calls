// frontend/src/context/ReplyContext.jsx
import { createContext, useContext, useState } from "react";

const ReplyContext = createContext();

export const useReplyContext = () => {
  const context = useContext(ReplyContext);
  if (!context) {
    // Trả về object rỗng an toàn để tránh crash nếu quên bọc Provider
    return { replyMessage: null, setReplyMessage: () => {} };
  }
  return context;
};

export const ReplyProvider = ({ children }) => {
  const [replyMessage, setReplyMessage] = useState(null);

  return (
    <ReplyContext.Provider value={{ replyMessage, setReplyMessage }}>
      {children}
    </ReplyContext.Provider>
  );
};