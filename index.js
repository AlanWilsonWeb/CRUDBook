const http = require('http');
const url = require('url');
const passport = require('passport');
const Strategy = require('passport-local').Strategy;
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

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set("port", process.env.PORT || 8080);
app.use(express.static('views/images'));
app.use(express.static('views/css'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser());

passport.use(new Strategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function(username, password, done) {
    User.findOne({where: {username: username}}, function (err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false); }
      if (!user.verifyPassword(password)) { return done(null, false); }
      return done(null, user);
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.find({where: {ID: id}}).success(function(user){
    done(null, user);
  }).error(function(err){
    done(err, null);
  });
});

app.use(passport.initialize());
app.use(passport.session());

app.get('/', (request, response) => {
    response.render('home');
});
app.get('/login',(req, res) => {
    res.render('login');
  });
  app.post('/login',
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
      res.redirect('/');
    });
app.get('/profile', (request, response) => {
    response.render('profile', { user: req.user });
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
