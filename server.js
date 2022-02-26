//jshint esversion:6

const { Client } = require('pg');
const client = new Client({
    user: 'dsaeotks',
    host: 'jelani.db.elephantsql.com',
    database: 'dsaeotks',
    password: '7jCyv7wSMTQOUTHTEsRNsvjOCOLSJ6h1',
    port: 5432,
});

client.connect();
const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));
const ejs = require("ejs");

// user login/register Page
app.get("/", (req, res) => {
  let login_reg_status = {
    status: "fine"
  };
  res.render("login", {status: JSON.stringify(login_reg_status)});
});

// user post request
app.post("/", (req, res) => {

  login_register(req, res);
});

function login_register(req, res){
  // grad the login info
  let loginEmail = req.body.loginEmail;
  let loginPass = req.body.loginPassword;

  // grab the reg info
  let regEmail = req.body.registerEmail;
  let regPass = req.body.registerPassword;
  let first = req.body.first;
  let last = req.body.last;

  // did the user register?
  if (Object.keys(req.body).includes("registerBtn")){
    // create a query
    const query = "INSERT INTO users(email, password, first, last, bio, status, location, cubVotes) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";
    const values = [regEmail, regPass, first, last, "", false, "", 0];

    // execute insertion
    client.query(query, values, (err, response) => {
      // if an error happens, the user is trying to use an email that already exists
      if (err) {
        console.log(err.stack);
        let login_reg_status = {
          status: "register-fail"
        };
        // send back to the login page
        res.render("login", {status: JSON.stringify(login_reg_status)});
      }
      // register succuessful
      else {
        console.log(response.rows[0]);
        let login_reg_status = {
          status: "register-success"
        };
        // send back to the login page
        res.render("login", {status: JSON.stringify(login_reg_status)});
      }
    });
  }
  // otherwise the user is trying to login
  else {
    const query = "SELECT email, password FROM users WHERE email = $1 AND password = $2";
    const values = [loginEmail, loginPass];

    client.query(query, values, (err, response) => {
      if (err) console.log(err.stack);
      else {
        if (response.rows.length == 0){
          let login_reg_status = {
            status: "login-fail"
          };
          res.render("login", {status: JSON.stringify(login_reg_status)});
        }
        else {
          console.log(response.rows);
          res.redirect("/home");
        }
      }
    });
  }
}




app.get("/home", (req, res) => {
  res.render("homePage");
});
app.post("/home", (req, res) => {
  res.redirect("/group");
});

app.get("/group", (req, res) => {
  res.render("createGroup");
});


// added server port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started on port 3000");
});
