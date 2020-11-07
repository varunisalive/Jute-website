//The main file

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const passport = require("passport");
const session = require("express-session");
const passportLocalMongoose = require("passport-local-mongoose");
const uniqueValidator = require("mongoose-unique-validator");
var router  = express.Router();
// const GoogleStrategy = require('passport-google-oauth20').Strategy;
// const findOrCreate = require("mongoose-findorcreate");


const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(session({
  secret: "Keep this a secret.",
  resave: false,
  saveUninitialized: false
}));

// flash message middleware
app.use(function(req, res, next){
  res.locals.message = req.session.message;
  delete req.session.message;
  next();
});

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/usersDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);

const formSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  formTitle: {type: String, unique: true},
  startDate: {type: Date, required: true},
  endDate: {type: Date, required: true},
  juteTypes: {
    whiteJute: {type: String},
    tossaJute: {type: String},
    mestaJute: {type: String},
    juteCuttings: {type: String}
  },
  areaOfLandOwned: {type: Number},
  areaOfLandUsed: {type: Number},
  labourersHired: {type: Number},
  labourersWagePerDay: {type: Number},
  farmLandRent: {type: Number},
  Expenses: {
    godownRent: {type: Number},
    seedsCost: {type: Number},
    plantProtectionChemicalCost: {type: Number},
    farmYardManureCost: {type: Number},
    fertilizersCost: {type: Number},
    ploughingCost: {type: Number},
    irrigationCost: {type: Number},
    harvestingCost: {type: Number},
    transportCost: {type: Number}
  },
  sellingPricePerUnit: {type: Number},
  discounts: {type: Number},
  totalUnitsProduced: {type: Number},
  totalUnitsSold: {type: Number},
  leftoverUnits: {type: Number},
  leftoverUnitsPrice: {type: Number},
  totalSales: {type: Number},
  expectedNetIncome: {type: Number},
  netIncome: {type: Number}
});

const userSchema = new mongoose.Schema({
  userInfo: {
    fullName: String
  },
  username: {
    type: String,
    unique: true
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String
  },
  forms: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
});


userSchema.plugin(passportLocalMongoose);
// userSchema.plugin(findOrCreate);
userSchema.plugin(uniqueValidator, {message: 'is already taken.'});

const Form = new mongoose.model("Form", formSchema);
const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

// GOOGLE OAUTH ---> Register & Login
//
// passport.use(new GoogleStrategy({
//     clientID: process.env.CLIENT_ID,
//     clientSecret: process.env.CLIENT_SECRET,
//     callbackURL: "http://localhost:3000/auth/google/main",
//     userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
//   },
//   function(accessToken, refreshToken, profile, cb) {
//     User.findOrCreate({ googleId: profile.id }, function (err, user) {
//       return cb(err, user);
//     });
//   }
// ));
//

// HOME --> GET method

app.get("/", function(req, res){
  res.render("home", {
    currentUser: req.user
  });
});

// GOOGLE OAUTH ROUTE (GET method)

// app.get("/auth/google",
//   passport.authenticate("google", {scope: ["profile"]})
// );
//
// app.get("/auth/google/main",
//   passport.authenticate('google', { failureRedirect:"/login" }),
//   function(req, res) {
//     res.redirect("/main");
// });

// LOGIN ---> GET & POST method

app.get("/login", function(req, res){
  res.render("login", {
    currentUser: req.user
  });
});

app.post("/login", function(req, res){

  if(req.body.username == "" || req.body.password == "" ) {

    req.session.message = {
      type: "danger",
      intro: "Empty Fields!",
      message: "Please insert the required information to login."
    }
    res.redirect("/login");
  } else {

    req.session.message = {
      type: "success",
      intro: "You have been logged in successfully!",
      message: ""
    }
  }

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
    if(err) {
      console.log(err);
      res.redirect("/login");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/main");
      });
    }
  });
});

// REGISTER ---> GET & POST method

app.get("/register", function(req, res){
  res.render("register", {
    currentUser: req.user
  });
});

app.post("/register", function(req, res){

  if(req.body.fullName == "" || req.body.username == "" || req.body.email =="" || req.body.password == "" ) {

    req.session.message = {
      type: "danger",
      intro: "Empty Fields!",
      message: "Please insert the required information to get registered."
    }
    res.redirect("/register");
  } else {

    req.session.message = {
      type: "success",
      intro: "You have been registered successfully!",
      message: ""
    }
  }

  var Users = new User({
    username: req.body.username,
    email: req.body.email,
    userInfo: {
      fullName: req.body.fullName
    }
  });

  const password = req.body.password;

  User.register(Users, password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/register");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/main");
      });

    }
  });
});

// LOGOUT ---> GET method (from main.ejs)

app.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
})

// MAIN PAGE ---> GET & POST method

app.get("/main", function(req, res){
  if(req.isAuthenticated()){
    res.render("main", {
      currentUser: req.user
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/main", function(req, res){

  // user_id
  const user = req.user.id;
  // form_info
  const formTitle = req.body.formTitle;
  const startDate = req.body.startDate;
  const endDate = req.body.endDate;
  // Jute types
  const whiteJute = req.body.whiteJute;
  const tossaJute = req.body.tossaJute;
  const mestaJute = req.body.mestaJute;
  const juteCuttings = req.body.juteCuttings;
  // Area & expenses
  const areaOfLandOwned = req.body.areaOfLandOwned;
  const areaOfLandUsed = req.body.areaOfLandUsed;
  const labourersHired = req.body.labourersHired;
  const labourersWagePerDay = req.body.labourersWagePerDay;
  const farmLandRent = req.body.farmLandRent;
  // More Expenses
  const godownRent = req.body.godownRent;
  const seedsCost = req.body.seedsCost;
  const plantProtectionChemicalCost = req.body.ppcCost;
  const farmYardManureCost = req.body.fymCost;
  const fertilizersCost = req.body.fertilizerCost;
  const ploughingCost = req.body.ploughingCost;
  const irrigationCost = req.body.irrigationCost;
  const harvestingCost = req.body.harvestingCost;
  const transportCost = req.body.transportCost;
  //Sales
  const sellingPricePerUnit = req.body.sellingPricePerUnit;
  const discounts = req.body.discounts;
  const totalUnitsProduced = req.body.totalUnitsProduced;
  const totalUnitsSold = req.body.totalUnitsSold;
  const totalSales = req.body.totalSales;

  //Calculate number of days
  function days(startDate, endDate){
    var date1 = new Date(startDate);
    var date2 = new Date(endDate);
    return (date2-date1)/(1000*3600*24);
  }

  //Total wage of Labourers from *Date1* to *Date2*
  var labourersTotalWage = parseFloat(labourersWagePerDay) * days(startDate, endDate);

  //Total expense of hiring the labourers
  var totalLabourersExpense = parseFloat(labourersHired) * labourersTotalWage;

  //Rest of the expenses
  var expenses = parseFloat(farmLandRent) + parseFloat(godownRent) + parseFloat(seedsCost) + parseFloat(plantProtectionChemicalCost) + parseFloat(farmYardManureCost) + parseFloat(fertilizersCost) + parseFloat(ploughingCost) + parseFloat(irrigationCost) + parseFloat(harvestingCost) + parseFloat(transportCost) + parseFloat(farmLandRent) + parseFloat(discounts);

  //Total Expenses
  var totalExpenses = totalLabourersExpense + expenses;

  //Total Sales based on Selling Price Per unit
  var expectedSales = parseFloat(sellingPricePerUnit) * parseFloat(totalUnitsSold);

  //Leftover units of jute
  var leftoverUnits = parseFloat(totalUnitsProduced) - parseFloat(totalUnitsSold);
  var leftoverUnitsPrice = parseFloat(sellingPricePerUnit) * leftoverUnits;

  //The Net Income based on Selling Price per unit
  var expectedNetIncome = expectedSales - totalExpenses;

  //The actual Net Income
  var netIncome = parseFloat(totalSales) - totalExpenses;


  Form.insertMany([{
    user: user,
    formTitle: formTitle,
    startDate: startDate,
    endDate: endDate,
    juteTypes: {
      whiteJute: whiteJute,
      tossaJute: tossaJute,
      mestaJute: mestaJute,
      juteCuttings: juteCuttings
    },
    areaOfLandOwned: areaOfLandOwned,
    areaOfLandUsed: areaOfLandUsed,
    labourersHired: labourersHired,
    labourersWagePerDay: labourersWagePerDay,
    farmLandRent: farmLandRent,
    Expenses: {
      godownRent: godownRent,
      seedsCost: seedsCost,
      plantProtectionChemicalCost: plantProtectionChemicalCost,
      farmYardManureCost: farmYardManureCost,
      fertilizersCost: fertilizersCost,
      ploughingCost: ploughingCost,
      irrigationCost: irrigationCost,
      harvestingCost: harvestingCost,
      transportCost: transportCost
    },

    sellingPricePerUnit: sellingPricePerUnit,
    discounts: discounts,
    totalUnitsProduced: totalUnitsProduced,
    totalUnitsSold: totalUnitsSold,
    totalSales: totalSales,
    leftoverUnits: leftoverUnits,
    leftoverUnitsPrice: leftoverUnitsPrice,
    expectedNetIncome: expectedNetIncome,
    netIncome: netIncome
}], function(err, result){
    if(err){
      console.log(err);
    } else {
      res.redirect("/results");
    }
  });
});

//Result of the form
app.get("/results", function(req, res){

  Form.find().sort({ _id: -1 }).limit(1).exec(function(err, post){
    if(err) {
      console.log(err);
    } else {
      if(post){
        res.render("results", {
          currentUser: req.user,
          userForm: post
        });
      }
    }
  });
});

// Profile ---> GET Method

app.get("/profile/:userID", function(req, res){

  const requestedUserID = req.params.userID;

  Form.find({user: requestedUserID}).sort({ _id: -1 }).exec(function(err, foundForms){
    if(err){
      console.log(err);
    } else {
      if(foundForms){
        res.render("profile", {
          userForms: foundForms,
          currentUser: req.user
        });
      }
    }
  });
});

app.listen(3000, function(req, res){
  console.log("The server is ready at port 3000");
});
