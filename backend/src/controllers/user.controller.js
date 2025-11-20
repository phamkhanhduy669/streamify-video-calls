import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import { streamClient, upsertStreamUser } from "../lib/stream.js"

export const deleteFriend = async (req, res) => {
  try {
    const { id: friendId } = req.params;
    const userId = req.user._id; 

    // 1. Tìm cả hai user
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);

    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // 2. Xóa khỏi mảng 'friends' của cả hai (với kiểm tra an toàn || [])
    user.friends = (user.friends || []).filter(
      (id) => id.toString() !== friendId
    );
    friend.friends = (friend.friends || []).filter(
      (id) => id.toString() !== userId.toString()
    );

    // 3. ✨ QUAN TRỌNG: Xóa tất cả các lời mời kết bạn (cũ) 
    await FriendRequest.deleteMany({
      $or: [
        { sender: userId, recipient: friendId },
        { sender: friendId, recipient: userId },
      ],
    });

    // 4. Lưu lại thay đổi
    await user.save();
    await friend.save();

    res.status(200).json({ message: "Friend deleted and requests reset" });
  } catch (error) {
    console.error("Error deleting friend:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    const recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } }, //exclude current user
        { _id: { $nin: currentUser.friends } }, // exclude current user's friends
        { isOnboarded: true },
      ],
    });
    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(user.friends);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const sender = req.user
    const { id: recipientId } = req.params;

    // prevent sending req to yourself
    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    // check if user is already friends
    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    // check if a req already exists
    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
    });
    // ✅ SỬA 2: GỬI SỰ KIỆN CUSTOM (NOTIFICATION)
    // Gửi 1 sự kiện tên là "friendrequest_new"
    // CHỈ cho user có ID là 'recipientId'
    try {
      await streamClient.sendUserCustomEvent(recipientId, {
        type: "friendrequest_new", // Tên sự kiện
        payload: {
          sender: { // Gửi kèm thông tin người gửi
            id: sender.id,
            name: sender.fullName,
            image: sender.profilePic,
          },
        },
      });
      console.log(`[Stream] Đã gửi sự kiện 'friendrequest_new' tới ${recipientId}`);
    } catch (eventError) {
      console.error("[Stream] Lỗi gửi sự kiện custom:", eventError);
      // Không cần 'return' lỗi, vì lời mời đã được lưu
    }

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Verify the current user is the recipient
    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    await friendRequest.save();

    // add each user to the other's friends array
    // $addToSet: adds elements to an array only if they do not already exist.
    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getProfile(req, res) {
  try {
    // req.user is set by protectRoute and already has sensitive fields omitted
    res.status(200).json({ user: req.user });
  } catch (error) {
    console.error("Error in getProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateProfile(req, res) {
  try {
    const userId = req.user._id;

    const allowed = [
      "fullName",
      "bio",
      "profilePic",
      "nativeLanguage",
      "learningLanguage",
      "location",
    ];

    const updates = {};
    allowed.forEach((f) => {
      if (Object.prototype.hasOwnProperty.call(req.body, f)) {
        updates[f] = req.body[f];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No valid fields provided for update" });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    // keep Stream user metadata in sync
    try {
      await upsertStreamUser({ id: updatedUser._id.toString(), name: updatedUser.fullName, image: updatedUser.profilePic || "" });
    } catch (streamErr) {
      console.log("Error syncing Stream user after profile update:", streamErr.message);
    }

    res.status(200).json({ user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const currentUserId = req.user._id;

    // Log xem client gửi lên chữ gì
    console.log(`🔍 Client đang tìm: "${q}"`);

    if (!q) return res.status(200).json([]);

    const users = await User.find({
      _id: { $ne: currentUserId }, // Loại trừ bản thân
      $or: [
        // Tìm gần đúng, không phân biệt hoa thường (i = case insensitive)
        { fullName: { $regex: q, $options: "i" } }, 
        { email: { $regex: q, $options: "i" } },
      ],
    }).select("fullName profilePic email");

    // Log xem tìm được bao nhiêu người
    console.log(`✅ Tìm thấy: ${users.length} kết quả trong DB.`);
    
    // Nếu tìm thấy, in tên ra để kiểm tra
    if (users.length > 0) {
        users.forEach(u => console.log(`   - Found: ${u.fullName}`));
    } else {
        console.log("⚠️ Không tìm thấy ai (hoặc người tìm thấy chính là bạn).");
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user._id;
    
    const updatedRequest = await FriendRequest.findOneAndUpdate(
      {
        _id: requestId,
        $or: [{ sender: userId }, { recipient: userId }]
      },
      { read: true },
      { new: true }
    );

    if (!updatedRequest) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.status(200).json({ message: "Marked as read", data: updatedRequest });
  } catch (error) {
    console.log("Error in markNotificationRead:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};