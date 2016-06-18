/**
 * Table of 15 colors to use for styling
 */
var colorTable = ["#FF0014", "#FFF014", "#00FF78", "#00A078", "#F03C78",
                  "#0078FF", "#B478FF", "#F078D2", "#14FFF0", "#960014",
                  "#145A00", "#1478B4", "#140078", "#142800", "#008278"];
var currentColor = 0;

/**
 * Change styles for a given KML layer
 */
//Temp variable that gets the position of the layer we will change in the mapLayers table
var pos = -1;
function showStylesForm(position){
	pos = position;
}

function changeStyles() {
	//Get the values from the form
	var iconUrl = $('#iconUrl').val();
    var iconSize = $('#iconSize').val();
    var strokeColor = ( ($('#strokeColorID').val() != "") ? ('#' + $('#strokeColorID').val()) : '#ff9900');
    var strokeWidth = ( ($('#strokeWidth').val() != "") ? $('#strokeWidth').val() : 1);
    var fillColor = ( ($('#fillColorID').val() != "") ? ('#' + $('#fillColorID').val()) : '#ff9900');
    
    var localFile = document.getElementById('iconName').files[0];
    
    var iconFileURL = createURL(localFile);
    //Create a URL for the localfile
    if(typeof localFile != 'undefined') {
    	var name = iconUrl.substring(0, iconUrl.lastIndexOf('.'));
    	var type = iconUrl.substring(iconUrl.lastIndexOf('.')+1, iconUrl.length);
    	
    	iconUrl = iconFileURL.toString();  	
    	//Upload the icon file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
    	uploadLocalFileToServer(localFile, name, pos, type, function(results) {        	
        	//Update the layer colors
    		var index = this.layerName;
        	mapLayers[index].fillColor = fillColor;
        	mapLayers[index].strokeColor = strokeColor;
        	mapLayers[index].icon = results;
        	mapLayers[index].iconSize = iconSize;
        			   
            //Update timeline colors
            timelineSetColors(mapLayers[index].name, results, fillColor);        	
        });      
    }
    else {
    	//Update the layer colors
    	mapLayers[pos].fillColor = fillColor;
    	mapLayers[pos].strokeColor = strokeColor;
    	mapLayers[pos].icon = iconUrl;
    	mapLayers[pos].iconSize = iconSize;
    			   
        //Update timeline colors
        timelineSetColors(mapLayers[pos].name, iconUrl, fillColor);
    }
    
    var imageStyle = new ol.style.Circle({
	    fill: new ol.style.Fill({
	    	color: hex2rgb(fillColor, 0.4)
    	}),
    	radius: 5,
    	stroke: new ol.style.Stroke({
    		color: strokeColor,
    	    width: strokeWidth
    	})
    });
    
    if (typeof localFile != 'undefined') {
    	//Use icon for image style
    	if (iconSize == '') {iconSize = 1;}
    	imageStyle = new ol.style.Icon({
            anchor: [0.5, 0.5],
            offset: [0, 0],
            opacity: 1,
            scale: Number(iconSize),
            src: iconUrl
        });
    }   
    
    var newStyle = new ol.style.Style({
    	stroke: new ol.style.Stroke({
            color: strokeColor,
            width: strokeWidth
        }),
        fill: new ol.style.Fill({
            color: hex2rgb(fillColor, 0.4)
        }),
        image: imageStyle
    });
    
    map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == mapLayers[pos].name) {
    		layer.getSource().setStyle(newStyle);
    	}
    });
    
    //Remove this layer from Color panel if it has entries, and hide the color panel
    removeFromColorPanel(mapLayers[pos].name, pos);
    closeColorPanel();	 
    
    //Reset form data
    document.getElementById('changeKmlStyles').reset();
    
    //Reset the temp variable 
    pos = -1;
}

/**
 * Change styles of features in KML according to a value in a field
 */
var styleFilters = [];
function styleFeatures() {
	var element = document.getElementById('dynamicData');
	var attrName = element.options[element.selectedIndex].value;
	var startInterval, endInterval;
	
	var dataElement = document.getElementById('dataType');
	var dataType = dataElement.options[dataElement.selectedIndex].value;

    var name = mapLayers[pos].name;	   
	
	//Delete the feature from the color panel if it exist
	removeFromColorPanel(name, pos);
	
	//Create the layerInfo in the color panel
	addColorPanel(attrName, -1, 0, 0, name);
	
	//Create the rules according to input form
	styleFilters = [];
	for (var i=0; i<=currentColor; i++) {
		startInterval = document.getElementById('start'+i).value;
		endInterval = document.getElementById('end'+i).value;
		var selectedColor = rgb2hex(document.getElementById('color'+i).style.backgroundColor);
		
		var newFilter = new styleFilter(startInterval, endInterval, dataType, selectedColor, attrName);
		styleFilters.push(newFilter);
		
		//add color to colorPanel
		addColorPanel(attrName, i, startInterval, endInterval, name);		
	}
	
    //Update the layer colors to default. This colorization is not saved
	mapLayers[pos].fillColor = '#ff9900';
	mapLayers[pos].strokeColor = '#ff9900';
	mapLayers[pos].icon = './assets/images/map-pin-md.png';
	mapLayers[pos].iconSize = 10;
	
	//Apply the default style to the layer
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == mapLayers[pos].name) {
    		layer.getSource().setStyle(customStyles);
    	}
    });
	
    //Reset form data
    document.getElementById('changeKmlFeaturesStyles').reset();
    removeIntervals();
    
    document.getElementById('colorPanel').style.display = 'block';
    
    //Reset the temp variable 
    pos = -1;	 
}

function customStyles(feature, resolution) {
	var defaultFeatureStyle = new ol.style.Style({
		stroke: new ol.style.Stroke({
	        color: [160, 160, 160, 1],
	        width: 1
	    }),
	    fill: new ol.style.Fill({
	        color: [160, 160, 160, 0.4]
	    }),
	    image: new ol.style.Circle({
    	    fill: new ol.style.Fill({
    	      color: [160, 160, 160, 0.4]
    	    }),
    	    radius: 5,
    	    stroke: new ol.style.Stroke({
    	      color: [160, 160, 160, 1],
    	      width: 1
    	    })
    	})
	});
	
	for (var i=0; i<styleFilters.length; i++) {
		var startInterval = styleFilters[i].startInterval;
		var endInterval = styleFilters[i].endInterval;
		var selectedColor = styleFilters[i].color;
		var attrName = styleFilters[i].attrName;
		var dataType = styleFilters[i].dataType;
		var s, e;
		
		//If data type is number we do number comparison, else string comparison
		if (dataType === 'number') {
			s = Number(startInterval);
			e = Number(endInterval);
		}
		else {
			s = startInterval.toString();
			e = endInterval.toString();
		}
		
		if (feature.get(attrName) > s && feature.get(attrName) <= e) {
			var newFeatureStyle = new ol.style.Style({
				stroke: new ol.style.Stroke({
			        color: selectedColor,
			        width: 1
			    }),
			    fill: new ol.style.Fill({
			        color: hex2rgb(selectedColor, 0.4)
			    }),
			    image: new ol.style.Circle({
		    	    fill: new ol.style.Fill({
		    	      color: hex2rgb(selectedColor, 0.4)
		    	    }),
		    	    radius: 5,
		    	    stroke: new ol.style.Stroke({
		    	      color: selectedColor,
		    	      width: 1
		    	    })
		    	})
			});
			return [newFeatureStyle];
		}		
	}
		
	return [defaultFeatureStyle];
}

/**
 * Create the a new row for selecting interval. We provide up to 15 colors
 */
function addInterval() {
	var divRef, element;
	//Hide the previous plus button
	document.getElementById('plus'+currentColor).style.display = 'none';
	currentColor ++;	
	
	//Create new row for interval 
	divRef = document.getElementById('intervalForm');
	element = document.createElement('div');
	element.setAttribute('class', 'row');
	element.setAttribute('id', 'row'+currentColor);
	divRef.appendChild(element);
	
	//Add the start box
	divRef = document.getElementById('row'+currentColor);
	element = document.createElement('div');
	element.setAttribute('class', 'col-md-4 col-sm-4 col-xs-6');
	element.setAttribute('id', 'divStart'+currentColor);
	element.setAttribute('style', 'margin-top: 2px');
	divRef.appendChild(element);
	
	divRef = document.getElementById('divStart'+currentColor);
	element = document.createElement('input');	
	element.setAttribute('type', 'text');
	element.setAttribute('class', 'form-control');
	element.setAttribute('placeholder', '(');
	element.setAttribute('id', 'start'+currentColor);
	divRef.appendChild(element);
	
	//Add the end box
	divRef = document.getElementById('row'+currentColor);
	element = document.createElement('div');	
	element.setAttribute('class', 'col-md-4 col-sm-4 col-xs-6');
	element.setAttribute('id', 'divEnd'+currentColor);
	element.setAttribute('style', 'margin-top: 2px');
	divRef.appendChild(element);
	
	divRef = document.getElementById('divEnd'+currentColor);
	element = document.createElement('input');	
	element.setAttribute('type', 'text');
	element.setAttribute('class', 'form-control');
	element.setAttribute('placeholder', ']');
	element.setAttribute('id', 'end'+currentColor);
	element.setAttribute('style', 'text-align: right');	
	divRef.appendChild(element);
	
	//Add the color box
	divRef = document.getElementById('row'+currentColor);
	element = document.createElement('div');	
	element.setAttribute('class', 'col-md-2 col-sm-2 col-xs-3');
	element.setAttribute('id', 'divColor'+currentColor);
	element.setAttribute('style', 'margin-top: 2px');
	divRef.appendChild(element);
	
	divRef = document.getElementById('divColor'+currentColor);
	element = document.createElement('button');	
	element.setAttribute('type', 'button');
	element.setAttribute('class', 'btn btn-md colorPick');
	element.setAttribute('id', 'color'+currentColor);
	element.setAttribute('style', 'background-color: '+colorTable[currentColor]);
	element.innerHTML = 'color';
	divRef.appendChild(element);
	
	if (currentColor <= 13) { 
		//Add the button to create new row
		divRef = document.getElementById('row'+currentColor);
		element = document.createElement('div');	
		element.setAttribute('class', 'col-md-2 col-sm-2 col-xs-3');
		element.setAttribute('id', 'divPlus'+currentColor);
		element.setAttribute('style', 'margin-top: 2px');
		divRef.appendChild(element);	
		
		divRef = document.getElementById('divPlus'+currentColor);
		element = document.createElement('button');	
		element.setAttribute('type', 'button');
		element.setAttribute('class', 'btn btn-lg btn-default btn-block');
		element.setAttribute('onclick', 'addInterval()');
		element.setAttribute('id', 'plus'+currentColor);
		element.innerHTML = '+';
		divRef.appendChild(element);
	}
	
	//Enable colorpick for the color button
	$('#color'+currentColor).colpick({
		layout:'hex',
		colorScheme:'dark',
		onSubmit:function(hsb,hex,rgb,el) {
			$(el).css('background-color','#'+hex);
			$(el).val(hex);
			$(el).colpickHide();
		}
	});
}

/**
 * Remove all intervals from form when the submit is done
 */
function removeIntervals() {
	var divRef = document.getElementById('intervalForm');
	for(var i=1; i<=currentColor; i++) {
		var element = document.getElementById('row'+i);		
		divRef.removeChild(element);
	}
	
	document.getElementById('plus0').style.display = 'block';
	currentColor = 0;

}

/**
 * Create color panel info
 */
function addColorPanel(featureName, currentColor, startInterval, endInterval, layerName) {	
	var panel, panelElement;
	
	if(currentColor == -1) {		
		panel = document.getElementById('colorPanelBody');
		panelElement = document.createElement('div');
		panelElement.setAttribute('id', layerName+featureName);
		panel.appendChild(panelElement);
		
		panel = document.getElementById(layerName+featureName);
		panelElement = document.createElement('label');	
		panelElement.innerHTML = '<br>Layer: '+layerName+'<br>Feature: '+featureName;
		panelElement.setAttribute('style', 'text-align: left');
		panelElement.style.fontSize = '12px';	
		panel.appendChild(panelElement);
	}
	else {
		//Create a new row
		panel = document.getElementById(layerName+featureName);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'row');
		panelElement.setAttribute('id', 'row'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
		
		//Add color box to row
		panel = document.getElementById('row'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-3 col-sm-3 col-xs-6');
		panelElement.setAttribute('id', 'divColorId'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
		
		panel = document.getElementById('divColorId'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('button');	
		panelElement.setAttribute('type', 'button');
		panelElement.setAttribute('class', 'btn btn-xs');
		panelElement.setAttribute('id', 'colorP'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'background-color: '+rgb2hex(document.getElementById('color'+currentColor).style.backgroundColor));
		panelElement.innerHTML = 'color';
		panel.appendChild(panelElement);
		
		//Add the interval for the color
		panel = document.getElementById('row'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-9 col-sm-9 col-xs-12');
		panelElement.setAttribute('id', 'divInterval'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
						
		panel = document.getElementById('divInterval'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('label');	
		panelElement.innerHTML = '( '+startInterval+',  '+endInterval+' ]';
		panelElement.style.fontSize = '15px';	
		panel.appendChild(panelElement);
	}
}

/**
 * Remove a feature tab from the color panel in case we want to create
 * new coloring on this feature.
 */
function removeDuplicateFeature(attrName, layerName) {
	var divRef = document.getElementById('colorPanelBody');
	var element = document.getElementById(layerName+attrName);		
	if (element) { divRef.removeChild(element); }
}

/**
 * Remove the tabs of a layer from the color panel
 */
function removeFromColorPanel(layerName, position) {
	var element;
	var divRef = document.getElementById('colorPanelBody');
	
	//Remove KML feature legends
	var names = mapLayers[position].features.split(",");	
	for (var i=0; i<names.length-1; i++) {
		element = document.getElementById(layerName+names[i]);
		if (element) { divRef.removeChild(element); }
	}
	
	//Remove WMS legends
	element = document.getElementById('WMSlegend'+layerName);
	if (element) { divRef.removeChild(element); }
}

/**
 * Convert KML(AABBGGRR) color codes to HTML(#RRGGBB)
 */
function convertColor(kmlColor) {
	//The color is in HTML format
	if (kmlColor.length == 7){
		return kmlColor;
	}
	
	//Error so we set default colors
	if (kmlColor.length != 8){
		return "";
	}
	
	var rr = kmlColor.slice(6, 8);
	var gg = kmlColor.slice(4, 6);
	var bb = kmlColor.slice(2, 4);
	
	return ('#' + rr + gg + bb) ;
}


function rgb2hex(rgb) {
    rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }
    return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
}

function hex2rgb(hex, opacity) {
    var h=hex.replace('#', '');
    h =  h.match(new RegExp('(.{'+h.length/3+'})', 'g'));

    for(var i=0; i<h.length; i++)
        h[i] = parseInt(h[i].length==1? h[i]+h[i]:h[i], 16);

    if (typeof opacity != 'undefined')  h.push(opacity);

    return h;
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
	for (var i=0; i<name.length; i++) {
		var element = document.createElement("option");
		element.value = name[i];
		element.innerHTML = name[i];
		divRef.appendChild(element);
	}   
	
	document.getElementById('color0').style.backgroundColor = colorTable[0];
}







