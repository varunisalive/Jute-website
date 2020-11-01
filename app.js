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
  formTitle: {type: String},
  startDate: {type: Date},
  endDate: {type: Date},
  juteTypes: {
    whiteJute: {type: String},
    tossaJute: {type: String},
    mestaJute: {type: String},
    juteCuttings: {type: String}
  },
  areaOfLandOwned: {
    type: Number,
    description: "sq ft."
  },
  areaOfLandUsed: {
    type: Number,
    description: "sq ft."
  },
  labourersHired: {type: Number},
  labourersWagePerDay: {
    type: Number,
    description: "Rupees"
  },
  farmLandRent: {
    type: Number,
    description: "Rupees"
  },
  Expenses: {
    godownCost: {
      type: Number,
      description: "Rupees"
    },
    seedsCost: {
      type: Number,
      description: "Rupees"
    },
    plantProtectionChemicalCost: {
      type: Number,
      description: "Rupees"
    },
    farmYardManureCost: {
      type: Number,
      description: "Rupees"
    },
    FertilizersCost: {
      type: Number,
      description: "Rupees"
    },
    ploughingCost: {
      type: Number,
      description: "Rupees"
    },
    irrigationCost: {
      type: Number,
      description: "Rupees"
    },
    harvestingCost: {
      type: Number,
      description: "Rupees"
    },
    transportCost: {
      type: Number,
      description: "Rupees"
    }
  },
  costPerUnit: {
    type: Number,
    description: "Rupees"
  },
  profitMarginPerUnit: {
    type: Number,
    description: "Rupees"
  },
  totalSales: {
    type: Number,
    description: "Rupees"
  },
  totalProfit: {
    type: Number,
    description: "Rupees"
  }
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
      message: "login to enter."
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
        res.redirect("/login");
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
  const godownCost = req.body.godownCost;
  const seedsCost = req.body.seedsCost;
  const plantProtectionChemicalCost = req.body.pptCost;
  const farmYardManureCost = req.body.fymCost;
  const fertilizersCost = req.body.fertilizersCost;
  const ploughingCost = req.body.ploughingCost;
  const irrigationCost = req.body.irrigationCost;
  const harvestingCost = req.body.harvestingCost;
  const transportCost = req.body.transportCost;
  //Sales
  const costPerUnit = req.body.costPerUnit;
  const profitMarginPerUnit = req.body.profitMarginPerUnit;
  const totalSales = req.body.totalSales;



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
      godownCost: godownCost,
      seedsCost: seedsCost,
      plantProtectionChemicalCost: plantProtectionChemicalCost,
      farmYardManureCost: farmYardManureCost,
      fertilizersCost: fertilizersCost,
      ploughingCost: ploughingCost,
      irrigationCost: irrigationCost,
      harvestingCost: harvestingCost,
      transportCost: transportCost
    },
    costPerUnit: costPerUnit,
    profitMarginPerUnit: profitMarginPerUnit,
    totalSales: totalSales,
    // totalProfit: req.body.formTitle
}], function(err, result){
    if(err){
      console.log(err);
    } else {
      res.redirect("/main");
    }
  });
});

// Profile ---> GET Method

app.get("/profile/:userID", function(req, res){

  const requestedUserID = req.params.userID;
  console.log(requestedUserID);

  Form.find({_id: requestedUserID}, function(err, foundForms){
    if(err){
      console.log(err);
    } else {
      if(foundForms){
        res.render("profile", {
          currentUser: req.user,
          userForms: foundForms
        });
      }
    }
  });
});

app.listen(3000, function(req, res){
  console.log("The server is ready at port 3000");
});
