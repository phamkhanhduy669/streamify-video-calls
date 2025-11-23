import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StreamChatProvider from "./context/StreamChatProvider.jsx";

import "stream-chat-react/dist/css/v2/index.css";

import "./index.css";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
        {/* BrowserRouter phải bao bọc tất cả Provider có sử dụng hook của router (như useNavigate) */}
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <StreamChatProvider>
                    <App />
                </StreamChatProvider>
            </QueryClientProvider>
        </BrowserRouter>
    </React.StrictMode>
);