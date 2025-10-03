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

  const shuffle = arr => arr.slice().sort(() => Math.random() - 0.5);

  // coloca cartas aleatorias dentro de los slots (ya dentro)
  function placeShuffledCards() {
    const slots = Array.from(document.querySelectorAll(".slot"));
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
      img.style.touchAction = "none"; // importante en móvil
      img.addEventListener("pointerdown", onPointerDown);
      img.addEventListener("dragstart", e => e.preventDefault());
      slots[i].appendChild(img);
    });
  }

    function onPointerDown(e) {
    if (e.button && e.button !== 0) return;

    draggingCard = e.currentTarget;
    originSlot = draggingCard.parentElement;

    const rect = draggingCard.getBoundingClientRect();

    // Guardamos la diferencia exacta entre puntero y esquina de la carta
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;

    // Posición inicial del clon
    targetX = rect.left;
    targetY = rect.top;
    lastClientX = e.clientX;
    lastClientY = e.clientY;

    // Crear clon visual
    dragClone = document.createElement("div");
    dragClone.className = "dragging-clone";
    dragClone.style.width = rect.width + "px";
    dragClone.style.height = rect.height + "px";
    dragClone.style.backgroundImage = `url(${draggingCard.src})`;
    dragClone.style.left = rect.left + "px";
    dragClone.style.top = rect.top + "px";
    document.body.appendChild(dragClone);

    draggingCard.style.visibility = "hidden";

    dragging = true;
    try { draggingCard.setPointerCapture && draggingCard.setPointerCapture(e.pointerId); } catch (err) {}
    document.addEventListener("pointermove", onPointerMove, { passive: false });
    document.addEventListener("pointerup", onPointerUp, { once: true });

    rafId = requestAnimationFrame(updateDragClone);
  }

  function onPointerMove(e) {
    if (!dragging) return;
    e.preventDefault();

    // Actualizamos la posición destino del clon
    targetX = e.clientX - offsetX;
    targetY = e.clientY - offsetY;

    lastClientX = e.clientX;
    lastClientY = e.clientY;
  }

  function updateDragClone() {
    if (!dragClone) return;

    // Calculamos rotación suave según movimiento horizontal
    const dx = (lastClientX - (targetX + offsetX)) || 0;
    const rot = Math.max(-14, Math.min(14, dx * 0.12));

    dragClone.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) scale(1.06) rotate(${rot}deg)`;

    // Detectamos el slot bajo el puntero
    const elem = document.elementFromPoint(lastClientX, lastClientY);
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

  // Swap-safe drop using replaceChild to avoid disappearing nodes
  function onPointerUp(e) {
    dragging = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener("pointermove", onPointerMove);

    const elem = document.elementFromPoint(e.clientX, e.clientY);
    let targetSlot = elem ? elem.closest(".slot") : null;
    if (!targetSlot) targetSlot = nearestSlotToPoint(e.clientX, e.clientY);
    if (!targetSlot) targetSlot = originSlot;

    try {
      if (targetSlot === originSlot) {
        // volver al mismo slot (asegurar que slot-number esté)
        originSlot.appendChild(draggingCard);
      } else {
        const existing = targetSlot.querySelector(".card");
        if (existing) {
          // swap atómico: reemplaza draggingCard por existing en originSlot (mueve existing)
          originSlot.replaceChild(existing, draggingCard);
          // ahora colocar draggingCard en targetSlot
          targetSlot.appendChild(draggingCard);
        } else {
          // target vacío: solo mover
          targetSlot.appendChild(draggingCard);
        }
      }

      // efecto visual "pop" cuando cae la carta
      requestAnimationFrame(() => {
        draggingCard.classList.add("drop-pop");
        setTimeout(() => draggingCard && draggingCard.classList.remove("drop-pop"), 260);
      });
    } catch (err) {
      console.error("Error en swap/drop:", err);
      // fallback simple: append al target (seguro)
      if (targetSlot) targetSlot.appendChild(draggingCard);
    }

    // cleanup
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
    if (bgMusic) { bgMusic.volume = 0.28; bgMusic.play().catch(()=>{}); }
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
  placeShuffledCards();
  if (gameArea) gameArea.classList.add("hidden");
  if (endScreen) endScreen.classList.add("hidden");
  if (startScreen) startScreen.classList.remove("hidden");
  if (timerEl) timerEl.textContent = timeLeft;

  console.log("Simulacros: ready");
});

