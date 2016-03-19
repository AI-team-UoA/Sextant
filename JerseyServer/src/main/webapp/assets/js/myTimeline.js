//http://simile-widgets.org/wiki/Timeline

var temporalFeatures = [];
var eventSource;
var clickTimeline = false;

/**
 * Create a new SIMILE timeline (div: timeline)
 */
var tl;
function initTimeline() {
	SimileAjax.History.enabled = false;
	
	eventSource = new Timeline.DefaultEventSource();
	var bandInfos = [
	                 Timeline.createBandInfo({
	                	 eventSource:    eventSource,
	                	 width:          "80%", 
	                	 intervalUnit:   Timeline.DateTime.MONTH, 
	      		       	 trackHeight:    0.9,
	      		       	 trackGap:       0.2,
	      		       	 intervalPixels: 100,
	      		       	 zoomIndex:      10,
	      		       	 zoomSteps:      new Array(
	      	                {pixelsPerInterval: 280,  unit: Timeline.DateTime.HOUR},
	      	                {pixelsPerInterval: 140,  unit: Timeline.DateTime.HOUR},
	      	                {pixelsPerInterval:  70,  unit: Timeline.DateTime.HOUR},
	      	                {pixelsPerInterval:  35,  unit: Timeline.DateTime.HOUR},
	      	                {pixelsPerInterval: 400,  unit: Timeline.DateTime.DAY},
	      	                {pixelsPerInterval: 200,  unit: Timeline.DateTime.DAY},
	      	                {pixelsPerInterval: 100,  unit: Timeline.DateTime.DAY},
	      	                {pixelsPerInterval:  50,  unit: Timeline.DateTime.DAY},
	      	                {pixelsPerInterval: 400,  unit: Timeline.DateTime.MONTH},
	      	                {pixelsPerInterval: 200,  unit: Timeline.DateTime.MONTH},
	      	                {pixelsPerInterval: 100,  unit: Timeline.DateTime.MONTH} // DEFAULT zoomIndex
	      		       	 )
	                 }),
	                 Timeline.createBandInfo({
	                	 width:          "20%",
	                	 eventSource:    eventSource,
	      		       	 intervalUnit:   Timeline.DateTime.YEAR, 
	      		       	 intervalPixels: 150,
	      		       	 showEventText:  false,
	      		       	 trackHeight:    0.2,
	      		       	 trackGap:       0.2,
	      		       	 overview: 	  true
	                 })
	               ];
	bandInfos[1].syncWith = 0;
	bandInfos[1].highlight = true;
	               
	tl = Timeline.create(document.getElementById("timeline"), bandInfos);
	tl._bands[1].addOnScrollListener(viewTemporalLayers);
	
	updateCurrentTime();
	
	Timeline.OriginalEventPainter.prototype._showBubble = function(x, y, evt) {
		   onFeatureSelectTimeline(map.getLayersByName(evt._obj.title)[0].getFeatureById(evt._obj.featureID));
	};
}

/**
 * Keep a structure with: {layerName, featureID, when, begin, end, featureStyle, dirty}.
 * We can use this structure to show/hide features when we move the timeline.
 * When we delete a temporal layer we change the dirty attr of the features that belong to it into true.
 */
function parseTimelineFeatures(layer, uri) {
	$.get(uri, function(data) {
		var features = layer.features;
		var position = 0;
		for (var i=0; i<mapLayers.length; i++) {
			if (mapLayers[i].name == layer.name) {
				position = i;
				break;
			}
		}	
		
		//Parse XML document to extract time features
		var pms = data.getElementsByTagName('Placemark');
		for(var i=0; i<pms.length; ++i) {
            var when = checkElement(pms[i], 'when');
            var begin = checkElement(pms[i], 'begin');
            var end = checkElement(pms[i], 'end');
            
            //Correct end tags if they are null, but a begin tag is present. This means that the placemark is valid till now
            if (begin != null && end == null) {
            	end = '2500-01-01T00:00:00';
            }
            
            var featureID = features[i].id;
            var icon = mapLayers[position].icon;
            var color = mapLayers[position].fillColor;
            
            var tf = new TempFeature(layer.name, featureID, layer.name, when, begin, end, icon, color, false);
            temporalFeatures.push(tf);
        }
		addEventsTimeline(layer);
	});
	
	updateCurrentTime();
}

function checkElement(element, name) {
	var results = element.getElementsByTagName(name);
	if (results.length > 0) {
		return results[0].childNodes[0].nodeValue;
	}
	else {
		return null;
	}
}

/**
 * Add the new events on the timeline. On Temporal KML load, parse placemarks
 * to produce JSON with events to be added on the timeline.
 */
function addEventsTimeline(layer) {
	var eventList = [];
	var startDate = new Date();
	for (var i=0; i<temporalFeatures.length; i++) {
		if (layer.name == temporalFeatures[i].layerName && temporalFeatures[i].dirty == false) {
			var newEvent;
			var description = layer.getFeatureById(temporalFeatures[i].featureID).attributes.description;
			
			if (temporalFeatures[i].when != null) {
				newEvent = {'start' : temporalFeatures[i].when,
							'durationEvent' : false,
							'title' : layer.name,
							'description' : description,
							'eventID' : layer.name,
							'textColor' : '#000000',
							'icon' : temporalFeatures[i].icon,
							'featureID' : temporalFeatures[i].featureID};	
				var tempDate = new Date(temporalFeatures[i].when);
				if (tempDate < startDate) {
					startDate = tempDate;
				}
			}
			else {
				newEvent = {'start' : temporalFeatures[i].begin,
							'end' : temporalFeatures[i].end,
							'durationEvent' : true,
							'title' : layer.name,
							'description' : description,
							'eventID' : layer.name,
							'textColor' : '#000000',
							'color' : temporalFeatures[i].color,
							'featureID' : temporalFeatures[i].featureID};
				var tempDate = new Date(temporalFeatures[i].begin);
				if (tempDate < startDate) {
					startDate = tempDate;
				}
			}
			eventList.push(newEvent);
		}
	}
	
	var timeline_data = {'events' : eventList};
	eventSource.loadJSON(timeline_data, '.');
	
	moveTimeLeft();
	moveTimeRight();
	moveTimelineToDate(startDate);
}

/**
 * Create mechanism to show/hide features according to timeline position
 */
var viewTemporalLayers = function () {
	resizeEventIcons();
	updateCurrentTime();
	var begin = tl._bands[0].getMinVisibleDate().getTime();
	var end = tl._bands[0].getMaxVisibleDate().getTime();
	
	var eventArr = eventSource._events._events._a;
	for (var i=0; i<eventArr.length; i++) {
		computeVisibility(begin, end, eventArr[i]);
	}
};

function computeVisibility(begin, end, evt) {
	var evtStart = evt._start.getTime();
	var evtEnd = evt._end.getTime();
	var layerName = evt._eventID;
	
	var temp = map.getLayersByName(layerName);
    
    if (eventInsideBand(begin, end, evtStart, evtEnd) == true) {
        temp[0].setVisibility(true);
    }
    else{
        temp[0].setVisibility(false);
    }
}

function eventInsideBand(begin, end, evtStart, evtEnd) {
	if ( (evtEnd >= begin) && (evtStart <= end) ) {
		return true;
	} 
	else {
		return false;
	}
}


/**
 * Move timeline with buttons
 */
function moveTimeLeft() {
		timeTravelValue = 10;
		var date = tl.getBand(0).getCenterVisibleDate();
		var mSecs= Date.parse(date.toString());
		if (document.getElementById('metric').value != "") {
			timeTravelValue = document.getElementById('metric').value;
		}
		mSecs= mSecs - (timeTravelValue*24*60*60*1000);
		date.setTime(mSecs);
		tl.getBand(0).setCenterVisibleDate(date);
		
		updateCurrentTime();
		viewTemporalLayers;
}

function moveTimeRight() {
		timeTravelValue = 10;
		var date = tl.getBand(0).getCenterVisibleDate();
		var mSecs= Date.parse(date.toString());
		if (document.getElementById('metric').value != "") {
			timeTravelValue = document.getElementById('metric').value;
		}
		mSecs= mSecs + (timeTravelValue*24*60*60*1000);
		date.setTime(mSecs);
		tl.getBand(0).setCenterVisibleDate(date);
		
		updateCurrentTime();
		viewTemporalLayers;
}

function moveTimelineToDate(givenDate) {
	var mSecs = Date.parse(givenDate.toString());
	
	givenDate.setTime(mSecs);
	tl.getBand(0).setCenterVisibleDate(givenDate);
	
	updateCurrentTime();
	viewTemporalLayers;
}

var play = 0;
function playTime() {
	if (play == 0) {
		play = 1;
		document.getElementById('playButton').innerHTML = '<span class="glyphicon glyphicon-pause" aria-hidden="true"></span>';
		startClock = setInterval(function () {moveTimeRight();}, 1000);
	}
	else {
		clearInterval(startClock);
		play = 0;
		document.getElementById('playButton').innerHTML = '<span class="glyphicon glyphicon-play" aria-hidden="true"></span>';
	}
}

function updateCurrentTime() {
	document.getElementById('currentTime').innerHTML = '<p>'+tl.getBand(0).getCenterVisibleDate().toString()+'</p>';
}

/**
 * Change the colors of the timeline events according to the style of the layer
 * @param layer
 * @param icon
 * @param color
 */
function timelineSetColors(name, icon, color) {
	var eventArr = eventSource._events._events._a;
	for (var i=0; i<eventArr.length; i++) {
		if (eventArr[i]._eventID == name) {
			if (icon != '') {
	            eventArr[i]._icon = icon;
			}
			eventArr[i]._color = color;
		}
	}
	tl.layout();
	resizeEventIcons();
}

function resizeEventIcons() {
	var elementIcons = document.getElementsByClassName("timeline-event-icon");
	for (var i=0; i<elementIcons.length; i++) {
		elementIcons[i].childNodes[0].className = 'evtIcon';
	}
}

/**
 * Delete events from timeline when we delte a temporal layer
 * @param name
 */
function deleteTimelineEvents(name) {
	var countEvents = 0;
	var eventArr = eventSource._events._events._a;
	
	for (var i=0; i<eventArr.length; i++) {
		if (eventArr[i]._eventID == name) {
			countEvents ++;
		}
	}
		
	for (var j=0; j<countEvents; j++) {
		eventArr = eventSource._events._events._a;
		for (var i=0; i<eventArr.length; i++) {
			if (eventArr[i]._eventID == name) {
				eventArr.splice(i, 1);
				break;
			}
		}
	}
		
	tl.layout();
}

/**
 * Function handler for a click event on a feature of the timeline.
 */
function onFeatureSelectTimeline(feature) {	
	if (typeof feature.cluster != 'undefined') {
		if(feature.cluster.length > 1) {
			return ;  
		}
	}
	else {	
		popupClose(0);
		
		clickTimeline = true;
		lonLat = feature.geometry.getBounds().getCenterLonLat();
		
		for (var i=0; i<map.controls.length; i++){
			if (map.controls[i].displayClass == "olControlSelectFeature") {
				map.controls[i].select(feature);
				break;
			}
		}
	}		
}

/**
 * Function handler when a balloon is closed.
 */
var popupCloseTrigger = false;
function popupClose(mode) {
	//mode == 0: JS trigger
	
	//UI close button trigger
	if (mode == 1) {
		popupCloseTrigger = true;
	}
	
	if (currentFeature != null) {
		if (typeof currentFeature.cluster != 'undefined') {
			if(currentFeature.cluster.length > 1) {
				return ;  
			}
		}
		else {	
			if (currentFeature.popup) {
				map.removePopup(currentFeature.popup);
				currentFeature.popup = null;
				
				if (mode != 2) {
					for (var i=0; i<map.controls.length; i++){
						if (map.controls[i].displayClass == "olControlSelectFeature") {
							map.controls[i].unselect(currentFeature);
							break;
						}
					}
				}
			}
			
			if (currentFeature.style != null && mode != 2) {
				currentFeature.style = currentStyle;
				currentFeature.layer.redraw();
			}
		}
	}
	
	if (popupWMS != null) {
		map.removePopup(popupWMS);
	}
	
	//Map zoom change trigger
	if (mode != 2) {
		currentFeature = null;
		popupWMS = null;
	}
	
	if (clickTimeline) {
		clickTimeline = false;
	}
	
	if (clickStats) {
		clickStats = false;
	}
}

function resetPositionPopup() {
	popupClose(2);
	
	if (currentFeature != null) {
		//Feature popup
		var title = currentFeature.attributes.name;
		var jsonObj = currentFeature.attributes;
		var content = '<table class="table table-striped"><tbody>';
		for (var key in jsonObj) {
			if (key != 'description' && key != 'name' && key != 'deleteFeatureButton') {
				content += '<tr><td><b>'+key+'</b></td><td>'+jsonObj[key]+'</td></tr>';
			}
		}
		content += '</tbody></table>';
		if (typeof(currentFeature.attributes.deleteFeatureButton) != 'undefined') {
			content += currentFeature.attributes.deleteFeatureButton;
		}	
		var popup = new OpenLayers.Popup.Popover(
			    "customPopup",
			    lonLat,
			    content,
			    title
		);	
		currentFeature.popup = popup;
		map.addPopup(popup);
	}
	
	
	if (popupWMS != null) {
		//WMS popup
		popupWMS = new OpenLayers.Popup.Popover(
	            "customPopup", 
	            popupWMSevt.lonlat,
	            popupWMSevt.event.text,
	            "WMS Feature"
	    );
		addWMSpopup(popupWMSevt.event);
	}
}

