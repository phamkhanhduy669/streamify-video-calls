import { create } from "zustand";

export const useSearchStore = create((set) => ({
  searchQuery: "", // Từ khóa chính thức để lọc
  setSearchQuery: (query) => set({ searchQuery: query }),
}));