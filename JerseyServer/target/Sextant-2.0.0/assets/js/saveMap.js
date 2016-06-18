/**
 * For each layer create a checkbox when save map is called
 */
function showLayerBox() {
	var divRef, element;
	for (var i=0; i<mapLayers.length; i++) {
		//Dont save the layers that are created with drag and drop because we do not have a URI for them
		if (mapLayers[i].uri != 'dragAndDrop') {
			//Create new row
			divRef = document.getElementById('chooseLayers');	
			element = document.createElement('div');
			element.setAttribute('id', 'rowSelect'+i);
			divRef.appendChild(element);
			
			//Add checkbox and layer name
			divRef = document.getElementById('rowSelect'+i);
			element = document.createElement('input');
		    element.type = "checkbox";
		    element.checked = true;
		    element.id = "selectBox" + mapLayers[i].name;
			element.setAttribute('style', 'margin-right: 8px');
			
			divRef.appendChild(element);
			element = document.createElement('label');
			element.setAttribute('style', 'margin-right: 8px');
		    element.appendChild(document.createTextNode(mapLayers[i].name));
			divRef.appendChild(element);
		}			
	}
	
	var num = document.getElementById('mapIdType').length;
 	if (document.getElementById('infoMapId').innerHTML != "" && num < 2) {
 		var element = document.createElement('option');
 	  	element.innerHTML = 'update existing map';
 	  	document.getElementById('mapIdType').appendChild(element);
 	}
}

function resetLayerSelection() {
	var divRef = document.getElementById('chooseLayers');
	for(var i=0; i<mapLayers.length; i++) {
		if (mapLayers[i].uri != 'dragAndDrop') {
			var element = document.getElementById('rowSelect'+i);		
			divRef.removeChild(element);
		}
	}
	
	//Reset form
	document.getElementById('hiddenSaveMap').reset();
}

function saveMapToEndpoint() {
	var title = document.getElementById('mapTitle').value;
	var creator = document.getElementById('mapCreator').value;
	var endpointURI = document.getElementById('mapEndpointURI').value;
	var license = document.getElementById('mapLicense').value;
	if (license == "") {
		license = 'none';
	}
	var theme = document.getElementById('mapTheme').value;
	var portValue = document.getElementById('mapEndpointPort').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	
	var description = document.getElementById('mapDescription').value;
	if (description == "") {
		description = 'none';
	}
	
	var user = document.getElementById('mapEndpointUser').value;
	var pass = document.getElementById('mapEndpointPass').value;
	
	var idMode = document.getElementById('mapIdType');
	var mode = idMode.options[idMode.selectedIndex].value.toString();
	
	//If we alter a loaded map we need to keep the same mapId, except if the mode says different
	var mapId = document.getElementById('infoMapId').innerHTML;
	if (mapId === "" || mode === "create new map") {
		mapId = 'empty';
	}
	
	if (title === "" || creator === "" || theme === "") {
		document.getElementById('alertMsgSaveMapParams').style.display = 'block';
	    setTimeout(function() {$('#alertMsgSaveMapParams').fadeOut('slow');}, fadeTime);

	    resetLayerSelection();
	    return -1;
	}
	
	if (endpointURI === "") {
		endpointURI = "registry/tempendpoint";
		port = 80;
		user = "temp";
		pass = "temp";
	}
	
	endpointURI = endpointURI.replace("http://", "");
	var parts = endpointURI.split('/');
	var host = parts[0];
	var endpoint = parts[1];
	
	//Save each layer's info if it is selected by the user
	var counter = 0;
	var layerInformation = "";
	for (var i=0; i<mapLayers.length; i++) {
		//Dont save the layers that are created with drag and drop because we do not have a URI for them
		if (mapLayers[i].uri != 'dragAndDrop') {
			if (document.getElementById('selectBox' + mapLayers[i].name).checked) {
				if (mapLayers[i].type.substring(0, 3) === 'wms') {
					mapLayers[i].imageBbox = '';
					mapLayers[i].icon = '';
				}
				layerInformation += layerToJSON(i);
				layerInformation += "\n";
				
				//Remove line breaks and escape characters that JSON.stringify() added
				layerInformation = layerInformation.replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ").replace(/\\/g, "");

				counter ++;
			}
		}	
	}
	
	if (counter == 0) {
		document.getElementById('alertMsgMoreLayers').style.display = 'block';
	    setTimeout(function() {$('#alertMsgMoreLayers').fadeOut('slow');}, fadeTime);
	    return -1;
	}
	
	//Save each chart's info
	var chartInformation = "";
	for (var i=0; i<charts.length; i++) {
		chartInformation += chartToJSON(i);
		chartInformation += "\n";
		
		//Remove line breaks and escape characters that JSON.stringify() added
		chartInformation = chartInformation.replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\\t/g, " ").replace(/\\/g, "");

	}
	
	//Map extent
	var mapBbox = zoomToAll(1);
	var geosparql = 'none';
	
	if (mapBbox != null) {
		geosparql = '<http://www.opengis.net/def/crs/EPSG/0/4326> ' + mapExtentToWKTLiteral(mapBbox);
	}
	
	//User Info layer
	var userAddedInformation = '';
	
	//Save the map in the given endpoint
	var mapInformation = layerInformation + '@@@' + chartInformation + '###' + geosparql + '!!!' + userAddedInformation;
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	$.ajax({
        type: 'POST',
        url: rootURL + '/saveMap/' + host + "/" + endpoint + "/" + title + "/" +
        	 creator + "/" + license + "/" + theme + "/" + description + "/" + port + "/" +
        	 user + "/" + pass + "/" + mapId,
        data: mapInformation,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: saveMapDone,
        error: printError
    });
	
	//Update map info
	document.getElementById('infoMapTitle').innerHTML = title;
	document.getElementById('infoCreator').innerHTML = creator;
	document.getElementById('infoLicense').innerHTML = license;
	document.getElementById('infoTheme').innerHTML = theme;
	document.getElementById('infoExtent').value = geosparql;	
}

function saveMapDone(results, status, jqXHR) {
	hideSpinner();
	document.getElementById('alertMsgServerWait').style.display = 'none';

	document.getElementById('alertMsgSavedMap').style.display = 'block';
    setTimeout(function() {$('#alertMsgSavedMap').fadeOut('slow');}, fadeTime);
    
    var arr = results.toString().split(',');
    document.getElementById('infoMapId').innerHTML = arr[0];
    
    if (arr[1] === 'registry/tempendpoint') {
    	document.getElementById('infoEndpoint').innerHTML = 'registry';
    }
    else {
    	document.getElementById('infoEndpoint').innerHTML = arr[1];
    }
    
    document.getElementById('infoDateCreate').innerHTML = arr[2];
    document.getElementById('infoDateModify').innerHTML = arr[3];
    
    //Set URL mapid parameters without refreshing the page
    var parseHost = arr[1].split('/');
	var state = {
  		  'thisIsOnPopState': true
    };
	if (parseHost[0] == 'registry') {
		history.pushState(state, 'Sextant', '/' + arrHost[1] + '/' + '?mapid=' + arr[0]);
	}
	else {
		history.pushState(state, 'Sextant', '/' + arrHost[1] + '/' + '?mapid=' + arr[0] +
				'&host=' + parseHost[0] + '&endpoint=' + parseHost[1]);
	}
}

function layerToJSON(i) {
    return JSON.stringify({
        "name": mapLayers[i].name.toString().concat("$"),
        "uri": mapLayers[i].uri.toString().concat("$"),
        "isTemp": mapLayers[i].isTemp.toString().concat("$"),
        "fileType": mapLayers[i].type.toString().concat("$"),
        "queryText": mapLayers[i].query.toString().concat("$"),
        "endpointURI": mapLayers[i].endpoint.toString().concat("$"),
        "mapId": mapLayers[i].mapId.toString().concat("$"),
        "fillColor" : mapLayers[i].fillColor.toString().concat("$"),
        "strokeColor" : mapLayers[i].strokeColor.toString().concat("$"),
        "iconURI" : mapLayers[i].icon.toString().concat("$"),
        "iconSize" : mapLayers[i].iconSize.toString().concat("$"),
        "imageBox" : mapLayers[i].imageBbox.toString().concat("$"),
        "type" : mapLayers[i].type.toString().concat("$")
        });
}

function chartToJSON(i) {
	return JSON.stringify({
		"name": "chart$",
		"endpointURI": charts[i].endpointURI.toString().concat("$"),
		"queryText": charts[i].query.toString().concat("$"),
		"type": charts[i].type.toString().concat("$"),
		"measures": charts[i].measures.toString().concat("$"),
		"freeDims": dimArrayToString(charts[i].freeDims).concat("$"),
		"instances": charts[i].instance.toString().concat("$")
	});
}