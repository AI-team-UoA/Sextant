/**
 * Zoom to all layers
 */
function zoomToAll(operation) {	
	showMap();
	
	var allLayersBounds = new OpenLayers.Bounds();
	
	if(mapLayers.length > 1) {
		for (var i=0; i<mapLayers.length; i++) {
	        var temp = map.getLayersByName(mapLayers[i].name);
	
	       	if (mapLayers[i].type === 'geotiff') {
	           	allLayersBounds.extend(temp[0].extent);
	       	}
	       	else if (mapLayers[i].type === 'wms') {
	       		allLayersBounds.extend(mapLayers[i].imageBbox);
	       	}
	       	else if (mapLayers[i].type != 'wms'){
	           	allLayersBounds.extend(temp[0].getDataExtent());
	       	}       
	    }	
		
		if (!operation) {
			map.zoomToExtent(allLayersBounds); 
		}
		return allLayersBounds.transform(WGS84_google_mercator, WGS84).toString();
	}
}

/**
 * Move to Manage Layers view
 */
function showLayersMenu() {
	document.getElementById('layerspage').style.zIndex = '10';	
}

/**
 * Move to Map Info view
 */
function showMapMenu() {
	document.getElementById('mapPage').style.zIndex = '10';	    
}

/**
 * Move to map/timeline view
 */
function showMap() {
	document.getElementById('map_canvas').style.zIndex = '5';	
	
    //Trick to refresh timeline because of a bug that makes it dissapear
    if (isTimeMap) {
    	document.getElementById('timeline').style.display = 'block';
	    moveTimeLeft();
	    moveTimeRight();
    }
        
    //Update the size of the map
    map.updateSize();
    refreshMap();	
}

/**
 * Show all layers
 */
function showAllLayers() {	
    for (var i=0; i<mapLayers.length; i++) {
    	var temp = map.getLayersByName(mapLayers[i].name);     	
        temp[0].setVisibility(true);
    	document.getElementById("shBox"+mapLayers[i].name).checked = true;
    }   
}

/**
 * Hide all layers
 */
function hideAllLayers() {	
    for (var i=0; i<mapLayers.length; i++) {
        var temp = map.getLayersByName(mapLayers[i].name);
        temp[0].setVisibility(false);
        document.getElementById("shBox"+mapLayers[i].name).checked = false;
    }   
}

/**
 * Hide time buttons if we choose simple map.
 */
function hideTimeButtons() {
    document.getElementById('moveLeft').style.display = 'none';
    document.getElementById('moveRight').style.display = 'none';
    document.getElementById('moveMetric').style.display = 'none';  
}

function showColorPanel() {
	document.getElementById('colorPanel').style.display = 'block';
}

function closeColorPanel() {
	document.getElementById('colorPanel').style.display = 'none';
}

function printAll() {
	for (var i=0; i<mapLayers.length; i++) {
		alert(mapLayers[i].name+' '+mapLayers[i].isTemp+' '+mapLayers[i].mapId+' '+mapLayers[i].imageBbox);
	}
}

function refreshMap() {
	//map.zoomIn();
	//map.zoomOut();
}

/**
 * Show/hide Timeline
 */
function showTimeline() {
	document.getElementById('timeline').style.zIndex = '5';
	document.getElementById('goLeft').style.zIndex = '6';
	document.getElementById('goRight').style.zIndex = '6';
	document.getElementById('days').style.zIndex = '6';
}

function hideTimeline() {
	document.getElementById('timeline').style.zIndex = '-1';
	document.getElementById('goLeft').style.zIndex = '-1';
	document.getElementById('goRight').style.zIndex = '-1';
	document.getElementById('days').style.zIndex = '-1';
}

/**
 * Expand/Shrink Timeline
 */
function expandTimeline() {
	document.getElementById('tmContainer').style.height = '60%';
	document.getElementById('tmContainer').style.top = '40%';
	showMap();
}

function shrinkTimeline() {
	document.getElementById('tmContainer').style.height = '30%';
	document.getElementById('tmContainer').style.top = '70%';
	showMap();
}

/**
 * Loading indicator
 */
function showSpinner(colorID)
{
	colorID = '#F5F5F5';
	window.scrollTo(0,0);
    var opts = {
              lines: 12, // The number of lines to draw
              length: 6, // The length of each line
              width: 3, // The line thickness
              radius: 8, // The radius of the inner circle
              rotate: 0, // The rotation offset
              color: colorID, // #rgb or #rrggbb
              speed: 1, // Rounds per second
              trail: 60, // Afterglow percentage
              shadow: false, // Whether to render a shadow
              hwaccel: false, // Whether to use hardware acceleration
              className: 'spinner', // The CSS class to assign to the spinner
              zIndex: 5000, // The z-index (defaults to 2000000000)
              top: 0, // Top position relative to parent in px
              left: 0 // Left position relative to parent in px
            };
            var spinner = new Spinner(opts).spin();
            $("#loadingWheel").append(spinner.el);
}
function hideSpinner(){     
    $('.spinner').hide();
}

function showSpinnerDescribe(colorID)
{
	//colorID = '#F5F5F5';
	window.scrollTo(0,0);
    var opts = {
              lines: 12, // The number of lines to draw
              length: 6, // The length of each line
              width: 3, // The line thickness
              radius: 8, // The radius of the inner circle
              rotate: 0, // The rotation offset
              color: colorID, // #rgb or #rrggbb
              speed: 1, // Rounds per second
              trail: 60, // Afterglow percentage
              shadow: false, // Whether to render a shadow
              hwaccel: false, // Whether to use hardware acceleration
              className: 'spinner', // The CSS class to assign to the spinner
              zIndex: 5000, // The z-index (defaults to 2000000000)
              top: 0, // Top position relative to parent in px
              left: 0 // Left position relative to parent in px
            };
            var spinner = new Spinner(opts).spin();
            $("#loadingWheelDescribe").append(spinner.el);
}
function hideSpinnerDescribe(){     
    $('.spinner').hide();
}

/**
 * Set new server URL
 */
function setNewServer() {
	var newServer = document.getElementById('serverURL').value;
	rootURL = newServer + '/rest/service';
	
	var newHostArr = newServer.replace("http://", "").split("/");
	var parseNewRootURL = newHostArr[0].split(':');
	server = parseNewRootURL[0];
	
	element = document.createElement('option');
	element.id = newServer;
    element.value = newServer;
    element.text = newServer;
    document.getElementById('selectServerURL').appendChild(element);
    
    document.getElementById('serverURL').value = null;
    
    var selectList = document.getElementById('selectServerURL');
    for(var opt, i = 0; opt = selectList.options[i]; i++) {
        if(opt.value == newServer) {
        	selectList.selectedIndex = i;
            break;
        }
    }
}

/**
 * Set server URL the selected from list
 */
function setSelectedServer() {
	var element = document.getElementById('selectServerURL');
	var newServer = element.options[element.selectedIndex].value;
	rootURL = newServer + '/rest/service';
	
	var newHostArr = newServer.replace("http://", "").split("/");
	var parseNewRootURL = newHostArr[0].split(':');
	server = parseNewRootURL[0];	
}

/**
 * stRDF representation to WKT. Take as input the map extent in EPSG:4326
 * @param bbox
 */
function mapExtentToWKT(bbox) {
	var polygon = createPolygon(bbox);
	var extent = polygon+';http://www.opengis.net/def/crs/EPSG/0/4326';
	return extent;
}

/**
 * GeoSPARQL representation to WKT. Take as input the map extent in EPSG:4326
 * @param bbox
 */
function mapExtentToWKTLiteral(bbox) {
	var polygon = createPolygon(bbox);
	return polygon;
}

/**
 * Create a polygon string from the OpenLayers.Bounds object
 * @param bbox
 */
function createPolygon(bbox) {
	var parseBBOX = bbox.split(',');
	var left = Number(parseBBOX[0]);
	var bottom = Number(parseBBOX[1]);
	var right = Number(parseBBOX[2]);
	var top = Number(parseBBOX[3]);
	
	var polygon = 'POLYGON(('+bottom+' '+right+', '+
							  bottom+' '+left+', '+
							  top+' '+left+', '+
							  top+' '+right+', '+
							  bottom+' '+right+'))';
	
	return polygon;
}

var animateLegend = 0;
var animateTimeline = 0;
var animateSwefs = 0;
function animateLegendPanel() {
	if (animateLegend == 0) {	
		document.getElementById('animatePanelButton').innerHTML = '<i class="fa fa-chevron-left fa-lg"></i>';
		document.getElementById('animatePanelButton').title = 'Show Panel';
		$("#legendPanel").animate({right: -($("#legendPanel").width())}, 500);		
		animateLegend = 1;
	}
	else {		
		document.getElementById('animatePanelButton').innerHTML = '<i class="fa fa-chevron-right fa-lg"></i>';
		document.getElementById('animatePanelButton').title = 'Hide Panel';
		$("#legendPanel").animate({right: 0}, 500);				
		animateLegend = 0;
	}
}

function animateTimePanel() {
	if (animateTimeline == 0) {	
		document.getElementById('animateTimelineButton').innerHTML = '<i class="fa fa-chevron-right fa-lg"></i>';
		document.getElementById('animateTimelineButton').title = 'Hide Timeline';
		$("#tmContainer").animate({right: 0}, 500);		
		animateTimeline = 1;
	}
	else {		
		document.getElementById('animateTimelineButton').innerHTML = '<i class="fa fa-chevron-left fa-lg"></i>';
		document.getElementById('animateTimelineButton').title = 'Show Timeline';
		$("#tmContainer").animate({right: -($("#tmContainer").width())}, 500);				
		animateTimeline = 0;
	}
}

function animateSwefsPanel() {
	if (animateSwefs == 0) {	
		document.getElementById('animateSwefsPanelButton').innerHTML = '<i class="fa fa-chevron-right fa-lg"></i>';
		document.getElementById('animateSwefsPanelButton').title = 'Hide SWeFS Panel';
		var width = $("#map_canvas").width()*0.8 - 20;
		$("#swefsPanel").animate({right: width}, 500);		
		animateSwefs = 1;
		
	}
	else {		
		document.getElementById('animateSwefsPanelButton').innerHTML = '<i class="fa fa-chevron-left fa-lg"></i>';
		document.getElementById('animateSwefsPanelButton').title = 'Show SWeFS Panel';
		$("#swefsPanel").animate({right: -($("#swefsPanel").width() + 200)}, 500);				
		animateSwefs = 0;
	}
}

function showNOA() {
	document.getElementById('NOA').style.zIndex = '2000';
}

function closeNOA() {
	document.getElementById('NOA').style.zIndex = '-100';
}

function baseGsat() {
	map.setBaseLayer(gsat);
	document.getElementById('coordinates').style.color = '#FFCC66';
}

function baseGmap() {
	map.setBaseLayer(gmap);
	document.getElementById('coordinates').style.color = '#A30052';
}

function baseGhyb() {
	map.setBaseLayer(ghyb);
	document.getElementById('coordinates').style.color = '#FFCC66';
}

function disableFeatures(disableAll, disableSaveMap) {
	if (disableAll == true) {
		//disable functions: okBTNall class
	    var okBTNs = document.getElementsByClassName('okBTNall');
	    for (var i=0; i<okBTNs.length; i++) {
	    	okBTNs[i].disabled = true;
	    }
	}
	
	if (disableSaveMap == true) {
		//disable save map function: okBTNsaveMap class
	    var okBTNsave = document.getElementsByClassName('okBTNsaveMap');
	    for (var i=0; i<okBTNsave.length; i++) {
	    	okBTNsave[i].disabled = true;
	    }
	}
}

function showManualPages() {
	document.getElementById('manualPages').style.display = 'block';
}

function closeManualPages() {
	document.getElementById('manualPages').style.display = 'none';
}

function showHelpPage(pageId) {
	document.getElementById('manualFrame').src = "./assets/manual/"+pageId;
	showManualPages();
}