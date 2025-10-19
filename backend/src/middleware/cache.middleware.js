import NodeCache from "node-cache";

// stdTTL: thời gian sống mặc định của cache (giây). 5 phút.
const cache = new NodeCache({ stdTTL: 300 });

const cacheMiddleware = (duration) => (req, res, next) => {
    if (req.method !== "GET") {
        return next();
    }

    // Tạo key cache bao gồm cả user id để đảm bảo cache là của riêng mỗi người
    const key = req.user.id + ":" + req.originalUrl;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
        console.log(`Cache hit for key: ${key}`);
        return res.json(JSON.parse(cachedResponse)); // Trả về dữ liệu từ cache
    } else {
        console.log(`Cache miss for key: ${key}`);
        const originalJson = res.json;
        res.json = (body) => {
            // Lưu response vào cache
            cache.set(key, JSON.stringify(body), duration);
            originalJson.call(res, body);
        };
        next();
    }
};
export default cacheMiddleware;