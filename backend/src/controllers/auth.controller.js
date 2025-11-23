import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

// 1. Hàm helper dùng chung cho Login, Signup và Google Callback
const generateTokenAndSetCookie = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true, // prevent XSS
    sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax", // QUAN TRỌNG: "lax" cho localhost
    secure: process.env.NODE_ENV === "production", // false cho localhost http
  });

  return token;
};

export const googleCallback = async (req, res) => {
  try {
    generateTokenAndSetCookie(req.user._id, res);
    res.redirect(process.env.FRONTEND_URL);
  } catch (error) {
    console.error("Error in Google Callback:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
  }
};

export async function signup(req, res) {
  const { email, password, fullName } = req.body;
  try {
    if (!email || !password || !fullName) return res.status(400).json({ message: "All fields are required" });
    if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: `https://avatar.iran.liara.run/public/${Math.floor(Math.random() * 100) + 1}.png`,
    });

    // Sync with Stream Chat
    try {
      await upsertStreamUser({ id: newUser._id.toString(), name: newUser.fullName, image: newUser.profilePic });
    } catch (error) {
      console.log("Error syncing Stream user:", error);
    }

    // Dùng hàm helper để set cookie (Đã fix sameSite: lax)
    generateTokenAndSetCookie(newUser._id, res);

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "All fields are required" });

    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Dùng hàm helper để set cookie (Đã fix sameSite: lax)
    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log("Error in login controller", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  // (Giữ nguyên logic onboard của bạn ở đây nếu cần)
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;
    // ... validation ...
    const updatedUser = await User.findByIdAndUpdate(userId, { ...req.body, isOnboarded: true }, { new: true });
    // sync stream...
    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
}