//jshint esversion:6
const { Client } = require('pg');

const client = new Client({
    user: 'dsaeotks',
    host: 'jelani.db.elephantsql.com',
    database: 'dsaeotks',
    password: '7jCyv7wSMTQOUTHTEsRNsvjOCOLSJ6h1',
    port: 5432,
});

// client.connect();
// const query = `
// CREATE TABLE garBAG(
//     name varchar
// )
// `;

// client.query(query, (err, res) => {
//     if (err) {
//         console.error(err);
//         return;
//     }
//     console.log('Table is successfully created');
//     client.end();
// });




const express = require("express");
const bodyParser = require("body-parser");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));
const ejs = require("ejs");

// user login/register Page
app.get("/", (req, res) => {
  res.render("login");
});

// TEMP
app.post("/", (req, res) => {
  res.redirect("/home");
});

// app.get("/home", (req, res) => {
//   res.render("homePage");
// });
// app.post("/home", (req, res) => {
//   res.redirect("/group");
// });

// app.get("/group", (req, res) => {
//   res.render("createGroup");
// });


// launching app
app.listen(3000, () => {
  console.log("server is running");
});
