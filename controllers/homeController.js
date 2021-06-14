const Bitch = require("../models/bitch.js");
const User = require("../models/user.js");

// валидатор
const {body, validationResult} = require("express-validator");
const fs = require("fs");
const fetch = require("node-fetch");
const config = require("../config.js");


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

  // объявление нужных полей
  let name = '';
  let second_name = '';
  let photo = '';
  let owner = req.session.user_id;
  let meta = '';

  // если добавлено вручную
  if(req.body.switcher == 'default'){
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
    if(req.body.metaBitch){
      await body('metaBitch').trim().escape().run(req);
      meta = req.body.metaBitch;
    }
    let name = req.body.name;
    let second_name = req.body.second_name;
    let photo = 'uploads/' + filedata.filename;
    // VALIDATION END

  }
  // если добавлено через вк
  else if (req.body.switcher == 'vk') {

    // VALIDATION
    await body("urlvk").isLength({min:1}).trim().escape().run(req);
    const validRes = validationResult(req);
    if(!validRes.isEmpty){
      res.render("create.hbs",{
        message: ['Текстовые поля не могут быть пустыми'],
        classMessage: 'message',
      });
      return 0;
    }
    // если не налось вк в ссылке
    let urlvkindex = req.body.urlvk.indexOf('vk.com&#x2F;');
    if(urlvkindex < 0){
      res.render("create.hbs",{
        message: ['Проверьте правильность введённой ссылки'],
        classMessage: 'message',
      });
      return 0;
    }

    // VALIDATION END
    const urlvk = req.body.urlvk.slice(urlvkindex+12);
    await fetch(`https://api.vk.com/method/users.get?user_ids=${urlvk}&fields=bdate,photo_200&access_token=${config.access_token}&v=5.131&lang=ru`)
    .then(async docs=>{
      let {response} = await docs.json();
      let ans = response[0];
      name = ans.first_name;
      second_name = ans.last_name;
      photo = ans.photo_200;
      meta = 'vk.com/' + urlvk;
    })
    .catch(err=>{
      console.log(err);
      res.render("create.hbs",{
        message: ['Проверьте правильность введённой ссылки'],
        classMessage: 'message',
      });
      return 0;
    })
  }


  const bitch = new Bitch({
    name: name,
    second_name: second_name,
    owner: owner,
    photo: photo,
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

exports.change_bitch = async function(req, res){
  if(req.query.token == 1){
    bitch = await Bitch.findById(req.query.bdid)
    .lean()
    .then(docs=>{
      if(docs.owner == req.session.user_id){
        res.render('change_bitch.hbs',{
          obj: docs,
        });
      }
      else{
        res.redirect('/');
      }
      return 0;
    });
  }
  else{
    res.redirect('/');
  }
}

exports.change_bitch_save = async function(req,res){
  // объявление нужных полей
  let name = req.body.name;
  let second_name = req.body.second_name;
  let owner = req.session.user_id;
  let meta = req.body.meta;
  let photo = req.body.avatar_save


    let filedata = req.file;
    // VALIDATION
    await body('name').isLength({min:1}).trim().escape().run(req);
    await body('second_name').isLength({min:1}).trim().escape().run(req);
    const validRes = validationResult(req);
    if(filedata){
      fs.unlink("./public/" + photo, err=>{
        console.log(err);
      });
      photo = 'uploads/' + filedata.filename;
    }
    if(!validRes.isEmpty()){
      if(filedata){
        fs.unlink("./public/uploads/" + filedata.filename, err=>{
          console.log(err);
        });
      }
      let bitch = await Bitch.findById(req.body.bdid)
      .lean()
      .then(docs=>{
        console.log(req.body.metaBitch);
        console.log(docs);
        res.render('change_bitch.hbs',{
          message: ['Текстовые поля не могут быть пустыми'],
          classMessage: 'message',
          obj: docs,
        });
      });
      console.log(validRes);
      return 0;
    }
    console.log(photo);
    if(req.body.metaBitch){
      await body('metaBitch').trim().escape().run(req);
      meta = req.body.metaBitch;
    }
    name = req.body.name;
    second_name = req.body.second_name;
    // VALIDATION END
    await Bitch.updateOne({_id: req.body.bdid, owner: req.session.user_id}, {name: name, second_name:second_name, meta:meta, photo:photo})
    .then(()=>{
      res.redirect('/');
    })
    .catch(err=>{
      console.log(err);
    })
}

exports.change_user = function(req,res){
  let user = User.findById(req.session.user_id)
  .lean()
  .then(docs=>{
    res.render("change_user.hbs",{
      obj: docs,
    });
  });
}

exports.change_user_save = async function(req,res){
  // объявление нужных полей
  let name = req.body.name;
  let meta = req.body.metaUser;
  let password = req.body.password;
  let cpassword = req.body.configPassword;
  let photo = req.body.avatar_save;


    let filedata = req.file;
    // VALIDATION
    await body('name').isLength({min:1}).trim().escape().run(req);
    await body('password').isLength({min:1}).trim().escape().run(req);
    await body('configPassword').isLength({min:1}).trim().escape().run(req);
    const validRes = validationResult(req);
    if(filedata){
      fs.unlink("./public/" + photo, err=>{
        console.log(err);
      });
      photo = 'uploads/' + filedata.filename;
    }
    if(!validRes.isEmpty()){
      if(filedata){
        fs.unlink("./public/uploads/" + filedata.filename, err=>{
          console.log(err);
        });
      }
      let bitch = await User.findById(req.session.user_id)
      .lean()
      .then(docs=>{
        res.render('change_user.hbs',{
          message: ['Текстовые поля не могут быть пустыми'],
          classMessage: 'message',
          obj: docs,
        });
      });
      console.log(validRes);
      return 0;
    }
    if(req.body.metaUser){
      await body('metaUser').trim().escape().run(req);
      meta = req.body.metaUser;
    }
    if(password !=cpassword){
      let bitch = await User.findById(req.session.user_id)
      .lean()
      .then(docs=>{
        res.render('change_user.hbs',{
          message: ['Пароли не совпадают'],
          classMessage: 'message',
          obj: docs,
        });
      });
      return 0;
    }
    name = req.body.name;
    // VALIDATION END
    await User.updateOne({_id: req.session.user_id}, {name: name, meta:meta, photo:photo, password:password})
    .then(()=>{
      res.redirect('/account');
    })
    .catch(err=>{
      console.log(err);
    })
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
      classMessage: 'message',
    })
    return 0;
  }
  if(req.body.password != req.body.configPassword){
    res.render("registration.hbs",{
      message: ['Пароли не совпадают'],
      classMessage: 'message',
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
      classMessage: 'message',
    })
    return 0;
  }


  const user = await User.findOne({login:req.body.login});
  if(!user){
    res.render("login.hbs",{
      message: ['Неправильный логин'],
      classMessage: 'message',
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
      classMessage: 'message',
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
