var mapSearch;
var drawControl;
var boxLayer = null;
var hostSearch, endpointSearch, portSearch;
var selectedMapId;

function initSearchMap() {
	document.getElementById('searchMapExtentForm').style.display = 'block';
	document.getElementById('drawExtentButton').disabled = true;
	
	//Initialize map
	mapSearch = new OpenLayers.Map('mapSearchExtent');
	
	var ghyb = new OpenLayers.Layer.Google("Google Hybrid",
            {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 15, visibility: false}
            );
	mapSearch.addLayers([ghyb]);
	mapSearch.setBaseLayer(ghyb);
	
	mapSearch.setCenter(new OpenLayers.LonLat(23.72275, 37.92253).transform(new OpenLayers.Projection("EPSG:4326"), mapSearch.getProjectionObject()), 6, true, true);
	mapSearch.projection = WGS84_google_mercator;
	mapSearch.displayProjection = new OpenLayers.Projection("EPSG:4326");
	
	//Add draw box contols
	boxLayer = new OpenLayers.Layer.Vector("Box layer");
	mapSearch.addLayer(boxLayer);
	drawControl = new OpenLayers.Control.DrawFeature(boxLayer,
	                                                     OpenLayers.Handler.RegularPolygon, 
	                                                     { 
															eventListeners: {'featureadded': newPolygonAdded},
											      			handlerOptions: {
											      				sides: 4,
										                        irregular: true
											      			}
	                                                     });
	mapSearch.addControl(drawControl);
}

function enableControl() {
	drawControl.activate();
	//document.getElementById('enableControlDraw').style.border = 'solid red';
	document.getElementById("enableControlDraw").style.borderColor = "red";
}

function newPolygonAdded() {
	drawControl.deactivate();
	//document.getElementById('enableControlDraw').style.border = 'none';
	document.getElementById("enableControlDraw").style.borderColor = '#ccc';	
}

function resetPolygonBox() {
	boxLayer.removeAllFeatures();
	drawControl.deactivate();
}

function resetSearchMapForm() {
	document.getElementById('searchMapExtentForm').style.display = 'none';
	document.getElementById('drawExtentButton').disabled = false;
	
	var divRef = document.getElementById('mapSearchExtent');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	document.getElementById('mapSearchForm').reset();
	boxLayer = null;
}

function getMapSearchResults() {
	var searchTitle = document.getElementById('mapSearchTitle').value;
	if (searchTitle == "") {
		searchTitle = 'none';
	}
	
	var searchCreator = document.getElementById('mapSearchCreator').value;
	if (searchCreator == "") {
		searchCreator = 'none';
	}
	
	var searchLicense = document.getElementById('mapSearchLicense').value;
	if (searchLicense == "") {
		searchLicense = 'none';
	}
	
	var searchTheme = document.getElementById('mapSearchTheme').value;
	if (searchTheme == "") {
		searchTheme = 'none';
	}	
	
	var searchPortValue = document.getElementById('mapIdEndpointSearchPort').value;
	portSearch = 80;
	if (searchPortValue != "") {
		portSearch = Number(searchPortValue);
	}
	
	var searchEndpoint = document.getElementById('mapIdEndpointSearch').value;
	if (searchEndpoint === "") {
		hostSearch = 'registry';
		endpointSearch = 'registry';
	}
	else {
		searchEndpoint = searchEndpoint.replace("http://", "");
		var parts = searchEndpoint.split('/');	
		hostSearch = parts[0];
		endpointSearch = parts[1];		
	}
	
	var extent = 'none';
	if (boxLayer != null) {
		if (boxLayer.getDataExtent() != null) {		
			extent = mapExtentToWKTLiteral(boxLayer.getDataExtent().transform(WGS84_google_mercator, WGS84).toString());
		}
	}
	
	var data = searchTitle + '$' + searchCreator + '$' + searchLicense + '$' + searchTheme + '$' + extent;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	$.ajax({
        type: 'POST',
        url: rootURL + '/mapSearch/' + hostSearch + '/' + endpointSearch + '/' + portSearch,
        data: data,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseSearchResults,
        error: printError
    });
	
	resetSearchMapForm();
}

function parseSearchResults(results, status, jqXHR) {
	var element;
	var divRef;
	var countResults = 0;
	
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    hideSpinner();
	
	if (results === 'none$') {
		document.getElementById('alertMsgNoResults').style.display = 'block';
  		setTimeout(function() {$('#alertMsgNoResults').fadeOut('slow');}, 4000);
		return;
	}
	
	var divRef = document.getElementById('searchResultsBody');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	var arr = results.split('\$');
	for (var i=0; i<arr.length-1; i+=6) {
		var parseId = arr[i].substr(arr[i].lastIndexOf('/')+1, arr[i].length);
		
		//Create a well for each map
		divRef = document.getElementById('searchResultsBody');
		element = document.createElement('div');
		element.setAttribute('class', 'well well-sm');
		element.id = 'mapResult'+i;
		divRef.appendChild(element);
		
		divRef = document.getElementById('mapResult'+i);
		//Add well header
		element = document.createElement('h4');
		element.innerHTML = 'Title: ' + arr[i+1] + ' [ ' + parseId + ' ]';
		divRef.appendChild(element);
		
		//Add well content
		element = document.createElement('p');
		element.innerHTML = arr[i+5];
		divRef.appendChild(element);
		
		//Add well metadata
		element = document.createElement('p');
		element.innerHTML = '[<b>Creator:</b> ' + arr[i+2] + ', <b>Theme:</b> ' + arr[i+4] + ', <b>License:</b> ' + arr[i+3] + ']';
		divRef.appendChild(element);
		
		//Add checkbox to well
		element = document.createElement('input');
		element.type = 'checkbox';
		element.id = 'mapResultBox'+countResults;
		element.value = parseId;
		countResults ++;
		element.addEventListener('click', function(){
			setBoxFunction(this.id, (arr.length-1)/6);
		});
		divRef.appendChild(element);
	}
	
	$('#mapSearchResultsModal').modal('show');
}

function setBoxFunction(id, length) {
	if (document.getElementById(id).checked) {
		for (var i=0; i<length; i++) {
			document.getElementById('mapResultBox'+i).checked = false;
		}
		document.getElementById(id).checked = true;
		selectedMapId = document.getElementById(id).value;
		document.getElementById('submitLoadSelection').disabled = false;
	}
	else {
		document.getElementById('submitLoadSelection').disabled = true;
	}
}

function loadSelectedMap() {
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	document.getElementById('infoMapId').innerHTML = selectedMapId;
	if (hostSearch == 'registry') {
		document.getElementById('infoEndpoint').innerHTML = 'registry';
		getMapInfo(selectedMapId, "none", "none", "none", 80);
	}
	else {
		document.getElementById('infoEndpoint').innerHTML = hostSearch + '/' + endpointSearch + '/Query';
		getMapInfo(selectedMapId, hostSearch, endpointSearch, 'Query', portSearch);
	}
}









