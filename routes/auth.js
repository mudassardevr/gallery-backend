const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const nodemailer = require("nodemailer");

const router = express.Router();

//otp:
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS,
  },
});

//ROUTER 1 : REGISTER POST : NO LOGIN REQUIRE
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    //VALIDATION
    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: "All feilds required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "password do not match" });
    }

    //CHECK IF USER EXISTS
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ error: "User already exists" });
    }

    //HASH PASSWORD
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    //CREATE USER
    user = await User.create({
      name,
      email,
      password: hashPassword,
    });

    res.json({ success: true, message: "Registration Successfull" });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server Error");
  }
});

// ROUTER 2 : LOGIN POST  : login required
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    //VALIDATION
    if (!email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    // FIND USER
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    //COMPARE PASSWORD
    const comparePassoword = await bcrypt.compare(password, user.password);
    if (!comparePassoword) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    //JWT  payload and data are same
    const payload = {
      user: {
        id: user.id,
      },
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET);

    res.json({ success: true, token });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error");
  }
});

//ROUTE 3 : FORGOT PASSWORD GENERATE OTP : SEND OTP
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    //Generate OTP

    const otp = Math.floor(100000 + Math.random() * 900000);

    user.resetOTP = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;

    await user.save();

    // send email
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP is ${otp}`,
    });

    res.json({
      success: true,
      message: "OTP sends to email",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({error : "server error"});
  }
});

//ROUTE 4: VERIFY OTP
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "User Not Found" });
    }

    if (user.resetOTP != otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (user.otpExpiry < Date.now()) {
      return res.status(400).json({ error: "OTP Expired" });
    }

    res.json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server error");
  }
});

// ROUTE 5 : RESET-PASSWORD
router.post("/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ error: "Email and new Password required" });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ error: "User Not Found" });
    }

    // hash new password
    const salt = await bcrypt.genSalt(10);
    const hassPassword = await bcrypt.hash(newPassword, salt);

    // update password
    user.password = hassPassword;

    // clear OTP fields
    user.resetOTP = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.json({
      success: true,
      message: "Password Reset Successfully ",
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send({error :"server error"});
  }
});

module.exports = router;
