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
    immutable: true 
  },
  transaction: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "transaction",
    required: [true, "Ledger entry must be associated with a transaction"],
    index: true,
    immutable: true
  },
  type: {
    type: String,
    enum: {
      values: ["CREDIT", "DEBIT" ],
      message: "Invalid ledger type"
    },
    required: [true, "Ledger entry must have a type (debit or credit)"],
    immutable: true
  }
})
// Prevent any modifications to ledger entries after they are created
function preventLedgerModification() {
  throw new Error("Ledger entries cannot be modified after creation");
}

ledgerSchema.pre("findOneAndUpdate", preventLedgerModification)
ledgerSchema.pre("updateOne", preventLedgerModification)
ledgerSchema.pre("updateMany", preventLedgerModification)
ledgerSchema.pre("findOneAndDelete", preventLedgerModification)
ledgerSchema.pre("deleteOne", preventLedgerModification)
ledgerSchema.pre("deleteMany", preventLedgerModification)
ledgerSchema.pre("remove", preventLedgerModification)
ledgerSchema.pre("findOneAndReplace", preventLedgerModification)

const ledgerModel = mongoose.model("ledger", ledgerSchema)

module.exports = ledgerModel