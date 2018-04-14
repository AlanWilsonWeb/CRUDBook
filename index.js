const fs = require('fs');
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
const passportLocalSequelize = require('passport-local-sequelize');
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

passportLocalSequelize.attachToUser(User, {
    username: 'username',
    ID: 'ID',
    password: 'password'
});
//PITA JOIN CODE (Part One)
Post.belongsTo(User, {foreignKey: 'authorId'});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set("port", process.env.PORT || 8080);
app.use(express.static('views/images'));
app.use(express.static('views/css'));
app.use(bodyParser());
app.use(cookieParser());
app.use(session({ secret: 'super-secret' }));
app.get('/', (request, response) => {
    response.render('home');
});
app.get('/login',(req, res) => {
    res.render('login');
  });
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),(req, res) => {
    res.redirect('/posts');
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

app.use(passport.initialize());
app.use(passport.session());

passport.use(User.createStrategy());
// passport.use(new Strategy(
//   function(username, password, done) {
//     User.findOne({ username: username }, (err, user) => {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       if (!user.verifyPassword(password)) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));

passport.serializeUser((user, done) => {
    done(null, user.id)
});

passport.deserializeUser((id, done) => {
    User.findAll({ where: {
        ID: id
    }}, (err, user) => {
        if(err || !user ) return done(err, null);
        done(null, user);
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
