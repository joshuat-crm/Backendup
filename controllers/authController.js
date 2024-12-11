const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Investor = require("../models/Investor");
const Employee = require("../models/Employee");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const Society = require("../models/Society");
const Notification = require("../models/Notification");
const Plot = require("../models/Plot"); // Adjust the path according to your file structure

const authController = {
  // Login a user

  login: async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res
          .status(400)
          .json({ message: "Username and password are required" });
      }

      // Find the user and populate the employeeData field
      const user = await User.findOne({ username }).populate("employeeData");
      if (!user) {
        return res.status(404).json({ message: "Username not found" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect password" });
      }
      if (user.status === "inactive") {
        return res.status(403).json({ message: "User is inactive" });
      }

      // Check if user has a designation in employeeData
      const designation =
        user.role === "Employee" && user.employeeData
          ? user.employeeData.designation
          : null;

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "3h" }
      );

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          designation: designation, // Include designation if found
        },
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  // Register a new user
  register: async (req, res) => {
    try {
      const {
        username,
        password,
        role,
        societies, // List of society IDs
        profile_picture,
        investorData,
        employeeData,
        adminData,
        customerData,
      } = req.body;

      // Validate request body
      if (!username || !password || !role) {
        return res
          .status(400)
          .json({ message: "Username, password, and role are required" });
      }

      // Check if the user already exists
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({
        username,
        password: hashedPassword,
        role,
        societies: role !== "Admin" ? societies : [], // Assign societies for non-admin users
        profile_picture: profile_picture || undefined,
        status: "active",
      });

      await newUser.save();

      // Create Admin record if role is Admin
      if (role === "Admin" && adminData) {
        const { name, contactInfo } = adminData;

        if (
          !name ||
          !contactInfo?.email ||
          !contactInfo?.phone ||
          !contactInfo?.cnic
        ) {
          return res
            .status(400)
            .json({ message: "Admin name and contact info are required." });
        }

        const newAdmin = new Admin({
          _id: newUser._id, // Use User's ID
          name,
          contactInfo,
        });

        await newAdmin.save();

        // Link Admin record to User
        newUser.adminData = newAdmin._id;
        await newUser.save();
      }

      // Create role-specific records
      if (role === "Investor" && investorData) {
        const { name, investmentAmount, contactInfo } = investorData;
        if (!name || !investmentAmount || !contactInfo) {
          return res.status(400).json({
            message:
              "Investor name, investment amount, and contact info are required.",
          });
        }

        const newInvestor = new Investor({
          user: newUser._id,
          societies,
          ...investorData,
        });
        await newInvestor.save();

        newUser.investorData = newInvestor._id; // Link investor record to user
        await newUser.save();
      }

      if (role === "Employee" && employeeData) {
        const { name, personalDetails, salaryDetails, designation } =
          employeeData;
        if (
          !name ||
          !salaryDetails?.salary ||
          !personalDetails?.phone ||
          !personalDetails?.dateOfJoining ||
          !personalDetails?.cnic ||
          !personalDetails?.address ||
          !designation
        ) {
          return res.status(400).json({
            message:
              "Employee name, salary, phone, date of joining, cnic, address and designation are required.",
          });
        }

        const newEmployee = new Employee({
          _id: newUser._id,
          societies: societies[0],
          ...employeeData,
        });
        await newEmployee.save();

        newUser.employeeData = newEmployee._id; // Link employee record to user
        await newUser.save();
      }

      if (role === "Customer" && customerData) {
        if (
          !customerData.name ||
          !customerData.contactInfo ||
          !customerData.contactInfo.email ||
          !customerData.contactInfo.address
        ) {
          return res
            .status(400)
            .json({ message: "Customer name and email are required." });
        }

        try {
          // Attempt to create the Customer document
          const newCustomer = new Customer({
            _id: newUser._id, // Ensure Customer uses User's _id
            societies,
            ...customerData,
          });

          await newCustomer.save();

          // Link Customer data to User
          newUser.customerData = newCustomer._id;
          await newUser.save();

          console.log(
            "Customer created successfully with ID:",
            newCustomer._id
          ); // Log Customer ID
        } catch (customerError) {
          console.error("Error creating Customer:", customerError.message);
          return res.status(500).json({
            message: "Error saving customer data",
            error: customerError.message,
          });
        }
      } else if (role === "Customer" && !customerData) {
        return res.status(400).json({ message: "Customer data is required." });
      }

      // Update societies if applicable
      if (societies && societies.length > 0) {
        await Society.updateMany(
          { _id: { $in: societies } },
          { $push: { users: newUser._id } }
        );
      }
      const notifications = [
        new Notification({
          userId: newUser._id, // User-specific notification
          message: `Welcome to the System`,
          type: "General",
          recipientRole: role, // Use the role of the new user
        }),
        new Notification({
          message: `New user registered: ${newUser.username}`, // Admin-specific message
          type: "General",
          recipientRole: "Admin", // For admins
        }),
      ];

      // Save both notifications
      await Notification.insertMany(notifications);
      // console.log("Notifications sent to both user and admin!");

      res
        .status(201)
        .json({ message: "User registered successfully", user: newUser });
    } catch (error) {
      // console.error("Registration Error: ", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
  // Logout a user

  logout: async (req, res) => {
    try {
      // Extract the JWT token from the 'Authorization' header
      const token = req.header("Authorization")?.replace("Bearer ", "");

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is missing",
        });
      }

      // For now, we'll simply return a success response without invalidating the token anywhere
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({
        success: false,
        message: "Failed to log out",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Server error",
      });
    }
  },
  // Refresh JWT token
  refreshToken: async (req, res) => {
    try {
      const { token } = req.body;
      // Validate refresh token
      if (!token) {
        return res.status(400).json({ message: "Refresh token is required" });
      }
      // Verify and generate new JWT token
      jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }
        const newToken = jwt.sign(
          { id: user.id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "3h" }
        );
        res.json({ token: newToken });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
  getCurrentUser: async (req, res) => {
    try {
      const userId = req.user.id; // The user ID is available after the JWT verification middleware

      // Fetch the user and populate relevant fields
      const user = await User.findById(userId)
        .populate({
          path: "societies", // Populate the societies field
          select: "name location society_image", // Select only the 'name' field of the societies (you can add more fields here if needed)
        })
        .populate("employeeData") // Populate employee data
        .populate("customerData") // Populate customer data
        .populate("investorData") // Populate investor data
        .populate("adminData");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Initialize variables to store role-specific data
      let additionalData = null;
      let plotDetails = null;

      // Handle role-based logic
      if (user.role === "Employee" && user.employeeData) {
        additionalData = user.employeeData; // For employee, include employee data
      } else if (user.role === "Customer" && user.customerData) {
        additionalData = user.customerData; // For customer, include customer data
        // Fetch plot details for the customer
        plotDetails = await Plot.find({
          _id: { $in: user.customerData.plots },
        }); // Get plots associated with the customer
      } else if (user.role === "Investor" && user.investorData) {
        additionalData = user.investorData; // For investor, include investor data
        // Fetch plot details for the investor (if any)
        plotDetails = await Plot.find({
          _id: { $in: user.investorData.plots },
        }); // Get plots associated with the investor
      } else if (user.role === "Admin" && user.adminData) {
        additionalData = user.adminData; // For investor, include investor data
      }

      // Return the user data along with the associated data
      res.json({
        user: {
          id: user._id,
          username: user.username,
          role: user.role,
          status: user.status,
          profile_picture: user.profile_picture,
          additionalData, // Role-specific data like designation, society info, or customer info
          societies: user.societies, // Societies data (now populated with name)
          plots: plotDetails, // Plot details (if any)
        },
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Server error", error });
    }
  },
};
module.exports = authController;
