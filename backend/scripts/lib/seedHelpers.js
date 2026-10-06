const fs = require('fs');
const mongoose = require('mongoose');
const Redis = require('ioredis');
const { loadEnv } = require('../../src/config/env');
const { connectDB } = require('../../src/config/database');

const connectDb = async () => {
  loadEnv();
  if (mongoose.connection.readyState !== 1) {
    await connectDB(process.env.MONGODB_URI);
  }
};

const readCsv = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8').replace(/^﻿/, '');
  const lines = raw.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) throw new Error(`Empty CSV: ${filePath}`);
  const header = lines[0].split(',').map((cell) => cell.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(',');
    return Object.fromEntries(header.map((name, index) => [name, (cells[index] || '').trim()]));
  });
};

const readPasswordMap = (filePath) => {
  const map = new Map();
  if (!fs.existsSync(filePath)) return map;
  const rows = readCsv(filePath);
  rows.forEach((row) => {
    if (row.loginCode && row.password) map.set(row.loginCode, row.password);
  });
  return map;
};

const csvField = (value) => {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const writePasswordMap = (filePath, map, meta) => {
  const lines = ['loginCode,password,village,township,district'];
  [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([loginCode, password]) => {
      const m = (meta && meta.get(loginCode)) || { village: '', township: '', district: '' };
      lines.push(
        [loginCode, password, m.village, m.township, m.district].map(csvField).join(',')
      );
    });
  fs.writeFileSync(filePath, `﻿${lines.join('\n')}\n`, 'utf8');
};

const buildLocationMeta = (locationsFile, userRows, districtName) => {
  const meta = new Map();
  const tspNameByCode = new Map();
  const wvNameByCode = new Map();
  if (fs.existsSync(locationsFile)) {
    readCsv(locationsFile).forEach((row) => {
      if (row.tspCode && row.tspName) tspNameByCode.set(row.tspCode, row.tspName);
      if (row.wvCode && row.wvName) wvNameByCode.set(row.wvCode, row.wvName);
    });
  }
  userRows.forEach((row) => {
    meta.set(row.loginCode, {
      village: row.wvCode ? (wvNameByCode.get(row.wvCode) || '') : '',
      township: row.tspCode ? (tspNameByCode.get(row.tspCode) || '') : '',
      district: districtName || ''
    });
  });
  return meta;
};

const clearCache = async (pattern, injectedRedis) => {
  let redis = injectedRedis;
  let owned = false;
  try {
    if (!redis) {
      redis = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null
      });
      await redis.connect();
      owned = true;
    }
    const keys = await redis.keys(pattern);
    if (keys.length > 0) await redis.del(...keys);
    process.stdout.write(`cache cleared: ${keys.length} key(s) matching ${pattern}\n`);
  } catch (error) {
    process.stderr.write(`cache clear skipped: ${error.message}\n`);
  } finally {
    if (owned && redis) redis.disconnect();
  }
};

const runCli = async (main, name) => {
  try {
    await main();
    await mongoose.disconnect();
  } catch (error) {
    process.stderr.write(`${name} failed: ${error.message}\n`);
    process.exitCode = 1;
  }
};

module.exports = {
  connectDb,
  readCsv,
  readPasswordMap,
  writePasswordMap,
  buildLocationMeta,
  clearCache,
  runCli
};
