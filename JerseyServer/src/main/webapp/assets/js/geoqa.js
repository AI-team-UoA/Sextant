function askGeoQA() {
  const divRef = document.getElementById("chatHistory");

  const questionsCollection = document.getElementsByClassName("qaText");
  const lastQuestion =
    questionsCollection[questionsCollection.length - 1].value;

  //Send GET request with the question as parameter
  $.ajax({
    type: "POST", //send it through get method
    url: rootURL + "/geoqa/",
    data: lastQuestion.toString(),
    dataType: "text",
    headers: {
      //'Accept-Charset' : 'utf-8',
      "Content-Type": "text/plain; charset=utf-8",
    },
    success: function (response) {
      if (response.includes("GET request failed")) {
        createErrorMessage(divRef);
      } else {
        const responseJSON = JSON.parse(response);
        console.log(responseJSON);

        if (responseJSON.geosparql) {
          //Contains geospatial Send the query to the SPARQL endpoint and view the results as a layer
          document.getElementById("alertMsgServerWait").style.display = "block";
          showSpinner(colorSpin);

          //To change if we can get it from the response
          const layerName = 'Layer '+ (questionsCollection.length - 1).toString();

          createResponseLayer(responseJSON.content.toString(), divRef, layerName);
        } else {
          //Show the response in the chat
          createResponseMessage(responseJSON.content.toString(), divRef);
        }
      }
    },
    error: printError,
  });
}

function createResponseLayer(query, divRef, layerName) {
  console.log(query);

  $.ajax({
    type: "POST", //send it through get method
    url: rootURL + "/geoqa/layer/",
    data: query,
    dataType: "text",
    headers: {
      //'Accept-Charset' : 'utf-8',
      "Content-Type": "text/plain; charset=utf-8",
    },
    success: function (response) {
      if (response.includes("GET request failed")) {
        createErrorMessage(divRef);
      } else {
        const responseJSON = JSON.parse(response);

        parseResults(responseJSON, layerName);
        createLayerMessage(layerName, divRef)
      }
    },
    error: printError,
  });
}

function parseResults(responseJSON, layerName) {
  var geojson = {
    type: "FeatureCollection",
    features: [],
  };

  const data = responseJSON.results.bindings;

  //console.log(data);

  data.forEach((element) => {
    var newFeature = {
      type: "Feature",
      geometry: {},
      properties: {},
    };

    Object.keys(element).forEach((key) => {
      if (
        element[key].value.toString().includes("POINT") ||
        element[key].value.toString().includes("MULTIPOINT") ||
        element[key].value.toString().includes("LINESTRING") ||
        element[key].value.toString().includes("MULTILINESTRING") ||
        element[key].value.toString().includes("POLYGON") ||
        element[key].value.toString().includes("MULTIPOLYGON")
      ) {
        //Add geometry to feature
        newFeature.geometry = Terraformer.wktToGeoJSON(
          element[key].value.toString()
        );
      } else {
        //Add property to feature
        newFeature.properties[element[key].toString()] =
          element[key].value.toString();
      }

      //console.log(newFeature);
      geojson.features.push(newFeature);
    });
  });

  //console.log(JSON.stringify(geojson, null, 2));
  drawLayer(geojson, layerName);
}

function drawLayer(geojson, label) {
  const blob = new Blob([JSON.stringify(geojson, null, 2)], {
    type: "text/plain",
  });

  mapLayers.push(new Layer(label, URL.createObjectURL(blob).toString(), false, 'geojson', '', '', '#ff9900', '#ff9900', '', '', 0, '', ''));

  //Image Vector layer to use WebGL rendering
  var layer = new ol.layer.Image({
    title: label,
    source: new ol.source.ImageVector({
      source: new ol.source.Vector({
        url: URL.createObjectURL(blob).toString(),
        format: new ol.format.GeoJSON(),
      }),
      style: defaultVectorStyle,
    }),
  });

  map.addLayer(layer);

  var listenerKey = layer.getSource().on("change", function (e) {
    if (layer.getSource().getState() == "ready") {
      updateLayerStats(label);

      for (var i = 0; i < mapLayers.length; i++) {
        if (mapLayers[i].name === label && label != "userInfo") {
          mapLayers[i].features = getLayerFeatureNames(layer);
          break;
        }
      }

      map
        .getView()
        .fit(layer.getSource().getSource().getExtent(), map.getSize());

      //Unregister the "change" listener
      layer.getSource().unByKey(listenerKey);
    }
  });

  //Add a row for this layer in the Manage Layers view
  addTableRow(label, 'geojson');  
       
  //Show renewed last modification date and number of layers
  document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;

  hideSpinner();
  setTimeout(function () {
    $("#alertMsgServerWait").fadeOut("slow");
  }, fadeTime);
}



function createResponseMessage(responseMsg, divRef) {
  var newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control qaResponse");
  newChatElement.setAttribute("rows", "5");
  newChatElement.value = responseMsg;

  divRef.appendChild(newChatElement);

  newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control");
  newChatElement.setAttribute("rows", "5");
  newChatElement.setAttribute("placeholder", "Ask me a question!");

  divRef.appendChild(newChatElement);
}

function createLayerMessage(layerName, divRef) {
  var newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control qaResponse");
  newChatElement.setAttribute("rows", "5");
  newChatElement.value = 'I have created a layer on the map with the results of your questions. The layer name is "'+layerName+'" and you can find it in the Layers panel above.';

  divRef.appendChild(newChatElement);

  newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control");
  newChatElement.setAttribute("rows", "5");
  newChatElement.setAttribute("placeholder", "Ask me a question!");

  divRef.appendChild(newChatElement);
}

function createErrorMessage(divRef) {
  var newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control qaError");
  newChatElement.setAttribute("rows", "5");
  newChatElement.value = "An error occured. Please try again!";

  divRef.appendChild(newChatElement);

  newChatElement = document.createElement("textarea");
  newChatElement.setAttribute("class", "qaText form-control");
  newChatElement.setAttribute("rows", "5");
  newChatElement.setAttribute("placeholder", "Ask me a question!");

  divRef.appendChild(newChatElement);
}