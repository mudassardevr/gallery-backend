const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const fetchuser = require("../middleware/fetchUser");
const Image = require("../models/Image");
const cloudinary = require("../config/cloudinary");

//ROUTER 1 : upload image Route
router.post(
  "/upload",
  fetchuser, // Must be logged in
  upload.single("image"), // field name MUST match frontend
  async (req, res) => {
    try {
      console.log(req.file);
      if (!req.file) {
        return res.status(400).json({ error: " No file uploaded" });
      }

      const image = await Image.create({
        user: req.user.id,
        imageUrl: req.file.path,
      });

      res.json({ success: true, image });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("server Error");
    }
  },
);

// ROUTER 2 : Fetch My Images
router.get("/my-images", fetchuser, async (req, res) => {
  try {
    const image = await Image.find({ user: req.user.id });

    res.json(image);
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server Error");
  }
});

// ROUTER 3 : Delete images
router.delete("/:id", fetchuser, async (req, res) => {
  try {
    const image = await Image.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!image) {
      return res.status(404).json({ error: "image not found" });
    }

    // extract public_id from URL
    const urlParts = image.imageUrl.split("/");
    const fileName = urlParts[urlParts.length - 1];
    const publicId = "gallery-app/" + fileName.split(".")[0];

    //delete from cloudinary
    await cloudinary.uploader.destroy(publicId);

    // delete from MongoDB
    await image.deleteOne();

    res.json({ success: true });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("server Error");
  }
});

module.exports = router;
