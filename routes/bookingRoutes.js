const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const installmentController = require("../controllers/installmentController");

// Booking Routes
router.post("/create", bookingController.createBooking); // Create a new booking
router.get("/bookings/:id", bookingController.getBookingById); // Get booking by ID
router.get("/bookings", bookingController.getAllBookings);
router.put("/bookings/:id/status", bookingController.updateBookingStatus); // Update booking status
router.delete("/bookings/:id", bookingController.deleteBooking); // Soft delete a booking
// Installment Routes
router.post("/installments/pay", bookingController.payInstallment); // Record an installment payment
router.get(
  "/installments/user/:customer_id",
  bookingController.getInstallmentsForUser
); // Get installments for a user

router.put(
  "/installments/status", // Endpoint to update the status of an installment
  installmentController.updateInstallmentStatusAsync
);

router.get(
  "/installments/user/:customer_id/paid",
  bookingController.getPaidInstallmentsForUser
);

// New route to check overdue installments from installment Controller
router.get(
  "/installments/check-overdue",
  installmentController.checkOverdueInstallments
);
router.get("/installments/plot/:plot_id/status/:status", bookingController.getInstallmentsByPlotIdAndStatus); // Get installments for a plot by status
router.get("/installments/plot/:plot_id/remaining-balance", bookingController.getRemainingBalanceByPlotId); // Get remaining balance for a plot
router.get("/installments/plot/:plot_id", bookingController.getInstallmentsByPlotId); // Get installments for a specific plot



module.exports = router;