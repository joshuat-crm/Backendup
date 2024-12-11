const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Installment = require("../models/Installment");
const Plot = require("../models/Plot");
const FinancialTransaction = require("../models/FinancialTransaction");
const Customer = require("../models/Customer");
const User = require("../models/User");
const Society = require("../models/Society");
const Notification = require("../models/Notification");

// Create a new booking
// exports.createBooking = async (req, res) => {
//   try {
//     const {
//       plot_id,
//       customer_id,
//       total_amount,
//       initial_payment,
//       payment_mode,
//       installment_years
//     } = req.body

//     console.log('Booking request received with data:', req.body)

//     // Validate IDs
//     if (
//       !mongoose.Types.ObjectId.isValid(plot_id) ||
//       !mongoose.Types.ObjectId.isValid(customer_id)
//     ) {
//       return res
//         .status(400)
//         .json({ error: 'Invalid plot_id or customer_id format' })
//     }

//     // Check plot existence and availability
//     const plot = await Plot.findById(plot_id)
//     if (!plot) {
//       return res.status(404).json({ error: 'Plot not found' })
//     }
//     if (plot.booking_status === 'Booked' || plot.status === 'Sold') {
//       return res.status(400).json({ error: 'Plot is already booked or sold' })
//     }

//     // Check if customer exists
//     const user = await User.findById(customer_id).populate('customerData')
//     const customer = user ? user.customerData : null

//     if (customer) {
//       customer.plots.push(plot_id) // Add the plot ID to the customer's plots
//       await customer.save() // Save the updated customer
//     } else {
//       console.error('Customer not found for ID:', customer_id)
//       return res.status(404).json({ error: 'Customer not found' })
//     }

//     // Validate initial payment
//     if (payment_mode !== 'Full' && initial_payment >= total_amount) {
//       return res.status(400).json({
//         error:
//           'Initial payment must be less than the total amount for partial or installment payments'
//       })
//     }

//     // Create booking instance
//     const booking = new Booking({
//       plot_id,
//       customer_id,
//       total_amount,
//       initial_payment,
//       payment_mode,
//       installment_years,
//       booking_status: payment_mode === 'Full' ? 'Sold' : 'Booked'
//     })

//     // Calculate remaining balance
//     booking.remaining_balance =
//       payment_mode === 'Full' ? 0 : total_amount - initial_payment

//     // Save the booking
//     await booking.save()
//     console.log('Booking saved with ID:', booking._id)

//     // Handle financial transactions and installments
//     if (payment_mode === 'Full') {
//       await recordFinancialTransaction(
//         booking,
//         total_amount,
//         'Income',
//         payment_mode
//       )
//     } else if (payment_mode === 'Installment') {
//       await recordFinancialTransaction(
//         booking,
//         initial_payment,
//         'Income',
//         payment_mode
//       )
//       if (installment_years > 0) {
//         const installmentIds = await createInstallments(
//           booking,
//           installment_years,
//           booking.remaining_balance
//         )
//         customer.payments.push(...installmentIds) // Save installments in customer's payments
//         await customer.save()
//       }
//     }

//     // Update plot status based on payment mode
//     const plotUpdateData = {
//       booking_status: 'Booked',
//       customer_id: customer_id,
//       price: total_amount
//     }

//     if (payment_mode === 'Full') {
//       plotUpdateData.status = 'Sold'
//     }
//     if (payment_mode === 'Installment') {
//       plotUpdateData.status = 'Reserved'
//     }

//     const updatedPlot = await Plot.findByIdAndUpdate(plot_id, plotUpdateData, {
//       new: true
//     })

//     if (!updatedPlot) {
//       throw new Error('Plot not found or could not be updated')
//     }

//     // Add sale history to the plot
//     const saleHistoryEntry = {
//       booking_id: booking._id,
//       customer_id: customer_id,
//       sale_date: new Date(),
//       sale_amount: total_amount
//     }

//     updatedPlot.sale_history.push(saleHistoryEntry)
//     await updatedPlot.save()

//     // Respond with created booking details
//     res.status(201).json({
//       message: 'Booking created successfully',
//       booking,
//       updatedPlot
//     })

//     await Notification.create({
//       userId: customer_id, // Send notification to the customer
//       message: `Booking created successfully for Plot #${plot_id}`,
//       type: 'Booking',
//       recipientRole: 'Customer' // Specify the role
//     })

//     await Notification.create({
//       userId: null, // Null for admin notifications
//       message: `New booking created for Plot #${plot_id} by User #${customer_id}.`,
//       type: 'Booking',
//       recipientRole: 'Admin' // Specify the role
//     })
//   } catch (error) {
//     console.error('Error creating booking:', error.message)
//     res.status(500).json({ error: error.message || 'Failed to create booking' })
//   }
// }

exports.createBooking = async (req, res) => {
  try {
    const {
      plot_id,
      customer_id,
      total_amount,
      initial_payment,
      payment_mode,
      installment_years,
    } = req.body;

    console.log("Booking request received with data:", req.body);

    // Validate IDs
    if (
      !mongoose.Types.ObjectId.isValid(plot_id) ||
      !mongoose.Types.ObjectId.isValid(customer_id)
    ) {
      return res
        .status(400)
        .json({ error: "Invalid plot_id or customer_id format" });
    }

    // Check plot existence and availability
    const plot = await Plot.findById(plot_id).populate("society_id");
    if (!plot) {
      return res.status(404).json({ error: "Plot not found" });
    }
    if (plot.booking_status === "Booked" || plot.status === "Sold") {
      return res.status(400).json({ error: "Plot is already booked or sold" });
    }

    // Check if customer exists
    const user = await User.findById(customer_id).populate("customerData");
    const customer = user ? user.customerData : null;

    if (!customer) {
      console.error("Customer not found for ID:", customer_id);
      return res.status(404).json({ error: "Customer not found" });
    }

    // Add plot's society to customer and user if not already added
    const societyId = plot.society_id._id;
    if (!customer.societies.includes(societyId)) {
      customer.societies.push(societyId);
      await customer.save();
    }
    if (!user.societies.includes(societyId)) {
      user.societies.push(societyId);
      await user.save();
    }

    // Add the plot ID to the customer's plots
    customer.plots.push(plot_id);
    await customer.save();

    // Validate initial payment
    if (payment_mode !== "Full" && initial_payment >= total_amount) {
      return res.status(400).json({
        error:
          "Initial payment must be less than the total amount for partial or installment payments",
      });
    }

    // Create booking instance
    const booking = new Booking({
      plot_id,
      customer_id,
      total_amount,
      initial_payment,
      payment_mode,
      installment_years,
      booking_status: payment_mode === "Full" ? "Sold" : "Booked",
    });

    // Calculate remaining balance
    booking.remaining_balance =
      payment_mode === "Full" ? 0 : total_amount - initial_payment;

    // Save the booking
    await booking.save();
    console.log("Booking saved with ID:", booking._id);

    // Handle financial transactions and installments
    if (payment_mode === "Full") {
      await recordFinancialTransaction(
        booking,
        total_amount,
        "Income",
        payment_mode
      );
    } else if (payment_mode === "Installment") {
      await recordFinancialTransaction(
        booking,
        initial_payment,
        "Income",
        payment_mode
      );
      if (installment_years > 0) {
        const installmentIds = await createInstallments(
          booking,
          installment_years,
          booking.remaining_balance
        );
        customer.payments.push(...installmentIds); // Save installments in customer's payments
        await customer.save();
      }
    }

    // Update plot status based on payment mode
    const plotUpdateData = {
      booking_status: "Booked",
      customer_id: customer_id,
      price: total_amount,
    };

    if (payment_mode === "Full") {
      plotUpdateData.status = "Sold";
    }
    if (payment_mode === "Installment") {
      plotUpdateData.status = "Reserved";
    }

    const updatedPlot = await Plot.findByIdAndUpdate(plot_id, plotUpdateData, {
      new: true,
    });

    if (!updatedPlot) {
      throw new Error("Plot not found or could not be updated");
    }

    // Add sale history to the plot
    const saleHistoryEntry = {
      booking_id: booking._id,
      customer_id: customer_id,
      sale_date: new Date(),
      sale_amount: total_amount,
    };

    updatedPlot.sale_history.push(saleHistoryEntry);
    await updatedPlot.save();

    // Respond with created booking details
    res.status(201).json({
      message: "Booking created successfully",
      booking,
      updatedPlot,
    });

    await Notification.create({
      userId: customer_id, // Send notification to the customer
      message: `Booking created successfully for Plot #${plot_id}`,
      type: "Booking",
      recipientRole: "Customer", // Specify the role
    });

    await Notification.create({
      userId: null, // Null for admin notifications
      message: `New booking created for Plot #${plot_id} by User #${customer_id}.`,
      type: "Booking",
      recipientRole: "Admin", // Specify the role
    });
  } catch (error) {
    console.error("Error creating booking:", error.message);
    res
      .status(500)
      .json({ error: error.message || "Failed to create booking" });
  }
};

// Improved createInstallments function
const createInstallments = async (
  booking,
  installment_years,
  remaining_balance
) => {
  const createdInstallments = []; // Array to hold created installment IDs
  try {
    const totalInstallments = installment_years * 12;
    const installmentAmount = remaining_balance / totalInstallments;

    for (let i = 1; i <= totalInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);

      const installment = new Installment({
        booking_id: booking._id,
        customer_id: booking.customer_id,
        plot_id: booking.plot_id,
        due_date: dueDate,
        amount: installmentAmount,
        installment_number: i,
        status: "Pending",
      });

      await installment.save();
      createdInstallments.push(installment._id); // Add the created installment ID to the array
      // console.log(`Installment ${i} created for booking:`, booking._id);
    }
    // console.log(
    //   "All installments created successfully for booking:",
    //   booking._id
    // );
  } catch (error) {
    // console.error("Error creating installments:", error.message);
  }

  return createdInstallments; // Return the array of created installment IDs
};

// Helper function to record a financial transaction
// Refactored recordFinancialTransaction with default transaction type and direction
const recordFinancialTransaction = async (
  transactionData,
  amount,
  transactionDirection = "Income",
  paymentMode = "Installment"
) => {
  if (amount <= 0) return;

  // Fetch plot details to get the society ID
  const plot = await Plot.findById(transactionData.plot_id);
  if (!plot) {
    throw new Error("Plot not found");
  }

  // Extract society ID from plot (assuming the field is named 'society_id')

  const transactionType =
    {
      Full: "Full Payment",
      Partial: "Partial Payment",
      Installment: "Installment Payment",
      "Transfer Fee": "Transfer Fee",
    }[paymentMode] || "Other";

  const transaction = new FinancialTransaction({
    customer_id: transactionData.customer_id,
    plot_id: transactionData.plot_id,
    booking_id: transactionData._id,
    societies: [plot.society_id],
    transaction_date: new Date(),
    amount,
    transaction_type: transactionType,
    transaction_direction: transactionDirection,
    payment_method: transactionData.payment_method || "Bank Transfer",
    status: "Completed",
  });

  // Save the transaction to the database
  const savedTransaction = await transaction.save();

  try {
    // Update society with the transaction
    if (plot.society_id) {
      await Society.updateMany(
        { _id: { $in: [plot.society_id] } }, // Wrap in array if it's a single ID
        { $push: { FinancialTransaction: savedTransaction._id } }
      );
    }
  } catch (updateError) {
    // console.error("Error updating societies:", updateError);
    throw new Error("Failed to update societies with transaction.");
  }

  // console.log("Financial transaction saved:", savedTransaction);
};

// Record an installment payment
exports.payInstallment = async (req, res) => {
  try {
    const { installment_id, payment_amount, receipt_no } = req.body;

    if (!mongoose.Types.ObjectId.isValid(installment_id)) {
      return res.status(400).json({ error: "Invalid installment_id format" });
    }
    if (!receipt_no) {
      return res.status(400).json({ error: "Receipt number is required" });
    }

    let installment = await Installment.findById(installment_id);
    if (!installment) {
      return res.status(404).json({ error: "Installment not found" });
    }

    if (installment.status === "Completed") {
      return res
        .status(400)
        .json({ error: "This installment has already been paid" });
    }

    if (payment_amount <= 0) {
      return res.status(400).json({ error: "Invalid payment amount" });
    }

    // Process payment
    let remainingPayment = payment_amount;
    installment.payment_date = new Date();
    installment.paid_amount = (installment.paid_amount || 0) + remainingPayment;
    installment.receipt_no = receipt_no; // Save receipt number

    if (installment.paid_amount >= installment.amount) {
      remainingPayment = installment.paid_amount - installment.amount;
      installment.status = "Completed";
      installment.remaining_amount = 0;
      installment.paid_amount = installment.amount;
    } else {
      remainingPayment = 0;
      installment.status = "Partially Paid";
      installment.remaining_amount =
        installment.amount - installment.paid_amount;
    }

    await installment.save();

    await recordFinancialTransaction(
      {
        customer_id: installment.customer_id,
        plot_id: installment.plot_id,
        booking_id: installment.booking_id,
        payment_method: "Bank Transfer", // Specify a payment method if needed
        receipt_no: receipt_no, // Pass receipt number
      },
      payment_amount,
      "Income", // Pass 'Income' here as transaction_direction
      "Installment" // Correctly set 'transaction_type' as 'Installment'
    );

    const booking = await Booking.findById(installment.booking_id);
    if (booking) {
      booking.total_paid = (booking.total_paid || 0) + payment_amount;
      await booking.save();
    }

    // Check if all installments are paid
    const allInstallments = await Installment.find({
      booking_id: installment.booking_id,
    });

    const allPaid = allInstallments.every(
      (inst) => inst.status === "Completed"
    );

    if (allPaid) {
      // Update the plot status to "Sold" and add the plot to the customer's plots
      const plot = await Plot.findById(installment.plot_id);
      if (plot) {
        plot.status = "Sold";
        await plot.save();

        // Update the customer schema to include this plot
        const customer = await Customer.findById(installment.customer_id);
        if (customer) {
          customer.plots.push(plot_id); // Add the plot ID to the customer's plots

          // Add society ID to the customer's societies if not already present
          if (
            plot.society_id &&
            !customer.societies.includes(plot.society_id._id)
          ) {
            customer.societies.push(plot.society_id._id);
          }

          await customer.save(); // Save the updated customer
        } else {
          // console.error("Customer not found for ID:", customer_id);
          return res.status(404).json({ error: "Customer not found" });
        }
      }
    }

    if (remainingPayment > 0) {
      const pendingInstallments = await Installment.find({
        booking_id: installment.booking_id,
        status: "Pending",
      });

      for (let nextInstallment of pendingInstallments) {
        if (remainingPayment <= 0) break;

        nextInstallment.paid_amount =
          (nextInstallment.paid_amount || 0) + remainingPayment;

        if (nextInstallment.paid_amount >= nextInstallment.amount) {
          remainingPayment =
            nextInstallment.paid_amount - nextInstallment.amount;
          nextInstallment.status = "Completed";
          nextInstallment.remaining_amount = 0;
          nextInstallment.paid_amount = nextInstallment.amount;
        } else {
          nextInstallment.status = "Partially Paid";
          nextInstallment.remaining_amount =
            nextInstallment.amount - nextInstallment.paid_amount;
          remainingPayment = 0;
        }

        await nextInstallment.save();
      }

      if (remainingPayment > 0) {
        // console.log("Excess payment detected:", remainingPayment);
        // Optional: handle excess, e.g., refund or credit for future installments
      }
    }

    res.status(200).json({
      message: "Installment payment successful",
      installment,
    });
    await Notification.create({
      userId: installment.customer_id,
      message: `Your installment for Plot #${installment.plot_id} has been paid.`,
      type: "Payment",
      recipientRole: "Customer", // Specify the role
    });

    await Notification.create({
      userId: null, // Null for admin notifications
      message: `Installment payment received for Plot #${installment.plot_id}.`,
      type: "Payment",
      recipientRole: "Admin", // Specify the role
    });
  } catch (error) {
    console.error("Error paying installment:", error);
    res.status(500).json({ error: "Failed to pay installment" });
  }
};
exports.getPaidInstallmentsForUser = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({ error: "Invalid customer_id format" });
    }

    // Fetch only completed (paid) installments for the customer
    const installments = await Installment.find({
      customer_id,
      status: "Completed",
    }).populate("plot_id");

    res.json({ installments });
  } catch (error) {
    // console.error("Error fetching paid installments for user:", error);
    res.status(500).json({ error: "Failed to fetch paid installments" });
  }
};
exports.getInstallmentsForUser = async (req, res) => {
  try {
    const { customer_id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(customer_id)) {
      return res.status(400).json({ error: "Invalid customer_id format" });
    }

    // Fetch all installments for the customer and populate the plot_id
    const installments = await Installment.find({ customer_id }).populate(
      "plot_id"
    ); // Ensure this line correctly populates plot_id

    // console.log("Fetched installments:", installments); // Log installments for debugging

    res.json({ installments });
  } catch (error) {
    console.error("Error fetching installments for user:", error);
    res.status(500).json({ error: "Failed to fetch installments" });
  }
};

exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("plot_id")
      .populate({
        path: "customer_id",
        populate: {
          path: "_id",
          model: "User",
          select: "username",
        },
      });

    res.json({ bookings });
  } catch (error) {
    console.error("Error fetching all bookings:", error.message);
    res.status(500).json({ error: "Failed to fetch bookings" });
  }
};

// Get a booking by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("plot_id")
      .populate("customer_id");

    if (!booking) {
      // console.log("Booking not found for ID:", req.params.id);
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({ booking });
  } catch (error) {
    console.error("Error fetching booking:", error.message);
    res.status(500).json({ error: "Failed to fetch booking" });
  }
};

// Update booking status
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { booking_status } = req.body;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { booking_status },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message: "Booking status updated successfully",
      booking,
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    res.status(500).json({ error: "Failed to update booking status" });
  }
};

// Delete a booking (Soft delete)
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdAndUpdate(
      id,
      { deleted_at: new Date() },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ error: "Booking not found" });
    }

    res.json({
      message: "Booking deleted successfully",
      booking,
    });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Failed to delete booking" });
  }
};

// exports.getInstallmentsByPlotId = async (req, res) => {
//   try {
//     const { plot_id } = req.params
//     if (!mongoose.Types.ObjectId.isValid(plot_id)) {
//       return res.status(400).json({ error: 'Invalid plot_id format' })
//     }

//     const installments = await Installment.find({ plot_id })
//     res.json({ installments })
//   } catch (error) {
//     console.error('Error fetching installments by plot_id:', error)
//     res.status(500).json({ error: 'Failed to fetch installments' })
//   }
// }

exports.getInstallmentsByPlotId = async (req, res) => {
  try {
    const { plot_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(plot_id)) {
      return res.status(400).json({ error: "Invalid plot_id format" });
    }

    // Find installments and populate the customer details
    const installments = await Installment.find({ plot_id }).populate({
      path: "customer_id", // Reference to the Customer model
      select: "name contactInfo.phone contactInfo.address contactInfo.cnic ", // Select specific fields to return
    });

    res.json({ installments });
  } catch (error) {
    console.error("Error fetching installments by plot_id:", error);
    res.status(500).json({ error: "Failed to fetch installments" });
  }
};

exports.getRemainingBalanceByPlotId = async (req, res) => {
  try {
    const { plot_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(plot_id)) {
      return res.status(400).json({ error: "Invalid plot_id format" });
    }

    const installments = await Installment.find({ plot_id });
    const remainingBalance = installments.reduce((total, installment) => {
      return total + (installment.remaining_amount || 0);
    }, 0);

    res.json({ remainingBalance });
  } catch (error) {
    console.error("Error calculating remaining balance for plot_id:", error);
    res.status(500).json({ error: "Failed to calculate remaining balance" });
  }
};
exports.getInstallmentsByPlotIdAndStatus = async (req, res) => {
  try {
    const { plot_id, status } = req.params;
    if (!mongoose.Types.ObjectId.isValid(plot_id)) {
      return res.status(400).json({ error: "Invalid plot_id format" });
    }

    const installments = await Installment.find({ plot_id, status });
    res.json({ installments });
  } catch (error) {
    console.error("Error fetching installments by plot_id and status:", error);
    res.status(500).json({ error: "Failed to fetch installments by status" });
  }
};
