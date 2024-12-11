const express = require("express");
const router = express.Router();
const SalaryController = require("../controllers/salaryController");

router.post("/pay-salary/:id", SalaryController.paySalary);
router.get("/generate-slip/:id", SalaryController.generateSalarySlip);
router.get("/payment-history/:id", SalaryController.getPaymentHistory);
router.put("/update-salary/:id", SalaryController.updateSalaryDetails);

module.exports = router;
