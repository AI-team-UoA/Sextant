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
var arrHost = myHost.replace("http://", "").split("/");
var rootURL = 'http://' + arrHost[0] + '/' + arrHost[1] +'/rest/service';
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
    	size: 10
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
	if (results == 'none') {
		bingMapsKey = null;
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
	if (!map){
		document.getElementById('tmContainer').style.right = '-3000px';
		document.getElementById('statsContainer').style.right = '-3000px';
		
		mouseControl = new ol.control.MousePosition({
	        coordinateFormat: ol.coordinate.createStringXY(4),
	        projection: 'EPSG:4326',
	        target: document.getElementById('coordinates'),
	        undefinedHTML: '&nbsp;'
	    });
		
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
	    
	    //Drag an drop interaction for KML
	    /*
	    var dragAndDropInteractionKML = new ol.interaction.DragAndDrop({
	        formatConstructors: [
	          ol.format.KML
	        ]
	    });
	    */
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
	          center: center,
	          zoom: 6
	        }),
	        //interactions: ol.interaction.defaults().extend([mapSelectInterraction]),
	        controls: ol.control.defaults().extend([mouseControl])
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
	        	
	        	/**
	        	 * Get the WMS layer that is on-top in the zIndex. This is either
	        	 * the layer that has the greater value in the zIndex,
	        	 * or the last layer in the mapLayers table in case they all
	        	 * have the same zIndex value.
	        	 */
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
	    		if (key != 'description' && key != 'geometry' && key != 'name') {
	    			content.innerHTML += '<tr><td><b>'+key+'</b></td><td>'+features[0].getProperties()[key]+'</td></tr>';
	    		}
	    		if (key == 'name') {
	    			document.getElementById('popupTitle').innerHTML = features[0].getProperties()[key];
	    		}
	    	}
	        	        	        
	        overlay.setPosition(coordinate);
	    });
		
		/*
		dragAndDropInteractionKML.on('addfeatures', function(event) {
	        var vectorSource = new ol.source.Vector({
	          features: event.features,
	          format: new ol.format.KML({
	        	  extractStyles: false
	          })
	        });
	        map.addLayer(new ol.layer.Vector({
	          source: vectorSource,
	          style: defaultVectorStyle
	        }));
	        
	        map.getView().fit(vectorSource.getExtent(), (map.getSize()));
	    });
	    */
		
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
}

function clearOverlayFeatures() {
	featureOverlay.getSource().getSource().clear();
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
    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#ff9900', '#ff9900', './assets/images/map-pin-md.png', 20, mapId, '', '');
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
    	} 
    	
    	//JSON
    	if (type === "geojson" || type === "topojson") {
    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#FFB414', '#FFB414', './assets/images/map-pin-md.png', 20, mapId, '', '');
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

