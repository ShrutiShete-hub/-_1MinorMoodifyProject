const mongoose= require("mongoose");
const songSchema= new mongoose.Schema({
    url:{
        type:String,
        required:true
    },
    poster_url:{
        type:String,
        required:true
    },title:{
        type:String
    }
})

const songModel= mongoose.model("song",songSchema);

module.exports= songModel;