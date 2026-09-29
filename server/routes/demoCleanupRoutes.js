const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { buildDemoCleanupPlan, deleteDemoRecords } = require("../services/demoCleanup");

const router = express.Router();
const CONFIRMATION = "DELETE DEMO DATA";

router.get("/preview", protect, adminOnly, async (req, res) => {
  try {
    const plan = await buildDemoCleanupPlan();
    return res.json({ success: true, confirmationPhrase: CONFIRMATION, plan: { generatedAt: plan.generatedAt, counts: plan.counts, groups: plan.groups, conflicts: plan.conflicts } });
  } catch (error) {
    console.error("Demo cleanup preview failed:", error);
    return res.status(500).json({ success: false, message: "Unable to preview demo data cleanup" });
  }
});

router.post("/delete", protect, adminOnly, async (req, res) => {
  if (req.body?.confirmation !== CONFIRMATION) return res.status(400).json({ success: false, message: `Type ${CONFIRMATION} to confirm` });
  try {
    const plan = await deleteDemoRecords(req.user.id);
    return res.json({ success: true, message: "Explicitly identified demo records were deleted", plan: { generatedAt: plan.generatedAt, counts: plan.counts, groups: plan.groups, conflicts: plan.conflicts } });
  } catch (error) {
    console.error("Demo cleanup failed:", error);
    return res.status(500).json({ success: false, message: "Cleanup did not complete; transaction rolled back when supported" });
  }
});

module.exports = router;
