function downloadFile(aurl, getFile) {
    $.ajax({
        type: 'POST',
        url: rootURL + '/downloadFile/',
        data: aurl,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: getFile,
        error: printError
    });     
}
