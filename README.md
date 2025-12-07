Member:
- Nguyễn Mạnh Dũng - 23020520
- Phạm Khánh Duy - 23020522
- Dương Nguyễn Minh Đức - 23020525

# Streamify - Real-time Video Call & Social Platform

[streamifyapp.id.vn](https://streamifyapp.id.vn/)

Streamify is a modern Full-stack social networking and real-time communication platform, featuring Video Calls, Instant Messaging (Chat), and a dynamic Newsfeed. The project is built with a Microservices-ready architecture, containerized with Docker, and orchestrated on Kubernetes with a fully automated CI/CD pipeline.

## 🚀 Key Features
💬 Real-time Communication
- High-Quality Video Calls: Direct video calls between users.

- Instant Messaging: Real-time messaging powered by Socket.io.

- Multimedia Support: Send images via chat (integrated with Cloudinary).

- Message Translation: Automatic message translation to support multi-language conversations.
🌏 Social Network
- Newsfeed: Create posts, comment, and interact (Like/Comment).

- Friend Management: Send friend requests, accept/decline, and view friend lists.

- Notifications: Real-time notification system for new interactions.

- User Profile: Edit personal information, avatar, and cover photo.

🛡️ Security & Authentication
- Authentication: Secure Login/Signup with JWT (JSON Web Tokens).

- Password Security: Password hashing using Bcrypt.

---

# 🔧 Installation & Local Run

## 🧪 .env Setup

### Backend (`/backend`)

```.env
# Server configuration
PORT=5001
NODE_ENV=development

# Database (MongoDB)
MONGO_URI=<your_mongo_url>

# Steam API
STEAM_API_KEY=<your_steam_api_key>
STEAM_API_SECRET=<your_steam_api_secret>

# JWT
JWT_SECRET_KEY=<your_jwt_secret_key>

# Google OAuth
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:5001/api/auth/google/callback

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Gemini API
GEMINI_API_KEY=<your_gemini_api_key>

# Cloudinary
CLOUDINARY_CLOUD_NAME=<your_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
```

### Frontend (`/frontend`)

```.env
VITE_STREAM_API_KEY=your_stream_api_key
VITE_API_BASE_URL=http://localhost:5001
VITE_GOOGLE_AUTH_URL=http://localhost:5001/api/auth/google
```

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

## 💻 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
--- 
# DEMO

<img width="1704" height="888" alt="image" src="https://github.com/user-attachments/assets/a502829c-c201-40e1-843c-bd46bb2f6786" />

