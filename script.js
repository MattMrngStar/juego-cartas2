// =======================
// CONFIGURACIÓN DEL JUEGO
// =======================
const cards = [
  "CartasSimulacros-01.png",
  "CartasSimulacros-02.png",
  "CartasSimulacros-03.png",
  "CartasSimulacros-04.png",
  "CartasSimulacros-05.png",
  "CartasSimulacros-06.png",
  "CartasSimulacros-07.png",
  "CartasSimulacros-08.png"
];

const correctOrder = [
  "CartasSimulacros-01.png",
  "CartasSimulacros-02.png",
  "CartasSimulacros-03.png",
  "CartasSimulacros-04.png",
  "CartasSimulacros-05.png",
  "CartasSimulacros-06.png",
  "CartasSimulacros-07.png",
  "CartasSimulacros-08.png"
];

const cardBack = "CartasPFE-08.png"; 
const cardFolder = "Cartas2"; 

// =======================
// VARIABLES
// =======================
let startTime;
let timerInterval;
let score = 0;
let draggedCard = null;

// =======================
// INICIAR JUEGO
// =======================
function initGame() {
  const container = document.getElementById("cards-container");
  container.innerHTML = "";

  const shuffled = [...cards].sort(() => Math.random() - 0.5);

  shuffled.forEach((card, index) => {
    const div = document.createElement("div");
    div.classList.add("card");
    div.style.backgroundImage = `url(${cardFolder}/${cardBack})`;
    div.draggable = true;
    div.dataset.front = card;
    div.dataset.index = index;

    div.addEventListener("dragstart", dragStart);
    div.addEventListener("dragover", dragOver);
    div.addEventListener("drop", drop);

    container.appendChild(div);

    // Mostrar frente después de 1s
    setTimeout(() => {
      div.style.backgroundImage = `url(${cardFolder}/${card})`;
    }, 1000);
  });

  resetTimer();
  startTimer();
}

// =======================
// DRAG & DROP
// =======================
function dragStart(e) {
  draggedCard = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function dragOver(e) {
  e.preventDefault();
  const container = this.parentNode;
  const children = Array.from(container.children);
  const draggedIndex = children.indexOf(draggedCard);
  const targetIndex = children.indexOf(this);

  if (draggedIndex < targetIndex) {
    container.insertBefore(draggedCard, this.nextSibling);
  } else {
    container.insertBefore(draggedCard, this);
  }
}

function drop() {
  this.classList.remove("dragging");
}

// =======================
// VALIDAR ORDEN
// =======================
function validateOrder() {
  const container = document.getElementById("cards-container");
  const currentOrder = Array.from(container.children).map(card => card.dataset.front);

  if (JSON.stringify(currentOrder) === JSON.stringify(correctOrder)) {
    clearInterval(timerInterval);
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    score += 10;
    document.getElementById("score").textContent = score;
    alert(`¡Correcto! Has completado el juego en ${elapsedTime} segundos.`);
  } else {
    alert("El orden no es correcto. Intenta de nuevo.");
  }
}

// =======================
// TIMER
// =======================
function startTimer() {
  startTime = Date.now();
  timerInterval = setInterval(() => {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    document.getElementById("timer").textContent = elapsedTime + "s";
  }, 1000);
}

function resetTimer() {
  clearInterval(timerInterval);
  document.getElementById("timer").textContent = "0s";
}

// =======================
// CONTROL PANTALLAS + MÚSICA
// =======================
document.getElementById("start-btn").addEventListener("click", () => {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("game-screen").classList.remove("hidden");

  const music = document.getElementById("bg-music");
  music.volume = 0.3; // volumen bajito
  music.play();

  initGame();
});

document.getElementById("validate-btn").addEventListener("click", validateOrder);
document.getElementById("reset-btn").addEventListener("click", initGame);
