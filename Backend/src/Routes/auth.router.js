const express=require('express');
const router= express.Router();
const authController= require('../Controllers/auth.controller');

router.post("auth/register",authController.registerUser);
