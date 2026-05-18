const jwt=require('jsonwebtoken');
const User= require('../models/user.model');

export async function authmiddleware(req,res,next){
    const token= req.cookies.token;
    if (!token){
        return res.status(401).json({message:"Unauthorized"});
    }

    const isTokenBlackListed= await blackList.findOne({token:token});
    if (isTokenBlackListed){
        return res.status(401).json({message:"Unauthorized"});
    }
    const decoded;
    try{
        decoded= jwt.verify(token,process.env.JWT_SECRET);
        const user= await User.findOne({email:decoded.email});

        if (!user){
            return res.status(401).json({message:"Unauthorized"});
            
        }  
        req.user= decoded;
        next();             
    }catch(err){
        return res.status(401).json({message:"Unauthorized"});
    }
}