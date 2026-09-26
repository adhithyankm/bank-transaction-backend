const mongoose = require("mongoose")

const ledgerSchema = new mongoose.Schema({
  account: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "account",
    required: [true, "Ledger entry must be associated with an account"],
    index: true,
    immutable: true // Once set, this field cannot be changed
  },
  amount: {
    type: Number,
    required: [true, "Amount is required for a ledger entry"],
    immutable: true // Once set, this field cannot be changed
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transaction",
    required: [true, "Ledger entry must be associated with a transaction"],
    index: true,
    immutable: true // Once set, this field cannot be changed
  }
})