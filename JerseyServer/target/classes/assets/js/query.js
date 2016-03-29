var queryTable = [];

var countR;
var colorId = 0;

function createQueryList() {
	countR = 0;
	
	var portValue = document.getElementById('endpointUrlPort').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpoint = document.getElementById('endpointUrl').value;
	endpoint = endpoint.replace("http://", "");
	var parts = endpoint.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	getPredefinedQueries(host, endpointName, port);	
}

function getPredefinedQueries(host, endpoint, port) {
	document.getElementById('endpointUrl').disabled = true;
	document.getElementById('endpointUrlPort').disabled = true;
	
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/queries/' + host + '/' + endpoint + '/' + port,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseQueries,
        error: printError
    });
}

/**
 * SELECT ?m WHERE {?m rdf:type <http://geo.linkedopendata.gr/map/ontology/Map> }$
 * SELECT ?x WHERE {?x rdf:type <http://geo.linkedopendata.gr/query/ontology/predefinedQuery> }$
 * SELECT ?x WHERE {?x rdf:type <http://geo.linkedopendata.gr/query/ontology/predefinedQuery> }$
 * Select all map IDs in this endpoint.$
 * Select all map IDs in this endpoint.$
 * Select all predefined query IDs in this endpoint.$
 * false$
 * false$
 * false$
 */
function parseQueries(results, status, jqXHR) {
	var arr = results.split('\$');
	
	//Clear queryTable
	queryTable = [];
	
	var num = arr.length;
	for (var i=0; i<(num-2); i+=3) {
		//alert(arr[i]);
		var pq = new PredQuery(arr[i], arr[i+1], arr[i+2]);
		queryTable.push(pq);
	}
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);  
    
    createCheckBoxes();
}

//Add a checkbox for each predefined query
function createCheckBoxes() {
	var element;
	var divRef = document.getElementById('availiableQueries');
	
	for (var i=0; i<queryTable.length; i++) {
		element = document.createElement('div');
		element.setAttribute('class', 'well well-sm');
		element.innerHTML = '<p>' + queryTable[i].label + '</p>';
		element.id = 'wellQ'+countR;
		divRef.appendChild(element);
		element = document.createElement('input');
		element.type = 'checkbox';
		element.id = 'boxQ'+countR;
		element.addEventListener('click', function(){
			setBox(this.id);
		});
		document.getElementById('wellQ'+countR).appendChild(element);
		countR ++;
	}
	
	//Enable OK button
	if (disableAll == false) {
		document.getElementById('okPredefinedButton').disabled = false;
	}
}

function loadQuery() {
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	var portValue = document.getElementById('endpointUrlPort').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpointURI = document.getElementById('endpointUrl').value;	
	endpointURI = endpointURI.replace("http://", "");
	var parts = endpointURI.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	var tempLayer;
	for (var i=0; i<countR; i++) {
		if (document.getElementById('boxQ'+i).checked) {
			
			//Set global variables for the upload to work
			var layerName = 'query'.concat(i.toString());			
			if (queryTable[i].isTemp === 'true') {
				tempLayer = true;
			}
			else {
				tempLayer = false;
			}
			
			getQueryResults(host, endpointName, queryTable[i].text.toString(), layerName, port, tempLayer);	        
		}
	}
	
	resetForm();
}

function setBox(id) {
	if (document.getElementById(id).checked) {
		for (var i=0; i<countR; i++) {
			document.getElementById('boxQ'+i).checked = false;
		}
		document.getElementById(id).checked = true;
	}
}

function resetForm() {
	queryTable = [];
	
	document.getElementById('endpointUrl').disabled = false;
	document.getElementById('endpointUrlPort').disabled = false;
	
	var divRef = document.getElementById('availiableQueries');
	
	//Delete old queries from list
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	if (colorId >= 14) {
		colorId = 0;
	}
	
	//Reset form data
    document.getElementById('poseQuery').reset();
}

/************************************************************************************/

/**
 * Pose new Query functions
 */
function runQuery() {
	var endpointURI = document.getElementById('endpointUrlQuery').value;
	var portValue = document.getElementById('loadEndpointPort').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	
	if (endpointURI != "http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql") {		
		//SPARQL endpoint that return KML file
		
		//Remove http:// from the URI
		endpointURI = endpointURI.replace("http://", "");
		
		var tempLayer = document.getElementById('isTemporalQuery').checked;
		
		var queryText = document.getElementById('textQuery').value.toString();
		
		var name = document.getElementById('layerNameQuery').value;
		
		if (name == "") {
	    	document.getElementById('alertMsgFailEmpty').style.display = 'block';
	        setTimeout(function() {$('#alertMsgFailEmpty').fadeOut('slow');}, fadeTime);
	        return;
		}
		
		var parts = endpointURI.split('/');
		var host = parts[0];
		var endpointName = "";
		for (var i=1; i<parts.length-1; i++) {
			endpointName += parts[i] + '@@@';
		}
		endpointName += parts[parts.length-1];
		
		//Get results from server and create the layer
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
		
		getQueryResults(host, endpointName, queryText, name, port, tempLayer);	
	}
	else {
		//KML from ordnancesurvey endpoint
		
		var queryText = document.getElementById('textQuery').value.toString();
		var name = document.getElementById('layerNameQuery').value;
		
		if (name == "") {
	    	document.getElementById('alertMsgFailEmpty').style.display = 'block';
	        setTimeout(function() {$('#alertMsgFailEmpty').fadeOut('slow');}, fadeTime);
	        return;
		}
		
		//Get results from server and create the layer
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
		
		getOSfile(queryText, name);
	}
	
	//Reset form data
    document.getElementById('poseUserQuery').reset();
    document.getElementById('endpointUrlQuery').disabled = false;
	document.getElementById('loadEndpointPort').disabled = false;
}

function getQueryResults(host, endpointName, query, layer, port, tempLayer) {
    $.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/' + host + "/" + endpointName+ "/" + layer + "/" + port + "/" + tempLayer,
        data: query,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: uploadKML,
        error: printError
    });
}

function uploadKML(results, status, jqXHR) {
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    
    //parse results
    var parseResultsLayer = results.split('\$');    
    var endpointURI = 'http://' + parseResultsLayer[3] + '/' + parseResultsLayer[4] ;
    var tempLayer;
    if (parseResultsLayer[5] == 'true') {
    	tempLayer = true;
    }
    else {
    	tempLayer = false;
    }
    
	addLayer(parseResultsLayer[0], parseResultsLayer[2], tempLayer, "kml", parseResultsLayer[1], endpointURI, 0, null, null, null, null, null);
}

function printError(jqXHR, textStatus, errorThrown) {
	hideSpinner();
	hideSpinnerDescribe();
	document.getElementById('alertMsgServerWait').style.display = 'none';

	document.getElementById('alertMsgServerError').style.display = 'block';
    setTimeout(function() {$('#alertMsgServerError').fadeOut('slow');}, fadeTime);	
}

function getOSfile(query, layer) {
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/OS/' + layer,
        data: query,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: uploadOS,
        error: printError
    });
}

function uploadOS(results, status, jqXHR) {
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    
    //parse results
    var parseResultsLayer = results.split('\$');    
    var endpointURI = 'http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql';
    
	addLayer(parseResultsLayer[0], parseResultsLayer[2], false, "kml", parseResultsLayer[1], endpointURI, 0, null, null, null, null, null);
}

function updateQuery() {
	showSpinner(colorSpin);
	
	var endpointURI = document.getElementById('endpointUrlQueryUpdate').value;
	var portValue = document.getElementById('loadEndpointPortUpdate').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	
	//Remove http:// from the URI
	endpointURI = endpointURI.replace("http://", "");
	
	var tempLayer = document.getElementById('isTemporalQueryUpdate').checked;
	
	var queryText = document.getElementById('textQueryUpdate').value.toString();
	
	var name = document.getElementById('layerNameQueryUpdate').value;
	
	var parts = endpointURI.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	//Delete the old layer and pose the query to get the new one
	var tableRef = document.getElementById('layerTable').getElementsByTagName('tbody')[0];
	var pos=0;
	var table = document.getElementById('layerTable');
    for (var i=0; i<table.rows.length; i++) {
        if (table.rows[i].cells[1].innerHTML == tempName) {
            pos = i;
        }
    }
	
    deleteLayer(tableRef, pos, mapLayers[pos].isTemp, tempName);
	
	//Get results from server and create the layer
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	getQueryResults(host, endpointName, queryText, name, port, tempLayer);
}



/**
 * If the users selects a Strabon endpoint then he must provide URL and Port.
 * If he selects Ordnance Survey SPARQL endpoint then the URL and port are auto-filled and cannot be changed.
 */
function endpointSelect() {
	var divRef = document.getElementById('endpointType');
	if (divRef.options[divRef.selectedIndex].value == 'Ordnance Survey SPARQL endpoint') {
		document.getElementById('endpointUrlQuery').value = 'http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql';
		document.getElementById('loadEndpointPort').value = 80;
		
		document.getElementById('endpointUrlQuery').disabled = true;
		document.getElementById('loadEndpointPort').disabled = true;
	}
	else {
		document.getElementById('endpointUrlQuery').disabled = false;
		document.getElementById('loadEndpointPort').disabled = false;
		
		document.getElementById('endpointUrlQuery').value = null;
		document.getElementById('loadEndpointPort').value = null;
	}
}
