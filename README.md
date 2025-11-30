Thành viên:
- Nguyễn Mạnh Dũng - 23020520
- Phạm Khánh Duy - 23020522
- Dương Nguyễn Minh Đức - 23020525

> ## 📘 Sử dụng k8s 
> 🔗 [Xem chi tiết tại đây](k8s/README.md)
---

## 🧪 .env Setup

### Backend (`/backend`)

```.env
PORT=5001
MONGO_URI=your_mongo_uri
STEAM_API_KEY=your_steam_api_key
STEAM_API_SECRET=your_steam_api_secret
JWT_SECRET_KEY=your_jwt_secret
NODE_ENV=development
```

### Frontend (`/frontend`)

```.env
VITE_STREAM_API_KEY=your_stream_api_key
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
