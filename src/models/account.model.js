const mongoose = require('mongoose')

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

accountSchema.index({user: 1, status:1})

const accountModel = mongoose.model("account", accountSchema)

module.exports = accountModel