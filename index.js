const fs = require('fs');
const http = require('http');
const url = require('url');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const bodyparser = require ('body-parser');
const Sequelize = require("Sequelize");
const express = require("express");
const app = express();
const handlebars = require("express-handlebars").create({ defaultLayout: 'main' });
const sequelize = new Sequelize("Music", "michael", null, {
  host: "localhost",
  dialect: "sqlite",
  storage: "chinook.sqlite",
  operatorsAliases: false
});
const Artist = sequelize.define(
  "Artist",
  {
    ArtistId: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    Name: Sequelize.STRING
  },
  {
    freezeTableName: true,
    timestamps: false
  }
);
const Album = sequelize.define(
"Album",
{
  AlbumId: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  ArtistId: Sequelize.INTEGER,
  Title: Sequelize.STRING
},
{
  freezeTableName: true,
  timestamps: false
}
);
//PITA JOIN CODE (Part One)
Album.belongsTo(Artist, {foreignKey: 'ArtistId'});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set("port", process.env.PORT || 8080);
app.get('/', (request, response) => {
    response.render('home');
});
app.get('/about', (request, response) => {
    response.render('about');
});
app.get('/beginning', (request, response) => {
    response.render('beginning');
});
app.use(express.static('views/images'));

//PITA JOIN CODE (Part Two)
app.get('/album', (req, res) => {
  Album.findAll({ include: [Artist]})
    .then(albums => {
      res.render('album', {
        albums: albums
      });
  });
});

app.use((request, response) => {
    response.status(404);
    response.render('404');
});

app.listen(app.get("port"), () => {
  console.log(
    "Express started on http://localhost:" +
      app.get("port") +
      "; press Ctrl-C to terminate."
  );
});

passport.use(new FacebookStrategy({
    clientID: '428272014288040',
    clientSecret: 'fe15c18d2ae3cf436c0f11e35b4913ca',
    callbackURL: 'http://localhost:8080/auth/facebook/callback'
  },
  function(accessToken, refreshToken, profile, done) {
    // User.findOrCreate('...', function(err, user) {
    //   if (err) { return done(err); }
    //   done(null, user);
    // });
    console.log(profile)
    done(profile)
  }
));

// Redirect the user to Facebook for authentication.  When complete,
// Facebook will redirect the user back to the application at
//     /auth/facebook/callback
app.get('/auth/facebook', passport.authenticate('facebook'));

// Facebook will redirect the user to this URL after approval.  Finish the
// authentication process by attempting to obtain an access token.  If
// access was granted, the user will be logged in.  Otherwise,
// authentication has failed.
app.get('/auth/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect: '/album',
    failureRedirect: '/'
    }));
