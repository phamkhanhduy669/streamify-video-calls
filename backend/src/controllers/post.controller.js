import Post from "../models/Post.js";
import cloudinary from "../lib/cloudinary.js";
import { streamClient } from "../lib/stream.js";
import Notification from "../models/Notification.js";
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

// Helper: Lấy extension chuẩn từ MIME type
const getExtensionFromMime = (mimeType) => {
  const mimeMap = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/msword": "doc",
    "text/plain": "txt",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.ms-excel": "xls",
    "text/csv": "csv",
  };
  return mimeMap[mimeType] || "bin";
};

// Helper: Upload Raw File
const uploadToCloudinaryRaw = (fileBuffer, filename, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: filename,
        folder: "forum_posts",
        use_filename: true,
        unique_filename: false,
        ...options,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
};

export const createPost = async (req, res) => {
  try {
    const { content, image } = req.body;
    let imageUrl = null;
    let fileType = null;

    if (image) {
      const matches = image.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
        return res.status(400).json({ message: "Invalid file format" });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];

      // ---------------------------------------------------------
      // TRƯỜNG HỢP 1: ẢNH (JPG, PNG...)
      // ---------------------------------------------------------
      if (mimeType.startsWith("image/")) {
        const uploadResponse = await cloudinary.uploader.upload(image, {
          resource_type: "image",
          folder: "forum_posts",
        });
        
        imageUrl = uploadResponse.secure_url;
        fileType = "image";
      } 
      // ---------------------------------------------------------
      // TRƯỜNG HỢP 2: FILE TÀI LIỆU (PDF, DOCX, TXT...)
      // ---------------------------------------------------------
      else {
        const extension = getExtensionFromMime(mimeType);
        const filename = `file_${Date.now()}.${extension}`;
        const fileBuffer = Buffer.from(base64Data, "base64");

        // --- XỬ LÝ CHO PDF: ÉP BUỘC PUBLIC ĐỂ KHÔNG BỊ LỖI ACCESS ---
        if (extension === "pdf") {
          const uploadResponse = await uploadToCloudinaryRaw(fileBuffer, filename, {
            type: "upload",      // Loại upload thường (Public)
            access_mode: "public" // Chế độ truy cập công khai
          });
          
          imageUrl = uploadResponse.secure_url;
          fileType = "raw";
        } 
        // --- CÁC FILE KHÁC (DOCX, TXT...) ---
        else {
          const uploadResponse = await uploadToCloudinaryRaw(fileBuffer, filename);
          imageUrl = uploadResponse.secure_url;
          fileType = "raw";
        }
      }
    }

    const newPost = new Post({
      author: req.user._id,
      content,
      image: imageUrl,
      fileType: fileType,
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
    const post = await Post.findById(req.params.id).populate("author", "fullName profilePic");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const user = req.user; // Người thực hiện hành động like

    if (post.likes.includes(userId)) {
      // Unlike
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      // Like
      post.likes.push(userId);

      // 🔔 GỬI THÔNG BÁO (Chỉ gửi khi Like, không gửi khi Unlike)
      // Và không gửi nếu tự like bài mình
      if (post.author._id.toString() !== userId.toString()) {
        const newNotif = new Notification({
                recipient: post.author._id,
                sender: user._id,
                type: "like",
                postId: post._id,
                message: `${user.fullName} liked your post.`
                });
            await newNotif.save();
          try {
            await streamClient.sendUserCustomEvent(post.author._id.toString(), {
                type: "notification_new", // Tên sự kiện chung cho thông báo
                payload: {
                    type: "like", // Loại thông báo
                    sender: { 
                        id: user._id.toString(),
                        name: user.fullName,
                        image: user.profilePic 
                    },
                    postId: post._id.toString(),
                    message: `${user.fullName} liked your post.`
                },
            });
          } catch (streamErr) {
              console.error("Failed to send like notification:", streamErr);
          }
      }
    }
    
    await post.save();
    res.status(200).json(post);
  } catch (error) {
    console.error("Error in likePost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// ✅ HÀM COMMENT (ĐÃ THÊM NOTIFICATION)
export const commentPost = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id).populate("author", "fullName profilePic");
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = req.user; // Người comment

    const newComment = {
      author: user._id,
      text,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    // 🔔 GỬI THÔNG BÁO
    // Không gửi nếu tự comment bài mình
    if (post.author._id.toString() !== user._id.toString()) {
      const newNotif = new Notification({
            recipient: post.author._id,
            sender: user._id,
            type: "comment",
            postId: post._id,
            message: `${user.fullName} commented on your post.`
       });
       await newNotif.save();
        try {
            await streamClient.sendUserCustomEvent(post.author._id.toString(), {
                type: "notification_new",
                payload: {
                    type: "comment",
                    sender: { 
                        id: user._id.toString(),
                        name: user.fullName,
                        image: user.profilePic 
                    },
                    postId: post._id.toString(),
                    message: `${user.fullName} commented on your post: "${text.substring(0, 20)}${text.length > 20 ? '...' : ''}"`
                },
            });
          } catch (streamErr) {
              console.error("Failed to send comment notification:", streamErr);
          }
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error in commentPost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    if (post.image) {
       const urlParts = post.image.split('/');
       const fileNameWithExt = urlParts[urlParts.length - 1]; 
       const cleanFileName = fileNameWithExt.split('?')[0]; 
       
       let publicId = `forum_posts/${cleanFileName}`;
       
       // Kiểm tra xem link có phải authenticated không (đề phòng xóa file cũ)
       const isAuthenticated = post.image.includes("/authenticated/");

       if (post.fileType === "image") {
           const nameOnly = cleanFileName.substring(0, cleanFileName.lastIndexOf('.'));
           publicId = `forum_posts/${nameOnly}`;
           await cloudinary.uploader.destroy(publicId); 
       } else {
           const destroyOptions = { resource_type: "raw" };
           // Nếu là file cũ (authenticated) thì xóa kiểu authenticated, file mới (public) thì xóa kiểu thường
           if (isAuthenticated) {
               destroyOptions.type = "authenticated";
           }
           await cloudinary.uploader.destroy(publicId, destroyOptions);
       }
    }

    await post.deleteOne(); 
    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error in deletePost:", error);
    res.status(500).json({ message: "Server Error" });
  }
};