$(document).ready(function() {
    let data = JSON.parse(${"#data"}).innerText;
    data.posts.forEach((p) => buildPost(p));
    buildBoard(data.board);

    setTimeout(async () => {
        await refreshPage();
    }, 15000);
});

async function refreshPage() {
    let url = window.location.pathname;
    let args = url.split("/");
    let groupID = args[args.length - 2];
    let boardID = args[args.length - 1];
    let data = await $.get("/groupPage/" + groupID + "/" + boardID);

    // Wipe the post list
    ${"#postlist"}.html("");

    // Header post
    buildBoardHeader(data.board);

    // Build them again
    data.forEach((p) => buildPost(p));
}

function buildPost (post) {

    // Give the card an ID so that it can be referenced later (for voting/deleting)
    // Parent card element
    let card = document.createElement("div");
    card.className = "list-group-item";
    card.id = post.postid;

    // The row div within the card
    let row = document.createElement("div");
    row.className = "row";

    // The left column of the row - contains the post's cubvotes and the button to vote for that post
    let scoreCol = document.createElement("div");
    scoreCol.className = "col-1 justify-content-center";

    let scoreDiv = document.createElement("div");
    scoreDiv.className = "d-inline-flex w-100 flex-fill justify-content-center"

    let reactButton = document.createElement("button");
    reactButton.type = "button";
    reactButton.className = "btn btn-primary btn-sm";

    // Set the score in this container to the post's current score
    let cubVoteContainer = document.createElement("small");
    cubVoteContainer.innerText = post.postvotes;

    let buttonIcon = document.createElement("i");
    buttonIcon.className="bi bi-hand-thumbs-up-fill";

    // Attach the icon to the button,
    // the score to the container,
    // and the button to the container
    reactButton.appendChild(buttonIcon);
    scoreDiv.appendChild(cubVoteContainer);
    scoreDiv.appendChild(reactButton);

    // The right column of the row - contains the post's author, date/time, and post text
    let contentCol = document.createElement("div");
    contentCol.className = "col-11";

    let postInfo = document.createElement("div");
    postInfo.className = "d-inline-flex w-100 justify-content-between";

    let userDiv = document.createElement("div");
    let author = document.createElement("span");
    author.style.fontWeight = "700";
    // Make the author's name appear here from data
    author.innerText = post.first + " " + post.last;
    let dash = document.createElement("span");
    dash.innerText = " - "
    // Make the author's score appear here from data
    let authorScore = document.createElement("span");
    authorScore.innerText = post.uservotes;

    userDiv.appendChild(author);
    userDiv.appendChild(dash);
    userDiv.appendChild(authorScore);

    // Make the post's date/time appear here from data
    let postTime = document.createElement("small");
    postTime.innerText = post.postdate + post.posttime;

    // Add the author info and post creation time
    postInfo.appendChild(userDiv);
    postInfo.appendChild(postTime);

    // Make the post's content appear here from data
    let postContent = document.createElement("p");
    postContent = post.postcontent;

    contentCol.appendChild(postInfo);
    contentCol.appendChild(postContent);
}

function buildBoardHeader (board) {

    // Anchor that holds the card
    let boardAnchor = document.createElement("div");
    boardAnchor.className = "list-group-item list-group-item-action";

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

    // Put it all together
    boardAnchor.appendChild(boardName);
    boardAnchor.appendChild(boardDesc);

    document.getElementById("postList").appendChild(boardAnchor);
}