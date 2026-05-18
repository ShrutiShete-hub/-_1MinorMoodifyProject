const mongoose= require('mongoose');

const blackListSchema= new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required"]
    },
    timeStamp:{
        type:Date,
        default:Date.now
    }
})
const blackList= mongoose.model('blackList',blackListSchema);

module.exports= blackList;