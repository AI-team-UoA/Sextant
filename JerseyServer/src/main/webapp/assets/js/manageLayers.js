var tempName;
var testG;
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
	    var temp = null;
		map.getLayers().forEach(function(layer) {
	    	if (layer.get('title') == name) {
	    		temp = layer;
	    	}
	    }); 
	    
	    if (box.checked) {
	        temp.setVisible(true);
	    }
	    else{
	        temp.setVisible(false);
	    }
	    
    };
    newCell.appendChild(element);
    /*if (hasURI == 'null'){
    	element.disabled = true;
    }*/
    
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
        map.getLayers().forEach(function(layer) {
        	if (layer.get('title') == name) {
        		switch(typeF) {
	        		case 'kml':
	        			map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
	        			break;
	        		case 'json':
	        			map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
	        			break;
	        		case 'geojson':
	        			map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
	        			break;
	        		case 'topojson':
	        			map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
	        			break;
	        		case 'geotiff':	        			
	        			var parse = mapLayers[temp].imageBbox.split(',');
	        			var extent = [Number(parse[2]), Number(parse[3]), Number(parse[4]), Number(parse[5])];
	        			map.getView().fit(extent, map.getSize());
	        			break;
	        		case 'wms':
	        			map.getView().fit(mapLayers[temp].imageBbox, map.getSize());
	        			break;
        		}
        	}
        });     
    };
	groupButtons.appendChild(element);
    /*if (hasURI == 'null'){
    	element.disabled = true;
    }*/
    
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
    /*if (typeF === "user") {
    	element.disabled = true;
    }*/
    
    //Edit query - Temporal WMS
    if (typeF.substring(0,3) == "wms" && isTemp) {
    	//Temporal WMS interface
    	element = document.createElement("button");
	    element.type = "button";
	    element.title = "Update WMS TIME";
	    element.innerHTML = '<i class="fa fa-pencil-square-o fa-lg"></i>';
	    element.setAttribute("class", "btn btn-xs btn-default");  
	    element.onclick = function () {
	    	//Add functionality
	    	var timeStampWMS = mapLayers[temp].type.split(',')[3];
	    	document.getElementById('WMSid').innerHTML = '<b>WMS layer: </b>'+name;
	    	document.getElementById('currentTimeWMS').innerHTML = '<b>TIME: </b>'+timeStampWMS;
	    	document.getElementById('timePanelWMS').style.display = 'block';
	    	
	    	if (animateTimeline == 1) {
		    	animateTimePanel();
	    	}
	    	if (animateStats == 1) {
		    	animateStatsPanel();
	    	}
	    	
	    	tempName = name;
	    };
    }
	else {
		//Update query interface
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
	}   
    groupButtons.appendChild(element);
    if (hasQueryText == null || hasQueryText == '') {
    	element.disabled = true;
    }
    if (typeF.substring(0,3) == "wms" && isTemp) {
    	element.disabled = false;
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
    if ( !((typeF == "kml") || (typeF == "gml") || (typeF == "geojson") || (typeF == "topojson")) ) {
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
    if ( !((typeF === "kml") || (typeF === "gml") || (typeF === "geojson") || (typeF === "topojson")) ) {
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
    if ( !((typeF === "kml") || (typeF === "gml") || (typeF === "geojson") || (typeF === "topojson")) ) {
    	element.disabled = true;
    }

    //Z-Buffer(move on top)
    element = document.createElement("button");
    element.type = "button";
    element.title = "Move layer on top in map view";
    element.innerHTML = '<i class="fa fa-level-up fa-lg"></i>';
    element.setAttribute("class", "btn btn-xs btn-default");
    element.onclick = function () {
        map.getLayers().forEach(function(layer) {
        	if (layer.get('title') == name) {
                layer.setZIndex(1);
        	}
        	else {
        		layer.setZIndex(0);
        	}
        }); 
        featureOverlay.setZIndex(5);
    };
    groupButtons.appendChild(element);
    /*if (hasURI == 'null') {
    	element.disabled = true;
    }*/
    
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
    if (typeF.substring(0,3) == "wms") {
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
    
    deleteLayer(tableRef, position, mapLayers[position].isTemp, tempName);
}

/**
 * Delete Layer from map
 */
function deleteLayer(tableRef, position, isTemp, name) {  
	//Renew tables
    tableRef.deleteRow(position);
    
	//Delete the layer from the map
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == name) {
    		map.removeLayer(layer);
    	}
    }); 
	
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
    
    //Show renewed last modification date and number of layers
    document.getElementById('infoNumOfLayers').innerHTML = mapLayers.length;
    
    resetStatsInfo(name);
    
    //CLose popup and clear selected features
    mapSelectInterraction.getFeatures().clear();
    clearPopup();
}















