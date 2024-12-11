const express = require('express');
const router = express.Router();
const { getAggregatedData } = require('../controllers/aggregationController');
const { verifyJWT, isAdmin, isManager } = require('../middlewares/authMiddleware');

// Apply authentication middleware to the route

router.get('/aggregated-data/:societyId', verifyJWT, getAggregatedData);

module.exports = router;
