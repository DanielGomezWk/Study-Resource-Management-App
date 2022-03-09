document.addEventListener('DOMContentLoaded', (event) => {
    addIdToForm();
    fillGroups();
});
function addIdToForm() {
    let data =document.getElementById("group").innerHTML;
    let obj = JSON.parse(data);
    //console.log(obj);
    // submit group info
    let postRoute = document.getElementById("groupID");
    postRoute.value = obj.group.group_id;

    // submit event info
    let eventRoute = document.getElementById("eGroupID");
    eventRoute.value = obj.group.group_id;

    //console.log(obj.group.group_id);
}
function fillGroups() {
    // let data =document.getElementById("group").innerHTML;
    // let obj = JSON.parse(data);
    // let boards = obj.boards;
    //
    // for (const ele in boards) {
    //     createBoard(boards[ele].boardname, "cool");
    // }
    let data = document.getElementById("group").innerHTML;
    data = JSON.parse(data);
    data.boards.forEach((b) => createBoard(b));
    data.events.forEach((e) => createEvent(e));
}
// Function to create event card
function createEvent (event) {
    //console.log(event);

    let eventAnchor = document.createElement("a");
    eventAnchor.className = "list-group-item list-group-item-action";
    eventAnchor.href = "#"

    let eventCard = document.createElement("div");
    eventCard.className = "d-flex w-100 justify-content-between";

    let eventName = document.createElement("h5");
    eventName.innerText = event.eventname;

    let eventDate = document.createElement("small");
    eventDate.innerText = event.startdate;

    let eventDesc = document.createElement("p");
    eventDesc.className = "mb-1";
    eventDesc.innerText = event.eventdesc;

    eventCard.appendChild(eventName);
    eventCard.appendChild(eventDate);
    eventAnchor.appendChild(eventCard);
    eventAnchor.appendChild(eventDesc);

    document.getElementById("eventList").appendChild(eventAnchor);
}

function createBoard (board) {

    //console.log(board);

    // Anchor that holds the card
    let boardAnchor = document.createElement("a");
    boardAnchor.className = "list-group-item list-group-item-action";
    boardAnchor.href = "#"

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