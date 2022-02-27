//jshint esversion:6
window.onload = () => {
    createEvent({"name":"Study Time","date":"03 Mar 2022","desc":"Android Dreamin\'"});
    createEvent({"name":"Compiler","date":"03 Mar 2022","desc":"Cram Time"});
    createBoard({"name":"Course Questions","desc":"Have questions about course concepts?"}, {"author":"Daniel G","text":"How do I dynamically hide elements?", "date":"13:42 03 Mar 2022"});
    createBoard({"name":"Homework Help","desc":"Have questions about homework?"}, {"author":"John D","text":"Please help!?", "date":"21:52 13 Mar 2022"});

};

// Function to create event card
function createEvent (event) {
    console.log(event);

    let eventAnchor = document.createElement("a");
    eventAnchor.className = "list-group-item list-group-item-action";
    eventAnchor.href = "#";

    let eventCard = document.createElement("div");
    eventCard.className = "d-flex w-100 justify-content-between";

    let eventName = document.createElement("h5");
    eventName.innerText = event.name;

    let eventDate = document.createElement("small");
    eventDate.innerText = event.date;

    let eventDesc = document.createElement("p");
    eventDesc.className = "mb-1";
    eventDesc.innerText = event.desc;

    eventCard.appendChild(eventName);
    eventCard.appendChild(eventDate);
    eventAnchor.appendChild(eventCard);
    eventAnchor.appendChild(eventDesc);

    document.getElementById("eventList").appendChild(eventAnchor);
}

function createBoard (board, comment) {

    console.log(board);

    // Anchor that holds the card
    let boardAnchor = document.createElement("a");
    boardAnchor.className = "list-group-item list-group-item-action";
    boardAnchor.href = "#";

    // Card that holds the info
    let boardCard = document.createElement("div");
    boardCard.className = "d-flex justify-content-between";

    // First child of the card - the board's name
    let boardName = document.createElement("h5");
    boardName.innerText = board.name;

    // Second child of the card - the board's description
    let boardDesc = document.createElement("span");
    boardDesc.className = "mb-1";
    boardDesc.innerText = board.desc;

    // Third child of the card - the most recent comment
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

    // Put it all together
    boardAnchor.appendChild(boardName);
    boardAnchor.appendChild(boardDesc);
    boardAnchor.appendChild(commentContainer);

    document.getElementById("boardList").appendChild(boardAnchor);
}
