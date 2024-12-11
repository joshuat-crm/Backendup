const Agreement = require("../models/Agreement");
const Plot = require("../models/Plot");
const Society = require("../models/Society");

const createAgreement = async (req, res) => {
  try {
    const {
      plotNumber,
      date,
      name,
      fatherName,
      mobileNumber,
      permanentAddress,
      cnicNumber,
      nomineeName,
      nomineeRelation,
      societyId,
    } = req.body;

    // Find the plot by plot number and society ID
    const plot = await Plot.findOne({
      plot_number: plotNumber,
      society_id: societyId,
    });

    // Check if plot exists
    if (!plot) {
      return res
        .status(404)
        .json({ message: "Plot not found in the specified society." });
    }

    // If the plot is reserved or booked, allow creating an agreement
    // If the plot is available, update booking status to "Booked"
    if (plot.booking_status === "Available") {
      plot.booking_status = "Booked";
      plot.customer_id = req.user._id; // Assign customer (buyer)
    }

    // Create a new agreement object
    const newAgreement = new Agreement({
      plotNumber,
      date,
      buyer: {
        name,
        fatherName,
        mobileNumber,
        permanentAddress,
        cnicNumber,
      },
      nominee: {
        name: nomineeName,
        relation: nomineeRelation,
      },
      plot: plot._id,
      society: societyId,
      created_by: req.user._id, // Assuming `req.user` contains the authenticated user
    });

    // Save the new agreement and updated plot status
    await newAgreement.save();
    await plot.save(); // Save the plot with the updated booking status

    // Return success response with agreement details and plot info
    res.status(201).json({
      message: "Agreement created successfully.",
      agreement: newAgreement,
      plotId: plot._id,
      plotNumber: plot.plot_number,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "An error occurred while creating the agreement." });
  }
};

module.exports = { createAgreement };
