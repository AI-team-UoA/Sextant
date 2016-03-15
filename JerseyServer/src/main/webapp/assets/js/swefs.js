var play = 0;
var step = 300;
function loadMapCurrent() {
	var stepValue = document.getElementById('swefsTimeStep').value;
	if (stepValue != "") {
		step = Number(stepValue);
	}
	
	if (play == 0) {
		play = 1;
		document.getElementById('sefsPlay').innerHTML = '<i class="fa fa-stop fa-lg"></i>';
		//Start loading current data and show clock
		startClock = setInterval(function () {swefsClockTimer();}, 1000);
		startLoading = setInterval(function () {loadMapForward();}, 1000*step);
	}
	else {
		clearInterval(startClock);
		clearInterval(startLoading);
		play = 0;
		document.getElementById('sefsPlay').innerHTML = '<i class="fa fa-play fa-lg"></i>';
		document.getElementById('localTime').innerHTML = '';
	}
}

function loadMapBackward() {
	var timeStamp = 'backward';
	swefsLoadData(timeStamp);
}

function loadMapForward() {
	var timeStamp = 'forward';
	swefsLoadData(timeStamp);
}

function swefsClockTimer() {
	var d = new Date();
	document.getElementById('localTime').innerHTML = d.toLocaleTimeString();
}

function swefsLoadData(timeStamp) {
	//Keep a copy of mapLayers to use for reconstruction, and delete the existing one
	//because the layers are updated async, and the itterator i changes
	var mapLayersTemp = [];
	$.extend(true, mapLayersTemp, mapLayers);
	
	//Delete old layers
	for (var i=0; i<mapLayersTemp.length; i++) {
		if ( (mapLayersTemp[i].isTemp == false) && (mapLayersTemp[i].query != "") && (mapLayersTemp[i].name != 'userInfo')) {		
			//Delete the old layer
			var tableRef = document.getElementById('layerTable').getElementsByTagName('tbody')[0];
			var pos=0;
		    for (var j=0; j<mapLayers.length; j++) {
		        if (mapLayers[j].name == mapLayersTemp[i].name) {
		            pos = j;
		        }
		    }
		    deleteLayer(tableRef, pos, false, mapLayersTemp[i].name);
		}
	}
	
	//Update layers
	for (var i=0; i<mapLayersTemp.length; i++) {
		if ( (mapLayersTemp[i].isTemp == false) && (mapLayersTemp[i].query != "") && (mapLayersTemp[i].name != 'userInfo')) {
			//Update the layer
			var endpointURI = mapLayersTemp[i].endpoint;
			endpointURI = endpointURI.replace("http://", "");
			var parts = endpointURI.split('/');
			var host = parts[0];
			var endpointName = "";
			for (var j=1; j<parts.length-1; j++) {
				endpointName += parts[j] + '@@@';
			}
			endpointName += parts[parts.length-1];
			
			var portValue = parts[0].split(':');
			var port = 80;		
			if (portValue.length == 2) {
				port = Number(portValue[1]);
			}
			
			var queryText = refreshQuery(mapLayersTemp[i].query, timeStamp);
			var name = mapLayersTemp[i].name;
			
			//Get results from server and create the layer
			document.getElementById('alertMsgServerWait').style.display = 'block';
			showSpinner(colorSpin);					
			//getQueryResults(parts[0], parts[1], parts[2], queryText, name, port);
			getQueryResults(host, endpointName, queryText.toString(), name, port, false);
		}
	}	
}

//refreshQuery('?time = "2012-07-18T11:30:00"^^<http://www.w3.org/2001/XMLSchema#dateTime>', 'step')
function refreshQuery(aQuery, timeStamp) {
	aQuery = aQuery.replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/gi, function myFunction(str){
		var newDate = new Date(str);
		if (timeStamp == 'forward') {
			newDate.setMinutes(newDate.getMinutes() + Math.floor(step/60), newDate.getSeconds() + step % 60, 0);
		}
		else {
			newDate.setMinutes(newDate.getMinutes() - Math.floor(step/60), newDate.getSeconds() - step % 60, 0);
		}
		var parseDate = newDate.toISOString().split('\.');
		return parseDate[0];
	});
	
	return aQuery;
}
