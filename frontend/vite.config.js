import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Cổng frontend của bạn
    proxy: {
      // Thêm cấu hình proxy vào đây
      "/api": {
        target: "http://localhost:5001", // Địa chỉ backend của bạn
        changeOrigin: true, // Cần thiết để server backend chấp nhận request
      },
    },
  },
});