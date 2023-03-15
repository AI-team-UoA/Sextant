var sinceId = 0;
var maxId = 0;
var allTwitts = [];

function parseTwitterSearchResults(results, status, jqXHR) {
	var resultsObj = JSON.parse(results);
	//console.log(resultsObj);
	var parser = resultsObj.twitterIds.replace('[', '').replace(']', '').split(', ');
	
	var divRef = document.getElementById('twitterInformationTable');
	for (var i=0; i<parser.length; i++) {	
		if ($.inArray(parser[i], allTwitts) == -1) {
			allTwitts.push(parser[i]);
			
			var twittID = parser[i].split('@')[0];
			var twittLocation = parser[i].split('@')[1];
			
			//console.log(twittID+'@'+twittLocation);
			if (twittLocation != 'null') {
				addTwittOnMap(twittID, twittLocation);
			}
			
			var element = document.createElement('div');
		    element.id = 'twitter'+twittID;
		    divRef.appendChild(element);
		    twttr.widgets.createTweet(
		    		twittID,
		    		document.getElementById('twitter'+twittID),
		    		{
		    			conversation: 'none'
		    		}
		    );
		}
	}
	sinceId = resultsObj.sinceId;
	maxId = resultsObj.maxId;
	
	document.getElementById('updateTwitterSearchBtn').style.display = 'block';
	hideSpinnerTwitter();
}

function parseTwitterSearchResultsUpdate(results, status, jqXHR) {
	var resultsObj = JSON.parse(results);
	//console.log(resultsObj);
	var parser = resultsObj.twitterIds.replace('[', '').replace(']', '').split(', ');
	
	var divRef = document.getElementById('twitterInformationTable');
	for (var i=0; i<parser.length; i++) {		
		if ($.inArray(parser[i], allTwitts) == -1) {
		    allTwitts.push(parser[i]);
			
			var twittID = parser[i].split('@')[0];
			var twittLocation = parser[i].split('@')[1];
			
			//console.log(twittID+'@'+twittLocation);
			if (twittLocation != 'null') {
				addTwittOnMap(twittID, twittLocation);
			}
			
			var element = document.createElement('div');
		    element.id = 'twitter'+twittID;
		    divRef.appendChild(element);
		    twttr.widgets.createTweet(
		    		twittID,
		    		document.getElementById('twitter'+twittID),
		    		{
		    			conversation: 'none'
		    		}
		    );
		}
	}
	sinceId = resultsObj.sinceId;
	maxId = resultsObj.maxId;
	hideSpinnerTwitter();
}

function scrollTopPanels() {
	$("#sextantPanels").animate({scrollTop: 0}, 500);
}

/////////////////////////////

function searchTwitterRestLocation() {
	showSpinnerTwitter(colorSpin);
	
	sinceId = 0;
	maxId = 0;
	allTwitts = [];
	
	var keys = document.getElementById('twitterSearchKeys').value;
	   
	var divRef = document.getElementById('twitterInformationTable');
	divRef.innerHTML = "";
	
	//Delete previous layer with twitts if it exists
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == 'twitterLayer') {
    		map.removeLayer(layer);
    	}
    });
	
	
	if (keys != '') {
		//Image Vector layer to use WebGL rendering
		var layer = new ol.layer.Image({
			title: 'twitterLayer',
	        source: new ol.source.ImageVector({
	          source: new ol.source.Vector(),
	          style: defaultTwitterStyle
	        })
	    });
		
		map.addLayer(layer);
		
		parseDataString(keys, false);
	}
	else {
		document.getElementById('updateTwitterSearchBtn').style.display = 'none';
		hideSpinnerTwitter();
	}
}

function searchTwitterRestUpdateLocation() {
	showSpinnerTwitter(colorSpin);
	var keys = document.getElementById('twitterSearchKeys').value;
	
	if (keys != '') {
		parseDataString(keys, true);
	}
	else {
		var divRef = document.getElementById('twitterInformationTable');
		divRef.innerHTML = "";
		document.getElementById('updateTwitterSearchBtn').style.display = 'none';
		hideSpinnerTwitter();
	}
}

function parseDataString(data, method) {
	var keys = data.split(' ');
	var keywords = [];
	var results = {'keys': '',
				   'locations':[],
				   'method': method};
	
	for (var i=0; i<keys.length; i++) {
		if (keys[i].startsWith('*')) {
			results.locations.push(keys[i].replace('*', '').replace(/\+/g, ' '));
		}
		else {
			keywords.push(keys[i]);
		}
	}
	
	results.keys = keywords.toString().replace(/\,/g, ' ');
	getLocation(results);	
}

function getLocation(keywords) {
	$.ajax({
		url: "http://dev.virtualearth.net/REST/v1/Locations",
        dataType: "jsonp",
        data: {
        	key: bingMapsKey,
            q: keywords.locations.pop()
        },
        jsonp: "jsonp",
        success: function (data) {
        	var result = data.resourceSets[0];
        	console.log(keywords.keys);
            if (result) {
            	if (result.estimatedTotal > 0) {
            		//All locations relevant to the given name. Get the first match
            		//console.log(result.resources[0].geocodePoints[0].coordinates);           		           		
            		
            		$.ajax({
            	        type: 'GET',
            	        url: rootURL + '/findTwittsRest?keys='+encodeURIComponent(keywords.keys)+'&sinceId='+sinceId+'&maxId='+maxId+'&update='+keywords.method+'&location='+encodeURIComponent(result.resources[0].geocodePoints[0].coordinates),
            	        headers: {
            	        	//'Accept-Charset' : 'utf-8',
            	        	'Content-Type'   : 'text/plain; charset=utf-8',
            	        },
            	        timeout: 0,
            	        success: parseTwitterSearchResults,
            	        error: printError
            	    });
            		
                }
            }
        },
        error: function(msg) {
        	console.log(keywords.keys);

        	//No location keywords detected
        	$.ajax({
    	        type: 'GET',
    	        url: rootURL + '/findTwittsRest?keys='+encodeURIComponent(keywords.keys)+'&sinceId='+sinceId+'&maxId='+maxId+'&update='+keywords.method,
    	        headers: {
    	        	//'Accept-Charset' : 'utf-8',
    	        	'Content-Type'   : 'text/plain; charset=utf-8',
    	        },
    	        timeout: 0,
    	        success: parseTwitterSearchResults,
    	        error: printError
    	    });
        }
	});
}

function addTwittOnMap(twittID, twittLocation) {
	if (twittLocation == undefined) {
		return;
	}
	var parseLocation = twittLocation.split(',');
	var lat = Number(parseLocation[0]);
	var lon = Number(parseLocation[1]);
	
	var jsonObj = {
            "type": "Feature", 
            "properties": {
            	"name": "Twitt ["+twittID+"]",
            	"description": twittID,
            	"objectType": "twitt"
            },
            "geometry": {"type": "Point",
            			 "coordinates": [lon, lat]}
    };

	var opt_options = {
            'dataProjection': 'EPSG:4326',				
            'featureProjection': 'EPSG:3857'			
	};
	
	//CLose popup and clear selected features
    mapSelectInterraction.getFeatures().clear();
    clearPopup();  
    
    map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == 'twitterLayer') {
    		console.log(jsonObj);
    		layer.getSource().getSource().addFeatures((new ol.format.GeoJSON()).readFeatures(jsonObj, opt_options));
    		
    		map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
    	}
    });
}