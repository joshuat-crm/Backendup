const Employee = require('../models/Employee')
const FinancialTransaction = require('../models/FinancialTransaction')
const Notification = require('../models/Notification')
// Helper Function to Calculate Net Salary
const calculateNetSalary = salaryDetails => {
  const { salary, allowances, bonuses, deductions } = salaryDetails
  return salary + allowances + bonuses - deductions
}

// Controller Methods
const SalaryController = {
  // Pay Salary to an Employee
  paySalary: async (req, res) => {
    try {
      const employeeId = req.params.id
      const employee = await Employee.findById(employeeId)

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      // Check if salary for the current month has already been paid
      const lastPaidDate = employee.salaryDetails.lastPaidDate
      const currentDate = new Date()

      if (
        lastPaidDate &&
        lastPaidDate.getMonth() === currentDate.getMonth() &&
        lastPaidDate.getFullYear() === currentDate.getFullYear()
      ) {
        return res
          .status(400)
          .json({ error: 'Salary has already been paid for this month' })
      }

      // Calculate net salary
      const netSalary = calculateNetSalary(employee.salaryDetails)

      // Create payment record
      const paymentRecord = {
        date: currentDate,
        netSalary: netSalary,
        slipUrl: `https://example.com/salary-slips/${employeeId}_${Date.now()}.pdf` // Placeholder URL
      }

      // Update payment history and last paid date
      employee.paymentHistory.push(paymentRecord)
      employee.salaryDetails.lastPaidDate = currentDate

      await employee.save()
      // Create a financial transaction record for salary payment
      const transaction = new FinancialTransaction({
        employee_id: employeeId,
        transaction_date: currentDate,
        amount: netSalary,
        transaction_type: 'Salary Payment',
        transaction_direction: 'Expense', // Salary is considered income
        description: `Salary payment for ${
          employee.name
        } for ${currentDate.toLocaleDateString()}`
      })
      // Send notification to the employee
      await Notification.create({
        userId: employeeId, // Send notification to the employee
        message: `Your salary of ${netSalary} has been successfully paid for ${currentDate.toLocaleDateString()}.`,
        type: 'Salary',
        recipientRole: 'Employee' // Specify the role
      })

      // Send notification to the admin
      await Notification.create({
        userId: null, // Null for admin notifications
        message: `Salary payment of ${netSalary} has been made to Employee #${employeeId.name} for ${currentDate.toLocaleDateString()}.`,
        type: 'Salary',
        recipientRole: 'Admin' // Specify the role
      })
      // Save the financial transaction
      await transaction.save()

      res.status(200).json({
        message: 'Salary paid successfully',
        paymentRecord
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },
  // Generate Salary Slip for an Employee
  generateSalarySlip: async (req, res) => {
    try {
      const employeeId = req.params.id
      const employee = await Employee.findById(employeeId)

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      const netSalary = calculateNetSalary(employee.salaryDetails)

      const salarySlip = `
        Salary Slip
        ------------------------
        Name: ${employee.name}
        Designation: ${employee.designation}
        Date: ${new Date().toLocaleDateString()}
        Basic Salary: ${employee.salaryDetails.salary}
        Allowances: ${employee.salaryDetails.allowances}
        Bonuses: ${employee.salaryDetails.bonuses}
        Deductions: ${employee.salaryDetails.deductions}
        Net Salary: ${netSalary}
        ------------------------
      `

      res.status(200).json({
        message: 'Salary slip generated successfully',
        salarySlip
      })
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  // Get Payment History of an Employee
  getPaymentHistory: async (req, res) => {
    try {
      const employeeId = req.params.id
      const employee = await Employee.findById(employeeId).select(
        'paymentHistory'
      )

      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' })
      }

      res.status(200).json(employee.paymentHistory)
    } catch (error) {
      res.status(500).json({ error: error.message })
    }
  },

  // Update Salary Details of an Employee
  updateSalaryDetails: async (req, res) => {
    try {
      const employeeId = req.params.id;
      const { salary, allowances, bonuses, deductions } = req.body;
  
      const employee = await Employee.findById(employeeId);
  
      if (!employee) {
        return res.status(404).json({ error: 'Employee not found' });
      }
  
      // Update salary details
      employee.salaryDetails.salary = salary ?? employee.salaryDetails.salary;
      employee.salaryDetails.allowances = allowances ?? employee.salaryDetails.allowances;
      employee.salaryDetails.bonuses = bonuses ?? employee.salaryDetails.bonuses;
      employee.salaryDetails.deductions = deductions ?? employee.salaryDetails.deductions;
  
      await employee.save();
  
      const currentDate = new Date();
  
      // Send notification to the employee
      await Notification.create({
        userId: employeeId, // Send notification to the employee
        message: `Your salary has been updated to ${salary || employee.salaryDetails.salary} as of ${currentDate.toLocaleDateString()}.`,
        type: 'Salary',
        recipientRole: 'Employee', // Specify the role
      });
  
      // Send notification to the admin
      await Notification.create({
        userId: null, // Null for admin notifications
        message: `Salary payment of ${salary || employee.salaryDetails.salary} has been successfully updated for Employee ${employee.name} (ID: ${employeeId}) on ${currentDate.toLocaleDateString()}.`,
        type: 'Salary',
        recipientRole: 'Admin', // Specify the role
      });
  
      // Save the financial transaction
      // Assuming `transaction` is a valid instance of a financial transaction.
    //   const transaction = new Transaction({
    //     employeeId,
    //     salary: employee.salaryDetails.salary,
    //     date: currentDate,
    //   });
    //   await transaction.save();
  
      res.status(200).json({
        message: 'Salary details updated successfully',
        salaryDetails: employee.salaryDetails,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
}

module.exports = SalaryController
