async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;
    
    if (method === "POST") {
        let response = await fetch(url, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
    
        response = await response.json();
        return response;
    } else if (method === "GET") {
        url = url + "?" + new URLSearchParams(data);
        let response = await fetch(url, {
            method: "GET",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
        response = await response.json();
        return response;
    }
}

let username;
let balance;
let points = 1000;
checkUser();

let authorizationForm = document.getElementById("authorization");
authorizationForm.addEventListener("submit", authorization);

async function authorization(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    username = formData.get('username');

    let response = await sendRequest("user", "GET", {username});
    if (response.error) {
        let regResponse = await sendRequest("user", "POST", {username});
        if (regResponse.error) { 
            alert(regResponse.message);
        } else { 
            balance = regResponse.balance;
            showUser();
        }
    } else {
        balance = response.balance;
        showUser();
    }
}

function showUser() {
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "none";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[${username}, ${balance}]`;
    localStorage.setItem("username", username);
    
    if (gameButton) {
        if(localStorage.getItem("game-id")) {
            gameButton.setAttribute("data-game", "stop");
        } else {
            gameButton.setAttribute("data-game", "start");
        }
    }
}

document.querySelector('.exit').addEventListener('click', exit);

function exit() {
    localStorage.removeItem("username");
    localStorage.removeItem("game-id");
    let popUpSection = document.querySelector('section');
    popUpSection.style.display = "flex";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[]`;
}

async function checkUser() {
    if(localStorage.getItem("username")) {
        username = localStorage.getItem("username");
        let response = await sendRequest("user", "GET", {username});
        if (response.error) {
            alert(response.message);
        } else {
            balance = response.balance;
            showUser();
        }
    } else {
        let popUpSection = document.querySelector('section');
        popUpSection.style.display = "flex";
    }
}

let pointBtns = document.getElementsByName("point");
pointBtns.forEach((elem) => {
    elem.addEventListener('input', setPoints);
});

function setPoints() {
    let checkedBtn = document.querySelector("input[name='point']:checked");
    points = +checkedBtn.value;
}

let gameButton = document.getElementById("gameButton");
if (gameButton) {
    gameButton.addEventListener('click', startOrStopGame);
}

function startOrStopGame() {
    let option = gameButton.getAttribute("data-game");
    if (option === "start") {
        if (points > 0) {
            startGame();
        }
    } else if (option === "stop") {
    }
}

async function startGame() {
    let response = await sendRequest("new_game", "POST", {username, points});
    if(response.error) {
        alert(response.message);
    } else {
        console.log(response);
    }
}
