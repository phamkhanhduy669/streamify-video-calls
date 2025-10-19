# Hướng dẫn triển khai ứng dụng với Kubernetes

## ✅ Yêu cầu

Docker Desktop: Đã được cài đặt và đã bật Kubernetes trong Settings > Kubernetes > Enable Kubernetes.

kubectl: Công cụ dòng lệnh để tương tác với Kubernetes.

## 🚀 Chạy trên môi trường Local (Để phát triển & kiểm thử)

### 1. Lấy image từ Docker hub
```
# Pull image của backend
docker pull phamkhanhduy/streamify-backend:latest

# Pull image của frontend
docker pull phamkhanhduy/streamify-frontend:latest
```

### 2. Tạo file secrets.yaml

File này chứa các thông tin nhạy cảm và không được đưa lên Git. Bạn phải tự tạo nó.

a. Trong thư mục k8s này, tạo một file mới tên là `secrets.yaml`

b. Dán nội dung sau vào và thay thế bằng các giá trị đã được mã hóa Base64 của bạn:
``` 
apiVersion: v1
kind: Secret
metadata:
  name: streamify-secrets
type: Opaque
data:
  MONGO_URI: "your_mongo_uri_base64"
  STEAM_API_KEY: "your_steam_api_key_base64"
  STEAM_API_SECRET: "your_steam_api_secret_base64"
  JWT_SECRET_KEY: "your_jwt_secret_base64"
```
***Lệnh base64 với pwsh*** :
``` 
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("your_mongo_uri_base64"))
```

### 3. Triển khai lên Kubernetes

Chạy lần lượt các lệnh sau:

a. Cài đặt Ingress Controller (Chỉ làm một lần):

```
kubectl apply -f [https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml](https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/cloud/deploy.yaml)
```


b. Áp dụng các file cấu hình:
```
# Áp dụng các biến môi trường không nhạy cảm và bí mật
kubectl apply -f ./configmap.yaml
kubectl apply -f ./secrets.yaml

# Triển khai ứng dụng với các file deployment DÀNH RIÊNG cho local
kubectl apply -f ./backend-deployment.local.yaml
kubectl apply -f ./frontend-deployment.local.yaml

# Áp dụng các services và ingress
kubectl apply -f ./backend-service.yaml
kubectl apply -f ./frontend-service.yaml
kubectl apply -f ./ingress.yaml
```

### 4. Truy cập Ứng dụng

Sau khi các pod đã ở trạng thái Running (kiểm tra bằng kubectl get pods), mở trình duyệt và truy cập:

➡️ http://localhost

🧹 Dọn dẹp

Để xóa tất cả các tài nguyên Kubernetes đã tạo bởi các file trong thư mục này, chạy lệnh:

```
kubectl delete -f .
```
