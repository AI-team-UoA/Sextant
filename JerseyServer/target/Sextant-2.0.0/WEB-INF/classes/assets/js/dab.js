// creates a new DAB instance with the given endpoint
var dab = GIAPI.DAB('http://api.eurogeoss-broker.eu/dab');   
var paginator = null;
var pageSize = 10;
var pageSizeDiscover = 100;

var constraints, options, node;
var startNode, indexPage;
var whatSBA = "", whatKEYS, south, west, north, east, timeStart, timeEnd;

var discoverPages, numKML, numKMZ, numJPEG, numPNG, numGEOTIFF, numTIFF, numGML, numJPG, numTIF, numBMP, usefulURLS, numVector, numWMS;

//defines discover response callback function
function onDABResponse(result) {
	//Show results modal
	$('#modalGEOSSPortalResults').modal('show');
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime); 
	
	// only one result set is expected (see discover extension for more info)               
    paginator = result[0];
    
    // retrieves the result set
    var resultSet = paginator.resultSet();
    
    var divRef = document.getElementById('searchResultsInfo');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
    // prints the result set
    document.getElementById('searchResultsInfo').innerHTML += ("<h3>Result set</h3>"); 
    document.getElementById('searchResultsInfo').innerHTML += '[ <b>Size:</b> ' + resultSet.size + ', <b>Start:</b> ' + resultSet.start +
    														  ', <b>Page Count:</b> ' + resultSet.pageCount + ', <b>Page Index:</b> ' + resultSet.pageIndex +
    														  ', <b>Page Size:</b> ' + resultSet.pageSize + ' ]'; 
    
    // retrieves the current paginator page (the first of the result set)    
    var page = paginator.page();
    
    parsePageResults(page); 
    
    checkLimits();
}

function onDABDiscoverResponse(result) {
	paginator = result[0];
	var page = paginator.page();
	var resultSet = paginator.resultSet();
	console.log('[ Size: ' + resultSet.size + ', Start: ' + resultSet.start +
			  ', Page Count: ' + resultSet.pageCount + ', Page Index: ' + resultSet.pageIndex +
			  ', Page Size: ' + resultSet.pageSize + ' ]');
	parseDiscoverPageResults(page, resultSet.pageIndex);
}

function expandNodeResults(pageOne, resultSet) {
	var divRef = document.getElementById('searchResultsInfo');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	// prints the result set
    document.getElementById('searchResultsInfo').innerHTML += ("<h3>Result set</h3>"); 
    document.getElementById('searchResultsInfo').innerHTML += '[ <b>Size:</b> ' + resultSet.size + ', <b>Start:</b> ' + resultSet.start +
    														  ', <b>Page Count:</b> ' + resultSet.pageCount + ', <b>Page Index:</b> ' + resultSet.pageIndex +
    														  ', <b>Page Size:</b> ' + resultSet.pageSize + ' ]'; 
    
   
}

function setSearchOptions(start, index, resultsPerPage) {
    //map extent
    if (vector.getSource().getFeatures().length > 0) {				
		var extentGEOSS = ol.proj.transformExtent(vector.getSource().getExtent(), 'EPSG:3857', 'EPSG:4326');			
		south = Number(extentGEOSS[1]);
		west = Number(extentGEOSS[0]);
		north = Number(extentGEOSS[3]);
		east = Number(extentGEOSS[2]);		
	}
    else {
    	south = -90;
		west = -180;
		north = 90;
		east = 180;
    }
    
    //console.log('south: '+south+', west: '+west+', north: '+north+', east: '+east);
    
    //keys
    whatKEYS = [];
    var keyWords = document.getElementById('GEOSSPortalSearchKeys').value;
    if (keyWords != "") {
	    var keyArray = keyWords.split(' ');
	    for (var i=0; i<keyArray.length; i++) {
	    	whatKEYS.push(keyArray[i].toString()); 
	    }
    }
    if (whatSBA != "") {
        whatKEYS.push(whatSBA);
    }
    
    //Discover constraints
    
    //Extent
    constraints = {      
        "where": {
            "south": south,
            "west": west,
            "north": north,
            "east": east
         }               
    };  
    
    //Keys
    whatKEYS = [];
    var keyWords = document.getElementById('GEOSSPortalSearchKeys').value;
    if (keyWords != "") {
	    var keyArray = keyWords.split(' ');
	    for (var i=0; i<keyArray.length; i++) {
	    	whatKEYS.push(keyArray[i].toString()); 
	    }
    }
    if (whatSBA != "") {
        whatKEYS.push(whatSBA);
    }
    if (whatKEYS != "") {
    	constraints.what = whatKEYS;
    }
    
    //Time
    timeStart = document.getElementById('startDateGEOSS').value;
    timeEnd = document.getElementById('endDateGEOSS').value;
    if (timeStart != "" || timeEnd != "") {
    	constraints.when = {};
    	if (timeStart != "") {
        	constraints.when.from = timeStart;
    	}
    	if (timeEnd != "") {
        	constraints.when.to = timeEnd;
    	}
    }
        
    //Discover options
    options = {
    	"start": start,
        "pageIndex": index,
        "pageSize": resultsPerPage,
        "searchOperator": "AND"
    };
    //options.searchFields = "title,abstract";

}

function runSearch() {		
	startNode = 1; indexPage = 1;	
	setSearchOptions(startNode, indexPage, pageSize);
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
    // start discover
    dab.discover(onDABResponse, constraints, options);
}

function runDiscoverySearch() {
	discoverPages = [];
	usefulURLS = [];
	//numKML, numKMZ, numJPEG, numPNG, numGEOTIFF, numTIFF, numGML, numJPG, numTIF, numBMP
	numKML = 0; numKMZ = 0; numJPEG = 0; numPNG = 0; numGEOTIFF = 0; numTIFF = 0; numGML =0 ; numJPG = 0; numTIF = 0; numBMP = 0; numVector = 0; numWMS = 0;
	startNode = 1; indexPage = 1;	
	setSearchOptions(startNode, indexPage, pageSizeDiscover);
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
    // start discover
    dab.discover(onDABDiscoverResponse, constraints, options);
}

function parsePageResults(page) { 
	var divRef = document.getElementById('searchPageInfo'), element;
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
    document.getElementById('searchPageInfo').innerHTML += ('<h3>Nodes of result set page ('+indexPage+')</h3>'); 

    // iterates on page nodes
    while(page.hasNext()){
        // retrieves the next node of the current page
        node = page.next();       
        
	    // retrieves the current node report 
	    var report = node.report();       
	        
	    element = createNodeWell();
	    populateNodeInfo(report, element);
		populateNodeMetadata(node, report, element);  
    }
    
    $("#GEOSSPortalResultForm").scrollTop(0);
}

function parseDiscoverPageResults(page, pageId) { 
    //Start the next page while searching for results in this page
	renderNextDiscoverPage();

    // iterates on page nodes
    while(page.hasNext()){
        // retrieves the next node of the current page
        node = page.next();
        
        var testNode = 0;
        testNode = searchForLayers(node);
        if (testNode != 0) {
        	discoverPages.push(pageId);
        	break;
        }
    }    
}

function searchForLayers(nodeObject) {
	var found = 0;
	var vectorList = nodeObject.has_olVector_Layer();
	if (vectorList.length > 0) {
		found = 1;
		numVector += vectorList.length;
	}
	var wmsL = nodeObject.olWMS_Layer();
    if (wmsL.length > 0) {
        found = 1;
        numWMS += wmsL.length;
    }
    
    var nodeOnline = nodeObject.report().online;	
	if (typeof nodeOnline != 'undefined') {
		for (var i=0; i<nodeOnline.length; i++) {
        	parseNodeURL(nodeOnline[i].url);
        }
	}
    
	return found;
}

function parseNodeURL(theURL) {
	//numKML, numKMZ, numJPEG, numPNG, numGEOTIFF, numTIFF, numGML, numJPG, numTIF, numBMP
	var fileType = theURL.substr(theURL.lastIndexOf('.')+1, theURL.length);
	switch (fileType) {
	    case 'kml':
	    	numKML++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'kmz':
	    	numKMZ++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'jpeg':
	    	numJPEG++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'png':
	    	numPNG++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'geotiff':
	    	numGEOTIFF++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'tiff':
	    	numTIFF++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'gml':
	    	numGML++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'jpg':
	    	numJPG++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'tif':
	    	numTIF++;
	    	usefulURLS.push(theURL);
	        break;
	    case 'bmp':
	    	numBMP++;
	    	usefulURLS.push(theURL);
	        break;
	}
}

function createNodeWell() {
	//Create well for this node
    var divRef = document.getElementById('searchPageInfo');
    var element = document.createElement('div');
	element.setAttribute('class', 'well well-sm');
	divRef.appendChild(element);
	
	return element;
}

function populateNodeInfo(nodeReport, divId) {
	//Add well header
	var divRef = divId;
	var element = document.createElement('h4');
	element.innerHTML = 'Title: ' + nodeReport.title;
	divRef.appendChild(element);
	
	//Add well content
	element = document.createElement('p');
	element.innerHTML = nodeReport.description;
	divRef.appendChild(element);
	
	//Add well metadata
	element = document.createElement('p');
	element.innerHTML = '[<b>Creator:</b> ' + nodeReport.creator + ', <b>Topic:</b> ' + nodeReport.topic +
						', <b>Keywords:</b> ' + nodeReport.keyword + ', <b>Created:</b> ' + nodeReport.created + ']';
	divRef.appendChild(element);
	
}

function populateNodeMetadata(nodeObject, nodeReport, divId){
	var nodeOnline = nodeReport.online;
	console.log('***************************************************');
	console.log('ID: '+nodeReport.id);
	console.log('Report Type: '+ nodeReport.type);
	if (typeof nodeReport.rights != 'undefined') {
		console.log('Rights: '+nodeReport.rights.toString());
	}
	
	if (typeof nodeOnline != 'undefined') {
		for (var i=0; i<nodeOnline.length; i++) {
        	console.log('URL: '+nodeOnline[i].url);
        	console.log('Protocol: '+nodeOnline[i].protocol);
        	//console.log('Function: '+nodeOnline[i].function);
        	console.log('Access Type: '+nodeOnline[i].accessType);
        	console.log('Service Info: '+nodeOnline[i].service);
        	if (typeof nodeOnline[i].service != 'undefined') {
        		for (var j=0; j<nodeOnline[i].service.operations.length; j++) {
        			console.log('	Operation Name: '+nodeOnline[i].service.operations[j].name);
        			console.log('	Operation Name: '+nodeOnline[i].service.operations[j].binding.toString());
        			for (var k=0; k<nodeOnline[i].service.operations[j].online.length; k++) {
        				console.log('		Online URL: '+nodeOnline[i].service.operations[j].online[k].url);
        			}
        		}
        	}
        }
	}       
    
    //If the node is accessible, get the valid options for it and then get the access links
    if (nodeObject.isAccessible()) {
    	nodeObject.accessOptions(getValidOptions, true);
    }
    
    //If the node is simply accessible, get simple access links
    if (nodeObject.isSimplyAccessible ()) {
    	var saLinks = nodeObject.simpleAccessLinks();
    	for (var i=0; i<saLinks.length; i++) {
    		console.log('$$$$$$$$$$ Simple Access Link: '+saLinks[i]);
    	}
    }
    
    if (nodeReport.type == 'composed') {
    	//populateExpand(nodeObject, divId);
    }
	//populateOverview(nodeReport, divId);
    populateVectorLayers(nodeObject, divId);
    populateWMSLayers(nodeObject, divId);   
}

function populateExpand(nodeObject, divId) {
	var divRef, element;
	//Create button group element
	element = document.createElement('p');
	element.setAttribute('class', 'groupButtonHeader');
	element.innerHTML = '<b>Expand Node</b>';
    divId.appendChild(element);
    
    element = document.createElement('div');
	element.setAttribute('class', 'btn-group');
	element.setAttribute('role', 'group');
    divId.appendChild(element);
    divRef = element;
    
    element = document.createElement('button');
	element.type = 'button';
	element.setAttribute('class', 'btn btn-sm btn-default');
	element.title = 'Expand node';
	element.innerHTML = '<i class="fa fa-plus-square-o fa-lg"></i>';
	element.onclick = function () {
		nodeObject.expand(expandNodeResults, pageSize);
    };
	divRef.appendChild(element);
}

function populateOverview(nodeReport, divId) {
	var divRef, element;
	if (typeof nodeReport.overview != 'undefined') {
		//Create button group element
		element = document.createElement('p');
		element.setAttribute('class', 'groupButtonHeader');
    	element.innerHTML = '<b>Overview Image(s)</b>';
        divId.appendChild(element);
        
    	element = document.createElement('div');
    	element.setAttribute('class', 'btn-group');
    	element.setAttribute('role', 'group');
        divId.appendChild(element);
        divRef = element;
        
    	for (var i=0; i<nodeReport.overview.length; i++) {
    		console.log('Overview '+i+': ' + nodeReport.overview[i]);
    		element = document.createElement('button');
        	element.type = 'button';
        	element.setAttribute('class', 'btn btn-sm btn-default');
        	element.title = 'Show Overview';
        	element.innerHTML = '<i class="fa fa-picture-o fa-lg"></i>';
        	element.value = nodeReport.overview[i];
        	element.onclick = function () {
        		//show preview
        		//$('#modalGEOSSPortalResults').modal('hide');
            };
        	divRef.appendChild(element);
    	}
	}
}

function populateVectorLayers(nodeObject, divId) {
	var divRef, element;
	//Table with OpenLayers.Layer.Vector objects
    nodeObject.olVector_Layer(function(results) {
    	if (results.length > 0) {
            console.log('+++ Vector Layers: '+results.length);
            
            //Create button group element
            element = document.createElement('p');
    		element.setAttribute('class', 'groupButtonHeader');
        	element.innerHTML = '<b>Vector Layer(s)</b>';
            divId.appendChild(element);
            
        	element = document.createElement('div');
        	element.setAttribute('class', 'btn-group');
        	element.setAttribute('role', 'group');
            divId.appendChild(element);
            divRef = element;
            
            for (var i=0; i<results.length; i++) {
	            element = document.createElement('input');
	        	element.type = 'button';
	        	element.setAttribute('class', 'btn btn-sm btn-default');
	        	element.value = 'Vector';
	        	divRef.appendChild(element);
            }
        }
    });
}

function populateWMSLayers(nodeObject, divId) {
	var divRef, element;
	//Table with OpenLayers.Layer.WMS objects
    var wmsL = nodeObject.olWMS_Layer();
    if (wmsL.length > 0) {
        console.log('+++ WMS Layers: '+wmsL.length);
        
        //Create button group element
        element = document.createElement('p');
		element.setAttribute('class', 'groupButtonHeader');
    	element.innerHTML = '<b>WMS Layer(s)</b>';
        divId.appendChild(element);
        
    	element = document.createElement('div');
    	element.setAttribute('class', 'btn-group');
    	element.setAttribute('role', 'group');
        divId.appendChild(element);
        divRef = element;
        
        for (var i=0; i<wmsL.length; i++) {
            element = document.createElement('input');
        	element.type = 'button';
        	element.setAttribute('class', 'btn btn-sm btn-default');
        	element.value = 'WMS';
        	divRef.appendChild(element);
        }
    }
}

function getValidOptions(results) {
	node.accessLink(getAccessLinks, results, true);
}

function getAccessLinks(results) {
	for (var i=0; i<results.length; i++) {
		console.log('@@@@@@@@@@ AcessLink: '+results[i]);
	}
}

function renderNextPage() {
	if (paginator.next(onDABResponse, false)) {
		startNode += pageSize;
		indexPage ++;
		setSearchOptions(startNode, indexPage, pageSize);
	    
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
		
	    // start discover
	    dab.discover(onDABResponse, constraints, options);
	}
}

function renderNextDiscoverPage() {
	if (paginator.next(onDABDiscoverResponse, false)) {
		startNode += pageSizeDiscover;
		indexPage ++;
		setSearchOptions(startNode, indexPage, pageSizeDiscover);
		
	    // start discover
	    dab.discover(onDABDiscoverResponse, constraints, options);
	}
	else {
		hideSpinner();
	    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
	    console.log('FINISHED');
		console.log(discoverPages.toString());
		//numKML, numKMZ, numJPEG, numPNG, numGEOTIFF, numTIFF, numGML, numJPG, numTIF, numBMP
		console.log('KML: '+numKML+', KMZ: '+numKMZ+', JPEG: '+numJPEG+', PNG: '+numPNG+', GEOTIFF: '+numGEOTIFF+', TIFF: '+numTIFF+', GML: '+numGML+', JPG: '+numJPG+', TIF: '+numTIF+', BMP: '+numBMP+', Vector: '+numVector+', WMS: '+numWMS);
		for (var i=0; i<usefulURLS.length; i++){
			console.log('URL: '+usefulURLS[i]);
		}
	}
}

function renderPreviousPage() {
	if (paginator.prev(onDABResponse, false)) {
		startNode -= pageSize;
		indexPage --;
		setSearchOptions(startNode, indexPage, pageSize);
	    
		document.getElementById('alertMsgServerWait').style.display = 'block';
		showSpinner(colorSpin);
		
	    // start discover
	    dab.discover(onDABResponse, constraints, options);
	}
}

function checkLimits() {
	if (paginator.next(onDABResponse, false)) {
		document.getElementById('nextPage').disabled = false;
	}
	else {
		document.getElementById('nextPage').disabled = true;
	}
	
	if (paginator.prev(onDABResponse, false)) {
		document.getElementById('prevPage').disabled = false;
	}
	else {
		document.getElementById('prevPage').disabled = true;
	}
}

////////////////////////////////////////////////////////////////////////////////////////////////

function initSearchMapGEOSS() {
	document.getElementById('searchMapExtentFormGEOSS').style.display = 'block';
	document.getElementById('drawExtentButtonGEOSS').disabled = true;
	
	//Initialize map
	mapFilter = new ol.Map({
        layers: [base, vector],
        target: 'mapSearchExtentGEOSS',
        view: new ol.View({
          center: center,
          zoom: 6
        })
    });
	
	document.getElementsByClassName('ol-zoom')[0].style.top = '10px';
	document.getElementsByClassName('ol-zoom')[0].style.left = '10px';
   
    addInteraction();
}

function resetGEOSS() {
	document.getElementById('searchMapExtentFormGEOSS').style.display = 'none';
	document.getElementById('drawExtentButtonGEOSS').disabled = false;
	
	var divRef = document.getElementById('mapSearchExtentGEOSS');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	document.getElementById('GEOSSPortalSearchForm').reset();
	
	vector.getSource().clear();
}

function selectSBA(id) {
	if (document.getElementById(id).checked) {
		for (var i=1; i<=9; i++) {
			document.getElementById('radio'+i).checked = false;
		}
		document.getElementById(id).checked = true;
		whatSBA = document.getElementById(id).value.toString();
	}
	else {
		whatSBA = "";
	}
}
