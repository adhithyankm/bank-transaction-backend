const transactionModel = require("../models/transaction.model")
const ledgerModel = require("../models/ledger.model")
const accountModel = require("../models/account.model")
const emailService = require("../services/email.service")
const mongoose = require("mongoose")

/**
 * -Create a new transaction
 * The 10-step Transfer flow
 *  * 1. Validate the request 
 *  * 2. Validate the idempotency key
 *  * 3. Check account status
 *  * 4. Derive sender balance from ledger
 *  * 5. Create transaction (PENDING)
 *  * 6. Create debit ledger entry for sender
 *  * 7. Create Credit ledger entry for receiver
 *  * 8. Mark transaction complete (COMPLETED)
 *  * 9. Commit MongoDB Session
 *  * 10. Send email notification
 */

async function createTransaction(req, res) {
  /**
   * 1. Validate the request
   */
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Missing required fields: fromAccount, toAccount, amount, idempotencyKey"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    _id: fromAccount
  })
  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  })
  if (!fromUserAccount || !toUserAccount) {
    return res.status(404).json({
      message: "One or both accounts not found"
    })
  }

  /**
   * 2. Validate the idempotency key
   */
  const isTransactionExist = await transactionModel.findOne({
    idempotencyKey: idempotencyKey
  })
  if (isTransactionExist) {
    if (isTransactionExist.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already completed",
        transaction: isTransactionExist
      })
    }
    if (isTransactionExist.status === "PENDING") {
      return res.status(202).json({
        message: "Transaction is still pending",
        transaction: isTransactionExist
      })
    }
    if (isTransactionExist.status === "FAILED") {
      return res.status(400).json({
        message: "Transaction has failed",
        transaction: isTransactionExist
      })
    }
    if (isTransactionExist.status === "REVERSED") {
      return res.status(400).json({
        message: "Transaction has been reversed",
        transaction: isTransactionExist
      })
    }
  }

  /**
   * 3. Check account status
   */
  if (fromUserAccount.status !== "ACTIVE" || toUserAccount.status !== "ACTIVE") {
    return res.status(400).json({
      message: "One or both accounts are not active"
    })
  }
  /**
   * 4. Derive sender balance from ledger
   */
  const balance = await fromUserAccount.getBalance()

  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance is ${balance}`
    })
  }
  let transaction
  try {
  /**
   * 5. Create transaction (PENDING)
   */
  const session = await mongoose.startSession()
  session.startTransaction()
  // session groups all the operations below into a single transaction. If any of them fail, none of them will be committed to the database.
  
  // we do not create the transaction in the DB, only in the client server, so we do not need to check for idempotency key here. The system user is the only one who can create initial funds transactions, and they are not allowed to create multiple transactions with the same idempotency key.
  transaction = (await transactionModel.create([{
    fromAccount,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING"
  }], { session }))[0]
  // starting a session alone does not a trasaction ,we need to pass the session to each operation that we want to be part of the transaction. In this case, we are passing the session to the create operations for the ledger entries and the save operation for the transaction.
  const debitLedgerEntry = await ledgerModel.create([{
    account: fromAccount,
    amount: amount,
    transaction: transaction._id,
    type: "DEBIT"
  }], { session })

  await (() => {
    return new Promise((resolve) => setTimeout(resolve, 15 * 1000))
  })()

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount: amount,
    transaction: transaction._id,
    type: "CREDIT"
  }], { session })

  await transactionModel.findOneAndUpdate(
    { _id: transaction._id },
    { status: "COMPLETED" },
    { session }
  )

  await session.commitTransaction()
  session.endSession()
} catch (error) {
  return res.status(400).json({
    message: "Transaction is pending due to some error, please try again later",
    error: error.message
  })
}
  /**
   * 10. Send email notification
   */
  await emailService.sendTransactionEmail(req.user.email, req.user.name, amount, toAccount)
  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction
  })
}

async function createInitialFundsTransaction(req, res) {
 const { toAccount, amount, idempotencyKey } = req.body

  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "Missing required fields: toAccount, amount, idempotencyKey"
    })
  }

  const toUserAccount = await accountModel.findOne({
    _id: toAccount
  })
  if (!toUserAccount) {
    return res.status(404).json({
      message: "Account not found"
    })
  }

  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  })

  if (!fromUserAccount) {
    return res.status(404).json({
      message: "System user account not found"
    })
  }

  const session = await mongoose.startSession()
  session.startTransaction()
  // we do not create the transaction in the DB, only in the client server, so we do not need to check for idempotency key here. The system user is the only one who can create initial funds transactions, and they are not allowed to create multiple transactions with the same idempotency key.
  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING"
  })

  const debitLedgerEntry = await ledgerModel.create([{
    account: fromUserAccount._id,
    amount: amount,
    transaction: transaction._id,
    type: "DEBIT"
  }], { session })
  // when we use the session we need to pass the data as array of objects, not as a single object. This is because the session is used to group multiple operations into a single transaction, and each operation needs to be passed as a separate object in the array.

  const creditLedgerEntry = await ledgerModel.create([{
    account: toAccount,
    amount: amount,
    transaction: transaction._id,
    type: "CREDIT"
  }], { session })

  transaction.status = "COMPLETED"
  await transaction.save({ session })

  await session.commitTransaction()
  session.endSession()

  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction
  })
} 

module.exports = {
  createTransaction,
  createInitialFundsTransaction
}