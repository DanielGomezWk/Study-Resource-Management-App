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
const socket = require("socket.io");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));
app.use(session({secret: 'ssshhhhhh'}));
const ejs = require("ejs");

// added server port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
const server = app.listen(port, function() {
  console.log("Server has started on port 3000");
});
const io = socket(server);

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
  let group, posts, events, boards;

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

              //json data to send back to group home page
              const groupObj = {
                group: group,
                events: events,
                boards: boards
              };

              //sending data to groupHomePage
              res.render("groupHomePage", {group: JSON.stringify(groupObj)});
            }
          });
        }
      });
    }
  });
});
// Send Notification API
// app.post('/createPost', (req, res) => {
//   const notify = {data: req.body};
//   socket.emit('notification', notify); // Updates Live Notification
//   res.send(notify);
// });
app.post("/groupPageCreatePost/:groupID", (req, res) => {
  createPost(req, res);
});
app.post("/groupPageDeletePost/:groupID", (req, res) => {
  deletePost(req, res);
});
app.post("/groupPage/:groupID", (req, res) => {
  let boardID = req.body.boardID;
  let groupID = req.url.split("/groupPage/")[1];
  res.redirect("/groupPage/" + groupID + "/" + boardID);
});
app.get("/groupPage/:groupID/:boardID", (req, res) => {
  let boardIDobj = req.url.split("/");
  let boardID = boardIDobj[boardIDobj.length - 1];
  let groupID = boardIDobj[boardIDobj.length - 2];
  displayBoard(req, res, boardID, groupID);
});
//post request for creating new board
app.post("/addBoard",(req, res) => {
  createBoard(req, res);
});

// invite a user to an event
app.post("/eventInviteUser", (req, res) =>{
  const query = "INSERT INTO attend(email, eventid, attending) VALUES($1, $2, $3);"
  const values = [req.body.userEmail, req.body.eventID, false];
  client.query(query, values, (err, response) =>{
    if (err) console.log(err.stack);
    else res.redirect("/eventHomePage/" + req.body.eventID);
  });
});


app.post("/createEvent", (req, res) =>{
  createEvent(req, res);
});

app.get("/eventHomePage/:eventID", (req, res) =>{
  // save the eventid
  const eventID = req.url.split("/eventHomePage/")[1];

  let event, attendees, host, notInvited;

  // get the event info
  const query = "SELECT * FROM event_ WHERE eventid = $1";
  const values = [eventID];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      event = response.rows[0];

      // get the attendees
      // get the event info and the list of attendees, both accepted and non accepted
      const query2 = "WITH attendees AS (" +
          "SELECT email FROM attend WHERE eventid = $1)" +
          "SELECT first, last, bio, cubvotes FROM users natural join attendees";
      client.query(query2, values, (err, response) => {
        if (err) console.log(err.stack);
        else {
          attendees = response.rows;

          // get the host information
          const query3 = "SELECT * FROM users WHERE email = $1";
          const values2 = [event.host];
          client.query(query3, values2, (err, response) => {
            if (err) console.log(err.stack);
            else {
              host = response.rows[0];

              // get the list of people not invited in order to invite them
              const query4 = "WITH uninvited AS (" +
                  "SELECT email FROM users " +
                  "EXCEPT " +
                  "SELECT email from attend where eventid = $1)" +
                  "SELECT * FROM users natural join uninvited";
              client.query(query4, values, (err, response) =>{
                if (err) console.log(err.stack);
                else {
                  notInvited = response.rows;

                  // assemble the object
                  const obj = {
                    event: event,
                    attendees: attendees,
                    host: host,
                    notInvited: notInvited
                  }
                  console.log(JSON.stringify(obj));
                  res.render("eventHomePage", {obj: obj});
                }
              });
            }
          });
        }
      });
    }
  });
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
function displayBoard(req, res, boardID, groupID) {
  console.log("i made it to displayBoard");
  let bId = boardID;

  console.log("BoardID: " + bId);
  const query =
      "SELECT * " +
      "FROM board " +
      "WHERE boardid = $1";
  const values = [bId];
  client.query(query, values, (err, response) => {
    if (err) {
      console.log("Failed to grab all posts from board");
      console.log("---------------------------------");
      console.log(err.stack);
      console.log("---------------------------------");
    } else {
      let boardInfo = response.rows;
      const query =
          "WITH boardPostIDs as (" +
          "SELECT postid " +
          "FROM postlist WHERE boardid = $1) " +
          "SELECT email, first, last, users.cubvotes as uservotes, postid, postcontent, postdate, posttime, post.cubvotes as postvotes " +
          "FROM boardPostIDs natural join post, users " +
          "WHERE email = postowner";
      const values = [bId];
      client.query(query, values, (err, response) => {
        if (err) {
          console.log(err.stack);
        } else {
          let postss = response.rows;
          console.log({board: boardInfo, posts: postss });
          res.send({board: boardInfo, posts: postss });
        }
      });
    }
  });
}
function createPost(req, res) {
  let email = req.body.email;
  let pId = Math.floor(Math.random() * 100000000);
  let msg = req.body.message;
  let date = new Date;
  let time = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  let cubVotes = 0;
  let gId = req.body.groupID;
  const query = "INSERT INTO post(postid, postcontent, postowner, postdate, posttime, cubvotes) VALUES($1, $2, $3, $4, $5, $6)";
  const values = [pId, msg, email, date, time, cubVotes];

  client.query(query, values, (err, response) => {
    let bId = req.body.boardID;
    if (err) {
      console.log("create post error stack");
      console.log("------------------------------------------------------");
      console.log(err.stack);
      console.log("------------------------------------------------------");
    } else {
      //inserting post into postlist
      const query = "INSERT INTO postlist(boardid, postid) VALUES($1, $2)";
      const values = [bId, pId];
      client.query(query, values, (err, response) => {
        if (err) {
          console.log("insert to postlist after post creation error stack");
          console.log("------------------------------------------------------");
          console.log(err.stack);
          console.log("------------------------------------------------------");
        } else {
          //querying for firstname of user to send back to group home page
          let query = "SELECT first FROM users WHERE email = $1";
          let values = [email];
          let firstname;
          client.query(query, values, (err, response) => {
            if (err) {
              console.log("Error stack, could not successfully query user first name");
              console.log("------------------------------------------------------");
              console.log(err.stack);
              console.log("------------------------------------------------------");
            } else { firstname = response.rows[0]; }
          });

          //querying for lastname of user to send back to group home page
          query = "SELECT last FROM users WHERE email = $1";
          values = [email];
          let lastname;
          client.query(query, values, (err, response) => {
            if (err) {
              console.log("Error stack, could not successfully query user last name");
              console.log("------------------------------------------------------");
              console.log(err.stack);
              console.log("------------------------------------------------------");
            } else { lastname = response.rows[0]; }
          });

          //putting post information into object
          let newMessage = {
            first: firstname.first,
            last: lastname.last,
            message: msg,
            time: time,
            date: date
          }
          //sending post to any user currently using the homepage
          io.emit('post', newMessage);

          //sending object back to user
          res.json(newMessage);
        }
      });
    }
  });

}
function deletePost(req, res) {
  let pId = req.body.postID;

  //removing post from postlist
  const query = "DELETE FROM postlist WHERE postid = $1";
  const values = [pId];

  client.query(query, values, (err, response) => {
    if (err) {
      console.log("Failed to delete post from postlist");
      console.log("------------------------------------");
      console.log(err.stack);
      console.log("------------------------------------");
    } else {
      //removing post from postlist
      const query = "DELETE FROM post WHERE postid = $1";
      const values = [pId];
      client.query(query, values, (err, response) => {
        if (err) {
          console.log("Failed to delete post from post");
          console.log("------------------------------------");
          console.log(err.stack);
          console.log("------------------------------------");
        } else {
          //handle response properly
        }
      });
    }
  });
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
  let bId = Math.floor(Math.random() * 100000000);
  let bName = req.body.boardName;
  let bDesc = req.body.boardDesc;

  //inserting new board into database
  const query = "INSERT INTO board(boardid, boardname, boarddesc) VALUES($1, $2, $3)";
  const values = [bId, bName, bDesc];
  console.log("-----values for board-----");
  console.log(bId);
  console.log(bName);
  console.log(bDesc);
  console.log("---------------------------");
  client.query(query, values, (err, response) => {
    if (err) {
      console.log("------------------------Board Creation Error Stack--------------------");
      console.log(err.stack);
    } else {
      console.log(req.body);
      let gId = req.body.groupID;
      console.log(gId);
      //creating tuple for board in boardlist
      const query = "INSERT INTO boardlist(boardid, groupid) VALUES($1, $2)";
      const values = [bId, gId];

      client.query(query, values, (err, response) => {
        if (err) {
          console.log("------------------------BoardList Creation Error Stack--------------------");
          console.log(err.stack);
        }
        else {
          res.redirect("/groupPage/" + gId);
        }
      });
    }
  });
}
function deleteBoard(req, res) {
  let gId = req.body.groupID;
  let bId = req.body.boardID;
  let boardID = 1;
// delete from post where postid in (select postid from postlist where boardid = 50);
  // delete all associated posts,
  const query = "DELETE FROM post WHERE postid IN (SELECT postid FROM postlist WHERE boardid = $1)"
  const values = [boardID];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      // now delete the board from the boards, which will cascade delete the other thingy
      const query2 = "DELETE FROM board WHERE boardid = $1";
      client.query(query2, values, (err, response) => {
        if (err) console.log(err.stack);
        else {
          // return the user somewhere?
        }
      });
    }
  });
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
