const TransferPlot = require("../models/TransferPlot");
const FinancialTransaction = require("../models/FinancialTransaction");
const Society = require("../models/Society");
const Plot = require("../models/Plot");
const User = require("../models/User");
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const Notification = require("../models/Notification");

const transferPlotController = {
  // Transfer a plot to a new owner
  async transferPlot(req, res) {
    try {
      const { plot_id, new_owner_id, transfer_fee } = req.body;

      // Find the plot
      const plot = await Plot.findById(plot_id);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }

      // Check if the plot's booking status is "Booked"
      if (plot.booking_status !== "Booked") {
        return res.status(400).json({
          message: `Plot transfer not allowed. Current booking status is '${plot.booking_status}'.`,
        });
      }

      // Ensure the new owner exists in the User model
      const newOwner = await User.findById(new_owner_id).populate(
        "customerData"
      );
      if (!newOwner || !newOwner.customerData) {
        return res
          .status(404)
          .json({ message: "New owner not found in Customer data" });
      }

      // Verify the plot is already booked by the new customer
      const booking = await Booking.findOne({
        plot_id,
        customer_id: newOwner.customerData._id,
        booking_status: "Booked",
      });
      // if (!booking) {
      //   return res.status(400).json({
      //     message:
      //       'Plot must already be booked by the new customer before transfer.'
      //   })
      // }

      // Create a Transfer Plot record
      const transferPlot = await TransferPlot.create({
        plot_id,
        new_owner_id,
        transfer_fee,
      });

      // Add financial transaction
      const financialTransaction = await FinancialTransaction.create({
        societies: [plot.society_id],
        customer_id: new_owner_id,
        plot_id,
        transaction_date: new Date(),
        amount: transfer_fee,
        transaction_type: "Transfer Fee",
        transaction_direction: "Income",
        description: `Plot transfer fee for Plot ${plot.plot_number}`,
      });

      // Update the plot's owner
      plot.customer_id = new_owner_id;
      plot.status = "Transfer";
      plot.booking_status = "Transfer";
      await plot.save();

      // Update the booking status to "Transfer"
      booking.booking_status = "Transfer";
      await booking.save();

      // Update the society's financial records
      const society = await Society.findById(plot.society_id);
      if (society) {
        society.FinancialTransaction.push(financialTransaction._id);
        await society.save();
      }

      // Update new owner's society list if not already present
      if (!newOwner.societies.includes(plot.society_id)) {
        newOwner.societies.push(plot.society_id);
        await newOwner.save();
      }
      // Send notification to admin
      await Notification.create({
        userId: newOwner._id, // Send notification to the customer
        message: `Congratulations! Plot ${plot.plot_number} has been successfully transferred to you.`,
        type: "Transfer",
        recipientRole: "Customer", // Specify the role
      });

      await Notification.create({
        userId: null, // Null for admin notifications
        message: `Plot ${plot.plot_number} has been transferred to ${newOwner.customerData.name}.`,
        type: "Transfer",
        recipientRole: "Admin", // Specify the role
      });
      return res.status(200).json({
        message: "Plot transferred successfully",
        transferPlot,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
  // Get all transfer plots or filter by query parameters
  async getTransferPlots(req, res) {
    try {
      const { plot_id, new_owner_id } = req.query;

      const filter = {};
      if (plot_id) filter.plot_id = plot_id;
      if (new_owner_id) filter.new_owner_id = new_owner_id;

      const transferPlots = await TransferPlot.find(filter)
        .populate("plot_id", "plot_number society_id") // Populate plot_id with plot_number and society_id
        .populate({
          path: "plot_id",
          select:
            "plot_number size society_id plot_type block booking_status category", // Fetch plot_number and society_id from the Plot model
          populate: {
            path: "society_id", // Populating the society_id inside plot_id
            select: "name location society_image", // Fetch the society name from the Society model
          },
        })
        .populate({
          path: "new_owner_id",
          select: "username role customerData",
          populate: {
            path: "customerData",
            model: "Customer",
            select: "name contactInfo",
          },
        })
        .exec();

      // console.log(transferPlots); // Debugging output

      return res.status(200).json({
        message: "Transfer plots retrieved successfully",
        data: transferPlots,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal Server Error" });
    }
  },
};

module.exports = transferPlotController;
