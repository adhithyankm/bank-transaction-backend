const userModel = require("../models/user.model")
const jwt = require("jsonwebtoken")
const tokenBlacklistModel = require("../models/blackList.model")

/**
 * - Authentication Middleware
 * - This middleware checks for the presence of a valid JWT token in the request cookies or headers.
 * - If the token is valid, it decodes the token to retrieve the user ID and fetches the corresponding user from the database.
 * - The user object is then attached to the request object for use in subsequent middleware or route handlers.
 * - If the token is missing or invalid, it responds with a 401 Unauthorized status and an appropriate message.
 */
async function authMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if(!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing"
    })
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token })

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access, token is blacklisted"
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId)
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid"
    })
  }
}

async function authSystemUSerMiddleware(req, res, next) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1]

  if(!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing"
    })
  }

  const isBlacklisted = await tokenBlacklistModel.findOne({ token })

  if (isBlacklisted) {
    return res.status(401).json({
      message: "Unauthorized access, token is blacklisted"
    })
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await userModel.findById(decoded.userId).select("+systemUser") // systemuser is set to select false, so we need to explicitly select it here
    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, user is not a system user"
      })
    }
    req.user = user
    next()
  } 
  catch (err) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid"
    })
  }
}

module.exports = {
  authMiddleware,
  authSystemUSerMiddleware
}