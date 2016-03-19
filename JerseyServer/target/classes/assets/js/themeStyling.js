//temporal layers: markers, polylines

var allRulesThemes = [];

function styleFeaturesTheme(name) {
	var position = 0;
    for (var i=0; i<mapLayers.length; i++) {
        if (mapLayers[i].name == name) {
        	position = i;
        	break;
        }
    }
	
    allRulesThemes = [];
		
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
	allRulesThemes.push(globalRule);
	
	//Delete the feature from the color panel if it exist
	removeFromColorPanel(name, position);
	
	switch(name) {
		case 'fuel':
			swefsRulesTemplate1(name);
			showColorPanel();
			break;
		case 'Cameras':
			swefsRulesTemplate2(name);
			showColorPanel();
			break;
		case 'query2':
			leoRulesTemplate1(name);
			showColorPanel();
			break;
		default:
			return 0;	
	}
    
	//Re-render the layer with the new styles
    var temp = map.getLayersByName(name);
	temp[0].styleMap.styles.default.addRules(allRulesThemes);
	temp[0].redraw();
    
    //Update the layer colors to default. This colorization is not saved
    for (var i=0; i<mapLayers.length; i++) {
		if (mapLayers[i].name === name) {
			mapLayers[i].fillColor = '#FFB414';
			mapLayers[i].strokeColor = '#FFB414';
			mapLayers[i].icon = './assets/images/map-pin-md.png';
			mapLayers[i].iconSize = 10;
			
			break;
		}
	}
}

function swefsRulesTemplate1(name) {
	var attrName = 'fuelTypeId', textInfo;
	var startInterval, endInterval = null;
	
	//Create the layerInfo in the color panel
	addColorPanelThemes(attrName, -1, 0, 0, name, null, null, null);
	
	/******************************************/
	startInterval = 0;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#C0C0C0',
			strokeColor: '#C0C0C0',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#C0C0C0', startInterval, endInterval, name, 'No fuel', null, null);
	/******************************************/
	startInterval = 1;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#66CC00',
			strokeColor: '#66CC00',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#66CC00', startInterval, endInterval, name, 'Short grass (0.3m)', null, null);
	/******************************************/
	startInterval = 4;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#006600',
			strokeColor: '#006600',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#006600', startInterval, endInterval, name, 'Chaparral (1.8m)', null, null);
	/******************************************/
	startInterval = 6;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#666600',
			strokeColor: '#666600',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#666600', startInterval, endInterval, name, 'Dormant brush, hard-wood slash', null, null);
	/******************************************/
	startInterval = 8;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#FF9933',
			strokeColor: '#FF9933',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#FF9933', startInterval, endInterval, name, 'Closed timber litter', null, null);
	/******************************************/
	startInterval = 10;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#CC6600',
			strokeColor: '#CC6600',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#CC6600', startInterval, endInterval, name, 'Timber (litter and understory)', null, null);
	/******************************************/
}

function swefsRulesTemplate2(name) {
	var attrName = 'fireProbability', textInfo;
	var startInterval, endInterval;
	
	//Create the layerInfo in the color panel
	addColorPanelThemes(attrName, -1, 0, 0, name, null, null, null);
	
	/******************************************/
	startInterval = 0; endInterval = 0.2;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#0000FF',
			strokeColor: '#0000FF',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#0000FF', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 0.2; endInterval = 0.4;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#009900',
			strokeColor: '#009900',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#009900', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 0.4; endInterval = 0.6;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#CCCC00',
			strokeColor: '#CCCC00',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#CCCC00', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 0.6; endInterval = 0.8;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#FF8000',
			strokeColor: '#FF8000',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#FF8000', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 0.8; endInterval = 1;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#FF0000',
			strokeColor: '#FF0000',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#FF0000', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
}

function leoRulesTemplate1(name) {
	var attrName = 'hasCV';
	var startInterval, endInterval;
	
	//Create the layerInfo in the color panel
	addColorPanelThemes(attrName, -1, 0, 0, name, null, null, null);
	
	/******************************************/
	startInterval = 0; endInterval = 10;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#00BFFF',
			strokeColor: '#00BFFF',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#00BFFF', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 10; endInterval = 30;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#90EE90',
			strokeColor: '#90EE90',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#90EE90', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 30; endInterval = 60;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#FFFF00',
			strokeColor: '#FFFF00',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#FFFF00', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 60; endInterval = 80;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#FF6347',
			strokeColor: '#FF6347',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#FF6347', startInterval, endInterval, name, '', '[', ')');
	/******************************************/
	startInterval = 80; endInterval = 100;
	var myRule = new OpenLayers.Rule ({
		filter: new OpenLayers.Filter.Logical ({
			type: OpenLayers.Filter.Logical.AND,
			filters: [ 
			           new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.GREATER_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: startInterval
					   }),
					   new OpenLayers.Filter.Comparison ({
			        	   type: OpenLayers.Filter.Comparison.LESS_THAN_OR_EQUAL_TO,
			        	   property: attrName,
			        	   value: endInterval
					   })
			         ]
		}),
		symbolizer: {
			fillColor: '#8B008B',
			strokeColor: '#8B008B',
			strokeWidth: 1,
			iconSize : 10,
			graphicOpacity: 1,
			fillOpacity: 0.3,
	        strokeOpacity: 1
		}
	});	
	allRulesThemes.push(myRule);	
	//add color to colorPanel
	addColorPanelThemes(attrName, '#8B008B', startInterval, endInterval, name, '', '[', ']');
	/******************************************/
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