import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "stream-chat-react/dist/css/v2/index.css";
import "./index.css";
import App from "./App.jsx";

import { BrowserRouter } from "react-router"; // make sure this is react-router-dom if using DOM
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StreamChatProvider } from "./context/StreamChatProvider.jsx"; // ✅ add this import

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <StreamChatProvider> {/* ✅ wrap your entire app here */}
          <App />
        </StreamChatProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
