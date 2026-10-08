const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const Survey = require('../models/Survey');
const InterviewInfo = require('../models/InterviewInfo');
const UploadReceipt = require('../models/UploadReceipt');
const idService = require('./idService');
const summaryService = require('./summaryService');
const surveyService = require('./surveyService');
const { buildSurveyScope } = require('../middleware/scope');
const { isCounted } = surveyService;

const ARCHIVE_DIR = process.env.UPLOAD_ARCHIVE_DIR || path.join(process.cwd(), 'uploads');
const LOCK_TTL_SECONDS = 120;
const ANIMAL_FIELDS = ['bigAnimals', 'smallAnimals', 'poultry', 'breedingAnimals'];

const lockKey = (wvCode, contentHash) => `upload:lock:${wvCode}:${contentHash}`;

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

const animalTotal = (survey) =>
  ANIMAL_FIELDS.reduce(
    (total, field) =>
      total + (survey?.[field] || []).reduce((sum, item) => sum + (item.count || 0), 0),
    0
  );

const computeCounts = (households) => ({
  households: households.length,
  animals: households.reduce(
    (total, row) => (row.action === 'delete' ? total : total + animalTotal(row.survey)),
    0
  )
});

const interviewFields = (payload) => {
  const fields = {
    hName: payload.hName,
    hEdu: payload.hEdu,
    hGender: payload.hGender,
    hPhone: payload.hPhone,
    hAge: payload.hAge,
    ansDate: payload.ansDate
  };
  if (payload.hNo !== undefined) fields.hNo = payload.hNo;
  return fields;
};

const animalFields = (payload) => ({
  bigAnimals: payload.bigAnimals,
  smallAnimals: payload.smallAnimals,
  poultry: payload.poultry,
  breedingAnimals: payload.breedingAnimals
});

const archiveFile = async (contentHash, rawBody, compressed) => {
  const extension = compressed ? 'json.gz' : 'json';
  const target = path.join(ARCHIVE_DIR, `${contentHash}.${extension}`);
  await fs.mkdir(ARCHIVE_DIR, { recursive: true });
  await fs.writeFile(target, rawBody, { mode: 0o600 });
  return target;
};

const buildPlan = async (user, envelope) => {
  const details = [];
  const conflicts = [];
  let countMismatch = false;
  const households = envelope.households;

  const seenRowIds = new Set();
  const seenSurveyIds = new Map();
  for (const row of households) {
    const rowKey = String(row.localRowId);
    if (seenRowIds.has(rowKey)) {
      details.push({
        localRowId: row.localRowId,
        field: 'localRowId',
        message: 'Duplicate localRowId in upload'
      });
    }
    seenRowIds.add(rowKey);
    if (row.action !== 'create') {
      if (seenSurveyIds.has(row.surveyId)) {
        details.push({
          localRowId: row.localRowId,
          field: 'surveyId',
          message: 'Duplicate surveyId in upload'
        });
      }
      seenSurveyIds.set(row.surveyId, row.localRowId);
    }
  }

  const computed = computeCounts(households);
  if (envelope.counts.households !== computed.households) {
    countMismatch = true;
    details.push({
      field: 'counts.households',
      message: `Declared ${envelope.counts.households} households but file contains ${computed.households}`
    });
  }
  if (envelope.counts.animals !== computed.animals) {
    countMismatch = true;
    details.push({
      field: 'counts.animals',
      message: `Declared ${envelope.counts.animals} animals but rows sum to ${computed.animals}`
    });
  }

  const targetIds = [...seenSurveyIds.keys()];
  const targets = targetIds.length
    ? await Survey.find({ surveyId: { $in: targetIds }, deletedAt: null, ...buildSurveyScope(user) }).lean()
    : [];
  const bySurveyId = new Map(targets.map((doc) => [doc.surveyId, doc]));

  const interviewIds = targets.map((doc) => doc.interviewId);
  const interviews = interviewIds.length
    ? await InterviewInfo.find({ _id: { $in: interviewIds } }).select('_id').lean()
    : [];
  const interviewSet = new Set(interviews.map((doc) => String(doc._id)));

  for (const row of households) {
    if (row.action === 'create') continue;
    const target = bySurveyId.get(row.surveyId);
    if (!target) {
      details.push({
        localRowId: row.localRowId,
        field: 'surveyId',
        message: 'Survey not found in scope'
      });
      continue;
    }
    if (target.villageHeadmanId?.toString() !== user.userId) {
      details.push({
        localRowId: row.localRowId,
        field: 'surveyId',
        message: 'Survey is owned by another household record owner'
      });
      continue;
    }
    if (!interviewSet.has(String(target.interviewId))) {
      details.push({
        localRowId: row.localRowId,
        field: 'surveyId',
        message: 'Interview record missing for this survey'
      });
      continue;
    }
    if (target.syncVersion !== row.syncVersion) {
      conflicts.push({
        localRowId: row.localRowId,
        surveyId: row.surveyId,
        declaredVersion: row.syncVersion,
        serverVersion: target.syncVersion
      });
    }
  }

  if (conflicts.length > 0) {
    throw new ApiError(
      409,
      'Server holds newer versions for some households - refresh and re-upload',
      'version_conflict',
      conflicts.map((conflict) => ({ ...conflict, message: 'Server holds a newer version' }))
    );
  }
  if (details.length > 0) {
    throw new ApiError(
      422,
      countMismatch && details.every((item) => item.field.startsWith('counts.'))
        ? 'Declared counts do not match uploaded rows'
        : 'Upload validation failed',
      countMismatch ? 'count_mismatch' : 'validation_error',
      details
    );
  }

  return { bySurveyId, computed };
};

const applyPlan = async (user, envelope, plan, meta) => {
  const redis = meta.redis;
  const session = await mongoose.startSession();
  const counters = { created: 0, updated: 0, deleted: 0 };
  const allocated = new Map();
  const rows = [];

  for (const row of envelope.households) {
    if (row.action === 'create') {
      allocated.set(row.localRowId, {
        interviewId: await idService.generateInterviewId(redis),
        surveyId: await idService.generateSurveyId(redis)
      });
      counters.created += 1;
      rows.push({
        localRowId: row.localRowId,
        action: 'create',
        surveyId: allocated.get(row.localRowId).surveyId,
        syncVersion: 1
      });
      continue;
    }
    const target = plan.bySurveyId.get(row.surveyId);
    const nextVersion = target.syncVersion + 1;
    counters[row.action === 'delete' ? 'deleted' : 'updated'] += 1;
    rows.push({
      localRowId: row.localRowId,
      action: row.action,
      surveyId: row.surveyId,
      syncVersion: nextVersion
    });
  }

  const response = {
    data: {
      contentHash: meta.contentHash,
      accepted: envelope.households.length,
      created: counters.created,
      updated: counters.updated,
      deleted: counters.deleted,
      counts: plan.computed,
      serverTime: new Date().toISOString(),
      rows
    },
    meta: { replayed: false }
  };

  try {
    await session.withTransaction(async () => {
      for (const row of envelope.households) {
        if (row.action === 'create') {
          const ids = allocated.get(row.localRowId);
          const [interview] = await InterviewInfo.create(
            [{ interviewId: ids.interviewId, ...interviewFields(row.interview), tspCode: user.tspCode, tvgCode: user.tvgCode, wvCode: user.wvCode }],
            { session }
          );
          const surveyId = ids.surveyId;
          const [survey] = await Survey.create(
            [
              {
                surveyId,
                interviewId: interview._id,
                villageHeadmanId: user.userId,
                status: 'submitted',
                syncVersion: 1,
                districtCode: user.districtCode,
                tspCode: user.tspCode,
                tvgCode: user.tvgCode,
                wvCode: user.wvCode,
                ...animalFields(row.survey),
                hasBreeding: row.survey.breedingAnimals.length > 0
              }
            ],
            { session }
          );
          await summaryService.updateSummary(survey.toObject(), 1, session);
          continue;
        }

        const target = plan.bySurveyId.get(row.surveyId);
        if (row.action === 'delete') {
          const previous = await Survey.findOneAndUpdate(
            { _id: target._id, syncVersion: row.syncVersion, deletedAt: null },
            { $set: { deletedAt: new Date() }, $inc: { syncVersion: 1 } },
            { session, new: false }
          );
          if (!previous) {
            throw new ApiError(
              409,
              'Survey changed during upload',
              'version_conflict',
              [{ localRowId: row.localRowId, surveyId: row.surveyId, serverVersion: target.syncVersion, message: 'Survey changed during upload' }]
            );
          }
          if (isCounted(previous.status)) {
            await summaryService.updateSummary(previous, -1, session);
          }
          continue;
        }

        const previous = await Survey.findOneAndUpdate(
          { _id: target._id, syncVersion: row.syncVersion, deletedAt: null },
          {
            $set: { status: 'submitted', ...animalFields(row.survey), hasBreeding: row.survey.breedingAnimals.length > 0 },
            $inc: { syncVersion: 1 }
          },
          { session, new: false }
        );
        if (!previous) {
          throw new ApiError(
            409,
            'Survey changed during upload',
            'version_conflict',
            [{ localRowId: row.localRowId, surveyId: row.surveyId, serverVersion: target.syncVersion, message: 'Survey changed during upload' }]
          );
        }
        const interviewUpdate = await InterviewInfo.updateOne(
          { _id: previous.interviewId },
          { $set: interviewFields(row.interview) },
          { session }
        );
        if (interviewUpdate.matchedCount === 0) {
          throw new ApiError(422, 'Interview record missing for this survey', 'validation_error', [
            { localRowId: row.localRowId, field: 'surveyId', message: 'Interview record missing' }
          ]);
        }
        const nextSummaryView = {
          tspCode: previous.tspCode,
          wvCode: previous.wvCode,
          ...animalFields(row.survey)
        };
        if (isCounted(previous.status)) {
          await summaryService.updateSummary(previous, -1, session);
        }
        await summaryService.updateSummary(nextSummaryView, 1, session);
      }

      await UploadReceipt.create(
        [
          {
            contentHash: meta.contentHash,
            wvCode: user.wvCode,
            userId: user.userId,
            version: envelope.version,
            fileSize: meta.rawSize,
            compressed: meta.compressed,
            archivePath: meta.archivePath,
            generatedAt: envelope.generatedAt,
            declaredCounts: envelope.counts,
            storedCounts: plan.computed,
            accepted: envelope.households.length,
            created: counters.created,
            updated: counters.updated,
            deleted: counters.deleted,
            response,
            serverTime: response.data.serverTime
          }
        ],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  return response;
};

const upload = async (user, envelope, context) => {
  const { rawBody, contentHash, redis, compressed } = context;

  if (user.role !== 'village' || !user.wvCode) {
    throw new ApiError(403, 'Only village users can upload village data', 'forbidden');
  }
  if (envelope.wvCode !== user.wvCode) {
    throw new ApiError(403, 'wvCode does not match the signed-in village', 'forbidden');
  }

  const actualHash = sha256(rawBody);
  if (contentHash && contentHash !== actualHash) {
    throw new ApiError(400, 'Content hash does not match the uploaded body', 'content_hash_mismatch');
  }
  const hash = contentHash || actualHash;

  const acquired = await redis.set(lockKey(user.wvCode, hash), '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (acquired !== 'OK') {
    throw new ApiError(409, 'An upload with this content hash is already in progress', 'request_in_progress');
  }

  try {
    const receipt = await UploadReceipt.findOne({ wvCode: user.wvCode, contentHash: hash }).lean();
    if (receipt) {
      return {
        ...receipt.response,
        meta: { ...(receipt.response.meta || {}), replayed: true }
      };
    }

    const startedAt = Date.now();
    let archivePath;
    try {
      archivePath = await archiveFile(hash, rawBody, compressed);
    } catch (error) {
      logger.warn('upload archive write failed', { contentHash: hash, message: error.message });
    }

    const plan = await buildPlan(user, envelope);
    const meta = {
      redis,
      contentHash: hash,
      rawSize: rawBody.length,
      compressed: Boolean(compressed),
      archivePath
    };
    const response = await applyPlan(user, envelope, plan, meta);

    await surveyService.invalidateCountCache(redis);
    logger.info('village upload accepted', {
      wvCode: user.wvCode,
      contentHash: hash,
      accepted: response.data.accepted,
      created: response.data.created,
      updated: response.data.updated,
      deleted: response.data.deleted,
      bytes: rawBody.length,
      durationMs: Date.now() - startedAt
    });
    return response;
  } finally {
    await redis.del(lockKey(user.wvCode, hash));
  }
};

const status = async (user, contentHash) => {
  if (!user.wvCode) throw new ApiError(403, 'Only village users can read upload status', 'forbidden');
  const receipt = await UploadReceipt.findOne({ wvCode: user.wvCode, contentHash }).lean();
  if (!receipt) throw new ApiError(404, 'Upload receipt not found', 'not_found');
  return {
    contentHash: receipt.contentHash,
    status: 'accepted',
    accepted: receipt.accepted,
    counts: receipt.storedCounts,
    serverTime: receipt.serverTime || receipt.createdAt.toISOString()
  };
};

module.exports = { upload, status, computeCounts, sha256, archiveFile };
