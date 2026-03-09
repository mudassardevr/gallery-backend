const multer = require('multer');

//STORAGE config
const storage = multer.diskStorage({
    destination : function(req , file , cb) {
        cb(null , "uploads/")
    },
    filename : function(req , file , cb) {
        cb(null , Date.now() + "-" + file.originalname);
    },
});


// file filter (image only )
const fileFilter = (req , file , cb) => {
    if(file.mimetype.startsWith("image")){
        cb(null , true);
    } else{
        cb(new Error("Only Images") , false);
    }

};

const upload = multer({
    storage, 
    fileFilter
});

module.exports = upload;