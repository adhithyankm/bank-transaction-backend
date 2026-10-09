const mongoose = require('mongoose')
const ledgerModel = require("./ledger.model")

const accountSchema = new mongoose.Schema({
    // Reference to the user who owns this account
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user", // Connects this field to a document in the User collection
    required: [true, "Account must be associated with a user"],
    index: true // Creates an index to make queries by user faster
  },
  status: {
    type: String,
    enum: {
      values: ["ACTIVE", "FROZEN", "CLOSED"],
      message: "Status can be either ACTIVE, FROZEN or CLOSED"
    },
    default: "ACTIVE"
  },
  currency: {
    type: String,
    required: [true, "Currency is required for creating an account"],
    default: "INR"
  }
}, {
  timestamps: true
})
// helps to ensure that a user can have only one account with a specific status, preventing duplicate accounts for the same user with the same status.
accountSchema.index({user: 1, status:1})

accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    { $match: {account: this._id}},
    {
      $group: {
        _id:null,
        totalDebit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "DEBIT"] },
              "$amount",
              0
            ]
          }
        },
        totalCredit: {
          $sum: {
            $cond: [
              { $eq: ["$type", "CREDIT"] },
              "$amount",
              0
            ]
          }
        }
      }
    }, {
      $project: {
        _id: 0,
        balance: {
          $subtract: ["$totalCredit", "$totalDebit"]
        }
      }
    }

  ])

  if (balanceData.length === 0) {
    return 0
  }
  return balanceData[0].balance
}

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel