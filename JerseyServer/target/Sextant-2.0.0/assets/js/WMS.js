var WMSmeta = function (id, bbox, style) {
	this.id = id;
	this.bbox = bbox;
	this.style = style;
};
var styleWMS = function (id, title, info, source) {
	this.id = id;
	this.title = title;
	this.info = info;
	this.source = source;
};
var tempWMS = [];

/**
 * Add WMS layer.
 * Parameters are taken from HTML modal.
 */
function addWMSLayerFromModal(){
	var name = document.getElementById('layerNameWMS').value;
    var url = document.getElementById('serverWMS').value;   
    var layersWMS = document.getElementById('layersWMS').value; 
    var styleId = document.getElementById('WMSstyle').options[document.getElementById('WMSstyle').selectedIndex].value;
    if (styleId == 'default style') {styleId = '';}
    var serverType = document.getElementById('ServerType').options[document.getElementById('ServerType').selectedIndex].value;
    var serverVersion = document.getElementById('WMSversion').options[document.getElementById('WMSversion').selectedIndex].value;
    var isTemp = false;
    var mapId = 0;
    var endpoint = "";
    var type = "wms";  
    var text = "";
    
    addLayer(url, name, isTemp, type, text, endpoint, mapId, null, [layersWMS, serverType, serverVersion], styleId, null, null);
	
	document.getElementById('hiddenLoadWMS').reset();
	document.getElementById('WMSLayerList').innerHTML = '';
	document.getElementById('WMSstyle').innerHTML = '<option>default style</option>';
}

/**
 * Add a WMS layer on the map
 */
function addWMSLayer(name, url, layersWMS, type, styleId, bbox) {
	if (name && url && layersWMS) {		
		var colorPanel;
		for (var i=0; i<mapLayers.length; i++) {
			if (mapLayers[i].name == name) {
				bbox = mapLayers[i].imageBbox;
				colorPanel = mapLayers[i].icon;
			}
		}
		
		//console.log(bbox);
		
		var layer = new ol.layer.Tile({
			  title: name,
	          extent: [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
	          source: new ol.source.TileWMS({
	            url: url,
	            params: {'LAYERS': layersWMS,
	            	     'TILED': true,
	            	     'VERSION': type[1],
	            	     'STYLES': styleId},
	            serverType: type[0],
	            crossOrigin: 'anonymous',
	            projection: 'EPSG:3857'
	          })
	    });
		map.addLayer(layer);
		
		if (styleId != '') {addWMSlegend(name, colorPanel);}
		map.getView().fit(bbox, map.getSize());
					
	}
}

function getWMSList() {
	document.getElementById('WMSLayerList').disabled = false;
	document.getElementById('WMSstyle').disabled = false;
	
	var url = document.getElementById('serverWMS').value;
    var serverVersion = document.getElementById('WMSversion').options[document.getElementById('WMSversion').selectedIndex].value;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	$.ajax({
        type: 'GET',
        url: url + '?request=GetCapabilities&version='+serverVersion+'&service=WMS',              
        timeout: ajaxTimeout,
        success: parseWMSResults,
        error: printError
    });	
}

function parseWMSResults(results, status, jqXHR) {
	document.getElementById('WMSLayerList').innerHTML = '';
	tempWMS = [];
	$('Layer', results).each(function(i) {		
		if (i > 0) {	
			var name = $(this).find('Name').text();
			var title = $(this).find('Title').text();
			var info = $(this).find('Abstract').text();
			var style = $(this).find('Style');

			var layerStyles = [];
			$.each(style, function(key, value) {
				var style = new styleWMS($(value).find('Name').text(),
										 $(value).find('Title').text(),
										 $(value).find('Abstract').text(),
										 $(value).find('OnlineResource').attr('xlink:href'));
				layerStyles.push(style);
			});
			
			var divRef = document.getElementById('WMSLayerList');
			var element = document.createElement('option');
			element.innerHTML = title;
			element.value = name;
			element.title = info;
			divRef.appendChild(element);
			
			var metadata = new WMSmeta(name, null, layerStyles);
			tempWMS.push(metadata);
		}				
	});
	
	updateWMSname();
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
}

function updateWMSname() {
	document.getElementById('layersWMS').value = document.getElementById("WMSLayerList").value;
	
	var divRef = document.getElementById('WMSstyle');
	divRef.innerHTML = '<option>default style</option>';
	//Add style selection list
	for (var i=0; i<tempWMS.length; i++) {
		if (tempWMS[i].id == document.getElementById("WMSLayerList").value) {
			for (var j=0; j<tempWMS[i].style.length; j++) {				
				var element = document.createElement('option');
				element.innerHTML = tempWMS[i].style[j].id;
				element.value = tempWMS[i].style[j].id;
				element.title = tempWMS[i].style[j].info;
				divRef.appendChild(element);
			}						
			break;
		}
	}
}
/////////////////////
function cloneWMSList(url, name, id, styleId, type) {	
	$.ajax({
        type: 'GET',
        url: url + '?request=GetCapabilities&version='+type[1]+'&service=WMS',              
        timeout: ajaxTimeout,
        success: parseClonedWMSResults,
        error: printError,
        layerName: name,
        layerId: id,
        styleId: styleId,
        serverType: type[0],
        serverVersion: type[1],
        serverURL: url
    });	
}

function parseClonedWMSResults(results, status, jqXHR) {
	tempWMS = [];
	var version = this.serverVersion;
	var layerName = this.layerId;
	$('Layer', results).each(function(i) {		
		if (i > 0) {				
			var name = $(this).find('Name').text();
			
			if (name == layerName) {
				//We get the data only for the selected layer
				var style = $(this).find('Style');
				
				var bboxWMS = null;
				
				//Ol3
				var extent = [];
				var extent3857 = [];
				
				//Ol2
				var oldExtent = null;
				var oldExtantList = [];
				
				if (version == '1.1.0') {
					bboxWMS = $(this).find('LatLonBoundingBox');
					oldExtent = new OpenLayers.Bounds(Number($(bboxWMS).attr('minx')).toFixed(5),
													  Number($(bboxWMS).attr('miny')).toFixed(5), 
													  Number($(bboxWMS).attr('maxx')).toFixed(5), 
													  Number($(bboxWMS).attr('maxy')).toFixed(5)).transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:3857'));
					oldExtantList = [Number(oldExtent.left).toFixed(5), 
					                 Number(oldExtent.bottom).toFixed(5), 
					                 Number(oldExtent.right).toFixed(5), 
					                 Number(oldExtent.top).toFixed(5)];
					
					//Use OL3 for the extent transformation.
					//TODO: ol.proj.transformExtent produces NaN values in OL3 v3.14.2
					extent = [Number($(bboxWMS).attr('minx')).toFixed(5), 
					          Number($(bboxWMS).attr('miny')).toFixed(5), 
					          Number($(bboxWMS).attr('maxx')).toFixed(5), 
					          Number($(bboxWMS).attr('maxy')).toFixed(5)];
					extent3857 = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
				}
				else if (version == '1.3.0') {
					bboxWMS = $(this).find('EX_GeographicBoundingBox'); 
					oldExtent = new OpenLayers.Bounds(Number($(bboxWMS).find('westBoundLongitude').text()).toFixed(5),
													  Number($(bboxWMS).find('southBoundLatitude').text()).toFixed(5),
													  Number($(bboxWMS).find('eastBoundLongitude').text()).toFixed(5),
													  Number($(bboxWMS).find('northBoundLatitude').text()).toFixed(5)).transform(new OpenLayers.Projection('EPSG:4326'), new OpenLayers.Projection('EPSG:3857'));
					oldExtantList = [Number(oldExtent.left).toFixed(5), 
					                 Number(oldExtent.bottom).toFixed(5), 
					                 Number(oldExtent.right).toFixed(5), 
					                 Number(oldExtent.top).toFixed(5)];
					
					//Use OL3 for the extent transformation
					//TODO: ol.proj.transformExtent produces NaN values in OL3 v3.14.2
					extent = [Number($(bboxWMS).find('westBoundLongitude').text()).toFixed(5), 
					          Number($(bboxWMS).find('southBoundLatitude').text()).toFixed(5), 
					          Number($(bboxWMS).find('eastBoundLongitude').text()).toFixed(5), 
					          Number($(bboxWMS).find('northBoundLatitude').text()).toFixed(5)];
					extent3857 = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
				}

				
				var layerStyles = [];
				$.each(style, function(key, value) {
					var style = new styleWMS($(value).find('Name').text(),
											 $(value).find('Title').text(),
											 $(value).find('Abstract').text(),
											 $(value).find('OnlineResource').attr('xlink:href'));
					layerStyles.push(style);
				});
							
				var metadata = new WMSmeta(name, oldExtantList, layerStyles);
				tempWMS.push(metadata);
			}
			
		}				
	});
	
	parseWMSMetadata(this.layerName, this.layerId, this.styleId, this.serverType, this.serverVersion, this.serverURL);	
}

function parseWMSMetadata(layerName, WMSid, styleId, serverType, serverVersion, serverURL) {
	var pos= -1;
	for (var i=0; i<tempWMS.length; i++) {
		if (tempWMS[i].id == WMSid) {
			pos = i;
			break;
		}
	}

	if (pos != -1) {
		for (var i=0; i<mapLayers.length; i++) {
			if (mapLayers[i].name == layerName) {				
				mapLayers[i].imageBbox = tempWMS[pos].bbox;
				mapLayers[i].icon != '';
				
				for (var j=0; j<tempWMS[pos].style.length; j++) {
					if (tempWMS[pos].style[j].id == styleId) {
						mapLayers[i].fillColor = tempWMS[pos].style[j].id;
						mapLayers[i].icon = tempWMS[pos].style[j].source;	
						break;
					}
				}
								
				if (mapLayers[i].icon != '') {
					addWMSlegend(mapLayers[i].name, mapLayers[i].icon);
				}
									
				addWMSLayer(mapLayers[i].name, serverURL, WMSid, [serverType, serverVersion], styleId, mapLayers[i].imageBbox);
				break;
			}
		}
	}
	else {
		//Layer does not exist in the WMS
		document.getElementById('alertWMSLayerNoValue').style.display = 'block';
        setTimeout(function() {$('#alertWMSLayerNoValue').fadeOut('slow');}, fadeTime);
        
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
	
	document.getElementById('WMSLayerList').disabled = true;
	document.getElementById('WMSstyle').disabled = true;
}

function addWMSlegend(layerName, legendURI) {
	var panel, panelElement, divRef;
						
	panel = document.getElementById('colorPanelBody');
	var element = document.getElementById('WMSlegend'+layerName);
	if (element) { return; }
			
	divRef = document.createElement('div');
	divRef.setAttribute('id', 'WMSlegend'+layerName);
	panel.appendChild(divRef);
			
	divRef = document.getElementById('WMSlegend'+layerName);
	panelElement = document.createElement('label');	
	panelElement.innerHTML = '<br>WMS Layer: '+layerName;
	panelElement.setAttribute('style', 'text-align: left');
	panelElement.style.fontSize = '12px';	
	divRef.appendChild(panelElement);
			
	panelElement = document.createElement('p');	
	divRef.appendChild(panelElement);
		
	panelElement = document.createElement('img');	
	panelElement.setAttribute('src', legendURI);
	divRef.appendChild(panelElement);
	
	showColorPanel();
}

function parseWMSPopupResults(results, status, jqXHR) {
	//console.log(results);
	var resultsBody = results.substring(results.indexOf('<body>')+6, results.indexOf('</body>')).trim();
	
	if (resultsBody != '') {
		content.innerHTML = '<iframe seamless src="' + this.url + '"></iframe>';
		
		document.getElementById('popupTitle').innerHTML = this.topLayer;
		overlay.setPosition(this.coordinates);
	}
	else {
		clearPopup();
	}
}
