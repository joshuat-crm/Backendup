const express = require('express');
const scholarshipController = require('../controllers/scholarshipController');

const router = express.Router();

// Routes
router.post('/scholarships', scholarshipController.createScholarship); // Create Scholarship
router.get('/scholarships', scholarshipController.getAllScholarships); // Get All Scholarships
router.put('/scholarships/:id', scholarshipController.updateScholarshipStatus); // Update Scholarship
router.delete('/scholarships/:id', scholarshipController.deleteScholarship); // Delete Scholarship
router.get('/scholarships/status', scholarshipController.getScholarshipsByStatus); // Filter Scholarships by Status


module.exports = router;
