const Plot = require("../models/Plot");
const User = require("../models/User");
const Society = require("../models/Society");
const Booking = require("../models/Booking");

const plotController = {
  // Get all plots
  getAllPlots: async (req, res) => {
    try {
      const plots = await Plot.find().populate("society_id customer_id");
      res.status(200).json(plots);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Get plot by ID
  getPlotById: async (req, res) => {
    try {
      const plot = await Plot.findById(req.params.id).populate(
        "society_id customer_id"
      );
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }
      res.status(200).json(plot);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Create a new plot
  createPlot: async (req, res) => {
    try {
      const {
        society_id,
        plot_number,
        type,
        size,
        street,
        status,
        price,
        booking_status,
        customer_id,
      } = req.body;

      // Validate request body
      if (!society_id || !plot_number || !type || !size || !status || !price) {
        return res
          .status(400)
          .json({ message: "All required fields must be provided" });
      }

      // Create new plot in database
      const newPlot = new Plot({
        society_id,
        plot_number,
        type,
        size,
        street,
        status,
        price,
        booking_status,
        customer_id,
      });
      await newPlot.save();

      res
        .status(201)
        .json({ message: "Plot created successfully", plot: newPlot });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Update plot by ID
  updatePlot: async (req, res) => {
    try {
      const {
        society_id,
        plot_number,
        type,
        size,
        street,
        status,
        price,
        booking_status,
        customer_id,
      } = req.body;

      // Validate request body
      if (!society_id || !plot_number || !type || !size || !status || !price) {
        return res
          .status(400)
          .json({ message: "All required fields must be provided" });
      }

      // Find plot by ID
      const plot = await Plot.findById(req.params.id);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }

      // Update plot details
      plot.society_id = society_id;
      plot.plot_number = plot_number;
      plot.type = type;
      plot.size = size;
      plot.street = street;
      plot.status = status;
      plot.price = price;
      plot.booking_status = booking_status;
      plot.customer_id = customer_id;
      await plot.save();

      res.status(200).json({ message: "Plot updated successfully", plot });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Delete plot by ID (soft delete)
  deletePlot: async (req, res) => {
    try {
      // Find plot by ID
      const plot = await Plot.findById(req.params.id);
      if (!plot) {
        return res.status(404).json({ message: "Plot not found" });
      }

      // Soft delete (mark as deleted)
      plot.deleted_at = new Date();
      await plot.save();

      res.status(200).json({ message: "Plot deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Book a plot
//  bookPlot :async (req, res) => {
//     try {
//       const { plot_id, customer_id, payment_mode, installment_plan } = req.body;
  
//       if (!plot_id || !customer_id || !payment_mode) {
//         return res.status(400).json({ message: "Required fields missing" });
//       }
  
//       const plot = await Plot.findById(plot_id);
//       if (!plot || plot.booking_status !== "Available") {
//         return res.status(400).json({ message: "Plot is not available" });
//       }
  
//       // Full payment handling
//       if (payment_mode === "Full") {
//         plot.booking_status = "Booked";
//         plot.status = "Sold";
//         plot.customer_id = customer_id;
//         plot.payment_mode = "Full";
//       }
  
//       // Installment payment handling
//       else if (payment_mode === "Installment") {
//         if (!installment_plan) {
//           return res.status(400).json({ message: "Installment plan is required" });
//         }
  
//         // Link installment plan to plot
//         plot.booking_status = "Booked";
//         plot.status = "Reserved";
//         plot.customer_id = customer_id;
//         plot.payment_mode = "Installment";
//         plot.installments.push(installment_plan);
//       }
  
//       await plot.save();
//       res.status(200).json({ message: "Plot booking updated successfully", plot });
  
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ message: "Server error", error });
//     }
//   },  

createBooking : async (req, res) => {
  try {
    const { plot_id, customer_id, booking_amount, initial_payment, payment_mode, installment_years } = req.body;

    // Calculate remaining balance
    const remaining_balance = payment_mode === "Full" ? 0 : booking_amount - initial_payment;

    // Create booking object
    const booking = new Booking({
      plot_id,
      customer_id,
      booking_amount,
      initial_payment,
      remaining_balance,
      installment_years,
      payment_mode,
      booking_status: "Pending",
    });

    // Save booking and handle installments if needed
    await booking.save();

    // Record the initial payment as a financial transaction if there is an initial payment
    if (initial_payment > 0) {
      const transaction = new FinancialTransaction({
        customer_id,
        plot_id,
        booking_id: booking._id,
        transaction_date: new Date(),
        amount: initial_payment,
        transaction_type: "Booking Payment",
        payment_method: "Bank Transfer", // or use as per requirement
        status: "Completed",
      });
      await transaction.save();
    }

    // Handle installments for "Installment" and "Partial" payment modes
    if (payment_mode !== "Full") {
      const installmentAmount = remaining_balance / (installment_years * 12); // Monthly installments

      for (let i = 1; i <= installment_years * 12; i++) {
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + i);

        const installment = new Installment({
          booking_id: booking._id,
          customer_id,
          due_date: dueDate,
          amount: installmentAmount,
          installment_number: i,
          status: "Pending",
        });

        await installment.save();
      }
    }

    res.status(201).json({
      message: "Booking created successfully",
      booking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
},

  // Hold a plot
  holdPlot: async (req, res) => {
    try {
      const { plot_id } = req.body;

      // Validate request body
      if (!plot_id) {
        return res.status(400).json({ message: "Plot ID is required" });
      }

      // Find plot by ID
      const plot = await Plot.findById(plot_id);
      if (!plot || plot.booking_status !== "available") {
        return res
          .status(400)
          .json({ message: "Plot is not available for holding" });
      }

      // Update plot booking status
      plot.booking_status = "hold";
      await plot.save();

      res.status(200).json({ message: "Plot held successfully", plot });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Release a plot
  releasePlot: async (req, res) => {
    try {
      const { plot_id } = req.body;

      // Validate request body
      if (!plot_id) {
        return res.status(400).json({ message: "Plot ID is required" });
      }

      // Find plot by ID
      const plot = await Plot.findById(plot_id);
      if (!plot || plot.booking_status !== "hold") {
        return res.status(400).json({ message: "Plot is not currently held" });
      }

      // Update plot booking status
      plot.booking_status = "available";
      await plot.save();

      res.status(200).json({ message: "Plot released successfully", plot });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Bulk add plots to a society
  addBulkPlots: async (req, res) => {
    try {
      const { society_id, plots } = req.body;

      // Check if the society exists
      const society = await Society.findById(society_id);
      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      // Add bulk plots to the society
      const newPlots = plots.map((plot) => ({
        society_id: society._id,
        plot_number: plot.plot_number,
        plot_type: plot.plot_type,
        street: plot.street,
        size: plot.size,
        category: plot.category,
        price: plot.price,
      }));

      const savedPlots = await Plot.insertMany(newPlots);
      society.plots.push(...savedPlots.map((p) => p._id));
      await society.save();

      res
        .status(201)
        .json({ message: "Bulk plots added successfully", plots: savedPlots });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error adding bulk plots", error: error.message });
    }
  },

  // Add a single plot to a society
  addSinglePlot: async (req, res) => {
    try {
      const { society_id, plot } = req.body;

      // Check if the society exists
      const society = await Society.findById(society_id);
      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      // Add the single plot to the society
      const newPlot = new Plot({
        society_id: society._id,
        plot_number: plot.plot_number,
        plot_type: plot.plot_type,
        street: plot.street,
        size: plot.size,
        category: plot.category,
        price: plot.price,
      });

      await newPlot.save();
      society.plots.push(newPlot._id);
      await society.save();

      res
        .status(201)
        .json({ message: "Plot added successfully", plot: newPlot });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Error adding plot", error: error.message });
    }
  },
};

module.exports = plotController;
