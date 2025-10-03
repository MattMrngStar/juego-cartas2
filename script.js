document.addEventListener("DOMContentLoaded", () => {
  console.log("Simulacros: DOM ready");

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

  if (!btnStart) { console.error("btn-start no encontrado"); return; }

  const correctOrder = [
    "CartasSimulacros-01.png","CartasSimulacros-02.png","CartasSimulacros-03.png",
    "CartasSimulacros-04.png","CartasSimulacros-05.png","CartasSimulacros-06.png",
    "CartasSimulacros-07.png","CartasSimulacros-08.png"
  ];
  const cardFolder = "Cartas2";

  let timeLeft = 300;
  let timer = null;
  let score = 0;

  // Estado drag
  let draggingCard = null;    // elemento original dentro del slot
  let dragClone = null;       // clon fijo que sigue el pointer
  let originSlot = null;
  let offsetX = 0, offsetY = 0;
  let targetX = 0, targetY = 0;
  let lastClientX = 0;
  let dragging = false;
  let rafId = null;

  // util shuffle
  const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

  // coloca cartas aleatorias dentro de los slots (ya dentro)
  function placeShuffledCards() {
    const slots = Array.from(document.querySelectorAll(".slot"));
    // reset slots (mantener números)
    slots.forEach((slot, i) => {
      slot.innerHTML = `<span class="slot-number">${i+1}</span>`;
    });

    const shuffled = shuffle(correctOrder);
    if (slots.length !== shuffled.length) console.warn("slots vs cartas:", slots.length, shuffled.length);

    shuffled.forEach((imgName, i) => {
      const img = document.createElement("img");
      img.className = "card";
      img.draggable = false;
      img.src = `${cardFolder}/${imgName}`;
      img.alt = imgName;
      img.dataset.image = imgName;
      img.style.touchAction = "none"; // important for mobile
      // pointer-based drag
      img.addEventListener("pointerdown", onPointerDown);
      // prevent native DnD fallback
      img.addEventListener("dragstart", e => e.preventDefault());
      slots[i].appendChild(img);
    });
  }

  // pointer handlers
  function onPointerDown(e) {
    // only primary
    if (e.button && e.button !== 0) return;

    draggingCard = e.currentTarget;
    originSlot = draggingCard.parentElement;

    const rect = draggingCard.getBoundingClientRect();
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    targetX = rect.left;
    targetY = rect.top;
    lastClientX = e.clientX;

    // crear clon visual (fixed) y ajustar imagen de fondo para que quede igual
    dragClone = document.createElement("div");
    dragClone.className = "dragging-clone";
    dragClone.style.width = rect.width + "px";
    dragClone.style.height = rect.height + "px";
    dragClone.style.backgroundImage = `url(${draggingCard.src})`;
    dragClone.style.left = (e.clientX - offsetX) + "px";
    dragClone.style.top = (e.clientY - offsetY) + "px";
    document.body.appendChild(dragClone);

    // ocultar original
    draggingCard.style.visibility = "hidden";

    // start listeners
    dragging = true;
    // capture pointer on original so we get events (some browsers)
    try { draggingCard.setPointerCapture(e.pointerId); } catch (err) { /* noop */ }
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { once: true });

    // start RAF loop
    rafId = requestAnimationFrame(updateDragClone);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault(); // prevent scrolling on touch
    targetX = e.clientX - offsetX;
    targetY = e.clientY - offsetY;
    lastClientX = e.clientX;
  }

  function updateDragClone() {
    if (!dragClone) return;
    const dx = (lastClientX - (targetX + offsetX)) || 0; // small rotation input
    const rot = Math.max(-14, Math.min(14, dx * 0.12));
    // position clone at (targetX, targetY)
    dragClone.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(1.06) rotate(${rot}deg)`;

    // highlight slot under pointer
    const elem = document.elementFromPoint(lastClientX, targetY + offsetY);
    const slotUnder = elem ? elem.closest(".slot") : null;
    document.querySelectorAll(".slot").forEach(s => s.classList.toggle("over", s === slotUnder));

    if (dragging) rafId = requestAnimationFrame(updateDragClone);
  }

  function nearestSlotToPoint(x, y) {
    const slots = Array.from(document.querySelectorAll(".slot"));
    let best = null, bestD = Infinity;
    slots.forEach(s => {
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const d = Math.hypot(cx - x, cy - y);
      if (d < bestD) { bestD = d; best = s; }
    });
    return best;
  }

  function onPointerUp(e) {
    dragging = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener("pointermove", onPointerMove);

    // Find target slot under pointer
    const elem = document.elementFromPoint(e.clientX, e.clientY);
    let targetSlot = elem ? elem.closest(".slot") : null;
    if (!targetSlot) targetSlot = nearestSlotToPoint(e.clientX, e.clientY);
    if (!targetSlot) targetSlot = originSlot;

    // Swap logic
    if (targetSlot === originSlot) {
      originSlot.appendChild(draggingCard);
    } else {
      const existing = targetSlot.querySelector(".card");
      if (existing) {
        // move existing back to originSlot
        originSlot.appendChild(existing);
      }
      targetSlot.appendChild(draggingCard);
    }

    // cleanup visuals
    document.querySelectorAll(".slot").forEach(s => s.classList.remove("over"));
    if (dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
    dragClone = null;

    if (draggingCard) draggingCard.style.visibility = "visible";
    try { draggingCard.releasePointerCapture && draggingCard.releasePointerCapture(e.pointerId); } catch (err) {}
    draggingCard = null;
    originSlot = null;
  }

  /* --- Timer & Game flow --- */
  function startTimer() {
    clearInterval(timer);
    timeLeft = 300;
    timerEl.textContent = timeLeft;
    timer = setInterval(() => {
      timeLeft--;
      timerEl.textContent = timeLeft;
      if (timeLeft <= 0) {
        clearInterval(timer);
        showEnd(false);
      }
    }, 1000);
  }

  function startGame() {
    console.log("Start game");
    score = 0;
    if (scoreEl) scoreEl.textContent = score;
    placeShuffledCards();
    if (startScreen) startScreen.classList.add("hidden");
    if (gameArea) gameArea.classList.remove("hidden");
    if (endScreen) endScreen.classList.add("hidden");
    startTimer();

    // try play music
    if (bgMusic) {
      bgMusic.volume = 0.28;
      bgMusic.play().catch(() => console.log("Autoplay blocked"));
    }
  }

  function checkOrder() {
    const slots = Array.from(document.querySelectorAll(".slot"));
    const current = slots.map(s => s.querySelector(".card")?.dataset.image || null);
    if (current.includes(null)) { alert("Faltan cartas en algunos slots."); return; }
    if (JSON.stringify(current) === JSON.stringify(correctOrder)) {
      const bonus = Math.max(0, timeLeft) * 10;
      score = 1000 + bonus;
      if (scoreEl) scoreEl.textContent = score;
      clearInterval(timer);
      showEnd(true, score);
    } else {
      alert("El orden no es correcto, sigue intentando.");
    }
  }

  function restartGame() {
    placeShuffledCards();
    score = 0; if (scoreEl) scoreEl.textContent = score;
    clearInterval(timer);
    timeLeft = 300; if (timerEl) timerEl.textContent = timeLeft;
    startTimer();
    if (endScreen) endScreen.classList.add("hidden");
    if (gameArea) gameArea.classList.remove("hidden");
  }

  function showEnd(success, points = 0) {
    if (resultTitle) resultTitle.textContent = success ? "¡Correcto! 🎉" : "Tiempo agotado ⏳";
    if (finalScoreEl) finalScoreEl.textContent = points;
    if (endScreen) endScreen.classList.remove("hidden");
    if (gameArea) gameArea.classList.add("hidden");
    if (bgMusic) { bgMusic.pause(); bgMusic.currentTime = 0; }
  }

  /* button listeners */
  btnStart.addEventListener("click", startGame);
  if (btnCheck) btnCheck.addEventListener("click", checkOrder);
  if (btnRestart) btnRestart.addEventListener("click", restartGame);
  if (btnPlayAgain) btnPlayAgain.addEventListener("click", () => {
    if (startScreen) startScreen.classList.remove("hidden");
    if (endScreen) endScreen.classList.add("hidden");
  });

  // init
  placeShuffledCards(); // show initial shuffled cards inside slots
  if (gameArea) gameArea.classList.add("hidden");
  if (endScreen) endScreen.classList.add("hidden");
  if (startScreen) startScreen.classList.remove("hidden");
  if (timerEl) timerEl.textContent = timeLeft;

  console.log("Simulacros: ready");
});

