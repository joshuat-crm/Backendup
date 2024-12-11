const Scholarship = require('../models/Scholarship')
const FinancialTransaction = require('../models/FinancialTransaction')
const Notification = require('../models/Notification')
// Add Scholarship Application
exports.createScholarship = async (req, res) => {
  try {
    const { cnic } = req.body

    // Check if CNIC already exists
    const existingScholarship = await Scholarship.findOne({ cnic })
    if (existingScholarship) {
      return res.status(400).json({
        message: `Scholarship with CNIC ${cnic} already exists.`
      })
    }

    const scholarship = new Scholarship(req.body)
    await scholarship.save()

    // Notify Admin about new application
    await Notification.create({
      userId: null, // Null for admin notifications
      message: `A new scholarship application has been submitted by ${scholarship.name} (CNIC: ${scholarship.cnic}).`,
      type: 'Scholarship',
      recipientRole: 'Admin' // Specify the role
    })

    res.status(201).json({
      message: 'Scholarship application submitted successfully',
      scholarship
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error creating scholarship application',
      error
    })
  }
}

// List all Scholarship Applications
exports.getAllScholarships = async (req, res) => {
  try {
    const scholarships = await Scholarship.find()
    res.status(200).json(scholarships)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scholarships', error })
  }
}

// Update Scholarship Status
exports.updateScholarshipStatus = async (req, res) => {
  try {
    const { id } = req.params
    const { status, amount } = req.body

    const scholarship = await Scholarship.findByIdAndUpdate(
      id,
      { status, amount },
      { new: true }
    )

    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' })
    }

    // Generate status-specific notification
    let notificationMessage = ''
    if (status === 'Shortlisted') {
      notificationMessage = `Scholarship application for ${scholarship.name} (CNIC: ${scholarship.cnic}) has been shortlisted.`
    } else if (status === 'Approved') {
      notificationMessage = `Scholarship application for ${scholarship.name} (CNIC: ${scholarship.cnic}) has been approved with an amount of ${amount}.`
      if (amount > 0) {
        // Add financial transaction
        const transaction = new FinancialTransaction({
          amount,
          transaction_type: 'Scholarship',
          transaction_direction: 'Expense',
          description: `Scholarship granted to ${scholarship.name} (CNIC: ${scholarship.cnic}).`
        })
        await transaction.save()
      }
    } else if (status === 'Rejected') {
      notificationMessage = `Scholarship application for ${scholarship.name} (CNIC: ${scholarship.cnic}) has been rejected.`
    }

    // Create notification for admin
    if (notificationMessage) {
      await Notification.create({
        userId: null, // Null for admin notifications
        message: notificationMessage,
        type: 'Scholarship',
        recipientRole: 'Admin' // Specify the role
      })
    }

    res.status(200).json({
      message: `Scholarship status updated to ${status} successfully`,
      scholarship
    })
  } catch (error) {
    res.status(500).json({
      message: 'Error updating scholarship status',
      error
    })
  }
}

// Delete Scholarship
exports.deleteScholarship = async (req, res) => {
  try {
    const { id } = req.params
    const scholarship = await Scholarship.findByIdAndDelete(id)

    if (!scholarship) {
      return res.status(404).json({ message: 'Scholarship not found' })
    }

    res.status(200).json({ message: 'Scholarship deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Error deleting scholarship', error })
  }
}
exports.getScholarshipsByStatus = async (req, res) => {
  try {
    const { status } = req.query
    const query = status ? { status } : {}
    const scholarships = await Scholarship.find(query)
    res.status(200).json(scholarships)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching scholarships', error })
  }
}
