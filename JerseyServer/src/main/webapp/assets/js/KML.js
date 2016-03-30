/**
 * Add KML layer.
 * Parameters are taken from HTML modal.
 */
function addKMLLayerFromModal(){
	var name = document.getElementById('layerName').value;
    var path = document.getElementById('layerUrl').value;   
    var localFile = document.getElementById('fileName').files[0];
    var isTemp = document.getElementById('isTemporal').checked;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = "kml";
    
	//Check the file type if it is KML
    var len = path.length;
	var isKML = path.substring(len-4, len);
	if (isKML != ".kml") {
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
 * Adds the given KML file as a new layer on the map.
 */
function addKmlLayer(label, filename, styling, isTemp) {
	if (filename && label) {
		checkLayerURL(label, filename);
		
		//Image Vector layer to use WebGL rendering
		var layer = new ol.layer.Image({
			title: label,
            source: new ol.source.ImageVector({
              source: new ol.source.Vector({
            	  url: filename,
    	          format: new ol.format.KML({
    	        	  extractStyles: false
    	          }) 
              }),
              style: ( (styling != null) ? styling : defaultVectorStyle)
            })
        });
		
		map.addLayer(layer);
		
		var listenerKey = layer.getSource().on('change', function(e) {
			  if (layer.getSource().getState() == 'ready') {			    
					
					if (isTemp) {
						parseTimelineFeatures(layer, filename);	
					}
					
					updateLayerStats(label);
										
					for (var i=0; i<mapLayers.length; i++) {
			    		if ( (mapLayers[i].name === label) && (label != 'userInfo')) {   	                            		
			        		mapLayers[i].features = getLayerFeatureNames(layer);
			            	break;
			    		}
			    	}
					
					map.getView().fit(layer.getSource().getSource().getExtent(), map.getSize());
					//console.log(layer.getSource().getSource().getFeatures().length);
				    
					//Unregister the "change" listener 
					layer.getSource().unByKey(listenerKey);			    
			  }
		});    	
	}
}