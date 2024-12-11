const Investor = require("../models/Investor");
const User = require("../models/User");
const Plot = require("../models/Plot");
const FinancialTransaction = require("../models/FinancialTransaction");
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs-extra");
// Helper function to get the total number of sold plots in a set of societies
const getTotalPlotsSold = async (societyIds) => {
  try {
    const soldPlotsCount = await Plot.countDocuments({
      society_id: { $in: societyIds },
      status: "Sold", // Ensure this field reflects the status of sold plots
    });

    return soldPlotsCount;
  } catch (error) {
    console.error("Error getting sold plots count:", error);
    throw new Error("Error fetching sold plots");
  }
};

// Helper function to get sold plots in the current month
const getSoldPlotsInMonth = async (societyIds) => {
  try {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const startDate = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59, 999);

    // console.log("Start Date:", startDate);
    // console.log("End Date:", endDate);

    const soldPlots = await Plot.find({
      society_id: { $in: societyIds },
      status: "Sold",
      "sale_history.sale_date": {
        $gte: startDate,
        $lt: endDate,
      },
    });
    // console.log("Sold Plots:", soldPlots);

    let totalAmountFromSoldPlots = 0;
    soldPlots.forEach((plot) => {
      totalAmountFromSoldPlots += plot.price;
    });

    return soldPlots;
  } catch (error) {
    console.error("Error getting sold plots in the month:", error);
    throw new Error("Error fetching sold plots");
  }
};

// Helper function to generate a profit slip for an investor
const generateSlip = async (investor, profit) => {
  try {
    const doc = new PDFDocument();
    const slipDir = path.join(__dirname, "../investor_slips");
    await fs.ensureDir(slipDir); // Ensures the directory exists

    const slipPath = path.join(
      slipDir,
      `${investor.name}_profit_slip_${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
    doc.pipe(fs.createWriteStream(slipPath));

    doc.fontSize(25).text("Investor Profit Slip", { align: "center" });
    doc.moveDown();
    doc.fontSize(20).text(`Investor Name: ${investor.name}`);
    doc.text(`Investment Amount: ${investor.investmentAmount}`);
    doc.text(`Profit Percentage: ${investor.profitPercentage}%`);
    doc.text(
      `Total Sold Plots: ${await getTotalPlotsSold(investor.societies)}`
    );
    doc.text(`Calculated Profit: ${profit}`);
    doc.text(`Date: ${new Date().toISOString().split("T")[0]}`);

    doc.end();
    return slipPath;
  } catch (error) {
    console.error("Error generating investor slip:", error);
    throw new Error("Error generating investor slip");
  }
};

const investorController = {
  getAllInvestors: async (req, res) => {
    try {
      const investors = await Investor.find()
        .populate("user")
        .populate("societies")
        .select("-sensitiveField");
      res.status(200).json(investors);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getInvestorById: async (req, res) => {
    try {
      const investor = await Investor.findById(req.params.id)
        .populate("user")
        .populate("societies");

      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }
      res.status(200).json(investor);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  updateInvestor: async (req, res) => {
    try {
      const {
        investmentAmount,
        profitPercentage,
        societies,
        status,
        contactInfo,
      } = req.body;
      const investor = await Investor.findById(req.params.id);

      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      // Only update fields if they are provided in the request
      investor.investmentAmount = investmentAmount ?? investor.investmentAmount;
      investor.profitPercentage = profitPercentage ?? investor.profitPercentage;
      investor.societies = societies ?? investor.societies;
      investor.status = status ?? investor.status;

      if (contactInfo) {
        // Only update contactInfo fields that are provided
        investor.contactInfo.phone =
          contactInfo.phone ?? investor.contactInfo.phone;
        investor.contactInfo.email =
          contactInfo.email ?? investor.contactInfo.email;
        investor.contactInfo.cnic =
          contactInfo.cnic ?? investor.contactInfo.cnic;
        investor.contactInfo.address =
          contactInfo.address ?? investor.contactInfo.address;
      }

      await investor.save();
      res
        .status(200)
        .json({ message: "Investor updated successfully", investor });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  changeInvestorStatus: async (req, res) => {
    try {
      const { status } = req.body;
      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const investor = await Investor.findById(req.params.id);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      investor.status = status;
      await investor.save();
      res
        .status(200)
        .json({ message: `Investor status updated to ${status}`, investor });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  deleteInvestor: async (req, res) => {
    try {
      const investor = await Investor.findByIdAndDelete(req.params.id);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      res.status(200).json({ message: "Investor deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getInvestorsBySociety: async (req, res) => {
    try {
      const investors = await Investor.find({ societies: req.params.societyId })
        .populate("user")
        .populate("societies");
      res.status(200).json(investors);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // calculateProfits: async (req, res) => {
  //   try {
  //     const { username } = req.body;
  //     const user = await User.findOne({ username });
  //     if (!user) {
  //       return res.status(404).json({ message: 'User not found' });
  //     }

  //     const investor = await Investor.findOne({ user: user._id, status: 'active' });
  //     if (!investor) {
  //       return res.status(404).json({ message: 'Investor not found or inactive' });
  //     }

  //     const currentMonth = new Date().getMonth();
  //     if (investor.lastSlipGenerated && new Date(investor.lastSlipGenerated).getMonth() === currentMonth) {
  //       return res.status(400).json({ message: 'Slip already generated for this month' });
  //     }

  //     const totalPlotsSold = await getTotalPlotsSold(investor.societies);
  //     let monthlyProfit = (investor.investmentAmount * investor.profitPercentage / 100) * totalPlotsSold;
  //     monthlyProfit += investor.unpaidProfit || 0;

  //     let slipPath = null;
  //     if (monthlyProfit > 0) {
  //       slipPath = await generateSlip(investor, monthlyProfit);

  //       await FinancialTransaction.create({
  //         user_id: investor.user,
  //         amount: monthlyProfit,
  //         transaction_type: 'Expense Payment',
  //         transaction_direction: 'Income',
  //         payment_method: 'bank',
  //         status: 'completed',
  //         transaction_date: new Date(),
  //         description: `Monthly profit for ${investor.name}`,
  //         slip_path: slipPath
  //       });

  //       investor.unpaidProfit = 0;
  //       investor.lastSlipGenerated = new Date();
  //     } else {
  //       investor.unpaidProfit = monthlyProfit;
  //     }

  //     await investor.save();

  //     res.json({
  //       message: 'Profit calculated and slip generated successfully',
  //       profitResult: {
  //         investorId: investor._id,
  //         investorName: investor.name,
  //         monthlyProfit: monthlyProfit,
  //         slipPath: slipPath || 'No slip generated',
  //         unpaidProfitCarriedOver: investor.unpaidProfit
  //       }
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: error.message });
  //   }
  // },

  calculateProfits: async (req, res) => {
    try {
      const { username } = req.body;
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const investor = await Investor.findOne({
        user: user._id,
        status: "active",
      });
      if (!investor) {
        return res
          .status(404)
          .json({ message: "Investor not found or inactive" });
      }

      const currentMonth = new Date().getMonth();

      // Check if a slip has already been generated this month
      if (
        investor.lastSlipGenerated &&
        new Date(investor.lastSlipGenerated).getMonth() === currentMonth
      ) {
        return res
          .status(400)
          .json({ message: "Slip already generated for this month" });
      }

      // Get sold plots in the current month for the investor's societies
      const soldPlots = await getSoldPlotsInMonth(investor.societies);

      // Calculate the total profit from the sold plots
      let totalProfit = 0;
      soldPlots.forEach((plot) => {
        const plotProfit =
          (investor.investmentAmount / plot.price) *
          (investor.profitPercentage / 100);
        totalProfit += plotProfit;
      });

      const monthlyProfit = totalProfit;
      let slipPath = null;

      if (monthlyProfit > 0) {
        // Generate the profit slip PDF for the investor
        slipPath = await generateSlip(investor, monthlyProfit);

        // Record the financial transaction
        await FinancialTransaction.create({
          user_id: investor.user,
          amount: monthlyProfit,
          transaction_type: "Expense Payment",
          transaction_direction: "Income",
          payment_method: "bank",
          status: "completed",
          transaction_date: new Date(),
          description: `Monthly profit for ${investor.name}`,
          slip_path: slipPath,
        });

        // Reset unpaid profit if applicable
        investor.unpaidProfit = 0;
        investor.lastSlipGenerated = new Date();
      } else {
        investor.unpaidProfit = monthlyProfit;
      }

      await investor.save();

      res.json({
        message: "Profit calculated and slip generated successfully",
        profitResult: {
          investorId: investor._id,
          investorName: investor.name,
          monthlyProfit: monthlyProfit,
          slipPath: slipPath || "No slip generated",
          unpaidProfitCarriedOver: investor.unpaidProfit,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },

  getInvestorProfit: async (req, res) => {
    try {
      const { username } = req.body;

      // Find the user by username
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Find the investor linked to the user
      const investor = await Investor.findOne({
        user: user._id,
        status: "active",
      });
      if (!investor) {
        return res
          .status(404)
          .json({ message: "Investor not found or inactive" });
      }

      // Calculate the total number of sold plots for the associated societies
      const totalPlotsSold = await getTotalPlotsSold(investor.societies);

      // Calculate the monthly profit
      let monthlyProfit =
        ((investor.investmentAmount * investor.profitPercentage) / 100) *
        totalPlotsSold;

      // Add any unpaid profit carried over
      monthlyProfit += investor.unpaidProfit || 0;

      // Return the calculated profit
      res.json({
        message: "Investor profit calculated successfully",
        profitResult: {
          investorId: investor._id,
          investorName: investor.name,
          monthlyProfit: monthlyProfit,
          unpaidProfitCarriedOver: investor.unpaidProfit,
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: error.message });
    }
  },
  downloadSlip: (req, res) => {
    const { slipPath } = req.params;
    const fullPath = path.join(__dirname, "..", slipPath);

    fs.access(fullPath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error("File not found:", fullPath);
        return res.status(404).json({ message: "Slip not found" });
      }

      res.download(fullPath, (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ message: "Error downloading slip" });
        }
      });
    });
  },
};

module.exports = investorController;
