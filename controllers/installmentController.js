const Notification = require("../models/Notification"); // Assuming you have a Notification model
const Installment = require("../models/Installment");
const Plot = require("../models/Plot");
const User = require("../models/User");

const installmentController = {
  // 1. Create a new installment
  createInstallment: async (req, res) => {
    try {
      const {
        plot_id,
        customer_id,
        amount,
        due_date,
        installment_number,
        discount,
        payment_method,
      } = req.body;

      // Validate required fields
      if (
        !plot_id ||
        !customer_id ||
        !amount ||
        !due_date ||
        installment_number == null
      ) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      // Create new installment
      const newInstallment = new Installment({
        plot_id,
        customer_id,
        amount,
        due_date,
        installment_number,
        discount: discount || 0,
        payment_method: payment_method || "Cash",
        status: "Pending",
      });

      await newInstallment.save();
      res
        .status(201)
        .json({
          message: "Installment created successfully",
          installment: newInstallment,
        });
    } catch (error) {
      console.error("Create Installment Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // 2. Retrieve installments for a customer or plot
  getInstallments: async (req, res) => {
    try {
      const { customer_id, plot_id } = req.query;

      // Filter installments based on customer or plot ID
      const filter = {};
      if (customer_id) filter.customer_id = customer_id;
      if (plot_id) filter.plot_id = plot_id;

      const installments = await Installment.find(filter)
        .populate("plot_id")
        .populate("customer_id");

      res.status(200).json({ installments });
    } catch (error) {
      console.error("Get Installments Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // 3. Update installment status (mark as Paid or Overdue)
  updateInstallmentStatus: async (req, res) => {
    try {
      const { installment_id, status, payment_date } = req.body;

      // Validate input
      if (!installment_id || !status) {
        return res
          .status(400)
          .json({ message: "Installment ID and status are required" });
      }

      // Find and update the installment
      const installment = await Installment.findById(installment_id);
      if (!installment) {
        return res.status(404).json({ message: "Installment not found" });
      }

      // Update status and optionally set payment date
      installment.status = status;
      if (status === "Paid" && payment_date) {
        installment.payment_date = payment_date;
      } else if (status === "Overdue" && !payment_date) {
        installment.payment_date = null;
      }

      await installment.save();
      res
        .status(200)
        .json({
          message: "Installment status updated successfully",
          installment,
        });
    } catch (error) {
      console.error("Update Installment Status Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // 4. Check and mark overdue installments
  checkOverdueInstallments: async (req, res) => {
    try {
      const { plot_id } = req.query;

      // Set 'today' to start of the day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // console.log("Checking overdue installments fo/r:", plot_id ? `Plot ID: ${plot_id}` : "All plots");
      // console.log("Today's date:", today);

      // Find installments that are past due and have status Pending or Overdue
      const overdueInstallments = await Installment.find({
        due_date: { $lt: today },
        status: { $in: ["Pending", "Overdue"] }, // Check for both Pending and Overdue statuses
        ...(plot_id && { plot_id }), // Add plot_id filter if provided
      });

      // console.log("Overdue installments found:", overdueInstallments.length);

      if (overdueInstallments.length === 0) {
        return res.status(200).json({
          message: "No overdue installments found",
        });
      }

      // Update status to Overdue
      for (let installment of overdueInstallments) {
        if (installment.status !== "Overdue") {
          installment.status = "Overdue";
          await installment.save();
          // console.log(`Updated installment to overdue: ${installment._id}`);
        }
      }

      // Send response once after processing all installments
      res.status(200).json({
        message: "Overdue installments updated",
        overdueInstallments,
      });
    } catch (error) {
      console.error("Check Overdue Installments Error:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Function to update the installment status
  updateInstallmentStatusAsync: async (req, res) => {
    try {
      const { installment_id, new_status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(installment_id)) {
        return res.status(400).json({ error: "Invalid installment_id format" });
      }

      // Ensure that the status is valid
      if (
        !["Pending", "Completed", "Partially Paid", "Overdue"].includes(
          new_status
        )
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      let installment = await Installment.findById(installment_id);
      if (!installment) {
        return res.status(404).json({ error: "Installment not found" });
      }

      // Prevent status change to "Completed" if the installment is partially paid
      if (
        installment.status === "Partially Paid" &&
        new_status === "Completed"
      ) {
        return res.status(400).json({
          error: "Cannot mark as Completed. Pay the remaining amount first.",
        });
      }

      // Update status
      installment.status = new_status;

      // If the status is set to 'Completed', we make sure the installment is fully paid
      if (new_status === "Completed") {
        installment.paid_amount = installment.amount;
        installment.remaining_amount = 0;
      }

      await installment.save();

      res.status(200).json({
        message: "Installment status updated successfully",
        installment,
      });
    } catch (error) {
      console.error("Error updating installment status:", error);
      res.status(500).json({ error: "Failed to update installment status" });
    }
  },
};

module.exports = installmentController;
