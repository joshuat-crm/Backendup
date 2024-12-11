const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController"); // Adjust the path as necessary
const { isAdmin, isManager } = require("../middlewares/authMiddleware");
const verifyJWT = require("../middlewares/authMiddleware").verifyJWT;

// Get all users (only Admins can access this route)
router.get("/", verifyJWT, userController.getAllUsers);

// Get a user by ID (Admin, Manager, or the User themself can access this route)
router.get("/:id", verifyJWT, userController.getUserById);

// Update a user (Admin or the User themself can update)
router.put("/:id", verifyJWT, userController.updateUser);

// Delete a user (Admin can delete a user)
router.delete("/:id", verifyJWT, userController.deleteUser);

// Change user status (Admin can change status to active, inactive, banned)
router.patch(
  "/:id/status",
  verifyJWT,

  userController.changeUserStatus
);

// Get users by role (Admin or Manager can view users by role)
router.get("/role/:role", verifyJWT, userController.getUsersByRole);

// Update user's societies (only Admin or Manager can assign societies)
router.patch(
  "/:id/societies",
  verifyJWT,

  userController.updateUserSocieties
);

router.put(
  "/investor/profit",

  userController.updateInvestorProfitPercentage
);
// change password
router.patch("/change-password", verifyJWT, userController.changePassword);

// Forgot password route
router.post("/forgot-password", userController.forgotPassword);

// Reset password route
router.post("/reset-password/:token", userController.resetPassword);

module.exports = router;
