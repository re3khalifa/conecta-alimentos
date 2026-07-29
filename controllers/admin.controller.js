const AuditLog = require('../models/AuditLog');

// GET /api/admin/audit-log
exports.getAuditLog = async (req, res, next) => {
  try {
    const logs = await AuditLog.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    res.json(logs);
  } catch (err) {
    next(err);
  }
};
