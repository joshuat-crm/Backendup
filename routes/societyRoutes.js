const express = require("express");
const router = express.Router();
const societyController = require("../controllers/societyController");
const {
  verifyJWT,
  isAdmin,
  isManager,
  checkUserStatus,
} = require("../middlewares/authMiddleware"); // Middleware for authentication and role authorization

// Create a new society (Admin only)
router.post("/", verifyJWT, isAdmin, societyController.createSociety);

// Get all societies (Accessible by various roles)
router.get(
  "/",
  verifyJWT,

  societyController.getAllSocieties
);

// Get a single society by name (Accessible by various roles)
router.get(
  "/name/:name",
  verifyJWT,
  checkUserStatus,
  societyController.getSocietyByName
);

// Get a single society by ID (Accessible by various roles)
router.get(
  "/:id",
  verifyJWT,
  checkUserStatus,
  societyController.getSocietyById
);

// Update a society by ID (Admin only)
router.put("/:id", verifyJWT, societyController.updateSociety);

// Delete a society by ID (Admin only)
router.delete("/:id", verifyJWT, societyController.deleteSociety);

// Remove a plot from a society (Admin, Manager)
router.delete(
  "/remove-plot/:society_id/plot/:plot_id",
  verifyJWT,
  societyController.removePlotFromSociety
);

// Edit a plot within a society (Admin, Manager)
router.put(
  "/edit-plot/:society_id/plot/:plot_id",
  verifyJWT,
  societyController.editPlotFromSociety
);

// Remove a user from a society (Admin only)
router.delete(
  "/remove-user/:society_id/:employee_id",
  verifyJWT,

  societyController.removeUserFromSociety
);

// Routes for approval actions
router.get("/approve/:token", societyController.handleDeletionApproval);
router.get("/reject/:token", societyController.handleDeletionApproval);
module.exports = router;
