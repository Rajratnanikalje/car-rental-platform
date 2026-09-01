const express = require("express");
const { getSettings, updateSettings, confirmCashCollection, getMyDriverLedger, getLedgers, updateSettlementStatus } = require("../controllers/financeController");
const { protect, adminOnly, approvedDriverOnly } = require("../middleware/authMiddleware");

const router = express.Router();
router.get("/settings", protect, adminOnly, getSettings);
router.put("/settings", protect, adminOnly, updateSettings);
router.get("/ledgers", protect, adminOnly, getLedgers);
router.put("/ledgers/:id/settlement-status", protect, adminOnly, updateSettlementStatus);
router.put("/bookings/:bookingId/cash-collection", protect, approvedDriverOnly, confirmCashCollection);
router.get("/driver-ledger", protect, approvedDriverOnly, getMyDriverLedger);
module.exports = router;
