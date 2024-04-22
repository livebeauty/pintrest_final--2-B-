var express = require('express');
var router = express.Router();
const userModals = require("./users");
const postModals = require("./post");
const passport = require('passport');
const upload = require("./multer")

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModals.authenticate()))

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { nav: false });
});

router.get('/register', function(req, res, next) {
  res.render("register", { nav: false });
});

/* GET home page. */

router.get('/profile',isLoggedIn,async function(req, res, next) {
  const user =
  await userModals
        .findOne({username: req.session.passport.user})
        .populate("posts")
  res.render("profile",{user,nav: true});
});

router.get('/show/posts',isLoggedIn,async function(req, res, next) {
  const user =
  await userModals
        .findOne({username: req.session.passport.user})
        .populate("posts")
  res.render("show",{user,nav: true});
});


router.get('/feed',isLoggedIn,async function(req, res, next) {
  const user = await userModals.findOne({username: req.session.passport.user})
  const posts = await postModals.find()
  .populate("user")
  res.render("feed",{user,posts, nav: true});
});

router.get('/add',isLoggedIn,async function(req, res, next) {
  const user = await userModals.findOne({username: req.session.passport.user});
  res.render("add",{user,nav: true});
});

router.post("/createpost",isLoggedIn ,upload.single("postimage"),async function(req,res,next) {
  const user = await userModals.findOne({username: req.session.passport.user});
  const post = await postModals.create({
    user: user._id,
    title: req.body.title,
    description: req.body.description,
    image: req.file.filename
  });
  user.posts.push(post._id)
  await user.save();
  res.redirect("/profile")
})

router.post('/register', function(req, res) {
  const data = new userModals({
    username: req.body.username,
    name: req.body.fullname,
    email:req.body.email,
    contact:req.body.contact,
  })

  userModals.register(data, req.body.password)
  .then(function() {
     passport.authenticate("local")(req,res,function() {
        res.redirect("/profile")
     })
  })
});

router.post("/fileupload",isLoggedIn ,upload.single("image"),async function(req,res,next) {
   const user = await userModals.findOne({username: req.session.passport.user});
   user.profileImage = req.file.filename;
   await user.save();
   res.redirect("/profile")
})

router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/",
  failureFlash: true,
}),function (req,res,next) {   
});

router.get("/logout", function(req,res) {
  req.logout(function(err) {
     if (err) { return next(err); }
     res.redirect('/');
   });
})

function isLoggedIn(req,res,next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/');
}

module.exports = router;
