// Core modules
const express = require('express');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');


// Express
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(sassMiddleware({
  src: path.join(__dirname, '/public/sass'),
  dest: path.join(__dirname, '/public')
}));
app.use(express.static(path.join(__dirname, 'public')));
app.listen(process.env.PORT || 3000, (req, res) => {
  console.log('App listening on port 3000');
});


// Routes
app.get('/', (req, res) => {
  res.render('index.ejs');
});