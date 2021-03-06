// TODO:
// - Add post creation
// - Add post reacting
// - Add post deletion

let currentPage;
let maxPages;
let postsPerPage = 10;
let data;
let length = 0;

let urltemp = window.location.pathname;
let args1 = urltemp.split("/");
let GID = args1[args1.length - 3];
let BID = args1[args1.length - 1];

data = JSON.parse(document.getElementById("data").innerText);
console.log(data);
let url = window.location.pathname;
let args = url.split("/");
let gID = args[args.length - 3];
let bID = args[args.length - 1];
let uID = data.session;

document.getElementById("formPost").addEventListener("click", function (e) {
    e.preventDefault();
    $.ajax({
        type: 'POST',
        url: '/createPost',
        data: {
            groupID: gID,
            boardID: bID,
            email: uID,
            message: document.getElementById("messagePost").value
        },
        success: (result) => {
            // console.log(result);
        },
        error: () => {
            console.log("message was unsuccessfully sent");
        }
    });
    return false;
});

// Functions to run at the beginning of the page
window.onload = async () => {
    // Parse the data initially sent to the page
    data = JSON.parse(document.getElementById("data").innerText);
    console.log(data);
    socket.emit("connection");
    let url = window.location.pathname;

    // Retrieve which page we're on
    // and how many pages of posts exist
    length = data.posts.length;
    maxPages = Math.floor(length / (postsPerPage + 1)) + 1;
    currentPage = Math.ceil(length / postsPerPage);

    // Change the current page
    document.getElementById("currentPageAnch").innerText = currentPage;

    // If there is only one page, there are no other pages to navigate to
    if (currentPage === 1) {
        document.getElementById("nextPageBtn").className = "page-item disabled";
        document.getElementById("prevPageBtn").className = "page-item disabled";
    }

    showPosts();
    await setOnClicks();
};

async function onPost (d) {
    data.posts.push({
        email: d.email,
        first: d.first,
        last: d.last,
        postcontent: d.postcontent,
        postdate: d.postdate,
        postid: d.postid,
        posttime: d.posttime,
        postvotes: d.postvotes,
        uservotes: d.postvotes,
    });

    length = data.posts.length;
    maxPages = Math.floor(length / (postsPerPage + 1)) + 1;

    if (maxPages > currentPage) {
        document.getElementById("nextPageBtn").classname = "page-item";
    }

    showPosts();
    await setOnClicks();
}

// Displays posts according to the current page and the posts per page the user wishes to see
function showPosts() {
        // Wipe the inner HTML of the post list - removes all currently displayed posts
        document.getElementById("postList").innerHTML = "";

        // Build the persistent header post [board title & description]
        buildBoardHeader(data.boardInfo[0]);

        // Retrieve which page we're on
        // and how many pages of posts exist
        length = data.posts.length;
        maxPages = Math.floor(length / (postsPerPage + 1)) + 1;

        console.log("maxPages: " + maxPages);
        console.log("currentPage: " + currentPage);
        console.log("data.posts.length: " + length);

        // Find the beginning post index for the current page
        let begin = (currentPage - 1) * postsPerPage;
        let end = begin + (postsPerPage - 1);

        console.log(begin);
        console.log(end);

        // Prevent out-of-bounds errors by using whichever comes sooner
        end = Math.min(end, length - 1);

        console.log(end);

        // Build the posts
        for (let i = begin; i <= end; i++) {
            buildPost(data.posts[i], data.session);
            console.log("post num: " + i);
        }
}

// Sets on click events for the voting and delete buttons
async function setOnClicks() {

    // Find the beginning post index for the current page
    let begin = (currentPage - 1) * postsPerPage;
    let end = begin + (postsPerPage - 1);

    // Prevent out-of-bounds errors by using whichever comes sooner
    end = Math.min(end, length - 1);

    // Iterate through the posts
    for (let i = begin; i <= end; i++) {
        let cubvoteID = "cubvote" + data.posts[i].postid;
        let deleteID = "delete" + data.posts[i].postid;

        let url = window.location.pathname;
        let args = url.split("/");
        let groupID = args[args.length - 3];
        let boardID = args[args.length - 1];
        let postID = data.posts[i].postid;
        let userID = data.session;

        // Set cubvote click functions
        $('#' + cubvoteID).click(function (e) {
            e.preventDefault();
            $.ajax({
                type: 'POST',
                url: '/cubvotePost',
                data: {
                    groupID: groupID,
                    boardID: boardID,
                    postID: postID,
                    userID: userID
                },
                success: (result) => {
                    if (result.cubvote) {
                        data.posts[i].postvotes++;
                        showPosts();
                        setOnClicks();
                        console.log("Post voted successfully!");
                        console.log(result);
                    } else {
                        data.posts[i].postvotes--;
                        showPosts();
                        setOnClicks();
                        console.log("Post unvoted successfully!");
                        console.log(result);
                    }
                },
                error: () => {
                    console.log("Post vote was unsuccessfully sent");
                }
            });
            return false;
        });

        // Set delete post functions

        $('#' + deleteID).click(function (e) {
            e.preventDefault();
            $.ajax({
                type: 'POST',
                url: '/deletePost',
                data: {
                    groupID: groupID,
                    boardID: boardID,
                    postID: postID,
                    userID: userID
                },
                success: (result) => {
                    alert("Successfully deleted");

                    //deleting first post
                    if (i === 0) {
                        //2nd post to last post
                        data.posts = data.posts.slice(1, data.posts.length);
                    }
                    //deleting normal post
                    else if (i === data.length - 1) {
                        data.posts = data.posts.slice(0, data.posts.length - 1);
                    }
                    //deleting last post
                    else {
                        let part1 = data.posts.slice(0,i);
                        let part2 = data.posts.slice(i + 1, data.posts.length);
                        data.posts = part1.concat(part2);
                    }

                    // Update length
                    length = data.posts.length;

                    // Show posts and set on click
                    showPosts();
                    setOnClicks();
                },
                error: () => {
                    console.log("Post was unsuccessfully deleted");
                }
            });
            return false;
        });

    }
}


async function showNext() {
    currentPage++;
    // (Re-)Enable the previous button: Enable button and (re)add onclick to anchor
    document.getElementById("prevPageBtn").className = "page-item";
    document.getElementById("prevPageAnch").setAttribute("onclick", "showPrevious()");

    // Change the current page
    document.getElementById("currentPageAnch").innerText = currentPage;

    console.log("maxPages in showNext(): " + maxPages);
    // Disable the next button (if on the last page)
    if (currentPage === maxPages) {
        // Remove the onclick from the anchor
        document.getElementById("nextPageAnch").onclick = "";
        // Disable the button
        document.getElementById("nextPageBtn").className = "page-item disabled";
    }
    showPosts();
    await setOnClicks();
}
async function showPrevious() {
    currentPage--;
    // (Re-)Enable the next button: Enable button and (re)add onclick to anchor
    document.getElementById("nextPageBtn").className = "page-item";
    document.getElementById("nextPageAnch").setAttribute("onclick", "showNext()");

    // Change the current page in the current page anchor
    document.getElementById("currentPageAnch").innerText = currentPage;

    // Disable the previous button (if on the first page)
    if (currentPage === 1) {
        // Remove the onclick from the anchor
        document.getElementById("prevPageAnch").onclick = "";
        // Disable the button
        document.getElementById("prevPageBtn").className = "page-item disabled";
    }
    showPosts();
    await setOnClicks();
}

async function refreshPage() {
    let url = window.location.pathname;
    let args = url.split("/");
    let groupID = args[args.length - 2];
    let boardID = args[args.length - 1];
    console.log("refreshing")
    document.outerHTML = await $.get("/groupPage/" + groupID + "/groupBoardPage/" + boardID);
    
    /*
    console.log("refresh data: " + data);
    // Wipe the post list
    document.getElementById("postList").innerHTML("");

    // Build the persistent header post [board title & description]
    buildBoardHeader(data.boardInfo[0]);

    // Find the beginning post index for the current page
    let begin = (currentPage - 1) * postsPerPage;
    let end = begin + (postsPerPage - 1);

    // Prevent out-of-bounds errors by using whichever comes sooner
    end = Math.min(end, length - 1);

    // Build the posts
    for (let i = begin; i < end; i++) {
        buildPost(data.posts[i]);
    }
    */
}

function buildPost (post, email) {
    // console.log(post);
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
    reactButton.id = "cubvote" + post.postid;

    // TODO - Make the delete button appear only for the author of the post, admins, and moderators
    let deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "btn btn-danger btn-sm";
    deleteButton.id = "delete" + post.postid;

    // Set the score in this container to the post's current score
    let cubVoteContainer = document.createElement("small");
    cubVoteContainer.innerText = post.postvotes;
    cubVoteContainer.id = "postvotes" + post.postid;

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
    scoreDiv.appendChild(deleteButton);
    scoreDiv.appendChild(reactButton);

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