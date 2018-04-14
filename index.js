const fs = require('fs');
const http = require('http');
const url = require('url');
const passport = require('passport');
const bodyparser = require ('body-parser');
const Sequelize = require("Sequelize");
const express = require("express");
const app = express();
const handlebars = require("express-handlebars").create({ defaultLayout: 'main' });
const sequelize = new Sequelize("Music", "michael", null, {
  host: "localhost",
  dialect: "sqlite",
  storage: "crudbook.sqlite",
  operatorsAliases: false
});
// const Artist = sequelize.define(
//   "Artist",
//   {
//     ArtistId: {
//       type: Sequelize.INTEGER,
//       autoIncrement: true,
//       primaryKey: true
//     },
//     Name: Sequelize.STRING
//   },
//   {
//     freezeTableName: true,
//     timestamps: false
//   }
// );
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
app.get('/', (request, response) => {
    response.render('home');
});
app.get('/about', (request, response) => {
    response.render('about');
});
app.use(express.static('views/images'));
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
