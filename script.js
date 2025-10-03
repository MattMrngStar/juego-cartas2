document.addEventListener('DOMContentLoaded', () => {
  console.log('Simulacros: DOM cargado');

  /* Orden correcto (CartasSimulacros-01 .. -08) */
  const correctOrder = [
    "CartasSimulacros-01.png","CartasSimulacros-02.png","CartasSimulacros-03.png",
    "CartasSimulacros-04.png","CartasSimulacros-05.png","CartasSimulacros-06.png",
    "CartasSimulacros-07.png","CartasSimulacros-08.png"
  ];

  const cardFolder = "Cartas2";
  const cardBack = "CartasPFE-08.png"; // reverso compartido

  /* DOM */
  const startScreen = document.getElementById('start-screen');
  const btnStart = document.getElementById('btn-start');
  const gameArea = document.getElementById('game-area');
  const timerEl = document.getElementById('timer');
  const scoreEl = document.getElementById('score');
  const btnCheck = document.getElementById('btn-check');
  const btnRestart = document.getElementById('btn-restart');
  const endScreen = document.getElementById('end-screen');
  const resultTitle = document.getElementById('result-title');
  const finalScoreEl = document.getElementById('final-score');
  const btnPlayAgain = document.getElementById('btn-play-again');

  if (!btnStart) { console.error('btn-start no encontrado'); return; }

  /* estado */
  let slots = []; // se llenará desde DOM
  let timer = null;
  let timeLeft = 300;
  let score = 0;

  /* drag state */
  let draggingCard = null;
  let dragClone = null;
  let originSlot = null;
  let currentX = 0, currentY = 0;
  let prevX = 0, prevY = 0;
  let dragging = false;
  let rafId = null;

  const shuffle = arr => arr.slice().sort(()=>Math.random()-0.5);

  function getSlots(){
    slots = Array.from(document.querySelectorAll('.slot'));
    return slots;
  }

  function createCardElement(imgName){
    const img = document.createElement('img');
    img.className = 'card';
    img.draggable = false;
    img.src = `${cardFolder}/${imgName}`;
    img.alt = imgName;
    img.dataset.image = imgName;
    img.style.willChange = 'transform';
    img.addEventListener('pointerdown', onPointerDown);
    return img;
  }

  function placeShuffledCards(){
    getSlots();
    const shuffled = shuffle(correctOrder);
    // si slots.length != 8, log para debug
    if (slots.length !== shuffled.length) console.warn('Número de slots ≠ número de cartas', slots.length, shuffled.length);

    slots.forEach((slot, i) => {
      slot.innerHTML = '';
      const card = createCardElement(shuffled[i]);
      slot.appendChild(card);
    });
    console.log('Cartas colocadas:', shuffled);
  }

  /* --- drag handlers --- */
  function onPointerDown(e){
    if (e.button && e.button !== 0) return;
    draggingCard = e.currentTarget;
    originSlot = draggingCard.parentElement;

    currentX = e.clientX;
    currentY = e.clientY;
    prevX = currentX;
    prevY = currentY;

    // clon visual (seguirá al puntero)
    const rect = draggingCard.getBoundingClientRect();
    dragClone = draggingCard.cloneNode(true);
    dragClone.className = 'dragging-clone';
    dragClone.style.width = rect.width + 'px';
    dragClone.style.height = rect.height + 'px';
    document.body.appendChild(dragClone);

    draggingCard.style.visibility = 'hidden';

    dragging = true;
    document.addEventListener('pointermove', onPointerMove, {passive:false});
    document.addEventListener('pointerup', onPointerUp, {once:true});

    rafId = requestAnimationFrame(updateDragClone);
  }

  function onPointerMove(e){
    if(!dragging) return;
    e.preventDefault();
    currentX = e.clientX;
    currentY = e.clientY;
  }

  function updateDragClone(){
    if(!dragClone) return;
    const dx = currentX - prevX;
    const rot = Math.max(-14, Math.min(14, dx * 0.6));

    // centra el clon bajo el puntero con translate(-50%,-50%)
    dragClone.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%,-50%) scale(1.06) rotate(${rot}deg)`;

    const elem = document.elementFromPoint(currentX, currentY);
    const slotUnder = elem ? elem.closest('.slot') : null;
    getSlots().forEach(s => s.classList.toggle('over', s === slotUnder));

    prevX = currentX;
    prevY = currentY;

    if(dragging) rafId = requestAnimationFrame(updateDragClone);
  }

  function nearestSlotToPoint(x,y){
    getSlots();
    let best = null, bestD = Infinity;
    slots.forEach(s=>{
      const r = s.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      const d = Math.hypot(cx - x, cy - y);
      if (d < bestD) { bestD = d; best = s; }
    });
    return best;
  }

  function onPointerUp(e){
    dragging = false;
    cancelAnimationFrame(rafId);
    document.removeEventListener('pointermove', onPointerMove);

    const elem = document.elementFromPoint(e.clientX, e.clientY);
    let targetSlot = elem ? elem.closest('.slot') : null;
    if(!targetSlot) targetSlot = nearestSlotToPoint(e.clientX, e.clientY);
    if(!targetSlot) targetSlot = originSlot;

    if(targetSlot === originSlot){
      originSlot.appendChild(draggingCard);
    } else {
      const existing = targetSlot.querySelector('.card');
      if(existing) originSlot.appendChild(existing);
      targetSlot.appendChild(draggingCard);
    }

    getSlots().forEach(s => s.classList.remove('over'));

    if(dragClone && dragClone.parentNode) dragClone.parentNode.removeChild(dragClone);
    dragClone = null;

    if(draggingCard) draggingCard.style.visibility = 'visible';
    draggingCard = null;
    originSlot = null;
  }

  /* --- Timer & game --- */
  function startTimer(){
    clearInterval(timer);
    timeLeft = 300;
    if (timerEl) timerEl.textContent = timeLeft;
    timer = setInterval(()=>{
      timeLeft--;
      if (timerEl) timerEl.textContent = timeLeft;
      if(timeLeft <= 0){
        clearInterval(timer);
        showEnd(false);
      }
    },1000);
  }

  function startGame(){
    console.log('Start game clicked');
    placeShuffledCards();
    score = 0; if (scoreEl) scoreEl.textContent = score;

    if (startScreen) startScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');

    startTimer();

    const music = document.getElementById('bg-music');
    if(music){
      music.volume = 0.28;
      music.play().catch(err => console.log('No se pudo reproducir música:', err));
    }
  }

  function checkOrder(){
    getSlots();
    const current = slots.map(s => s.querySelector('.card')?.dataset.image || null);
    if(current.includes(null)){ alert('Faltan cartas en algunos slots.'); return; }

    if(JSON.stringify(current) === JSON.stringify(correctOrder)){
      const bonus = Math.max(0, timeLeft) * 10;
      score = 1000 + bonus;
      if(scoreEl) scoreEl.textContent = score;
      clearInterval(timer);
      showEnd(true, score);
    } else {
      alert('El orden no es correcto, sigue intentando.');
    }
  }

  function restartGame(){
    placeShuffledCards();
    score = 0; if (scoreEl) scoreEl.textContent = score;
    clearInterval(timer);
    timeLeft = 300; if (timerEl) timerEl.textContent = timeLeft;
    startTimer();
    if (endScreen) endScreen.classList.add('hidden');
    if (gameArea) gameArea.classList.remove('hidden');
  }

  function showEnd(success, points=0){
    if (resultTitle) resultTitle.textContent = success ? '¡Correcto! 🎉' : 'Tiempo agotado ⏳';
    if (finalScoreEl) finalScoreEl.textContent = points;
    if (endScreen) endScreen.classList.remove('hidden');
    if (gameArea) gameArea.classList.add('hidden');

    const music = document.getElementById('bg-music');
    if (music) { music.pause(); music.currentTime = 0; }
  }

  /* botones */
  if (btnStart) btnStart.addEventListener('click', startGame);
  if (btnCheck) btnCheck.addEventListener('click', checkOrder);
  if (btnRestart) btnRestart.addEventListener('click', restartGame);
  if (btnPlayAgain) btnPlayAgain.addEventListener('click', ()=> {
    if (startScreen) startScreen.classList.remove('hidden');
    if (endScreen) endScreen.classList.add('hidden');
  });

  /* Inicial */
  placeShuffledCards();
  if (gameArea) gameArea.classList.add('hidden');
  if (endScreen) endScreen.classList.add('hidden');
  if (startScreen) startScreen.classList.remove('hidden');
  if (timerEl) timerEl.textContent = timeLeft;

  console.log('Simulacros: init completo');
});

