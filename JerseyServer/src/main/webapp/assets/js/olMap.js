/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (C) 2012 Pyravlos Team
 *
 * http://www.sextant.di.uoa.gr/
 */

/**
 *  OpenLayers map
 */
var map;

/**
 * Shared control among layers for selecting features
 */
var control, mouseControl, infoWMS = [];


/**
 * Table with the info of all layers
 */
var mapLayers = [];


/**
 * Variable that controls the fadeout time of messages in tha application (in msecs)
 */
var fadeTime = 3000;
var fadeTimeFast = 1000;

/**
 * Ajax calls timeout set to 5 min
 */
var ajaxTimeout = 300000;
ajaxTimeout = 0;

/**
 * Disable or enable sextant features. Set to true to disable all OK buttons,
 * so that users cannot alter existing layers in a server distribution.
 */
disableAll = false;

/**
 * Disable or enable sextant save map feature. Set to true to disable save map functionality,
 * so that users cannot alter existing maps in the registry.
 */
disableSaveMap = false;

/**
 * URL of the mobile server
 */
var myHost = window.location.href;

//Check for HTTPS
if (myHost.startsWith("https")) {
	var arrHost = myHost.replace("https://", "").split("/");
	var rootURL = 'https://' + arrHost[0] + '/' + arrHost[1] +'/rest/service';	
}
else {
	var arrHost = myHost.replace("http://", "").split("/");
	var rootURL = 'http://' + arrHost[0] + '/' + arrHost[1] +'/rest/service';
}

var parseRootURL = arrHost[0].split(':');
var server = parseRootURL[0];

var colorSpin = '#E8EFF5';
var colorSpinDescribe = '#7E7E7E';

/**
 * The two base layers for the map
 */
var bingMapsKey = null;
var bingMap = null;
var bingAerialLabels = null;
var bingRoads = null;

var baseOSM = new ol.layer.Tile({
    preload: Infinity,
    source: new ol.source.OSM()
});


/**
 * Default style for vector layers
 */
var defaultVectorStyle = new ol.style.Style({
	stroke: new ol.style.Stroke({
        color: [255, 153, 0, 1],
        width: 1
    }),
    fill: new ol.style.Fill({
        color: [255, 153, 0, 0.4]
    }),/*
    image: new ol.style.Icon({
    	src: "./assets/images/map-pin-md.png",
    	scale: 0.1,
    	crossOrigin: 'anonymous'
    })*/
	image: new ol.style.Circle({
	    fill: new ol.style.Fill({
	      color: [255, 153, 0, 0.4]
	    }),
	    radius: 5,
	    stroke: new ol.style.Stroke({
	      color: [255, 153, 0, 1],
	      width: 1
	    })
	})
});

/*
 * var iconStyle = new ol.style.Style({
        image: new ol.style.Icon(({
          anchor: [0.5, 46],
          anchorXUnits: 'fraction',
          anchorYUnits: 'pixels',
          src: 'data/icon.png'
        }))
      });
 */

var defaultTwitterStyle = new ol.style.Style({
	stroke: new ol.style.Stroke({
        color: [255, 153, 0, 1],
        width: 1
    }),
    fill: new ol.style.Fill({
        color: [255, 153, 0, 0.4]
    }),
    image: new ol.style.Icon({
    	src: "./assets/images/Twitterbird.png",
    	scale: 0.1,
    	crossOrigin: 'anonymous'
    })
});

/**
 * Style features when we click them on the map
 */
var clickFeatureStyle = new ol.style.Style({
	stroke: new ol.style.Stroke({
        color: [0, 0, 255, 1],
        width: 1
    }),
    fill: new ol.style.Fill({
        color: [0, 0, 255, 0.4]
    }),
    image: new ol.style.Circle({
	    fill: new ol.style.Fill({
	      color: [0, 0, 255, 0.4]
	    }),
	    radius: 5,
	    stroke: new ol.style.Stroke({
	      color: [0, 0, 255, 1],
	      width: 1
	    })
	})
});

var featureOverlay = new ol.layer.Image({
	title: 'overlayStyle',
    source: new ol.source.ImageVector({
      source: new ol.source.Vector(),
      style: clickFeatureStyle
    })
});

/**
 * OL interaction when we select a feature on the map
 */
var mapSelectInterraction = new ol.interaction.Select({style: clickFeatureStyle});

/**
 * Popups
 */
var container, content, closer, overlay;

/**
 * Map center on load
 */
var center = ol.proj.transform([23.631, 38.091], 'EPSG:4326', 'EPSG:3857');

function getBingKey() {
	$.ajax({
        type: 'GET',
        url: rootURL + '/bingKey',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: initMap,
        error: printError
    });
}

function initMap(results, status, jqXHR) {
	console.log(results);
	if (results == 'none' || results == '') {
		bingMapsKey = null;
		document.getElementById('coordinates').style.color = '#A30052';	
	}
	else {
		bingMapsKey = results.toString();
		bingMap = new ol.layer.Tile({
		    preload: Infinity,
		    source: new ol.source.BingMaps({
		      key: bingMapsKey,
		      imagerySet: 'Aerial',
		    })
		});
		
		bingAerialLabels = new ol.layer.Tile({
		    preload: Infinity,
		    source: new ol.source.BingMaps({
		      key: bingMapsKey,
		      imagerySet: 'AerialWithLabels',
		    })
		});
		
		bingRoads = new ol.layer.Tile({
		    preload: Infinity,
		    source: new ol.source.BingMaps({
		      key: bingMapsKey,
		      imagerySet: 'Road',
		    })
		});
	}
	
	initialize();
	loadMapFromURL();
}

/**
 * Function for initializing the OpenLayers map
 * (called on Window load)
 */
function initialize() {
	loadBingsSearchLoadMap();
	loadBingsSearchFilterLayer();
	loadBingsSearchExtentFilter();
	
	if (!map){
		document.getElementById('tmContainer').style.right = '-3000px';
		document.getElementById('statsContainer').style.right = '-3000px';
		
		mouseControl = new ol.control.MousePosition({
	        coordinateFormat: ol.coordinate.createStringXY(4),
	        projection: 'EPSG:4326',
	        target: document.getElementById('coordinates'),
	        undefinedHTML: '&nbsp;'
	    });
		
		var scaleLineControl = new ol.control.ScaleLine();
		
		//Create popups on map click
		container = document.getElementById('popup');
	    content = document.getElementById('popupTable');
	    closer = document.getElementById('popup-closer');
		overlay = new ol.Overlay(({
	        element: container,
	        autoPan: true,
	        autoPanAnimation: {
	          duration: 250
	        }
	    }));
		closer.onclick = function() {
	        overlay.setPosition(undefined);
	        closer.blur();
	        //mapSelectInterraction.getFeatures().clear();
	        clearOverlayFeatures();
	        return false;
	    };
	    
	    //Drag an drop interaction for vector layers	   
	    var dragAndDropInteraction = new ol.interaction.DragAndDrop({
	        formatConstructors: [
	          ol.format.KML,
	          ol.format.GeoJSON,
	          ol.format.TopoJSON
	        ]
	    });
	    
		var baseLayers = [];
		if (bingMapsKey != null) {
			baseLayers.push(bingMap);
		}
		else {
			baseLayers.push(baseOSM);
		}
		
		map = new ol.Map({
	        layers: baseLayers,
	        target: 'map_canvas',
	        renderer: 'webgl',
	        overlays: [overlay],
	        view: new ol.View({
	          projection: 'EPSG:3857',
	          center: center,
	          zoom: 6
	        }),
	        interactions: ol.interaction.defaults().extend([dragAndDropInteraction]),
	        controls: ol.control.defaults().extend([mouseControl, scaleLineControl])
	    });
		map.addLayer(featureOverlay);
		featureOverlay.setZIndex(5);
		
		map.on('singleclick', function(evt) {
			//Clear selected features
			clearOverlayFeatures();			
			content.innerHTML = '';
						
	        var coordinate = evt.coordinate;
	        var pixel = evt.pixel;
	        var features = [];
	        
	        map.forEachFeatureAtPixel(pixel, function(feature, layer) {
	          features.push(feature);
	        });
	        
	        //For WMS layers: features.length = 0
	        if (features.length < 1) {	
	        	clearPopup();
	        	
	        	
	        	//Check for WMS layers
	        	var allWMS = [];
	        	for (var i=0; i<mapLayers.length; i++) {
		    		if (mapLayers[i].type.substring(0, 3) == "wms") {
		    			allWMS.push(mapLayers[i].name);
		    		}
		    	}
	        	
	        	
	        	// Get the WMS layer that is on-top in the zIndex. This is either
	        	// the layer that has the greater value in the zIndex,
	        	// or the last layer in the mapLayers table in case they all
	        	// have the same zIndex value.
	        	var topLayer = null;
	        	var topZIndex = -1;
	        	for (var i=0; i<allWMS.length; i++) {
	        		map.getLayers().forEach(function(layer) {
	                	if (layer.get('title') == allWMS[i]) {
	                		if (layer.getZIndex() >= topZIndex) {
	                			topZIndex = layer.getZIndex();
	                			topLayer = layer.get('title');
	                		}
	                	}
	        		});
	        	}
	        	
	        	//Create WMS popup for the top WMS layer
	        	if (topLayer != null) {
					var viewResolution = map.getView().getResolution();

	        		map.getLayers().forEach(function(layer) {
	                	if (layer.get('title') == topLayer) {
	                		var url = layer.getSource().getGetFeatureInfoUrl(
	                				coordinate, viewResolution, 'EPSG:3857',
	    	        	            {'INFO_FORMAT': 'text/html'});
	                		
	    	        	    if (url) {
	    	        	    	$.ajax({
		                	        type: 'GET',
		                	        url: url,              
		                	        timeout: ajaxTimeout,
		                	        success: parseWMSPopupResults,
		                	        error: printError,
		                	        coordinates: coordinate,
		                	        topLayer: topLayer
		                	    });	    	        	    	
	    	        	    }
	                	}
	        		});
	        	}
	        	
	        	return;
	        }
	        
	        var overlayFeature = features[0].clone();
	        featureOverlay.getSource().getSource().addFeature(overlayFeature);
	        
	        for (var key in features[0].getProperties()) {
	    		if (key != 'description' && key != 'geometry' && key != 'name' && key != 'objectType') {
	    			content.innerHTML += '<tr><td><b>'+key+'</b></td><td>'+features[0].getProperties()[key]+'</td></tr>';
	    		}
	    		if (key == 'name') {
	    			document.getElementById('popupTitle').innerHTML = features[0].getProperties()[key];
	    		}
	    		
	    		if (key == 'objectType' && features[0].getProperties()[key] == 'twitt') {
	    			document.getElementById('popup-content').innerHTML = "";
	    			var element = document.createElement("div");
	    			element.id='popupTwitter'+features[0].getProperties()['description'];
	    			document.getElementById('popup-content').appendChild(element);
	    			
	    			twttr.widgets.createTweet(
	    					features[0].getProperties()['description'],
	    		    		document.getElementById('popupTwitter'+features[0].getProperties()['description'])
	    		    );
	    		}
	    	}
	        	        	        
	        overlay.setPosition(coordinate);
	        
	    });
		
		
		dragAndDropInteraction.on('addfeatures', function(event) {
			//console.log(event);
			var layerName = event.file.name.substring(0, event.file.name.lastIndexOf('.'));
			var layerType = event.file.name.substring(event.file.name.lastIndexOf('.')+1, event.file.name.length);
			
			//Check if the layer name exists
			for (var i=0; i<mapLayers.length; i++) {
	    		if (mapLayers[i].name === layerName) {   	                            		
	    			//Print error and return
	    			document.getElementById('alertMsgFailNameExists').style.display = 'block';
	    	        setTimeout(function() {$('#alertMsgFailNameExists').fadeOut('slow');}, fadeTime);
	    	        return ;
	    		}
	    	}
			
			//json file type = topojson
			//geojson file type must be used for geojson files
			if (layerType == 'json') {
				layerType = 'geojson';
			}
			layerType = 'geojson';
			
			var url = 'dragAndDrop';
		    var tl = new Layer(layerName, url, false, layerType, '', '', '#ff9900', '#ff9900', './assets/images/map-pin-md.png', 20, 0, '', '');
            mapLayers.push(tl);
            //Add a row for this layer in the Manage Layers view
            addTableRow(layerName, layerType);  
            //Show renewed last modification date and number of layers
            document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;
			
			var vectorSource = new ol.source.Vector({
				features: event.features
		    });
			var layer = new ol.layer.Image({
		    	title: layerName,
		    	source: new ol.source.ImageVector({
		    		source: vectorSource,
		            style: defaultVectorStyle
		        })
		    });
		    map.addLayer(layer);
		    
		    updateLayerStats(layerName);
			
			for (var i=0; i<mapLayers.length; i++) {
	    		if (mapLayers[i].name === layerName) {   	                            		
	        		mapLayers[i].features = getLayerFeatureNames(layer);
	            	break;
	    		}
	    	}
			
			map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());  
			
			//Create a geojson file using the vector source
			var myFeatures = vectorSource.getFeatures();			
			var cloneArray = [];
			for (var i=0; i< myFeatures.length; i++) {
				var cloneFeature = myFeatures[i].clone();
				var geom4326 = cloneFeature.getGeometry().transform('EPSG:3857', 'EPSG:4326');
				cloneFeature.setGeometry(geom4326);
				cloneArray.push(cloneFeature);
			}
			
			var myFile = '';
			switch(layerType) {
				case 'kml':
					//FIX: writeFeatures for KML format has bugs. Adds ,0 at the end of the points and doesnt parse time
					myFile = new ol.format.KML().writeFeatures(cloneArray);	
					console.log(myFile);
					break;
				case 'geojson':
					myFile = new ol.format.GeoJSON().writeFeatures(cloneArray);			
					break;
			}
			
			if (myFile != '') {
				$.ajax({
			        type: 'POST',
			        url: rootURL + '/createFile/' + layerName + "/" + layerType,
			        data: myFile,
			        dataType: 'text',
			        headers: {
			        	//'Accept-Charset' : 'utf-8',
			        	'Content-Type'   : 'text/plain; charset=utf-8',
			        },
			        timeout: ajaxTimeout,
			        success: createFileFromSource,
			        error: printError,
			        layerName: layerName
			    });
			}
		                
	    });
	    		
		initTimeline();	
	}
	
	
	
	//Parse host to determine if the client is bind to a server or stand-alone
	var getServer = window.location.href.split('/');
	if (getServer[0] == 'http:') {
		document.getElementById('serverSelection').innerHTML = null;
	}
	
	//Set parameters for calendars
    $('.datetimepicker').datetimepicker({
        format: 'YYYY-MM-DD',
        ignoreReadonly: true
    });
    
    $('.wmsDate').datetimepicker({
        format: 'YYYY-MM-DDTHH:mm:ssZ',
        ignoreReadonly: true
    });
 
    disableFeatures(disableAll, disableSaveMap);
    
    //Initialize AlaSQL
    alasql('CREATE DATABASE gadm28; USE gadm28;'); 
    alasql('CREATE TABLE geodata; SELECT * INTO geodata FROM CSV("./assets/resources/gadm28.csv", {headers:true, separator:";"})');
    
    document.getElementsByClassName('timeline-band-0')[0].style.backgroundColor = 'rgba(255,255,255,0)';
    document.getElementsByClassName('timeline-band-1')[0].style.backgroundColor = 'rgba(255,255,255,0)';
    
    document.getElementById('sextantPanels').addEventListener(
		    'scroll',
		    function() {
		        var scrollTop = document.getElementById('sextantPanels').scrollTop;
		        var scrollHeight = document.getElementById('sextantPanels').scrollHeight; 
		        var offsetHeight = document.getElementById('sextantPanels').offsetHeight;
		        var contentHeight = scrollHeight - offsetHeight;
		        
		        if (scrollTop > 300) {
		        	document.getElementById('scrollTopPanel').style.display = 'block';		      
		        	
		        }
		        else {
		        	document.getElementById('scrollTopPanel').style.display = 'none';
		        }
		        
		        if ((contentHeight*0.9) <= scrollTop)
		        {		        		      	
		        	var keys = document.getElementById('twitterSearchKeys').value;
		        	if (keys != ''){
		        		showSpinnerTwitter(colorSpin);
		        		$.ajax({
			                type: 'GET',
			                url: rootURL + '/findTwittsRest?keys='+encodeURIComponent(keys)+'&sinceId='+sinceId+'&maxId='+maxId+'&update=false',
			                headers: {
			                	//'Accept-Charset' : 'utf-8',
			                	'Content-Type'   : 'text/plain; charset=utf-8',
			                },
			                timeout: 0,
			                success: parseTwitterSearchResults,
			                error: printError
			            });
		        	}
		        }
		    },
		    false
	);
    
}

function clearOverlayFeatures() {
	featureOverlay.getSource().getSource().clear();
}

function createFileFromSource(results, status, jqXHR) {
	var name = this.layerName;
	for (var i=0; i<mapLayers.length; i++) {
		if (mapLayers[i].name === name) {   	                            		
    		mapLayers[i].uri = results.toString();
        	break;
		}
	}
	document.getElementById('downloadLayerButton'+name).disabled = false;
}

/**
 * Create the layer on the map using OpenLayers 3
 */
function addLayer(url, name, isTemp, type, text, endpoint, mapId, localFile, path, style, bbox, imageSize) {
	if (url == 'null') {
		url = null;
	}
		
	//Hide server messages
	hideSpinner();
	document.getElementById('alertMsgServerDownload').style.display = 'none';
    
	if (url && name){
    	for (var i=0; i<mapLayers.length; i++) {
    		if (mapLayers[i].name === name) {
    			//Print error and return
    			document.getElementById('alertMsgFailNameExists').style.display = 'block';
    	        setTimeout(function() {$('#alertMsgFailNameExists').fadeOut('slow');}, fadeTime);
    	        return ;
    		}
    	}  			
        
        //KML
    	if (type === "kml") {

    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#ff9900', '#ff9900', '', '', mapId, '', '');
            mapLayers.push(tl);
            
            if(localFile && path) {
        	    //Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
            	document.getElementById('alertMsgServerUpload').style.display = 'block';
            	uploadLocalFileToServer(localFile, name, layerName, type, function(results) {
            		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
            		mapLayers[mapLayers.length-1].uri = results;
                	addKmlLayer(name, results, style, isTemp);
            	});
            }
            else if (path) {
            	//Upload file to server and create the layer
        		document.getElementById('alertMsgServerDownload').style.display = 'block';
	        	downloadFile(url, function(result) {
	        		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
	        		addKmlLayer(name, result, style, isTemp);
	        	});
            }
            else {
            	//The layer is produced by query, or is local and is loaded from existing map, so it's file exists
            	addKmlLayer(name, url, style, isTemp);
            }
	    	
	    	//Reset form data
	        document.getElementById('hiddenLoadKml').reset();
    	}
    	
    	/*
    	//GML
    	if (type === "gml") {
    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#FFB414', '#FFB414', './assets/images/map-pin-md.png', 20, mapId, '', '');
            mapLayers.push(tl);
            
            if(localFile && path) {
            	//Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
            	document.getElementById('alertMsgServerUpload').style.display = 'block';
            	uploadLocalFileToServer(localFile, name, layerName, type, function(results) {
            		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
            		mapLayers[mapLayers.length-1].uri = results;
                	addGmlLayer(name, results, style, isTemp);
            	});
            }
            else if (path){
            	//Upload file to server and create the layer
        		document.getElementById('alertMsgServerDownload').style.display = 'block';
	        	downloadFile(url, function(result) {
	        		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
	        		addGmlLayer(name, result, style, isTemp);
	        	});
            } 
            else {
            	//The layer is produced by query, or is local and is loaded from existing map, so it's file exists
            	addGmlLayer(name, url, style, isTemp);
            }
	    	
	    	//Reset form data
	        document.getElementById('hiddenLoadGml').reset();
    	} */
    	
    	//JSON
    	if (type === "geojson" || type === "topojson") {

    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#ff9900', '#ff9900', '', '', mapId, '', '');
            mapLayers.push(tl);
            
            if(localFile && path) {
            	//Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
            	document.getElementById('alertMsgServerUpload').style.display = 'block';
            	uploadLocalFileToServer(localFile, name, layerName, type, function(results) {
            		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
            		mapLayers[mapLayers.length-1].uri = results;
                	addJSONLayer(name, results, style, isTemp, type);
            	});
            }
            else if (path){
            	//Upload file to server and create the layer
        		document.getElementById('alertMsgServerDownload').style.display = 'block';
	        	downloadFile(url, function(result) {
	        		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
	        		addJSONLayer(name, result, style, isTemp, type);
	        	});
            } 
            else {
            	//The layer is produced by query, or is local and is loaded from existing map, so it's file exists
            	addJSONLayer(name, url, style, isTemp, type);
            }
	    	
	    	//Reset form data
	        document.getElementById('hiddenLoadGml').reset();
    	}  
    	
    	//GeoTiff
    	if (type === 'geotiff'){
        	var tl = new Layer(name, url, isTemp, type, text, endpoint, '', '', '', '', mapId, imageSize.toString().concat(",").concat(bbox.toString()), '');
        	mapLayers.push(tl);
        	
        	if(localFile && path) {
        		//Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
            	document.getElementById('alertMsgServerUpload').style.display = 'block';
            	uploadLocalFileToServer(localFile, name, layerName, type, function(results) {
            		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
            		mapLayers[mapLayers.length-1].uri = results;
            		addGeoTiffLayer(name, results, bbox, imageSize);
            	});
            }
            else if (path){
            	//Upload file to server and create the layer
        		document.getElementById('alertMsgServerDownload').style.display = 'block';
	        	downloadFile(url, function(result) {
	        		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
	        		addGeoTiffLayer(name, result, bbox, imageSize);
	        	});
            }  
            else {
            	//The layer is produced by query, or is local and is loaded from existing map, so it's file exists
            	addGeoTiffLayer(name, url, bbox, imageSize);
            }
    		
    		//Reset form data
            document.getElementById('hiddenLoadGeoTiff').reset();
    	}
    	
    	//WMS
    	if (type === 'wms'){
    		var wmsTypeInfo = [type, path[1], path[2], path[3]];
        	var tl = new Layer(name, url+'#'+path[0], isTemp, wmsTypeInfo.toString(), text, endpoint, style, '', '', '', mapId, '', '');
        	mapLayers.push(tl);       	
        	cloneWMSList(url, name, path[0], style, [path[1], path[2], path[3]], isTemp);      	
    	}
    	
    	//Add a row for this layer in the Manage Layers view
        addTableRow(name, type);  
       
        //Show renewed last modification date and number of layers
        document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;
        
    }
    else if (text == "") {
    	document.getElementById('alertMsgFailEmpty').style.display = 'block';
        setTimeout(function() {$('#alertMsgFailEmpty').fadeOut('slow');}, fadeTime);
    }
    
}

/**
 * Create a URL for the localfile
 */
function createURL(localFile) {
	var fileURL = null;
	if (localFile) {
    	if (window.URL) {
    		fileURL = window.URL.createObjectURL(localFile);
    	}
    	else {
    		fileURL = window.webkitURL.createObjectURL(localFile);
    	}
    }
	return fileURL;
}

/**
 * When browsing for local file, show the name of the chosen file
 * in the layer URL text field.
 */
function showFileName() {
	var temp = $('#fileName').val().split('\\');
	$('#layerUrl').val(temp[2]);			
}

function showFileNameGml() {
	var temp = $('#fileNameGml').val().split('\\');
	$('#layerUrlGml').val(temp[2]);			
}

function showFileNameJSON() {
	var temp = $('#fileNameJSON').val().split('\\');
	$('#layerUrlJSON').val(temp[2]);			
}

function showFileNameGeoTiff() {
	var temp = $('#fileNameGeoTiff').val().split('\\');
	$('#layerUrlGeoTiff').val(temp[2]);			
}

function showFileNameGDAL() {
	var temp = $('#fileNameGDAL').val().split('\\');
	$('#layerUrlGdal').val(temp[2]);			
}

function showIconName() {
	var temp = $('#iconName').val().split('\\');
	$('#iconUrl').val(temp[2]);			
}

function showUserIconName() {
	var temp = $('#userIconName').val().split('\\');
	$('#userIconUrl').val(temp[2]);			
}

function clearPopup() {
	clearOverlayFeatures();
	overlay.setPosition(undefined);
    closer.blur();
    return false;
}

function checkLayerURL(name, url) {
	$.ajax({
        type: 'GET',
        url: url,       
        timeout: ajaxTimeout,
        success: checkURLSuccess,
        error: checkURLError,
        layerName: name
    });
}

function checkURLSuccess(results, status, jqXHR) {
	//console.log('Layer source OK.');	
}

function checkURLError(jqXHR, textStatus, errorThrown) {
	var layerName = this.layerName;
	//console.log('Layer source ERROR: '+layerName);
	document.getElementById('alertURLinvalid').style.display = 'block';
    setTimeout(function() {$('#alertURLinvalid').fadeOut('slow');}, fadeTime);
    
    var index = -1;
    var table = document.getElementById('layerTable');
    var tableRef = document.getElementById('layerTable').getElementsByTagName('tbody')[0];
    for (var i=0; i<table.rows.length; i++) {
        if (table.rows[i].cells[1].innerHTML == layerName) {
            index = i;
            break;
        }
    }
    tableRef.deleteRow(index);
    mapLayers.splice(index, 1);
}


proj4.defs('EPSG:3413', '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 ' +
'+x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');
var proj3413 = ol.proj.get('EPSG:3413');
proj3413.setExtent([-4194304, -4194304, 4194304, 4194304]);

function pvRun() {	
	var newProj = ol.proj.get('EPSG:3413');
    var newProjExtent = newProj.getExtent();
    var newView = new ol.View({
      projection: newProj,
      center: ol.extent.getCenter(newProjExtent),
      zoom: 0,
      extent: newProjExtent
    });
    map.setView(newView);
    
    
    
}

function normalRun() {	
	var newProj = ol.proj.get('EPSG:3857');
    var newProjExtent = newProj.getExtent();
    var newView = new ol.View({
      projection: newProj,
      center: ol.extent.getCenter(newProjExtent),
      zoom: 0,
      extent: newProjExtent
    });
    map.setView(newView);
    
}

