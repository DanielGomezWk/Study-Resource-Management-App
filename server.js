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
const session = require("express-session");
const app = express();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));
app.use(session({secret: 'ssshhhhhh'}));
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

app.get("/home", (req, res) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const values = [req.session.email];
  client.query(query, values, (err, response) => {
    if (err) console.log(err);
    else {
      res.render("homePage", {user: JSON.stringify(response.rows[0])});
    }
  });
});

app.post("/home", (req, res) => {
  res.redirect("/group");
});

//group home page (currently make group page)
app.get("/group", (req, res) => {
  console.log(req);
  console.log("AYYY");
  res.render("createGroup");
});
//make group post request
app.post("/group", (req, res) => {
  makeGroup(req, res);
});

app.get("/groupMenuPage", (req, res) => {
  const query = "SELECT * FROM group_ WHERE private = false";
  client.query(query, (err, response) => {
    if (err) console.log(err.stack);
    else {
      console.log(response.rows);
      res.render("groupMenuPage", {groups: response.rows});
    }
  });
});

app.post("/groupMenuPage", (req, res) => {
  let id = req.body.group_id;

  res.redirect("/groupPage/" + id);
});

app.get("/groupPage/:groupID", (req, res) => {
  // save the group_id
  const groupID = req.url.split("/groupPage/")[1];
  let group, events, boards;

  // get the group info
  const query = "SELECT * FROM group_ WHERE group_id = $1";
  const values = [groupID];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      group = response.rows[0];

      // get the events
      const query2 = "SELECT * FROM event_ WHERE groupid = $1";
      client.query(query2, values, (err, response) => {
        if (err) console.log(err.stack);
        else {
          events = response.rows;

          // get the boards
          const query3 = "WITH boardTemp AS (" +
                            "SELECT boardid FROM boardlist WHERE groupid = $1)" +
                         "SELECT * FROM board natural join boardTemp";
          client.query(query3, values, (err, response) => {
            if (err) console.log(err.stack);
            else {
              boards = response.rows;

              const groupObj = {
                group: group,
                events: events,
                boards: boards
              };

              res.render("GroupHomePage", {group: JSON.stringify(groupObj)});
            }
          });
        }
      });
    }
  });
});

app.post("/createEvent", (req, res) =>{
  createEvent(req, res);

});

// added server port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, function() {
  console.log("Server has started on port 3000");
});

// FUNCTIONS *********************************************************************
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
    const query = "INSERT INTO users(email, password, first, last, bio, status, location, cubVotes) VALUES($1, $2, $3, $4, $5, $6, $7, $8)";
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
          req.session.email = loginEmail;
          res.redirect("/home");
        }
      }
    });
  }
}
function makeGroup(req, res) {
  let gId = Math.floor(Math.random() * 100000000);
  let leaderEmail = req.session.email;
  let gDesc = req.body.groupDesc;
  let gName = req.body.groupName;
  let priv = false;

  //Creating new group
  const query = "INSERT INTO group_(group_id, leader, group_name, group_desc, private) VALUES($1, $2, $3, $4, $5)";
  const values = [gId, leaderEmail, gName, gDesc, priv];

  client.query(query, values, (err, response) => {

    //Group unsuccessfully created
    if (err) {
      console.log("makeGroup broke!");
      console.log("------------------------------------");
      console.log(err.stack)
      res.redirect("/group")
    } else {
      let joinDate = new Date;
      let inviteDate = joinDate;
      let status = true;
      const query = "INSERT INTO member_(email, groupid, status, joindate, invitedate) VALUES($1, $2, $3, $4, $5)";
      const values = [leaderEmail, gId, status, joinDate, inviteDate];

      client.query(query, values, (err, response) => {
        if (err) {
          console.log("makeGroup broke! again");
          console.log(err.stack);
          const query = 'DELETE FROM "group_" WHERE ' +
                                  '"group_id" = $1, ' +
                                  '"leader" = $2, ' +
                                  '"group_name" = $3, ' +
                                  '"group_desc" = $4, ' +
                                  '"private" = $5';
          const values = [leaderEmail, gId, status, joinDate, inviteDate];
          try {
            client.query(query, values);
          } catch (e) {
            console.log(e.stack);
          }
        } else {
          res.redirect("/home");
        }
      });
    }
  });
}
function joinGroup(req, res) {
  let gId = req.body.groupId;
  let email = req.session.email;
  let status = true;
  let jdate = new Date();
  let idate = jdate;

  const query = "INSERT INTO member_(email, groupid, status, joindate, invitedate) VALUES($1, $2, $3, $4, $5)";
  const values = [email, gId, status, jdate, idate];

  try {
    client.query(query, values);
  } catch (e) {
    console.log("---------------------------Join Group error stack------------------------------");
    console.log(e.stack);
  }
}
function createBoard(req, res) {
  let bId = req.body.boardId;
  let bName = req.body.boardName;
  let bDesc = req.body.boarDesc;

  const query = "INSERT INTO board_(boardid, boardname, boarddesc) VALUES($1, $2, $3)";
  const values = [bId, bName, bDesc];
  try {
    client.query(query, values);
    
    let gId = req.body.groupId;
    const query = "INSERT INTO boardlist(boardid, groupid) VALUES($1, $2)";
    const values = [bId, gId];
    
    try {
      client.query(query, values);
    } catch (e) {
      console.log("---------------------------Insert boardlist board error stack------------------------------");
      console.log(e.stack);
    }
  } catch (e) {
    console.log("-------------------------Create Board Error Stack--------------------------");
    console.log(e.stack);
  }
}

function createEvent(req, res){
  let email = req.session.email;
  let eName = req.body.eventName;
  let eDesc = req.body.eventDesc;
  let time = req.body.datetimes;
  let gId = req.body.eGroupID;
  let eId = Math.floor(Math.random() * 100000000);

  // parse the dates and time
  let startDate = time.substring(0,10);
  let startTime = time.substring(11, 19);
  let startUnix = Date.parse(startDate + " " +startTime);

  let endDate = time.substring(22,32);
  let endTime = time.substring(33);
  let endUnix = Date.parse(endDate + " " + endTime);

  //console.log(startDate + " " + startTime + " " + startUnix + "     " + endDate + " " + endTime + " " + endUni
  const query = "INSERT INTO event_(eventid, eventname, eventdesc, starttime, endtime, startdate, enddate, host, groupid, startunix, endunix) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)";
  const values = [eId, eName, eDesc, startTime, endTime, startDate, endDate, email, gId, startUnix, endUnix];
  values.forEach(e => console.log(e));
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      res.redirect("/groupPage/" + gId);
    }
  });
}
