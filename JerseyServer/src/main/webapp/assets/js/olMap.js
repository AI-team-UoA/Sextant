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
var map, mapExtent;

/**
 * Shared control among layers for selecting features
 */
var control, mouseControl, highlightCtrl, selectCtrl, infoWMS = [];

/**
 * Calculated bounding box containing the extent of all layers
 */
//var allLayersBounds = new OpenLayers.Bounds();

/**
 * Number of layers when initializing the map
 */
var layersInitialNum = 0;

/**
 * Interval between refreshing layers
 */
var refreshInterval = 1000;

/**
 * No proxy is used for cross-realm communication
 */
OpenLayers.ProxyHost = null;

/**
 * Table with the info of all layers
 */
var mapLayers = [];

/**
 * Variable that shows if we run on timemap (1), or on simplemap (0)
 */
var isTimeMap = 0;

/**
 * Variable that keeps the number of temporal layers on the map
 */
var tempLayersNum = 0;

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

//World Geodetic System 1984 projection (lon/lat)
var WGS84 = new OpenLayers.Projection("EPSG:4326");

//WGS84 Google Mercator projection (meters)
var WGS84_google_mercator = new OpenLayers.Projection("EPSG:900913");

var colorSpin = '#E8EFF5';
var colorSpinDescribe = '#7E7E7E';

/**
 * The three base layers for the map
 */
var gsat = new OpenLayers.Layer.Google(
	        "Google Satellite",
	        {type: google.maps.MapTypeId.SATELLITE, numZoomLevels: 22, isBaseLayer:true}
    	);
var gmap = new OpenLayers.Layer.Google(
	        "Google Streets",
	        {numZoomLevels: 20}
	    );
var ghyb = new OpenLayers.Layer.Google(
	        "Google Hybrid",
	        {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 20}
    	);

var lonLat;

var clickFeatureStyle = new OpenLayers.Style({
    strokeColor: "blue",
    strokeWidth: 1,
    fillColor: "blue",
    fillOpacity: 0.4,
    strokeOpacity: 1
});

/**
 * Function for initializing the OpenLayers map
 * (called on Window load)
 */
function initialize(timeMap) {
	if (!map){
		document.getElementById('tmContainer').style.right = '-3000px';
		isTimeMap = 1;
			
		/**
		 * Create map with new myTimeline
		 */
		map = new OpenLayers.Map("map_canvas", {
								 controls: [new OpenLayers.Control.Zoom({'position': new OpenLayers.Pixel(20,70)}),
								            new OpenLayers.Control.TouchNavigation()],
								 layers: [gsat, gmap, ghyb],
								 projection: 'EPSG:900913',
								 displayProjection: 'EPSG:4326',
								 units: 'm',
								 center: new OpenLayers.LonLat(23.72275, 37.92253).transform('EPSG:4326', 'EPSG:900913'),
								 zoom: 6
		});
		initTimeline();
	    
	    mouseControl = new OpenLayers.Control.MousePosition({
	    	div:document.getElementById("coordinates")
	    });
	    map.addControl(mouseControl);
	    mouseControl.activate();	 
	    		
	    layersInitialNum = map.getNumLayers();	 
	        
	    //Add draw box contols and add the two layers in the layers table
	    userLayer = new OpenLayers.Layer.Vector("userInfo");
		map.addLayers([userLayer]);
		
		var tl = new Layer('userInfo', null, false, 'kml', '', '', '#FFB414', '#FFB414', './assets/images/map-pin-md.png', 20, 0, '', '');
        mapLayers.push(tl);	 
        addTableRow('userInfo', 'user');          
			    
	    control = new OpenLayers.Control.SelectFeature([userLayer]);
	    map.addControl(control);
	    control.activate();	                	   
							
		// add some handlers for selection/unselection of features in the layer
		userLayer.events.on({
			            'featureselected': onFeatureSelect,
			            'featureunselected': onFeatureUnselect,
			            'featureadded': userFeatureAdded
			            });
		
		drawControlPoint = new OpenLayers.Control.DrawFeature(userLayer,
											                OpenLayers.Handler.Point
											                );
		drawControlPolygon = new OpenLayers.Control.DrawFeature(userLayer,
		                                                     OpenLayers.Handler.RegularPolygon, 
		                                                     { 
												      			handlerOptions: {
												      				sides: 4,
											                        irregular: true
												      			}
		                                                     });

		map.addControl(drawControlPoint);
		map.addControl(drawControlPolygon); 
		
		
		//Hide/Show all layers according to map zoom level
		map.events.register('zoomend', this, function (event) {
	        var zLevel = map.getZoom();  
			var mapZoomLimit = 5;

	        for (var i=0; i<mapLayers.length; i++) {
	        	var zoomLayer = map.getLayersByName(mapLayers[i].name);
	        	if( zLevel >= mapZoomLimit  && typeof zoomLayer[0] != 'undefined')
		        {
	        		if (document.getElementById("shBox"+mapLayers[i].name).checked) {
	        			zoomLayer[0].setVisibility(true);
	        		}
		        }
	        	else if( zLevel < mapZoomLimit  && typeof zoomLayer[0] != 'undefined')
		        {
	        		zoomLayer[0].setVisibility(false);
		        }
	        	
	        	if ( (mapLayers[i].type == 'kml' || mapLayers[i].type == 'gml') 
	        			&& typeof zoomLayer[0] != 'undefined' 
	        			&& mapLayers[i].name != 'userInfo' ) {

	        		if (zoomLayer[0].strategies.length > 1) {
	        			if (zoomLayer[0].strategies[1].activate()) {
		        			zoomLayer[0].refresh({force: true});
	        			}
	        		}
	        	}
	        } 
	        
	        if (currentFeature != null || popupWMS != null) {
		        resetPositionPopup();	        	
	        }
	    });
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
 
    disableFeatures(disableAll, disableSaveMap);
    
    //Initialize AlaSQL
    alasql('CREATE DATABASE gadm28; USE gadm28;'); 
    alasql('CREATE TABLE geodata; SELECT * INTO geodata FROM CSV("./assets/resources/gadm28.csv", {headers:true, separator:";"})');

    currentFeature = null;
}

/**
 * Add a WMS layer on the map
 */
function addWMSLayer(name, url, layersWMS) {
	if (name && url && layersWMS) {
		var layer = new OpenLayers.Layer.WMS(name, url,
		       {
		           layers: layersWMS,
		           transparent: "true",
		       }, 
		       {
		           isBaseLayer: false
		});
	
		// add the new layer to the map and refresh
		map.addLayer(layer);	
		
		var infoWMScontrol = new OpenLayers.Control.WMSGetFeatureInfo({
            url: url, 
            title: 'popupWMS',
            queryVisible: true,
            eventListeners: {
                getfeatureinfo: function(event) {
                	if (popupWMS != null) {
                		map.removePopup(popupWMS);
                	}
                	
                	popupWMS = new OpenLayers.Popup.Popover(
                            "customPopup", 
                            map.getLonLatFromPixel(event.xy),
                            event.text,
                            "WMS Feature"
                    );
                	addWMSpopup(event);
                }
            }
        });
        map.addControl(infoWMScontrol);
        infoWMScontrol.activate();
        
        var newWMScontrol = new controlWMS(name, infoWMScontrol);
        infoWMS.push(newWMScontrol);
        
					
		// when loaded, calculate the new extent for all layers and zoom to it
		layer.events.register('loadend', layer, function (evt) {
	                          	setTimeout(function() {$('#alertMsgLoading').fadeOut('slow');}, fadeTime);	                        	
	                          	hideSpinner();	   	                          		                                                                                        
	                          });
					
		layer.events.register('removed', layer, function (evt) {	                           	                              
	                            layer.setVisibility(false);
	                            layer.display(false);
	                          });							
	}
}

/**
 * Adds the given GeoTIFF file as a new layer on the map.
 * bbox = new OpenLayers.Bounds(UL1, LL2, UR1, UR2)
 * imageSize = new OpenLayers.Size(width, height);
 */
function addGeoTiffLayer(label, filename, bbox, imageSize) {
	if (filename && label) {
		var layer = new OpenLayers.Layer.Image(label, 
				   filename, 
				   bbox, 
				   imageSize, 
				   {
				       isBaseLayer: false,
					   alwaysInRange: true,
					   opacity: 1.0,
					   visibility: true
				   });
		
		map.addLayer(layer);
		
		map.zoomToExtent(bbox);
		
    	/**
    	 * loadend event for image layers runs every time the map changes
    	 */
		// when loaded, calculate the new extent for all layers and zoom to it
		layer.events.register('loadend', layer, function (evt) {						          	
						          	setTimeout(function() {$('#alertMsgLoading').fadeOut('slow');}, fadeTime);
						          		
						          	hideSpinner();								          	
						        	
						            //Update the size of the map
						            map.updateSize();
						            refreshMap();						            						            
                                                           
                              });
		
		// when removed, close all popups that may have been
		// referencing a feature of the layer destroying also
		// the layer
		layer.events.register('removed', layer, function (evt) {                                                          
                              //layer.destroy(); Destroy call generates error when uploading new kml.
                              layer.setVisibility(false);
                              layer.display(false);
                              });		
	}
}


/**
 * Function handler for a click event on a feature of a layer.
 */
function onFeatureSelect(evt) {	
	if (typeof evt.feature.cluster != 'undefined') {
		if(evt.feature.cluster.length > 1) {
			return ;  
		}
	}
	else {	
		feature = evt.feature;
		
		if (!clickTimeline) {
	    	lonLat = map.getLonLatFromPixel(new OpenLayers.Pixel(mouseControl.lastXy.x, mouseControl.lastXy.y));
		}
		
		popupClose(0);
		currentFeature = evt.feature;
		
		var title = feature.attributes.name;
		
		var jsonObj = feature.attributes;
		var content = '<table class="table table-striped"><tbody>';
    	for (var key in jsonObj) {
    		if (key != 'description' && key != 'name' && key != 'deleteFeatureButton') {
    			content += '<tr><td><b>'+key+'</b></td><td>'+jsonObj[key]+'</td></tr>';
    		}
    	}
    	content += '</tbody></table>';
    	
    	if (typeof(feature.attributes.deleteFeatureButton) != 'undefined') {
    		content += feature.attributes.deleteFeatureButton;
    	}
       
		var popup = new OpenLayers.Popup.Popover(
			    "customPopup",
			    lonLat,
			    content,
			    title
		);
		
		feature.popup = popup;
		map.addPopup(popup);
	}		
}

/**
 * Function handler when a balloon is closed for a feature of a layer.
 */
function onFeatureUnselect(evt) {
	if (typeof evt.feature.cluster != 'undefined') {
		if(evt.feature.cluster.length > 1) {
			return ;  
		}
	}
	else {	
		popupClose(1);
	}
}


function onFeatureAdded(evt) {
	if (typeof evt.feature.cluster != 'undefined') {
		if(evt.feature.cluster.length > 1) {
			return ;  
		}
	}
	else {	
		feature = evt.feature;
	}
	//var temp = JSON.stringify(feature.attributes);
	//alert(temp);
	
	//This is the temp value
	/*{
	 * "lgd":{"value":"http://linkedgeodata.org/triplify/way115393835"},
	 * "lgdLabel":{"value":"Riviera San Nicolò"},
	 * "name":"Result0",
	 * "description":"<TABLE border=\"1\">\n\t\t\t\t\n\t\t\t\t\t<TR><TD>lgdLabel</TD><TD>Riviera San Nicolò</TD></TR>\n\t\t\t\t\t<TR><TD>lgd</TD><TD>http://linkedgeodata.org/triplify/way115393835</TD></TR>\n\t\t\t\t</TABLE>",
	 * "styleUrl":"#m_ylw-pushpin"
	 * }
	 * */
}

/**
 * Parse the feature.attributes to transform the ExtendedData to normal data to use them for styling later on
 * 
 * So this input:
 * {
 *  "lgd":{"value":"http://linkedgeodata.org/triplify/way115393835"},
 *  "lgdLabel":{"value":"Riviera San Nicolò"},
 *  "name":"Result0",
 *  "description":"<TABLE border=\"1\">\n\t\t\t\t\n\t\t\t\t\t<TR><TD>lgdLabel</TD><TD>Riviera San Nicolò</TD></TR>\n\t\t\t\t\t<TR><TD>lgd</TD><TD>http://linkedgeodata.org/triplify/way115393835</TD></TR>\n\t\t\t\t</TABLE>",
 *  "styleUrl":"#m_ylw-pushpin"
 * }
 * 
 * Becomes:
 * {
 *  "lgd":"http://linkedgeodata.org/triplify/way115393835",
 *  "lgdLabel":"Riviera San Nicolò",
 *  "name":"Result0",
 *  "description":"<TABLE border=\"1\">\n\t\t\t\t\n\t\t\t\t\t<TR><TD>lgdLabel</TD><TD>Riviera San Nicolò</TD></TR>\n\t\t\t\t\t<TR><TD>lgd</TD><TD>http://linkedgeodata.org/triplify/way115393835</TD></TR>\n\t\t\t\t</TABLE>",
 *  "styleUrl":"#m_ylw-pushpin"
 * }
 */
function onBeforeFeatureAdded(evt) {	
	if (typeof evt.feature.cluster != 'undefined') {
		if(evt.feature.cluster.length > 1) {
			return ;  
		}
	}
	else {	
		var feature = evt.feature;
		var temp = JSON.stringify(feature.attributes);
			
		temp = temp.replace(/{\"value\":/g,"");	
		temp = temp.replace(/},/g, ",");
		var obj = $.parseJSON(temp);
			
		evt.feature.attributes = obj;
	}
}

/**
 * Function handler when a balloon is closed.
 */
function closePopup(feature) {
	//control.unselect(feature);
}

/**
 * Zoom to bounty box (lon, lat) of the layer
 */
function zoomToBountyBox(layer) {
	map.zoomToExtent(layer.getDataExtent());
}

function zoomToBountyBoxWMS(layerName) {
	for (var i=0; i<mapLayers.length; i++) {
        if (mapLayers[i].name == layerName) {
        	map.zoomToExtent(mapLayers[i].imageBbox);
        	break;
        }
    }	
}

/**
 * ***************************************************************************************************
 * Mobile version functions
 * ***************************************************************************************************
 */

/**
 * Add KML layer.
 * Parameters are taken from HTML modal.
 */
function addKMLLayerFromModal(){
	var name = document.getElementById('layerName').value;
    var path = document.getElementById('layerUrl').value;   
    var localFile = document.getElementById('fileName').files[0];
    var isTemp = document.getElementById('isTemporal').checked;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = "kml";
    
	//Check the file type if it is KML
    var len = path.length;
	var isKML = path.substring(len-4, len);
	if (isKML != ".kml") {
		//Print error and return
		document.getElementById('alertMsgWrongFileType').style.display = 'block';
        setTimeout(function() {$('#alertMsgWrongFileType').fadeOut('slow');}, fadeTime);
        return ;
	}
	
	//Create a URL for the localfile
    var fileURL = createURL(localFile);
    
    //Get the path from user. If localfile is chosen, get its url instead.
    var url = path;
    if(typeof localFile != 'undefined') {
    	//Local file
    	url = fileURL.toString();
    	addLayer(url, name, isTemp, type, text, endpoint, mapId, localFile, path, null, null, null);
    }
    else {
		addLayer(url, name, isTemp, type, text, endpoint, mapId, null, path, null, null, null);
    }   
}

/**
 * Add GML layer.
 * Parameters are taken from HTML modal.
 */
function addGMLLayerFromModal(){
	var name = document.getElementById('layerNameGml').value;
    var path = document.getElementById('layerUrlGml').value;   
    var localFile = document.getElementById('fileNameGml').files[0];
    var isTemp = false;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = "gml";
    
	//Check the file type if it is GML
    var len = path.length;
	var isGML = path.substring(len-4, len);
	if (isGML != ".xml" && isGML != ".gml") {
		//Print error and return
		document.getElementById('alertMsgWrongFileType').style.display = 'block';
        setTimeout(function() {$('#alertMsgWrongFileType').fadeOut('slow');}, fadeTime);
        return ;
	}
	
	//Create a URL for the localfile
    var fileURL = createURL(localFile);
    
    //Get the path from user. If localfile is chosen, get its url instead.
    var url = path;
    if(typeof localFile != 'undefined') {
    	//Local file
    	url = fileURL.toString();
    	addLayer(url, name, isTemp, type, text, endpoint, mapId, localFile, path, null, null, null);
    }
    else {
		addLayer(url, name, isTemp, type, text, endpoint, mapId, null, path, null, null, null);
    }
}

/**
 * Add GeoTIFF layer.
 * Parameters are taken from HTML modal.
 */
function addGeoTiffLayerFromModal(){
	var name = document.getElementById('layerNameGeoTiff').value;
    var path = document.getElementById('layerUrlGeoTiff').value;   
    var localFile = document.getElementById('fileNameGeoTiff').files[0];
    var isTemp = false;
    var mapId = 0;
    var query = "";
    var endpoint = "";
    var type = "geotiff";   
    var bbox;
    var imageSize;
    
    //Create a URL for the localfile
	var fileURL = createURL(localFile);
    
    //First get the path from user. If localfile is chosen, get its url instead.
    var url = path;
    
    /**
     * Parse GDAL file for bbox and image size in pixels
     * ATTENTION!!!! 
     * bbox must be expressed in EPSG:4326 which is the projection of the map,
     * so user must transform the tif image to EPSG:4326 and then provide the gdalinfo txt.
     */
    var pathGDAL = document.getElementById('layerUrlGdal').value;   
    var localFileGDAL = document.getElementById('fileNameGDAL').files[0];		    		    
    
    //Create a URL for the localfile
    var GDALfileURL = createURL(localFileGDAL);
    
    var urlGDAL = pathGDAL;
    if(localFileGDAL) {
    	urlGDAL = GDALfileURL;
    }
    else {
    	if (urlGDAL == "") {
    		//Use gdal installation on server to get image metadata and load it to map
    		getGDALfromServer(path, localFile, name);  	
    		return;
    	}
    }
    
    
    //Get the gdal file to parse it
    $.get(urlGDAL, function(data) {
    	var text = data.toLowerCase();
    	var metaData = parseBBOX(text);
    	bbox = metaData.bbox;
    	imageSize = metaData.size;
    	
	    if(typeof localFile != 'undefined') {
	    	url = fileURL.toString();
	    	addLayer(url, name, isTemp, type, query, endpoint, mapId, localFile, path, null, bbox, imageSize);
	    }
	    else {
    		addLayer(url, name, isTemp, type, query, endpoint, mapId, null, path, null, bbox, imageSize);
	    }		
	    	
    });
}

var tempUrl;
/**
 * Upload image to server and use the gdal installation to get the image metadata.
 * @param path
 * @param localFile
 * @param name
 */
function getGDALfromServer(path, localFile, name) {
	//Create image info file, from running gdal in server side
	if(localFile && path) {
		//Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
    	document.getElementById('alertMsgServerUpload').style.display = 'block';
    	uploadLocalFileToServer(localFile, name, name, 'geotiff', function(results) {
    		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
    		tempUrl = results;
    		$.ajax({
    	        type: 'POST',
    	        url: rootURL + '/gdalInfo/',
    	        data: results,
    	        dataType: 'text',
    	        headers: {
    	        	//'Accept-Charset' : 'utf-8',
    	        	'Content-Type'   : 'text/plain; charset=utf-8',
    	        },
    	        timeout: ajaxTimeout,
    	        success: getImageInfoGDAL,
    	        error: printError
    	    });
    	});
    }
    else if (path){
    	//Upload file to server and create the layer
		document.getElementById('alertMsgServerDownload').style.display = 'block';
    	downloadFile(path, function(result) {
    		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
    		tempUrl = path;
    		$.ajax({
    	        type: 'POST',
    	        url: rootURL + '/gdalInfo/',
    	        data: result,
    	        dataType: 'text',
    	        headers: {
    	        	//'Accept-Charset' : 'utf-8',
    	        	'Content-Type'   : 'text/plain; charset=utf-8',
    	        },
    	        timeout: ajaxTimeout,
    	        success: getImageInfoGDAL,
    	        error: printError
    	    });
    	});
    } 
}

/**
 * Get the gdalinfo results, parse the size and bbox and create the layer.
 * @param results
 * @param status
 * @param jqXHR
 */
function getImageInfoGDAL(results, status, jqXHR) {	
	var text = results.toLowerCase();
	console.log('***** GDAL INFO: '+text);
	var metaData = parseBBOX(text);
	var bbox = metaData.bbox;
	var imageSize = metaData.size;
	
	var name = document.getElementById('layerNameGeoTiff').value;
	console.log('NAME IMAGE: '+name);
	if (name == "") {
		name = 'tester';
	}

    addLayer(tempUrl, name, false, 'geotiff', "", "", 0, null, null, null, bbox, imageSize);
}

/**
 * Parse gdalinfo results to get image size and bbox.
 */
function parseBBOX(text) {
	text = text.replace(/\"/g, "|");
	text = text.replace(/\'/g, "|");
	
	//Image size in pixels
	var str = text.match(/size is [0-9]*, [0-9]*/g);
	var test = str.toString().replace(/,/g, "");
	test = test.toString().split(" ");
	var w = Number(test[2]);
	var h = Number(test[3]);
	var imageSize = new OpenLayers.Size(w, h);
	
	//Corner coordinates
	var ul = text.match(/upper\sleft\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ul = ul.toString().split("(");
	ul = ul[1].toString().split(",");
	var left = Number(ul[0]);
	var top = Number(ul[1]);
	
	var ur = text.match(/upper\sright\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ur = ur.toString().split("(");
	ur = ur[1].toString().split(",");
	var right = Number(ur[0]);
	
	var ll = text.match(/lower\sleft\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ll = ll.toString().split("(");
	ll = ll[1].toString().split(",");
	var bottom = Number(ll[1]);		    	   	
	
	var adjustParameter = 0.04;
	var bbox = new OpenLayers.Bounds(left, bottom-adjustParameter, right, top-adjustParameter).transform(WGS84, map.getProjectionObject());	
	
	return new ImageMetaData(bbox, imageSize);
}

/**
 * Add WMS layer.
 * Parameters are taken from HTML modal.
 */
function addWMSLayerFromModal(){
	var name = document.getElementById('layerNameWMS').value;
    var url = document.getElementById('serverWMS').value;   
    var layersWMS = document.getElementById('layersWMS').value; 
    var isTemp = false;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = "wms";   			
   
    addLayer(url, name, isTemp, type, text, endpoint, mapId, null, layersWMS, null, null, null);
	
	document.getElementById('hiddenLoadWMS').reset();
	document.getElementById('WMSLayerList').innerHTML = '';
}

/**
 * Create the layer on the map using OpenLayers 2.13
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
    	
    	if (style == null) {
        	document.getElementById('alertMsgLoading').style.display = 'block';
    	}
    	showSpinner(colorSpin);  
        
        //KML
    	if (type === "kml") {
    		var tl = new Layer(name, url, isTemp, type, text, endpoint, '#FFB414', '#FFB414', './assets/images/map-pin-md.png', 20, mapId, '', '');
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
        	var tl = new Layer(name, url+'#'+path, isTemp, type, text, endpoint, '', '', '', '', mapId, '', '');
        	mapLayers.push(tl);       	
        	cloneWMSList(url, name, path);      	
    		addWMSLayer(name, url, path);
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
    else {
    	/*
    	var tl = new Layer(name, 'null', isTemp, type, text, endpoint, '#FFB414', '#FFB414', './assets/images/map-pin-md.png', 20, mapId, '', '');
        mapLayers.push(tl);
    	
    	//Reset form data
        document.getElementById('hiddenLoadKml').reset();
        
        //Add a row for this layer in the Manage Layers view
        addTableRow(name, type);  
       
        //Show renewed last modification date and number of layers
        document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;
        
        document.getElementById('alertMsgNoResults').style.display = 'block';
        setTimeout(function() {$('#alertMsgNoResults').fadeOut('slow');}, fadeTime);    
        */    
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

/**
 * Adds the given KML file as a new layer on the map.
 */
function addKmlLayer(label, filename, styling, isTemp) {
	if (filename && label) {
		
		var symbolizer = OpenLayers.Util.applyDefaults({fillOpacity: 0.6}, OpenLayers.Feature.Vector.style["default"]);		
		var styleMap = new OpenLayers.StyleMap({"default": symbolizer});
		var originalStyle = false;
		
		if (styling != null){
			originalStyle = false;
			styleMap = styling;
		}
		
		var clusterStrategy = new OpenLayers.Strategy.Cluster({distance: 75, threshold: 30, autoActivate: false});
		
		var styleAll = new OpenLayers.Style({
				fillColor: "${fillColor}", 
				fillOpacity: 0.5, 
				strokeColor: "${strokeColor}",
				strokeOpacity: 1,
				strokeWidth: 1,
				pointRadius: "${pointRadius}",
				fontColor: "#CC0099",
				fontOpacity: 1,
				fontSize: "25px",
				fontWeight: "bold",
				label: "${label}"
			}, 
			{
				context: {
					label: function(feature) {
						if (typeof feature.cluster != 'undefined') {
							if(feature.cluster.length > 1) {
								return feature.cluster ? feature.cluster.length : "";  
							}
						}
						else {
							return "";
						}
					},
					pointRadius: function(feature) {
						if (typeof feature.cluster != 'undefined') {
					    	if(feature.cluster.length > 1) {
					            return (feature.cluster.length/3)+20; 
					    	}
						}
						else {
							return styleMap.styles.default.defaultStyle.pointRadius;
						}
					},
					fillColor: function(feature) {
						if (typeof feature.cluster != 'undefined') {
					    	if(feature.cluster.length > 1) {
					            return '#66FFCC'; 
					    	}
						}
						else {
							return styleMap.styles.default.defaultStyle.fillColor;
						}
					},
					strokeColor: function(feature) {
						if (typeof feature.cluster != 'undefined') {
					    	if(feature.cluster.length > 1) {
					            return '#25375C'; 
					    	}
						}
						else {
							return styleMap.styles.default.defaultStyle.strokeColor;
						}
					}
				}
		});

		var sm = new OpenLayers.StyleMap({"default": styleAll, "select":clickFeatureStyle});
		var layer = new OpenLayers.Layer.Vector(label, {
                                                projection: map.displayProjection,
                                                styleMap: sm,
                                                rendererOptions: { zIndexing: true },
                                                //strategies: [new OpenLayers.Strategy.Fixed(), clusterStrategy],
                                                strategies: [new OpenLayers.Strategy.Fixed()],
                                                protocol: new OpenLayers.Protocol.HTTP({
                                                                                       url: filename,
                                                                                       format: new OpenLayers.Format.KML({
                                                                                                                         extractStyles: originalStyle,
                                                                                                                         extractAttributes: true,
                                                                                                                         maxDepth: 2
                                                                                                                         })
                                                                                       })
                                                
                                                });
						
			// add the new layer to the map and refresh
			map.addLayer(layer);
			      
			// set the selection control for the new layer
		    if (control) { // reuse the control
		    	control.setLayer((control.layers||control.layer).concat(layer));
		    } else { // create a new control object (shared by all layers)
		    	control = new OpenLayers.Control.SelectFeature([layer]);
		    	map.addControl(control);
		    	control.activate();
		                
		    	//TODO override control's destroy method
		    	//OpenLayers.Control.SelectFeature.prototype.destroy = function() { alert("called");};
		    }  
		    
		    
			// add some handlers for selection/unselection of features in the layer
			layer.events.on({
	                        'featureselected': onFeatureSelect,
	                        'featureunselected': onFeatureUnselect,
	                        //'featureadded': onFeatureAdded,
	                        'beforefeatureadded': onBeforeFeatureAdded
	                        });
			
			
			// when loaded, calculate the new extent for all layers and zoom to it
			layer.events.register('loadend', layer, function (evt) {	
	                              	if (styling != null) {
	                              		document.getElementById('alertMsgStyleLayerWait').style.display = 'none';
	                              		
	                              		showMap();
	                              		document.getElementById('alertMsgStyleLayer').style.display = 'block';
	                              		setTimeout(function() {$('#alertMsgStyleLayer').fadeOut('slow');}, fadeTime);
	                              	}
	                              	else {
	                              		setTimeout(function() {$('#alertMsgLoading').fadeOut('slow');}, fadeTime);
	                              	}
	                              	
	                              	for (var i=0; i<mapLayers.length; i++) {
	                            		if ( (mapLayers[i].name === label) && (label != 'userInfo')) {
    	                            		//for first feature of a KML layer keep the attributes names
	                            			var featuresNames = "";
	    	                            	var jsonObj = layer.features[0].attributes;
	    	                            	
	    	                            	for (var key in jsonObj) {
	    	                            		if (key != 'description') {
	    	                            			featuresNames = featuresNames.concat(key+',');
	    	                            		}
	    	                            	}
	    	                            	
		                            		mapLayers[i].features = featuresNames;
	    	                            	break;
	                            		}
	                            	}
	                            	
	                              	styleFeaturesTheme(label);
	                              	hideSpinner();	                              	                                
	                              		                              		                              	
	          						map.zoomToExtent(layer.getDataExtent());

	          						if (layer.strategies.length > 1) {
		          						if (layer.strategies[1].activate()) {
		        		        			layer.refresh({force: true});
		        	        			}
	          						}
	          						
	          						if (isTemp) {
	          							parseTimelineFeatures(layer, filename);	
	          						}	
	          						
	                                //Update the size of the map
	                                map.updateSize();
	                                refreshMap();		                                
	                             });
			
			// when removed, close all popups that may have been
			// referencing a feature of the layer destroying also
			// the layer
			layer.events.register('removed', layer, function (evt) {	                              
	                                layer.setVisibility(false);
	                                layer.display(false);
	                              });	
	                              						
			
	}
}



/**
 * Adds the given GML file as a new layer on the map.
 */
function addGmlLayer(label, filename, styling, isTemp) {
	if (filename && label) {
		
		var symbolizer = OpenLayers.Util.applyDefaults({fillOpacity: 0.6}, OpenLayers.Feature.Vector.style["default"]);		
		var styleMap = new OpenLayers.StyleMap({"default": symbolizer});
		var originalStyle = false;
        
		if (styling != null){
			originalStyle = false;
			styleMap = styling;
		}
		
		var clusterStrategy = new OpenLayers.Strategy.Cluster({distance: 75, threshold: 30, autoActivate: false});

		var styleAll = new OpenLayers.Style({
			fillColor: "${fillColor}", 
			fillOpacity: 0.5, 
			strokeColor: "${strokeColor}",
			strokeOpacity: 1,
			strokeWidth: 1,
			pointRadius: "${pointRadius}",
			fontColor: "#CC0099",
			fontOpacity: 1,
			fontSize: "25px",
			fontWeight: "bold",
			label: "${label}"
		}, 
		{
			context: {
				label: function(feature) {
					if (typeof feature.cluster != 'undefined') {
						if(feature.cluster.length > 1) {
							return feature.cluster ? feature.cluster.length : "";  
						}
					}
					else {
						return "";
					}
				},
				pointRadius: function(feature) {
					if (typeof feature.cluster != 'undefined') {
				    	if(feature.cluster.length > 1) {
				            return (feature.cluster.length/3)+20; 
				    	}
					}
					else {
						return styleMap.styles.default.defaultStyle.pointRadius;
					}
				},
				fillColor: function(feature) {
					if (typeof feature.cluster != 'undefined') {
				    	if(feature.cluster.length > 1) {
				            return '#66FFCC'; 
				    	}
					}
					else {
						return styleMap.styles.default.defaultStyle.fillColor;
					}
				},
				strokeColor: function(feature) {
					if (typeof feature.cluster != 'undefined') {
				    	if(feature.cluster.length > 1) {
				            return '#25375C'; 
				    	}
					}
					else {
						return styleMap.styles.default.defaultStyle.strokeColor;
					}
				}
			}
		});
		
		var sm = new OpenLayers.StyleMap({"default": styleAll, "select":clickFeatureStyle});
		var layer = new OpenLayers.Layer.Vector(label, {
                                                projection: map.displayProjection,
                                                styleMap: sm,
                                                rendererOptions: { zIndexing: true },
                                                //strategies: [new OpenLayers.Strategy.Fixed(), clusterStrategy],
                                                strategies: [new OpenLayers.Strategy.Fixed()],
                                                protocol: new OpenLayers.Protocol.HTTP({
                                                                                       url: filename,
                                                                                       format: new OpenLayers.Format.GML({
                                                                                           extractStyles: originalStyle,
                                                                                           extractAttributes: true,
                                                                                           maxDepth: 2
                                                                                           })
                                                                                       })	                                                
                                                });
			
		// add the new layer to the map and refresh
		map.addLayer(layer);
						
		// set the selection control for the new layer
	    if (control) { // reuse the control
	    	control.setLayer((control.layers||control.layer).concat(layer));
	    } else { // create a new control object (shared by all layers)
	    	control = new OpenLayers.Control.SelectFeature([layer]);
	    	map.addControl(control);
	    	control.activate();
	                
	    	//TODO override control's destroy method
	    	//OpenLayers.Control.SelectFeature.prototype.destroy = function() { alert("called");};
	    }   
		
       	// add some handlers for selection/unselection of features in the layer
	    layer.events.on({
            'featureselected': onFeatureSelect,
            'featureunselected': onFeatureUnselect,
            //'featureadded': onFeatureAdded,
            'beforefeatureadded': onBeforeFeatureAdded
            });
					
		// when loaded, calculate the new extent for all layers and zoom to it
		layer.events.register('loadend', layer, function (evt) {
	       						map.zoomToExtent(layer.getDataExtent());	                              	

                              	if (styling != null) {
                              		document.getElementById('alertMsgStyleLayerWait').style.display = 'none';	                              		
                              		showMap();
                              		document.getElementById('alertMsgStyleLayer').style.display = 'block';
                              		setTimeout(function() {$('#alertMsgStyleLayer').fadeOut('slow');}, fadeTime);
                              	}
                              	else {
                              		setTimeout(function() {$('#alertMsgLoading').fadeOut('slow');}, fadeTime);
                              	}	                              	                              	                       
                            	
                              	for (var i=0; i<mapLayers.length; i++) {
                            		if ( (mapLayers[i].name === label) && (label != 'userInfo')) {
	                            		//for first feature of a KML layer keep the attributes names
                            			var featuresNames = "";
    	                            	var jsonObj = layer.features[0].attributes;
    	                            	
    	                            	for (var key in jsonObj) {
    	                            		if (key != 'description') {
    	                            			featuresNames = featuresNames.concat(key+',');
    	                            		}
    	                            	}
    	                            	
	                            		mapLayers[i].features = featuresNames;
    	                            	break;
                            		}
                            	}
                              	hideSpinner();	 
                              	
                              	if (layer.strategies.length > 1) {
	          						if (layer.strategies[1].activate()) {
	        		        			layer.refresh({force: true});
	        	        			}
          						}
                    			
                                //Update the size of the map
                                map.updateSize();
                                refreshMap();                                                                
                              });
			
		// when removed, close all popups that may have been
		// referencing a feature of the layer destroying also
		// the layer
		layer.events.register('removed', layer, function (evt) {
                                /*for (var i = 0; i < map.popups.length; i++) {
                                    closePopup(map.popups[i]);
                                }*/
	                              
                                //layer.destroy(); Destroy call generates error when uploading new kml.
                                layer.setVisibility(false);
                                layer.display(false);
                              });							
	}
}

