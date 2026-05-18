const express=require('express');
const songController= require('../Controllers/song.controller');
const upload= require('../Middleware/upload.middleware');
const router= express.Router();
router.post("/",upload.single("song"),songController.uploadSong);

module.exports= router;