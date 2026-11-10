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
  balcony: { index: "04", title: "Varanda<br><em>oceânica</em>", description: "A transição perfeita entre o conforto da casa e a imensidão azul." }
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

Object.keys(floors).reverse().forEach((number, index) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "floor-hit";
  button.dataset.floor = number;
  button.dataset.label = `${number}º`;
  button.setAttribute("aria-label", `Selecionar ${number}º andar`);
  button.style.top = `${index * 11.7}%`;
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
  $$('[data-room-button]').forEach((button) => button.classList.toggle("is-active", button.dataset.roomButton === name));
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
  if (!video || !video.canPlayType("video/mp4") || prefersReducedMotion()) {
    startFallbackFlight();
    return;
  }

  isFlying = true;
  const flight = $("#flightScene");
  const bridge = $("#flightBridge");
  let finished = false;

  const enterLiving = async () => {
    if (finished) return;
    finished = true;
    video.onended = null;
    video.onerror = null;
    bridge.style.opacity = "1";
    bridge.style.transform = "scale(1)";
    video.style.opacity = "0";

    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    setRoomState("living", true);
    updateRoomCopy("living");

    await new Promise((resolve) => window.setTimeout(resolve, 220));
    const exitAnimation = bridge.animate([
      { opacity: 1, transform: "scale(1)" },
      { opacity: 1, transform: "scale(1.18)", offset: 0.55 },
      { opacity: 0, transform: "scale(1.42)" }
    ], { duration: 1250, easing: "cubic-bezier(.35,.02,.2,1)", fill: "forwards" });
    await exitAnimation.finished.catch(() => {});

    flight.classList.remove("is-active", "is-flying", "has-video");
    flight.setAttribute("aria-hidden", "true");
    exitAnimation.cancel();
    bridge.removeAttribute("style");
    video.removeAttribute("style");
    video.currentTime = 0;
    isFlying = false;
  };

  const useFallback = () => {
    if (finished) return;
    finished = true;
    video.onended = null;
    video.onerror = null;
    flight.classList.remove("is-active", "is-flying", "has-video");
    flight.setAttribute("aria-hidden", "true");
    video.removeAttribute("style");
    isFlying = false;
    startFallbackFlight();
  };

  video.pause();
  video.currentTime = 0;
  video.onended = enterLiving;
  video.onerror = useFallback;
  flight.classList.add("is-active", "is-flying", "has-video");
  flight.setAttribute("aria-hidden", "false");

  try {
    await video.play();
  } catch (error) {
    useFallback();
  }
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

async function travelToRoom(name) {
  if (name === currentRoom || isTravelling || isFlying) return;
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
