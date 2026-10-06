const { pushSchema, pullSchema, MAX_BATCH } = require('../../../src/validators/sync.validator');

const UUID = '550e8400-e29b-41d4-a716-446655440000';
const OBJECT_ID = '64f1a2b3c4d5e6f7a8b9c0d1';

const interview = {
  hName: 'ဦးအောင်',
  hEdu: 'ဘွဲ့',
  hGender: 'အထီး',
  hPhone: '09123456789',
  hAge: 45,
  ansDate: '2026-01-15'
};
const animals = {
  bigAnimals: [{ categoryId: 1, ageLimit: 'LessThanOne', sex: 'male', count: 2 }],
  smallAnimals: [],
  poultry: []
};

const parsePush = (body, key = UUID) => pushSchema.parse({ headers: { 'idempotency-key': key }, body });

describe('pushSchema (D-18/D-36)', () => {
  test('accepts valid create item', () => {
    const parsed = parsePush({ items: [{ localRowId: 1, op: 'create', survey: animals, interview }] });
    expect(parsed.headers['idempotency-key']).toBe(UUID);
    expect(parsed.body.items).toHaveLength(1);
  });

  test('requires Idempotency-Key header', () => {
    expect(() => pushSchema.parse({ headers: {}, body: { items: [] } })).toThrow(
      expect.objectContaining({ issues: expect.arrayContaining([expect.objectContaining({ path: expect.arrayContaining(['headers', 'idempotency-key']) })]) })
    );
  });

  test('rejects non-UUID Idempotency-Key', () => {
    expect(() => parsePush({ items: [] }, 'not-a-uuid')).toThrow();
  });

  test('rejects empty and oversized batches', () => {
    expect(() => parsePush({ items: [] })).toThrow();
    const many = Array.from({ length: MAX_BATCH + 1 }, (_, i) => ({
      localRowId: i + 1,
      op: 'create',
      survey: animals,
      interview
    }));
    expect(() => parsePush({ items: many })).toThrow();
  });

  test('accepts exactly MAX_BATCH items', () => {
    const many = Array.from({ length: MAX_BATCH }, (_, i) => ({
      localRowId: i + 1,
      op: 'create',
      survey: animals,
      interview
    }));
    expect(parsePush({ items: many }).body.items).toHaveLength(MAX_BATCH);
  });

  test('strips location codes from survey payload (client cannot spoof scope)', () => {
    const parsed = parsePush({
      items: [
        {
          localRowId: 1,
          op: 'create',
          survey: { ...animals, tspCode: 'FAKE', wvCode: '999999' },
          interview
        }
      ]
    });
    expect(parsed.body.items[0].survey.tspCode).toBeUndefined();
    expect(parsed.body.items[0].survey.wvCode).toBeUndefined();
  });

  test('create requires interview payload', () => {
    expect(() => parsePush({ items: [{ localRowId: 1, op: 'create', survey: animals }] })).toThrow();
  });

  test('update requires syncVersion and at least one payload', () => {
    expect(() =>
      parsePush({ items: [{ localRowId: 1, op: 'update', surveyId: 1, survey: animals }] })
    ).toThrow();
    expect(() =>
      parsePush({ items: [{ localRowId: 1, op: 'update', surveyId: 1, syncVersion: 2 }] })
    ).toThrow();
    expect(() =>
      parsePush({
        items: [{ localRowId: 1, op: 'update', surveyId: 1, syncVersion: 2, survey: animals }]
      })
    ).not.toThrow();
  });

  test('delete requires surveyId only', () => {
    expect(() => parsePush({ items: [{ localRowId: 1, op: 'delete' }] })).toThrow();
    expect(() =>
      parsePush({ items: [{ localRowId: 1, op: 'delete', surveyId: 7 }] })
    ).not.toThrow();
  });

  test('accepts submit item', () => {
    const parsed = parsePush({ items: [{ localRowId: 1, op: 'submit', surveyId: 1 }] });
    expect(parsed.body.items[0].op).toBe('submit');
  });

  test('unknown op is rejected', () => {
    expect(() =>
      parsePush({ items: [{ localRowId: 1, op: 'unknown', surveyId: 1 }] })
    ).toThrow();
  });

  test('animal enums are enforced', () => {
    expect(() =>
      parsePush({
        items: [
          {
            localRowId: 1,
            op: 'create',
            interview,
            survey: {
              bigAnimals: [{ categoryId: 1, ageLimit: 'Young', sex: 'male', count: 1 }],
              smallAnimals: [],
              poultry: []
            }
          }
        ]
      })
    ).toThrow();
  });

  test('accepts string localRowId', () => {
    const parsed = parsePush({
      items: [{ localRowId: 'row-42', op: 'delete', surveyId: 1 }]
    });
    expect(parsed.body.items[0].localRowId).toBe('row-42');
  });
});

describe('pullSchema (D-20)', () => {
  const parseQuery = (query) => pullSchema.parse({ query });

  test('defaults to empty query', () => {
    expect(parseQuery({})).toEqual({ query: {} });
  });

  test('coerces since to Date', () => {
    const parsed = parseQuery({ since: '2026-01-15T00:00:00.000Z' });
    expect(parsed.query.since).toBeInstanceOf(Date);
  });

  test('treats empty since as absent', () => {
    expect(parseQuery({ since: '' }).query.since).toBeUndefined();
  });

  test('rejects invalid since', () => {
    expect(() => parseQuery({ since: 'not-a-date' })).toThrow();
  });

  test('splits and validates types', () => {
    expect(parseQuery({ types: 'surveys,locations' }).query.types).toEqual(['surveys', 'locations']);
    expect(parseQuery({ types: 'surveys,surveys' }).query.types).toEqual(['surveys']);
    expect(() => parseQuery({ types: 'surveys,widgets' })).toThrow();
    expect(parseQuery({ types: '' }).query.types).toBeUndefined();
  });

  test('validates cursor as ObjectId', () => {
    expect(parseQuery({ cursor: OBJECT_ID }).query.cursor).toBe(OBJECT_ID);
    expect(() => parseQuery({ cursor: 'not-an-id' })).toThrow();
  });
});
