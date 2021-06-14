//Addind modules

// Express
const express    = require("express");
// Шаблонизатор
const exphbs     = require("express-handlebars");
const hbs        = require("handlebars");
// бд
const mongoose   = require("mongoose");
// сессии
const session    = require("express-session");
// хранилище сессий
const mongoSrote = require("connect-mongo");

const config = require("./config.js")

// локальное хранилище
const LocalStorage = require('node-localstorage').LocalStorage;
localStorage = new LocalStorage('./scratch');

//connection routs
const homeRouter = require("./routs/homeRout.js")

// создаём приложене
const app = express();

// регистрация хелпера
hbs.registerHelper("getNav", function(){
  let nav = '';
  if(localStorage.getItem("userLogin") == 1){
    nav += '<li><a href="/" class="a-active">Мои бич</a></li>';
    nav += '<li><a href="/create"class="a-active">Добавить новую</a></li>';
    nav += '<li><a href="/account"class="a-active">Мой аккаунт</a></li>';
    nav += '<li><a href="/logout"class="a-active">Выйти</a></li>'
  }
  else{
    nav +='<li><a href="/register"class="a-active">Регистрация</a></li>';
    nav +='<li><a href="/login"class="a-active">Войти</a></li>';
  }
  return nav;
});

hbs.registerHelper("getErrorLogin", function(){
  if(localStorage.getItem("userLogin") != 1){
    return    `<a href='/login' class='a-active'>Авторизоваться</a>
              <a href="/register" class='a-active'>Зарегестрироваться</a>`;
  }
  else{
    return `<a href="/" class='a-active'>На главную</a>`;
  }
})

// шаблонизатор
app.engine("hbs", exphbs({
  defaultLayout: "main",
  extname: "hbs",
}));
app.set("view engine", "hbs");


// настройка сессий
app.use(session({
  secret: "This is secret...",
  store: mongoSrote.create({
    mongoUrl: `mongodb+srv://${config.DB_login}:${config.DB_passorwd}@mybitch.s2w0e.mongodb.net/MyBitch?retryWrites=true&w=majority`,
  }),
  cookie:{secure:false},
}));

// использование публичной папки
app.use(express.static(__dirname + "/public"));


// связка роута
app.use("/", homeRouter);
app.use(function(req,res,next){
  if(req.session.user_id){
    console.log(req.session.user_id);
    localStorage.setItem("userLogin", 1);
    req.session.save();
  }
  else {
    localStorage.setItem("userLogin", 0);
  }
  next();
});




mongoose.connect("mongodb+srv://artess:2004papa@mybitch.s2w0e.mongodb.net/MyBitch?retryWrites=true&w=majority",
{useNewUrlParser: true,
 useUnifiedTopology: true,
 useFindAndModify: false,
 }, err=>{
  if(err){
    console.log(err);
  }
  else{
    app.listen(3000, ()=>{
      console.log("STATING...");
    });
  }
});
