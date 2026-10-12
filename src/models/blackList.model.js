const mongoose = require("mongoose")
/**
 * balcklist model is used to store the tokens that have been blacklisted. This is useful for implementing logout functionality, where a user can be logged out by blacklisting their token. When a user logs out, their token is added to the blacklist, and any subsequent requests with that token will be rejected.
 * The blacklisted tokens are stored in the database, and the blacklist is checked for every request to ensure that the token is not blacklisted. If a token is found in the blacklist, the request is rejected with a 401 Unauthorized response.
 */
const tokenBlacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Token is required for blacklisting"],
    unique: [true, "Token is already blacklisted"]
  }
}, {
  timestamps: true
})


tokenBlacklistSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 3 }) // Tokens will be automatically removed from the blacklist after 3 days (60 seconds * 60 minutes * 24 hours * 3 days)

const tokenBlacklistModel = mongoose.model("tokenBlacklist", tokenBlacklistSchema)
module.exports = tokenBlacklistModel