function loadMapFilterLayer() {
	$('#modalSpatialFilterLayer').on('shown.bs.modal', function () {
		resetFilterMapForm();
		initSearchMapFilter();
	});
}

function initSearchMapFilter() {
	//document.getElementById('searchMapExtentFormFilter').style.display = 'block';
	//document.getElementById('drawExtentButtonFilter').disabled = true;	
		
	//Initialize map
	var currentView = map.getView().getCenter();
	mapFilter = new ol.Map({
        layers: [bingAerialLabels, vector],
        target: 'mapExtentFilter',
        view: new ol.View({
          center: currentView,
          zoom: 6
        })
    });
	
	document.getElementsByClassName('ol-zoom')[0].style.top = '10px';
	document.getElementsByClassName('ol-zoom')[0].style.left = '10px';
   
    addInteraction();
}

function resetFilterMapForm() {	
	var divRef = document.getElementById('mapExtentFilter');
	
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}	
	
	//document.getElementById('searchMapExtentFormFilter').style.display = 'none';
	//document.getElementById('drawExtentButtonFilter').disabled = false;
	
	document.getElementById('filterSearchForm').reset();
	
	vector.getSource().clear();
}
//////////////////////////
function setFilters(name) {
	document.getElementById('layerID').innerHTML = name;
	//enableCountriesLayer();	
	
	loadMapFilterLayer();
	$('#modalSpatialFilterLayer').modal('show');
}

function applySpatialFilterLayer() {
	var name = document.getElementById('layerID').innerHTML;
	//var filterValueCountry = document.getElementById('layerSpatialFilterValue1').options[document.getElementById('layerSpatialFilterValue1').selectedIndex].value;	
	//var filterValueRegion = document.getElementById('layerSpatialFilterValue2').options[document.getElementById('layerSpatialFilterValue2').selectedIndex].value;	
	//var filterValueRegionUnit = document.getElementById('layerSpatialFilterValue3').options[document.getElementById('layerSpatialFilterValue3').selectedIndex].value;	
	//var filterValueCity = document.getElementById('layerSpatialFilterValue4').options[document.getElementById('layerSpatialFilterValue4').selectedIndex].value;	
	
	var extent = 'null';
	/*var filterPlace = getPlace(filterValueCountry, filterValueRegion, filterValueRegionUnit, filterValueCity);
	var filterValue = getBBOX(filterPlace, 'bbox');
	
	if (filterValue != null) {
		extent = filterValue;
		extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
	}*/
	if(vector.getSource().getFeatures().length > 0) {			
		extent = vector.getSource().getExtent();					
	}
	
	//console.log(extent);
		
	if (extent != 'null') {	
		var selectedLayer = null;
		map.getLayers().forEach(function(layer) {
        	if (layer.get('title') == name) {
        		selectedLayer = layer;
        	}
        });
		
		var layerExtent = selectedLayer.getSource().getSource().getExtent();
		if (!ol.extent.intersects(extent, layerExtent)) {
			var newStyle = new ol.style.Style({
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
			selectedLayer.getSource().setStyle(newStyle);
		}
		else {
			selectedLayer.getSource().setStyle(defaultVectorStyle);
		}
		
		document.getElementById('alertApplySpatialFilter').style.display = 'block';
		setTimeout(function() {$('#alertApplySpatialFilter').fadeOut('slow');}, fadeTime);	
	}
	else {
		document.getElementById('alertSpatialFilterNoValue').style.display = 'block';
		setTimeout(function() {$('#alertSpatialFilterNoValue').fadeOut('slow');}, fadeTime);		
	}
	
	clearLayerSpatialFilterForm();
}

function clearSpatialFilterLayer() {
	var name = document.getElementById('layerID').innerHTML;
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == name) {
    		layer.getSource().setStyle(defaultVectorStyle);
    	}
    });
	
    clearLayerSpatialFilterForm();
    
	document.getElementById('alertClearSpatialFilter').style.display = 'block';
	setTimeout(function() {$('#alertClearSpatialFilter').fadeOut('slow');}, fadeTime);
}

function enableRegionSelectLayer() {
	var country = document.getElementById('layerSpatialFilterValue1').options[document.getElementById('layerSpatialFilterValue1').selectedIndex].value;
	var divRef = document.getElementById('layerSpatialFilterValue2');

	resetSelectForm(divRef, 'Region');
	resetSelectForm(document.getElementById('layerSpatialFilterValue3'), 'Region Unit');
	resetSelectForm(document.getElementById('layerSpatialFilterValue4'), 'City');
		
	var res = alasql('SELECT DISTINCT region FROM geodata WHERE country = "' + country + '"');
	res.forEach(function(i) {
		if (i.region != '') {
			element = document.createElement('option');
			element.value = i.region;
			element.innerHTML = i.region;
			divRef.appendChild(element);
		}		
	});		  
	
	document.getElementById('layerSpatialFilterValue2').disabled = false;
	document.getElementById('layerSpatialFilterValue3').disabled = true;
	document.getElementById('layerSpatialFilterValue4').disabled = true;
}

function enableRegionUnitSelectLayer() {
	var region = document.getElementById('layerSpatialFilterValue2').options[document.getElementById('layerSpatialFilterValue2').selectedIndex].value;
	var divRef = document.getElementById('layerSpatialFilterValue3');

	resetSelectForm(divRef, 'Region Unit');
	resetSelectForm(document.getElementById('layerSpatialFilterValue4'), 'City');
	
	var res = alasql('SELECT DISTINCT region_unit FROM geodata WHERE region = "' + region + '"');
	res.forEach(function(i) {
		if (i.region_unit != '') {
			element = document.createElement('option');
			element.value = i.region_unit;
			element.innerHTML = i.region_unit;
			divRef.appendChild(element);
		}			
	});		
	
	document.getElementById('layerSpatialFilterValue3').disabled = false;
	document.getElementById('layerSpatialFilterValue4').disabled = true;
}

function enableCitySelectLayer() {
	var regionUnit = document.getElementById('layerSpatialFilterValue3').options[document.getElementById('layerSpatialFilterValue3').selectedIndex].value;
	var divRef = document.getElementById('layerSpatialFilterValue4');

	resetSelectForm(divRef, 'City');	
	
	var res = alasql('SELECT DISTINCT city FROM geodata WHERE region_unit = "' + regionUnit + '"');
	res.forEach(function(i) {
		if (i.city != '') {
			element = document.createElement('option');
			element.value = i.city;
			element.innerHTML = i.city;
			divRef.appendChild(element);
		}
	});		
	
	document.getElementById('layerSpatialFilterValue4').disabled = false;
}

function enableCountriesLayer(name) {
	var res = alasql('SELECT DISTINCT country FROM geodata');
    var divRef = document.getElementById('layerSpatialFilterValue1');   
    
    resetSelectForm(divRef, 'Country');
   
	res.forEach(function(i) {
			if (i.country != '') {
			var element = document.createElement('option');
			element.value = i.country;
			element.innerHTML = i.country;
			divRef.appendChild(element);
		}			
	});
    
}

function clearLayerSpatialFilterForm() {
	$('#layerSpatialFilterValue1').get(0).selectedIndex = 0;
	$('#layerSpatialFilterValue2').get(0).selectedIndex = 0;
	$('#layerSpatialFilterValue3').get(0).selectedIndex = 0;
	$('#layerSpatialFilterValue4').get(0).selectedIndex = 0;
	document.getElementById('layerSpatialFilterValue2').disabled = true;
	document.getElementById('layerSpatialFilterValue3').disabled = true;
	document.getElementById('layerSpatialFilterValue4').disabled = true;
	
	resetFilterMapForm();
}

