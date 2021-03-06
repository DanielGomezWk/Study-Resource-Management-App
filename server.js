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
const ejs = require("ejs");
const session = require("express-session");
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(__dirname + "/public/"));
app.use(session({secret: 'ssshhhhhh'}));


// added server port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, function() {
  console.log("Server has started on port 3000");
});

io.on('connection', (socket) => {
  console.log(socket.handshake.headers.referer);
  console.log("Successfully connected, userID = " + socket.id + " to socket server");
  let data = socket.handshake.headers.referer.split("/");
  let groupID = data[data.length - 3];
  let boardID = data[data.length - 1];
  console.log(groupID);
  console.log(boardID);
  console.log("User has joined room: " + groupID + "/" + boardID);
  socket.join(groupID+ "/" + boardID);
});

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
        const query2 = "WITH temptable AS(SELECT * FROM group_ join users on group_.leader = users.email NATURAL JOIN grouptags WHERE private = false), " +
      "groupsandpics AS(SELECT * FROM temptable LEFT JOIN grouppictures gp USING(group_id)), " +
      "groupsInvited AS(SELECT * FROM member_ WHERE email = $1 AND status = true), " +
      "usergroups AS (SELECT group_id From group_ JOIN groupsInvited ON group_.group_id = groupsInvited.groupid) " +
      "SELECT * FROM groupsandpics NATURAL JOIN usergroups";
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
  const query = "WITH temptable AS(SELECT * FROM group_ join users on group_.leader = users.email NATURAL JOIN grouptags WHERE private = false) " +
      " SELECT * FROM temptable LEFT JOIN grouppictures gp USING(group_id)";
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

// creating a group from the group menu page
app.post("/createGroup", (req, res) => {
  makeGroup(req, res);
})

app.get("/groupPage/:groupID", (req, res) => {

  // save the group_id
  const groupID = req.url.split("/groupPage/")[1];
  let group, posts, events, boards, tags;

  // the user has joined the group
  //joinGroup(req, groupID);

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
                    session: req.session.email,
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
app.post("/createPost", (req, res) => {
  createPost(req, res);
});
app.post("/deletePost", (req, res) => {
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

// Adding cubvote to a post
app.post("/cubvotePost", (req, res) => {
  console.log("i made it to the route!");
  addCubvoteToPost(req, res);
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
app.post("groupInfoPage", (req, res) => {
  let gId = req.body.groupID;
  res.redirect("groupPage/" + gId + "/groupInfo");
});
app.get("groupPage/:groupID/groupInfo", (req, res) => {
  displayGroupInfo(req, res);
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

  //console.log(req.body);

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
          "WHERE email = postowner " +
          "ORDER BY postdate ASC, " +
          "posttime ASC";
      const values = [bId];
      client.query(query, values, (err, response) => {
        if (err) {
          console.log(err.stack);
        } else {
          let postss = response.rows;
          let data = {
            session: req.session.email,
            boardInfo: boardInfo,
            posts: postss,
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
  let firstname;
  let lastname;
  let gId = req.body.groupID;
  let bId = req.body.boardID;
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
      console.log("about to insert into postlist!");
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
          let query = "SELECT first, last FROM users WHERE email = $1";
          let values = [email];
          console.log("email: " + email);
          client.query(query, values, (err, response) => {
            if (err) {
              console.log("Error stack, could not successfully query user first name");
              console.log("------------------------------------------------------");
              console.log(err.stack);
              console.log("------------------------------------------------------");
            } else {
              console.log("result of query for first and last name: " + response.rows[0]);
              let name = response.rows[0];
              console.log("made it here!");
              let query =
                  "SELECT cubvotes " +
                  "FROM users " +
                  "where email = $1";
              console.log("made it after!");
              let values = [email];
              client.query(query, values, (err, response) => {
                if (err) {
                  console.log("------------------------------------------------------");
                  console.log(err.stack);
                  console.log("------------------------------------------------------");
                } else {
                  let userCubVotes = response.rows[0];
                  //putting post information into object
                  let newMessage = {
                    email: email,
                    first: name.first,
                    last: name.last,
                    postcontent: msg,
                    posttime: time,
                    postdate: date,
                    postid: pId,
                    postvotes: 0,
                    uservotes: userCubVotes.cubvotes
                  }
                  //sending post to any user currently using the homepage
                  console.log(gId + "/" + bId);
                  io.to(gId + "/" + bId).emit("newMessage", newMessage);

                  //sending object back to user
                  res.json(newMessage);
                }
              });
            }
          });
        }
      });
    }
  });

}
//TODO: need to update once table that keeps track of cubvotes is created (maybe)
function deletePost(req, res) {
  let email = req.body.userID;
  let pId = req.body.postID;
  let gId = req.body.groupID;
  let bId = req.body.boardID;

  // Verify that the req is done by the session holder
  if (email !== req.session.email) {
    console.log("Cannot delete post, current user does not match session!");
  }
  else {
    const query =
        "SELECT email " +
        "FROM member_ " +
        "WHERE groupid = $1 AND email = $2";
    const values = [gId, email];

    client.query(query, values, (err, response) => {
      if (err) {
        console.log("email from member_ error");
        console.log("-----------------1-------------------");
        console.log(err.stack);
        console.log("------------------------------------");
      } else {
        //user is not in group
        console.log("response.rows object:");
        console.log(response);
        if (response === undefined) {
          console.log("User not in group");
        }
        //user is in group
        else {
          //removing post from postlist
          const query =
              "SELECT postowner, postid " +
              "FROM post " +
              "WHERE postowner = $1";
          const values = [email];

          client.query(query, values, (err, response) => {
            if (err) {
              console.log("-----------------2-------------------");
              console.log(err.stack);
              console.log("------------------------------------");
            }
            else {
              //user not owner of post
              if (response.rows.length === 0) {
                console.log("Current user is not the owner of this post!");
              //user is owner of post
              } else {
                //removing post from postlist
                const query = "DELETE FROM postlist WHERE postid = $1";
                const values = [pId];

                client.query(query, values, (err, response) => {
                  if (err) {
                    console.log("Failed to delete post from postlist");
                    console.log("----------------3--------------------");
                    console.log(err.stack);
                    console.log("------------------------------------");
                  } else {
                    const query = "DELETE FROM cubvoted WHERE postid = $1";
                    const values = [pId];
                    client.query(query, values, (err, response) => {
                      if (err) {
                        console.log("-----------------5-------------------");
                        console.log(err.stack);
                        console.log("------------------------------------");
                      } else {
                        //removing post from post
                        const query = "DELETE FROM post WHERE postid = $1";
                        const values = [pId];
                        client.query(query, values, (err, response) => {
                          if (err) {
                            console.log("Failed to delete post from post");
                            console.log("----------------4--------------------");
                            console.log(err.stack);
                            console.log("------------------------------------");
                          } else {
                            res.status("200").send();
                          }
                        });
                      }
                    });
                  }
                });
              }
            }
          });
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
  let priv = req.body.btnradio === "true";
  let tag = req.body.tag;
  let pic = req.body.grouppic;

  console.log(req.body);

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

      // insert user into the member table
      let joinDate = new Date;
      let inviteDate = joinDate;
      let status = true;
      const query = "INSERT INTO member_(email, groupid, status, joindate, invitedate) VALUES($1, $2, $3, $4, $5)";
      const values = [leaderEmail, gId, status, joinDate, inviteDate];
      client.query(query, values, (err, response) => {
        // failed member insertion
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
          // successful member insertion
        } else {
          // insert group and tag into grouptags
          const query = "INSERT INTO grouptags(group_id, tagnames) VALUES ($1, $2)";
          const values = [gId, tag];
          client.query(query, values, (err, response) => {
            if (err) console.log(err)
            else {
              // insert group photo url into grouppics
              const query = "INSERT INTO grouppictures(group_id, pic) VALUES ($1, $2)";
              const values = [gId, pic];
              client.query(query, values, (err, response) => {
                if (err) console.log(err.stack);
                else  res.redirect("/groupMenuPage");
              });
            }
          });
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


    //querying to see if user who is sending invite is in the group member table
    let query =
        "SELECT email " +
        "FROM member_ " +
        "WHERE groupid = $1 AND email = $2";
    let values = [groupID, userEmail];
    client.query(query, values, (err, response) => {
      if (err) {
        console.log("email: " + userEmail + ", groupID: " + groupID + " => could not query for email in members_ table with previous values");
        console.log(err.stack);
      } else {
        //the user inviting the person is NOT in the group
        console.log(response.rows[0].email);
        if (response.rows[0].email === null) {
          console.log("Could not query user email from \"member_\"!");
          console.log("-----------------------------------------------------");
        }
        //the user inviting the person IS in the group
        else {
          //inserting user into members_ table
          let query =
              "INSERT INTO member_ VALUES($1, $2, $3, $4, $5, $6, $7)";
          let values = [inviteEmail, groupID, status, inviteDate, joinDate, moderator, banned];
          client.query(query, values, (err, response) => {
            if (err) {
              console.log("User: " + inviteEmail + "=> cannot be insert into member_ table");
              console.log("----------------------------------");
              console.log(err.stack);
              console.log("----------------------------------");
            }
            else {
              let query =
                  "SELECT group_name " +
                  "FROM group_ " +
                  "WHERE group_id = $1";
              let values = [groupID];
              client.query(query, values, (err, response) => {
                if (err) {
                  console.log("group_id: " + groupID + " => not in group_ table");
                  console.log("----------------------------------");
                  console.log(err.stack);
                  console.log("----------------------------------");
                } else {
                  let groupname = response.rows[0];
                  let invObj = {
                    type: "groupInvite",
                    groupName: groupname,
                    groupID: groupID,
                    inviteDate: inviteDate
                  }

                  console.log("1111+++++++++++=111+++++++++++++");
                  console.log("I AM ABOUT TO SEND AN INVITE TO " + inviteEmail);
                  console.log("1111+++++++++++=111+++++++++++++");
                  //sending notification to invited user
                  io.sockets.in(inviteEmail).emit('invitedToGroup', invObj);

                  //notifying user that a request was sent to the invited user
                  let data = { requestSent: true }
                  res.json(data);
                }
              });
            }
          });
        }
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
          events = response.rows;

          // getting the groups they have been invited to // can change
          const query3 = "WITH temptable AS(SELECT * FROM group_ join users on group_.leader = users.email NATURAL JOIN grouptags WHERE private = false), " +
          "groupsandpics AS(SELECT * FROM temptable LEFT JOIN grouppictures gp USING(group_id)), " +
          "groupsInvited AS(SELECT * FROM member_ WHERE email = $1 AND status = false), " +
          "usergroups AS (SELECT group_id From group_ JOIN groupsInvited ON group_.group_id = groupsInvited.groupid) " +
          "SELECT * FROM groupsandpics NATURAL JOIN usergroups";
          client.query(query3, values, (err, response) => {
            if (err) console.log(err.stack);
            else {
              groups = response.rows;
              const obj = {
                user: user,
                events: events,
                groups: groups
              }
              console.log(obj.groups);
              res.render("invites", {obj: obj});
            }
          });
        }
      });
    }
  });
}

function addCubvoteToPost(req, res){
  let email = req.body.userID;
  let gId = req.body.groupID;
  let bId = req.body.boardID;
  let pId = req.body.postID;

  // Verify that the req is done by the session holder
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
      else {
        //User didn't upvote, inserting cubvote
        if (response.rows.length === 0) {
          let query =
              "INSERT INTO cubvoted(postid, email) VALUES($1, $2)";
          let values = [pId, email];
          client.query(query, values, (err, response) => {
            if (err) {
            } else {
              let query =
                  "SELECT cubvotes " +
                  "FROM post " +
                  "WHERE postid = $1";
              let values = [pId];
              client.query(query, values, (err, response) => {
                if (err) {
                  console.log("************1*****************");
                  console.log(err.stack);
                  console.log("*****************************");
                } else {
                  let cubvoteNum = response.rows[0].cubvotes;
                  console.log("cubvoteNum: " + cubvoteNum);
                  let query =
                        "UPDATE post " +
                        "SET cubvotes = $1 " +
                        "WHERE postid = $2";
                  let cbv = cubvoteNum + 1;
                  console.log(cbv);
                  let values = [cbv, pId];
                  client.query(query, values, (err, response) => {
                    if (err) {
                      console.log("*************2****************");
                      console.log(err.stack);
                      console.log("*****************************");
                    } else {
                       res.status("200").send({cubvote: true});
                    }
                  });
                }
              });
            }
          });
        } else {
          query = "DELETE FROM cubvoted WHERE postid = $1 AND email = $2";
          values =[pId, email];
          client.query(query, values, (err, response) => {
            if (err) {
              console.log("*************3****************");
              console.log(err.stack);
              console.log("*****************************");
            } else {
              let query =
                  "SELECT cubvotes " +
                  "FROM post " +
                  "WHERE postid = $1";
              values = [pId];
              client.query(query, values, (err, response) => {
                let cubVoteNum = response.rows[0].cubvotes;
                if (err) {
                  console.log("***********4******************");
                  console.log(err.stack);
                  console.log("*****************************");
                } else {
                  let query =
                      "UPDATE post " +
                      "SET cubvotes = $1 " +
                      "WHERE postid = $2";
                  values = [cubVoteNum - 1, pId];
                  client.query(query, values, (err, response) => {
                    if (err) {
                      console.log("*************5****************");
                      console.log(err.stack);
                      console.log("*****************************");
                    } else {
                      res.status("200").send({cubvote: false});
                    }
                  });
                }
              });
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

function displayGroupInfo(req, res) {

}
