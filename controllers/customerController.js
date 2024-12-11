const mongoose = require("mongoose");

const Customer = require("../models/Customer");

const customerController = {
  // Get a customer by ID (for logged-in users)
  getCustomerById: async (req, res) => {
    try {
      const customerId = req.user.id; // Assuming JWT middleware sets `req.user`
      const customer = await Customer.findById(customerId)
        .populate("societies")
        .populate("plots")
        .populate("payments");

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.status(200).json(customer);
    } catch (error) {
      console.error("Error fetching customer by ID:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  },

  // Update customer information (Admin only)
  updateCustomer: async (req, res) => {
    try {
      const customerId = req.params.id;

      // Validate customerId
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const { name, contactInfo, status } = req.body; // Add status to request body for admins
      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Update customer fields
      customer.name = name || customer.name;
      if (contactInfo) {
        customer.contactInfo = {
          phone: contactInfo.phone || customer.contactInfo.phone,
          email: contactInfo.email || customer.contactInfo.email,
          cnic: contactInfo.cnic || customer.contactInfo.cnic,
        };
      }

      // Update status only if provided and valid
      if (status && ["active", "inactive"].includes(status)) {
        customer.status = status;
      }

      await customer.save();
      res
        .status(200)
        .json({ message: "Customer updated successfully", customer });
    } catch (error) {
      console.error("Error updating customer:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  },

  // Customer updates their own information
  updateOwnInfo: async (req, res) => {
    try {
      const customerId = req.user.id;

      // Validate customerId
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID" });
      }

      const { name, contactInfo } = req.body;
      const customer = await Customer.findById(customerId);

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // Update only the allowed fields
      customer.name = name || customer.name;
      if (contactInfo) {
        customer.contactInfo = {
          phone: contactInfo.phone || customer.contactInfo.phone,
          email: contactInfo.email || customer.contactInfo.email,
          cnic: contactInfo.cnic || customer.contactInfo.cnic,
        };
      }

      await customer.save();
      res.status(200).json({
        message: "Your information has been updated successfully.",
        customer,
      });
    } catch (error) {
      console.error("Error updating own information:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  },

  // Get customer plots with authorization check

  getCustomerPlots: async (req, res) => {
    try {
      const customerDataId = req.params.id; // This should be the customerData ID from the User document
      const userRole = req.user.role.toLowerCase(); // Use lowercase to avoid case issues

      // Check if the user is authorized (admin or owns the customerData ID)
      // if (
      //   userRole !== "admin" &&
      //   !req.user.customerData.equals(customerDataId)
      // ) {
      //   return res.status(403).json({ message: "Unauthorized access" });
      // }

      // Find the customer by the customerData ID and populate plots
      const customer = await Customer.findById(customerDataId).populate(
        "plots"
      );
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      // console.log("Retrieved customer plots:", customer.plots); // Log plots array
      res.status(200).json({ plots: customer.plots });
    } catch (error) {
      console.error("Error fetching customer plots:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later.", error });
    }
  },

  // View payment history for the customer
  getCustomerPayments: async (req, res) => {
    try {
      const customerId = req.user.id; // Assuming JWT middleware sets `req.user`
      const customer = await Customer.findById(customerId).populate("payments");

      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.status(200).json({ payments: customer.payments });
    } catch (error) {
      console.error("Error fetching customer payments:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  },

  // Retrieve customer interactions with the society
  getCustomerInteractions: async (req, res) => {
    try {
      const customerId = req.user.id; // Assuming JWT middleware sets `req.user`

      const interactions = await Interaction.find({ customer: customerId })
        .populate("society")
        .populate("messageHistory"); // Assuming messageHistory is a field in Interaction

      if (!interactions || interactions.length === 0) {
        return res
          .status(404)
          .json({ message: "No interactions found for this customer." });
      }

      res.status(200).json({ interactions });
    } catch (error) {
      console.error("Error fetching customer interactions:", error);
      res
        .status(500)
        .json({ message: "Server error. Please try again later." });
    }
  },
};

module.exports = customerController;
