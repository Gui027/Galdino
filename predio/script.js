const floors = {
  21: { area: 238, suites: 3, name: "Residence 2101", description: "Atmosfera contemporânea, três suítes e horizonte aberto para o mar." },
  22: { area: 246, suites: 3, name: "Residence 2201", description: "Living generoso e varanda curva com vista para toda a orla." },
  23: { area: 264, suites: 4, name: "Residence 2301", description: "Quatro suítes, acabamentos naturais e total integração com a paisagem." },
  24: { area: 284, suites: 4, name: "Residence 2401", description: "Planta panorâmica com living integrado e vista permanente para o oceano." },
  25: { area: 302, suites: 4, name: "Residence 2501", description: "Uma residência suspensa com amplitude, privacidade e luz em abundância." },
  26: { area: 318, suites: 4, name: "Residence 2601", description: "Perspectiva privilegiada e ambientes desenhados ao redor da vista." },
  27: { area: 356, suites: 4, name: "Sky Residence 2701", description: "A experiência Sky Residence com hall privativo e varanda monumental." },
  28: { area: 412, suites: 5, name: "Penthouse 2801", description: "A cobertura do Aurea: cinco suítes e o oceano em 180 graus." }
};

const rooms = {
  living: { index: "01", title: "Living<br><em>panorâmico</em>", description: "Amplitude, luz natural e o oceano como parte da decoração." },
  suite: { index: "02", title: "Suíte<br><em>master</em>", description: "Um refúgio silencioso com varanda íntima e horizonte particular." },
  bath: { index: "03", title: "Sala de<br><em>banho</em>", description: "Pedra natural, luz indireta e atmosfera de spa diante do mar." },
  balcony: { index: "04", title: "Varanda<br><em>oceânica</em>", description: "A transição perfeita entre o conforto da casa e a imensidão azul." },
  // Chegada: o vídeo termina e fica parado na varanda, vista de fora.
  arrival: { index: "04", title: "Varanda<br><em>oceânica</em>", description: "A transição perfeita entre o conforto da casa e a imensidão azul." }
};

const assets = {
  living: "assets/living.png",
  suite: "assets/suite.png",
  bath: "assets/bath.png",
  balcony: "assets/living.png",
  facade: "assets/facade-entry.png",
  hallway: "assets/hallway.png"
};

Object.values(assets).forEach((src) => {
  const image = new Image();
  image.src = src;
});

let selectedFloor = 24;
let currentRoom = "living";
let soundEnabled = false;
let isFlying = false;
let isTravelling = false;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const floorMap = $("#floorMap");
const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Geometria da janela de cada andar, medida na própria foto (tower.png, 1672 × 941 px).
// Cada faixa de vidro é ondulada: x vai de 495 a 665 e as bordas de cima/baixo descem para a direita.
// Os valores dy são relativos ao topo do andar (y0 + pitch * posição).
const TOWER_IMG = { w: 1672, h: 941, y0: 52, pitch: 30 };
const WINDOW_SHAPE = [ // [x, dyTopo, dyBase]
  [495, 0, 22], [540, 2, 24], [580, 10, 35], [620, 20, 46], [665, 28, 54]
];
const WINDOW_SHAPE_TOP = [[495, -1, 22], [540, 0, 23], [590, 4, 30]]; // último andar: só a parte envidraçada

function floorShape(position) {
  const shape = position === 0 ? WINDOW_SHAPE_TOP : WINDOW_SHAPE;
  const top = TOWER_IMG.y0 + TOWER_IMG.pitch * position;
  const xs = shape.map((p) => p[0]);
  const ys = shape.flatMap((p) => [top + p[1], top + p[2]]);
  const box = { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  const local = ([x, y]) => `${(((x - box.x0) / (box.x1 - box.x0)) * 100).toFixed(2)}% ${(((y - box.y0) / (box.y1 - box.y0)) * 100).toFixed(2)}%`;
  const upper = shape.map((p) => local([p[0], top + p[1]]));
  const lower = [...shape].reverse().map((p) => local([p[0], top + p[2]]));
  return { box, polygon: `polygon(${[...upper, ...lower].join(", ")})` };
}

Object.keys(floors).reverse().forEach((number, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "floor-hit";
  button.dataset.floor = number;
  button.dataset.label = `${number}º`;
  button.dataset.row = index;
  button.setAttribute("aria-label", `Selecionar ${number}º andar`);
  const { box, polygon } = floorShape(index);
  button.style.left = `${(box.x0 / TOWER_IMG.w) * 100}%`;
  button.style.top = `${(box.y0 / TOWER_IMG.h) * 100}%`;
  button.style.width = `${((box.x1 - box.x0) / TOWER_IMG.w) * 100}%`;
  button.style.height = `${((box.y1 - box.y0) / TOWER_IMG.h) * 100}%`;
  button.style.clipPath = polygon;
  button.addEventListener("mouseenter", () => selectFloor(Number(number)));
  button.addEventListener("focus", () => selectFloor(Number(number)));
  button.addEventListener("click", startFlight);
  floorMap.appendChild(button);
});

function selectFloor(number) {
  selectedFloor = Math.min(28, Math.max(21, number));
  const data = floors[selectedFloor];
  $("#floorNumber").textContent = selectedFloor;
  $("#floorName").textContent = data.name;
  $("#floorDescription").textContent = data.description;
  $("#floorArea").textContent = `${data.area} m²`;
  $("#floorSuites").textContent = data.suites;
  $("#currentFloorLabel").textContent = selectedFloor;
  $$(".floor-hit").forEach((item) => item.classList.toggle("is-selected", Number(item.dataset.floor) === selectedFloor));

  // Etiqueta do andar, ao lado esquerdo do prédio, na altura da janela.
  const tag = $("#floorTag");
  const row = $(".floor-hit.is-selected")?.dataset.row;
  if (tag && row !== undefined) {
    tag.textContent = `${selectedFloor}º`;
    tag.style.left = `${(478 / TOWER_IMG.w) * 100}%`;
    tag.style.top = `${((TOWER_IMG.y0 + TOWER_IMG.pitch * Number(row) + 11) / TOWER_IMG.h) * 100}%`;
    tag.classList.add("is-visible");
  }
}

function updateRoomCopy(name) {
  const room = rooms[name];
  $("#roomTitle").innerHTML = room.title;
  $("#roomDescription").textContent = room.description;
  $("#roomIndex").textContent = room.index;
}

function setRoomState(name, instant = false) {
  const visibleRoom = name === "balcony" ? "living" : name;
  const images = $$(".room-image");
  if (instant) images.forEach((image) => { image.style.transition = "none"; });
  $("#interiorScene").dataset.room = name;
  images.forEach((image) => image.classList.toggle("is-active", image.dataset.room === visibleRoom));
  const navName = name === "arrival" ? "balcony" : name;
  $$('[data-room-button]').forEach((button) => button.classList.toggle("is-active", button.dataset.roomButton === navName));
  if (instant) {
    void $("#interiorScene").offsetWidth;
    images.forEach((image) => { image.style.transition = ""; });
  }
  currentRoom = name;
}

function focusTransform(point, scale) {
  // A compensação cresce junto com o zoom: o ponto escolhido permanece no centro.
  const dx = (0.5 - point.x) * window.innerWidth * scale;
  const dy = (0.5 - point.y) * window.innerHeight * scale;
  return `translate3d(${dx}px, ${dy}px, 0) scale(${scale})`;
}

function routePoint(from, to) {
  if (from === "living" || from === "balcony") {
    if (to === "suite") return { x: 0.60, y: 0.50 };
    if (to === "bath") return { x: 0.28, y: 0.37 };
    if (to === "balcony") return { x: 0.88, y: 0.47 };
  }
  return { x: 0.5, y: 0.5 };
}

function hallwayExit(room) {
  if (room === "suite") return { x: 0.10, y: 0.53 };
  if (room === "bath") return { x: 0.90, y: 0.52 };
  return { x: 0.5, y: 0.52 };
}

async function startFlight() {
  if (isFlying || isTravelling) return;
  const video = $("#flightVideo");
  // O vídeo é sempre o caminho principal (mesmo com "reduzir animações" ligado no sistema).
  // Se ele realmente não puder tocar, entra direto no apartamento com um fade simples,
  // sem usar a animação antiga.
  if (!video) {
    startFallbackFlight();
    return;
  }

  isFlying = true;
  const flight = $("#flightScene");
  let finished = false;
  flight.classList.remove("is-held");
  video.removeAttribute("style");

  // Fim do vídeo: o último quadro fica parado na tela e o tour aparece por cima dele.
  const holdArrival = () => {
    if (finished) return;
    finished = true;
    video.onended = null;
    video.onerror = null;
    video.pause();
    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    setRoomState("arrival", true);
    updateRoomCopy("arrival");
    flight.classList.add("is-held");
    isFlying = false;
  };

  const enterLiving = async () => {
    if (finished) return;
    finished = true;
    video.onended = null;
    video.onerror = null;
    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    setRoomState("living", true);
    updateRoomCopy("living");

    // Mantém o último quadro real na tela e continua empurrando a câmera pela
    // abertura. O living só aparece quando a fachada já ocupa todo o quadro.
    const livingEntry = $("#livingImage").animate([
      { transform: "scale(1.22)", opacity: 0.35 },
      { transform: "scale(1.12)", opacity: 0.35, offset: 0.56 },
      { transform: "scale(1)", opacity: 1 }
    ], { duration: 2100, easing: "cubic-bezier(.34,.02,.18,1)", fill: "both" });
    const exitAnimation = video.animate([
      { opacity: 1, transform: "scale(1)" },
      { opacity: 1, transform: "scale(1.55)", offset: 0.58 },
      { opacity: 0, transform: "scale(2.15)" }
    ], { duration: 2100, easing: "cubic-bezier(.34,.02,.18,1)", fill: "forwards" });
    await Promise.allSettled([exitAnimation.finished, livingEntry.finished]);

    flight.classList.remove("is-active", "is-flying", "has-video");
    flight.setAttribute("aria-hidden", "true");
    exitAnimation.cancel();
    livingEntry.cancel();
    video.removeAttribute("style");
    video.currentTime = 0;
    isFlying = false;
  };

  // Sem vídeo: mostra o prédio parado e faz só um fade para dentro do apartamento.
  const useFallback = () => {
    if (finished) return;
    video.onended = null;
    video.onerror = null;
    flight.classList.remove("has-video");
    enterLiving();
  };

  video.pause();
  video.currentTime = 0;
  video.onended = holdArrival;
  video.onerror = useFallback;
  flight.classList.add("is-active", "is-flying", "has-video");
  flight.setAttribute("aria-hidden", "false");

  // Se o vídeo ainda não carregou, espera um pouco (até 6 s) em vez de desistir na hora.
  if (video.readyState < 3) {
    video.load();
    await new Promise((resolve) => {
      const done = () => { video.removeEventListener("canplay", done); resolve(); };
      video.addEventListener("canplay", done);
      window.setTimeout(done, 6000);
    });
  }
  if (finished) return;

  try {
    await video.play();
  } catch (error) {
    // Uma segunda tentativa, já mudo, antes de desistir.
    try {
      video.muted = true;
      await video.play();
    } catch (secondError) {
      useFallback();
    }
  }

  // Vigia: se o vídeo chegar ao fim sem disparar "ended", ou parar de andar por 3 s, a tela não fica presa.
  let lastTime = -1;
  let stuckSince = performance.now();
  const watchdog = window.setInterval(() => {
    if (finished) { window.clearInterval(watchdog); return; }
    const now = performance.now();
    if (video.currentTime !== lastTime) { lastTime = video.currentTime; stuckSince = now; }
    const nearEnd = video.duration && video.currentTime >= video.duration - 0.6;
    if (video.ended || (nearEnd && now - stuckSince > 800)) {
      window.clearInterval(watchdog);
      holdArrival();
    } else if (now - stuckSince > 3000) {
      window.clearInterval(watchdog);
      video.currentTime < 0.05 ? useFallback() : enterLiving();
    }
  }, 300);
}

async function startFallbackFlight() {
  if (isFlying || isTravelling) return;
  isFlying = true;

  const flight = $("#flightScene");
  const tower = $(".flight-image");
  const bridge = $("#flightBridge");
  const copy = $(".flight-copy");
  const hit = $(".floor-hit.is-selected");
  const duration = prefersReducedMotion() ? 1300 : 5200;

  $("#flightFloor").textContent = `${selectedFloor}º ANDAR`;
  tower.getAnimations().forEach((animation) => animation.cancel());
  bridge.getAnimations().forEach((animation) => animation.cancel());
  tower.removeAttribute("style");
  bridge.removeAttribute("style");

  const buildingTransform = getComputedStyle($(".building-media")).transform;
  const matrix = buildingTransform === "none" ? new DOMMatrixReadOnly() : new DOMMatrixReadOnly(buildingTransform);
  const startScale = matrix.a || 1;
  const startTranslation = { x: matrix.e || 0, y: matrix.f || 0 };
  const imageBox = tower.getBoundingClientRect();
  const imageCenter = { x: imageBox.left + imageBox.width / 2, y: imageBox.top + imageBox.height / 2 };
  const viewportCenter = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const floorBox = hit.getBoundingClientRect();
  const windowPoint = { x: floorBox.left + floorBox.width * 0.74, y: floorBox.top + floorBox.height / 2 };
  const localPoint = {
    x: (windowPoint.x - imageCenter.x - startTranslation.x) / startScale,
    y: (windowPoint.y - imageCenter.y - startTranslation.y) / startScale
  };

  const towerFrames = [];
  const frameCount = 90;
  for (let index = 0; index <= frameCount; index += 1) {
    const time = index / frameCount;
    const eased = time < 0.5 ? 2 * time * time : 1 - Math.pow(-2 * time + 2, 2) / 2;
    const scale = startScale * Math.pow(13 / startScale, eased);
    const pointX = windowPoint.x + (viewportCenter.x - windowPoint.x) * Math.min(1, eased * 1.45);
    const pointY = windowPoint.y + (viewportCenter.y - windowPoint.y) * Math.min(1, eased * 1.45);
    const x = pointX - imageCenter.x - scale * localPoint.x;
    const y = pointY - imageCenter.y - scale * localPoint.y;
    towerFrames.push({ offset: time, transform: `matrix(${scale},0,0,${scale},${x},${y})` });
  }

  flight.classList.add("is-active", "is-flying");
  flight.setAttribute("aria-hidden", "false");
  const animations = [
    tower.animate(towerFrames, { duration, easing: "linear", fill: "forwards" }),
    tower.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.56 }, { opacity: 0, offset: 0.72 }, { opacity: 0, offset: 1 }], { duration, fill: "forwards" }),
    bridge.animate([
      { opacity: 0, transform: "scale(.94)", offset: 0 },
      { opacity: 0, transform: "scale(.94)", offset: 0.52 },
      { opacity: 1, transform: "scale(1.04)", offset: 0.68 },
      { opacity: 1, transform: "scale(1.82)", offset: 0.90 },
      { opacity: 0, transform: "scale(2.55)", offset: 1 }
    ], { duration, easing: "cubic-bezier(.45,.02,.22,1)", fill: "forwards" }),
    copy.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.13 }, { opacity: 0, offset: 0.28 }, { opacity: 0, offset: 1 }], { duration, fill: "forwards" })
  ];

  window.setTimeout(() => {
    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    setRoomState("living", true);
    updateRoomCopy("living");
    if (!prefersReducedMotion()) {
      $("#livingImage").animate(
        [{ transform: "scale(1.42)" }, { transform: "scale(1)" }],
        { duration: duration * 0.23, easing: "cubic-bezier(.18,.72,.2,1)" }
      );
    }
  }, duration * 0.82);

  await Promise.allSettled(animations.map((animation) => animation.finished));
  flight.classList.remove("is-active", "is-flying");
  flight.setAttribute("aria-hidden", "true");
  animations.forEach((animation) => animation.cancel());
  tower.removeAttribute("style");
  bridge.removeAttribute("style");
  isFlying = false;
}

// Sai do último quadro do vídeo para o ambiente escolhido: o vídeo avança e se dissolve
// enquanto o ambiente aparece por baixo.
async function leaveArrival(name) {
  const flight = $("#flightScene");
  const video = $("#flightVideo");
  const interior = $("#interiorScene");
  const visible = name === "balcony" ? "living" : name;
  const finalScale = name === "balcony" ? 2.25 : 1;
  const duration = prefersReducedMotion() ? 500 : 2400;
  const easing = "cubic-bezier(.34,.02,.18,1)";

  isTravelling = true;
  interior.classList.add("is-travelling");
  setRoomState(name, true);
  flight.classList.remove("is-held"); // o vídeo volta para cima, para se dissolver
  window.setTimeout(() => updateRoomCopy(name), duration * 0.5);

  const roomEntry = $(`.room-image[data-room="${visible}"]`).animate([
    { transform: `scale(${finalScale * 1.35})` },
    { transform: `scale(${finalScale})` }
  ], { duration, easing });
  const videoExit = video.animate([
    { opacity: 1, transform: "scale(1)" },
    { opacity: 1, transform: "scale(1.5)", offset: 0.5 },
    { opacity: 0, transform: "scale(2.1)" }
  ], { duration, easing, fill: "forwards" });
  await Promise.allSettled([roomEntry.finished, videoExit.finished]);

  flight.classList.remove("is-active", "is-flying", "has-video");
  flight.setAttribute("aria-hidden", "true");
  videoExit.cancel();
  video.removeAttribute("style");
  video.currentTime = 0;
  interior.classList.remove("is-travelling");
  isTravelling = false;
}

async function travelToRoom(name) {
  if (name === currentRoom || isTravelling || isFlying) return;
  if (currentRoom === "arrival") {
    await leaveArrival(name);
    return;
  }
  isTravelling = true;
  const interior = $("#interiorScene");

  // Sala e varanda compartilham a mesma perspectiva; não há troca de imagem.
  if ((currentRoom === "living" && name === "balcony") || (currentRoom === "balcony" && name === "living")) {
    interior.classList.add("is-travelling");
    setRoomState(name);
    window.setTimeout(() => updateRoomCopy(name), prefersReducedMotion() ? 100 : 1300);
    await new Promise((resolve) => window.setTimeout(resolve, prefersReducedMotion() ? 350 : 3400));
    interior.classList.remove("is-travelling");
    isTravelling = false;
    return;
  }

  const transition = $("#cameraTransition");
  const fromPlane = $("#cameraFrom");
  const hallPlane = $("#cameraHall");
  const toPlane = $("#cameraTo");
  const fromRoom = currentRoom;
  const targetVisible = name === "balcony" ? "living" : name;
  const duration = prefersReducedMotion() ? 750 : 4600;
  const sourcePoint = routePoint(fromRoom, name);
  const exitPoint = hallwayExit(name);
  const sourceStartScale = fromRoom === "balcony" ? 2.25 : 1;

  [fromPlane, hallPlane, toPlane].forEach((plane) => plane.getAnimations().forEach((animation) => animation.cancel()));
  fromPlane.style.backgroundImage = `url("${assets[fromRoom]}")`;
  toPlane.style.backgroundImage = `url("${assets[targetVisible]}")`;
  transition.classList.add("is-active");
  transition.setAttribute("aria-hidden", "false");
  interior.classList.add("is-travelling");

  setRoomState(name, true);
  const animations = [
    fromPlane.animate([
      { opacity: 1, transform: `scale(${sourceStartScale})`, offset: 0 },
      { opacity: 1, transform: focusTransform(sourcePoint, 2.85), offset: 0.38 },
      { opacity: 0, transform: focusTransform(sourcePoint, 3.2), offset: 0.52 },
      { opacity: 0, transform: focusTransform(sourcePoint, 3.2), offset: 1 }
    ], { duration, easing: "linear", fill: "forwards" }),
    hallPlane.animate([
      { opacity: 0, transform: "scale(.96)", offset: 0 },
      { opacity: 0, transform: "scale(.96)", offset: 0.25 },
      { opacity: 1, transform: "scale(1)", offset: 0.40 },
      { opacity: 1, transform: focusTransform(exitPoint, 2.55), offset: 0.72 },
      { opacity: 0, transform: focusTransform(exitPoint, 2.9), offset: 0.84 },
      { opacity: 0, transform: focusTransform(exitPoint, 2.9), offset: 1 }
    ], { duration, easing: "linear", fill: "forwards" }),
    toPlane.animate([
      { opacity: 0, transform: "scale(1.48)", offset: 0 },
      { opacity: 0, transform: "scale(1.48)", offset: 0.67 },
      { opacity: 1, transform: "scale(1.32)", offset: 0.80 },
      { opacity: 1, transform: name === "balcony" ? "scale(2.25)" : "scale(1)", offset: 1 }
    ], { duration, easing: "linear", fill: "forwards" })
  ];

  window.setTimeout(() => updateRoomCopy(name), duration * 0.76);
  await Promise.allSettled(animations.map((animation) => animation.finished));
  transition.classList.remove("is-active");
  transition.setAttribute("aria-hidden", "true");
  interior.classList.remove("is-travelling");
  animations.forEach((animation) => animation.cancel());
  [fromPlane, toPlane].forEach((plane) => {
    plane.style.backgroundImage = "";
    plane.removeAttribute("style");
  });
  isTravelling = false;
}

$("#enterButton").addEventListener("click", startFlight);
$("#balconyZone").addEventListener("click", () => travelToRoom("balcony"));
$("#prevFloor").addEventListener("click", () => selectFloor(selectedFloor - 1));
$("#nextFloor").addEventListener("click", () => selectFloor(selectedFloor + 1));
$$('[data-room-button]').forEach((button) => button.addEventListener("click", () => travelToRoom(button.dataset.roomButton)));
$$('[data-target]').forEach((button) => button.addEventListener("click", () => travelToRoom(button.dataset.target)));

$("#backButton").addEventListener("click", () => {
  if (isFlying || isTravelling) return;
  const flight = $("#flightScene");
  const video = $("#flightVideo");
  flight.classList.remove("is-active", "is-flying", "has-video", "is-held");
  flight.setAttribute("aria-hidden", "true");
  video.pause();
  video.removeAttribute("style");
  video.currentTime = 0;
  $("#interiorScene").classList.remove("is-active");
  $("#buildingScene").classList.add("is-active");
});

$("#soundButton").addEventListener("click", (event) => {
  soundEnabled = !soundEnabled;
  event.currentTarget.setAttribute("aria-pressed", String(soundEnabled));
  event.currentTarget.querySelector("span").textContent = soundEnabled ? "Som ativo" : "Som";
});

document.addEventListener("keydown", (event) => {
  if ($("#buildingScene").classList.contains("is-active")) {
    if (event.key === "ArrowUp") selectFloor(selectedFloor + 1);
    if (event.key === "ArrowDown") selectFloor(selectedFloor - 1);
    if (event.key === "Enter") startFlight();
  }
  if (event.key === "Escape" && $("#interiorScene").classList.contains("is-active")) $("#backButton").click();
});

selectFloor(selectedFloor);
