const Society = require("../models/Society");
const Plot = require("../models/Plot");
const Employee = require("../models/Employee");
const FinancialTransaction = require("../models/FinancialTransaction");
const User = require("../models/User");
const mongoose = require("mongoose");
const Notification = require("../models/Notification");
// Helper function to validate MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const nodemailer = require("nodemailer");
const { v4: uuidv4 } = require("uuid");
require("dotenv").config();
const baseURL = process.env.BASE_URL || `http://${req.hostname}:5000`;

// Temporary storage for approvals (use a database in production)
const deleteRequests = new Map();

const emailRecipient = "razakazmi854@gmail.com";

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "mongodbjosh@gmail.com",
    pass: "ffwvmlzbufjaffhc",
  },
});

const convertRangeToArray = (range) => {
  const [start, end] = range.split("-").map(Number);

  if (!isNaN(start) && isNaN(end)) {
    return [start.toString()];
  }
  if (!isNaN(start) && !isNaN(end) && start <= end) {
    return Array.from({ length: end - start + 1 }, (_, i) =>
      (start + i).toString()
    );
  }

  return []; // Return an empty array if invalid input
};

const societyController = {
  createSociety: async (req, res) => {
    try {
      const { name, location, society_image, plots, created_by } = req.body;

      // Create the society
      const society = new Society({
        name,
        location,
        society_image,
        created_by,
      });
      await society.save();

      if (plots && plots.length > 0) {
        const plotEntries = plots.flatMap((plot) => {
          const plotNumbers = convertRangeToArray(plot.plot_number.trim());
          return plotNumbers.map((plotNumber) => ({
            society_id: society._id,
            plot_number: plotNumber.toString(),
            plot_type: plot.plot_type,
            block: plot.block,
            size: plot.size,
            category: plot.category,
            price: plot.price,
            booking_status: plot.booking_status || "Available",
            status: plot.status || "Available",
          }));
        });

        // Save the plots in the database
        const savedPlots = await Plot.insertMany(plotEntries);

        // Add plot references to society document
        society.plots = savedPlots.map((plot) => plot._id);
        await society.save(); // Update society with plot references
      }
      // Send notification about society creation
      await Notification.create({
        userId: null, // Admin notifications
        message: `A new society named "${name}" has been successfully created at location "${location}".`,
        type: "Society Creation",
        recipientRole: "Admin", // Specify the role
      });
      res.status(201).json({
        message: "Society created successfully with plots",
        society,
      });
    } catch (error) {
      console.error("Error creating society:", error);
      res
        .status(500)
        .json({ message: `Error creating society: ${error.message}` });
    }
  },

  // Ensure the `plots` field is populated with the specified fields.
  // getAllSocieties: async (req, res) => {
  //   try {
  //     const societies = await Society.find({ deleted_at: null })
  //       .populate({
  //         path: 'plots',
  //         model: 'Plot', // Specify the Plot model
  //         select:
  //           'plot_number plot_type block category booking_status size status'
  //       })
  //       .populate('FinancialTransaction')
  //       .populate('users')
  //       .populate('created_by', '-password')

  //     if (!societies || societies.length === 0) {
  //       return res.status(404).json({ message: 'No societies found' })
  //     }

  //     return res.status(200).json({ societies })
  //   } catch (error) {
  //     console.error('Get All Societies Error:', error)
  //     return res
  //       .status(500)
  //       .json({ message: 'Error retrieving societies', error: error.message })
  //   }
  // },

  getAllSocieties: async (req, res) => {
    try {
      const societies = await Society.find({ deleted_at: null })
        .populate({
          path: "plots",
          model: "Plot",
          select:
            "plot_number plot_type block category booking_status size status",
        })
        .populate({
          path: "FinancialTransaction",
          model: "FinancialTransaction",
          select: "transaction_date amount transaction_type status",
        })
        .populate({
          path: "users",
          model: "User",
          select: "username role profile_picture status",
        })
        .populate({
          path: "created_by",
          model: "User",
          select: "username role",
        });

      if (!societies || societies.length === 0) {
        return res.status(404).json({ message: "No societies found" });
      }

      return res.status(200).json({ societies });
    } catch (error) {
      console.error("Error retrieving societies:", error);
      return res.status(500).json({
        message: "Error retrieving societies",
        error: error.message,
      });
    }
  },

  getSocietyById: async (req, res) => {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid society ID format" });
      }

      const society = await Society.findOne({
        _id: id,
        deleted_at: null,
      })
        .populate("plots")
        .populate("FinancialTransaction")
        .populate("users")
        .populate("created_by", "-password");

      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      return res.status(200).json({ society });
    } catch (error) {
      console.error("Get Society By ID Error:", error);
      return res
        .status(500)
        .json({ message: "Error retrieving society", error: error.message });
    }
  },
  getSocietyByName: async (req, res) => {
    try {
      const { name } = req.params;

      // Input validation
      if (typeof name !== "string" || name.length < 1 || name.length > 100) {
        return res.status(400).json({ message: "Invalid society name" });
      }

      const escapedName = escapeRegExp(name); // Escape special characters
      const society = await Society.findOne({
        name: new RegExp(escapedName, "i"),
      })
        .populate("plots")
        .populate("FinancialTransaction")
        .populate("users")
        .populate("created_by", "-password");

      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      res.status(200).json({ society });
    } catch (error) {
      console.error("Get Society By Name Error:", error);
      res.status(500).json({
        message: "Error retrieving society",
        error: error.message,
      });
    }
  },

  updateSociety: async (req, res) => {
    try {
      const { id } = req.params; // Society ID
      const { plots, ...updateData } = req.body;

      // Validate society ID
      if (!isValidObjectId(id)) {
        return res.status(400).json({ message: "Invalid society ID format" });
      }

      // Check if society with this name already exists
      if (updateData.name) {
        const existingSociety = await Society.findOne({
          name: updateData.name,
          _id: { $ne: id },
          deleted_at: null,
        });

        if (existingSociety) {
          return res
            .status(400)
            .json({ message: "Society with this name already exists" });
        }
      }

      // Find the society by ID
      const society = await Society.findById(id);
      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      // Update society fields (excluding plots)
      Object.assign(society, updateData);

      // Handle the plots update
      if (plots && Array.isArray(plots)) {
        for (let plot of plots) {
          if (plot._id && isValidObjectId(plot._id)) {
            // Update existing plot
            const existingPlot = await Plot.findById(plot._id);
            if (existingPlot) {
              Object.assign(existingPlot, plot);
              await existingPlot.save(); // Save updated plot
            }
          } else {
            // Add new plot to the society
            const newPlot = new Plot({
              society_id: society._id,
              plot_number: plot.plot_number,
              plot_type: plot.plot_type,
              block: plot.block,
              size: plot.size,
              category: plot.category,
              price: plot.price,
              booking_status: plot.booking_status || "Available",
            });

            await newPlot.save(); // Save new plot
            society.plots.push(newPlot._id); // Add reference to new plot
          }
        }
      }

      // Save the updated society
      await society.save();

      return res
        .status(200)
        .json({ message: "Society updated successfully", society });
    } catch (error) {
      console.error("Update Society Error:", error);
      return res
        .status(500)
        .json({ message: "Error updating society", error: error.message });
    }
  },

  removeUserFromSociety: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { society_id, user_id } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(society_id) ||
        !mongoose.Types.ObjectId.isValid(user_id)
      ) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const society = await Society.findOne({ _id: society_id }).session(
        session
      );

      if (!society) {
        await session.abortTransaction();
        return res.status(404).json({ message: "Society not found" });
      }

      // Check if the user is part of the society
      const userIndex = society.users.indexOf(user_id);
      if (userIndex === -1) {
        await session.abortTransaction();
        return res.status(404).json({ message: "User not found in society" });
      }

      // Remove user from society
      society.users.splice(userIndex, 1);
      await society.save({ session });

      // Optionally, you can remove the society reference from the user
      await User.findByIdAndUpdate(
        user_id,
        { $pull: { societies: society_id } },
        { session }
      );

      await session.commitTransaction();

      res.status(200).json({
        message: "User removed from society successfully",
        society,
      });
    } catch (error) {
      await session.abortTransaction();
      console.error("Remove User Error:", error);
      res.status(500).json({
        message: "Error removing user from society",
        error: error.message,
      });
    } finally {
      session.endSession();
    }
  },
  removePlotFromSociety: async (req, res) => {
    const { society_id, plot_id } = req.params;

    try {
      // Check if parameters are missing
      if (!society_id || !plot_id) {
        return res
          .status(400)
          .json({ error: "society_id or plot_id is missing" });
      }

      // Ensure the society exists
      const society = await Society.findById(society_id);
      if (!society) {
        return res.status(404).json({ error: "Society not found" });
      }

      // Ensure the plot exists in the society
      const plotIndex = society.plots.indexOf(plot_id);
      if (plotIndex === -1) {
        return res
          .status(404)
          .json({ error: "Plot not found in this society" });
      }

      // Remove the plot reference from the society
      society.plots.splice(plotIndex, 1);
      await society.save();

      // Delete the plot from the Plot collection
      await Plot.findByIdAndDelete(plot_id);

      return res
        .status(200)
        .json({ message: "Plot removed from society and deleted", society });
    } catch (error) {
      console.error("Error removing plot:", error);
      return res.status(500).json({
        error: "Error removing plot from society",
        details: error.message,
      });
    }
  },

  editPlotFromSociety: async (req, res) => {
    const { society_id, plot_id } = req.params;
    const {
      plot_number,
      plot_type,
      block,
      size,
      category,
      booking_status,
      price,
    } = req.body;

    try {
      // Validate society and plot IDs
      if (!society_id || !plot_id) {
        return res
          .status(400)
          .json({ error: "society_id or plot_id is missing" });
      }

      // Ensure the society exists
      const society = await Society.findById(society_id);
      if (!society) {
        return res.status(404).json({ error: "Society not found" });
      }

      // Ensure the plot exists in the society
      const plot = await Plot.findOne({ _id: plot_id, society_id });
      if (!plot) {
        return res
          .status(404)
          .json({ error: "Plot not found in this society" });
      }

      // Update plot details with provided values
      if (plot_number) plot.plot_number = plot_number;
      if (plot_type) plot.plot_type = plot_type;
      if (block) plot.block = block;
      if (size) plot.size = size;
      if (category) plot.category = category;
      if (booking_status) plot.booking_status = booking_status;
      if (price) plot.price = price;

      // Save the updated plot
      await plot.save();

      return res.status(200).json({
        message: "Plot updated successfully within the society",
        plot,
      });
    } catch (error) {
      console.error("Error editing plot:", error);
      return res.status(500).json({
        error: "Error updating plot in society",
        details: error.message,
      });
    }
  },

  deleteSociety: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid society ID format" });
      }

      // Find the society and ensure it exists
      const society = await Society.findOne({ _id: id });

      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      // Permanently delete the society
      await Society.deleteOne({ _id: id });

      // Permanently delete associated plots
      await Plot.deleteMany({ society_id: id });

      // Permanently delete associated financial records
      await FinancialTransaction.deleteMany({ society_id: id });

      // Remove society reference from associated users
      await User.updateMany({ societies: id }, { $pull: { societies: id } });

      res.status(200).json({
        success: true,
        message: "Society and all associated data deleted successfully",
      });
    } catch (error) {
      console.error("Delete Society Error:", error);
      res.status(500).json({
        success: false,
        message: "Error deleting society",
        error: error.message,
      });
    }
  },

  // deleteSociety: async (req, res) => {
  //   try {
  //     const { id } = req.params;

  //     if (!mongoose.Types.ObjectId.isValid(id)) {
  //       return res.status(400).json({ message: "Invalid society ID format" });
  //     }

  //     // Find the society
  //     const society = await Society.findById(id);
  //     if (!society) {
  //       return res.status(404).json({ message: "Society not found" });
  //     }

  //     // Generate a unique approval token
  //     const approvalToken = uuidv4();

  //     // Save the delete request in temporary storage with creation time
  //     deleteRequests.set(approvalToken, {
  //       id,
  //       societyName: society.name,
  //       createdAt: new Date(), // Store the time the token was created
  //     });
  //     // console.log(deleteRequests); // Log the map content to verify

  //     // Send email to the admin for approval
  //     await transporter.sendMail({
  //       from: process.env.EMAIL_FROM,
  //       to: emailRecipient,
  //       subject: "Society Deletion Approval Required",
  //       text: `A request has been made to delete the society "${society.name}".
  //       Please approve or reject the request using the following links:
  //       Approve: ${baseURL}/api/societies/approve/${approvalToken}?decision=approve
  //       Reject: ${baseURL}/api/societies/reject/${approvalToken}?decision=reject`,
  //     });

  //     res.status(200).json({
  //       message: "Deletion request sent for approval. Awaiting admin response.",
  //     });
  //   } catch (error) {
  //     console.error("Delete Society Error:", error);
  //     res.status(500).json({ message: "Error initiating society deletion" });
  //   }
  // },

  // Approve or Reject Society Deletion
  // Approve or Reject Society Deletion

  deleteSociety: async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid society ID format" });
      }

      // Find the society
      const society = await Society.findById(id);
      if (!society) {
        return res.status(404).json({ message: "Society not found" });
      }

      // Generate a unique approval token
      const approvalToken = uuidv4();

      // Save the delete request in temporary storage with creation time
      deleteRequests.set(approvalToken, {
        id,
        societyName: society.name,
        createdAt: new Date(), // Store the time the token was created
      });

      // Construct email content
      const emailContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #555;">Society Deletion Approval Required</h2>
          <p>A request has been made to delete the society <strong>${society.name}</strong>.</p>
          <p>Please approve or reject the request using the buttons below:</p>
          <div style="margin: 20px 0;">
            <a href="${baseURL}/api/societies/approve/${approvalToken}?decision=approve" 
               style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #4CAF50; text-decoration: none; border-radius: 5px;">
              Approve
            </a>
            <a href="${baseURL}/api/societies/reject/${approvalToken}?decision=reject" 
               style="display: inline-block; padding: 10px 20px; color: #fff; background-color: #F44336; text-decoration: none; border-radius: 5px; margin-left: 10px;">
              Reject
            </a>
          </div>
          <p>If you have any questions, please contact support.</p>
          <p style="color: #888; font-size: 12px;">This email was sent automatically. Please do not reply.</p>
        </div>
      `;

      // Send email to the admin for approval
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: emailRecipient,
        subject: "Society Deletion Approval Required",
        html: emailContent, // Use HTML for better UI
      });

      res.status(200).json({
        message: "Deletion request sent for approval. Awaiting admin response.",
      });
    } catch (error) {
      console.error("Delete Society Error:", error);
      res.status(500).json({ message: "Error initiating society deletion" });
    }
  },
  handleDeletionApproval: async (req, res) => {
    try {
      const { token } = req.params;
      const { decision } = req.query;

      if (!deleteRequests.has(token)) {
        return res.status(404).json({ message: "Invalid or expired token" });
      }

      const storedRequest = deleteRequests.get(token);
      const expiryTime = 60 * 60 * 1000; // 1 hour expiration time (in milliseconds)

      // Check if the token has expired
      if (new Date() - storedRequest.createdAt > expiryTime) {
        // If expired, delete the request and return an error
        deleteRequests.delete(token);
        return res.status(400).json({ message: "Token has expired" });
      }

      // Proceed with approval or rejection if token is valid and not expired
      const { id, societyName } = storedRequest;

      if (decision === "approve") {
        // Delete the society and associated data
        await Society.deleteOne({ _id: id });
        await Plot.deleteMany({ society_id: id });
        await FinancialTransaction.deleteMany({ society_id: id });
        await User.updateMany({ societies: id }, { $pull: { societies: id } });

        // Notify admin of success
        deleteRequests.delete(token);
        return res
          .status(200)
          .json({ message: `Society "${societyName}" deleted successfully` });
      } else if (decision === "reject") {
        // Reject the deletion request
        deleteRequests.delete(token);
        return res.status(200).json({
          message: `Society "${societyName}" deletion request rejected`,
        });
      } else {
        return res.status(400).json({ message: "Invalid decision" });
      }
    } catch (error) {
      console.error("Handle Deletion Approval Error:", error);
      res.status(500).json({ message: "Error handling deletion approval" });
    }
  },
};

module.exports = societyController;
