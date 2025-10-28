import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/User.js";

console.log("PASSPORT CONFIG ĐANG DÙNG URL:", process.env.GOOGLE_CALLBACK_URL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      // Hàm này sẽ chạy khi Google xác thực thành công
      // 'profile' chứa thông tin user từ Google
      try {
        // 1. Kiểm tra xem user đã tồn tại với googleId chưa
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Nếu có, trả về user đó để đăng nhập
          return done(null, user);
        }

        // 2. Nếu không, kiểm tra xem email đã tồn tại chưa
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // User đã tồn tại (đăng ký bằng email/pass), giờ liên kết tài khoản
          user.googleId = profile.id;
          user.profilePic = user.profilePic || profile.photos[0].value;
          await user.save();
          return done(null, user);
        }

        // 3. Nếu user hoàn toàn mới, tạo user mới
        const newUser = new User({
          googleId: profile.id,
          username: profile.displayName.replace(/ /g, "").toLowerCase() + Math.floor(Math.random() * 1000), // Tạo username tạm
          fullName: profile.displayName,
          email: profile.emails[0].value,
          profilePic: profile.photos[0].value,
          // Không cần password
        });

        await newUser.save();
        return done(null, newUser);
      } catch (err) {
        return done(err, false, { message: "Lỗi xác thực Google" });
      }
    }
  )
);