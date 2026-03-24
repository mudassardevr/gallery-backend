const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const nodemailer = require("nodemailer");
const { Resend } = require("resend");
const fetchuser = require("../middleware/fetchUser");
const upload = require("../middleware/upload");
const cloudinary = require("../config/cloudinary");



const router = express.Router();

const resend = new Resend(process.env.RESEND_API_KEY);


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

    // JWT payload
    const payload = {
      user: {
        id: user.id,
      },
    };

    // generate token
    const token = jwt.sign(payload, process.env.JWT_SECRET);

    // send token
    res.json({
      success: true,
      token,
    });

    // res.json({ success: true, message: "Registration Successfull" });
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
    // console.log("EMAIL:", process.env.EMAIL);
    // console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? "Loaded" : "Missing");

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

    // SEND EMAIL USING RESEND
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "asuspulsar3@gmail.com",
      subject: "Password Reset OTP",
      // text: `Your OTP is ${otp}`,
      html: `
            <h2>Password Reset OTP</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This OTP expires in 10 minutes.</p>`,
    });

    res.json({
      success: true,
      message: "OTP sends to email",
    });
  } catch (error) {
    console.error("Forgot password error : ", error);
    res.status(500).send({ error: error.message });
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
    res.status(500).send({ error: "server error" });
  }
});

//ROUTE 6: get user profile
router.get("/getuser", fetchuser, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).send("Server Error");
  }
});

//ROUTE 7: UPDATE PROFILE (IMAGE + NAME)
router.put(
  "/updateprofile",
  fetchuser,
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const { name } = req.body;

      let updateData = { name };

      // Upload image to Cloudinary
      if (req.file) {
        const uploadImage = () => {
          return new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "profile_images" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(req.file.buffer);
          });
        };

        const result = await uploadImage();

        //  Save URL
        updateData.profileImage = result.secure_url;
      }

      const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        updateData,
        { new: true }
      ).select("-password");

      res.json(updatedUser);

    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  }
);
// router.put(
//   "/updateprofile",
//   fetchuser,
//   upload.single("profileImage"),
//   async (req, res) => {
//     try {
//       const { name } = req.body;

//       let profileImageUrl = "";

//       // IF IMAGE EXISTS → UPLOAD TO CLOUDINARY
//       if (req.file) {
//         const result = await cloudinary.uploader.upload_stream(
//           { folder: "profile_images" },
//           async (error, result) => {
//             if (error) {
//               return res.status(500).json({ error: "Upload failed" });
//             }

//             profileImageUrl = result.secure_url;

//             const updatedUser = await User.findByIdAndUpdate(
//               req.user.id,
//               {
//                 name,
//                 ...(profileImageUrl && { profileImage: profileImageUrl }),
//               },
//               { new: true }
//             ).select("-password");

//             res.json(updatedUser);
//           }
//         );

//         result.end(req.file.buffer);
//       } else {
//         // ONLY NAME UPDATE
//         const updatedUser = await User.findByIdAndUpdate(
//           req.user.id,
//           { name },
//           { new: true }
//         ).select("-password");

//         res.json(updatedUser);
//       }
//     } catch (error) {
//       console.error(error.message);
//       res.status(500).send("Server Error");
//     }
//   }
// );


module.exports = router;
