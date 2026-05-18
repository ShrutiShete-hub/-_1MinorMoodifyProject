const mongoose= require('mongoose');

const connectTDB=()=>{
    mongoose.connect(process.env.MONGO_URI)
    .then(()=>{
        console.log("Connected to MongoDB");
    })

    .catch(err =>{
        console.log("Not Connected",err);
    })
}
module.exports=connectTDB;