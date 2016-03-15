/**
 * The layer that holds the user added features. This layer is loaded on init and cannot be deleted by the user
 */
var userLayer = null;

/**
 * Controls to draw points and polygons
 */
var drawControlPoint, drawControlPolygon;

/**
 * The current feature that we handle each time
 */
var currentFeature, iconUrlPredefined;

/**
 * Table with all the features the user has added on the map
 */
var userFeatures = [];

/**
 * Counter to give a unique id in each feature added on the map
 */
var featureID = 0;

/**
 * If we load user features from a map, the feature added listener is disabled
 */
var loadMapTrigger = 0;

/**
 * When we click the draw point button in the UI, the contro is activated to draw the point on the map
 */
function userAddPoint() {
	drawControlPoint.activate();
	
	document.getElementById("drawPoint").style.borderColor = 'red';
	document.getElementById('userSelectIcon').style.display = 'block';
}

/**
 * When we click the draw polygon button in the UI, the control is activated to draw the polygon on the map
 */
function userDrawPolygon() {
	drawControlPolygon.activate();

	document.getElementById("drawRectangle").style.borderColor = 'red';
	document.getElementById('userSelectIcon').style.display = 'none';
}

/**
 * On feature add, open o modal to provide the popup information for this feature
 * @param evt
 */
function userFeatureAdded(evt) {
	if (loadMapTrigger == 0) {
		currentFeature = evt.feature;
		
		iconUrlPredefined = null;
		resetIconImageOpacity();
		document.getElementById('image1').style.opacity = '1.0';
		
		//Get metadata for this polygon
		$('#userDrawnModal').modal('show');
		
		drawControlPoint.deactivate();
		drawControlPolygon.deactivate();
		
		document.getElementById('drawPoint').style.borderColor = '#ccc';
		document.getElementById('drawRectangle').style.borderColor = '#ccc';
	}
}

/**
 * Add feature popup information from the user input
 */
function getFeatureMetadata() {
	//Auto-fill empty values
	if (document.getElementById('userTitle').value == "") {
		document.getElementById('userTitle').value = "none";
	}
	if (document.getElementById('userCreator').value == "") {
		document.getElementById('userCreator').value = "none";
	}
	if (document.getElementById('userTheme').value == "") {
		document.getElementById('userTheme').value = "none";
	}
	if (document.getElementById('userDate').value == "") {
		document.getElementById('userDate').value = "none";
	}
	if (document.getElementById('userDescription').value == "") {
		document.getElementById('userDescription').value = "none";
	}
	
	currentFeature.attributes.name = document.getElementById('userTitle').value;
	currentFeature.attributes.deleteFeatureButton = '<div style="border-top: ridge; margin-top: 10px; text-align:center;"><button type="button" class="btn btn-md btn-danger" onClick="deleteFeature()" style="margin-top: 10px; z-index: 1000;"><i class="fa fa-trash-o fa-lg"></i></button></div>';
	
	currentFeature.attributes.creator = document.getElementById('userCreator').value;
	currentFeature.attributes.theme = document.getElementById('userTheme').value;
	currentFeature.attributes.createDate = document.getElementById('userDate').value;
	currentFeature.attributes.text = document.getElementById('userDescription').value;
	
	//In case of point change icon style
	if (document.getElementById('userSelectIcon').style.display == 'block') {		
		var iconUrl = document.getElementById('userIconUrl').value;
		var localFile = document.getElementById('userIconName').files[0];
	    //Create a URL for the localfile
	    if (localFile) {
	    	iconUrl = window.URL.createObjectURL(localFile);
	    }  
	    
	    iconUrl = ((iconUrl != "") ? iconUrl : "./assets/images/map-pin-md.png");	    
	    if (iconUrlPredefined != null) {
	    	iconUrl = iconUrlPredefined;
	    }
	    
	    var myStyle = {
	            pointRadius: 20,
	            externalGraphic: iconUrl
	    };  
	    currentFeature.style = myStyle;
	    currentFeature.attributes.iconURL = iconUrl.toString();
	    userLayer.redraw();	    
	}
	
	currentFeature.attributes.id = featureID;
	featureID++ ;
    userFeatures.push(currentFeature);
    
    //console.log(getKMLFromFeatures(userFeatures));
	
	document.getElementById('userInfoData').reset();
}

/**
 * Remove a feature from the map
 */
function removeFeature() {
	if (currentFeature.popup) {
		map.removePopup(currentFeature.popup);
		currentFeature.popup = null;
	}
	
	userLayer.removeFeatures([currentFeature]);
		
	document.getElementById('userInfoData').reset();
}

/**
 * Delete a feature from the map and the local table
 */
function deleteFeature() {
	removeFeature();
	
	for (var i=0; i<userFeatures.length; i++) {
		if (userFeatures[i].attributes.id == currentFeature.attributes.id) {
			userFeatures.splice(i, 1);	
			break;
		}
	}
	
	//Close the popup
	popupClose(0);
}

/**
 * Read the features created by the user and produce a KML file with them.
 * IMPORTANT: The write function in OL format, does not take into account styles at the moment, so we need
 * to add the manually in the file.
 * @param features
 * @returns
 */
function getKMLFromFeatures(features) {
    var format = new OpenLayers.Format.KML({
        'maxDepth':2,
        'extractStyles':true,
        'extractAttributes': true,
        'internalProjection': map.baseLayer.projection,
        'externalProjection': new OpenLayers.Projection("EPSG:4326")
    });

    return format.write(features);
}

function chooseIconImage(id) {
	resetIconImageOpacity();

	document.getElementById(id).style.opacity = '1.0';
	iconUrlPredefined = document.getElementById(id).src;
	
	//Force not to submit the form
	return false;
}

function resetIconImageOpacity() {
	document.getElementById('image1').style.opacity = '0.4';
	document.getElementById('image2').style.opacity = '0.4';
	document.getElementById('image3').style.opacity = '0.4';
	document.getElementById('image4').style.opacity = '0.4';
	document.getElementById('image5').style.opacity = '0.4';
	document.getElementById('image6').style.opacity = '0.4';
}