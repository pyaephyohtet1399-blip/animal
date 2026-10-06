const buildSurveyScope = (user) => {
  if (!user || user.role === 'district') return {};
  if (user.role === 'township') return { tspCode: user.tspCode };
  return { wvCode: user.wvCode };
};

const inScope = (user, doc) => {
  if (!user || user.role === 'district') return true;
  if (user.role === 'township') return doc.tspCode === user.tspCode;
  return doc.wvCode === user.wvCode;
};

module.exports = { buildSurveyScope, inScope };
