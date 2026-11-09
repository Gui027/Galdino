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

function startFlight() {
  const flight = $("#flightScene");
  $("#flightFloor").textContent = `${selectedFloor}º ANDAR`;
  flight.classList.add("is-active");
  flight.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => flight.classList.add("is-flying"));
  window.setTimeout(() => {
    $("#buildingScene").classList.remove("is-active");
    $("#interiorScene").classList.add("is-active");
    $("#roomEyebrow").textContent = `${floors[selectedFloor].name.toUpperCase()} · ${selectedFloor}º ANDAR`;
    showRoom("living");
  }, 2500);
  window.setTimeout(() => {
    flight.classList.remove("is-active", "is-flying");
    flight.setAttribute("aria-hidden", "true");
  }, 3200);
}

function showRoom(name) {
  const room = rooms[name];
  const copy = $("#roomCopy");
  $("#interiorScene").dataset.room = name;
  $$(".room-image").forEach((image) => image.classList.toggle("is-active", image.dataset.room === name));
  $$("[data-room-button]").forEach((button) => button.classList.toggle("is-active", button.dataset.roomButton === name));
  copy.classList.add("is-changing");
  window.setTimeout(() => {
    $("#roomTitle").innerHTML = room.title;
    $("#roomDescription").textContent = room.description;
    $("#roomIndex").textContent = room.index;
    copy.classList.remove("is-changing");
  }, 220);
}

$("#enterButton").addEventListener("click", startFlight);
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
