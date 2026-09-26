const express = require('express')
const authMiddleware = require("../middleware/auth.middleware")
const accountController = require("../controllers/account.controller")

const router = express.Router()

/**
 * - Post /api/accounts
 * - Create a new account for the authenticated user
 * - protected route, requires authentication
 */

router.post("/", authMiddleware.authMiddleware, accountController.createAccountController)
module.exports = router