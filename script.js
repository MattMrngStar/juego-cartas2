document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameArea = document.getElementById("game-area");
  const endScreen = document.getElementById("end-screen");
  const btnStart = document.getElementById("btn-start");
  const btnCheck = document.getElementById("btn-check");
  const btnRestart = document.getElementById("btn-restart");
  const btnPlayAgain = document.getElementById("btn-play-again");
  const timerEl = document.getElementById("timer");
  const scoreEl = document.getElementById("score");
  const finalScoreEl = document.getElementById("final-score");
  const resultTitle = document.getElementById("result-title");
  const bgMusic = document.getElementById("bg-music");

  let timeLeft = 300;
  let score = 0;
  let timer;
  let draggedCard = null;

  // Orden correcto
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

  // Iniciar juego
  btnStart.addEventListener("click", () => {
    startScreen.classList.add("hidden");
    gameArea.classList.remove("hidden");
    startGame();
    bgMusic.play();
  });

  function startGame() {
    score = 0;
    timeLeft = 300;
    scoreEl.textContent = score;
    timerEl.textContent = timeLeft;

    const board = document.getElementById("board");
    board.querySelectorAll(".card").forEach(c => c.remove());

    // Mezclar cartas
    const shuffled = [...correctOrder].sort(() => Math.random() - 0.5);

    shuffled.forEach((img, idx) => {
      const card = document.createElement("div");
      card.className = "card";
      card.draggable = true;
      card.style.backgroundImage = `url('Cartas2/${img}')`;
      card.dataset.value = img;

      // arrastrar
      card.addEventListener("dragstart", e => {
        draggedCard = card;
        setTimeout(() => card.style.display = "none", 0);
      });
      card.addEventListener("dragend", e => {
        draggedCard.style.display = "block";
        draggedCard = null;
      });

      board.appendChild(card);
    });

    // slots
    document.querySelectorAll(".slot").forEach(slot => {
      slot.addEventListener("dragover", e => e.preventDefault());
      slot.addEventListener("drop", e => {
        if (draggedCard) {
          slot.innerHTML = `<span class="slot-number">${slot.dataset.slot*1+1}</span>`;
          slot.appendChild(draggedCard);
        }
      });
    });

    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) endGame(false);
    }, 1000);
  }

  // Validar orden
  btnCheck.addEventListener("click", () => {
    const placed = Array.from(document.querySelectorAll(".slot")).map(slot => {
      const c = slot.querySelector(".card");
      return c ? c.dataset.value : null;
    });

    if (placed.includes(null)) {
      alert("Debes poner todas las cartas en el tablero");
      return;
    }

    let correct = placed.filter((val, i) => val === correctOrder[i]).length;
    score = correct;
    scoreEl.textContent = score;

    if (correct === correctOrder.length) {
      endGame(true);
    } else {
      alert("Algunas cartas no están en orden. Intenta de nuevo.");
    }
  });

  btnRestart.addEventListener("click", startGame);
  btnPlayAgain.addEventListener("click", () => {
    endScreen.classList.add("hidden");
    startScreen.classList.remove("hidden");
  });

  function endGame(won) {
    clearInterval(timer);
    gameArea.classList.add("hidden");
    endScreen.classList.remove("hidden");
    finalScoreEl.textContent = score;
    resultTitle.textContent = won ? "¡Correcto! 🎉" : "Tiempo agotado ⏳";
  }
});

