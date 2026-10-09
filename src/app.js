const express = require('express')
const cookieParser = require('cookie-parser')
const authRouter = require("./routes/auth.routes")
const accountRouter = require("./routes/account.routes")
const transactionRouter = require("./routes/transaction.routes")

const app = express()
app.use(express.json())
// the express server cannot read the req.body, so we use express.json() to access it as middleware
app.use(cookieParser())
// to save token as cookies
app.use("/api/auth",authRouter)
app.use("/api/accounts", accountRouter)
app.use("/api/transactions", transactionRouter)


module.exports = app