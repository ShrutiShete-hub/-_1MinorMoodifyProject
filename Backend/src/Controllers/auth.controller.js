const jwt= require('jsonwebtoken');
const bcrypt= require('bcrypt');
const User= require('../models/user.model');

export async function registerUser(req,res){
    const {name,email,password}= req.body;

    const isAlreadyRegistered= await User.findOne({
        $or:[{
            email:email,
            username:name
        }]
    })

    if (isAlreadyRegistered){
        return res.status(400).json({message:"User already exists"});
    }

    const hashPassword= await bcrypt.hash(password,10);

    const token=jwt.sign(
        {email:email},
    process.env.JWT_SECRET
)
 const cookies= new cookieStore("token",token);

 res.status(201).json({message:"User registered successfully",token:token});
}






export async function logOutUser(req,res){
    const token= req.cookies.token;
    if (!token){
        return res.status(401).json({message:"Unauthorized"});
    }
    await blackList.create({token:token});
    res.clearCookie("token");
    res.status(200).json({message:"User logged out successfully"});
}