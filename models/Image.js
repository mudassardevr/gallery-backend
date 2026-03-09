const mongoose = require('mongoose');

const ImageSchema = new mongoose.Schema({
    // user id
    user : {
        type : mongoose.Schema.Types.ObjectId ,
        ref : "User" ,
        require : true
    },
    imageUrl : {
        type : String , 
        require : true
    },
    createdAt : {
        type : Date,
        default : Date.now
    }

});

module.exports = mongoose.model("Images" , ImageSchema);