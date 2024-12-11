const express = require("express");
const customerController = require("../controllers/customerController"); // Adjust the path as necessary
const {
  verifyJWT,
  isAdmin,
  isCustomer,
  isOwnerOrAdmin,
  checkUserStatus,
} = require("../middlewares/authMiddleware"); // Adjust the path as necessary

const router = express.Router();

// Middleware for protected routes
router.use(verifyJWT, checkUserStatus); // Apply JWT and status check for all customer routes

// Get logged-in customer's own details
router.get("/customer/me", customerController.getCustomerById);

// Update customer information (Admin only)
router.put("/customer/:id", customerController.updateCustomer);

// Update own information (for customers)
router.put("/customer/me", isOwnerOrAdmin, customerController.updateOwnInfo);

// Get plots for a specific customer (Admin or the customer themself)
// Get plots for a specific customer (Admin or the customer themselves)
router.get("/customer/:id/plots", customerController.getCustomerPlots);

// Get payment history for logged-in customer or admin
router.get(
  "/customer/me/payments",
  isCustomer,
  customerController.getCustomerPayments
);
router.get("/customer/:id/payments", customerController.getCustomerPayments); // Admin can view any payment history

// Retrieve customer interactions with the society (for both admins and customers)
router.get(
  "/customer/me/interactions",
  isCustomer,
  customerController.getCustomerInteractions
);
router.get(
  "/customer/:id/interactions",
  customerController.getCustomerInteractions
); // Admin can view any interactions

module.exports = router;
