const Bitch = require("../models/bitch.js");
const User = require("../models/user.js");

// валидатор
const {body, validationResult} = require("express-validator");
const fs = require("fs");



function errorPage(res, error, class_err){
  res.render('error.hbs',{
    error: error,
    classErr: class_err,
  });
}

exports.mainpage = async function(req, res){
  if(req.session.user_id){
    await Bitch.find({owner:req.session.user_id}, function(err, bitches){
      if(err){
        console.log(err);
        return res.status = 400;
      }
    }).lean()
    .then(async function(docs){
      const user =  await User.findById(req.session.user_id);
      res.render("home.hbs", {
        bitches: docs,
        count: user.current_bitch,
      });
    });
  }
  else{
    errorPage(res, "Вы не авторизованы", "error");;
  }
}
exports.account = async function(req, res){
  if(req.session.user_id){
    await User.findById(req.session.user_id)
    .lean()
    .then(docs=>{
      console.log(docs)
      res.render("account.hbs",{
        user:[docs],
      });
    });
  }
  else{
    errorPage(res, "Вы не авторизованы", "error");
  }
}

exports.create = async function(req, res){
  if(req.session.user_id){
    const user = await User.findById(req.session.user_id);
    if(user.current_bitch >= user.max_bitch){
      errorPage(res, "Максимальное количество шлюх", "error");
      return 0;
    }

  res.render("create.hbs");
  }
  else{
    errorPage(res, "Вы не авторизованы", "error");;
  }
}

exports.create_bitch = async function(req, res){
  const user = await User.findById(req.session.user_id)
  .catch(err=>{
    console.log(err);
  });

  let filedata = req.file;
  // VALIDATION
  await body('name').isLength({min:1}).trim().escape().run(req);
  await body('second_name').isLength({min:1}).trim().escape().run(req);
  const validRes = validationResult(req);
  if(!filedata){
    res.render("create.hbs",{
      message: ['Ошибка при загрузке фото'],
      classMessage: 'message',
    });
    return 0;
  }
  if(!validRes.isEmpty()){
    res.render("create.hbs",{
      message: ['Текстовые поля не могут быть пустыми'],
      classMessage: 'message',
    });
    fs.unlink("./public/uploads/" + filedata.filename, err=>{
      console.log(err);
    });
    return 0;
  }
  let meta = '';
  if(req.body.metaBitch){
    await body('metaBitch').trim().escape().run(req);
    meta = req.body.metaBitch;
  }

  // VALIDATION END


  const bitch = new Bitch({
    name: req.body.name,
    second_name: req.body.second_name,
    owner: req.session.user_id,
    photo: 'uploads/' + filedata.filename,
    meta: meta,
  });
  await bitch.save()
  .then(async(docs)=>{
    await User.findOneAndUpdate({_id: user._id}, {$inc: {current_bitch: 1}, $push:{bitches: docs._id}});
  })
  .then(()=>{
    console.log("Added");
    res.redirect("/");
  })
  .catch(err=>{
    console.log(err);
  });
}

exports.delete_bitch = async function(req, res){
  const user = await User.findById(req.session.user_id);
  const bdid = req.body.bdid;
  await Bitch.findByIdAndDelete(bdid)
  .then(async(docs)=>{
    await User.findOneAndUpdate({_id: user._id}, {$inc: {current_bitch: -1}, $pull: {bitches: docs._id}});
    fs.unlink(docs.photo, err=>{
      console.log(err);
    });
  })
  .then(()=>{
    res.redirect("/");
  })
  .catch(err=>{
    console.log(err);
  });
}

exports.create_user = async function(req, res){
  const result = await User.findOne({login:req.body.login});
  if(result){
      res.render("registration.hbs",{
        message: ['Такой логин уже существует'],
        classMessage: "message"
      });
    return 0;
  }
  let filedata = req.file;
  // VALIDATION

  await body('login').isLength({min:1}).trim().escape().run(req);
  await body('password').isLength({min:1}).trim().escape().run(req);
  await body('configPassword').isLength({min:1}).trim().escape().run(req);
  await body('name').isLength({min:1}).trim().escape().run(req);
  const validRes = validationResult(req);

  if(!filedata){
    res.render("registration.hbs",{
      message: ['Ошибка при загрузке фото'],
      classMessage: 'message',
    });
    return 0;
  }
  if(!validRes.isEmpty()){
    res.render("registration.hbs",{
      message: ['Текстовые поля не могут быть пустыми'],
      classMessage: 'massege',
    })
    return 0;
  }
  if(req.body.password != req.body.configPassword){
    res.render("registration.hbs",{
      message: ['Пароли не совпадают'],
      classMessage: 'massege',
    })
    return 0;
  }
  let meta = '';
  if(req.body.metaUser){
    await body('metaUser').trim().escape().run(req);
    meta = req.body.metaUser;
  }

  // VALIDATION END

  const user = new User({
    login: req.body.login,
    password: req.body.password,
    name: req.body.name,
    photo: 'uploads/' + filedata.filename,
    meta: meta,
  });
  await user.save();
  req.session.user_id = user._id;
  let sesSave = new Promise(async(res,rej)=>{
    await req.session.save();
    localStorage.setItem('userLogin', 1);
    res("done");
  });
  sesSave.then(()=>{
    res.redirect('/');
  })
  .catch(err =>{
    console.log(err);
  });
}

exports.login_post = async function(req,res){
  // VALIDATION
  await body('login').isLength({min:1}).trim().escape().run(req);
  await body('password').isLength({min:1}).trim().escape().run(req);
  const validRes = validationResult(req);


  if(!validRes.isEmpty()){
    res.render("login.hbs",{
      message: ['Текстовые поля не могут быть пустыми'],
      classMessage: 'massege',
    })
    return 0;
  }


  const user = await User.findOne({login:req.body.login});
  if(!user){
    res.render("login.hbs",{
      message: ['Неправильный логин'],
      classMessage: 'massege',
    })
  }
  // VALIDATION END
  else if(req.body.password == user.password){
    req.session.user_id = user._id;
    let sesSave = new Promise(async(res,rej)=>{
      await req.session.save();
      localStorage.setItem('userLogin', 1);
      res("done");
    });
    sesSave.then(()=>{
      res.redirect('/');
    });
  }
  else{
    res.render("login.hbs",{
      message: ['Неправильный пароль'],
      classMessage: 'massege',
    })
  }
}

exports.register = function(req, res){
  if(!req.session.user_id){
    res.render("registration.hbs")
  }
  else{
    errorPage(res, "Вы уже зарегестрированы", "error");
  }
}

exports.login = function(req,res){
  if(!req.session.user_id){
    res.render("login.hbs")
  }
  else{
    errorPage(res, "Вы уже авторизованы", "error");
  }
}

exports.logout = function(req,res){
  console.log(localStorage.getItem("userLogin"));
  localStorage.removeItem('userLogin');
  req.session.destroy();
  res.redirect("/login");
}
