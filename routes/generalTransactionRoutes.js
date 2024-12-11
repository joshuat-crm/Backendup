const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/generalTransactionController');
const { verifyJWT } = require('../middlewares/authMiddleware'); // Use verifyJWT instead

// Apply the verifyJWT middleware to all routes to ensure only authenticated users can access them
router.use(verifyJWT);

// Route to create a new transaction
router.post('/', transactionController.addTransaction);

// Route to get all transactions with optional filters
router.get('/', transactionController.getTransactions);

// Route to update a specific transaction by ID
router.put('/:id', transactionController.updateTransaction);

// Route to delete a specific transaction by ID
router.delete('/:id', transactionController.deleteTransaction);

// Route to get the transaction summary (total income, expense, and balance)
router.get('/summary', transactionController.getSummary);

module.exports = router;
