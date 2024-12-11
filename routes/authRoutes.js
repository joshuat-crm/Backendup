const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { verifyJWT } = require('../middlewares/authMiddleware') // Ensure the token is verified
const adminController= require('../controllers/adminController')

// Login route
router.post('/login', authController.login)

// Register route
router.post('/register', authController.register)

// Logout route
router.post('/logout', verifyJWT, authController.logout)

// Refresh token route
router.post('/refresh-token', authController.refreshToken)

// Get current user route
router.get('/current-user', verifyJWT, authController.getCurrentUser)

// Update admin
router.put('/admin/:adminId', adminController.updateAdmin)

// Get admin
router.get('/admin/:adminId', adminController.getAdmin)

module.exports = router
