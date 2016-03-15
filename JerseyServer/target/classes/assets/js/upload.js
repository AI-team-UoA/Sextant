function uploadLocalFileToServer(localFile, name, layerName, type, uploadLocalFile) {
	var formData = new FormData();
	formData.append('uploadfile', localFile);
	
	if (localFile) {
	    	$.ajax({
	            type: 'POST',
	            url: rootURL + '/loadFile/' + name + '/' + type,
	            data: formData,
	            //Options to tell jQuery not to process data or worry about content-type.
	            cache: false,
	            contentType: false,
	            processData: false,
	            timeout: ajaxTimeout,
	            success: uploadLocalFile,
	            error: printError
	        });
	}
}