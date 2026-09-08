const express = require("express");
const router = express.Router();
const cmsController = require("../controllers/cmsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public endpoints to fetch content
router.get("/audit/logs", protect, adminOnly, cmsController.getAuditLogs);
router.get("/", cmsController.getAllCmsContent);
router.get("/:section", cmsController.getCmsSection);

// Admin-only endpoint to update section content
router.put("/:section", protect, adminOnly, cmsController.updateCmsSection);

module.exports = router;

