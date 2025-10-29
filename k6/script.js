import http from 'k6/http';
import ws from 'k6/ws';
import { check, sleep } from 'k6';
import { SharedArray } from 'k6/data';
// Import từ CDN (cách này ổn định)
import papaparse from 'https://cdn.jsdelivr.net/npm/papaparse@5.4.1/papaparse.min.js';

// -----------------------------------------------------------------
// TÙY CHỈNH CÁC BIẾN NÀY
// -----------------------------------------------------------------
const API_BASE_URL = __ENV.API_URL || 'http://localhost:5001'; // Cổng 5001
const WS_BASE_URL = __ENV.WS_URL || 'http://localhost:5001'; // Cổng 5001

// [SỬA ĐỔI] Giảm thời gian cho một phiên test nhanh
const SESSION_DURATION_MS = 30000; // 30 giây
const CHAT_MESSAGE_INTERVAL_MS = 4000; // 4 giây

// 1. TẢI DỮ LIỆU NGƯỜI DÙNG (users.csv)
const users = new SharedArray('users', function () {
    return papaparse.parse(open('./users.csv'), { header: true }).data;
});

// 2. CẤU HÌNH KIỂM THỬ (Đúng)
export const options = {
    scenarios: {
        chat_stress_test: {
            executor: 'ramping-vus',
            startVUs: 0,
            stages: [
                { duration: '10s', target: 5 },  // Tăng lên 5 VUs
                { duration: '30s', target: 100 },  // Giữ 10 VUs
                { duration: '30s', target: 1000 }, // Tăng lên 100 VUs
                 { duration: '30s', target: 200 }, // Tăng lên 100 VUs
                { duration: '30s', target: 100}, // Giữ 10 VUs
                { duration: '5s', target: 0 },  // Giảm tải
            ],
            gracefulRampDown: '10s',
        },
    },
    thresholds: {
        'http_req_failed': ['rate<0.01'],
        'checks{check:WebSocket connection established}': ['rate>0.99'], // Cú pháp này đã đúng
        'http_req_duration': ['p(95)<2000'],
    },
};

// -----------------------------------------------------------------
// 3. KỊCH BẢN TEST CỦA MỖI VU
// -----------------------------------------------------------------
export default function () {
    
    // ---- Lấy user từ CSV ----
    const vuIndex = __VU - 1; 
    const user = users[vuIndex % users.length]; 
    if (!user) { return; } 

    // ---- BƯỚC A: ĐĂNG NHẬP (HTTP) ----
    const loginPayload = JSON.stringify({
        email: user.gmail,
        password: user.password,
    });
    
    let httpParams = {
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    };

    // [SỬA ĐỔI] Sử dụng biến API_BASE_URL và đường dẫn đầy đủ
    const loginRes = http.post(`${API_BASE_URL}/api/auth/login`, loginPayload, httpParams);

    const loginCheck = check(loginRes, {
        'Login successful (status 200)': (r) => r.status === 200,
        'Got auth cookie "jwt"': (r) => r.cookies.jwt && r.cookies.jwt.length > 0,
    });

    console.log(`🔹 Login URL: ${API_BASE_URL}/api/auth/login`);

    if (!loginCheck) {
        console.error(`VU ${__VU} (User ${user.gmail}) đăng nhập thất bại: ${loginRes.body}`);
        return; 
    }

    const authTokenCookieValue = loginRes.cookies.jwt[0].value;

    // -----------------------------------------------------------------
    // ---- BƯỚC B: LẤY STREAM TOKEN (HTTP) ----
    // -----------------------------------------------------------------
    const streamTokenParams = {
        cookies: {
            jwt: authTokenCookieValue,
        },
        headers: {
            'Accept': 'application/json',
        },
    };

    // [SỬA ĐỔI] Sử dụng biến API_BASE_URL và đường dẫn đầy đủ
    const streamTokenRes = http.get(`${API_BASE_URL}/api/chat/token`, streamTokenParams);

    const streamTokenCheck = check(streamTokenRes, {
        'Get Stream Token successful (status 200)': (r) => r.status === 200,
        'Got Stream Token': (r) => r.json('token') !== undefined,
    });

    if (!streamTokenCheck) {
        console.error(`VU ${__VU} (User ${user.gmail}) lấy stream token thất bại: ${streamTokenRes.body}`);
        return;
    }

    const streamToken = streamTokenRes.json('token');

    // -----------------------------------------------------------------
    // ---- BƯỚC C: KẾT NỐI WEBSOCKET ----
    // -----------------------------------------------------------------
    
    // Tự động thay thế http://... thành ws://...
    const wsBase = WS_BASE_URL.replace('http', 'ws');
    
    // [SỬA ĐỔI] Sử dụng đường dẫn /socket
    const wsUrl = `${wsBase}/socket?token=${streamToken}`; // Đường dẫn socket
    
    const res = ws.connect(wsUrl, null, function (socket) {
        let messageInterval;
        socket.on('open', () => {
            socket.send(JSON.stringify({ event: 'join_room', room_id: 'general' }));
            messageInterval = socket.setInterval(() => {
                const message = `Message from VU ${__VU} at ${new Date().toISOString()}`;
                socket.send(JSON.stringify({ 
                    event: 'send_message', 
                    room_id: 'general',
                    content: message
                }));
            }, CHAT_MESSAGE_INTERVAL_MS + (Math.random() * 2000));
        });
        socket.on('error', (e) => {
            console.error(`VU ${__VU} (User ${user.gmail}) WS Error: ${e.error()}`);
        });
        socket.setTimeout(() => {
            socket.close(1000, "Session duration ended");
        }, SESSION_DURATION_MS);
        socket.on('close', (code) => {
             if (messageInterval) {
                socket.clearInterval(messageInterval);
             }
        });
    });

    // Tên check này phải khớp 100% với tên trong 'thresholds'
    check(res, { 'WebSocket connection established': (r) => r && r.status === 101 });
}