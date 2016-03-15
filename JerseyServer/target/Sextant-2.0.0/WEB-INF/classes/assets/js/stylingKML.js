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
	//document.getElementById('changeKmlStyles').style.display = 'block';
	pos = position;
}

function changeStyles() {
	//Get the values from the form
	var iconUrl = $('#iconUrl').val();
    var iconSize = $('#iconSize').val();
    var strokeColor = '#' + $('#strokeColorID').val();
    var strokeWidth = $('#strokeWidth').val();
    var fillColor = '#' + $('#fillColorID').val();
    
    var localFile = document.getElementById('iconName').files[0];
    //Create a URL for the localfile
    if (localFile) {
    	var fileURL = window.URL.createObjectURL(localFile);
    }
    
    //First get the path from user. If localfile is chosen, get its url instead.
    var urlTemp = iconUrl;
    if(localFile) {
    	urlTemp = fileURL;
    }
        
    //Create style and set default values for emplty elements
    var myStyles = new OpenLayers.Style({
        strokeColor: "${strokeColor}",
        strokeWidth: ( (strokeWidth != "") ? strokeWidth : 1),
        fillColor: "${fillColor}",
        pointRadius: "${pointRadius}",
        externalGraphic: "${externalGraphic}",
        graphicOpacity: 1,
        fillOpacity: 0.3,
        strokeOpacity: 1,
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
					return ( (iconSize != "") ? iconSize : 20);
				}
			},
			fillColor: function(feature) {
				if (typeof feature.cluster != 'undefined') {
			    	if(feature.cluster.length > 1) {
			            return '#66FFCC'; 
			    	}
				}
				else {
					return ( (fillColor != "#") ? fillColor : "#FFB414");
				}
			},
			externalGraphic: function(feature) {
				if (typeof feature.cluster != 'undefined') {
			    	if(feature.cluster.length > 1) {
			            return ""; 
			    	}
				}
				else {
					return ( (urlTemp != "") ? urlTemp : "./assets/images/map-pin-md.png");
				}
			},
			strokeColor: function(feature) {
				if (typeof feature.cluster != 'undefined') {
			    	if(feature.cluster.length > 1) {
			            return '#25375C'; 
			    	}
				}
				else {
					return ( (strokeColor != "#") ? strokeColor : "#FFB414");
				}
			}		
    }
    });
    
    document.getElementById('alertMsgStyleLayerWait').style.display = 'block';
    showSpinner(colorSpin);
    
    var thesi = pos;
    var name = mapLayers[thesi].name;
 
    var sm = new OpenLayers.StyleMap({"default": myStyles, "select":clickFeatureStyle});
    var temp = map.getLayersByName(name);
    temp[0].style = null;
    temp[0].styleMap = sm;
    temp[0].redraw();
    
    //Update the layer colors
    for (var i=0; i<mapLayers.length; i++) {
		if (mapLayers[i].name === name) {
			if (fillColor != '#') {mapLayers[i].fillColor = fillColor;}
			if (strokeColor != '#') {mapLayers[i].strokeColor = strokeColor;}
			if (iconUrl != '' && !localFile) {mapLayers[i].icon = iconUrl;}
			if (iconSize != '') {mapLayers[i].iconSize = iconSize;}
			
			break;
		}
	}
    
    //Update timeline colors
    timelineSetColors(name, urlTemp, fillColor);
    
    //Remove this layer from Color panel if it has entries, and hide the color panel
    removeFromColorPanel(name, thesi);
    closeColorPanel();
    
	showMap();
	setTimeout(function() {$('#alertMsgStyleLayerWait').fadeOut('slow');}, fadeTime);
	hideSpinner();	 
    
    //Reset form data
    document.getElementById('changeKmlStyles').reset();
    
    //Reset the temp variable 
    pos = -1;
}

/**
 * Change styles of features in KML according to a value in a field
 */
function styleFeatures() {
	var element = document.getElementById('dynamicData');
	var attrName = element.options[element.selectedIndex].value;
	var startInterval, endInterval;
	var allRules = [];
	
	var dataElement = document.getElementById('dataType');
	var dataType = dataElement.options[dataElement.selectedIndex].value;
    
	//Removed the filter to make it a general rule
	var globalRule = new OpenLayers.Rule ({
		symbolizer: {
			strokeColor : "#A0A0A0",
			fillColor : "#A0A0A0",
			strokeWidth: 1,
			iconSize : 10,
			urlTemp : "./assets/images/map-pin-md.png",
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRules.push(globalRule);   

    var thesi = pos;
    var name = mapLayers[thesi].name;
	
    document.getElementById('alertMsgStyleLayerWait').style.display = 'block';
    showSpinner(colorSpin);
	
	//Delete the feature from the color panel if it exist
	//removeDuplicateFeature(attrName, name);
	removeFromColorPanel(name, thesi);
	
	//Create the layerInfo in the color panel
	addColorPanel(attrName, -1, 0, 0, name);
	
	//Create the rules according to input form
	for (var i=0; i<=currentColor; i++) {
		startInterval = document.getElementById('start'+i).value;
		endInterval = document.getElementById('end'+i).value;
		
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
		
		var myRule = new OpenLayers.Rule ({
			filter: new OpenLayers.Filter.Logical ({
				type: OpenLayers.Filter.Logical.AND,
				filters: [ 
				           new OpenLayers.Filter.Comparison ({
				        	   type: OpenLayers.Filter.Comparison.GREATER_THAN,
				        	   property: attrName,
				        	   value: s
						   }),
						   new OpenLayers.Filter.Comparison ({
				        	   type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
				        	   property: attrName,
				        	   value: e
						   })
				         ]
			}),
			symbolizer: {
				fillColor: rgb2hex(document.getElementById('color'+i).style.backgroundColor),
				strokeColor: rgb2hex(document.getElementById('color'+i).style.backgroundColor),
				strokeWidth: 1,
				iconSize : 20,
				fillOpacity: 0.3,
		        strokeOpacity: 1
			}
		});
		
		allRules.push(myRule);
		
		//add color to colorPanel
		addColorPanel(attrName, i, startInterval, endInterval, name);
		
	}
	
	//add the rule to the style
	var temp = map.getLayersByName(name);
	temp[0].styleMap.styles.default.addRules(allRules);
	temp[0].redraw();
	
    
    //Update the layer colors to default. This colorization is not saved
    for (var i=0; i<mapLayers.length; i++) {
		if (mapLayers[i].name === name) {
			mapLayers[i].fillColor = '#FFB414';
			mapLayers[i].strokeColor = '#FFB414';
			mapLayers[i].icon = './assets/images/map-pin-md.png';
			mapLayers[i].iconSize = 20;
			
			break;
		}
	}
	
    showMap();
	setTimeout(function() {$('#alertMsgStyleLayerWait').fadeOut('slow');}, fadeTime);
	hideSpinner();
	
    //Reset form data
    document.getElementById('changeKmlFeaturesStyles').reset();
    removeIntervals();
    
    document.getElementById('colorPanel').style.display = 'block';
    
    //Reset the temp variable 
    pos = -1;
	 
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









