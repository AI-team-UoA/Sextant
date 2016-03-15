function setFilters(name) {
	document.getElementById('layerID').innerHTML = name;
	enableCountriesLayer();	
	$('#modalSpatialFilterLayer').modal('show');
}

function applySpatialFilterLayer() {
	var name = document.getElementById('layerID').innerHTML;
	var filterValueCountry = document.getElementById('layerSpatialFilterValue1').options[document.getElementById('layerSpatialFilterValue1').selectedIndex].value;	
	var filterValueRegion = document.getElementById('layerSpatialFilterValue2').options[document.getElementById('layerSpatialFilterValue2').selectedIndex].value;	
	var filterValueRegionUnit = document.getElementById('layerSpatialFilterValue3').options[document.getElementById('layerSpatialFilterValue3').selectedIndex].value;	
	var filterValueCity = document.getElementById('layerSpatialFilterValue4').options[document.getElementById('layerSpatialFilterValue4').selectedIndex].value;	
	
	var filterPlace = getPlace(filterValueCountry, filterValueRegion, filterValueRegionUnit, filterValueCity);
	var filterValue = getBBOX(filterPlace, 'bbox');
	
	if (filterValue != ',,,') {
		var layer = map.getLayersByName(name)[0];
		var features = layer.features;
		
		for(var i=0; i< features.length; i++) {			
			var featureBounds = new OpenLayers.Bounds(features[i].geometry.getBounds().toArray());
			featureBounds = featureBounds.transform(new OpenLayers.Projection("EPSG:900913"), new OpenLayers.Projection("EPSG:4326"));
			
	        if(!filterValue.intersectsBounds(featureBounds)) {
	        	features[i].style = new OpenLayers.Style();	        	
	        	features[i].style.fillColor = '#A0A0A0';
	        	features[i].style.strokeColor = '#A0A0A0';
	        	features[i].style.strokeWidth = 1;
	        	features[i].style.strokeOpacity = 1;
	        	features[i].style.fillOpacity = 0.3;
	        	features[i].style.externalGraphic = '';
	        }
	        else {
	        	features[i].style = null;
	        }
	    }
	    layer.redraw();
		
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
	var layer = map.getLayersByName(name)[0];
	var features = layer.features;
	
	//Show all features of the layer
	for(var i=0; i< features.length; i++) {
        features[i].style = null;     
    }
    layer.redraw();
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
}

