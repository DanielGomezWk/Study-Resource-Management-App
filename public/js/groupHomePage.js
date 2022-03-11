document.addEventListener('DOMContentLoaded', (event) => {
    console.log("about to load page!");
    addIdToForm();
    fillGroups();
});

socket.on('post', (newMessage) => {
   console.log(newMessage);
});
$('#tempForm').click(function (e) {
    e.preventDefault();
    let msg = document.getElementById("messageTemp").value;
    let userEmail = document.getElementById("emailTemp").value;
    let bId = document.getElementById("boardIDTemp").value;
    let gId = document.getElementById("groupIDTemp").value;
    $.ajax({
        type: 'POST',
        url: '/groupPageCreatePost/1',
        data: {
            message: msg,
            email: userEmail,
            boardID: bId,
            groupID: gId
        },
        success: (result) => {
            console.log("Message successfully sent to the server and returned!");
            console.log(result);
        },
        error: () => {
            console.log("Message was not successfully sent and/or returned!");
        }
    });
    return false;
});
function addIdToForm() {
    let data =document.getElementById("group").innerHTML;
    let obj = JSON.parse(data);
    console.log(obj);
    let postRoute = document.getElementById("groupID");
    postRoute.value = obj.group.group_id;
    console.log(obj.group.group_id);

    //TEMPORARY CODE FOR SHOWING OFF MESSAGING
    //TODO: create proper containers/handling for messages
    let email = document.getElementById("emailTemp");
    let boardID = document.getElementById("boardIDTemp");
    let reqType = document.getElementById("reqTypeTemp");
    let groupID = document.getElementById("groupIDTemp");

    email.value = "john@joe";
    boardID.value = 40;
    groupID.value = 1;
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
    let url = "http://cubchat3.herokuapp.com/eventHomePage/" + event.eventid;

    let eventAnchor = document.createElement("a");
    eventAnchor.className = "list-group-item list-group-item-action";
    eventAnchor.href = url;

    let eventCard = document.createElement("div");
    eventCard.className = "d-flex w-100 justify-content-between";

    let eventName = document.createElement("h5");
    eventName.style.fontWeight = 600;
    eventName.innerText = event.eventname;

    let eventDate = document.createElement("small");
    eventDate.innerText = date;

    let eventHost = document.createElement("p");
    eventHost.className = "mb-1";
    eventHost.innerText = "Host: " + event.host;
    
    let eventDesc = document.createElement("p");
    eventDesc.className = "mb-1";
    eventDesc.innerText = event.eventdesc;

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
    boardAnchor.href = "/groupPage/" + groupID + "/" + board.boardid;

    // Card that holds the info
    let boardCard = document.createElement("div");
    boardCard.className = "d-flex justify-content-between";

    // First child of the card - the board's name
    let boardName = document.createElement("h5")
    boardName.innerText = board.boardname;

    // Second child of the card - the board's description
    let boardDesc = document.createElement("span");
    boardDesc.className = "mb-1";
    boardDesc.innerText = board.boarddesc;

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
