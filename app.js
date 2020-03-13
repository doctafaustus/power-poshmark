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
const favicon = require('serve-favicon');

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
  cookie: { maxAge: 86400000, secure: false, sameSite: 'Lax' }, // Set to 24 hours
  resave: false,
  saveUninitialized: true
}));
app.use(favicon(`${__dirname}/public/favicon.ico`));
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

// Cease and Desist letter 404
app.get('*', function (req, res) {
  console.log('test');
  return res.sendStatus(404);
});

// // Passport Google middleware
// passport.use(new GoogleStrategy({
//     clientID: '1018267290667-ttohl2k6fmr8h21ladnt64860nu1eak1.apps.googleusercontent.com',
//     clientSecret: GOOGLE_CLIENT_SECRET,
//     callbackURL: '/login/callback',
//     passReqToCallback : true,
//   },
//   async (req, accessToken, refreshToken, profile, done) => {
//     const actionToTake = req.query.state;

//     if (actionToTake === 'register') {

//       // First see if the user exists in the DB already
//       const userObj = { ...profile._json, creationDate: new Date().toISOString() };
//       const querySnapshot = await db.collection('paid-users').where('email', '==', profile._json.email).get();

//       // If user already exists, return the user object with a flag
//       if (querySnapshot.docs.length) {
//         const existingUser = querySnapshot.docs[0].data();
//         existingUser.err = 'has account';
//         return done(null, existingUser);
//       }

//       // Add user to DB
//       await db.collection('paid-users').doc(userObj.email).set(userObj);
//       return done(null, userObj);

//     } else if (actionToTake === 'login') {
//       console.log('login');

//       // Query DB for user
//       const querySnapshot = await db.collection('paid-users').where('email', '==', profile._json.email).get();

//       // If no user found, set error
//       if (!querySnapshot.docs.length) return done(null, { err: 'not found' });

//       // Return user with flag to send to account page
//       const user = querySnapshot.docs[0].data();
//       user.sendToAccount = true;

//       return done(null, user);
//     }
//   }
// ));
// app.get('/auth/google/:actionToTake', (req, res, next) => {
//   const { actionToTake } = req.params;
//   passport.authenticate('google', 
//   { scope: [
//     'https://www.googleapis.com/auth/plus.login',
//     'https://www.googleapis.com/auth/userinfo.profile',
//     'https://www.googleapis.com/auth/userinfo.email' ],
//     state: actionToTake,
//     prompt: 'select_account'
//   })(req, res, next);
// });

// // Google callback
// app.get('/login/callback', passport.authenticate('google', { failureRedirect: '/login-f' }), (req, res) => {

//   if (req.user.err === 'has account') {
//     return res.redirect('/?registered=true&err=has-account');
//   }

//   if (req.user.err === 'not found') {
//     return res.redirect('/account?not-found=true');
//   }

//   if (req.user.sendToAccount) {
//     console.log('sending to account page');
//     return res.redirect('/account');
//   }

//   res.redirect('/?registered=true');
// });


// Routes
// app.get('/', (req, res) => {
//   const email = req.session.passport && req.session.passport.user && req.session.passport.user.email;
//   res.render('index.ejs', { email });
// });

// app.get('/account', (req, res) => {
//   console.log('/account', req.session.passport);
//   const user = req.session.passport && req.session.passport.user;
//   res.render('account.ejs', { user });
// });

// app.get('/terms', (req, res) => {
//   console.log('/terms');
//   res.render('terms.ejs');
// });

// app.get('/logout', (req, res) => {
//   console.log('/logout');
//   req.session.destroy();
//   res.redirect('/account');
// });

// // If a status message is needed then use this route to sent it on popup open
// app.get('/status', (req, res) => {
//   console.log('/status');
//   res.json({ status: 'ok' });
//   // res.json({ status: '<span class="msg callout">test</span>' });
// });

// app.post('/check', async (req, res) => {
//   console.log('/check', req.body.sub);
//   const querySnapshot = await db.collection('paid-users').where('sub', '==', req.body.sub).get();
//   const docs = querySnapshot.docs;
//   if (!docs.length) return res.sendStatus(404);
//   const user = docs[0].data();
//   if (hasPaidPlan(user)) {
//     res.sendStatus(200);
//   } else {
//     res.sendStatus(403);
//   }
// });

// function hasPaidPlan(user) {
//   let isPaidPlan = false;

//   if (/Full/.test(user.subscription)) {
//     isPaidPlan = true;
//   } else if (user.subscription) {
//     if (Date.now() < user.subEnds) {
//       isPaidPlan = true;
//     }
//   }

//   return isPaidPlan;
// }


// // Test CC #: 4242424242424242
// app.post('/charge', async (req, res) => {
//   console.log('/charge');

//   // Check if user is logged in
//   if (!req.session.passport) {
//     return res.json({
//       message: 'Please login first.'
//     });
//   }
  
//   // Get logged in user
//   const querySnapshot = await db.collection('paid-users').where('email', '==', req.session.passport.user.email).get();
//   const docs = querySnapshot.docs;
//   if (!docs.length) {
//     return res.json({
//       message: 'Please login first.'
//     });
//   }
//   const user = docs[0].data();

//   // Check if user's subscription is active already
//   if (/^Full$/.test(user.subscription)) {
//     return res.json({
//       message: 'You already have an active subscription.'
//     });
//   }

//   // Create subscription
//   stripe.customers.create({
//     description: `PP Customer: ${user.email}`,
//     source: req.body.stripeToken,
//     email: req.body.stripeEmail
//   }, 
//   (err, customer) => {
//     if (err) {
//       console.log('Customer creation error', err);
//       return res.json({ 
//         message: 'Something went wrong. Please try again.'
//       });
//     }

//     stripe.subscriptions.create(
//       {
//         customer: customer.id,
//         plan: (process.env.PORT) ? 'plan_Ga3DLA2lqc6toq' : 'plan_GHVs8Te6sf4oFI'
//       }, 
//       async (err, subscription) => {
//         // Test CC #: 4242424242424242
//         if (err) {
//           console.log('Subscription creation error', err);
//           return res.json({ 
//             message: 'Something went wrong. Please try again or try with another credit card.'
//           });
//         }
//         console.log('Sbuscription created');

//         // Update user in DB
//         user.subscription = 'Full';
//         user.stripeSubID = subscription.id;
//         await db.collection('paid-users').doc(user.email).set(user);

//         // Save new data inside passport session object
//         req.session.passport.user = user;

//         res.json({ message: 'ok' });
//     });
//   });
// });


// app.get('/cancel-subscription', async (req, res) => {
//   console.log('/cancel-subscription');

//   if (!req.session.passport || !req.session.passport.user) {
//     return res.redirect('/account?not-found=true');
//   }

//   // Query DB for user
//   const querySnapshot = await db.collection('paid-users').where('email', '==', req.session.passport.user.email).get();

//   // If no user found, set error
//   if (!querySnapshot.docs.length) return res.redirect('/account?not-found=true');
//   const user = querySnapshot.docs[0].data();

//   console.log('USER???', user);

//   const stripeSubID = user.stripeSubID;
//   if (!stripeSubID) return res.redirect('/account?no-sub-id=true');

//   // Cancel subscription
//   stripe.subscriptions.del(
//     user.stripeSubID,
//     async (err, confirmation) => {


//       if (err) {
//         console.log('Subcription deletion error', err);
//         return res.redirect('/account?something-went-wrong=true'); 
//       }

//       console.log('confirmation', confirmation);

//       const currentPeriodEnd = Number(`${confirmation.current_period_end}000`);
//       const endDate = new Date(currentPeriodEnd).toLocaleDateString().replace(/\/20(\d\d)$/, '/$1');

//       user.subEnds = currentPeriodEnd;
//       user.subscription = `(Subscription ended ${endDate})`;

//       // Update record in DB
//       await db.collection('paid-users').doc(user.email).set(user);

//       // Reset passport session user object


//       console.log('Subscription canceled');
//       console.log({currentPeriodEnd});
//       console.log({endDate});

//       req.session.passport.user = user;

//       return res.redirect('/account?success=true');
//     }
//   );

// });
