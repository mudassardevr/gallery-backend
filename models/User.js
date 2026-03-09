const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name : String,
    email : {
        type : String ,
        unique : true
    },
    password : String,
    // securityAnswer : String // this is for asking security answer for forget code

    // OTP reset feilds
    resetOTP : Number, 
    otpExpiry : Date


})

module.exports = mongoose.model("User" , UserSchema);