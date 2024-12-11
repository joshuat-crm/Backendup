const express = require("express");
const { createAgreement } = require("../controllers/agreementController");
const { verifyJWT } = require("../middlewares/authMiddleware");
const router = express.Router();

// POST /api/agreements - Create a new agreement
router.post("/agreements", verifyJWT, createAgreement);

module.exports = router;
