const Admin = require("../models/Admin");
const adminController = {
  updateAdmin: async (req, res) => {
    try {
      const { adminId } = req.params; // Admin ID from request parameters
      const updates = req.body; // Fields to update

      const updatedAdmin = await Admin.findByIdAndUpdate(adminId, updates, {
        new: true,
      });

      if (!updatedAdmin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res
        .status(200)
        .json({ message: "Admin updated successfully", admin: updatedAdmin });
    } catch (error) {
      // console.error('Error updating admin:', error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
  getAdmin: async (req, res) => {
    try {
      const { adminId } = req.params; // Admin ID from request parameters

      const admin = await Admin.findById(adminId);

      if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
      }

      res.status(200).json({ admin });
    } catch (error) {
      // console.error('Error fetching admin:', error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  },
};
module.exports = adminController;
