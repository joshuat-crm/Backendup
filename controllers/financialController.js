const FinancialTransaction = require("../models/FinancialTransaction"); // Adjust the path as needed
const Society = require("../models/Society"); // Adjust the path as needed
const Notification = require("../models/Notification");
const User = require("../models/User");
class FinancialController {
  // Create a new financial transaction
  async createTransaction(req, res) {
    try {
      // Destructure required fields from the request body
      const {
        societies,
        user_id,
        customer_id,
        plot_id,
        // booking_id,
        // employee_id,
        amount,
        transaction_type,
        transaction_direction,
        payment_method = "Bank Transfer", // Default value if not provided
        description,
      } = req.body;

      // Check if transaction_direction is valid
      const validTransactionDirections = ["Income", "Expense"];

      if (!validTransactionDirections.includes(transaction_direction)) {
        return res
          .status(400)
          .json({ message: "Invalid transaction_direction value." });
      }

      // Create a new financial transaction
      const transaction = new FinancialTransaction({
        societies,
        user_id,
        customer_id,
        plot_id,
        amount,
        transaction_type,
        transaction_direction,
        payment_method,
        status: "Completed", // Default status
        description,
      });

      // Save the transaction to the database
      const savedTransaction = await transaction.save();

      try {
        if (societies && societies.length > 0) {
          await Society.updateMany(
            { _id: { $in: societies } },
            { $push: { FinancialTransaction: savedTransaction._id } }
          );
        }
      } catch (updateError) {
        console.error("Error updating societies:", updateError);
        throw new Error("Failed to update societies with transaction.");
      }

      await Notification.create({
        userId: null, // Null for admin notifications
        message: `A new financial transaction of ${amount} has been created.`,
        type: "Payment",
        recipientRole: "Admin", // Specify the role
      });

      try {
        await Notification.save(); // Save notification
      } catch (err) {
        console.error("Error creating notification for admin:", err);
      }

      // Return success response
      return res.status(201).json({
        message: "Transaction created successfully",
        transaction,
      });
    } catch (error) {
      console.error("Error creating transaction:", error);
      return res
        .status(500)
        .json({ message: "Error creating transaction", error: error.message });
    }
  }

  // Get a single transaction by ID
  async getAllTransactions(req, res) {
    try {
      const transactions = await FinancialTransaction.find()
        .populate({
          path: "societies", // Populate societies field
          select: "name", // Only fetch the name field
        })
        .populate({
          path: "user_id",
          select: "username role",
        })
        .populate({
          path: "customer_id",
          select: "name contactInfo",
          populate: {
            path: "societies",
            select: "name",
          },
        })
        .populate({
          path: "plot_id",
          select: "plot_number",
        })
        .populate({
          path: "booking_id",
          select: "booking_date booking_number",
        })
        .populate({
          path: "employee_id",
          select: "name designation societies",
          populate: {
            path: "societies",
            select: "name location",
          },
        });

      // console.log(transactions) // Debugging to verify populated data
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return res
        .status(500)
        .json({ message: "Error fetching transactions", error: error.message });
    }
  }

  async getTransactionById(req, res) {
    try {
      const transaction = await FinancialTransaction.findById(req.params.id)
        .populate("customer_id")
        .populate("plot_id")
        .populate("booking_id")
        .populate("employee_id");
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      return res.status(200).json(transaction);
    } catch (error) {
      console.error("Error fetching transaction:", error);
      return res
        .status(500)
        .json({ message: "Error fetching transaction", error });
    }
  }

  // Update a financial transaction
  async updateTransaction(req, res) {
    try {
      const updatedTransaction = await FinancialTransaction.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      )
        .populate("customer_id")
        .populate("plot_id")
        .populate("booking_id")
        .populate("employee_id");

      if (!updatedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      return res.status(200).json({
        message: "Transaction updated successfully",
        updatedTransaction,
      });
    } catch (error) {
      console.error("Error updating transaction:", error);
      return res
        .status(500)
        .json({ message: "Error updating transaction", error });
    }
  }

  // Delete a financial transaction
  async deleteTransaction(req, res) {
    try {
      console.log("Deleting transaction with ID:", req.params.id); // Debugging line
      const deletedTransaction = await FinancialTransaction.findByIdAndDelete(
        req.params.id
      );
      if (!deletedTransaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      return res
        .status(200)
        .json({ message: "Transaction deleted successfully" });
    } catch (error) {
      console.error("Error deleting transaction:", error);
      return res
        .status(500)
        .json({ message: "Error deleting transaction", error });
    }
  }
}

module.exports = new FinancialController();
