var WMSmeta = function (id, bbox, style) {
	this.id = id;
	this.bbox = bbox;
	this.style = style;
};
var tempWMS = [];

var popupWMS = null;
var popupWMSevt = null;

function getWMSList() {
	var url = document.getElementById('serverWMS').value;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	$.ajax({
        type: 'GET',
        url: url + '?request=GetCapabilities&version=1.1.0&service=WMS',              
        timeout: ajaxTimeout,
        success: parseWMSResults,
        error: printError
    });	
}

function parseWMSResults(results, status, jqXHR) {
	//console.log(results);
	document.getElementById('WMSLayerList').innerHTML = '';
	tempWMS = [];
	
	$('Layer', results).each(function(i) {		
		if (i > 0) {	
			var name = $(this).find('Name').text();
			var title = $(this).find('Title').text();
			var bboxWMS = $(this).find('BoundingBox');
			var style = $(this).find('OnlineResource');
			var legendURI = $(style).attr('xlink:href');
			
			var divRef = document.getElementById('WMSLayerList');
			var element = document.createElement('option');
			element.innerHTML = title;
			element.value = name;
			divRef.appendChild(element);
			
			var extent = new OpenLayers.Bounds($(bboxWMS).attr('minx'), $(bboxWMS).attr('miny'), $(bboxWMS).attr('maxx'), $(bboxWMS).attr('maxy')).transform(new OpenLayers.Projection($(bboxWMS).attr('SRS')), map.getProjectionObject());
			var metadata = new WMSmeta(name, extent, legendURI);
			tempWMS.push(metadata);
		}				
	});
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
}

function updateWMSname() {
	document.getElementById('layersWMS').value = document.getElementById("WMSLayerList").value;
}

function cloneWMSList(url, name, id) {		
	$.ajax({
        type: 'GET',
        url: url + '?request=GetCapabilities&version=1.1.0&service=WMS',              
        timeout: ajaxTimeout,
        success: parseClonedWMSResults,
        error: printError,
        layerName: name,
        layerId: id
    });	
}

function parseClonedWMSResults(results, status, jqXHR) {
	tempWMS = [];
	
	$('Layer', results).each(function(i) {		
		if (i > 0) {	
			var name = $(this).find('Name').text();
			var bboxWMS = $(this).find('BoundingBox');
			var style = $(this).find('OnlineResource');
			var legendURI = $(style).attr('xlink:href');
			if (typeof legendURI == 'undefined') {
				legendURI = 'none';
			}
			
			var extent = new OpenLayers.Bounds($(bboxWMS).attr('minx'), $(bboxWMS).attr('miny'), $(bboxWMS).attr('maxx'), $(bboxWMS).attr('maxy')).transform(new OpenLayers.Projection($(bboxWMS).attr('SRS')), map.getProjectionObject());
			var metadata = new WMSmeta(name, extent, legendURI);
			tempWMS.push(metadata);
		}				
	});
	
	parseWMSMetadata(this.layerName, this.layerId);
}

function parseWMSMetadata(layerName, WMSid) {
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
				mapLayers[i].icon = tempWMS[pos].style;	
				
				if (mapLayers[i].icon != 'none') {
					addWMSlegend(mapLayers[i].name, mapLayers[i].icon);
				}
				map.zoomToExtent(mapLayers[i].imageBbox);
				break;
			}
		}
	}
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

function addWMSpopup(evt) {
	if (!popupCloseTrigger) {
		var xmlObj = $.parseXML(evt.text);
		var bodyContent = xmlObj.getElementsByTagName('body')[0].innerHTML.trim();
		
		if (bodyContent != '') {
			popupWMSevt = new eventWMSinfo(map.getLonLatFromPixel(evt.xy), evt);
		    map.addPopup(popupWMS);
		}
		else {
			popupWMS = null;
		}
	}
	else {
		popupWMS = null;
	}
	popupCloseTrigger = false;
}

