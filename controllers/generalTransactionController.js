const Transaction = require("../models/generalTransaction");
const User = require("../models/User");
const Employee = require("../models/Employee");
const Notification = require("../models/Notification");
const addTransaction = async (req, res) => {
  const { type, description, amount, category, date } = req.body;

  // Validate the required fields, excluding designation from validation
  if (!type || !description || !amount || !category) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Fetch the current user details from the authenticated user
    const user = await User.findById(req.user.id);

    // Ensure the user exists
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize variables for role and designation
    let role = user.role;
    let designation = null;

    // Fetch designation if the user is an Employee
    if (user.role === "Employee") {
      const employee = await Employee.findOne({ _id: user.employeeData });

      // Check if employee exists and log for debugging
      if (!employee) {
        console.error(`Employee document not found for user ID: ${user._id}`);
        return res.status(400).json({ message: "Employee record not found" });
      }
      if (!employee.designation) {
        console.error(`Designation not found for employee ID: ${employee._id}`);
        return res
          .status(400)
          .json({ message: "Designation is required for employees" });
      }

      designation = employee.designation;
    }

    // Create the transaction with the user's username, role, and designation (if applicable)
    const transaction = new Transaction({
      type,
      description,
      amount,
      category,
      date: date || new Date(),
      user: req.user.id,
      username: user.username,
      role,
      designation, // Automatically set designation if Employee
    });

    // console.log('Transaction to be saved:', transaction) // Debug log

    // Save transaction
    const savedTransaction = await transaction.save();
    // console.log('Saved transaction:', savedTransaction)

    // Create admin notification
    await Notification.create({
      userId: null, // For admin notifications
      message: `A new general transaction of ${amount} has been created for ${
        designation ? designation : "N/A"
      }.`,
      type: "General Transaction",
      recipientRole: "Admin",
    });

    // Return the created transaction as the response
    res.status(201).json(transaction);
  } catch (error) {
    console.error("Error adding transaction:", error);
    res.status(500).json({ message: "Error adding transaction", error });
  }
};
// Get all transactions with optional filters
const getTransactions = async (req, res) => {
  const { type, category, startDate, endDate } = req.query;

  // Apply filters based on query params
  let filter = {};

  if (type) filter.type = type;
  if (category) filter.category = category;
  if (startDate && endDate) {
    filter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  try {
    // Fetch all transactions based on filters
    const transactions = await Transaction.find(filter).sort({ date: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching transactions", error });
  }
};

// Update an existing transaction
const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const { type, description, amount, category, date } = req.body;

  if (!type || !description || !amount || !category) {
    return res
      .status(400)
      .json({ message: "All fields are required for update" });
  }

  try {
    const transaction = await Transaction.findOneAndUpdate(
      { _id: id, user: req.user.id },
      { type, description, amount, category, date: date || new Date() },
      { new: true }
    );

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Error updating transaction", error });
  }
};

// Delete a transaction
// Delete a transaction
const deleteTransaction = async (req, res) => {
  try {
    // console.log('Transaction ID:', req.params.id)
    // console.log('User ID:', req.user.id)

    // Check the role of the logged-in user
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Build filter to allow Admins to delete any transaction
    const filter = { _id: req.params.id };
    if (user.role !== "Admin") {
      // If not Admin, restrict deletion to only their own transactions
      filter.user = req.user.id;
    }

    // Try deleting the transaction
    const transaction = await Transaction.findOneAndDelete(filter);

    if (!transaction)
      return res.status(404).json({ message: "Transaction not found" });

    res.status(200).json({
      message: "Transaction deleted successfully",
      transactionId: req.params.id,
    });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    res.status(500).json({ message: "Error deleting transaction", error });
  }
};

// Get transaction summary (total income, total expense, balance)
const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.aggregate([
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $project: {
          _id: 0,
          type: "$_id",
          totalAmount: 1,
        },
      },
    ]);

    // Initialize income and expense as 0
    let income = 0;
    let expense = 0;

    transactions.forEach((transaction) => {
      if (transaction.type === "income") {
        income = transaction.totalAmount;
      } else if (transaction.type === "expense") {
        expense = transaction.totalAmount;
      }
    });

    const summary = {
      income: income || 0,
      expense: expense || 0,
      balance: (income || 0) - (expense || 0),
    };

    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: "Error fetching summary", error });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
};
