const express = require('express');
const resellController = require('../controllers/resellController');
const router = express.Router();

// Get all resells
router.get('/resells', resellController.getAllResells);

// Get a resell by ID
router.get('/resells/:id', resellController.getResellById);

// Create a new resell
router.post('/resells', resellController.createResell);

// Update a resell by ID
router.put('/resells/:id', resellController.updateResell);

// Delete a resell by ID (soft delete)
router.delete('/resells/:id', resellController.deleteResell);



module.exports = router;
