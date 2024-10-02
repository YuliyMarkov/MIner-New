async function sendRequest(url, method, data) {
  url = `https://tg-api.tehnikum.school/tehnikum_course/minesweeper/${url}`;

  let response;
  if (method === "POST") {
      response = await fetch(url, {
          method: "POST",
          headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
      });
  } else if (method === "GET") {
      url = url + "?" + new URLSearchParams(data);
      response = await fetch(url, {
          method: "GET",
          headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
          },
      });
  }

  return response.json();
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
      gameButton.setAttribute("data-game", localStorage.getItem("game-id") ? "stop" : "start");
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
  let columns = 10;
  let rows = 8;
  cells.forEach((cell, i) => {
      setTimeout(() => {
          let row = Math.floor(i / columns);
          let column = i % columns;
          cell.setAttribute("data-row", row);
          cell.setAttribute("data-column", column);
          cell.classList.add("active");
          cell.addEventListener("contextmenu", setFlag);
          cell.addEventListener("click", makeStep);
      }, 10 * i);
  });
}

function setFlag(event) {
  event.preventDefault();
  let cell = event.target;
  cell.classList.toggle("flag");
}

async function makeStep(event) {
  let cell = event.target;
  let row = +cell.getAttribute("data-row");
  let column = +cell.getAttribute("data-column");

  let response = await sendRequest("game_step", "POST", { game_id, row, column });
  if (response.error) {
      alert(response.message);
  } else {
      if (response.status === "Won" || response.status === "Failed") {
          revealAllCells(response.table);
          balance = response.balance;
          showUser();
          gameButton.setAttribute("data-game", "start");
          gameButton.innerHTML = "ИГРАТЬ";

          // Добавляем задержку перед показом сообщения
          setTimeout(() => {
              showResultPopUp(response.status === "Won" ? "Ты выиграл!" : "Ты проиграл");
          }, 2000); // 2000 миллисекунд = 2 секунды

      } else if (response.status === "Ok") {
          updateArea(response.table);
      }
  }
}

function revealAllCells(table) {
  let cells = document.querySelectorAll(".cell");
  let j = 0;
  for (let row = 0; row < table.length; row++) {
      for (let column = 0; column < table[row].length; column++) {
          let value = table[row][column];
          cells[j].classList.remove("active");
          cells[j].classList.remove("flag");

          // Проверяем значение и отображаем соответствующее содержимое
          if (value === 0) {
              cells[j].innerHTML = ''; // Пустая ячейка
          } else if (value >= 1) {
              cells[j].innerHTML = value; // Число
          } else if (value === "BOMB") {
              cells[j].classList.add("bomb"); // Бомба
              cells[j].innerHTML = '💣'; // Эмодзи бомбы
          }
          j++;
      }
  }
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
              cells[j].innerHTML = ''; // Пустая ячейка
          } else if (value >= 1) {
              cells[j].classList.remove("active");
              cells[j].classList.remove("flag");
              cells[j].innerHTML = value; // Число
          } else if (value === "BOMB") {
              cells[j].classList.remove("active");
              cells[j].classList.remove("flag");
              cells[j].classList.add("bomb"); // Бомба
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

function showResultPopUp(message) {
  let popUpSection = document.createElement("section");
  popUpSection.className = "resultPopUp";  // Добавляем класс для стилизации
  popUpSection.style.display = "flex";
  popUpSection.style.justifyContent = "center";
  popUpSection.style.alignItems = "center";

  let popUpContent = document.createElement("div");
  popUpContent.className = "popUpContent"; // Добавляем класс для стилизации
  popUpContent.innerHTML = `<h2>${message}</h2><button class="closeButton">Закрыть</button>`;

  popUpSection.appendChild(popUpContent);
  document.body.appendChild(popUpSection);

  popUpContent.querySelector(".closeButton").addEventListener("click", () => {
      clearArea(); // Очищаем игровое поле
      document.body.removeChild(popUpSection);
  });
}

function clearArea() {
  let area = document.querySelector(".area");
  area.innerHTML = "";
  for (let i = 0; i < 80; i++) {
      let cell = document.createElement("div");
      cell.className = "cell";
      area.appendChild(cell);
  }
}
