const express = require("express");
const homeController = require("../controllers/homeController.js");

const bodyParser = require("body-parser");
const urlencodedParser = bodyParser.urlencoded({extended:false});
const jsonparser = bodyParser.json();

// загрузка фотографий
const multer = require("multer");
const upload = multer({dest:"public/uploads"});


const homeRouter = express.Router();


homeRouter.get("/", homeController.mainpage);
homeRouter.get("/account", homeController.account);
homeRouter.get("/logout", homeController.logout);
homeRouter.get("/create", homeController.create);
homeRouter.post("/create", urlencodedParser, upload.single('avatar'), homeController.create_bitch);
homeRouter.delete("/create", jsonparser,  homeController.delete_bitch);
homeRouter.post("/register", urlencodedParser, upload.single('avatar'), homeController.create_user);
homeRouter.get("/register",  homeController.register);
homeRouter.post("/login", urlencodedParser, homeController.login_post);
homeRouter.get("/login",  homeController.login);

module.exports = homeRouter;
