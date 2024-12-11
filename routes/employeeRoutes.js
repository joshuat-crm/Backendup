const express = require("express");
const employeeController = require("../controllers/employeeController"); // Adjust the path as necessary
const {
  verifyJWT,

  isManager,
  checkUserStatus,
} = require("../middlewares/authMiddleware"); // Adjust the path as necessary

const router = express.Router();

// Middleware for all employee routes
router.use(verifyJWT); // Verify JWT for all routes
router.use(checkUserStatus); // Check user status for all routes

// Get all employees (Admin only)
router.get("/", employeeController.getAllEmployees);

// Get an employee by ID (Admin only)
router.get("/:id", employeeController.getEmployeeById);

// Update employee information (Admin only)
router.put("/:id", employeeController.updateEmployee);

// Change employee status (Admin only)
router.patch("/:id/status", employeeController.changeEmployeeStatus);

// Delete an employee (Admin only)
router.delete("/:id", employeeController.deleteEmployee);

// Get employees by society (any authorized user)
router.get(
  "/society/:societyId",
  checkUserStatus,
  employeeController.getEmployeesBySociety
);

// Route to generate a salary slip
router.post("/:id/generate-salary-slip", employeeController.generateSalarySlip);

// Route to download the salary slip
router.get("/:id/download-salary-slip", employeeController.downloadSalarySlip);

module.exports = router;

module.exports = router;
