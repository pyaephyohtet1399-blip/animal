const Township = require('../models/Township');
const Townvg = require('../models/Townvg');
const Wardvillage = require('../models/Wardvillage');

const CACHE_TTL_SECONDS = 3600;

const cacheOrFetch = async (redis, key, loader) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  const data = await loader();
  await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
  return data;
};

const townshipScope = (user) => {
  if (!user) return { query: {}, key: 'all' };
  if (user.role === 'district') return { query: { districtCode: user.districtCode }, key: `district:${user.districtCode}` };
  return { query: { tspCode: user.tspCode }, key: `tsp:${user.tspCode}` };
};

const getTownships = (redis, user) => {
  const scope = townshipScope(user);
  return cacheOrFetch(redis, `locations:townships:${scope.key}`, () =>
    Township.find(scope.query)
      .sort({ tspCode: 1 })
      .select('tspCode tspName districtCode -_id')
      .lean()
  );
};

const getTownvgs = (redis, user, tspCode) => {
  let query;
  let key;
  if (!user || user.role === 'district') {
    query = tspCode ? { tspCode } : {};
    key = tspCode ? `district:${user ? user.districtCode : 'all'}:tsp:${tspCode}` : `district:${user ? user.districtCode : 'all'}:all`;
  } else if (user.role === 'township') {
    query = { tspCode: user.tspCode };
    key = `tsp:${user.tspCode}`;
  } else {
    query = { tvgCode: user.tvgCode };
    key = `tvg:${user.tvgCode}`;
  }
  return cacheOrFetch(redis, `locations:townvgs:${key}`, () =>
    Townvg.find(query)
      .sort({ tvgCode: 1 })
      .select('tvgCode tvgName tspCode -_id')
      .lean()
  );
};

const getWardvillages = async (redis, user, tvgCode) => {
  let query;
  let key;
  if (!user || user.role === 'district') {
    query = tvgCode ? { tvgCode } : {};
    key = tvgCode ? `district:${user ? user.districtCode : 'all'}:tvg:${tvgCode}` : `district:${user ? user.districtCode : 'all'}:all`;
  } else if (user.role === 'township') {
    const tvgCodes = await Townvg.distinct('tvgCode', { tspCode: user.tspCode });
    query = { tvgCode: { $in: tvgCodes } };
    key = `tsp:${user.tspCode}`;
  } else {
    query = { wvCode: user.wvCode };
    key = `wv:${user.wvCode}`;
  }
  return cacheOrFetch(redis, `locations:wardvillages:${key}`, () =>
    Wardvillage.find(query)
      .sort({ wvCode: 1 })
      .select('wvCode wvName tvgCode -_id')
      .lean()
  );
};

module.exports = { getTownships, getTownvgs, getWardvillages, CACHE_TTL_SECONDS };
