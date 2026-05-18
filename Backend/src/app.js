const express= require('express');
const cookieParser= require("cookie-parser");

const app=express();

app.use(express.json());
app.use(cookieParser());


const authRoute= require('./Routes/auth.router');
const songRoute= require('./Routes/song.route');

app.use("/auth",authRoute);
app.use("/songs",songRoute);
module.exports=app;