const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  email: {
    type: String,
    unique: true,
  },
  password: String,

  //for profile image
  profileImage: {
    type: String,
    default: "",
  },
  
  // OTP reset feilds
  resetOTP: Number,
  otpExpiry: Date,
});

module.exports = mongoose.model("User", UserSchema);
