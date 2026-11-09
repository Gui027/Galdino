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

let selectedFloor = 24;
let soundEnabled = false;
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const floorMap = $("#floorMap");

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

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let isFlying = false;

// Voo de drone: aproxima do prédio, mira na janela do andar escolhido e atravessa o vidro.
function startFlight() {
  if (isFlying) return;
  isFlying = true;

  const flight = $("#flightScene");
  const image = $(".flight-image");
  const flash = $("#flightFlash");
  const copy = $(".flight-copy");
  const hit = $(".floor-hit.is-selected");
  const D = prefersReducedMotion() ? 1400 : 4400;

  $("#flightFloor").textContent = `${selectedFloor}º ANDAR`;

  // Estado atual da imagem do prédio (ela flutua suavemente), para o voo começar sem "pulo".
  const m = new DOMMatrixReadOnly(getComputedStyle($(".building-media")).transform);
  const s0 = m.a || 1;
  const t0 = { x: m.e || 0, y: m.f || 0 };
  const box = image.getBoundingClientRect();
  const c = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  const view = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  const r = hit.getBoundingClientRect();
  // Janela iluminada do apartamento: lado direito da faixa do andar.
  const q = { x: r.left + r.width * 0.75, y: r.top + r.height / 2 };
  // Ponto da imagem que está sob a janela no início.
  const d = { x: (q.x - c.x - t0.x) / s0, y: (q.y - c.y - t0.y) / s0 };
  const sMax = 17;
  const frames = [];
  const N = 60;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const g = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // acelera e desacelera
    const scale = s0 * Math.pow(sMax / s0, g);
    const px = q.x + (view.x - q.x) * g; // a janela vai para o centro da tela
    const py = q.y + (view.y - q.y) * g;
    const tx = px - c.x - scale * d.x;
    const ty = py - c.y - scale * d.y;
    const blur = t < 0.55 ? 0 : Math.pow((t - 0.55) / 0.45, 2) * 6;
    const bright = 1 + Math.pow(t, 3) * 0.5;
    frames.push({ offset: t, transform: `matrix(${scale},0,0,${scale},${tx},${ty})`, filter: `blur(${blur}px) brightness(${bright})` });
  }

  flight.classList.add("is-active", "is-flying");
  flight.setAttribute("aria-hidden", "false");
  const anims = [
    image.animate(frames, { duration: D, easing: "linear", fill: "forwards" }),
    flash.animate([{ opacity: 0, offset: 0 }, { opacity: 0, offset: 0.62 }, { opacity: 0.92, offset: 0.84 }, { opacity: 0.92, offset: 1 }], { duration: D, fill: "forwards" }),
    copy.animate([{ opacity: 1, offset: 0 }, { opacity: 1, offset: 0.16 }, { opacity: 0, offset: 0.36 }], { duration: D, fill: "forwards" })
  ];

  // Já dentro do vidro, o living aparece por baixo da luz.
  window.setTimeout(() => {
    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    showRoom("living", { instant: true });
    if (!prefersReducedMotion()) {
      $("#livingImage").animate(
        [{ transform: "scale(2.1)", filter: "blur(8px) brightness(1.8)" }, { transform: "scale(1)", filter: "blur(0) brightness(1)" }],
        { duration: 2800, easing: "cubic-bezier(.2,.7,.2,1)" }
      );
    }
  }, D * 0.76);

  window.setTimeout(() => {
    flight.classList.remove("is-active");
    flight.setAttribute("aria-hidden", "true");
  }, D * 0.82);

  window.setTimeout(() => {
    anims.forEach((a) => a.cancel());
    flight.classList.remove("is-flying");
    isFlying = false;
  }, D * 0.82 + 1300);
}

function showRoom(name, options = {}) {
  const room = rooms[name];
  const copy = $("#roomCopy");
  const interior = $("#interiorScene");
  const living = $("#livingImage");
  const previous = interior.dataset.room;
  const showing = name === "balcony" ? "living" : name; // a varanda é a mesma imagem, com a câmera mais perto

  if (options.instant) living.style.transition = "none";
  interior.dataset.room = name;
  $$(".room-image").forEach((image) => image.classList.toggle("is-active", image.dataset.room === showing));
  $$("[data-room-button]").forEach((button) => button.classList.toggle("is-active", button.dataset.roomButton === name));
  if (options.instant) {
    void living.offsetWidth;
    living.style.transition = "";
  }

  // Leve inclinação e desfoque de movimento, como um drone avançando.
  const droneMove = (previous === "living" && name === "balcony") || (previous === "balcony" && name === "living");
  if (droneMove && !options.instant && !prefersReducedMotion()) {
    const tilt = name === "balcony" ? -0.9 : 0.9;
    $(".room-images").animate([
      { transform: "rotate(0deg) translate3d(0,0,0)", filter: "blur(0px)" },
      { transform: `rotate(${tilt}deg) translate3d(${tilt * 0.9}%, .8%, 0)`, filter: "blur(1.8px)", offset: 0.5 },
      { transform: "rotate(0deg) translate3d(0,0,0)", filter: "blur(0px)" }
    ], { duration: 3400, easing: "ease-in-out" });
  }

  copy.classList.add("is-changing");
  window.setTimeout(() => {
    $("#roomTitle").innerHTML = room.title;
    $("#roomDescription").textContent = room.description;
    $("#roomIndex").textContent = room.index;
    copy.classList.remove("is-changing");
  }, 220);
}

$("#enterButton").addEventListener("click", startFlight);
$("#balconyZone").addEventListener("click", () => showRoom("balcony"));
$("#prevFloor").addEventListener("click", () => selectFloor(selectedFloor - 1));
$("#nextFloor").addEventListener("click", () => selectFloor(selectedFloor + 1));
$$('[data-room-button]').forEach((button) => button.addEventListener("click", () => showRoom(button.dataset.roomButton)));
$$('[data-target]').forEach((button) => button.addEventListener("click", () => showRoom(button.dataset.target)));

$("#backButton").addEventListener("click", () => {
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
