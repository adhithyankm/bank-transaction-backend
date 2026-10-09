const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required:[ true, "Email is required for creating a user"],
    trim: true,
    lowercase: true,
    match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, "Invalid Email address"],
    unique: [true, "Email already exists"]
  },
  name: {
    type: String,
    required: [true, "Name is required for creating an account"]
  },
  password: {
    type: String,
    required: [ true, "Password is required for creating an account"],
    minlength: [6, "Password should contain more than 6 characters"],
    select: false
    // it will hide this field in a general search using find/findone
  },
  systemUser: {
    type: Boolean,
    default: false,
    immutable: true,
    select: false
  }
},{
  timestamps: true
  // keeps the record of when user is created and updated
})
// the pre method will will work before the execution of save and perform specified tasks
userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return 
  }
  const hash = await bcrypt.hash(this.password, 10)
  this.password = hash
  return
})
/** 
 * - it is Mongoose document instance method,
 * - in this feature  Mongoose adds it to every user document created from that schema
 */
userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password)
  // it will return true is the passed password = hashed password
} 

const userModel = mongoose.model("user", userSchema)

module.exports = userModel


