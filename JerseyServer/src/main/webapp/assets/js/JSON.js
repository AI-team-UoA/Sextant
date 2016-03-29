/**
 * Add JSON layer.
 * Parameters are taken from HTML modal.
 */
function addJSONLayerFromModal(){
	var name = document.getElementById('layerNameJSON').value;
    var path = document.getElementById('layerUrlJSON').value;   
    var localFile = document.getElementById('fileNameJSON').files[0];
    var isTemp = false;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = 	document.getElementById('JSONtype').options[document.getElementById('JSONtype').selectedIndex].value;
    type = type.toLowerCase();
    
	//Check the file type if it is JSON
    var len = path.length;
	var isJSON = path.substring(path.lastIndexOf("."), len);
	if (isJSON != ".json" && isJSON != ".geojson") {
		//Print error and return
		document.getElementById('alertMsgWrongFileType').style.display = 'block';
        setTimeout(function() {$('#alertMsgWrongFileType').fadeOut('slow');}, fadeTime);
        return ;
	}
	
	//Create a URL for the localfile
    var fileURL = createURL(localFile);
    
    //Get the path from user. If localfile is chosen, get its url instead.
    var url = path;
    if(typeof localFile != 'undefined') {
    	//Local file
    	url = fileURL.toString();
    	addLayer(url, name, isTemp, type, text, endpoint, mapId, localFile, path, null, null, null);
    }
    else {
		addLayer(url, name, isTemp, type, text, endpoint, mapId, null, path, null, null, null);
    }
}

/**
 * Adds the given GML file as a new layer on the map.
 */
function addJSONLayer(label, filename, styling, isTemp, type) {
	if (filename && label) {
		var format = null;
		if (type == 'geojson') {format = new ol.format.GeoJSON();}
		if (type == 'topojson') {format = new ol.format.TopoJSON();}
		
		//Image Vector layer to use WebGL rendering
		var layer = new ol.layer.Image({
			title: label,
            source: new ol.source.ImageVector({
              source: new ol.source.Vector({
            	  url: filename,
    	          format: format
              }),
              style: ( (styling != null) ? styling : defaultVectorStyle)
            })
        });
		
		map.addLayer(layer);
		
		var listenerKey = layer.getSource().on('change', function(e) {
			  if (layer.getSource().getState() == 'ready') {			    									
					updateLayerStats(label);
										
					for (var i=0; i<mapLayers.length; i++) {
			    		if ( (mapLayers[i].name === label) && (label != 'userInfo')) {   	                            		
			        		mapLayers[i].features = getLayerFeatureNames(layer);
			            	break;
			    		}
			    	}
					
					map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
				    
					//Unregister the "change" listener 
					layer.getSource().unByKey(listenerKey);			    
			  }
		});    	
	}
}