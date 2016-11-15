/**
 * Get all the available classes(except geo:Geometry) in the SPARQL endpoint
 * with their properties and the range of each property.
 */
function exploreEndpoint() {
	var portValue = document.getElementById('endpointUrlPortExplore').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpoint = document.getElementById('endpointUrlExplore').value;
	endpoint = endpoint.replace("http://", "");
	var parts = endpoint.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	clearExplorePanel();
	
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/explore/' + host + '/' + endpointName + '/' + port,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseExploreResults,
        error: printError
    });
}

function parseExploreResults(results, status, jqXHR) {
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    
    var divRef;
    //results = results.substring(0, results.length-1);
    
    var arr = results.split('\$');
    
    //Create one button for each class and then we create the hierarchy
    //using the updateSuperButtons function.
	for (var i=0; i<arr.length-1; i++) {	
		if (arr[i] == 'null') {continue ;}
		if (checkForClass(arr[i])) {			
			divRef = document.getElementById('exploreClasses');						
			createClassButton(arr[i], divRef, false);							
		}		
	}	
	
	updateSuperButtons(arr);
	updateBreadcrumbs(arr);
}

function addSpatialObjects(allProps) {
	var classURI = allProps[0];
	var idPart = getIdPart(classURI);
	
	for (var i=1; i<allProps.length-2; i+=2) {
		if (getName(allProps[i]) == 'asWKT' || getName(allProps[i]) == 'asGML' || getName(allProps[i]) == 'hasGeometry') {
			document.getElementById('visualize'+idPart).style.display = 'block';
			document.getElementById('viewFilters'+idPart).style.display = 'block';
			document.getElementById('clearFilters'+idPart).style.display = 'block'; 
					
			//Create a SpatialClassFilter for this class
			switch (getName(allProps[i])) {
				case 'asWKT':
					var newFilters = new SpatialClassFilter(classURI, [], 'WKT', allProps[i]);
					allClassFilters.push(newFilters);
					break;
				case 'asGML':
					var newFilters = new SpatialClassFilter(classURI, [], 'GML', allProps[i]);
					allClassFilters.push(newFilters);
					break;
				case 'hasGeometry':
					var newFilters = new SpatialClassFilter(classURI, [], 'GEOSPARQL', null);
					allClassFilters.push(newFilters);
					break;
			}
												
			break;
		}
	}
}

function updateSuperButtons(arr) {
	for (var i=0; i<arr.length-2; i+=2) {
		if (arr[i] != 'null') {
			updateSuperButton(arr[i], arr[i+1]);
			updateBadge(arr[i]);
		}
	}	
}

function createClassButton(classURI, divRef) {
	var name = getName(classURI);
	var idPart = getIdPart(classURI);
		
	var elementClass = document.createElement('div');
	elementClass.id = name+'MYDELIMETERclass'+idPart;
	
	var element = document.createElement('button');
	element.id = 'buttonBadge'+idPart;
	element.value = classURI;
	element.name = '0';
	element.setAttribute('class', 'btn btn-default');
	element.setAttribute('type', 'button');
	element.setAttribute('data-toggle', 'collapse');
	element.setAttribute('data-target', '#properties'+idPart);
	element.setAttribute('aria-expanded', 'false');
	element.setAttribute('aria-controls', 'properties'+idPart);
	element.innerHTML = name;
	element.style.width = '100%';
	
	var element2 = document.createElement('div');
	element2.setAttribute('class', 'collapse');
	element2.id = 'properties'+idPart;
	
	var element3 = document.createElement('div');
	element3.setAttribute('class', 'well');
	element3.id = 'classWell'+idPart;

	var breadcrumb = document.createElement('ol');
	breadcrumb.setAttribute('class', 'breadcrumb');
	breadcrumb.id = 'breadcrumb'+idPart;
	breadcrumb.innerHTML = '<li>'+name+'</li>';
	
	var groupButton = document.createElement('div');
	groupButton.setAttribute('class', 'btn-group');
	groupButton.setAttribute('role', 'group');
	
	var plus = document.createElement('button');
	plus.id = 'addProps'+idPart;
	plus.value = classURI;
	plus.name = '0';
	plus.setAttribute('class', 'btn btn-sm btn-success addProperties');
	plus.setAttribute('title', 'Retrieve properties');
	plus.setAttribute('onclick', 'addClassProperty(this.value)');
	plus.innerHTML = '<i class="fa fa-plus"></i>';
	
	var visual = document.createElement('button');
	visual.id = 'visualize'+idPart;
	visual.value = idPart;
	visual.name = classURI;
	visual.setAttribute('class', 'btn btn-sm btn-default visualButton');
	visual.setAttribute('title', 'Visualize Class');
	visual.setAttribute('onclick', 'visualizeClass(this.name)');
	visual.innerHTML = '<i class="fa fa-paint-brush"></i>';
	
	var viewFilters = document.createElement('button');
	viewFilters.id = 'viewFilters'+idPart;
	viewFilters.value = idPart;
	viewFilters.name = classURI;
	viewFilters.setAttribute('class', 'btn btn-sm btn-default viewFiltersButton');
	viewFilters.setAttribute('title', 'View Class Filters');
	viewFilters.setAttribute('onclick', 'viewClassFilters(this.name)');
	viewFilters.innerHTML = '<i class="fa fa-info"></i>';
	
	var clearFilters = document.createElement('button');
	clearFilters.id = 'clearFilters'+idPart;
	clearFilters.value = idPart;
	clearFilters.name = classURI;
	clearFilters.setAttribute('class', 'btn btn-sm btn-danger clearFiltersButton');
	clearFilters.setAttribute('title', 'Clear Class Filters');
	clearFilters.setAttribute('onclick', 'getClass(this.name)');
	clearFilters.innerHTML = '<i class="fa fa-ban"></i>';
	
	divRef.appendChild(elementClass);
	elementClass.appendChild(element);
	elementClass.appendChild(element2);
	element2.appendChild(element3);
	element3.appendChild(breadcrumb);
	element3.appendChild(groupButton);
	groupButton.appendChild(plus);
	groupButton.appendChild(visual);
	groupButton.appendChild(viewFilters);
	groupButton.appendChild(clearFilters);
	visual.style.display = 'none';
	clearFilters.style.display = 'none';
	viewFilters.style.display = 'none';
	
	element3.innerHTML += '<h5>URI:</h5><a class="exploreURI" onClick="discoverURI(this.innerHTML)">'+classURI+'</a><br>';
}

function updateSuperButton(superURI, subURI) {
	var idPartSuper = getIdPart(superURI);
	var idPartSub = getIdPart(subURI);
	var nameSub = getName(subURI);
	var divRef = document.getElementById('classWell'+idPartSuper);
	 
	var check = document.getElementById(nameSub+'MYDELIMETERclass'+idPartSub);
	//Clone and add the node to the hierarchy
	var clone = check.cloneNode(true);
	divRef.appendChild(clone);
		
	//Remove old node
	check.parentNode.removeChild(check);	
}

function updateBreadcrumbs(arr) {
	for (var i=0; i<arr.length-2; i++) {
		if (arr[i] != 'null') {
			updateBreadCrumb(arr[i]);
		}
	}
}

function updateBreadCrumb(classURI) {
	var name = getName(classURI);
	var idPart = getIdPart(classURI);
	
	var classElement = document.getElementById(name+'MYDELIMETERclass'+idPart);
	var plusElement = document.getElementById('addProps'+idPart);
	
	if (plusElement.name == '0') {
		var parent = classElement.parentNode;
		while (parent.id != 'exploreClasses') {
			var superName = getClassName(parent.id);
			//console.log('PARENT: '+parent.id);
			//console.log('NAME: '+superName);
			if (superName != 'null'){
				var divRef = document.getElementById('breadcrumb'+idPart);
				var tempBreadcrumb = divRef.innerHTML;
				divRef.innerHTML = '<li>'+superName+'</li>'+tempBreadcrumb;
			}
			parent = parent.parentNode;
		}
		plusElement.name = '1';
	}
}

function updateBadge(superURI) {
	var nameSuper = getName(superURI);
	var idPartSuper = getIdPart(superURI);
	var element = document.getElementById('buttonBadge'+idPartSuper);
	
	element.name = (Number(element.name) + 1).toString();
	element.innerHTML = nameSuper + ' <span class="badge">'+ element.name +'</span>';
}

function addClassProperty(classURI) {		
	var portValue = document.getElementById('endpointUrlPortExplore').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpoint = document.getElementById('endpointUrlExplore').value;
	endpoint = endpoint.replace("http://", "");
	var parts = endpoint.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
		
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
				
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/explore/properties/' + host + '/' + endpointName + '/' + port,
        data: classURI,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parsePropertiesResults,
        error: printError
    });	
}

function parsePropertiesResults(results, status, jqXHR) {
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    
    var arr = results.split('\$');
    
    var classURI = arr[0];
    var idPart = getIdPart(classURI);
    var element = document.getElementById('classWell'+idPart);
    if (arr.length > 2) {
    	element.innerHTML += '<h5>Properties:</h5>';
    }
    
    /**
     * If one of the properties is asWKT or asGML then we enable the filter buttons for this class
     */
    addSpatialObjects(arr);
    
    for (var i=1; i<arr.length-2; i+=2) {
    	//Create the property-range element and add it to the class well
    	element.innerHTML += '<a class="exploreURIprop" onClick="discoverURI(this.innerHTML)">'+arr[i]+'</a><br><small><a class="exploreURIrange" onClick="discoverURI(this.innerHTML)">'+arr[i+1]+'</a></small>';    	
    	
    	if (document.getElementById('visualize'+idPart).style.display === 'block') {
	    	var filter = document.createElement('button');
	    	filter.id = 'filter' + classURI + arr[i];
	    	filter.value = arr[i];
	    	filter.name = classURI;
			filter.setAttribute('class', 'btn btn-sm btn-default filterButton');
			filter.setAttribute('title', 'Create Filter');
			filter.innerHTML = '<i class="fa fa-filter"></i>';
			
	    	switch (arr[i+1]) {
	    		case 'http://www.w3.org/2001/XMLSchema#string':
	    			filter.setAttribute('onclick', 'showStringFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#double':
	    			filter.setAttribute('onclick', 'showNumericFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#float':
	    			filter.setAttribute('onclick', 'showNumericFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#decimal':
	    			filter.setAttribute('onclick', 'showNumericFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#integer':
	    			filter.setAttribute('onclick', 'showNumericFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#boolean':
	    			filter.setAttribute('onclick', 'showBooleanFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		case 'http://www.w3.org/2001/XMLSchema#dateTime':
	    			filter.setAttribute('onclick', 'showDateFilter(this.value, this.name)');
	    			element.innerHTML += '<br>';
	    			element.appendChild(filter);
	    			break;
	    		default:
	    				    			
	    	} 
	    	
	    	if ((/asWKT/).test(arr[i]) || (/asGML/).test(arr[i]) || arr[i] == 'http://www.opengis.net/ont/geosparql#hasGeometry') {
				filter.setAttribute('onclick', 'showSpatialFilter(this.value, this.name)');
    			element.innerHTML += '<br>';
    			element.appendChild(filter);
			}
    	}
    	element.innerHTML += '<br><br>';
    }
    
    document.getElementById('buttonBadge'+idPart).setAttribute('class', 'btn btn-success');        
    document.getElementById('addProps'+idPart).setAttribute('class', 'btn btn-sm btn-default addProperties'); 
    document.getElementById('addProps'+idPart).disabled = true;
}

function checkForClass(URI) {
	var buttonId = getIdPart(URI);
	var element = document.getElementById('buttonBadge'+buttonId);

	if (element != null) {
		return 0;
	}
	else {
		return 1;
	}
}

function getName(URI) {
	URI = URI.replace("http://", "");
	var arr = URI.split('/');
	var name = arr[arr.length-1];
	var arr = name.split('#');
	if (arr.length > 1) {
		name = arr[1];
	}
	
	return name;
}

function getIdPart(URI) {
	URI = URI.replace("http://", "");
	URI = URI.replace(/\//g, '');
	URI = URI.replace(/#/g, '');
	URI = URI.replace(/\./g, '');
	URI = URI.replace(/-/g, '');
	
	return URI;
}

function getClassName(parentNodeId) {
	var arr = parentNodeId.split('MYDELIMETERclass');
	if (arr.length > 1) {
		return arr[0];
	}
	else {
		return 'null';
	}
}

function clearExplorePanel() {
	var divRef = document.getElementById('exploreClasses');
	
	//Delete old explore results from panel
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	//Clean table with spatial classes
	allClassFilters = [];
}

function discoverURI(classURI) {
	clearDiscoverModal();
	
	var divRef = document.getElementById('discoverAbout');
	var element = document.createElement('p');
	element.innerHTML = '<b>About:</b> <i>' + classURI + '</i>';
	divRef.appendChild(element);
	
	//Add column titles
	divRef = document.getElementById('discoverResultsColumnTitles');
	var elementRow = document.createElement('div');
	elementRow.setAttribute('class', 'row describeDelimeter');
	divRef.appendChild(elementRow);
	
	var elementURI = document.createElement('div');
	elementURI.setAttribute('class', 'col-md-4 col-sm-4 describeColumnTitle');
	elementRow.appendChild(elementURI);
	var element = document.createElement('p');
	element.innerHTML += '<b>Subject</b>';
	elementURI.appendChild(element);
	
	elementURI = document.createElement('div');
	elementURI.setAttribute('class', 'col-md-4 col-sm-4 describeColumnTitle');
	elementRow.appendChild(elementURI);
	element = document.createElement('p');
	element.innerHTML += '<b>Predicate</b>';
	elementURI.appendChild(element);
	
	elementURI = document.createElement('div');
	elementURI.setAttribute('class', 'col-md-4 col-sm-4 describeColumnTitle');
	elementRow.appendChild(elementURI);
	element = document.createElement('p');
	element.innerHTML += '<b>Object</b>';
	elementURI.appendChild(element);
	
	//Pose discover query and add results to the modal
	var portValue = document.getElementById('endpointUrlPortExplore').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpoint = document.getElementById('endpointUrlExplore').value;
	endpoint = endpoint.replace("http://", "");
	var parts = endpoint.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	if (!$('#modalDiscover').is(':visible')) {
	    // if modal is not shown/visible
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
	}
	else {
		showSpinnerDescribe(colorSpinDescribe);
	}
				
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/discover/' + host + '/' + endpointName + '/' + port,
        data: classURI,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseDiscoverResults,
        error: printError
    });	
	
}

function parseDiscoverResults(results, status, jqXHR) {
	hideSpinner();
    hideSpinnerDescribe();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
    
    var arr = results.split('\$');
    var divRef = document.getElementById('discoverResults');
    
    for (var i=0; i<arr.length-2; i+=3){
    	//Create row
    	var elementRow = document.createElement('div');
    	elementRow.setAttribute('class', 'row describeDelimeter');
    	divRef.appendChild(elementRow);
    	
    	//Add elements to row (subject | predicate | object)
    	var elementURI = document.createElement('div');
    	elementURI.setAttribute('class', 'col-md-4 col-sm-4');
    	elementRow.appendChild(elementURI);
    	var element = document.createElement('p');
    	element.innerHTML += '<a class="exploreURI" onClick="discoverURI(this.innerHTML)">'+arr[i]+'</a>';
    	elementURI.appendChild(element);
    	
    	elementURI = document.createElement('div');
    	elementURI.setAttribute('class', 'col-md-4 col-sm-4');
    	elementRow.appendChild(elementURI);
    	element = document.createElement('p');
    	element.innerHTML += '<a class="exploreURI" onClick="discoverURI(this.innerHTML)">'+arr[i+1]+'</a>';
    	elementURI.appendChild(element);
    	
    	elementURI = document.createElement('div');
    	elementURI.setAttribute('class', 'col-md-4 col-sm-4');
    	elementRow.appendChild(elementURI);
    	element = document.createElement('p');
    	element.innerHTML += '<a class="exploreURI" onClick="discoverURI(this.innerHTML)">'+arr[i+2]+'</a>';
    	elementURI.appendChild(element);
    }
    
    $('#modalDiscover').modal('show');
}
	
function clearDiscoverModal() {
	var divRef = document.getElementById('discoverAbout');
	
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	divRef = document.getElementById('discoverResults');	
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	divRef = document.getElementById('discoverResultsColumnTitles');	
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
}

function loadMapSearchMapExplore() {
	$('#modalSpatialFilter').modal('show');
	$('#modalSpatialFilter').on('shown.bs.modal', function () {
		resetSearchMapFormExplore();
		initSearchMapExplore();
	});
}

function initSearchMapExplore() {
	//Initialize map
	var currentView = map.getView().getCenter();
	mapFilter = new ol.Map({
        layers: [bingAerialLabels, vector],
        target: 'mapExploreExtentFilter',
        view: new ol.View({
          center: currentView,
          zoom: 6
        })
    });
	
	document.getElementsByClassName('ol-zoom')[0].style.top = '10px';
	document.getElementsByClassName('ol-zoom')[0].style.left = '10px';
   
    addInteraction();
	
}

function resetSearchMapFormExplore() {
	//document.getElementById('searchMapExtentForm').style.display = 'none';
	//document.getElementById('drawExtentButton').disabled = false;
	
	var divRef = document.getElementById('mapExploreExtentFilter');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	//document.getElementById('exploreMapExtentFormFilter').reset();
	
	vector.getSource().clear();
}

