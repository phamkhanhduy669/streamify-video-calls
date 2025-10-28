import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

// ================= CONFIG =================
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5001';
const MAX_VUS = Number(__ENV.MAX_VUS) || 30;
const STEP_DURATION = __ENV.STEP_DURATION || '30s';
const TIMEOUT = '10s';
const FAIL_LIMIT = 0.2; // stop test if >20% fail

// ================= CUSTOM METRICS =================
const failedRequests = new Counter('failed_requests');
const successfulRequests = new Counter('successful_requests');
const requestDuration = new Trend('request_duration');

// ================= BUILD STAGES =================
function buildStages(maxVus, stepDur) {
  const steps = Math.min(10, Math.ceil(maxVus / 5));
  const stages = [];
  const stepTarget = Math.ceil(maxVus / steps);

  for (let i = 1; i <= steps; i++) {
    stages.push({ duration: stepDur, target: Math.min(i * stepTarget, maxVus) });
  }
  stages.push({ duration: '1m', target: maxVus });
  stages.push({ duration: '30s', target: 0 });
  return stages;
}

export const options = {
  stages: buildStages(MAX_VUS, STEP_DURATION),
  thresholds: {
    http_req_failed: ['rate<0.2'], // 20% max failure
    http_req_duration: ['p(95)<3000'],
  },
};

// ================= LOGIN DATA =================
const CREDENTIALS = {
  email: __ENV.TEST_EMAIL || 'dnmd@gmail.com',
  password: __ENV.TEST_PASS || 'dnmd123',
};

// ================= STATE =================
let totalRequests = 0;
let totalFailures = 0;
let maxStableUsers = 0;
let lastPrintedVU = 0;

// ================= TEST FUNCTION =================
export default function () {
  totalRequests++;

  // ---- LOGIN ----
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify(CREDENTIALS),
    { headers: { 'Content-Type': 'application/json' }, timeout: TIMEOUT }
  );

  const okLogin = check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login returned token': (r) => {
      try {
        const j = r.json();
        return !!(j && (j.token || j.accessToken || (j.data && j.data.token)));
      } catch {
        return false;
      }
    },
  });

  if (!okLogin) {
    failedRequests.add(1);
    totalFailures++;
    checkStop();
    sleep(1);
    return;
  } else {
    successfulRequests.add(1);
  }

  // ---- PROTECTED ENDPOINT ----
  let token = null;
  try {
    const body = loginRes.json();
    token = body.token || body.accessToken || (body.data && body.data.token);
  } catch {}

  const res = http.get(`${BASE_URL}/api/users/me`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUT,
  });

  requestDuration.add(res.timings.duration);

  const ok = check(res, {
    'me status 200': (r) => r.status === 200,
    'me body not empty': (r) => r.body && r.body.length > 0,
  });

  if (!ok) {
    failedRequests.add(1);
    totalFailures++;
  }

  checkStop();

  if (__VU % 10 === 0 && __VU !== lastPrintedVU) {
    console.log(`🧍 Running ${__VU} concurrent users...`);
    lastPrintedVU = __VU;
  }

  sleep(1);
}

// ================= STOP CONDITION =================
function checkStop() {
  const failureRate = totalFailures / totalRequests;
  if (failureRate <= FAIL_LIMIT) {
    maxStableUsers = Math.max(maxStableUsers, __VU);
  }

  if (failureRate > FAIL_LIMIT) {
    console.error(
      `❌ Too many failures (${(failureRate * 100).toFixed(2)}%). Max stable users ≈ ${maxStableUsers}`
    );
    fail(`Stop test: Failure rate exceeded ${FAIL_LIMIT * 100}%`);
  }
}
