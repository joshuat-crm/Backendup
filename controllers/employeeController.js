const Employee = require("../models/Employee"); // Adjust path as necessary
const User = require("../models/User"); // Adjust path as necessary
const { body, validationResult } = require("express-validator"); // Import validation library
const FinancialTransaction = require('../models/FinancialTransaction'); // Adjust the path as needed
const PDFDocument = require('pdfkit');
const fs = require('fs-extra');
const path = require('path');

const employeeController = {
  // Get all employees
  getAllEmployees: async (req, res) => {
    try {
      const employees = await Employee.find()
        .populate("society") // Populate society details
        .select("-salaryDetails.salarySlip"); // Exclude sensitive information
      res.status(200).json(employees);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Get an employee by ID
  getEmployeeById: async (req, res) => {
    try {
      const employee = await Employee.findById(req.params.id)
        .populate("society") // Populate society details
        .select("-salaryDetails.salarySlip");
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.status(200).json(employee);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Update employee information
  updateEmployee: [
    // Validation middleware
    body("name").optional().isString(),
    body("designation").optional().isString(),
    body("personalDetails").optional().isObject(),
    body("salaryDetails").optional().isObject(),
    body("active").optional().isBoolean(),

    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      try {
        const { name, designation, personalDetails, salaryDetails, active } =
          req.body;

        // Find employee by ID
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
          return res.status(404).json({ message: "Employee not found" });
        }

        // Update employee fields
        employee.name = name || employee.name;
        employee.designation = designation || employee.designation;
        employee.personalDetails = personalDetails || employee.personalDetails;
        employee.salaryDetails = salaryDetails || employee.salaryDetails;
        employee.active = active !== undefined ? active : employee.active;

        // Save updated employee
        await employee.save();

        res
          .status(200)
          .json({ message: "Employee updated successfully", employee });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error });
      }
    },
  ],

  // Change employee status (active/inactive)
  changeEmployeeStatus: async (req, res) => {
    const { active } = req.body;

    // Validate active field
    if (active === undefined || typeof active !== "boolean") {
      return res.status(400).json({ message: "Invalid active status" });
    }

    try {
      // Find employee by ID
      const employee = await Employee.findById(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      // Update status
      employee.active = active;
      await employee.save();

      res
        .status(200)
        .json({ message: `Employee status updated to ${active}`, employee });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Delete an employee
  deleteEmployee: async (req, res) => {
    try {
      const employee = await Employee.findByIdAndDelete(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      res.status(200).json({ message: "Employee deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },

  // Get employees by society
  getEmployeesBySociety: async (req, res) => {
    try {
      const employees = await Employee.find({ society: req.params.societyId })
        .populate("society") // Populate society details
        .select("-salaryDetails.salarySlip"); // Exclude sensitive information
      res.status(200).json(employees);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error", error });
    }
  },
// Controller to generate salary slip
generateSalarySlip : async (req, res) => {
  try {
    const {
      name,
      employeeId,
      position,
      salary,
      deductions,
      bonuses,
      period,
    } = req.body;

    // Validate form data
    if (!name || !employeeId || !position || !salary || !deductions || !bonuses || !period) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    // Find the employee in the database
    const employee = await Employee.findOne({ _id: employeeId });
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Calculate final salary
    const baseSalary = parseFloat(salary);
    const totalDeductions = parseFloat(deductions);
    const totalBonuses = parseFloat(bonuses);
    const finalSalary = baseSalary + totalBonuses - totalDeductions;

    // Generate salary slip details
    const salarySlip = {
      employeeId,
      name,
      position,
      baseSalary,
      deductions: totalDeductions,
      bonuses: totalBonuses,
      finalSalary,
      period,
    };

    // Update the employee's salary details in the database
    employee.salaryDetails.salarySlip = JSON.stringify(salarySlip); // Store as JSON or customize
    employee.salaryDetails.lastPaidDate = new Date();
    await employee.save();

    // Respond with success and the generated slip
    return res.status(200).json({ message: 'Salary slip generated successfully.', salarySlip });
  } catch (error) {
    console.error('Error generating salary slip:', error);
    return res.status(500).json({ error: 'Server error. Please try again later.' });
  }
},
  async  downloadSalarySlip(req, res) {
    try {
      const employeeId = req.params.id;
      const employee = await Employee.findById(employeeId);
  
      if (!employee || !employee.salaryDetails.salarySlip) {
        return res.status(404).json({ message: 'Salary slip not found' });
      }
  
      const filePath = employee.salaryDetails.salarySlip;
  
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Salary slip file does not exist' });
      }
  
      res.setHeader('Content-Disposition', `attachment; filename="${employee.name}_salary_slip.pdf"`);
      res.setHeader('Content-Type', 'application/pdf');
      res.download(filePath, (err) => {
        if (err) {
          console.error('Error downloading salary slip:', err);
          res.status(500).json({ message: 'Error downloading salary slip', error: err });
        }
      });
  
    } catch (error) {
      // console.error('Error in downloadSalarySlip:', error);
      res.status(500).json({ message: 'Error downloading salary slip', error });
    }
  }
}

module.exports = employeeController;
