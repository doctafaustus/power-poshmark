// Core modules
const express = require('express');
const session = require('express-session');
const path = require('path');
const sassMiddleware = require('node-sass-middleware');
const fs = require('fs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const admin = require('firebase-admin');
const bodyParser = require('body-parser');

// Global constans
const GOOGLE_CLIENT_SECRET = process.env.PORT ? process.env.GOOGLE_CLIENT_SECRET : fs.readFileSync(`${__dirname}/private/google_client_secret.txt`).toString();
let serviceAccount = process.env.SERVICE_ACCOUNT_KEY;
if (!process.env.PORT) {
  serviceAccount = require('./private/serviceAccountKey.json');
} else {
  serviceAccount = JSON.parse(serviceAccount);
}
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

// Stripe
const stripeSK = process.env.PORT ? process.env.STRIPE_LIVE_SK : fs.readFileSync(`${__dirname}/private/stripe_test_secret_key.txt`).toString();
const stripe = require('stripe')(stripeSK);




// Express
const app = express();
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(sassMiddleware({
  src: path.join(__dirname, '/public/sass'),
  dest: path.join(__dirname, '/public')
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '1mb' }));
app.use(session({
  secret: 'cj-the-cat',
  cookie: { maxAge: 31556952000, secure: false },
  resave: false,
  saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => {
  done(null, user);
});
passport.deserializeUser((user, done) => {
  done(null, user);
});
app.listen(process.env.PORT || 3000, (req, res) => {
  console.log('App listening on port 3000');
});



// Passport Google middleware
passport.use(new GoogleStrategy({
    clientID: '1018267290667-ttohl2k6fmr8h21ladnt64860nu1eak1.apps.googleusercontent.com',
    clientSecret: GOOGLE_CLIENT_SECRET,
    callbackURL: '/login/callback',
    passReqToCallback : true,
  },
  async (req, accessToken, refreshToken, profile, done) => {
    console.log('done!');
    const actionToTake = req.query.state;

    if (actionToTake === 'register') {

      // First see if the user exists in the DB already
      const userObj = {...profile._json, creationDate: new Date().toISOString()};
      const querySnapshot = await db.collection('paid-users').where('email', '==', profile._json.email).get();

      if (querySnapshot.docs.length) return done(null, { err: 'has-account' });

      // Add user to DB
      await db.collection('paid-users').doc(userObj.email).set(userObj);
      return done(null, userObj);

    } else if (actionToTake === 'login') {
      console.log('login');
    }
  }
));
app.get('/auth/google/:actionToTake', (req, res, next) => {
  const { actionToTake } = req.params;
  passport.authenticate('google', 
  { scope: [
    'https://www.googleapis.com/auth/plus.login',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email' ],
    state: actionToTake,
    prompt: 'select_account'
  })(req, res, next);
});

// Google callback
app.get('/login/callback', passport.authenticate('google', { failureRedirect: '/login-f' }), (req, res) => {
  console.log('/callback', req.user);

  if (req.user.err) {
    console.log('EROR!!!!', req.user.err);
    return res.redirect(`/?error=${req.user.err}`);
  }

  res.redirect('/?registered=true');
});


// Routes
app.get('/', (req, res) => {
  console.log('PASSPORT', req.session.passport);
  const email = req.session.passport && req.session.passport.user && req.session.passport.user.email;
  res.render('index.ejs', { email });
});


// Test CC #: 4242424242424242
app.post('/charge', async (req, res) => {
  console.log('/charge');

  // Check if user is logged in
  // if (!req.session.passport) {
  //   return res.json({
  //     message: 'Please login first.'
  //   });
  // }
  
  // Get logged in user
  const querySnapshot = await db.collection('paid-users').where('email', '==', 'wcoloe@gmail.com').get();
  const docs = querySnapshot.docs;
  if (!docs.length) {
    return res.json({
      message: 'Please login first.'
    });
  }
  const user = docs[0].data();

  // Check if user's subscription is active already
  if (/full/.test(user.subscription)) {
    return res.json({
      message: 'You already have an active subscription.'
    });
  }

  // Create subscription
  stripe.customers.create({
    description: `PP Customer: ${user.email}`,
    source: req.body.stripeToken,
    email: req.body.stripeEmail
  }, 
  (err, customer) => {
    if (err) {
      console.log('Customer creation error', err);
      return res.json({ 
        message: 'Something went wrong. Please try again.'
      });
    }

    stripe.subscriptions.create(
      {
        customer: customer.id,
        plan: (process.env.PORT) ? '' : 'plan_GHVs8Te6sf4oFI'
      }, 
      async (err, subscription) => {
        // Test CC #: 4242424242424242
        if (err) {
          console.log('Subscription creation error', err);
          return res.json({ 
            message: 'Something went wrong. Please try again or try with another credit card.'
          });
        }
        console.log('subscription created!!~~', subscription);

        // Update user in DB
        user.subscription = 'full';
        user.stripeSubID = subscription.id;
        await db.collection('paid-users').doc(user.email).set(user);
        res.json({ message: 'ok' });
    });
  });


});

