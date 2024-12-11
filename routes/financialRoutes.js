const express = require('express');
const router = express.Router();
const FinancialController = require('../controllers/financialController'); // Adjust the path as needed

// Define routes for financial transactions
router.post('/transactions', FinancialController.createTransaction);
router.get('/transactions', FinancialController.getAllTransactions);
router.get('/transactions/:id', FinancialController.getTransactionById);
router.put('/transactions/:id', FinancialController.updateTransaction);
router.delete('/transactions/:id', FinancialController.deleteTransaction);

module.exports = router;
