
const apiKey = config.MY_API_KEY;
const globalState = {
  hasTrafficLayer: false,
  hasIncidentLayer: false,
  itemsPositions: [],
  actions: {},
  places: [],
  startType:""
};

const platform = new H.service.Platform({
  apikey: apiKey,
});
const defaultLayers = platform.createDefaultLayers({ lg: "pl" });

const map = new H.Map(
  document.getElementById("map"),
  defaultLayers.vector.normal.map,
  {
    center: { lat: 50, lng: 5 },
    zoom: 6,
    padding: { top: 50, left: 50, bottom: 50, right: 50 },
    pixelRatio: window.devicePixelRatio || 1,
  }
);

const alertButton = document.getElementById("alertBtn");
const trafficButton = document.getElementById("trafficBtn");
const arrowContainer = document.getElementById("arrowContainer");
const buttonSubmit = document.getElementById("searchBtn");
const resetButton = document.getElementById("resetBtn");
const btnsContainerImgs = document.getElementById("btnsContainer");
const selectStartPoint = document.getElementById("select-list");
const input1 = document.getElementById("start");
const input2 = document.getElementById("end");
const input3 = document.getElementById("destination1");
const inputTransport =document.getElementById("transport-option");
const form = document.querySelector("form");
alertButton.addEventListener("touchend", showIncidents);
trafficButton.addEventListener("touchend", showTraffic);
alertButton.addEventListener("click", showIncidents);
trafficButton.addEventListener("click", showTraffic);
const panel = document.getElementById("panel");
buttonSubmit.addEventListener("click", searchHandler);
resetButton.addEventListener("click", onReload);
selectStartPoint.addEventListener("change", (ev) => startingPointHandler(ev));
arrowContainer.addEventListener("touchend", () => {
  showForm();
});



function saveRouteToDB(routes) {
  const line = [];
  const summary = {};
  routes.sections.forEach((section, index) => {
  
    line.push(section.polyline);
    summary[index] = section.summary;
  });
  
  const data = { line: line, summary: summary };
  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  };
  fetch("/", options)
    .then((resp) => resp.json())

}

function hideForm() {
  form.classList.add("no-display");
  arrowContainer.classList.remove("no-display");
  btnsContainerImgs.classList.remove("no-display");
}

function showForm() {
  arrowContainer.classList.add("no-display");
  btnsContainerImgs.classList.add("no-display");
  form.classList.remove("no-display");
}

function isOnMobile() {
  return document.documentElement.clientWidth < 1001;
}

function isNotEmpty(event) {
  return event.value.length > 0;
}
function startingPointHandler(event){
if(event.target.value==="custom-localization"){
input1.classList.remove("no-display");
globalState.startType="custom"
}else if(event.target.value==="my-localization"){
input1.classList.add("no-display");
globalState.startType="my";

}
}

function searchHandler(ev) {
  ev.preventDefault();

  if (
    isNotEmpty(selectStartPoint.options[selectStartPoint.selectedIndex]) &&
    isNotEmpty(document.getElementById("end")) &&
    isNotEmpty(inputTransport)
  ) {
    const transportMode=()=>{
      switch(inputTransport.value){
        case "auto":
          return "car"
          break;
        case "rower":
          return "bicycle"
          break;
          case "pieszo":
            return "pedestrian"
      }
    }
    const transport=transportMode();
    disablingHandler();
    calculateGeocodes(transport);
  } else {
    alert("Pola start, koniec oraz rodzaj transportu nie mogą być puste");
  }
}

function disablingHandler(){
  buttonSubmit.disabled = true;
  resetButton.style.color = "red";
  document.querySelectorAll("input").forEach(el=>el.disabled=true)
}

function showTraffic(event) {
  event.preventDefault();
  if (!globalState.hasTrafficLayer) {
    map.addLayer(defaultLayers.vector.normal.traffic);
    globalState.hasTrafficLayer = true;
    trafficButton.classList.add("clicked");
  } else {
    map.removeLayer(defaultLayers.vector.normal.traffic);
    globalState.hasTrafficLayer = false;
    trafficButton.classList.remove("clicked");
  }
}

function showIncidents(event) {
  event.preventDefault();
  if (!globalState.hasIncidentLayer) {
    map.addLayer(defaultLayers.vector.normal.trafficincidents);
    globalState.hasIncidentLayer = true;
    alertButton.classList.add("clicked");
  } else {
    map.removeLayer(defaultLayers.vector.normal.trafficincidents);
    globalState.hasIncidentLayer = false;
    alertButton.classList.remove("clicked");
  }
}

function onReload() {
  panel.classList.add("hidden");
  window.location.reload();
}

window.addEventListener("resize", () => map.getViewPort().resize());

const behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));

const ui = H.ui.UI.createDefault(map, defaultLayers);

window.onload = function () {

  if (isOnMobile()) {
    hideForm();
    buttonSubmit.addEventListener("click", hideForm);
    document.getElementById("upArrow").addEventListener("touchend", hideForm);

    let touchstartY = 0;
    let touchendY = 0;
    function handleGesture() {
      if (touchendY < touchstartY) {
        hideForm();
      }
    }

    form.addEventListener("touchstart", (e) => {
      touchstartY = e.changedTouches[0].screenY;
    });

    form.addEventListener("touchend", (e) => {
      touchendY = e.changedTouches[0].screenY;
      handleGesture();
    });
  }
};
function toMMSS(duration) {
  return (
    Math.floor(duration / 3600) +
    " godzin " +
    (Math.floor(duration / 60) % 60) +
    " minut " +
    (duration % 60) +
    " sekund."
  );
}
function toKM(duration) {
  return Math.floor(duration / 1000) + " km " + +(duration % 1000) + " m.";
}

async function getHourlyWeatherForecast(lat, lng) {
  try {
    const forecast = await fetch(
      `https://weather.hereapi.com/v3/report?apiKey=${apiKey}&location=${lat},${lng}&products=forecastHourly&lang=pl-PL`
    )
      .then((resp) => resp.json())
      .then((data) => data.places[0].hourlyforecasts[0].forecasts);

    return forecast;
  } catch {
    alert("Ups.. Wystąpiły jakieś problemy! Może spróbuj jeszcze raz!");
  }
}
function addMarkerToGroup(group, coordinate, html) {
  const marker = new H.map.Marker(coordinate);

  marker.setData(html);
  group.addObject(marker);
}
function addInfoBubble(map) {
  const group = new H.map.Group();

  map.addObject(group);
  group.addEventListener(
    "tap",
    function (evt) {
      const bubble = new H.ui.InfoBubble(evt.target.getGeometry(), {
        content: evt.target.getData(),
      });
      ui.addBubble(bubble);
    },
    false
  );

  globalState.itemsPositions.forEach((el, idx) => {
    let weatherConditions;
    let text;
    let weather;
    const forecast = new Promise((res, rej) => {
      res(getHourlyWeatherForecast(...el));
    });
    forecast.then((data) => {
      weatherConditions = [...data];
      if (idx === 0) {
        weather = weatherConditions.filter(
          (el) =>
            el.time.slice(0, 13) ===
            globalState.actions.sections[0].departure.time.slice(0, 13)
        );
        let date = globalState.actions.sections[0].departure.time.split("T");

        text = `wyjazd z ${globalState.places[idx]}: ${date[0]} ${date[1].slice(
          0,
          5
        )}`;
      } else if (idx === 1) {
        weather = weatherConditions.filter(
          (el) =>
            el.time.slice(0, 13) ===
            globalState.actions.sections[
              globalState.actions.sections.length - 1
            ].arrival.time.slice(0, 13)
        );
        let date =
          globalState.actions.sections[
            globalState.actions.sections.length - 1
          ].arrival.time.split("T");
        text = `przyjazd do ${globalState.places[idx]}: ${
          date[0]
        } ${date[1].slice(0, 5)}`;
      } else {
        text = `${globalState.places[idx]}: jesteś tu tylko przejazdem`;
        weather = "";
      }

      addMarkerToGroup(
        group,
        { lat: el[0], lng: el[1] },
        `<div class="marker"> ${text}</div><br><div>${
          weather ? weather[0].temperature : weather
        } ${weather && "°C"} </div><div>${
          weather ? weather[0].description : weather
        } </div>`
      );
    });
  });
}

function showActions(element) {
  const directions = document.getElementsByClassName("directions");
  if (directions.length == 0) {
    var nodeOL = document.createElement("ol");

    nodeOL.style.fontSize = "small";
    nodeOL.style.marginLeft = "5%";
    nodeOL.style.marginRight = "5%";
    nodeOL.className = "directions";

    globalState.actions.sections.forEach((section) => {
      section.actions.forEach((action, idx) => {
        const li = document.createElement("li"),
          spanArrow = document.createElement("span"),
          spanInstruction = document.createElement("span");

        spanArrow.className =
          "arrow " + (action.direction || "") + action.action;
        spanInstruction.innerHTML = section.actions[idx].instruction;
        li.appendChild(spanArrow);
        li.appendChild(spanInstruction);

        nodeOL.appendChild(li);
      });
    });

    element.appendChild(nodeOL);
  } else {
    element.removeChild(element.lastElementChild);
  }
}
function addSummaryToPanel(route) {
  const toggleDirections = () => {
    if (panel.classList.contains("panel-menu")) {
      panel.classList.remove("panel-menu");
      buttonActions.innerHTML = "Pokaż wskazówki dojazdu";
      deleteBtn.style.display = "none";
    } else {
      panel.classList.add("panel-menu");
      buttonActions.innerHTML = "Ukryj wskazówki";
      deleteBtn.style.display = "block";
    }
    showActions(panel);
  };

  panel.classList.remove("hidden");
  const buttonActions = document.createElement("button");
  const deleteBtn = document.createElement("span");
  deleteBtn.innerHTML = "X";
  panel.appendChild(deleteBtn);
  deleteBtn.style.display = "none";
  deleteBtn.style.width = "30px";
  deleteBtn.style.position = "absolute";
  deleteBtn.style.right = "0px";
  deleteBtn.style.top = "0";
  deleteBtn.style.textAlign = "right";
  deleteBtn.style.fontWeight = "700";
  deleteBtn.style.cursor = "pointer";
  deleteBtn.onclick = () => {
    toggleDirections();
  };
  buttonActions.innerHTML = "Pokaż wskazówki dojazdu";
  buttonActions.type = "button";
  buttonActions.onclick = () => {
    toggleDirections();
  };
  let duration = 0,
    distance = 0;

  route.sections.forEach((section) => {
    distance += section.summary.length;
    duration += section.summary.duration;
  });

  var summaryDiv = document.createElement("div"),
    content =
      "<b>Całkowity dystans</b>: " +
      toKM(distance) +
      " <br />" +
      "<b>Czas podróży</b>: " +
      toMMSS(duration) +
      " (przy obecnym ruchu)";

  summaryDiv.classList.add("summary");
  summaryDiv.innerHTML = content;
  panel.appendChild(summaryDiv);
  panel.appendChild(buttonActions);
}

function addPolylineToMap(map, route) {
  route.sections.forEach((section) => {
    let linestring = H.geo.LineString.fromFlexiblePolyline(section.polyline);

    let polyline = new H.map.Polyline(linestring, {
      style: {
        lineWidth: 4,
        strokeColor: "rgba(0, 128, 255, 0.7)",
      },
    });
    map.addObject(polyline);
    map.getViewModel().setLookAtData({
      bounds: polyline.getBoundingBox(),
    });
  });
  globalState.itemsPositions.forEach((item) =>
    map.addObject(
      new H.map.Marker({
        lat: item[0],
        lng: item[1],
      })
    )
  );
}


function checkMyCoordinates(){

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    });
  }

async function fetchRoute(codesA, codesB, codesC, transportType) {
  try {
    const data =
      codesC == null
        ? await fetch(
            `https://router.hereapi.com/v8/routes?origin=${codesA[0]},${codesA[1]}&transportMode=${transportType}&destination=${codesB[0]},${codesB[1]}&return=polyline,turnByTurnActions,actions,instructions,summary&apiKey=${apiKey}`
          )
            .then((resp) => resp.json())
            .then((data) => {
              return data.routes[0];
            })
        : await fetch(
            `https://router.hereapi.com/v8/routes?origin=${codesA[0]},${codesA[1]}&transportMode=${transportType}&destination=${codesB[0]},${codesB[1]}&via=${codesC[0]},${codesC[1]}&return=polyline,turnByTurnActions,actions,instructions,summary&apiKey=${apiKey}`
          )
            .then((resp) => resp.json())
            .then((data) => {
              return data.routes[0];
            });
    globalState.actions = data;
    addPolylineToMap(map, data);
    addSummaryToPanel(data);
    addInfoBubble(map);
    saveRouteToDB(data);
  } catch {
    alert("Ups.. Wystąpiły jakieś problemy! Może spróbuj jeszcze raz!!!");
  }
}
async function fetchGeocodes(country) {
  try {
    let lat;
    let lng;
    const data = await fetch(
      `https://geocode.search.hereapi.com/v1/geocode?apiKey=${apiKey}&q=${country}`
    );
    const data_1 = await data.json();
    globalState.places.push(data_1.items[0].address.label);
    lat = data_1.items[0].position.lat;
    lng = data_1.items[0].position.lng;
    globalState.itemsPositions.push([lat, lng]);
    return [lat, lng];
  } catch {
    alert("Ups.. Wystąpiły jakieś problemy! Może spróbuj jeszcze raz!");
  }
}

async function calculateGeocodes(transport) {
  let start;

 if(globalState.startType==="custom"){
  start = input1.value;
 } else if(globalState.startType==="my"){
   start = await checkMyCoordinates()
   .then(position => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    globalState.places.push(`${latitude}, ${longitude}`);
    globalState.itemsPositions.push([latitude, longitude]);
    return [latitude,longitude]
   })
   }
   
  const end = input2.value;
  const destination1 = input3.value;
  const transportType= transport;

  let geocodesA = globalState.startType==="custom"? await fetchGeocodes(start) : start;
  let geocodesB = await fetchGeocodes(end);
  let geocodesC = destination1.length == 0 ? null : await fetchGeocodes(destination1);

  fetchRoute(geocodesA, geocodesB, geocodesC, transportType);
  }
