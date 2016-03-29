/**
 * Add GeoTIFF layer.
 * Parameters are taken from HTML modal.
 */
function addGeoTiffLayerFromModal(){
	var name = document.getElementById('layerNameGeoTiff').value;
    var path = document.getElementById('layerUrlGeoTiff').value;   
    var localFile = document.getElementById('fileNameGeoTiff').files[0];
    var isTemp = false;
    var mapId = 0;
    var query = "";
    var endpoint = "";
    var type = "geotiff";   
    var bbox;
    var imageSize;
    
    //Create a URL for the localfile
	var fileURL = createURL(localFile);
    
    //First get the path from user. If localfile is chosen, get its url instead.
    var url = path;
    
    /**
     * Parse GDAL file for bbox and image size in pixels
     * ATTENTION!!!! 
     * bbox must be expressed in EPSG:4326 which is the projection of the map,
     * so user must transform the tif image to EPSG:4326 and then provide the gdalinfo txt.
     */
    var pathGDAL = document.getElementById('layerUrlGdal').value;   
    var localFileGDAL = document.getElementById('fileNameGDAL').files[0];		    		    
    
    //Create a URL for the localfile
    var GDALfileURL = createURL(localFileGDAL);
    
    var urlGDAL = pathGDAL;
    if(localFileGDAL) {
    	urlGDAL = GDALfileURL;
    }
    else {
    	if (urlGDAL == "") {
    		//Use gdal installation on server to get image metadata and load it to map
    		getGDALfromServer(path, localFile, name);  	
    		return;
    	}
    }
    
    
    //Get the gdal file to parse it
    $.get(urlGDAL, function(data) {
    	var text = data.toLowerCase();
    	var metaData = parseBBOX(text);
    	bbox = metaData.bbox;
    	imageSize = metaData.size;
    	
	    if(typeof localFile != 'undefined') {
	    	url = fileURL.toString();
	    	addLayer(url, name, isTemp, type, query, endpoint, mapId, localFile, path, null, bbox, imageSize);
	    }
	    else {
    		addLayer(url, name, isTemp, type, query, endpoint, mapId, null, path, null, bbox, imageSize);
	    }		
	    	
    });
}

/**
 * Adds the given GeoTIFF file as a new layer on the map.
 */
function addGeoTiffLayer(label, filename, bbox, imageSize) {
	if (filename && label) {  		
      	var layer = new ol.layer.Image({
      		title: label,
            source: new ol.source.ImageStatic({
              url: filename,
              imageExtent: bbox,
              crossOrigin: 'anonymous'
            })
        });
      	map.addLayer(layer);
      	
      	map.getView().fit(bbox, map.getSize());     	  
	}
}

var tempUrl;
/**
 * Upload image to server and use the gdal installation to get the image metadata.
 * @param path
 * @param localFile
 * @param name
 */
function getGDALfromServer(path, localFile, name) {
	//Create image info file, from running gdal in server side
	if(localFile && path) {
		//Upload the file to the JerseyServer so that we can have an absolute URI for saving and loading a map.	    
    	document.getElementById('alertMsgServerUpload').style.display = 'block';
    	uploadLocalFileToServer(localFile, name, name, 'geotiff', function(results) {
    		setTimeout(function() {$('#alertMsgServerUpload').fadeOut('slow');}, fadeTimeFast);
    		tempUrl = results;
    		$.ajax({
    	        type: 'POST',
    	        url: rootURL + '/gdalInfo/',
    	        data: results,
    	        dataType: 'text',
    	        headers: {
    	        	//'Accept-Charset' : 'utf-8',
    	        	'Content-Type'   : 'text/plain; charset=utf-8',
    	        },
    	        timeout: ajaxTimeout,
    	        success: getImageInfoGDAL,
    	        error: printError
    	    });
    	});
    }
    else if (path){
    	//Upload file to server and create the layer
		document.getElementById('alertMsgServerDownload').style.display = 'block';
    	downloadFile(path, function(result) {
    		setTimeout(function() {$('#alertMsgServerDownload').fadeOut('slow');}, fadeTimeFast);
    		tempUrl = path;
    		$.ajax({
    	        type: 'POST',
    	        url: rootURL + '/gdalInfo/',
    	        data: result,
    	        dataType: 'text',
    	        headers: {
    	        	//'Accept-Charset' : 'utf-8',
    	        	'Content-Type'   : 'text/plain; charset=utf-8',
    	        },
    	        timeout: ajaxTimeout,
    	        success: getImageInfoGDAL,
    	        error: printError
    	    });
    	});
    } 
}

/**
 * Get the gdalinfo results, parse the size and bbox and create the layer.
 * @param results
 * @param status
 * @param jqXHR
 */
function getImageInfoGDAL(results, status, jqXHR) {	
	var text = results.toLowerCase();
	console.log('***** GDAL INFO: '+text);
	var metaData = parseBBOX(text);
	var bbox = metaData.bbox;
	var imageSize = metaData.size;
	
	var name = document.getElementById('layerNameGeoTiff').value;
	console.log('NAME IMAGE: '+name);
	if (name == "") {
		name = 'tester';
	}

    addLayer(tempUrl, name, false, 'geotiff', "", "", 0, null, null, null, bbox, imageSize);
}

/**
 * Parse gdalinfo results to get image size and bbox.
 */
function parseBBOX(text) {
	text = text.replace(/\"/g, "|");
	text = text.replace(/\'/g, "|");
	
	//Image size in pixels
	var str = text.match(/size is [0-9]*, [0-9]*/g);
	var test = str.toString().replace(/,/g, "");
	test = test.toString().split(" ");
	var w = Number(test[2]);
	var h = Number(test[3]);
	var imageSize = [w, h];
	
	//Corner coordinates
	var ul = text.match(/upper\sleft\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ul = ul.toString().split("(");
	ul = ul[1].toString().split(",");
	var left = Number(ul[0]);
	var top = Number(ul[1]);
	
	var ur = text.match(/upper\sright\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ur = ur.toString().split("(");
	ur = ur[1].toString().split(",");
	var right = Number(ur[0]);
	
	var ll = text.match(/lower\sleft\s*\(\s*[-]*[0-9]*\.[0-9]*,\s*[-]*[0-9]*\.[0-9]*/g);
	ll = ll.toString().split("(");
	ll = ll[1].toString().split(",");
	var bottom = Number(ll[1]);		    	   	
	
	var adjustParameter = 0.04;
	var bbox = [left, bottom-adjustParameter, right, top-adjustParameter];	
	bbox = ol.proj.transformExtent(bbox, 'EPSG:4326', 'EPSG:3857');
	
	return new ImageMetaData(bbox, imageSize);
}