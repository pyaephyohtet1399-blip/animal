const Survey = require('../src/models/Survey');
const summaryService = require('../src/services/summaryService');
const { connectDb } = require('./lib/seedHelpers');

const MIGRATIONS = [
  { from: 'township_verified', to: 'submitted' },
  { from: 'district_approved', to: 'submitted' },
  { from: 'rejected', to: 'draft' }
];

const REMOVED_FIELDS = [
  'verifiedBy',
  'verifiedAt',
  'approvedBy',
  'approvedAt',
  'rejectedReason',
  'rejectedBy',
  'rejectedAt'
];

const out = (msg) => process.stdout.write(`${msg}\n`);

const run = async () => {
  await connectDb();
  out('connected');

  for (const { from, to } of MIGRATIONS) {
    const result = await Survey.updateMany(
      { status: from, deletedAt: null },
      { $set: { status: to } }
    );
    out(`${from} → ${to}: ${result.modifiedCount} survey(s)`);
  }

  const unset = Object.fromEntries(REMOVED_FIELDS.map((f) => [f, '']));
  const cleaned = await Survey.updateMany(
    { deletedAt: null },
    { $unset: unset }
  );
  out(`removed legacy fields from ${cleaned.modifiedCount} survey(s)`);

  const rebuilt = await summaryService.recomputeAll();
  out(`rebuilt ${rebuilt} summary document(s)`);

  process.exit(0);
};

run().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
