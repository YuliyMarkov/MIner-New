async function sendRequest(url, method, data) {
    url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;
  
    if (method === "POST") {
      let response = await fetch(url, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
  
      response = await response.json();
      return response;
    } else if (method === "GET") {
      url = url + "?" + new URLSearchParams(data);
      let response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
      response = await response.json();
      return response;
    }
  }
  
  let username;
  let balance;
  let points = 1000;
  let game_id;
  checkUser();
  
  let authorizationForm = document.getElementById("authorization");
  authorizationForm.addEventListener("submit", authorization);
  
  async function authorization(event) {
    event.preventDefault();
  
    const formData = new FormData(event.target);
    username = formData.get("username");
  
    let response = await sendRequest("user", "GET", { username });
    if (response.error) {
      let regResponse = await sendRequest("user", "POST", { username });
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
    let popUpSection = document.querySelector("section");
    popUpSection.style.display = "none";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[${username}, ${balance}]`;
    localStorage.setItem("username", username);
  
    if (gameButton) {
      if (localStorage.getItem("game-id")) {
        gameButton.setAttribute("data-game", "stop");
      } else {
        gameButton.setAttribute("data-game", "start");
      }
    }
  }
  
  document.querySelector(".exit").addEventListener("click", exit);
  
  function exit() {
    localStorage.removeItem("username");
    localStorage.removeItem("game-id");
    let popUpSection = document.querySelector("section");
    popUpSection.style.display = "flex";
    let userInfo = document.querySelector("header span");
    userInfo.innerHTML = `[]`;
  }
  
  async function checkUser() {
    if (localStorage.getItem("username")) {
      username = localStorage.getItem("username");
      let response = await sendRequest("user", "GET", { username });
      if (response.error) {
        alert(response.message);
      } else {
        balance = response.balance;
        showUser();
      }
    } else {
      let popUpSection = document.querySelector("section");
      popUpSection.style.display = "flex";
    }
  }
  
  let pointBtns = document.getElementsByName("point");
  pointBtns.forEach((elem) => {
    elem.addEventListener("input", setPoints);
  });
  
  function setPoints() {
    let checkedBtn = document.querySelector("input[name='point']:checked");
    points = +checkedBtn.value;
  }
  
  let gameButton = document.getElementById("gameButton");
  if (gameButton) {
    gameButton.addEventListener("click", startOrStopGame);
  }
  
  function startOrStopGame() {
    let option = gameButton.getAttribute("data-game");
    if (option === "start") {
      if (points > 0) {
        startGame();
      }
    } else if (option === "stop") {
      stopGame();
    }
  }
  
  async function startGame() {
    let response = await sendRequest("new_game", "POST", { username, points });
    if (response.error) {
      alert(response.message);
    } else {
      console.log(response);
      game_id = response.game_id;
      gameButton.setAttribute("data-game", "stop");
      gameButton.innerHTML = "ЗАВЕРШИТЬ ИГРУ";
      activateArea();
    }
  }
  
  function activateArea() {
    let cells = document.querySelectorAll(".cell");
    let rows = 8;
    let columns = 10;
    cells.forEach((cell, i) => {
      setTimeout(() => {
        let row = Math.floor(i / columns);
        let column = i - row * columns;
        cell.classList.add("active");
        cell.addEventListener("contextmenu", setFlag);
        cell.addEventListener("click", makeStep);
      }, 30 + i);
    });
  }
  
  function setFlag() {
    event.preventDefault();
    let cell = event.target;
    cell.classList.toggle("flag");
  }
  
  async function makeStep() {
    let cell = event.target;
    let row = +cell.getAttribute("data-row");
    let collum = +cell.getAttribute("data-column");
  
    let response = await sendRequest("game_step", "POST", (game_id, row, column));
    if (response.error) {
      alert(response.message);
    } else {
      if (response.status == "Won") {
        updateArea(response.table);
        balance = response.balance
        showUser()
        alert("Ты выиграл!")
        clearArea()
        gameButton.setAttribute("data-game", "start");
        gameButton.innerHTML = "ИГРАТЬ";
      } else if (response.status == "Failed") {
          updateArea(response.table);
          balance = response.balance
          showUser()
          alert("Ты проиграл...")
          clearArea()
          gameButton.setAttribute("data-game", "start");
      } else if (response.status == "Ok") {
        updateArea(response.table);
      }
    }
  
    console.log(cell, row, column);
  }
  
  function updateArea(table) {
    let cells = document.querySelectorAll(".cell");
    let j = 0;
    for (let row = 0; row < table.length; row++) {
      for (let column = 0; column < table[row].length; column++) {
        let value = table[row][column];
        if (value === 0) {
          cells[j].classList.remove("active");
          cells[j].classList.remove("flag");
        } else if (value == 1) {
          cells[j].classList.remove("active");
          cells[j].classList.remove("flag");
          cells[j].innerHTML = value;
        } else if (value == "BOMB") {
          cells[j].classList.remove("active");
          cells[j].classList.remove("flag");
          cells[j].classList.add("bomb");
        }
        j++;
      }
    }
  }
  
  async function stopGame() {
    let response = await sendRequest("stop_game", "POST", { username, game_id });
    if (response.error) {
      alert(response.message);
    } else {
      console.log(response);
      balance = response.balance;
      showUser();
      game_id = "";
      gameButton.setAttribute("data-game", "start");
      gameButton.innerHTML = "ИГРАТЬ";
      clearArea();
    }
  }
  
  function clearArea() {
    let area = document.querySelector(".area");
    area.innerHTML = "";
    for (let i = 0; i < 80; i++) {
      area.innerHTML = area.innerHTML + `<div class="cell"></div>`;
    }
  }
  