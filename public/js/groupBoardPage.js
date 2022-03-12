// TODO:
// - Add post creation
// - Add pagination
// - Add post reacting
// - Add post deletion

let currentPage;
let maxPages;
let postsPerPage = 10;
let data;
let length;

// Functions to run at the beginning of the page
window.onload = () => {
    // Parse the data initially sent to the page
    data = JSON.parse(document.getElementById("data").innerText);
    console.log(data);

    // Retrieve which page we're on
    // and how many pages of posts exist
    length = data.posts.length;
    maxPages = Math.ceil(length / postsPerPage);
    currentPage = Math.ceil(length / postsPerPage);

    // Set the current page number
    document.getElementById("currentPageBtn").innerText = currentPage;

    // If there is only one page, there are no other pages to navigate to
    if (currentPage === 1) {
        document.getElementById("nextPageAnch").className = "page-item disabled";
        document.getElementById("prevPageAnch").className = "page-item disabled";
    }

    showPosts();

    // Set the timeout - refreshes post content
    //setTimeout(async () => {
    //    await refreshPage();
    //}, 15000);
};

// Displays posts according to the current page and the posts per page the user wishes to see
function showPosts() {
        // Wipe the inner HTML of the post list - removes all currently displayed posts
        document.getElementById("postList").innerHTML = "";

        // Build the persistent header post [board title & description]
        buildBoardHeader(data.boardInfo[0]);

        // Find the beginning post index for the current page
        let begin = (currentPage - 1) * postsPerPage;
        let end = begin + (postsPerPage - 1);

        console.log(begin);
        console.log(end);

        // Prevent out-of-bounds errors by using whichever comes sooner
        end = Math.min(end, length - 1);

        // Build the posts
        for (let i = begin; i < end; i++) {
            buildPost(data.posts[i]);
        }
}

function showNext() {
    currentPage++;
    // Enable the previous button
    document.getElementById("prevPageAnch").className = "page-item";
    document.getElementById("prevPageAnch").setAttribute("onclick", "showNext()");

    // Change the current page
    document.getElementById("currentPageBtn").innerText = currentPage;

    // Disable the next button (if on the last page)
    if (currentPage === maxPages) {
        document.getElementById("nextPageAnch").onclick = "";
        document.getElementById("nextPageAnch").className = "page-item disabled";
    }
    showPosts();
}
function showPrevious() {
    currentPage--;
    // Enable the next button
    document.getElementById("nextPageAnch").className = "page-item";
    document.getElementById("nextPageAnch").setAttribute("onclick", "showNext()");

    // Change the current page
    document.getElementById("currentPageBtn").innerText = currentPage;

    // Disable the previous button (if on the first page)
    if (currentPage === 1) {
        document.getElementById("prevPageAnch").onclick = "";
        document.getElementById("prevPageAnch").className = "page-item disabled";
    }
    showPosts();
}

async function refreshPage() {
    let url = window.location.pathname;
    let args = url.split("/");
    let groupID = args[args.length - 2];
    let boardID = args[args.length - 1];
    let data = await $.get("/groupPage/" + groupID + "/" + boardID);

    // Wipe the post list
    document.getElementById("postList").innerHTML("");

    // Header post
    buildBoardHeader(data.board);

    // Build them again
    data.forEach((p) => buildPost(p));
}

function buildPost (post) {
    console.log(post);
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

    // TODO - Make the delete button appear only for the author of the post, admins, and moderators
    let deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-danger btn-sm";

    // Set the score in this container to the post's current score
    let cubVoteContainer = document.createElement("small");
    cubVoteContainer.innerText = post.postvotes;

    let reactIcon = document.createElement("i");
    reactIcon.className="bi bi-hand-thumbs-up-fill";

    let delIcon = document.createElement("i");
    delIcon.className="bi bi-trash-fill";

    // Attach the icons to the buttons,
    // the score to the container,
    // and the button to the container
    reactButton.appendChild(reactIcon);
    deleteButton.appendChild(delIcon);
    scoreDiv.appendChild(cubVoteContainer);
    scoreDiv.appendChild(reactButton);
    scoreDiv.appendChild(deleteButton);

    scoreCol.appendChild(scoreDiv);

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
    postContent.innerText = post.postcontent;

    contentCol.appendChild(postInfo);
    contentCol.appendChild(postContent);

    row.appendChild(scoreCol);
    row.appendChild(contentCol);

    card.appendChild(row);

    document.getElementById("postList").appendChild(card);
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