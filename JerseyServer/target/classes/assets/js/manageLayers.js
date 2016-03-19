var tempName;
function addTableRow(name, typeF) {
    var tableRef = document.getElementById('layerTable').getElementsByTagName('tbody')[0];
    var newRow   = tableRef.insertRow(tableRef.rows.length);
    
    var temp=0;
    for (var i=0; i<mapLayers.length; i++) {
        if (mapLayers[i].name == name) {
            temp = i;
        }
    }
    var isTemp = mapLayers[temp].isTemp;
    var hasQueryText = mapLayers[temp].query;
    var hasEndpoint = mapLayers[temp].endpoint;
    var hasURI = mapLayers[temp].uri;
    
    //Create Show/Hide checkbox
    var newCell  = newRow.insertCell(0);
    var element = document.createElement("input");
    element.type = "checkbox";
    element.checked = true;
    element.id = "shBox" + name;
    element.onclick = function () {
        var box = document.getElementById("shBox"+name);
	    var temp = map.getLayersByName(name);
	    
	    if (box.checked) {
	        temp[0].setVisibility(true);
	    }
	    else{
	        temp[0].setVisibility(false);
	    }
	    
    };
    newCell.appendChild(element);
    if (hasURI == 'null'){
    	element.disabled = true;
    }
    
    //Add Layer Name
    newCell  = newRow.insertCell(1);
    var layerName  = document.createTextNode(name);
    newCell.appendChild(layerName);

    ////////////////////////////////////////////////////////
    //Create function buttons
    newCell  = newRow.insertCell(2);
    var groupButtons = document.createElement("div");
    groupButtons.setAttribute("id", "buttonsG");
    groupButtons.setAttribute("class", "btn-group btn-group-sm");
    groupButtons.setAttribute("role", "group");
    groupButtons.setAttribute("aria-label", "...");
    
    //Zoom
    element = document.createElement("button");
    element.type = "button";
    element.title = "Zoom to layer";
    element.innerHTML = '<i class="fa fa-search-plus fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");  
    element.onclick = function () {
    	popupClose(0);
        var temp = map.getLayersByName(name);

        if (typeF === "geotiff") {
       		map.zoomToExtent(temp[0].extent);
       	}
       	else if (typeF === "wms"){
       		zoomToBountyBoxWMS(name);
       	}
       	else {
       		zoomToBountyBox(temp[0]);
       	}
        
        showMap();
    };
	groupButtons.appendChild(element);
    if (hasURI == 'null'){
    	element.disabled = true;
    }
    
    //Layer info button
    element = document.createElement("button");
    element.type = "button";
    element.title = "Layer information";
    element.innerHTML = '<i class="fa fa-info fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");
    element.setAttribute("data-toggle", "modal");
    element.setAttribute("data-target", "#layerInformationModal");
    element.onclick = function () {
    	var layerPosition = -1;
    	for (var i=0; i<mapLayers.length; i++) {
            if (mapLayers[i].name == name) {
            	layerPosition = i;
            	break;
            }
        }
    	document.getElementById('infoLayerName').innerHTML = mapLayers[layerPosition].name;
    	document.getElementById('infoLayerURI').innerHTML = mapLayers[layerPosition].uri;
    	document.getElementById('infoLayerIsTemp').innerHTML = mapLayers[layerPosition].isTemp;
    	document.getElementById('infoLayerType').innerHTML = mapLayers[layerPosition].type;
    	if (mapLayers[layerPosition].query != "") {
    		document.getElementById('infoLayerQueryDD').style.display = 'block';
    		document.getElementById('infoLayerQuery').value = mapLayers[layerPosition].query;
    	}
    	else {
    		document.getElementById('infoLayerQueryDD').style.display = 'none';
    	}
    	document.getElementById('infoLayerEndpoint').innerHTML = mapLayers[layerPosition].endpoint;
    	document.getElementById('infoLayerFillColor').innerHTML = mapLayers[layerPosition].fillColor;
    	document.getElementById('infoLayerStrokeColor').innerHTML = mapLayers[layerPosition].strokeColor;
    	document.getElementById('infoLayerIconURL').innerHTML = mapLayers[layerPosition].icon;
    	document.getElementById('infoLayerIconSize').innerHTML = mapLayers[layerPosition].iconSize;
    	if (mapLayers[layerPosition].mapId != 0) {
    		document.getElementById('infoLayerMapId').innerHTML = mapLayers[layerPosition].mapId;
    	}
    	else {
    		document.getElementById('infoLayerMapId').innerHTML = null;
    	}
    };
    groupButtons.appendChild(element);
    if (typeF === "user") {
    	element.disabled = true;
    }
    
    //Edit query
    element = document.createElement("button");
    element.type = "button";
    element.title = "View/Edit query";
    element.innerHTML = '<i class="fa fa-pencil-square-o fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");  
    element.setAttribute("data-toggle", "modal");
    element.setAttribute("data-target", "#modalUpdateQuery");
    element.onclick = function () {
        //Add functionality
    	document.getElementById('endpointUrlQueryUpdate').value = hasEndpoint;
    	//document.getElementById('loadEndpointPortUpdate').value = 80;
    	document.getElementById('textQueryUpdate').value = hasQueryText;
    	document.getElementById('layerNameQueryUpdate').value = name;
    	if (isTemp) {
    		document.getElementById('isTemporalQueryUpdate').checked = true;
    	}
    	else {
    		document.getElementById('isTemporalQueryUpdate').checked = false;
    	}
    	tempName = name;
    };
    groupButtons.appendChild(element);
    if (hasQueryText === null || hasQueryText === '') {
    	element.disabled = true;
    }
    
    //Global Styles
    element = document.createElement("button");   
    element.type = "button";
    element.title = "Change global style";
    element.innerHTML = '<i class="fa fa-cube fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");   
    element.setAttribute("data-toggle", "modal");
    element.setAttribute("data-target", "#stylesKMLmodal");
    element.onclick = function (position) {
    	var position=0;
        var table = document.getElementById('layerTable');
        for (var i=0; i<table.rows.length; i++) {
            if (table.rows[i].cells[1].innerHTML == name) {
                position = i;
            }
        }
        showStylesForm(position);
    };
    groupButtons.appendChild(element);
    if ( !((typeF === "kml") || (typeF === "gml")) || hasURI == 'null' ) {
    	element.disabled = true;
    }
    
    //Feature Styles
    element = document.createElement("button");   
    element.type = "button";
    element.title = "Change a feature's style";
    element.innerHTML = '<i class="fa fa-cubes fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");   
    element.setAttribute("data-toggle", "modal");
    element.setAttribute("data-target", "#stylesFeatureModal");
    element.onclick = function (position) {
    	var position=0;
        var table = document.getElementById('layerTable');
        for (var i=0; i<table.rows.length; i++) {
            if (table.rows[i].cells[1].innerHTML == name) {
                position = i;
            }
        }
        showStylesForm(position);
        createModalBody(mapLayers[position].features);
    };
    groupButtons.appendChild(element);
    if ( !((typeF === "kml") || (typeF === "gml")) || hasURI == 'null' ) {
    	element.disabled = true;
    }
    
    //Filter
    element = document.createElement("button");   
    element.type = "button";
    element.title = "Spatial filter";
    element.innerHTML = '<i class="fa fa-filter fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default"); 
    element.onclick = function () {
        setFilters(name);       
    };   
    groupButtons.appendChild(element);
    if ( !((typeF === "kml") || (typeF === "gml")) || hasURI == 'null' ) {
    	element.disabled = true;
    }

    //Z-Buffer(move on top)
    element = document.createElement("button");
    element.type = "button";
    element.title = "Move layer on top in map view";
    element.innerHTML = '<i class="fa fa-level-up fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");
    element.onclick = function () {
        var temp = map.getLayersByName(name);
        moveLayerOnTop(temp[0]);
        showMap();
    };
    groupButtons.appendChild(element);
    if (hasURI == 'null') {
    	element.disabled = true;
    }
    
    //Download file (HTML5: Works in Firefox, Chrome, Android, Crome for Android)
    element = document.createElement("button");
    element.type = "button";
    element.title = "Download layer";
    element.innerHTML = '<i class="fa fa-download fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");
    element.onclick = function () {
    	var layerPosition = -1;
    	for (var i=0; i<mapLayers.length; i++) {
            if (mapLayers[i].name == name) {
            	layerPosition = i;
            	break;
            }
        }
        
        var file = document.createElement('a');
        file.href = mapLayers[layerPosition].uri;
        switch (mapLayers[layerPosition].type) {
        	case 'kml':
        		file.download = mapLayers[layerPosition].name + '.kml';
        		break;
        	case 'gml':
        		file.download = mapLayers[layerPosition].name + '.gml';
        		break;
        	default:
        		file.download = mapLayers[layerPosition].name;
        }
        file.click();    	
    };
    groupButtons.appendChild(element);
    if (typeF == "wms" || typeF === "user") {
    	element.disabled = true;
    }
    
    //Delete    
    element = document.createElement("button");
    element.type = "button";  
    element.title = "Delete layer";
    element.innerHTML = '<i class="fa fa-trash-o fa-lg"></i>';
    element.setAttribute("class", "btn btn-danger btn-xs");
    element.setAttribute("data-toggle", "modal");
    element.setAttribute("data-target", "#confirmDelete");
    element.onclick = function () {
        tempName = name;
    };
    groupButtons.appendChild(element);
    if (typeF === "user") {
    	element.disabled = true;
    }
    
    newCell.appendChild(groupButtons);
}
////////////////////////////

/**
 * Delete a layer after the user confirms it 
 */
function deleteFinal() {
    var tableRef = document.getElementById('layerTable').getElementsByTagName('tbody')[0];
    
    //Remove row from table
    var position=0;
    var table = document.getElementById('layerTable');
    for (var i=0; i<table.rows.length; i++) {
        if (table.rows[i].cells[1].innerHTML == tempName) {
            position = i;
        }
    }

    document.getElementById('alertMsgDelLayer').style.display = 'block';
    setTimeout(function() {$('#alertMsgDelLayer').fadeOut('slow');}, fadeTime);
    
    //For WMS layers remove the control for feature popups
    var indexWMS = -1;
    if (mapLayers[position].type == 'wms') {
    	for (var i=0; i<infoWMS.length; i++) {
    		if (infoWMS[i].layerName == mapLayers[position].name) {
    			infoWMS[i].controlName.deactivate();    	
    	    	map.removeControl(infoWMS[i].controlName);
    	    	indexWMS = i;
    	    	break;
    		}
    		if (indexWMS != -1) {
        		infoWMS.splice(indexWMS, 1);
    		}
    	}
    }
    
    //Close all popups
    popupClose(0);
    
    deleteLayer(tableRef, position, mapLayers[position].isTemp, tempName);
}

/**
 * Delete Layer from map
 */
function deleteLayer(tableRef, position, isTemp, name) {  
	//Renew tables
    tableRef.deleteRow(position);
    
	//Delete the layer from the map
	var temp = map.getLayersByName(name);
	map.removeLayer(temp[0], false);
	//Delete the layer's tabs from color panel
	removeFromColorPanel(name, position);
    
    mapLayers.splice(position, 1);
    
    //If the layer is temporal delete the features from the temporalFeatures table
    if (isTemp) {
    	for (var i=0; i<temporalFeatures.length; i++) {
    		if (temporalFeatures[i].layerName == name) {
    			temporalFeatures[i].dirty = true;
    		}
    	}
    	deleteTimelineEvents(name);
    }
    
    //Zoom to greece if there is no layer
    if (mapLayers.length == 1){
	    map.setCenter(new OpenLayers.LonLat(23.72275, 37.92253).transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject()), 6, true, true);
    }
    
    //Show renewed last modification date and number of layers
    document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;
    
    resetStatsInfo(name);
    
    //Adjust bounds  
	zoomToAll();
}

/**
 * Move layer on top of z-index 
 */
function moveLayerOnTop(layer) {
	for (var i=0; i<mapLayers.length; i++) {
		var temp = map.getLayersByName(mapLayers[i].name);
		map.setLayerIndex(temp[0], layersInitialNum + 1 + i);
    }
	map.setLayerIndex(layer, layersInitialNum + 1 + mapLayers.length );
}

/**
 * Create the contents of KML style feature modal
 */
function createModalBody(featureNames) {
	var divRef = document.getElementById('dynamicData');
	
	//Delete old values from dropdown list
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	var name = featureNames.split(",");	
	for (var i=0; i<name.length-1; i++) {
		var element = document.createElement("option");
		element.value = name[i];
		element.innerHTML = name[i];
		divRef.appendChild(element);
	}   
	
	document.getElementById('color0').style.backgroundColor = colorTable[0];
}

function updateLayerStats(label) {
	var selectDiv = document.getElementById('layerNameStats');
	selectDiv.innerHTML += '<option value="'+label+'">'+label+'</option>';
}

function updateAttrStatsSelect() {
	if (currentLayer != null) {
		for(var i=0; i< currentLayer.features.length; i++) {
			currentLayer.features[i].style = null;     
	    }
		currentLayer.redraw();
	}
	
	var selectDivLayer = document.getElementById('layerNameStats');
	var selectDivAttr = document.getElementById('layerAttributesStats');
	selectDivAttr.innerHTML = '<option value="" disabled selected>Attribute</option>';
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
	var layerName = selectDivLayer.options[selectDivLayer.selectedIndex].value;	
	if (layerName == 'defaultVal') {
		selectDivAttr.disabled = true;
		document.getElementById('downloadStatChart').disabled = true;
		document.getElementById('simple-slider').style.display = 'none';
		return;
	}
	
	var layer = map.getLayersByName(layerName)[0];		
	currentLayer = layer;
	
	for (var i=0; i<layer.features.length; i++) {
		for (var key in layer.features[i].attributes) {
			var attrFound = false;
			if (layer.features[i].attributes.hasOwnProperty(key)) {
				if (key != 'name' && !isNaN(layer.features[i].attributes[key])) {
				//if (key != 'name') {
					for (var j=0; j<selectDivAttr.length; j++) {
						if (selectDivAttr.options[j].value == key) {
							attrFound = true;
							break;
						}
					}
					if (!attrFound) {
						selectDivAttr.innerHTML += '<option value="'+key+'">'+key+'</option>';
					}
				}
			}	
		}			
	}
	
	if (selectDivAttr.length > 1) {
		selectDivAttr.disabled = false;
	}
	
	document.getElementById('downloadStatChart').disabled = true;
}

function resetStatsInfo(label) {
	var selectDivLayer = document.getElementById('layerNameStats');
	for (var i=0; i<selectDivLayer.length; i++) {
		if (selectDivLayer.options[i].value == label) {
			selectDivLayer.remove(i);
		}
	}
	selectDivLayer.value = 'defaultVal';
	
	var selectDivAttr = document.getElementById('layerAttributesStats');
	selectDivAttr.innerHTML = '<option value="" disabled selected>Attribute</option>';
	selectDivAttr.disabled = true;
	document.getElementById('downloadStatChart').disabled = true;	
	
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
}

function getLayerFeatureNames(layer) {
	var featureNames = [];
	for (var i=0; i<layer.features.length; i++) {
		for (var key in layer.features[i].attributes) {
			if (layer.features[i].attributes.hasOwnProperty(key)) {
				if (featureNames.indexOf(key) == -1 && key != 'description') {
					featureNames.push(key);
					break;
				}
			}	
		}			
	}
	
	return featureNames.toString();
}











