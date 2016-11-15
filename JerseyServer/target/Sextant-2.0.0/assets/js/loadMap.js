/**
 * Add a map from a given mapID
 */
function addMapFromId() {
	var id = document.getElementById('mapId').value;
	var endpoint = document.getElementById('mapIdEndpoint').value;
	var portValue = document.getElementById('mapIdEndpointPort').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}

	//Parse the server response and create layers
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	if (endpoint === "") {
		endpoint = "registry";
		getMapInfo(id, "none", "none", "none", 80);
	}
	else {
		endpoint = endpoint.replace("http://", "");
		var parts = endpoint.split('/');
		
		getMapInfo(id, parts[0], parts[1], parts[2], port);
	}
	
	//Map metadata
	document.getElementById('infoMapTitle').innerHTML = '';
	document.getElementById('infoMapId').innerHTML = id;
	document.getElementById('infoEndpoint').innerHTML = endpoint;
	document.getElementById('infoDateCreate').innerHTML = '';
	document.getElementById('infoDateModify').innerHTML = '';
	document.getElementById('infoCreator').innerHTML = '';
	document.getElementById('infoLicense').innerHTML = '';
	document.getElementById('infoTheme').innerHTML = '';
	
	//Reset form
	document.getElementById('hiddenLoadMapID').reset();
}

var globalId = 0;
function getMapInfo(mapId, host, endpoint, qType, port) {
	globalId = mapId;
	
	//Get layers' info
    $.ajax({
        type: 'GET',
        url: rootURL + '/mapLayersInfo/' + mapId + "/" + host + "/" + endpoint + "/" + qType + "/" + port,
        dataType: "xml",
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/xml; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseResults,
        error: printError
    });
    
    //Get map info
    $.ajax({
        type: 'GET',
        url: rootURL + '/mapInformation/' + mapId + "/" + host + "/" + endpoint + "/" + qType + "/" + port,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/xml; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseMapInformation,
        error: printError
    });
    
    //Set URL mapid parameters without refreshing the page
    var state = {
    		  'thisIsOnPopState': true
    };
	if (host == 'none') {
		history.pushState(state, 'Sextant', '/' + arrHost[1] + '/' + '?mapid=' + mapId);
	}
	else {
		history.pushState(state, 'Sextant', '/' + arrHost[1] + '/' + '?mapid=' + mapId +
				'&host=' + host + '&endpoint=' + endpoint);
	}
}

function parseMapInformation(results, status, jqXHR) {
	var userDataUrl, tempFeatures;
	var parseMapInfo = results.split('\$');
	
	if (parseMapInfo.length > 7) {
		document.getElementById('infoMapTitle').innerHTML = parseMapInfo[0];
		document.getElementById('infoDateCreate').innerHTML = parseMapInfo[4];
		document.getElementById('infoDateModify').innerHTML = parseMapInfo[5];
		document.getElementById('infoCreator').innerHTML = parseMapInfo[1];
		document.getElementById('infoLicense').innerHTML = parseMapInfo[2];
		document.getElementById('infoTheme').innerHTML = parseMapInfo[3];
		document.getElementById('infoExtent').value = parseMapInfo[6];
		
		//userDataUrl = parseMapInfo[7].concat(globalId).concat('userInfo.kml');
	}
	
	//Read the features from the userInfo.kml file and add them on the userLayer
	/*
	var tempLayer = new OpenLayers.Layer.Vector('tempLayer', {
        projection: map.displayProjection,
        rendererOptions: { zIndexing: true },
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: new OpenLayers.Protocol.HTTP({
                                               url: userDataUrl,
                                               format: new OpenLayers.Format.KML({
                                                                                 extractStyles: true,
                                                                                 extractAttributes: true,
                                                                                 maxDepth: 2
                                                                                 })
                                               })
        
    });
	
	map.addLayer(tempLayer);
	
	tempLayer.events.register('loadend', tempLayer, function (evt) {
		tempLayer.setVisibility(false);
		tempFeatures = tempLayer.features;
		loadMapTrigger = 1;
		
		for (var i=0; i<tempFeatures.length; i++) {
			var aFeature = tempFeatures[i];
			
			if (typeof tempFeatures[i].attributes.iconURL != 'undefined') {
				//Point feature
				var iconUrl = tempFeatures[i].attributes.iconURL.value;
				var myStyle = {
			            pointRadius: 20,
			            externalGraphic: iconUrl
			    };  
				aFeature.style = myStyle;
			}
			
			aFeature.attributes.id = featureID;
			featureID++ ;
		    userFeatures.push(aFeature);
		    
		    userLayer.addFeatures([aFeature]);
		}
		userLayer.redraw();
		
		loadMapTrigger = 0;
		map.removeLayer(tempLayer, false);
     });
	*/
}

function parseResults(results, status, jqXHR) {
	var num = 0;

  	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    //console.log(results);
    //Parse layers and charts
	$('mapInfo', results).each(function(i) {
		var name = $(this).find('name').text();
		
		if (name != 'chart') {
			//Parse layer
			
			var uri = $(this).find('kmlFile').text();
			var parseURI = uri.replace("http://", "").split('/');
			var parseOrigin = parseURI[0].split(':');
			
			//If we have a name and the kmlFile we can create the layer
			if (name && uri) {
				num ++;
			}		
			
			var layerType = $(this).find('type').text();
			var parseType = layerType.split(',');
			
			var isTemp = $(this).find('isTemporal').text();
			if (isTemp === 'false') {
				isTemp = false;
			}
			var query = $(this).find('producedByQuery').text();
			var endpoint = $(this).find('endpointUri').text();
			
			var fillColor = $(this).find('polystyleColor').text();
			var strokeColor = $(this).find('polylineColor').text();
			
			//Convert kmlColors to html
			if (parseType[0] != 'wms') {
				fillColor = convertColor(fillColor);
			}		
			strokeColor = convertColor(strokeColor);
						
			var iconUrl = $(this).find('iconUri').text();
			var iconSize = $(this).find('iconScale').text();	
			
			var imageBox = $(this).find('imageBox').text();
						
			//Create style and set default values for emplty elements	
			var imageStyle = new ol.style.Circle({
	    	    fill: new ol.style.Fill({
		    	    color: ( (fillColor != "") ? hex2rgb(fillColor, 0.4) : [255, 153, 0, 0.4])
		    	}),
		    	radius: 5,
		    	stroke: new ol.style.Stroke({
		    	    color: ( (strokeColor != "") ? strokeColor : [255, 153, 0, 1]),
		    	    width: 1
		    	})
		    });
		    
		    if (iconUrl != '') {
		    	//Use icon for image style
		    	imageStyle = new ol.style.Icon({
		            anchor: [0.5, 0.5],
		            offset: [0, 0],
		            opacity: 1,
		            scale: Number(iconSize),
		            src: iconUrl
		        });
		    } 
		    var myStyles = new ol.style.Style({
		    	stroke: new ol.style.Stroke({
		            color: ( (strokeColor != "") ? strokeColor : [255, 153, 0, 1]),
		            width: 1
		        }),
		        fill: new ol.style.Fill({
		            color: ( (fillColor != "") ? hex2rgb(fillColor, 0.4) : [255, 153, 0, 0.4])
		        }),
		        image: imageStyle
		    });
		    
		    if (imageBox === null || imageBox === "") {	    	
		    	//load kml, gml, json or wms file
		    	var type = null;
		    	if (layerType == "") {
		    		//Old maps. The layer type is not available
		    		type = uri.substring(uri.lastIndexOf(".")+1, uri.length);
		    	}
		    	else {
		    		//New maps that have the layer type info
		    		type = layerType;
		    	}
		    	
		    	if (type == 'kml') {
		    		if (parseOrigin[0] == server) {
		    			//Same origin uri
		    			addLayer(uri, name, isTemp, "kml", query, endpoint, globalId, null, null, myStyles, null, null);
		    		}
		    		else {
		    			//Different origin uri, we must download file to server
		    			addLayer(uri, name, isTemp, "kml", query, endpoint, globalId, null, uri, myStyles, null, null);
		    		}
		    	} 
		    	else if (type == 'gml' || type == 'xml'){
		    		if (parseOrigin[0] == server) {
		    			//Same origin uri
		    			addLayer(uri, name, isTemp, "gml", query, endpoint, globalId, null, null, myStyles, null, null);
		    		}
		    		else {
		    			//Different origin uri, we must download file to server
		    			addLayer(uri, name, isTemp, "gml", query, endpoint, globalId, null, uri, myStyles, null, null);
		    		}
		    	}
		    	else if (type == 'geojson' || type == 'topojson') {
		    		if (parseOrigin[0] == server) {
		    			//Same origin uri
		    			addLayer(uri, name, isTemp, type, query, endpoint, globalId, null, null, myStyles, null, null);
		    		}
		    		else {
		    			//Different origin uri, we must download file to server
		    			addLayer(uri, name, isTemp, type, query, endpoint, globalId, null, uri, myStyles, null, null);
		    		}
		    	}
		    	else {
		    		var parseWMS_URI = uri.split('#');			    		
	    			addLayer(parseWMS_URI[0], name, isTemp, "wms", query, endpoint, globalId, null, [parseWMS_URI[1], parseType[1], parseType[2], parseType[3]], fillColor, null, null);
		    	}
		    	
		    	for (var i=0; i<mapLayers.length; i++) {
		    		if (mapLayers[i].name === name && mapLayers[i].type.substring(0, 3) != "wms") {
		    			mapLayers[i].fillColor = fillColor;
		    			mapLayers[i].strokeColor = strokeColor;
		    			mapLayers[i].icon = iconUrl;
		    			mapLayers[i].iconSize = iconSize;
		    			
		    			break;
		    		}
		    	}
				
		    }
		    else {	    	
		    	//Layer is GeoTiff. Parse the bbox and create the layer
		    	var arr = imageBox.split(',');
		    	var w = Number(arr[0].substring(2, arr[0].length));
		    	var h = Number(arr[1].substring(2, arr[1].length));
		    	var size = [w, h];
		    	var box = [Number(arr[2]), Number(arr[3]), Number(arr[4]), Number(arr[5])];
		    	
		    	if (parseOrigin[0] == server) {
	    			//Same origin uri
		    		addLayer(uri, name, isTemp, 'geotiff', query, endpoint, globalId, null, null, null, box, size);
		    	}
		    	else {
		    		//Different origin uri, we must downloda file to server
		    		addLayer(uri, name, isTemp, 'geotiff', query, endpoint, globalId, null, uri, null, box, size);
		    	}
		    }
		}
		else {
			//Parse chart
			var query = $(this).find('producedByQuery').text();
			var endpoint = $(this).find('endpointUri').text();
			var chartType = $(this).find('chartType').text();
			var chartResults = $(this).find('chartResults').text();
			var measures = $(this).find('measures').text().replace("[", "").replace("]", "");
			var freeDims = $(this).find('freeDims').text().replace("[", "").replace("]", "");
			var instances = $(this).find('instances').text().replace("[", "").replace("]", "");
			
			var parseHost = endpoint.replace("http://", "").split('/');
			var parsePort = parseHost[0].split(':');
			var myPort = 80;
			if (parsePort.length > 1) {
				myPort = Number(parsePort[1]);
			}
			
			var myMeasures = measures.split(',');
			var myInstances = instances.split(',');
			var myFreeDims = stringToDimArray(freeDims);
			
			var myChart = new MyChart(endpoint, myPort, null, myFreeDims, myInstances, myMeasures, query, chartResults, chartType, id);
			charts.push(myChart);
			id ++;
			
			/**
			 * Save all information for each chart in a preRenderChart object.
			 * Highest order free dimension is rendered as line chart to be more clear,
			 * if we have more than one free dimensions.
			 */
			if (myChart.freeDims.length > 1) {
				var preRendChart = new PreRenderChart(chartId, 'Line chart', myChart, myChart.freeDims[myChart.freeDims.length-1], myChart.instance, myChart.id);
				preRenderedCharts.push(preRendChart);
				chartId++;
			}
			else {
				var preRendChart = new PreRenderChart(chartId, myChart.type, myChart, myChart.freeDims[myChart.freeDims.length-1], myChart.instance, myChart.id);
				preRenderedCharts.push(preRendChart);
				chartId++;
			}
			for (var i=myChart.freeDims.length-2; i>=0; i--) {
				var preRendChart = new PreRenderChart(chartId, myChart.type, myChart, myChart.freeDims[i], myChart.instance, myChart.id);
				preRenderedCharts.push(preRendChart);
				chartId++;
			}
			itter = chartId-1;
			
			//Update number of charts in map information
			document.getElementById('infoNumOfCharts').innerHTML = preRenderedCharts.length;
			
			//Show modal with charts
			$('#modalChartInfo').modal('show');
			$('#modalChartInfo').on('shown.bs.modal', function (e) {
				//Clear modal body from previous chart/legend elements
				clearChartModal();
				
				//Disable next/previous buttons if needed
				disableButtons();
						
				//Render chart in modal.
				renderChart(preRenderedCharts[itter], itter);
			});
			$('#modalChartInfo').on('hidden.bs.modal', function (e) {
				clearChartModal();
			});
			
		}
	});	
	
	$('#modalChartInfo').modal('hide');
}

function loadMapFromURL() {
	var removeHash = window.location.href.split('#');
	var urlParser = removeHash[0].split('?');
	if (urlParser.length > 1) {
		//Parse the server response and create layers
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
		
		var urlQueryString = urlParser[1].split('&');
		if (urlQueryString.length > 1) {
			//Endpoint map
			var myMapId = urlQueryString[0].split('=');
			var myMapHostParse = urlQueryString[1].split('=');
			var myMapHost = myMapHostParse[1].split(':');
			var myMapEndpoint = urlQueryString[2].split('=');
			
			//Map metadata
			document.getElementById('infoMapId').innerHTML = myMapId[1];
			document.getElementById('infoEndpoint').innerHTML = myMapHostParse[1] + '/' + myMapEndpoint[1] + "/Query";
			document.getElementById('infoDateCreate').innerHTML = '';
			document.getElementById('infoDateModify').innerHTML = '';
			document.getElementById('infoCreator').innerHTML = '';
			document.getElementById('infoLicense').innerHTML = '';
			document.getElementById('infoTheme').innerHTML = '';
			
			getMapInfo(myMapId[1], myMapHost[0], myMapEndpoint[1], "Query", Number(myMapHost[1]));
		}
		else {
			//Registry map
			var myMapId = urlQueryString[0].split('=');
			
			//Map metadata
			document.getElementById('infoMapId').innerHTML = myMapId[1];
			document.getElementById('infoEndpoint').innerHTML = 'registry';
			document.getElementById('infoDateCreate').innerHTML = '';
			document.getElementById('infoDateModify').innerHTML = '';
			document.getElementById('infoCreator').innerHTML = '';
			document.getElementById('infoLicense').innerHTML = '';
			document.getElementById('infoTheme').innerHTML = '';
			
			getMapInfo(myMapId[1], "none", "none", "none", 80);
		}
		
	}
}
