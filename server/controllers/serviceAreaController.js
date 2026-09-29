const ServiceArea = require("../models/ServiceArea");
const AuditLog = require("../models/AuditLog");

const listPublic = async (_req, res) => {
  const areas = await ServiceArea.find({ active: true }).sort({ name: 1 }).lean();
  return res.json({ success: true, count: areas.length, areas });
};

const listAdmin = async (_req, res) => {
  const areas = await ServiceArea.find().sort({ name: 1 }).lean();
  return res.json({ success: true, count: areas.length, areas });
};

const create = async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(422).json({ success: false, message: "Area name is required" });
  try {
    const area = await ServiceArea.create({ name, active: req.body.active !== false, supportsLocal: req.body.supportsLocal !== false, supportsOutstation: req.body.supportsOutstation !== false });
    await AuditLog.create({ actor: req.user.id, action: "SERVICE_AREA_CREATED", entityType: "ServiceArea", entityId: area._id });
    return res.status(201).json({ success: true, area });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 422).json({ success: false, message: error.code === 11000 ? "Area already exists" : "Invalid service area" });
  }
};

const update = async (req, res) => {
  const fields = {};
  if (req.body.name !== undefined) fields.name = String(req.body.name).trim();
  for (const key of ["active", "supportsLocal", "supportsOutstation"]) if (req.body[key] !== undefined) fields[key] = Boolean(req.body[key]);
  if (fields.name === "") return res.status(422).json({ success: false, message: "Area name cannot be empty" });
  try {
    const area = await ServiceArea.findByIdAndUpdate(req.params.id, { $set: fields }, { new: true, runValidators: true });
    if (!area) return res.status(404).json({ success: false, message: "Service area not found" });
    await AuditLog.create({ actor: req.user.id, action: "SERVICE_AREA_UPDATED", entityType: "ServiceArea", entityId: area._id, newValue: fields });
    return res.json({ success: true, area });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : 422).json({ success: false, message: "Unable to update service area" });
  }
};

module.exports = { listPublic, listAdmin, create, update };
