const ApiError = require('../utils/apiError');
const reportService = require('../services/reportService');
const exportService = require('../services/exportService');

const districtReport = async (req, res, next) => {
  try {
    const data = await reportService.getDistrictReport(req.user.districtCode);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const townshipReport = async (req, res, next) => {
  try {
    const { tspCode } = req.params;
    if (req.user.role === 'township' && req.user.tspCode !== tspCode) {
      throw new ApiError(403, 'Cannot view report for another township', 'forbidden');
    }
    const data = await reportService.getTownshipReport(tspCode, req.query);
    return res.json({ data });
  } catch (error) {
    return next(error);
  }
};

const drilldown = async (req, res, next) => {
  try {
    const query = req.query;
    if (query.level === 'township') {
      const data = await reportService.drillToTownship(req.user, query);
      return res.json({ data });
    }
    if (query.level === 'village') {
      const data = await reportService.drillToVillage(req.user, query.tspCode, query);
      return res.json({ data });
    }
    const result = await reportService.drillToHousehold(
      req.user,
      query.wvCode,
      query,
      query.page,
      query.per_page
    );
    return res.json(result);
  } catch (error) {
    return next(error);
  }
};

const exportExcel = async (req, res, next) => {
  try {
    const { workbook, filename } = await exportService.exportTownship(
      req.params.tspCode,
      req.query
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return next(error);
  }
};

module.exports = { districtReport, townshipReport, drilldown, exportExcel };
