var currentClassURI, currentPropURI;
var allClassFilters =[];
var filterQuery;

/****************************************************************/
var Filter = function(classURI, propURI, type, rule, value, name) {
	this.classURI = classURI;
	this.propURI = propURI;
	this.type = type;
	this.rule = rule;
	this.value = value;
	this.name = name;
};

var SpatialClassFilter = function(classURI, filters, geoType, geoURI) {
	this.classURI = classURI;
	this.filters = filters;
	this.geoType = geoType;
	this.geoURI = geoURI;
};

var Location = function(name, type) {
	this.name = name;
	this.type = type;
}

function addFilterToResults(filter) {
	var divRef = document.getElementById('allClassRulesResults');
	
	var elementRow = document.createElement('div');
	elementRow.setAttribute('class', 'row describeDelimeter describeColumnTitle');
	divRef.appendChild(elementRow);
	
	var elementColumn = document.createElement('div');
	elementColumn.setAttribute('class', 'col-md-3 col-sm-3 describeColumnTitle');
	elementRow.appendChild(elementColumn);
	var element = document.createElement('p');
	element.innerHTML += getName(filter.propURI);
	elementColumn.appendChild(element);	
	
	elementColumn = document.createElement('div');
	elementColumn.setAttribute('class', 'col-md-3 col-sm-3 describeColumnTitle');
	elementRow.appendChild(elementColumn);
	element = document.createElement('p');
	element.innerHTML += filter.type;
	elementColumn.appendChild(element);
	
	elementColumn = document.createElement('div');
	elementColumn.setAttribute('class', 'col-md-3 col-sm-3 describeColumnTitle');
	elementRow.appendChild(elementColumn);
	element = document.createElement('p');
	element.innerHTML += filter.rule;
	elementColumn.appendChild(element);
	
	elementColumn = document.createElement('div');
	elementColumn.setAttribute('class', 'col-md-3 col-sm-3 describeColumnTitle');
	elementRow.appendChild(elementColumn);
	element = document.createElement('p');
	element.innerHTML += filter.name;
	elementColumn.appendChild(element);
}
/****************************************************************/

function visualizeClass(classURI) {
	currentClassURI = classURI;

	//Construct the SPARQL query, add the FILTERS and create a layer
	filterQuery = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> \n' +
				  'PREFIX geo: <http://www.opengis.net/ont/geosparql#> \n' +
				  'PREFIX geof: <http://www.opengis.net/def/function/geosparql/> \n' +
				  
				  'SELECT * \n' +
				  'WHERE { \n' +
				  '?x rdf:type <' + currentClassURI + '> . ';	
	
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			switch (allClassFilters[i].geoType) {
				case 'WKT':
					filterQuery += '\n ?x <'+allClassFilters[i].geoURI+'> ?wkt . ';
					break;
				case 'GML':
					filterQuery += '\n ?x <'+allClassFilters[i].geoURI+'> ?gml . ';
					break;
				case 'GEOSPARQL':
					filterQuery += '\n ?x geo:hasGeometry ?geo . \n' +
								   '?geo geo:asWKT ?wkt . ';
					break;
			}
			
			for (var j=0; j<allClassFilters[i].filters.length; j++) {
				filterQuery += fiterToQueryString(allClassFilters[i].filters[j], j, allClassFilters[i].geoType);								
			}			
			break;
		}
	}
	
	filterQuery += ' } ';
	
	document.getElementById('layerNameExploreVis').value = '';
	$('#exploreVisualize').modal('show');
}

function visualizeExploreClass() {
	var name = document.getElementById('layerNameExploreVis').value;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	var portValue = document.getElementById('endpointUrlPortExplore').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpointURI = document.getElementById('endpointUrlExplore').value;	
	endpointURI = endpointURI.replace("http://", "");
	var parts = endpointURI.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	console.log(filterQuery);
	getQueryResults(host, endpointName, filterQuery, name, port, false);
}

function clearClassFilters(classURI) {
	currentClassURI = classURI;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			for (var j=0; j<allClassFilters[i].filters.length; j++) {
				var propName = allClassFilters[i].filters[j].propURI;
				document.getElementById('filter'+currentClassURI+propName).setAttribute('class', 'btn btn-sm btn-default filterButton');
			}
			allClassFilters[i].filters = [];
			break;
		}
	}
	
	document.getElementById('alertMsgDeleteFilters').style.display = 'block';
	setTimeout(function() {$('#alertMsgDeleteFilters').fadeOut('slow');}, fadeTime);
}

function viewClassFilters(classURI) {
	//Clear previous modal results
	document.getElementById('allClassRulesResults').innerHTML = '';
	
	currentClassURI = classURI;
	document.getElementById('myClassURI').innerHTML = classURI;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			for (var j=0; j<allClassFilters[i].filters.length; j++) {
				addFilterToResults(allClassFilters[i].filters[j]);
			}			
			break;
		}
	}	
	
	$('#modalClassFilters').modal('show');
}

function getClass(classURI) {
	currentClassURI = classURI;
	document.getElementById('deleteClassURI').innerHTML = classURI;
	$('#confirmDeleteFilters').modal('show');
}

function deleteFiltersFinal() {
	clearClassFilters(currentClassURI);
}

function fiterToQueryString(filter, itter, geoType) {	
	var str =' \n';
	
	switch (filter.type) {
		case 'regular':
			break;
		case 'optional':
			str += 'OPTIONAL { ';
			break;
	}
	
	if (filter.rule != 'spatial.intersect') {
		str += '?x <'+filter.propURI+'> ?value' + itter + ' . ';
	}	
	
	switch (filter.rule) {
		case 'num.greater':
			str += 'FILTER( ?value' + itter + ' > ' + filter.value + ' ) . ';
			break;
		case 'num.greaterEqual':
			str += 'FILTER( ?value' + itter + ' >= ' + filter.value + ' ) . ';
			break;
		case 'num.less':
			str += 'FILTER( ?value' + itter + ' < ' + filter.value + ' ) . ';
			break;
		case 'num.lessEqual':
			str += 'FILTER( ?value' + itter + ' <= ' + filter.value + ' ) . ';
			break;
		case 'num.equal':
			str += 'FILTER( ?value' + itter + ' = ' + filter.value + ' ) . ';
			break;
		case 'num.notEqual':
			str += 'FILTER( ?value' + itter + ' != ' + filter.value + ' ) . ';
			break;
		case 'boolean.is':
			str += 'FILTER( ?value' + itter + ' = ' + filter.value + ' ) . ';
			break;
		case 'str.contains':
			str += 'FILTER regex( ?value' + itter + ' , "' + filter.value + '" , "i" ) . ';
			break;
		case 'date.greater':
			str += 'FILTER( ?value' + itter + ' > ' + filter.value + ' ) . ';
			break;
		case 'date.greaterEqual':
			str += 'FILTER( ?value' + itter + ' >= ' + filter.value + ' ) . ';
			break;
		case 'date.less':
			str += 'FILTER( ?value' + itter + ' < ' + filter.value + ' ) . ';
			break;
		case 'date.lessEqual':
			str += 'FILTER( ?value' + itter + ' <= ' + filter.value + ' ) . ';
			break;
		case 'date.equal':
			str += 'FILTER( ?value' + itter + ' = ' + filter.value + ' ) . ';
			break;
		case 'date.notEqual':
			str += 'FILTER( ?value' + itter + ' != ' + filter.value + ' ) . ';
			break;
		case 'spatial.intersect':
			switch (geoType) {
				case 'WKT':
					str += 'FILTER( geof:sfIntersects( ?wkt, "' + filter.value + '"^^<http://www.opengis.net/ont/geosparql#wktLiteral>) ) . ';
					break;
				case 'GML':
					str += 'FILTER( geof:sfIntersects( ?gml, "' + filter.value + '"^^<http://www.opengis.net/ont/geosparql#wktLiteral>) ) . ';
					break;
				case 'GEOSPARQL':
					str += 'FILTER( geof:sfIntersects( ?wkt, "' + filter.value + '"^^<http://www.opengis.net/ont/geosparql#wktLiteral>) ) . ';
					break;
			}
			break;
	}
	
	switch (filter.type) {
	case 'regular':
		break;
	case 'optional':
		str += ' } . ';
		break;
	}
	
	return str;
}

/****************************************************************/
/********************** String Filters *************************/

function showStringFilter(propURI, classURI) {
	currentClassURI = classURI;
	currentPropURI = propURI;
	
	document.getElementById('stringFilterClassURI').innerHTML = classURI;
	document.getElementById('stringFilterPropertyURI').innerHTML = propURI;
	
	clearStringFilterForm();
	$('#modalStringFilter').modal('show');
}

function saveStringFilter() {
	var position = -1;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			position = i;
			break;
		}
	}
	
	var filter;
	
	//Filter 1
	var filterType = document.getElementById('stringFilterType1').options[document.getElementById('stringFilterType1').selectedIndex].value;
	var filterRule = document.getElementById('stringFilterRule1').options[document.getElementById('stringFilterRule1').selectedIndex].value;
	var filterValue = document.getElementById('stringFilterValue1').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 2
	filterType = document.getElementById('stringFilterType2').options[document.getElementById('stringFilterType2').selectedIndex].value;
	filterRule = document.getElementById('stringFilterRule2').options[document.getElementById('stringFilterRule2').selectedIndex].value;
	filterValue = document.getElementById('stringFilterValue2').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 3
	filterType = document.getElementById('stringFilterType3').options[document.getElementById('stringFilterType3').selectedIndex].value;
	filterRule = document.getElementById('stringFilterRule3').options[document.getElementById('stringFilterRule3').selectedIndex].value;
	filterValue = document.getElementById('stringFilterValue3').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	$('#modalStringFilter').modal('hide');
	document.getElementById('alertMsgUpdateFilters').style.display = 'block';
	setTimeout(function() {$('#alertMsgUpdateFilters').fadeOut('slow');}, fadeTime);
}

function clearStringFilterForm() {
	document.getElementById('stringFilterType1').value = 'regular';
	document.getElementById('stringFilterRule1').value = 'str.contains';
	document.getElementById('stringFilterValue1').value = '';
	
	document.getElementById('stringFilterType2').value = 'regular';
	document.getElementById('stringFilterRule2').value = 'str.contains';
	document.getElementById('stringFilterValue2').value = '';
	
	document.getElementById('stringFilterType3').value = 'regular';
	document.getElementById('stringFilterRule3').value = 'str.contains';
	document.getElementById('stringFilterValue3').value = '';
}

/****************************************************************/
/********************** Numeric Filters *************************/

function showNumericFilter(propURI, classURI) {
	currentClassURI = classURI;
	currentPropURI = propURI;
	
	document.getElementById('numericFilterClassURI').innerHTML = classURI;
	document.getElementById('numericFilterPropertyURI').innerHTML = propURI;
	
	clearNumericFilterForm();
	$('#modalNumericFilter').modal('show');
}

function saveNumericFilter() {
	var position = -1;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			position = i;
			break;
		}
	}
	
	var filter;
	
	//Filter 1
	var filterType = document.getElementById('numericFilterType1').options[document.getElementById('numericFilterType1').selectedIndex].value;
	var filterRule = document.getElementById('numericFilterRule1').options[document.getElementById('numericFilterRule1').selectedIndex].value;
	var filterValue = document.getElementById('numericFilterValue1').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 2
	filterType = document.getElementById('numericFilterType2').options[document.getElementById('numericFilterType2').selectedIndex].value;
	filterRule = document.getElementById('numericFilterRule2').options[document.getElementById('numericFilterRule2').selectedIndex].value;
	filterValue = document.getElementById('numericFilterValue2').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 3
	filterType = document.getElementById('numericFilterType3').options[document.getElementById('numericFilterType3').selectedIndex].value;
	filterRule = document.getElementById('numericFilterRule3').options[document.getElementById('numericFilterRule3').selectedIndex].value;
	filterValue = document.getElementById('numericFilterValue3').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	$('#modalNumericFilter').modal('hide');
	document.getElementById('alertMsgUpdateFilters').style.display = 'block';
	setTimeout(function() {$('#alertMsgUpdateFilters').fadeOut('slow');}, fadeTime);
}

function clearNumericFilterForm() {
	document.getElementById('numericFilterType1').value = 'regular';
	document.getElementById('numericFilterRule1').value = 'num.greater';
	document.getElementById('numericFilterValue1').value = '';
	
	document.getElementById('numericFilterType2').value = 'regular';
	document.getElementById('numericFilterRule2').value = 'num.greater';
	document.getElementById('numericFilterValue2').value = '';
	
	document.getElementById('numericFilterType3').value = 'regular';
	document.getElementById('numericFilterRule3').value = 'num.greater';
	document.getElementById('numericFilterValue3').value = '';
}

/****************************************************************/
/********************** Boolean Filters *************************/

function showBooleanFilter(propURI, classURI) {
	currentClassURI = classURI;
	currentPropURI = propURI;
	
	document.getElementById('booleanFilterClassURI').innerHTML = classURI;
	document.getElementById('booleanFilterPropertyURI').innerHTML = propURI;
	
	clearBooleanFilterForm();
	$('#modalBooleanFilter').modal('show');
}

function saveBooleanFilter() {
	var position = -1;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			position = i;
			break;
		}
	}
	
	var filter;
	
	//Filter 1
	var filterType = document.getElementById('booleanFilterType1').options[document.getElementById('booleanFilterType1').selectedIndex].value;
	var filterRule = document.getElementById('booleanFilterRule1').options[document.getElementById('booleanFilterRule1').selectedIndex].value;
	var filterValue = document.getElementById('booleanFilterValue1').options[document.getElementById('booleanFilterValue1').selectedIndex].value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 2
	filterType = document.getElementById('booleanFilterType2').options[document.getElementById('booleanFilterType2').selectedIndex].value;
	filterRule = document.getElementById('booleanFilterRule2').options[document.getElementById('booleanFilterRule2').selectedIndex].value;
	filterValue = document.getElementById('booleanFilterValue2').options[document.getElementById('booleanFilterValue2').selectedIndex].value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 3
	filterType = document.getElementById('booleanFilterType3').options[document.getElementById('booleanFilterType3').selectedIndex].value;
	filterRule = document.getElementById('booleanFilterRule3').options[document.getElementById('booleanFilterRule3').selectedIndex].value;
	filterValue = document.getElementById('booleanFilterValue3').options[document.getElementById('booleanFilterValue3').selectedIndex].value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	$('#modalBooleanFilter').modal('hide');
	document.getElementById('alertMsgUpdateFilters').style.display = 'block';
	setTimeout(function() {$('#alertMsgUpdateFilters').fadeOut('slow');}, fadeTime);
}

function clearBooleanFilterForm() {
	document.getElementById('booleanFilterType1').value = 'regular';
	document.getElementById('booleanFilterRule1').value = 'boolean.is';
	document.getElementById('booleanFilterValue1').value = 'true';
	
	document.getElementById('booleanFilterType2').value = 'regular';
	document.getElementById('booleanFilterRule2').value = 'boolean.is';
	document.getElementById('booleanFilterValue2').value = 'true';
	
	document.getElementById('booleanFilterType3').value = 'regular';
	document.getElementById('booleanFilterRule3').value = 'boolean.is';
	document.getElementById('booleanFilterValue3').value = 'true';
}

/****************************************************************/
/************************ Date Filters **************************/

function showDateFilter(propURI, classURI) {
	currentClassURI = classURI;
	currentPropURI = propURI;
	
	document.getElementById('dateFilterClassURI').innerHTML = classURI;
	document.getElementById('dateFilterPropertyURI').innerHTML = propURI;
	
	clearDateFilterForm();
	$('#modalDateFilter').modal('show');
}

function saveDateFilter() {
	var position = -1;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			position = i;
			break;
		}
	}
	
	var filter;
	
	//Filter 1
	var filterType = document.getElementById('dateFilterType1').options[document.getElementById('dateFilterType1').selectedIndex].value;
	var filterRule = document.getElementById('dateFilterRule1').options[document.getElementById('dateFilterRule1').selectedIndex].value;
	var filterValue = document.getElementById('dateFilterValue1').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 2
	filterType = document.getElementById('dateFilterType2').options[document.getElementById('dateFilterType2').selectedIndex].value;
	filterRule = document.getElementById('dateFilterRule2').options[document.getElementById('dateFilterRule2').selectedIndex].value;
	filterValue = document.getElementById('dateFilterValue2').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	//Filter 3
	filterType = document.getElementById('dateFilterType3').options[document.getElementById('dateFilterType3').selectedIndex].value;
	filterRule = document.getElementById('dateFilterRule3').options[document.getElementById('dateFilterRule3').selectedIndex].value;
	filterValue = document.getElementById('dateFilterValue3').value;	
	if (filterValue != "") {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterValue);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
	}
	
	$('#modalDateFilter').modal('hide');
	document.getElementById('alertMsgUpdateFilters').style.display = 'block';
	setTimeout(function() {$('#alertMsgUpdateFilters').fadeOut('slow');}, fadeTime);
}

function clearDateFilterForm() {
	document.getElementById('dateFilterType1').value = 'regular';
	document.getElementById('dateFilterRule1').value = 'date.greater';
	document.getElementById('dateFilterValue1').value = '';
	
	document.getElementById('dateFilterType2').value = 'regular';
	document.getElementById('dateFilterRule2').value = 'date.greater';
	document.getElementById('dateFilterValue2').value = '';
	
	document.getElementById('dateFilterType3').value = 'regular';
	document.getElementById('dateFilterRule3').value = 'date.greater';
	document.getElementById('dateFilterValue3').value = '';
}

/****************************************************************/
/*********************** Spatial Filters ************************/
function showSpatialFilter(propURI, classURI) {
	currentClassURI = classURI;
	currentPropURI = propURI;
	
	document.getElementById('spatialFilterClassURI').innerHTML = classURI;
	document.getElementById('spatialFilterPropertyURI').innerHTML = propURI;
	
	clearSpatialFilterForm();
	enableCountries();
	$('#modalSpatialFilter').modal('show');
}

function saveSpatialFilter() {
	var position = -1;
	for (var i=0; i<allClassFilters.length; i++) {
		if (allClassFilters[i].classURI === currentClassURI) {
			position = i;
			break;
		}
	}
	
	var filter;
	
	//Filter 1
	var filterType = document.getElementById('spatialFilterType1').options[document.getElementById('spatialFilterType1').selectedIndex].value;
	var filterRule = document.getElementById('spatialFilterRule1').options[document.getElementById('spatialFilterRule1').selectedIndex].value;
	var filterValueCountry = document.getElementById('spatialFilterValue1').options[document.getElementById('spatialFilterValue1').selectedIndex].value;	
	var filterValueRegion = document.getElementById('spatialFilterValue2').options[document.getElementById('spatialFilterValue2').selectedIndex].value;	
	var filterValueRegionUnit = document.getElementById('spatialFilterValue3').options[document.getElementById('spatialFilterValue3').selectedIndex].value;	
	var filterValueCity = document.getElementById('spatialFilterValue4').options[document.getElementById('spatialFilterValue4').selectedIndex].value;	
	
	var filterPlace = getPlace(filterValueCountry, filterValueRegion, filterValueRegionUnit, filterValueCity);
	var filterValue = getBBOX(filterPlace, 'wkt');
	
	if (filterValue != '<http://www.opengis.net/def/crs/EPSG/0/4326> POLYGON((null null, null null, null null, null null, null null))') {
		filter = new Filter(currentClassURI, currentPropURI, filterType, filterRule, filterValue, filterPlace.name);
		if (allClassFilters[position].filters.indexOf(filter) === -1) {
			//Add the new filter if it does not exist in the table
			allClassFilters[position].filters.push(filter);
			document.getElementById('filter'+currentClassURI+currentPropURI).setAttribute('class', 'btn btn-sm btn-info filterButton');
		}
		
		$('#modalSpatialFilter').modal('hide');
		document.getElementById('alertMsgUpdateFilters').style.display = 'block';
		setTimeout(function() {$('#alertMsgUpdateFilters').fadeOut('slow');}, fadeTime);
	}
	else {
		$('#modalSpatialFilter').modal('hide');
		document.getElementById('alertMsgFilterNoValue').style.display = 'block';
		setTimeout(function() {$('#alertMsgFilterNoValue').fadeOut('slow');}, fadeTime);
	}
}

function clearSpatialFilterForm() {
	document.getElementById('spatialFilterType1').value = 'regular';
	document.getElementById('spatialFilterRule1').value = 'spatial.intersect';
	$('#spatialFilterValue1').get(0).selectedIndex = 0;
	$('#spatialFilterValue2').get(0).selectedIndex = 0;
	$('#spatialFilterValue3').get(0).selectedIndex = 0;
	$('#spatialFilterValue4').get(0).selectedIndex = 0;
	document.getElementById('spatialFilterValue2').disabled = true;
	document.getElementById('spatialFilterValue3').disabled = true;
	document.getElementById('spatialFilterValue4').disabled = true;
}

function getPlace(filterValueCountry, filterValueRegion, filterValueRegionUnit, filterValueCity) {	
	if (filterValueCity == ""){
		if (filterValueRegionUnit == "") {
			if (filterValueRegion == "") {
				return new Location(filterValueCountry, 'country');
			}
			else {
				return new Location(filterValueRegion, 'region');
			}
		}
		else {
			return new Location(filterValueRegionUnit, 'region_unit');
		}
	}
	else {
		return new Location(filterValueCity, 'city');
	}
}

function getBBOX(place, format) {
	var placeBBOX;
	switch (place.type) {
		case 'country':
			var res = alasql('SELECT DISTINCT geometry FROM geodata WHERE country = "' + place.name + '"');
			//console.log(res);
			placeBBOX = calculateBBOX(res);				
			break;
		case 'region':
			var res = alasql('SELECT DISTINCT geometry FROM geodata WHERE region = "' + place.name + '"');
			//console.log(res);
			placeBBOX = calculateBBOX(res);					  
			break;
		case 'region_unit':
			var res = alasql('SELECT DISTINCT geometry FROM geodata WHERE region_unit = "' + place.name + '"');
			//console.log(res);
			placeBBOX = calculateBBOX(res);			
			break;
		case 'city':
			var res = alasql('SELECT DISTINCT geometry FROM geodata WHERE city = "' + place.name + '"');
			//console.log(res);
			placeBBOX = calculateBBOX(res);			
			break;
	}
	
	if (format == 'wkt') {
		var wkt = boundsToWKT(placeBBOX);
		return wkt;
	}
	else {
		return placeBBOX;
	}
}

function calculateBBOX(res) {
	var bounds = null;
	var first = true;
	res.forEach(function(i) {
		if (typeof(i.geometry) !== "undefined") {
			var coords = i.geometry.replace("BOX(", "").replace(")", "");
			var parse1 = coords.split(',');
			var pointsLL = parse1[0].split(' ');
			var pointsUR = parse1[1].split(' ');
			
			if (first) {
				bounds = [Number(pointsLL[0]), Number(pointsLL[1]), Number(pointsUR[0]), Number(pointsUR[1])];
				first = false;
			}
			else {
				ol.extent.extend(bounds, [Number(pointsLL[0]), Number(pointsLL[1]), Number(pointsUR[0]), Number(pointsUR[1])]);
			}
		}
	});
	
	return bounds;
}

function boundsToWKT(placeBBOX) {
	return '<http://www.opengis.net/def/crs/EPSG/0/4326> POLYGON((' + placeBBOX[0] + ' ' + placeBBOX[1] + ', ' +
									  placeBBOX[2] + ' ' + placeBBOX[1] + ', ' +
									  placeBBOX[2] + ' ' + placeBBOX[3] + ', ' +
									  placeBBOX[0] + ' ' + placeBBOX[3] + ', ' +
									  placeBBOX[0] + ' ' + placeBBOX[1] + '))';
}

function enableRegionSelect() {
	var country = document.getElementById('spatialFilterValue1').options[document.getElementById('spatialFilterValue1').selectedIndex].value;
	var divRef = document.getElementById('spatialFilterValue2');

	resetSelectForm(divRef, 'Region');
	resetSelectForm(document.getElementById('spatialFilterValue3'), 'Region Unit');
	resetSelectForm(document.getElementById('spatialFilterValue4'), 'City');
		
	var res = alasql('SELECT DISTINCT region FROM geodata WHERE country = "' + country + '"');
	res.forEach(function(i) {
		if (i.region != '') {
			element = document.createElement('option');
			element.value = i.region;
			element.innerHTML = i.region;
			divRef.appendChild(element);
		}		
	});		  
	
	document.getElementById('spatialFilterValue2').disabled = false;
	document.getElementById('spatialFilterValue3').disabled = true;
	document.getElementById('spatialFilterValue4').disabled = true;
}

function enableRegionUnitSelect() {
	var region = document.getElementById('spatialFilterValue2').options[document.getElementById('spatialFilterValue2').selectedIndex].value;
	var divRef = document.getElementById('spatialFilterValue3');

	resetSelectForm(divRef, 'Region Unit');
	resetSelectForm(document.getElementById('spatialFilterValue4'), 'City');
	
	var res = alasql('SELECT DISTINCT region_unit FROM geodata WHERE region = "' + region + '"');
	res.forEach(function(i) {
		if (i.region_unit != '') {
			element = document.createElement('option');
			element.value = i.region_unit;
			element.innerHTML = i.region_unit;
			divRef.appendChild(element);
		}			
	});		
	
	document.getElementById('spatialFilterValue3').disabled = false;
	document.getElementById('spatialFilterValue4').disabled = true;
}

function enableCitySelect() {
	var regionUnit = document.getElementById('spatialFilterValue3').options[document.getElementById('spatialFilterValue3').selectedIndex].value;
	var divRef = document.getElementById('spatialFilterValue4');

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
	
	document.getElementById('spatialFilterValue4').disabled = false;
}

function resetSelectForm(divRef, template) {
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	var element = document.createElement('option');
	element.value = "";
	element.innerHTML = template;
	divRef.appendChild(element);
}

function enableCountries() {
	var res = alasql('SELECT DISTINCT country FROM geodata');
    var divRef = document.getElementById('spatialFilterValue1');   
    
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


