const btt = document.getElementById("botao");
const list = document.getElementById("fill_list");
const address = document.getElementById("address");
const numBikes = document.getElementById("qtd-bike");
const para = document.getElementById("para");
const listResults = document.getElementById("list-results");
const resultsTitle = document.getElementById("results-title");

// Criação do Mapa
  var map = L.map('map').setView([-8.041886996292225, -34.91760953929308], 13);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);


  //Chamando API
 async function callApi(){
    var response = await fetch('http://dados.recife.pe.gov.br/api/3/action/datastore_search?resource_id=e6e4ac72-ff15-4c5a-b149-a1943386c031');
    var data = await response.json();
    var fields = data.result.records;
    return fields;
  }


//Criando Lista
  async function createListItens(){
    var fields = await callApi();
    var nearBikeStops = await getNearbyBikeStops();
    list.innerHTML = "";
    resultsTitle.innerHTML = "";
    resultsTitle.innerHTML = "Bicicletários mais próximos:";
    for(var i = 0; i < nearBikeStops.length; i++){
      var bikeStopId = nearBikeStops[i][1];
      var bikeStopDist = nearBikeStops[i][0];
      var bikeField = fields.find(el => el._id == bikeStopId);
        const li = document.createElement('li');
        li.setAttribute('id', bikeStopId);
        li.setAttribute('class', "list-group-item");
        li.innerHTML = bikeField.nome + " | " + bikeStopDist + " Km";
        list.appendChild(li);
    }
  }


//Calcular as distâncias
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    lat1 = parseFloat(lat1);
    lon1 = parseFloat(lon1);
    lat2 = parseFloat(lat2);
    lon2 = parseFloat(lon2);

    var R = 6371;
    var dLat = deg2rad(lat2-lat1);
    var dLon = deg2rad(lon2-lon1); 
    var a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    var d = R * c;
    return d.toFixed(2);
  }
 
  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }


//Achar a localização do endereço pesquisado
  async function getLocation(){
    var inpAdd = address.value
    var inputAddress = inpAdd.replaceAll(" ", "%20");
    var locUrl = "https://nominatim.openstreetmap.org/search?format=json&limit=3&q=" + inputAddress + "%20,%20Recife";
    try {
      const response = await fetch(locUrl);
      const data = await response.json();
      var addLat = data[0].lat;
      var addLon = data[0].lon;
      var coordArr = [addLat, addLon];
      return coordArr;
    } catch (error) {
      console.error(error);
    }
  }


//Achar os bicicletários mais próximos
  async function getNearbyBikeStops(){
    var distArr = [];
    var localCoord = await getLocation();
    var bikeStopsData = await callApi();
    var size = bikeStopsData.length;
    for(var i = 0; i < size; i++){
      var distEl = [];
      eachBikeStop = bikeStopsData[i];
      var dist = getDistanceFromLatLonInKm(localCoord[0], localCoord[1], eachBikeStop.latitude, eachBikeStop.longitude);
      distEl.push(dist);
      distEl.push(eachBikeStop._id);
      distArr.push(distEl);
    }
    distArr.sort(function(a, b) {
      return a[0] - b[0];
    });
    distArrFinal = distArr.slice(0, numBikes.value);
    return distArrFinal;
  }


  var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

//Atualkizando o mapa e adicionando os marcadores
  async function updateMap() {
    var destCoord = await getLocation();

    map.eachLayer(function (layer) {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });
  
    map.flyTo([destCoord[0], destCoord[1]], 13);
    L.marker([destCoord[0], destCoord[1]]).addTo(map);
  
    var coordsAdd = await getNearbyBikeStops();
    var fields = await callApi();
    for(var k = 0; k < coordsAdd.length; k++){
      var bikeStopId = coordsAdd[k][1];
      var bikeField = fields.find(el => el._id == bikeStopId);

      L.marker([bikeField.latitude, bikeField.longitude], {icon: greenIcon}).addTo(map);
    }
  }


  // Acionamento do evento
btt.addEventListener("click", (e) => {
  e.preventDefault();
  createListItens();
  updateMap();
});
