const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

//CLOUDINARY STORAGE
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "gallery-app",
    allowed_formats: ["jpg", "png", "jpeg", "webp"],
  },
});

//MULTER UPLOAD
const upload = multer({
  storage,
});


module.exports = upload;



// //STORAGE config
// const storage = multer.diskStorage({
//     destination : function(req , file , cb) {
//         cb(null , "uploads/")
//     },
//     filename : function(req , file , cb) {
//         cb(null , Date.now() + "-" + file.originalname);
//     },
// });

// // file filter (image only )
// const fileFilter = (req , file , cb) => {
//     if(file.mimetype.startsWith("image")){
//         cb(null , true);
//     } else{
//         cb(new Error("Only Images") , false);
//     }

// };

// const upload = multer({
//     storage,
//     fileFilter
// });
