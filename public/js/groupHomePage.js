document.addEventListener('DOMContentLoaded', (event) => {
    console.log("about to load page!");
    fillGroups();
});

// socket.on('post', (newMessage) => {
//    console.log(newMessage);
// });
//
// socket.on('invitedToGroup', (invObj) => {
//     console.log(invObj);
// });


$('#inviteButton').click(function (e) {
    e.preventDefault();
    let inviteEmail = document.getElementById("inviteEmailInvite").value;
    let userEmail = document.getElementById("userEmailInvite").value;
    let groupID = document.getElementById("groupIDInvite").value;
    let reqTypeInvite = document.getElementById("reqTypeInvite").value;
    $.ajax({
        type: 'POST',
        url: '/groupInviteUser',
        data: {
            inviteEmail: inviteEmail,
            userEmail: userEmail,
            groupID: groupID,
            reqTypeInvite
        },
        success: (result) => {
            console.log("Invite Request was successfully Sent!");
            console.log(result);
        },
        error: () => {
            console.log("Invite Request was unsuccessfully Sent");
        }
    });
    return false;
});

function userInvited(data) {
    console.log(data);
    //todo: display notification to user
}

function fillGroups() {
    let data = document.getElementById("group").innerHTML;
    data = JSON.parse(data);
    data.boards.forEach((b) => createBoard(b, data.group.group_id));
    data.events.forEach((e) => createEvent(e));
}
// Function to create event card
function createEvent (event) {
    console.log(event);
    
    let date = event.startdate + " " + event.starttime + " - " + event.enddate + " " + event.endtime;
    let url = "eventHomePage/" + event.eventid;

    let eventAnchor = document.createElement("a");
    eventAnchor.className = "list-group-item list-group-item-action";
    eventAnchor.href = url;
    // make every boardAnchor transparent
    eventAnchor.style.backgroundColor = "transparent";
    eventAnchor.style.borderRadius = "15px";

    let eventCard = document.createElement("div");
    eventCard.className = "d-flex w-100 justify-content-between";

    let eventName = document.createElement("h5");
    eventName.style.fontWeight = 600;
    eventName.innerText = event.eventname;
    eventName.style.color = "white";

    let eventDate = document.createElement("small");
    eventDate.innerText = date;
    eventDate.style.color = "white";

    let eventHost = document.createElement("p");
    eventHost.className = "mb-1";
    eventHost.innerText = "Host: " + event.host;
    eventHost.style.color = "white";
    
    let eventDesc = document.createElement("p");
    eventDesc.className = "mb-1";
    eventDesc.innerText = event.eventdesc;
    eventDesc.style.color = "white";

    eventCard.appendChild(eventName);
    eventCard.appendChild(eventDate);
    eventAnchor.appendChild(eventCard);
    eventAnchor.appendChild(eventHost);
    eventAnchor.appendChild(eventDesc);

    document.getElementById("eventList").appendChild(eventAnchor);
}

function createBoard (board, groupID) {

    console.log(board);

    // Anchor that holds the card
    let boardAnchor = document.createElement("a");
    boardAnchor.className = "list-group-item list-group-item-action";
    boardAnchor.href = "/groupBoardPage/" + groupID + "/" + board.boardid;
    // make every boardAnchor transparent
    boardAnchor.style.backgroundColor = "transparent";
    boardAnchor.style.borderRadius = "15px";

    // Card that holds the info
    let boardCard = document.createElement("div");
    boardCard.className = "d-flex justify-content-between";

    // First child of the card - the board's name
    let boardName = document.createElement("h5")
    boardName.innerText = board.boardname;
    boardName.style.color = "white";

    // Second child of the card - the board's description
    let boardDesc = document.createElement("span");
    boardDesc.className = "mb-1";
    boardDesc.innerText = board.boarddesc;
    boardDesc.style.color = "white";

    // Third child of the card - the most recent comment
    /*
    let commentContainer = document.createElement("div");
    commentContainer.className = "d-flex justify-content-between";

    let commentContent = document.createElement("small");
    commentContent.style.fontStyle = "font-italic";
    commentContent.innerText = comment.author + ": " + comment.text;

    let commentDate = document.createElement("small");
    commentDate.innerText = comment.date;

        // Populate the comment container
    commentContainer.appendChild(commentContent);
    commentContainer.appendChild(commentDate);
    */
    // Put it all together
    boardAnchor.appendChild(boardName);
    boardAnchor.appendChild(boardDesc);
    //boardAnchor.appendChild(commentContainer);

    document.getElementById("boardList").appendChild(boardAnchor);
}
