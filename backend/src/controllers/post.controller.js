import Post from "../models/Post.js";
import cloudinary from "../lib/cloudinary.js";

// Lấy tất cả bài viết
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "fullName profilePic")
      .populate("comments.author", "fullName profilePic")
      .sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error in getPosts:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// Helper: Upload file RAW lên Cloudinary
// Hàm này giờ đây nhận vào Buffer thay vì base64 string để linh hoạt hơn
const uploadToCloudinaryRaw = (fileBuffer, filename) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: filename,
        folder: "forum_posts",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper: Lấy extension từ MIME type
const getExtensionFromMime = (mimeType) => {
  const mimeMap = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    // Thêm các loại khác nếu cần
  };
  return mimeMap[mimeType] || "bin";
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    let imageUrl = null;
    let fileType = null;
    let publicId = null; // Lưu public_id để sau này xóa nếu cần

    if (image) {
      // Tách header và data của base64: "data:[mimeType];base64,[data]"
      const matches = image.match(/^data:(.+);base64,(.+)$/);

      if (!matches) {
        return res.status(400).json({ message: "Invalid file format" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // ---------------------------
      // 1. UPLOAD ẢNH HOẶC PDF
      // (PDF upload dạng này mới hỗ trợ flag fl_attachment để download)
      // ---------------------------
      if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "auto", // Để auto, Cloudinary sẽ xử lý PDF như image resource
          folder: "forum_posts",
        });
        
        imageUrl = uploadResponse.secure_url;
        publicId = uploadResponse.public_id;

        // Xử lý riêng cho PDF
        if (mimeType === "application/pdf") {
          // Chỉ thêm flag attachment nều là PDF (và đã upload dạng auto/image)
          imageUrl = imageUrl.replace("/upload/", "/upload/fl_attachment/");
          fileType = "raw"; // Lưu là raw để FE hiển thị link download
        } else {
          fileType = "image";
        }
      } 
      // ---------------------------
      // 2. UPLOAD FILE RAW KHÁC (DOCX, XLSX...)
      // ---------------------------
      else {
        const extension = getExtensionFromMime(mimeType);
        const filename = `file_${Date.now()}.${extension}`;
        const fileBuffer = Buffer.from(base64Data, "base64");

        // Tái sử dụng hàm helper uploadToCloudinaryRaw
        const uploadResponse = await uploadToCloudinaryRaw(fileBuffer, filename);
        
        // QUAN TRỌNG: KHÔNG thêm fl_attachment vào đây vì sẽ làm hỏng URL file raw
        imageUrl = uploadResponse.secure_url;
        
        publicId = uploadResponse.public_id;
        fileType = "raw";
      }
    }

    const newPost = new Post({
      author: req.user._id,
      content,
      image: imageUrl,
      fileType: fileType,
      // Lưu ý: Bạn nên thêm trường publicId vào Model Post nếu muốn xóa ảnh trên Cloudinary sau này
      // cloudinaryPublicId: publicId 
    });

    await newPost.save();
    res.status(201).json(newPost);

  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    
    // Kiểm tra xem user đã like chưa
    const isLiked = post.likes.includes(userId);

    if (isLiked) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    
    // Tìm post và push comment trực tiếp vào mảng comments
    // Sử dụng findByIdAndUpdate để tối ưu nếu không cần xử lý logic phức tạp
    // Tuy nhiên, cách dùng post.save() của bạn vẫn ổn để trigger middleware nếu có.
    
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      author: req.user._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();
    
    // Populate lại tác giả comment vừa tạo để trả về cho FE hiển thị ngay lập tức
    // (Tuỳ chọn, nhưng hữu ích cho UI)
    // await post.populate("comments.author", "fullName profilePic");

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in commentPost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check quyền
    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    // Xóa ảnh trên Cloudinary nếu có
    if (post.image) {
       // Để xóa chính xác, bạn cần lấy public_id. 
       // Nếu trong DB bạn lưu full URL, bạn cần parse public_id từ URL đó 
       // hoặc tốt nhất là lưu field `cloudinaryId` riêng trong Model Post.
       
       // Ví dụ logic lấy ID từ URL (cách đơn giản, không khuyến khích bằng lưu ID riêng):
       const urlParts = post.image.split('/');
       const fileNameWithExt = urlParts[urlParts.length - 1];
       const publicId = `forum_posts/${fileNameWithExt.split('.')[0]}`; // folder + filename
       
       // Xác định resource_type
       // Mặc định là 'image' (bao gồm cả PDF upload kiểu mới)
       // Chỉ dùng 'raw' nếu fileType là raw VÀ không phải pdf
       let resourceType = "image";
       if (post.fileType === "raw") {
           // Nếu là raw nhưng URL chứa .pdf thì nó thực chất là resource image trên Cloudinary
           if (post.image.includes(".pdf")) {
               resourceType = "image";
           } else {
               resourceType = "raw";
           }
       }
       
       await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    }

    // Xóa post
    // Sử dụng deleteOne() trên document instance thay vì gọi query mới findByIdAndDelete
    await post.deleteOne(); 

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};