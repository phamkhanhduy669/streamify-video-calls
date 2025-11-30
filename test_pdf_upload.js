import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// Load biến môi trường từ file .env
dotenv.config();

// Cấu hình Cloudinary (Lấy từ .env của bạn)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Đây là một file PDF "Hello World" cực nhỏ dưới dạng Base64
const base64PDF = `data:application/pdf;base64,JVBERi0xLjcKCjEgMCBvYmogICUgZW50cnkgcG9pbnQKPDwKICAvVHlwZSAvQ2F0YWxvZwogIC9QYWdlcyAyIDAgUgo+PgRlbmRvYmoKCjIgMCBvYmogCjw8CiAgL1R5cGUgL1BhZ2VzCiAgL01lZGlhQm94IFsgMCAwIDIwMCAyMDAgXQogIC9Db3VudCAxCiAgL0tpZHMgWyAzIDAgUiBdCj4+CmVuZG9iagoKMyAwIG9iago8PAogIC9UeXBlIC9QYWdlCiAgL1BhcmVudCAyIDAgUgogIC9SZXNvdXJjZXMgPDwKICAgIC9Gb250IDw8CiAgICAgIC9FMSA0IDAgUgogICAgPj4KICA+PgogIC9Db250ZW50cyA1IDAgUgo+PgRlbmRvYmoKCjQgMCBvYmogCjw8CiAgL1R5cGUgL0ZvbnQKICAvU3VidHlwZSAvVHlwZTEKICAvQmFzZUZvbnQgL0hlbHZldGljYQo+PgRlbmRvYmoKCjUgMCBvYmogCjw8IC9MZW5ndGggMjIgPj4Kc3RyZWFtCkJUCi9FMSAxMiBUZgoxMCAxMCBUZAooSGVsbG8gV29ybGQpIFRqCkVUCmVuZHN0cmVhbQRlbmRvYmoKCnhyZWYKMCA2CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxMCAwMDAwMCBuIAowMDAwMDAwMDYwIDAwMDAwIG4gCjAwMDAwMDAxNTcgMDAwMDAgbiAKMDAwMDAwMDI1NSAwMDAwMCBuIAowMDAwMDAwMzQzIDAwMDAwIG4gCnRyYWlsZXIKPDwKICAvU2l6ZSA2CiAgL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjQxMwolJUVPRgo=`;

const testUploadPDF = async () => {
  console.log("🚀 Đang bắt đầu test upload PDF...");

  try {
    // 1. Chuẩn bị Buffer từ Base64
    const matches = base64PDF.match(/^data:(.+);base64,(.+)$/);
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const filename = `test_pdf_${Date.now()}.pdf`;

    // 2. Thực hiện Upload (Logic GIỐNG HỆT controller đã sửa)
    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",      // Bắt buộc là raw để tránh lỗi 401
          public_id: filename,
          folder: "test_uploads",    // Upload vào folder test cho gọn
          use_filename: true,
          unique_filename: false,
          
          // CẤU HÌNH QUAN TRỌNG NHẤT:
          type: "upload",            // Public
          access_mode: "public"      // Truy cập công khai
        },
        (error, result) => {
          if (error) {
            console.error("❌ Upload thất bại:", error);
            reject(error);
          } else {
            console.log("✅ Upload thành công!");
            console.log("---------------------------------------------------");
            console.log("🔗 URL Của File PDF:", result.secure_url);
            console.log("---------------------------------------------------");
            console.log("👉 Hãy click vào link trên để xem trình duyệt có mở được không.");
            resolve(result);
          }
        }
      );
      uploadStream.end(buffer);
    });

  } catch (error) {
    console.error("Lỗi Test:", error);
  }
};

// Chạy test
testUploadPDF();