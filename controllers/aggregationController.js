const mongoose = require("mongoose"); // Ensure mongoose is required
const Installment = require("../models/Installment");
const Plot = require("../models/Plot");
const Customer = require("../models/Customer");
const User = require("../models/User");
const FinancialTransaction = require("../models/FinancialTransaction");
const Society = require("../models/Society");

// Controller to fetch aggregated data
const getAggregatedData = async (req, res) => {
  try {
    const { societyId } = req.params;

    // Fetch the society by ID to get the society name and other info
    const society = await Society.findById(societyId);
    if (!society) {
      return res.status(404).json({
        success: false,
        message: "Society not found",
      });
    }

    // Total sold plots for the given society
    const soldPlotsCount = await Plot.countDocuments({
      society_id: societyId,
      status: "Sold",
    });

    // Total available, reserved, sold, and under maintenance plots in the given society
    const totalPlotsCount = await Plot.countDocuments({
      society_id: societyId,
      $or: [
        { status: "Available" },
        { status: "Reserved" },
        { status: "Sold" },
        { status: "Under Maintenance" },
      ],
    });

    // Total booked plots for the given society
    const bookedPlotsCount = await Plot.countDocuments({
      society_id: societyId,
      booking_status: "Booked",
    });

    // Count only available plots
    const availablePlotsCount = await Plot.countDocuments({
      society_id: societyId,
      status: "Available",
    });

    // Total customers in the given society
    const totalCustomersCount = await Customer.countDocuments({
      societies: societyId,
    });

    // Total users associated with the society
    const totalUserCount = await User.countDocuments({ societies: societyId });

    // Find all transactions for the given society
    const transactions = await FinancialTransaction.find({
      societies: societyId,
    });

    // Aggregation query for total income
    const totalIncome = await FinancialTransaction.aggregate([
      {
        $match: {
          societies: new mongoose.Types.ObjectId(societyId),
          transaction_direction: "Income",
        },
      },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: "$amount" },
        },
      },
    ]);

    // Aggregation query for total expense
    const totalExpense = await FinancialTransaction.aggregate([
      {
        $match: {
          societies: new mongoose.Types.ObjectId(societyId),
          transaction_direction: "Expense",
        },
      },
      {
        $group: {
          _id: null,
          totalExpense: { $sum: "$amount" },
        },
      },
    ]);

    // Aggregated installments data (pending and partially paid installments)
    const installments = await Installment.aggregate([
      {
        $lookup: {
          from: "plots", // Assuming the collection name is 'plots'
          localField: "plot_id", // The field in 'Installment' that references 'Plot'
          foreignField: "_id", // The field in 'Plot' that references 'Installment'
          as: "plot_data", // Output array containing the 'Plot' data
        },
      },
      {
        $match: {
          "plot_data.society_id": new mongoose.Types.ObjectId(societyId),
          status: { $in: ["Pending", "Partially Paid", "Overdue"] },
        },
      },
      {
        $project: {
          amount: 1,
          remaining_amount: 1,
          paid_amount: 1,
          status: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          totalRemainingAmount: { $sum: "$remaining_amount" },
          totalPaidAmount: { $sum: "$paid_amount" },
        },
      },
    ]);

    const totalReceivableAmount =
      installments.length > 0
        ? installments[0].totalAmount -
          installments[0].totalPaidAmount +
          installments[0].totalRemainingAmount
        : 0;

    // Prepare response with society name and aggregated data
    res.json({
      success: true,
      data: {
        societyName: society.name,
        totalSoldPlots: soldPlotsCount,
        totalBookedPlots: bookedPlotsCount,
        totalCustomers: totalCustomersCount,
        totalUser: totalUserCount,
        totalPlots: totalPlotsCount,
        availablePlotsCount: availablePlotsCount, // Include available plots count only
        totalIncome: totalIncome[0] ? totalIncome[0].totalIncome : 0,
        totalExpense: totalExpense[0] ? totalExpense[0].totalExpense : 0,
        totalReceivableAmount, // Total receivable amount from pending and partially paid installments
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch aggregated data",
      error: error.message,
    });
  }
};

module.exports = { getAggregatedData };
