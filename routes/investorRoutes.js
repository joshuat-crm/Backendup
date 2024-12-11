const express = require("express");
const { isAdmin, isOwnerOrAdmin } = require("../middlewares/authMiddleware"); // Adjust the path as necessary
const investorController = require("../controllers/investorController"); // Adjust path as necessary

const router = express.Router();

// Route to get all investors
router.get("/", investorController.getAllInvestors);

// Route to get an investor by ID
router.get("/:id", investorController.getInvestorById);

// Route to update investor information
router.put("/:id", isOwnerOrAdmin, investorController.updateInvestor);

// Route to change investor status (active, inactive)
router.patch("/:id/status", investorController.changeInvestorStatus);

// Route to delete an investor
router.delete("/:id", investorController.deleteInvestor);

// Route to get investors by society
router.get(
  "/society/:societyId",

  investorController.getInvestorsBySociety
);
// Calculate profits for active investors
router.post("/calculate-profits", investorController.calculateProfits);

// Download profit slip for an investor
router.get("/download-slip/:slipPath", investorController.downloadSlip);

router.post("/get-profit", investorController.getInvestorProfit);

module.exports = router;
