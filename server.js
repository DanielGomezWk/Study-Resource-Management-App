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

// user home page
app.get("/home", (req, res) => {
  const query = "SELECT * FROM users WHERE email = $1";
  const values = [req.session.email];
  var user, events, groups;

  // getting the user's information
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      user = response.rows[0];

        // getting the groups they are a part of
        const query2 = "WITH groupsInvited AS (SELECT * FROM member_ WHERE email = $1 and status = true) " +
            "SELECT * FROM group_ JOIN groupsInvited ON group_.group_id = groupsInvited.groupid "
        client.query(query2, values, (err, response) => {
          if (err) console.log(err.stack);
          else {
            groups = response.rows;

            // getting the events they are a part of
            const query3 = "WITH events AS (SELECT * FROM attend WHERE email = $1 and attending = true) " +
                "SELECT * FROM event_ natural join events";
            client.query(query3, values, (err, response) => {
              if (err) console.log(err.stack);
              else {
                events = response.rows;
                const obj = {
                  user: user,
                  groups: groups,
                  events: events
                }
                console.log(obj);
                res.render("homePage", {sObj: JSON.stringify(obj), obj: obj, email: req.session.email});
              }
            });
          }
        });
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
  let group, posts, events, boards, tags;

  // the user has joined the group
  joinGroup(req, groupID);

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
              
              // get grouptags
              const query4 = "SELECT tagnames FROM grouptags WHERE group_id = $1"
              client.query(query4, values, (err, response) => {
                if (err) console.log(err.stack);
                else {
                  tags = response.rows;
                  //json data to send back to group home page
                  const groupObj = {
                    group: group,
                    events: events,
                    boards: boards,
                    tags: tags
                  };
                  //sending data to groupHomePage
                  res.render("groupHomePage", {group: JSON.stringify(groupObj)});
                }
              })
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


app.get("/groupBoardPage/:groupID/:boardID", (req, res) => {
 let groupobj = req.url.split("/");
  let boardID = groupobj[groupobj.length - 1];
  let groupID = groupobj[groupobj.length - 2];
  res.redirect("/groupPage/" + groupID + "/groupBoardPage/" + boardID);
});

//get request for displaying board and posts page
app.get("/groupPage/:groupID/groupBoardPage/:boardID", (req, res) => {
  let boardIDobj = req.url.split("/");
  let boardID = boardIDobj[boardIDobj.length - 1];
  let groupID = boardIDobj[boardIDobj.length - 3];
  displayBoard(req, res, boardID, groupID);
});
//post request for creating new board
app.post("/addBoard",(req, res) => {
  createBoard(req, res);
});

//post request handling for giving a user a group invite
app.post("/groupInviteUser", (req, res) => {
  let userEmail = req.body.userEmail;
  let inviteEmail = req.body.inviteEmail;
  let groupID = req.body.groupID;
  req.body.userEmail = email;
  req.body.inviteEmail = inviteEmail;
  res.redirect("/groupPage/" + groupID);
});
//get request handling for returning a notification for a group invite for a user
app.get("/groupPage/:groupID", (req, res) => {
  let groupID = (req.url.split("/"))[2];
  let userEmail = req.body.userEmail;
  let inviteEmail = req.body.inviteEmail;
  req.body.userEmail = null;
  req.body.inviteEmail = null;

  groupInviteUser(req, res, userEmail, inviteEmail, groupID);
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

              // get the list of people not invited, who belong to the group, in order to invite them
              const query4 = "SELECT email FROM member_ where groupid = $1 " +
                  "EXCEPT " +
                  "SELECT email from attend where eventid = $2"
              const values3 = [event.groupid, eventID];
              client.query(query4, values3, (err, response) =>{
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

app.post("/addGroupTag", (req, res) => {
  addGroupTag(req, res);
});
app.post("/createTag", (req, res) => {
  createTag(req, res);
});
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!! INVITE PAGE RELATED GET AND POST ROUTES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
//invite page for the user
app.get("/invites", (req, res) => {
  showInvites(req, res);
});

// accept group invitation
app.get("/joinGroup/:groupID", (req, res) => {
  const query = "UPDATE member_ SET status = true WHERE email = $1 AND groupid = $2";
  const values = [req.session.email, req.url.split(/(\d+)/)[1]];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else res.redirect("/invites");
  });
});

// decline group invitation
app.get("/declineGroup/:groupID", (req, res) => {
  const query = "DELETE FROM member_ WHERE email = $1 AND groupid = $2";
  const values = [req.session.email, req.url.split(/(\d+)/)[1]];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else res.redirect("/invites");
  });
});

// accept event invite
app.get("/joinEvent/:eventID", (req, res) => {
  const query = "UPDATE attend SET attending = true WHERE email = $1 AND eventid = $2";
  const values = [req.session.email, req.url.split(/(\d+)/)[1]];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else res.redirect("/invites");
  });
});

// decline event invitation
app.get("/declineEvent/:eventID", (req, res) => {
  const query = "DELETE FROM attend WHERE email = $1 AND eventid = $2";
  const values = [req.session.email, req.url.split(/(\d+)/)[1]];
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else res.redirect("/invites");
  });
});
// !!!!!!!!!!!!!!!!!!!!!!!!!!!!! INVITE PAGE RELATED GET AND POST ROUTES !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

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

  console.log(req.body);

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
  let bId = boardID;
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
          let data = {
            boardInfo: boardInfo,
            posts: postss
          }
          res.render("groupBoardPage",{data: JSON.stringify(data)});
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
//TODO: need to update once table that keeps track of cubvotes is created (maybe)
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
      //removing post from post
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
function cubvote(req, res) {
  let pID = req.body.postID;
  let email = req.body.email;
  let sID = req.session.email;

  //TODO: need to create table that tracks people who cubvoted already before querying
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
function joinGroup(req, groupID) {
  let gId = groupID;
  let email = req.session.email;
  let status = true;
  let jdate = new Date();
  let idate = jdate;

  const query = "INSERT INTO member_(email, groupid, status, joindate, invitedate) VALUES($1, $2, $3, $4, $5)";
  const values = [email, gId, status, jdate, idate];

  client.query(query, values, (err, response) => {
    if (err) {
      console.log("---------------------------Join Group error stack------------------------------");
      console.log(err.stack);
    } else {
    }
  });
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

function groupInviteUser(req, res, userEmail, inviteEmail, groupID) {
  let sId = req.session.email;

  if (userEmail === sId) {
    let status = false;
    let inviteDate = new Date;
    let joinDate = inviteDate;
    let moderator = false;
    let banned = false;


    let query =
        "SELECT email " +
        "FROM members_ " +
        "WHERE groupid = ";
    let values = [];

    client.query(query, values, (err, response) => {
      if (err) {

      } else {

      }
    });
  } else {
    console.log("***************************************");
    console.log("Invalid Invite Request:");
    console.log("User \"" + userEmail + "\" is not the valid session holder");
    console.log("***************************************");
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


function showInvites(req, res){

  // get email
  const query = "SELECT * FROM users WHERE email = $1";
  const values = [req.session.email];
  var user, events, groups;

  // getting the user's information
  client.query(query, values, (err, response) => {
    if (err) console.log(err.stack);
    else {
      user = response.rows[0];

      // getting the events they've been invited to // can change
      const query2 = "WITH eventsInvited AS (SELECT * FROM attend WHERE email = $1 and attending = false) " +
          "SELECT * FROM event_ natural join eventsInvited";
      client.query(query2, values, (err, response) => {
        if (err) console.log(err.stack);
        else {
          console.log(values[0]);
          console.log(response.rows);
          events = response.rows;

          // getting the groups they have been invited to // can change
          const query3 = "WITH groupsInvited AS (SELECT * FROM member_ WHERE email = $1 and status = false) " +
              "SELECT * FROM group_ JOIN groupsInvited ON group_.group_id = groupsInvited.groupid "
          client.query(query3, values, (err, response) => {
            if (err) console.log(err.stack);
            else {
              groups = response.rows;
              const obj = {
                user: user,
                events: events,
                groups: groups
              }
              console.log(obj);
              res.render("invites", {obj: obj});
            }
          });
        }
      });
    }
  });
}

function addCubvoteToPost(req, res){
  let email = req.body.email;
  let pId = req.body.postID;

  //verifying to see if current user is session holder
  //session does not match
  if (email !== req.session.email) {
    console.log("Cannot cubvote post, current user does not match session!");
  }
  //session matches
  else {
    //Verifying to see if current user cubvoted
    let query =
            "SELECT * " +
            "FROM cubvoted " +
            "WHERE email = $1 AND postid = $2";
    let values = [email, pId];

    client.query(query, values, (err, response) => {
      if (err) {
        console.log("Cannot cubvote post for user. User already cubvoted post!");
        console.log("****************************************************");
        console.log(err.stack);
        console.log("****************************************************");
      }
      //User didn't upvote, inserting cubvote
      else {
        if (response.rows.length === 0) {
          let query =
              "INSERT INTO cubvoted(postid, email) VALUES($1, $2)";
          let values = [pId, email];
          client.query(query, values, (err, response) => {
            if (err) {
            } else {
              //successfully cubvoted
            }
          });
        }
      }
    });
  }
}
function createTag(req, res) {
  let gId = req.body.groupID;
  let tagname = req.body.tagname;
  let query =
      "SELECT tagnames " +
      "FROM tags " +
      "where tagnames = $1";
  let values = [tagname];
  client.query(query, values, (err, response) => {
    //if tagname does not exist, then we insert tag
    if (response.rows.length === 0) {
      query = "INSERT INTO tags (tagnames) VALUES($1) "
      values = [tagname];
      client.query(query, values, (err, response) => {
        if (err) {
          console.log("------------------------------");
          err.stack;
          console.log("------------------------------");
        } else {
          query =
              "SELECT * " +
              "FROM grouptags " +
              "where tagnames = $1 AND group_id = $2";
          values = [tagname, gId];
          client.query(query, values, (err, response) => {
            //INSERTING tag into grouptags
            if(response.rows.length === 0) {
              query = "INSERT INTO grouptags(group_id, tagnames) VALUES ($1,$2)";
              values = [gId, tagname];
              client.query(query, values, (err, response) => {
                if (err) {
                  console.log(err.stack);
                } else {
                  res.redirect("groupPage/" + gId);
                }
              })
            } else {
              console.log("tag is already in grouptags");
            }
          });
        }
      });
    } else {
      console.log("tagname already exists");
    }
  });
}

function addGroupTag(req, res){
  let groupTag = req.body.tagname;
  let gId = req.body.groupID;

  let query =
      "SELECT tagnames " +
      "FROM tags " +
      "where tagnames = $1";
  let values = [groupTag];
  client.query(query, values, (err, response) => {
    if (err) {

    } else {
      //if group doesnt have tagname
      if (response.rows.length === 0) {
        query =
            "SELECT * " +
            "FROM grouptags " +
            "where tagnames = $1 AND group_id = $2";
        values = [tagnames, gId];
        client.query(query, values, (err, response) => {
          //INSERTING tag into grouptags
          if(response.rows.length === 0) {
            query = "INSERT INTO grouptag(group_id, tagnames) VALUES ($1,$2)";
            values = [gId, tagnames];
            client.query(query, values, (err, response) => {
              if (err) {
                console.log(err.stack);
              } else {
                console.log("Succesfully inserte tag into grouptags!");
              }
            })
          } else {
            console.log("tag is already in grouptags");
          }
        });
      } else {
        console.log("tag is already in group");
      }
    }
  });
}
