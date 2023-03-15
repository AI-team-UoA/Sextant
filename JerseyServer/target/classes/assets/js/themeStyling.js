//temporal layers: markers, polylines

var allRulesThemes = [];

function customStylesDemo(feature, resolution) {
	var newFeatureStyle = null;
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
	
	for (var i=0; i<allRulesThemes.length; i++) {
		var startInterval = allRulesThemes[i].startInterval;
		var endInterval = allRulesThemes[i].endInterval;
		var selectedColor = allRulesThemes[i].color;
		var attrName = allRulesThemes[i].attrName;
		var dataType = allRulesThemes[i].dataType;
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
			newFeatureStyle = new ol.style.Style({
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


function styleFeaturesTheme(name) {
	var position = 0;
    for (var i=0; i<mapLayers.length; i++) {
        if (mapLayers[i].name == name) {
        	position = i;
        	break;
        }
    }
	
    //allRulesThemes = [];
	
	//Delete the feature from the color panel if it exist
	removeFromColorPanel(name, position);
	
	switch(name) {
		case 'LAI':
			laiRulesTemplate(name);
			showColorPanel();
			break;
		case 'Instances per CLC category':
			clcRulesTemplate(name);
			showColorPanel();
			break;
		default:
			return 0;	
	}
    
	//Re-render the layer with the new styles
	//Apply the default style to the layer
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == name) {
    		layer.getSource().setStyle(customStylesDemo);
    	}
    });
}

function laiRulesTemplate(name) {	
	var attrName = 'lai';
	var startInterval, endInterval, selectedColor;
	
	//Create the layerInfo in the color panel
	addColorPanel(attrName, -1, 0, 0, name);
	
	/******************************************/
	startInterval = 0; endInterval = 0.1; selectedColor = colorTable[0];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanel(attrName, 0, startInterval, endInterval, name);
	/******************************************/
	startInterval = 0.1; endInterval = 0.2; selectedColor = colorTable[1];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanel(attrName, 1, startInterval, endInterval, name);
	/******************************************/
	startInterval = 0.2; endInterval = 0.3; selectedColor = colorTable[2];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanel(attrName, 2, startInterval, endInterval, name);
	/******************************************/
	startInterval = 0.3; endInterval = 0.5; selectedColor = colorTable[11];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanel(attrName, 11, startInterval, endInterval, name);
	/******************************************/
	startInterval = 0.5; endInterval = 1; selectedColor = colorTable[6];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanel(attrName, 6, startInterval, endInterval, name);
	/******************************************/
}

function clcRulesTemplate(name) {	
	var attrName = 'instances';
	var startInterval, endInterval, selectedColor;
	
	//Create the layerInfo in the color panel
	addColorPanel(attrName, -1, 0, 0, name);
	
	/******************************************/
	startInterval = 24.9;
	endInterval = 25;
	selectedColor = colorTable[15];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 15, 'continuousUrbanFabric', name);
	/******************************************/
	startInterval = 18.9;
	endInterval = 19; 
	selectedColor = colorTable[16];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 16, 'industrialOrCommercialUnits', name);
	/******************************************/
	startInterval = 14.9; 
	endInterval = 15; 
	selectedColor = colorTable[17];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 17, 'roadAndRailNetworksAndAssociatedLand', name);
	/******************************************/
	startInterval = 9.9; 
	endInterval = 10; 
	selectedColor = colorTable[18];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 18, 'waterCourses', name);
	/******************************************/
	startInterval = 12.9; 
	endInterval = 13; 
	selectedColor = colorTable[19];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 19, 'discontinuousUrbanFabric', name);
	/******************************************/
	startInterval = 15.9; 
	endInterval = 16; 
	selectedColor = colorTable[20];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 20, 'greenUrbanAreas', name);
	/******************************************/
	startInterval = 5.9; 
	endInterval = 6; 
	selectedColor = colorTable[21];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 21, 'sportAndLeisureFacilities', name);
	/******************************************/
	startInterval = 0.9; 
	endInterval = 1; 
	selectedColor = colorTable[22];
	var newFilter = new styleFilter(startInterval, endInterval, 'number', selectedColor, attrName);
	allRulesThemes.push(newFilter);
	
	//add color to colorPanel
	addColorPanelString(attrName, 22, 'waterBodiesL3', name);
}

/**
 * Create color panel info
 */
function addColorPanelString(featureName, currentColor, info, layerName) {	
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
		panelElement.setAttribute('id', 'row'+layerName+currentColor+featureName+info);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
		
		//Add color box to row
		panel = document.getElementById('row'+layerName+currentColor+featureName+info);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-3 col-sm-3 col-xs-6');
		panelElement.setAttribute('id', 'divColorId'+layerName+currentColor+featureName+info);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
		
		panel = document.getElementById('divColorId'+layerName+currentColor+featureName+info);
		panelElement = document.createElement('button');	
		panelElement.setAttribute('type', 'button');
		panelElement.setAttribute('class', 'btn btn-xs');
		panelElement.setAttribute('id', 'colorP'+layerName+currentColor+featureName+info);
		panelElement.setAttribute('style', 'background-color: '+colorTable[currentColor]);
		panelElement.innerHTML = 'color';
		panel.appendChild(panelElement);
		
		//Add the interval for the color
		panel = document.getElementById('row'+layerName+currentColor+featureName+info);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-9 col-sm-9 col-xs-12');
		panelElement.setAttribute('id', 'divInterval'+layerName+currentColor+featureName+info);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
						
		panel = document.getElementById('divInterval'+layerName+currentColor+featureName+info);
		panelElement = document.createElement('label');	
		panelElement.innerHTML = '[ '+info+' ]';
		panelElement.style.fontSize = '15px';	
		panel.appendChild(panelElement);
	}
}

/**
 * Create color panel info
 */
function addColorPanelThemes(featureName, currentColor, startInterval, endInterval, layerName, legendText, startSymbol, endSymbol) {	
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
		panelElement.setAttribute('class', 'col-md-3 col-sm-3 col-xs-4');
		panelElement.setAttribute('id', 'divColorId'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
		
		panel = document.getElementById('divColorId'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('button');	
		panelElement.setAttribute('type', 'button');
		panelElement.setAttribute('class', 'btn btn-xs');
		panelElement.setAttribute('id', 'colorP'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'background-color: '+ currentColor);
		panelElement.innerHTML = 'color';
		panel.appendChild(panelElement);
		
		//Add the interval for the color
		panel = document.getElementById('row'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-3 col-sm-3 col-xs-4');
		panelElement.setAttribute('id', 'divInterval'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
						
		panel = document.getElementById('divInterval'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('label');	
		if (endInterval != null) {			
				panelElement.innerHTML = startSymbol + ' ' + startInterval + ',  ' + endInterval + ' ' + endSymbol;			
		}
		else {
			panelElement.innerHTML = startInterval;
		}
		panelElement.style.fontSize = '15px';	
		panel.appendChild(panelElement);
		
		//Add the text info for the interval
		panel = document.getElementById('row'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('div');
		panelElement.setAttribute('class', 'col-md-6 col-sm-6 col-xs-10');
		panelElement.setAttribute('id', 'divTextInfo'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement.setAttribute('style', 'margin-top: 2px');
		panel.appendChild(panelElement);
						
		panel = document.getElementById('divTextInfo'+layerName+currentColor+featureName+startInterval+endInterval);
		panelElement = document.createElement('label');	
		panelElement.innerHTML = legendText;
		panelElement.style.fontSize = '15px';	
		panel.appendChild(panelElement);
	}
}