const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const controller = require("../controllers/serviceAreaController");

const router = express.Router();
router.get("/", controller.listPublic);
router.get("/admin", protect, adminOnly, controller.listAdmin);
router.post("/", protect, adminOnly, controller.create);
router.patch("/:id", protect, adminOnly, controller.update);
module.exports = router;
