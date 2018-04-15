const http = require('http');
const bCrypt = require('bcrypt-nodejs');
const url = require('url');
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
app.use(passport.initialize());
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
  cookie: {
    httpOnly: true,
    secure: false
  }
}));
// passport.use(new LocalStrategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, function (err, user) {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       if (!user.verifyPassword(password)) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});
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
app.get('/login',(req, res) => {
    res.render('login');
  });
app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/profile',
      failureRedirect: '/login',
      })
  );
app.get('/profile', (request, response) => {
    response.render('profile');
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
