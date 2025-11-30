import { axiosInstance } from "./axios";

export const signup = async (signupData) => {
  const response = await axiosInstance.post("/auth/signup", signupData);
  return response.data;
};

export const login = async (loginData) => {
  const response = await axiosInstance.post("/auth/login", loginData);
  return response.data;
};
export const logout = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const getAuthUser = async () => {
  try {
    const res = await axiosInstance.get("/auth/me");
    return res.data;
  } catch (error) {
    console.log("Error in getAuthUser:", error);
    return null;
  }
};

export async function getProfile() {
  const response = await axiosInstance.get(`/users/me`);
  return response.data;
}

export async function updateProfile(profileData) {
  const response = await axiosInstance.put(`/users/me`, profileData);
  return response.data;
}

export const completeOnboarding = async (userData) => {
  const response = await axiosInstance.post("/auth/onboarding", userData);
  return response.data;
};

export async function getUserFriends() {
  const response = await axiosInstance.get("/users/friends");
  return response.data;
}

export async function getRecommendedUsers() {
  const response = await axiosInstance.get("/users");
  return response.data;
}

export async function getOutgoingFriendReqs() {
  const response = await axiosInstance.get("/users/outgoing-friend-requests");
  return response.data;
}

export async function sendFriendRequest(userId) {
  const response = await axiosInstance.post(`/users/friend-request/${userId}`);
  return response.data;
}

export async function getFriendRequests() {
  const response = await axiosInstance.get("/users/friend-requests");
  return response.data;
}

export async function acceptFriendRequest(requestId) {
  const response = await axiosInstance.put(`/users/friend-request/${requestId}/accept`);
  return response.data;
}

export async function getStreamToken() {
  const response = await axiosInstance.get("/chat/token");
  return response.data;
}

export const searchUsers = async (query) => {
  // LOG 1: Kiểm tra xem hàm này có được gọi không
  console.log("🚀 API searchUsers ĐƯỢC GỌI với từ khóa:", query);

  if (!query) return [];

  try {
    // LOG 2: Báo hiệu trước khi gửi request
    console.log("📡 Đang gửi axios request tới:", `/users/search?q=${query}`);
    
    const res = await axiosInstance.get(`/users/search?q=${query}`);
    
    // LOG 3: Báo hiệu khi có kết quả
    console.log("✅ Kết quả trả về từ Server:", res.data);
    return res.data;
  } catch (error) {
    console.error("❌ Lỗi khi gọi API Search:", error);
    return [];
  }
};
export const getRandomWord = async (language, nativeLanguage) => {
  const lang = language || "english";
  // Mặc định native là English nếu không có
  const native = nativeLanguage || "English"; 
  
  // Gửi nativeLanguage qua query param
  const res = await axiosInstance.get(`/users/word/${lang}?native=${native}`);
  return res.data;
};
export const getPosts = async () => {
  const res = await axiosInstance.get("/posts");
  return res.data;
};

export const createPost = async (postData) => {
  const res = await axiosInstance.post("/posts", postData);
  return res.data;
};

export const likePost = async (postId) => {
  const res = await axiosInstance.put(`/posts/${postId}/like`);
  return res.data;
};

export const commentPost = async ({ postId, text }) => {
  const res = await axiosInstance.post(`/posts/${postId}/comment`, { text });
  return res.data;
};

export const deletePost = async (postId) => {
  const res = await axiosInstance.delete(`/posts/${postId}`);
  return res.data;
};

export const translateText = async ({ text, targetLanguage }) => {
  const res = await axiosInstance.post("/users/translate", { text, targetLanguage });
  return res.data; // Trả về { translatedText: "..." }
};

export const getNotifications = async () => {
  const res = await axiosInstance.get("/users/notifications");
  return res.data;
};

export const markNotificationRead = async (notificationId) => {
    const res = await axiosInstance.put(`/users/notifications/${notificationId}/read`);
    return res.data;
}

export const declineFriendRequest = async (requestId) => {
  const res = await axiosInstance.delete(`/users/friend-request/${requestId}/decline`);
  return res.data;
}