const {Router} = require("express")
const authMiddleware = require("../middleware/auth.middleware")
const transactionController = require("../controllers/transaction.controller")

const transactionRoutes = Router()

/**
 * - Post /api/transactions
 * - Create a new transaction for the authenticated user
 * - protected route, requires authentication
 */

transactionRoutes.post("/", authMiddleware.authMiddleware, transactionController.createTransaction)

/**
 * - POST /api/transactions/system/inital-funds
 * - Create initial funds trasaction for the system user
 */
transactionRoutes.post("/system/initial-funds", authMiddleware.authSystemUSerMiddleware, transactionController.createInitialFundsTransaction)
module.exports = transactionRoutes