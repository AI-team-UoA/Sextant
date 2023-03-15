/**
 * Add GML layer.
 * Parameters are taken from HTML modal.
 */
function addGMLLayerFromModal(){
	var name = document.getElementById('layerNameGml').value;
    var path = document.getElementById('layerUrlGml').value;   
    var localFile = document.getElementById('fileNameGml').files[0];
    var isTemp = false;
    var mapId = 0;
    var text = "";
    var endpoint = "";
    var type = "gml";
    
	//Check the file type if it is GML
    var len = path.length;
	var isGML = path.substring(len-4, len);
	if (isGML != ".xml" && isGML != ".gml") {
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
function addGmlLayer(label, filename, styling, isTemp) {
	if (filename && label) {
		//Image Vector layer to use WebGL rendering
		var layer = new ol.layer.Image({
			title: label,
            source: new ol.source.ImageVector({
              source: new ol.source.Vector({
            	  url: filename,
    	          format: new ol.format.GML({
    	        	  extractStyles: false
    	          }) 
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