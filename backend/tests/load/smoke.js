import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.K6_BASE_URL || 'http://localhost:3000';
const VILLAGE_CODE = __ENV.K6_VILLAGE_CODE || '194657';
const VILLAGE_PASSWORD = __ENV.K6_VILLAGE_PASSWORD || 'Village09Pass';
const VILLAGE_NEW_PASSWORD = __ENV.K6_VILLAGE_NEW_PASSWORD || 'SmokeTest2026!';
const DISTRICT_CODE = __ENV.K6_DISTRICT_CODE || 'MMR0100';
const DISTRICT_PASSWORD = __ENV.K6_DISTRICT_PASSWORD || 'District09Pass';
const DISTRICT_NEW_PASSWORD = __ENV.K6_DISTRICT_NEW_PASSWORD || 'SmokeTest2026!';

// k6 rate must be an integer; rates expressed per 10s window.
// Rate-limit budgets are cumulative for the whole run (pexpire refreshes on
// every request): anon <= 30 total (setup + loginFlow), village <= 100 total
// (list + sync). Full D-47 gate (1000 concurrent): raise RATE_LIMIT_* and scale rates.
export const options = {
  scenarios: {
    login: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '10s',
      duration: '2m',
      exec: 'loginFlow',
      preAllocatedVUs: 5,
      maxVUs: 10
    },
    list: {
      executor: 'constant-arrival-rate',
      rate: 5,
      timeUnit: '10s',
      duration: '2m',
      exec: 'listFlow',
      preAllocatedVUs: 10,
      maxVUs: 20,
      startTime: '5s'
    },
    sync: {
      executor: 'constant-arrival-rate',
      rate: 2,
      timeUnit: '10s',
      duration: '2m',
      exec: 'syncFlow',
      preAllocatedVUs: 5,
      maxVUs: 10,
      startTime: '10s'
    },
    report: {
      executor: 'constant-arrival-rate',
      rate: 1,
      timeUnit: '10s',
      duration: '2m',
      exec: 'reportFlow',
      preAllocatedVUs: 2,
      maxVUs: 5,
      startTime: '15s'
    }
  },
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.01']
  }
};

const jsonHeaders = { 'Content-Type': 'application/json' };

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

const loginReq = (loginCode, password) =>
  http.post(
    `${BASE}/api/v1/auth/login`,
    JSON.stringify({ loginCode, password }),
    { headers: jsonHeaders, tags: { name: 'login' } }
  );

const ensureAuth = (loginCode, oldPassword, newPassword) => {
  let res = loginReq(loginCode, oldPassword);
  if (res.status === 200) {
    return { token: res.json('data.accessToken'), password: oldPassword };
  }
  res = loginReq(loginCode, newPassword);
  if (res.status === 200) {
    return { token: res.json('data.accessToken'), password: newPassword };
  }
  throw new Error(`setup: cannot login ${loginCode} (${oldPassword}/${newPassword})`);
};

export function setup() {
  return {
    village: ensureAuth(VILLAGE_CODE, VILLAGE_PASSWORD, VILLAGE_NEW_PASSWORD),
    district: ensureAuth(DISTRICT_CODE, DISTRICT_PASSWORD, DISTRICT_NEW_PASSWORD)
  };
}

export function loginFlow(data) {
  const res = loginReq(VILLAGE_CODE, data.village.password);
  check(res, { 'login status 200': (r) => r.status === 200 });
}

export function listFlow(data) {
  const res = http.get(`${BASE}/api/v1/surveys?page=1&per_page=20`, {
    headers: { Authorization: `Bearer ${data.village.token}` },
    tags: { name: 'list_surveys' }
  });
  check(res, { 'list status 200': (r) => r.status === 200 });
}

export function syncFlow(data) {
  const payload = JSON.stringify({
    items: [
      {
        localRowId: `k6-${uuid()}`,
        op: 'create',
        survey: {
          bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 }],
          smallAnimals: [],
          poultry: [{ categoryId: 1, ageLimit: 'Old', sex: 'female', count: 5 }]
        },
        interview: {
          hName: 'Load Test Household',
          hEdu: 'None',
          hGender: 'male',
          hPhone: '09123456789',
          hAge: 40,
          ansDate: '2026-01-15'
        }
      }
    ]
  });
  const res = http.post(`${BASE}/api/v1/sync/push`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.village.token}`,
      'Idempotency-Key': uuid()
    },
    tags: { name: 'sync_push' }
  });
  check(res, { 'sync status 200': (r) => r.status === 200 });
}

export function reportFlow(data) {
  const res = http.get(`${BASE}/api/v1/reports/district`, {
    headers: { Authorization: `Bearer ${data.district.token}` },
    tags: { name: 'report_district' }
  });
  check(res, { 'report status 200': (r) => r.status === 200 });
}
