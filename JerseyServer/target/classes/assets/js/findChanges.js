var mapChangeset;
var drawControlChangeset;
var boxLayerChangeset = null;
var evtSource;

function selectAreaChangeset() {
	$('#modalChangesetSearch').modal('show');
	$('#modalChangesetSearch').on('shown.bs.modal', function() {
		//Initialize map
		mapChangeset = new OpenLayers.Map('mapExtentChangeset');
		
		var ghyb = new OpenLayers.Layer.Google("Google Hybrid",
	            {type: google.maps.MapTypeId.HYBRID, numZoomLevels: 15, visibility: false}
	            );
		
		mapChangeset.projection = new OpenLayers.Projection("EPSG:900913");
		mapChangeset.displayProjection = new OpenLayers.Projection("EPSG:4326");
		
		mapChangeset.addLayers([ghyb]);
		mapChangeset.setBaseLayer(ghyb);	
		mapChangeset.setCenter(new OpenLayers.LonLat(23.72275, 37.92253).transform(new OpenLayers.Projection("EPSG:4326"), new OpenLayers.Projection("EPSG:900913")), 6, true, true);
		
		//Add draw box contols
		boxLayerChangeset = new OpenLayers.Layer.Vector("Box layer changeset");
		drawControlChangeset = new OpenLayers.Control.DrawFeature(boxLayerChangeset,
		                                                     OpenLayers.Handler.RegularPolygon, 
		                                                     { 
																eventListeners: {'featureadded': newPolygonAddedChangeset},
												      			handlerOptions: {
												      				sides: 4,
											                        irregular: true
												      			}
		                                                     });
		mapChangeset.addControl(drawControlChangeset);
		mapChangeset.addLayer(boxLayerChangeset);
	}); 	
}

function enableControlChangeset() {
	drawControlChangeset.activate();
	document.getElementById("enableControlDrawChangeset").style.borderColor = "red";
}

function newPolygonAddedChangeset() {
	drawControlChangeset.deactivate();
	document.getElementById("enableControlDrawChangeset").style.borderColor = '#ccc';	
}

function resetPolygonBoxChangeset() {
	boxLayerChangeset.removeAllFeatures();
	drawControlChangeset.deactivate();
}

function resetChangesetMapForm() {	
	var divRef = document.getElementById('mapExtentChangeset');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	document.getElementById('changesetForm').reset();
	boxLayerChangeset = null;
}

function getChangesetResults() {
	var searchTitle = document.getElementById('changesetTitle').value;
	if (searchTitle == "") {
		searchTitle = 'none';
	}
	
	var extent = 'none';
	if (boxLayerChangeset != null) {
		if (boxLayerChangeset.getDataExtent() != null) {		
			extent = mapExtentToWKTLiteral(boxLayerChangeset.getDataExtent().transform(WGS84_google_mercator, WGS84).toString());			
			console.log(extent);			
			showSpinner(colorSpin);		
			
			if(typeof(EventSource) !== "undefined") {
			    var source = new EventSource('http://popeye.di.uoa.gr:8080/ChangeDetectionApi/changeDService?title='+searchTitle+'&extent='+extent);
			    source.onmessage = function(event) {
			    	var newElementMsg = document.getElementById('alertMsgChangeset');			  
				    newElementMsg.innerHTML = "<strong>Please wait!</strong> " + event.data;
				    document.getElementById('alertMsgChangeset').style.display = 'block';
				    
				    //Check message to close the SSE
				    if (event.data == 'Hello world 9!') {
				    	source.close();
				    	setTimeout(function() {$('#alertMsgChangeset').fadeOut('slow');}, fadeTime);
				    	hideSpinner();
				    }
			    };
			}
			
			/*
			$.ajax({
		        type: 'POST',
		        //url: 'http://popeye.di.uoa.gr:8080/ChangeDetectionApi/changeDService',
		        url: rootURL + '/tester',
		        //data: {title: searchTitle, extent: extent},	
		        data: extent,
		        dataType: 'text',
		        headers: {
		        	'Content-Type'   : 'text/plain; charset=utf-8',
		        },
		        timeout: ajaxTimeout,
		        success: parseChangesetResults,
		        error: printError
		    });
			
			$.ajax({
		        type: 'GET',
		        //url: rootURL + '/tester2?title='+searchTitle+'&extent='+extent,
		        url: 'http://popeye.di.uoa.gr:8080/ChangeDetectionApi/changeDService?title='+searchTitle+'&extent='+extent,
		        //data: {title: searchTitle, extent: extent},	
		        headers: {
		        	'Content-Type'   : 'text/plain; charset=utf-8',
		        },
		        timeout: ajaxTimeout,
		        success: parseChangesetResults,
		        error: printError
		    });
			*/	
			
		}
		else {
			document.getElementById('alertMsgBBOXNoValue').style.display = 'block';
	        setTimeout(function() {$('#alertMsgBBOXNoValue').fadeOut('slow');}, fadeTime);
		}
	}
		
	resetChangesetMapForm();
}

function parseChangesetResults(results, status, jqXHR) {
	console.log(results);
	hideSpinner();
}