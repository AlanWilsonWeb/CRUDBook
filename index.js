const http = require('http');
const bCrypt = require('bcrypt-nodejs');
const url = require('url');
const morgan = require('morgan');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bodyParser = require ('body-parser');
const cookieParser = require('cookie-parser');
const Sequelize = require("Sequelize");
const express = require("express");
const session = require('express-session');
const app = express();
const handlebars = require("express-handlebars").create({ defaultLayout: 'main' });
const sequelize = new Sequelize("Music", "michael", null, {
  host: "localhost",
  dialect: "sqlite",
  storage: "crudbook.sqlite",
  operatorsAliases: false
});
var urlencodedParser = bodyParser.urlencoded({ extended: false });
const User = sequelize.define(
"User",
{
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  firstName: Sequelize.STRING,
  lastName: Sequelize.STRING,
  username: Sequelize.STRING,
  password: Sequelize.STRING,
},
{
  freezeTableName: true,
  timestamps: false
}
);

const Post = sequelize.define(
"Post",
{
  ID: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  authorID: Sequelize.INTEGER,
  message: Sequelize.STRING,
  timestamp: Sequelize.DATE,
},
{
  freezeTableName: true,
  timestamps: false
}
);

//PITA JOIN CODE (Part One)
Post.belongsTo(User, {foreignKey: 'authorId'});
app.use(morgan('dev'));
app.use(passport.initialize());
app.use(passport.session());
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set("port", process.env.PORT || 8080);
app.use(express.static('views/images'));
app.use(express.static('views/css'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('connect-multiparty')());
app.use(cookieParser());
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
  }));
passport.serializeUser(function(user, done) {
  done(null, {
      ID: user["ID"],
      username: user["username"]
   }
 );
  console.log(user);
});

// passport.deserializeUser(function(user, done) {
//   done(null, user);
// });
passport.use('local', new LocalStrategy({
  usernameField: 'username',
  passwordField: 'password',
  passReqToCallback: true // allows us to pass back the entire request to the callback
  },
  function(req, username, password, done) {
    var isValidPassword = function(userpass, password) {
    return bCrypt.compareSync(password, bCrypt.hashSync(userpass));
  }
  User.findOne({
  where: {
  username: username
  }
  }).then(function(user) {
    if (!user) {
      return done(null, false, {
      message: 'USERNAME does not exist'
    });
   }
   if (!isValidPassword(user.password, password)) {
      return done(null, false, {
       message: 'Incorrect password.'
      });
   }
   var userinfo = user.get();
    return done(null, userinfo);
   }).catch(function(err) {
      console.log("Error:", err);
      return done(null, false, {
      message: 'Something went wrong with your Signin'
      });
    });
  }
));
User.sequelize.sync().then(function() {
    console.log('Database Check- OK!')
      }).catch(function(err) {
    console.log(err, "Something went wrong with the Database Update!")
});

app.get('/', (request, response) => {
    response.render('home');
});
app.get('/success', (request, response) => {
    response.render('success');
});
app.get('/login',(req, res) => {
    res.render('login');
  });
app.get('/signup',(req, res) => {
      res.render('signup');
    });
app.post('/signup', urlencodedParser, (req, res) =>{
  User.create({
    firstName: req.body.firstname,
    lastName: req.body.lastname,
    username: req.body.username,
    password: req.body.password
  })
  res.render('signupsuccess');
});
app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/login',
    })
  );
app.get('/profile',
  function(req, res){
  res.render('profile', { user: req.session.passport.user });
});
app.get('/users', (req, res) => {
  User.findAll()
    .then(users => {
      res.render('users', {
        user: users
      });
  });
});

//PITA JOIN CODE (Part Two)
app.get('/posts', (req, res) => {
  Post.findAll({ include: [User]})
    .then(posts => {
      res.render('posts', {
        post: posts
      });
  });
});
app.post('/myposts', urlencodedParser, (req, res) =>{
  Post.create({
    authorID: req.session.passport.user.ID,
    message: req.body.message
  })
  res.render('success');
});
app.get('/myposts', (req, res) => {
  Post.findAll({ include:[{
        model: User,
        where: { ID: req.session.passport.user.ID }
    }]
})
    .then(posts => {
      res.render('myposts', {
        post: posts
      });
  });
});

app.listen(app.get("port"), () => {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      "; press Ctrl-C to terminate."
  );
});

app.use((request, response) => {
    response.status(404);
    response.render('404');
  });
