const mongoose = require("mongoose");
const User = require("../models/User");
const Investor = require("../models/Investor");
const Employee = require("../models/Employee");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

const userController = {
  getAllUsers: async (req, res) => {
    try {
      const users = await User.find()
        .populate({
          path: "societies", // Populate societies reference
          select: "name", // Only retrieve the name field of each society
        })
        .populate({
          path: "customerData",
          populate: {
            path: "plots",
            select: "plotNumber size category status", // Customize fields as needed
          },
        })
        .populate({
          path: "employeeData",
          select:
            "name designation salaryDetails personalDetails active status", // Customize fields for employeeData
        })
        .populate({
          path: "adminData",
          select: "name contactInfo ", // Customize fields for employeeData
        })
        .populate({
          path: "investorData",
          select: "investmentAmount profitPercentage name contactInfo status", // Customize fields for investorData
        });
      // .select("-password"); // Exclude password for security

      res.status(200).json(users);
    } catch (error) {
      console.error("Error retrieving users:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Get user by ID
  getUserById: async (req, res) => {
    try {
      let userId = req.params.id;
      if (userId === "me") {
        userId = req.user.id; // Use the logged-in user's ID from req.user
      }

      const user = await User.findById(userId)
        .populate("societies")
        .populate({
          path: "customerData",
          populate: { path: "plots" }, // Populate plots within customerData
        })
        .select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json(user);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  updateUser: async (req, res) => {
    try {
      const updates = {};
      const {
        username,
        profile_picture,
        societies,
        status,
        role,
        customerData,
        employeeData,
        adminData,
        investorData,
      } = req.body;

      if (username) updates.username = username;
      if (profile_picture) updates.profile_picture = profile_picture;
      if (societies) updates.societies = societies;
      if (status) updates.status = status;

      // Update the User document
      const user = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true,
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Use the stored role in the User document
      const userRole = user.role;

      // Update related records based on the stored user role
      if (userRole === "Admin" && adminData) {
        if (user.adminData) {
          const adminUpdate = {
            name: adminData.name,
            contactInfo: {
              phone: adminData.contactInfo?.phone,
              email: adminData.contactInfo?.email,
              cnic: adminData.contactInfo?.cnic,
              address: adminData.contactInfo?.address,
            },
          };
          await Admin.findByIdAndUpdate(user.adminData, adminUpdate, {
            new: true,
          });
        }
      }

      // Update related records based on the stored user role
      if (userRole === "Customer" && customerData) {
        if (user.customerData) {
          const customerUpdate = {
            name: customerData.name,
            contactInfo: {
              phone: customerData.contactInfo?.phone,
              email: customerData.contactInfo?.email,
              cnic: customerData.contactInfo?.cnic,
              address: customerData.contactInfo?.address,
            },
          };
          await Customer.findByIdAndUpdate(user.customerData, customerUpdate, {
            new: true,
          });
        }
      } else if (userRole === "Employee" && employeeData) {
        if (user.employeeData) {
          const employeeUpdate = {
            name: employeeData.name,
            designation: employeeData.designation,
            personalDetails: {
              phone: employeeData.personalDetails?.phone,
              address: employeeData.personalDetails?.address,
              cnic: employeeData.personalDetails?.cnic,
              dateOfJoining: employeeData.personalDetails?.dateOfJoining,
            },
            salaryDetails: {
              salary: employeeData.salaryDetails?.salary,
              lastPaidDate: employeeData.salaryDetails?.lastPaidDate,
              salarySlip: employeeData.salaryDetails?.salarySlip,
            },
          };
          await Employee.findByIdAndUpdate(user.employeeData, employeeUpdate, {
            new: true,
          });
        }
      } else if (userRole === "Investor" && investorData) {
        if (user.investorData) {
          const investorUpdate = {
            name: investorData.name,
            investmentAmount: investorData.investmentAmount,
            profitPercentage: investorData.profitPercentage,
            contactInfo: {
              phone: investorData.contactInfo?.phone,
              email: investorData.contactInfo?.email,
              address: investorData.contactInfo?.address,
              cnic: investorData.contactInfo?.cnic,
            },
            societies: investorData.societies,
            status: investorData.status,
          };
          await Investor.findByIdAndUpdate(user.investorData, investorUpdate, {
            new: true,
          });
        }
      }

      res
        .status(200)
        .json({ message: "User and related data updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Change user status
  changeUserStatus: async (req, res) => {
    try {
      const { status } = req.body;

      if (!["active", "inactive"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      );
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res
        .status(200)
        .json({ message: `User status updated to ${status}`, user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Delete a user
  // deleteUser: async (req, res) => {
  //   try {
  //     const user = await User.findByIdAndDelete(req.params.id);
  //     if (!user) {
  //       return res.status(404).json({ message: "User not found" });
  //     }

  //     console.log(`User with ID ${user._id} and role ${user.role} deleted.`); // Log user deletion

  //     // Handle deletion of related records based on role
  //     switch (user.role) {
  //       case "Investor":
  //         const investor = await Investor.deleteOne({ user: user._id });
  //         if (investor.deletedCount === 0) {
  //           console.log(
  //             `No related Investor record found for user ${user._id}`
  //           );
  //         }
  //         break;
  //       case "Employee":
  //         const employee = await Employee.deleteOne({ user: user._id });
  //         if (employee.deletedCount === 0) {
  //           console.log(
  //             `No related Employee record found for user ${user._id}`
  //           );
  //         }
  //         break;
  //       case "Customer":
  //         const customer = await Customer.deleteOne({ _id: user._id });
  //         if (customer.deletedCount === 0) {
  //           console.log(
  //             `No related Customer record found for user ${user._id}`
  //           );
  //         }
  //         break;
  //       default:
  //         console.log(`No specific role found for user ${user._id}`);
  //         break;
  //     }

  //     res
  //       .status(200)
  //       .json({ message: "User and related data deleted successfully" });
  //   } catch (error) {
  //     console.error(error);
  //     res.status(500).json({ message: "Server error", error });
  //   }
  // },
  deleteUser: async (req, res) => {
    try {
      // Find and delete the user from the User table
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // console.log(`User with ID ${user._id} and role ${user.role} deleted.`);

      // Handle deletion of related records based on role
      switch (user.role) {
        case "Investor":
          const investor = await Investor.findOneAndDelete({ user: user._id });
          if (!investor) {
            // console.log(
            //   `No related Investor record found for user ${user._id}`
            // );
          } else {
            // console.log(`Investor record with user ${user._id} deleted`);
          }
          break;
        case "Employee":
          const employee = await Employee.findOneAndDelete({ _id: user._id });
          if (!employee) {
            // console.log(
            //   `No related Employee record found for user ${user._id}`
            // );
          } else {
            // console.log(`Employee record with user ${user._id} deleted`);
          }
          break;
        case "Customer":
          const customer = await Customer.findOneAndDelete({ _id: user._id });
          if (!customer) {
            // console.log(
            //   `No related Customer record found for user ${user._id}`
            // );
          } else {
            // console.log(`Customer record with user ${user._id} deleted`);
          }
          break;
        default:
          // console.log(`No specific role found for user ${user._id}`);
          break;
      }

      res
        .status(200)
        .json({ message: "User and related data deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Get users by role
  getUsersByRole: async (req, res) => {
    try {
      const { role } = req.params;

      if (!["Admin", "Customer", "Investor", "Employee"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      let users = await User.find({ role })
        .populate("societies")
        .select("-password");

      if (role === "Employee") {
        users = await users.populate("employeeData");
      } else if (role === "Customer") {
        users = await users.populate("customerData");
      } else if (role === "Investor") {
        users = await users.populate("investorData");
      }

      res.status(200).json(users);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Update user societies
  updateUserSocieties: async (req, res) => {
    try {
      const { societies } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "Admin") {
        return res
          .status(400)
          .json({ message: "Admin cannot be assigned to any societies" });
      }

      user.societies = societies;
      await user.save();

      res
        .status(200)
        .json({ message: "User societies updated successfully", user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Update investor profit percentage
  updateInvestorProfitPercentage: async (req, res) => {
    try {
      const { investorId, profitPercentage } = req.body;

      if (profitPercentage < 0) {
        return res
          .status(400)
          .json({ message: "Profit percentage must be a positive value" });
      }

      const investor = await Investor.findById(investorId);
      if (!investor) {
        return res.status(404).json({ message: "Investor not found" });
      }

      investor.profitPercentage = profitPercentage;
      await investor.save();

      res.status(200).json({
        message: "Investor profit percentage updated successfully",
        investor,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Change password
  changePassword: async (req, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword) {
        return res
          .status(400)
          .json({ message: "Old and new passwords are required." });
      }

      const userId = req.user.id;
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Old password is incorrect" });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();

      res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ message: "User with this email not found." });
      }

      // Generate reset token and expiration time
      const resetToken = crypto.randomBytes(32).toString("hex");
      const resetTokenExpiration = Date.now() + 3600000; // 1 hour from now

      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = resetTokenExpiration;
      await user.save();

      // Configure and send the reset email
      const transporter = nodemailer.createTransport({
        service: "Gmail", // e.g., Gmail, or your email provider
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const resetLink = `http://yourapp.com/reset-password/${resetToken}`; // change when deploying or add in env
      const mailOptions = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: "Password Reset",
        text: `You are receiving this because you (or someone else) have requested to reset your account password.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        ${resetLink}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      await transporter.sendMail(mailOptions);

      res
        .status(200)
        .json({ message: "Password reset email sent successfully." });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Reset password
  resetPassword: async (req, res) => {
    try {
      const { token } = req.params;
      const { newPassword } = req.body;

      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // Ensure token hasn't expired
      });

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token." });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res
        .status(200)
        .json({ message: "Password has been reset successfully." });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};

module.exports = userController;
