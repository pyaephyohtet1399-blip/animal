# Livestock Survey Backend

Node.js 20 + Express + MongoDB + Redis backend — architecture & decisions docs မှာ ရှိပါတယ် (`docs/`).

## Quick start (Docker — အကြံပြု)

```bash
cp .env.example .env      # Windows: copy .env.example .env
# .env ထဲ JWT_SECRET / JWT_REFRESH_SECRET ၂ ခု ဖန်တီး (≥32 chars):
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

docker compose up -d --build
docker compose exec api npm run seed        # locations + categories + users
curl http://localhost:3100/health/ready     # -> {"status":"ok", ...}
docker compose exec api cat data/generated-passwords.csv   # default passwords
```

- compose က local `mongo` + `redis` container တွေကို အသုံးပြုပါတယ် (`.env` ထဲက `MONGODB_URI`/`REDIS_URL` ကို compose က override လုပ်ပါတယ်)
- API logs: `docker compose logs -f api`
- ရပ်: `docker compose down` (data မဖျက်) / `docker compose down -v` (data ပါ ဖျက်)

## Local dev (Docker မပါ)

```bash
npm ci
npm run dev        # nodemon src/server.js — .env ထဲ MONGODB_URI/REDIS_URL ပြည့်စုံရမည်
```

## Tests & CI

```bash
npm run lint        # eslint src tests
npm test            # unit + integration + coverage gate (≥80%)
```

CI: `.github/workflows/ci.yml` (lint → test → docker build, every push/PR).
Load smoke (k6): `k6 run tests/load/smoke.js` — env: `K6_BASE_URL`, `K6_VILLAGE_CODE/PASSWORD`, `K6_DISTRICT_CODE/PASSWORD`

## Production deploy

1. **PM2 cluster (4 instances):** `npm ci --omit=dev && pm2 start ecosystem.config.js --env production`
2. **nginx:** `deploy/nginx/livestock.conf` → `/etc/nginx/conf.d/` + certbot TLS (`api.example.com` ပြင်ပါ)
3. **Atlas:** M10+, IP allowlist, least-privilege DB user, backup + PITR on
4. Zero-downtime: `pm2 reload ecosystem.config.js && sudo nginx -s reload`
5. Backup/restore runbook + recovery steps: `docs/implementation.md` §14.3

## Environment (`.env.example` ကို ကြည့်ပါ)

| Var | Note |
|-----|------|
| `MONGODB_URI`, `REDIS_URL` | compose တွင် override ခံရ |
| `JWT_SECRET`, `JWT_REFRESH_SECRET` | ≥32 chars, repo မထား |
| `ALLOWED_ORIGINS` | comma separated (CORS) |
| `RATE_LIMIT_WINDOW_MS`, `BODY_LIMIT` | defaults: 60000, 1mb |
