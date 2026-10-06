const STATUSES = ['draft', 'submitted'];

const COUNTED_STATUSES = ['submitted'];

const TRANSITIONS = {
  submitted: { from: ['draft'], roles: ['village'] }
};

module.exports = { STATUSES, COUNTED_STATUSES, TRANSITIONS };
