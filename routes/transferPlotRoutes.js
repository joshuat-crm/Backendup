const express = require("express");
const router = express.Router();
const transferPlotController = require("../controllers/transferPlotController");
const {
  verifyJWT,
  isAdmin,
  isManager,
  checkUserStatus,
} = require("../middlewares/authMiddleware");

// Route to transfer a plot - restricted to Admin and Manager roles
router.post(
  "/",
  verifyJWT,
  checkUserStatus,
  // Only admins can transfer plots
  transferPlotController.transferPlot
);

// Route to get transfer plots - accessible to Admins and Managers
router.get(
  "/",
  verifyJWT,
  checkUserStatus,
  // Admins and Managers can view transfer records

  transferPlotController.getTransferPlots
);

module.exports = router;
