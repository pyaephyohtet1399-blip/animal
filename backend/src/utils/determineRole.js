const determineRole = (loginCode) => {
  if (loginCode === 'MMR0100') return 'district';
  if (/^MMR01\d{4}$/.test(loginCode)) return 'township';
  return 'village';
};

module.exports = { determineRole };
