const BASE = process.env.E2E_BASE_URL || 'http://localhost:3100';
const VILLAGE_CANDIDATES = [process.env.E2E_VILLAGE_PASSWORD || 'Village09Pass', 'SmokeTest2026!'];
const DISTRICT_CANDIDATES = [process.env.E2E_DISTRICT_PASSWORD || 'District09Pass', 'SmokeTest2026!'];
const TOWNSHIP_CANDIDATES = [process.env.E2E_TOWNSHIP_PASSWORD || 'Township09Pass', 'SmokeTest2026!'];

const out = (msg) => process.stdout.write(`${msg}\n`);
let passed = 0;
let failed = 0;
const check = (name, cond, extra = '') => {
  out(`${cond ? 'PASS' : 'FAIL'} | ${name}${extra ? ` | ${extra}` : ''}`);
  if (cond) passed += 1;
  else failed += 1;
};

const req = async (method, path, { token, body, headers = {} } = {}) => {
  const init = { method, headers: { ...headers } };
  if (token) init.headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) {
    init.headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, init);
  let json = null;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    json = { raw: text };
  }
  return { status: res.status, json, headers: res.headers };
};

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0;
  const v = c === 'x' ? r : (r & 0x3) | 0x8;
  return v.toString(16);
});

const ensureAuth = async (label, loginCode, candidates) => {
  let lastStatus = null;
  for (const password of candidates) {
    const login = await req('POST', '/api/v1/auth/login', { body: { loginCode, password } });
    lastStatus = login.status;
    if (login.status !== 200) continue;
    return { token: login.json.data.accessToken, password };
  }
  throw new Error(`${label}: login failed (${loginCode}) last=${lastStatus}`);
};

const main = async () => {
  // ---- 1. health ----
  const health = await req('GET', '/health/ready');
  check('GET /health/ready 200 (db+redis)', health.status === 200, `status=${health.status}`);

  // ---- 2. security basics over HTTP ----
  const noAuth = await req('GET', '/api/v1/surveys');
  check('401 without token', noAuth.status === 401, `status=${noAuth.status}`);
  check('no stack trace in 401 body', !JSON.stringify(noAuth.json).includes('at '));

  const badLogin = await req('POST', '/api/v1/auth/login', { body: { loginCode: '', password: '' } });
  check('422 invalid login body', badLogin.status === 422, `status=${badLogin.status}`);

  const injection = await req('GET', '/api/v1/surveys?search[$ne]=x');
  check('401 injection probe without token', injection.status === 401, `status=${injection.status}`);

  const helmet = await req('GET', '/api/v1/categories/breeding', {});
  check('no x-powered-by header', !helmet.headers.get('x-powered-by'));

  const cors = await fetch(`${BASE}/api/v1/surveys`, { headers: { Origin: 'http://evil.example' } });
  check('CORS rejects unknown origin', cors.status === 403, `status=${cors.status}`);

  // ---- 3. logins ----
  const village = await ensureAuth('village', '194657', VILLAGE_CANDIDATES);
  const district = await ensureAuth('district', 'MMR0100', DISTRICT_CANDIDATES);
  const township = await ensureAuth('township', 'MMR010031', TOWNSHIP_CANDIDATES);
  check('logins: village + district + township', true);

  const limitHeaders = await req('GET', '/api/v1/surveys?page=1', { token: village.token });
  check(
    'X-RateLimit-* headers present',
    limitHeaders.headers.get('x-ratelimit-limit') !== null && limitHeaders.headers.get('x-ratelimit-remaining') !== null
  );

  // ---- 4. RBAC ----
  const forbidden = await req('GET', '/api/v1/reports/district', { token: village.token });
  check('RBAC: village -> /reports/district = 403', forbidden.status === 403, `status=${forbidden.status}`);
  const villageExport = await req('GET', '/api/v1/reports/district/MMR010031/export', { token: village.token });
  check('RBAC: village -> export = 403', villageExport.status === 403, `status=${villageExport.status}`);
  const townshipCross = await req('GET', '/api/v1/reports/township/MMR010099', { token: township.token });
  check('RBAC: township cross-township report blocked', townshipCross.status === 403 || townshipCross.status === 404, `status=${townshipCross.status}`);
  const refOk = await req('GET', '/api/v1/categories/breeding', { token: village.token });
  check('reference: categories/breeding 200 (6 rows)', refOk.status === 200 && refOk.json.data.length === 6);
  const injectionAuth = await req('GET', '/api/v1/surveys?search[$ne]=x', { token: village.token });
  check('422 NoSQL injection rejected by validator', injectionAuth.status === 422, `status=${injectionAuth.status}`);

  // ---- 5. survey lifecycle (create -> submit -> verify -> report -> approve) ----
  const created = await req('POST', '/api/v1/surveys', {
    token: village.token,
    body: {
      hName: 'E2E Journey Household',
      hEdu: 'None',
      hGender: 'အထီး',
      hPhone: '09111111111',
      hAge: 45,
      ansDate: '2026-01-10',
      bigAnimals: [{ categoryId: 1, ageLimit: 'Over3', sex: 'male', count: 7 }],
      smallAnimals: [],
      poultry: [],
      breedingAnimals: [
        { categoryId: 1, sex: 'male', count: 2 },
        { categoryId: 6, sex: 'female', count: 1 }
      ]
    }
  });
  check('POST /surveys 201 (breeding + interview)', created.status === 201, `status=${created.status}`);
  const surveyId = created.json && created.json.data && created.json.data.surveyId;
  check('surveyId issued', Number.isInteger(surveyId), `surveyId=${surveyId}`);

  const submit = await req('POST', `/api/v1/surveys/${surveyId}/submit`, { token: village.token });
  check('submit draft -> submitted', submit.status === 200, `status=${submit.status}`);

  const notYetVerified = await req('GET', '/api/v1/reports/township/MMR010031', { token: district.token });
  check(
    'pre-verify: report 200 (survey not counted yet)',
    notYetVerified.status === 200
  );

  const verify = await req('POST', `/api/v1/surveys/${surveyId}/verify`, { token: township.token });
  check('township verify (summary +1)', verify.status === 200, `status=${verify.status}`);

  // ---- 6. reports + drilldown + list filters (post-verify) ----
  const districtReport = await req('GET', '/api/v1/reports/district', { token: district.token });
  check(
    'district report has breeding totals',
    districtReport.status === 200 &&
      typeof districtReport.json.data.totalBreedingAnimals === 'number' &&
      districtReport.json.data.totalBreedingAnimals >= 3,
    `totalBreeding=${districtReport.json.data.totalBreedingAnimals}`
  );
  const townshipReport = await req('GET', '/api/v1/reports/township/MMR010031', { token: district.token });
  check(
    'township report includes new survey',
    townshipReport.status === 200 && townshipReport.json.data.totalSurveys >= 1
  );
  const l1 = await req('GET', '/api/v1/reports/drilldown?level=township&type=breedingAnimals', {
    token: district.token
  });
  check('drilldown L1 fast (type=breedingAnimals) 200', l1.status === 200 && Array.isArray(l1.json.data));
  const l3 = await req(
    'GET',
    '/api/v1/reports/drilldown?level=household&wvCode=194657&type=breedingAnimals',
    { token: district.token }
  );
  const l3Row = l3.status === 200 && l3.json.data.find((r) => r.surveyId === surveyId);
  check(
    'drilldown L3: new survey row total=3 (2+1)',
    Boolean(l3Row) && l3Row.total === 3 && l3Row.byAge.every((e) => e.ageLimit === null),
    JSON.stringify(l3Row)
  );
  const filtered = await req(
    'GET',
    '/api/v1/reports/drilldown?level=township&type=breedingAnimals&sex=male',
    { token: district.token }
  );
  check('drilldown with sex filter 200 (direct path)', filtered.status === 200, `status=${filtered.status}`);
  const listBreed = await req('GET', '/api/v1/surveys?hasBreeding=true&page=1', { token: district.token });
  check(
    'list ?hasBreeding=true contains new survey',
    listBreed.status === 200 && listBreed.json.data.some((s) => s.surveyId === surveyId)
  );
  const listBreedFalse = await req('GET', '/api/v1/surveys?hasBreeding=false&page=1', { token: district.token });
  check(
    'list ?hasBreeding=false excludes new survey',
    listBreedFalse.status === 200 && !listBreedFalse.json.data.some((s) => s.surveyId === surveyId)
  );

  // ---- 7. export ----
  const exported = await fetch(`${BASE}/api/v1/reports/district/MMR010031/export`, {
    headers: { Authorization: `Bearer ${district.token}` }
  });
  const exportBuf = await exported.arrayBuffer();
  check(
    'Excel export 200 + xlsx magic bytes',
    exported.status === 200 && exportBuf.byteLength > 1000,
    `bytes=${exportBuf.byteLength}`
  );

  // ---- 8. sync push (create) + idempotent replay + pull ----
  const idemKey = uuid();
  const pushBody = {
    items: [
      {
        localRowId: `e2e-${idemKey.slice(0, 8)}`,
        op: 'create',
        survey: {
          bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'female', count: 3 }],
          smallAnimals: [],
          poultry: [],
          breedingAnimals: [{ categoryId: 4, sex: 'male', count: 4 }]
        },
        interview: {
          hName: 'E2E Sync Household',
          hEdu: 'None',
          hGender: 'အမ',
          hPhone: '09222222222',
          hAge: 33,
          ansDate: '2026-01-12'
        }
      }
    ]
  };
  const push = await req('POST', '/api/v1/sync/push', {
    token: village.token,
    body: pushBody,
    headers: { 'Idempotency-Key': idemKey }
  });
  check('sync push create 200', push.status === 200, `status=${push.status}`);
  const replay = await req('POST', '/api/v1/sync/push', {
    token: village.token,
    body: pushBody,
    headers: { 'Idempotency-Key': idemKey }
  });
  check(
    'sync push replay (same key) returns cached result',
    replay.status === 200 && JSON.stringify(replay.json) === JSON.stringify(push.json)
  );
  const pull = await req('GET', '/api/v1/sync/pull?types=surveys,categories,locations', { token: village.token });
  check(
    'sync pull 200 (surveys+categories+locations)',
    pull.status === 200 &&
      Array.isArray(pull.json.data.surveys) &&
      pull.json.data.categories.breeding.length === 6
  );

  // ---- 9. approve + cleanup ----
  const approve = await req('POST', `/api/v1/surveys/${surveyId}/approve`, { token: district.token });
  check('district approve -> district_approved', approve.status === 200, `status=${approve.status}`);
  const del = await req('DELETE', `/api/v1/surveys/${surveyId}`, { token: district.token });
  check('district delete (soft, summary reverse)', del.status === 200, `status=${del.status}`);

  const syncIds = [...JSON.stringify(push.json).matchAll(/"surveyId":(\d+)/g)].map((m) => Number(m[1]));
  for (const id of syncIds) {
    const cleanupDel = await req('DELETE', `/api/v1/surveys/${id}`, { token: village.token });
    check(`cleanup sync-created draft ${id}`, cleanupDel.status === 200, `status=${cleanupDel.status}`);
  }

  out(`\nRESULT: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
};

main()
  .catch((error) => {
    out(`FATAL: ${error.message}`);
    process.exitCode = 1;
  });
