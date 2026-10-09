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

/**
 * - GET /api/accounts
 * - Get all accounts for the authenticated user
 * - protected route, requires authentication
 */
router.get("/", authMiddleware.authMiddleware, accountController.getUserAccountsController)

/**
 * - GET /api/accounts/balance/:accountId
 * - Get the balance of a specific account for the authenticated user
 * - protected route, requires authentication
 */
router.get("/balance/:accountId", authMiddleware.authMiddleware, accountController.getAccountBalanceController)
module.exports = router