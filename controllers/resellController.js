const PlotResell = require("../models/PlotResell");
const Plot = require("../models/Plot");
const Customer = require("../models/Customer");
const FinancialTransaction = require("../models/FinancialTransaction");
const Installment = require("../models/Installment");
const PDFDocument = require("pdfkit");
const User = require("../models/User");
const Notification = require("../models/Notification");
const fs = require("fs");
const path = require("path");
const Society = require("../models/Society");
const resellController = {
  // Get all resells
  getAllResells: async (req, res) => {
    try {
      const resells = await PlotResell.find()
        .populate({
          path: "previous_customer_id",
          select: "name contactInfo.cnic", // Fetch name and cnic from contactInfo of the previous customer
        })
        .populate({
          path: "new_customer_id",
          select: "name contactInfo.cnic", // Fetch name and cnic from contactInfo of the new customer
        })
        .populate({
          path: "plot_id",
          select: "plot_number size society_id", // Fetch plot_number and society_id from the Plot model
          populate: {
            path: "society_id", // Populating the society_id inside plot_id
            select: "name", // Fetch the society name from the Society model
          },
        });

      res.status(200).json(resells);
    } catch (error) {
      console.error("Error fetching resells:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  getResellById: async (req, res) => {
    try {
      const resell = await PlotResell.findById(req.params.id)
        .populate({
          path: "previous_customer_id",
          select: "name contactInfo.cnic", // Fetch name and cnic from contactInfo of the previous customer
        })
        .populate({
          path: "new_customer_id",
          select: "name contactInfo.cnic", // Fetch name and cnic from contactInfo of the new customer
        })
        .populate({
          path: "plot_id",
          select: "plot_number society_id", // Fetch plot_number and society_id from the Plot model
          populate: {
            path: "society_id", // Populating the society_id inside plot_id
            select: "name", // Fetch the society name from the Society model
          },
        });

      if (!resell) {
        return res.status(404).json({ message: "Resell not found" });
      }

      res.status(200).json(resell);
    } catch (error) {
      console.error("Error fetching resell:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  //   createResell: async (req, res) => {
  //     try {
  //         console.log('Request data received:', req.body);
  //         const { plot_id, previous_customer_id, new_customer_id, resell_fee } = req.body;

  //         // Validate request body
  //         if (!plot_id || !previous_customer_id || !new_customer_id || resell_fee === undefined) {
  //             return res.status(400).json({ message: 'All fields are required' });
  //         }

  //         // Validate resell_fee
  //         if (isNaN(resell_fee) || resell_fee < 0) {
  //             return res.status(400).json({ message: 'Fee must be a non-negative number' });
  //         }

  //         // Check if plot and customers exist
  //         const plot = await Plot.findById(plot_id);
  //         if (!plot) return res.status(404).json({ message: 'Plot not found' });

  //         const previousOwner = await Customer.findById(previous_customer_id);
  //         if (!previousOwner) return res.status(404).json({ message: 'Previous owner not found' });

  //         const newOwner = await Customer.findById(new_customer_id);
  //         if (!newOwner) return res.status(404).json({ message: 'New owner not found' });

  //         // Check if the plot is already resold to the same customer
  //         const existingResell = await PlotResell.findOne({
  //             plot_id: plot_id,
  //             new_customer_id: new_customer_id,
  //         });

  //         if (existingResell && previous_customer_id !== new_customer_id) {
  //             return res.status(400).json({ message: 'Plot is already resold to this customer' });
  //         }

  //         // Prevent resell to the same owner
  //         if (previous_customer_id === new_customer_id) {
  //             return res.status(400).json({
  //                 message: 'Previous owner cannot resell to themselves unless transferring back',
  //             });
  //         }

  //         // Transfer installments to the new owner
  //         await Installment.updateMany(
  //             {
  //                 plot_id: plot_id,
  //                 customer_id: previous_customer_id,
  //                 status: 'Pending',
  //             },
  //             { $set: { customer_id: new_customer_id } }
  //         );

  //         // Update the Plot to assign it to the new customer
  //         plot.customer_id = new_customer_id;
  //         plot.status = 'Sold';
  //         await plot.save();

  //         // Remove the plot from the previous owner's list of plots
  //         previousOwner.plots = previousOwner.plots.filter(plot => !plot.equals(plot_id));
  //         await previousOwner.save();

  //         // Add the plot to the new owner's list of plots
  //         newOwner.plots.push(plot_id);

  //         // Add society to Customer if not already present
  //         if (!newOwner.societies.includes(plot.society_id)) {
  //             newOwner.societies.push(plot.society_id);
  //         }
  //         await newOwner.save();

  //         // Update User societies
  //         const user = await User.findOne({ customerData: new_customer_id });
  //         if (user && !user.societies.includes(plot.society_id)) {
  //             user.societies.push(plot.society_id);
  //             await user.save();
  //         }

  //         // Create a financial transaction for the resell fee
  //         const financialTransaction = new FinancialTransaction({
  //             customer_id: new_customer_id,
  //             plot_id: plot_id,
  //             societies: [plot.society_id],
  //             transaction_date: Date.now(),
  //             amount: resell_fee,
  //             transaction_type: 'Resell Payment',
  //             transaction_direction: 'Income',
  //             description: '',
  //         });
  //         await financialTransaction.save();

  //         // Create and save a new resell record
  //         const newResell = new PlotResell({
  //             plot_id,
  //             previous_customer_id,
  //             new_customer_id,
  //             resell_fee,
  //             resell_date: Date.now(),
  //         });
  //         await newResell.save();

  //         res.status(201).json({
  //             message: 'Resell created successfully',
  //             resell: newResell,
  //         });
  //     } catch (error) {
  //         console.error('Error creating resell:', error);
  //         res.status(500).json({ message: 'Server error', error });
  //     }

  //     // // Save the transaction to the database
  //     // const savedTransaction = await financialTransaction.save();

  //     // try {
  //     //   if (societies && societies.length > 0) {
  //     //     await Society.updateMany(
  //     //       { _id: { $in: societies } },
  //     //       { $push: { FinancialTransaction: savedTransaction._id } }
  //     //     );
  //     //   }
  //     // } catch (updateError) {
  //     //   console.error("Error updating societies:", updateError);
  //     //   throw new Error("Failed to update societies with transaction.");
  //     // }
  // },
  createResell: async (req, res) => {
    try {
      // console.log('Request data received:', req.body)
      const { plot_id, previous_customer_id, new_customer_id, resell_fee } =
        req.body;

      // Validate request body
      if (
        !plot_id ||
        !previous_customer_id ||
        !new_customer_id ||
        resell_fee === undefined
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate resell_fee
      if (isNaN(resell_fee) || resell_fee < 0) {
        return res
          .status(400)
          .json({ message: "Fee must be a non-negative number" });
      }

      // Check if plot and customers exist
      const plot = await Plot.findById(plot_id);
      if (!plot) return res.status(404).json({ message: "Plot not found" });

      const previousOwner = await Customer.findById(previous_customer_id);
      if (!previousOwner)
        return res.status(404).json({ message: "Previous owner not found" });

      const newOwner = await Customer.findById(new_customer_id);
      if (!newOwner)
        return res.status(404).json({ message: "New owner not found" });

      // Check if the plot is already resold to the same customer
      const existingResell = await PlotResell.findOne({
        plot_id: plot_id,
        new_customer_id: new_customer_id,
      });

      if (existingResell && previous_customer_id !== new_customer_id) {
        return res
          .status(400)
          .json({ message: "Plot is already resold to this customer" });
      }

      // Prevent resell to the same owner
      if (previous_customer_id === new_customer_id) {
        return res.status(400).json({
          message:
            "Previous owner cannot resell to themselves unless transferring back",
        });
      }

      // Transfer installments to the new owner
      await Installment.updateMany(
        {
          plot_id: plot_id,
          customer_id: previous_customer_id,
          status: "Pending",
        },
        { $set: { customer_id: new_customer_id } }
      );

      // Update the Plot to assign it to the new customer
      plot.customer_id = new_customer_id;
      plot.status = "Sold";
      await plot.save();

      // Update customers' plot lists
      previousOwner.plots = previousOwner.plots.filter(
        (plot) => !plot.equals(plot_id)
      );
      await previousOwner.save();

      newOwner.plots.push(plot_id);

      if (!newOwner.societies.includes(plot.society_id)) {
        newOwner.societies.push(plot.society_id);
      }
      await newOwner.save();

      // Update User societies if linked to the new customer
      const user = await User.findOne({ customerData: new_customer_id });
      if (user && !user.societies.includes(plot.society_id)) {
        user.societies.push(plot.society_id);
        await user.save();
      }

      // // Create a financial transaction for the resell fee
      // const financialTransaction = new FinancialTransaction({
      //     customer_id: new_customer_id,
      //     plot_id: plot_id,
      //     societies: [plot.society_id],
      //     transaction_date: Date.now(),
      //     amount: resell_fee,
      //     transaction_type: 'Resell Payment',
      //     transaction_direction: 'Income',
      //     description: '',
      // });

      const transaction = new FinancialTransaction({
        customer_id: new_customer_id,
        plot_id: plot_id,
        societies: [plot.society_id],
        transaction_date: new Date(),
        amount: resell_fee,
        transaction_type: "Resell Payment",
        transaction_direction: "Income",
        description: "",
        status: "Completed",
      });
      const savedTransaction = await transaction.save();

      // Link transaction to society
      if (plot.society_id) {
        await Society.updateOne(
          { _id: plot.society_id },
          { $push: { FinancialTransaction: savedTransaction._id } }
        );
      }

      // Create and save a new resell record
      const newResell = new PlotResell({
        plot_id,
        previous_customer_id,
        new_customer_id,
        resell_fee,
        resell_date: Date.now(),
      });
      await newResell.save();
      // Send notifications to both the user (new owner) and admin
      const userNotificationMessage = `Your plot (ID: ${plot.plot_number}) has been successfully resold. You are now the owner of the plot.`;
      const adminNotificationMessage = `Plot (ID: ${plot.plot_number}) has been successfully resold from ${previousOwner.name} to ${newOwner.name}.`;

      await Notification.create({
        userId: newOwner.userId, // Send notification to the customer
        message: userNotificationMessage,
        type: "Resell",
        recipientRole: "Customer", // Specify the role
      });

      await Notification.create({
        userId: null, // Null for admin notifications
        message: adminNotificationMessage,
        type: "Resell",
        recipientRole: "Admin", // Specify the role
      });

      res.status(201).json({
        message: "Resell created and notifications sent successfully",
        resell: newResell,
      });
    } catch (error) {
      console.error("Error creating resell:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Update resell by ID
  updateResell: async (req, res) => {
    try {
      const { plot_id, previous_customer_id, new_customer_id, resell_fee } =
        req.body;

      // Validate request body
      if (
        !plot_id ||
        !previous_customer_id ||
        !new_customer_id ||
        resell_fee === undefined
      ) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Validate resell_fee
      if (isNaN(resell_fee) || resell_fee < 0) {
        return res
          .status(400)
          .json({ message: "Fee must be a non-negative number" });
      }

      // Find resell by ID
      const resell = await findResellById(req.params.id);
      if (!resell) {
        return res.status(404).json({ message: "Resell not found" });
      }

      // Update resell details
      resell.plot_id = plot_id;
      resell.previous_customer_id = previous_customer_id;
      resell.new_customer_id = new_customer_id;
      resell.resell_fee = resell_fee;
      resell.resell_date = Date.now();
      await resell.save();

      res.status(200).json({ message: "Resell updated successfully", resell });
    } catch (error) {
      console.error("Error updating resell:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Delete resell by ID (soft delete)
  deleteResell: async (req, res) => {
    try {
      // Find and delete resell by ID
      const resell = await PlotResell.findByIdAndDelete(req.params.id);

      if (!resell) {
        return res.status(404).json({ message: "Resell not found" });
      }

      // console.log('Resell deleted:', resell)

      res.status(200).json({ message: "Resell deleted successfully" });
    } catch (error) {
      console.error("Error deleting resell:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};

// Helper function to find a resell by ID
const findResellById = async (id) => {
  const resell = await PlotResell.findById(id).populate(
    "plot_id previous_customer_id new_customer_id"
  );
  if (!resell) {
    throw new Error("Resell not found");
  }
  return resell;
};

module.exports = resellController;
