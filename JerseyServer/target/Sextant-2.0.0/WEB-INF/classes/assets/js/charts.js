var dims = [];
var charts = [];
var preRenderedCharts = [];
var ch;
var id = 0;
var chartId = 0;
var itter = 0;

var hostG = null;
var endpointG = null;
var portG = null;

/**
 * Start the creation of information in the modal.
 */
function createDimensionList() {
	//Create a new chart object
	ch = new MyChart(null, null, null, null, null, null, null, null, null, id);
	id ++;
	
	var portValue = document.getElementById('endpointUrlPortChart').value;
	var port = 80;
	if (portValue != "") {
		port = Number(portValue);
	}
	var endpoint = document.getElementById('endpointUrlChart').value;
	
	ch.endpointURI = endpoint;
	ch.port = port;
	
	endpoint = endpoint.replace("http://", "");
	var parts = endpoint.split('/');
	var host = parts[0];
	var endpointName = "";
	for (var i=1; i<parts.length-1; i++) {
		endpointName += parts[i] + '@@@';
	}
	endpointName += parts[parts.length-1];
	
	hostG = host;
	endpointG = endpointName;
	portG = port;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	getDimensionsList(host, endpointName, port);	
}

/**
 * Ajax call to the endpoint to get the availiable dimensions.
 * @param host
 * @param endpoint
 * @param port
 */
function getDimensionsList(host, endpoint, port) {
	document.getElementById('endpointUrlChart').disabled = true;
	document.getElementById('endpointUrlPortChart').disabled = true;

	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/charts/dimensions/' + host + '/' + endpoint + '/' + port,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseDimensions,
        error: printError
    });
}

/**
 * Parse the results from the server to create the checkboxes for user. Results are separated with the char '$'
 * @param results
 * @param status
 * @param jqXHR
 */
function parseDimensions(results, status, jqXHR) {   
    var arr = results.split('\$');
    dims = [];
    
    //Populate selection list for user to choose dimension(s) to fix
	var divRef = document.getElementById('fixedDimensionsCheckboxes');
	var element;
	
	element = document.createElement('label');
	element.innerHTML = 'Select Dimension(s) to fix';
	divRef.appendChild(element);
	
	for (var i=0; i<(arr.length-2); i+=3) {
		var dim = new Dimension(arr[i], arr[i+1], arr[i+2]);
		dims.push(dim);	
			
		//Parse the class name from the URI
		var dimName = parseClass(dim.classType.toString());
		
		//Create the checkbox element
		element = document.createElement('div');
		element.setAttribute('class', 'well well-sm');
		element.innerHTML = '<p>' + dimName + '</p>';
		element.id = 'div'+dim.classType;
		divRef.appendChild(element);
		element = document.createElement('input');
		element.type = 'checkbox';
		element.id = dim.classType;
	    element.value = dim.order;
	    element.className = dim.name; //TODO: fix so that there is no chance the class name creates problems
	    element.setAttribute('onclick', 'fixDims(this.id, this.value, this.className)');
		document.getElementById('div'+dim.classType).appendChild(element);
	}
	
	//Add button 'Next' to provide instances for the fixed dimension(s)
	element = document.createElement('input');
	element.type = 'button';
	element.setAttribute('class', 'btn btn-block btn-md btn-default');
	element.value = 'Next';
    element.setAttribute('onclick', 'getInstances()');
	divRef.appendChild(element);
	
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);   
}

/**
 * Function to handle dimension's order. If a dimension is checked then all dimensions with smaller order are also
 * checked and disabled. Also the dimensions with the same order and name with the selected one are checked, and if
 * the class type is the same with the selected one the box is not disabled (its the chosen dimension), else if
 * the class type is different then it could be the ?dim+ case, so we highlight for user to take control.
 * If a dimension is unchecked all boxes are cleared. In the end the truly fixed dimensions that we will use are 
 * the ones that have a box checked and enabled.
 * @param id
 * @param order
 */
function fixDims(id, order, name) {
	var element = document.getElementById(id);
	if (element.checked) {
		for (var i=0; i<dims.length; i++) {
			
			//Check the dimension that the user chose and disable all other that have the same order, name and different type
			if (dims[i].order == order && dims[i].name == name) {
				document.getElementById(dims[i].classType).checked = true;
				if (dims[i].classType != id) {
					//Highlight these cases for the user
					document.getElementById('div'+dims[i].classType).style.color = 'red';
				}
			}
			
			//Check and disable the dimensions with smaller order
			if (dims[i].order < order) {
				document.getElementById(dims[i].classType).checked = true;
				document.getElementById(dims[i].classType).disabled = true;
			}
		}
	}
	else {
		if (document.getElementById('div'+id).style.color != 'red') {
			//Reset mechanism activated
			for (var i=0; i<dims.length; i++) {
					document.getElementById(dims[i].classType).checked = false;
					document.getElementById(dims[i].classType).disabled = false;
					document.getElementById('div'+dims[i].classType).style.color = 'black';
			}
		}
		else {
			//Error correction from user
			document.getElementById('div'+id).style.color = 'black';
		}
	}
}

/**
 * Reset the selection boxes in the statistics modal.
 */
function resetChartForm() {
	dims = [];
	
	var divRef = document.getElementById('fixedDimensionsCheckboxes');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	divRef = document.getElementById('nextButtonDiv');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	document.getElementById('endpointUrlChart').disabled = false;
	document.getElementById('endpointUrlPortChart').disabled = false;
	
	//Reset form data
	document.getElementById('chartQuery').reset();
}

/**
 * Get instances of the classes that have been fixed.
 */
function getInstances() {	
	var fixedDims = [];	
	var freeDims = [];
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	//Get fixed dimension that user chose
	for (var i=0; i<dims.length; i++) {
		if (document.getElementById(dims[i].classType).checked == true &&
			document.getElementById(dims[i].classType).disabled == false ) {
				
				fixedDims.push(dims[i]);
		}
	}
	
	//Get the free dimensions
	var maxOrder = -5;
	for (var i=0; i<fixedDims.length; i++) {
		if (fixedDims[i].order > maxOrder) {
			maxOrder = fixedDims[i].order;
		}
	}
	for (var i=0; i<dims.length; i++) {
		if (document.getElementById(dims[i].classType).checked == false &&
			dims[i].order >= maxOrder ) {
				freeDims.push(dims[i]);
		}
	}
	
	//Sort dimensions by asc order
	fixedDims.sort(function(a,b){return a.order - b.order;});
	freeDims.sort(function(a,b){return a.order - b.order;});
	
	ch.fixedDims = fixedDims;
	ch.freeDims = freeDims;
	
	var divRef = document.getElementById('fixedDimensionsCheckboxes');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	
	
	var element = document.createElement('h4');
	element.innerHTML = 'Select Instance(s) to fix';
	divRef.appendChild(element);
	
	divRef = document.getElementById('nextButtonDiv');
	//Add button 'Next' to provide measures for the fixed instance(s)
	element = document.createElement('input');
	element.type = 'button';
	element.setAttribute('class', 'btn btn-block btn-md btn-default');
	element.value = 'Next';
	element.id = 'nextButton';
    element.setAttribute('onclick', 'fixInstance()');
	divRef.appendChild(element);
	
	for (var i=0; i<fixedDims.length; i++) {
		var data = fixedDims[i].name + '$' +fixedDims[i].classType;
		$.ajax({
	        type: 'POST',
	        url: rootURL + '/endpoint/charts/instances/' + hostG + '/' + endpointG + '/' + portG,
	        data: data,
	        dataType: 'text',
	        headers: {
	        	//'Accept-Charset' : 'utf-8',
	        	'Content-Type'   : 'text/plain; charset=utf-8',
	        },
	        timeout: ajaxTimeout,
	        success: parseInstances,
	        error: printError
	    });
	}
}

/**
 * Get all the class instances from the endpoint and create a select list with them
 * for the user to choose which instance to fix.
 * @param results
 * @param status
 * @param jqXHR
 */
function parseInstances(results, status, jqXHR) {
	var arr = results.split('\$');
	var type = parseClass(arr[arr.length-1]);
	var divRef = document.getElementById('fixedDimensionsCheckboxes');
	var element;
	
	element = document.createElement('label');
	element.innerHTML = type;
	divRef.appendChild(element);
	
	//Select element for instances
	element = document.createElement('select');
	element.id = 'selectInstance'+type;
	element.setAttribute('class', 'form-control');
	element.setAttribute('style', 'margin-bottom: 10px');
	divRef.appendChild(element);
	
	for (var i=0; i<arr.length-1; i++) {
		//Parse the class name from the URI
		var instanceName = parseClass(arr[i]);
		
		//Create the option elements		
		element = document.createElement('option');
		element.id = 'instance'+arr[i];
	    element.value = arr[i];
	    element.text = instanceName;
		document.getElementById('selectInstance'+type).appendChild(element);
	}
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime); 
}

/**
 * After the user fixes an instance, pose query to endpoint to get MeasureProperties.
 */
function fixInstance() {
	var instances = [];
	for (var i=0; i<ch.fixedDims.length; i++) {
		var type = parseClass(ch.fixedDims[i].classType);
		//Disable the selected instance
		document.getElementById('selectInstance'+type).disabled = true;
		
		var element = document.getElementById('selectInstance'+type);
		instances.push(element.options[element.selectedIndex].value);
	}
	
	ch.instance = instances;
	
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/charts/measurements/' + hostG + '/' + endpointG + '/' + portG,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseMeasurements,
        error: printError
    });
}

/**
 * Get all MeasureProperties and create a list for the user to choose.
 * @param results
 * @param status
 * @param jqXHR
 */
function parseMeasurements(results, status, jqXHR) {
	//Initialize the array that keeps the selected measures in the Chart object
	ch.measures = [];

	var arr = results.split('\$');
	var divRef = document.getElementById('fixedDimensionsCheckboxes');
	var element;
	
	element = document.getElementById('nextButton');
	element.outerHTML = '';
	delete element;
	
	element = document.createElement('h4');
	element.innerHTML = 'Select measures to project in chart';
	divRef.appendChild(element);
	
	for (var i=0; i<arr.length-1; i++) {
		//Parse the class name from the URI
		var measureName = parseClass(arr[i]);
		
		//Create the checkbox elements for measures
		element = document.createElement('div');
		element.setAttribute('class', 'well well-sm');
		element.innerHTML = '<p>' + measureName + '</p>';
		element.id = 'measure'+arr[i];
		divRef.appendChild(element);
		element = document.createElement('input');
		element.type = 'checkbox';
		element.id = 'measureBox'+arr[i];
	    element.value = arr[i];
	    element.setAttribute('onclick', 'fixMeasures(this.id, this.value)');
		document.getElementById('measure'+arr[i]).appendChild(element);
	}
	
	//Create selection element for chart type
	element = document.createElement('h4');
	element.innerHTML = 'Select chart type';
	divRef.appendChild(element);
	
	divRef = document.getElementById('fixedDimensionsCheckboxes');
	element = document.createElement('select');
	element.id = 'selectChartType';
	element.setAttribute('class', 'form-control');
	element.setAttribute('style', 'margin-bottom: 10px');
	divRef.appendChild(element);
		
	//Create the option elements		
	element = document.createElement('option');
	element.id = 'barChart';
	element.text = 'Bar chart';
	element.value = 'Bar chart';
	document.getElementById('selectChartType').appendChild(element);
	
	element = document.createElement('option');
	element.id = 'lineChart';
	element.text = 'Line chart';
	element.value = 'Line chart';
	document.getElementById('selectChartType').appendChild(element);
	
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime); 
    
    //Enable OK button
    if (disableAll == false) {
    	document.getElementById('okChartButton').disabled = false;
    }
}

/**
 * If a measure is checked, it is added in the array of the Chart object.
 * If it is unchecked, it is removed from the array.
 */
function fixMeasures(id, measureURI) {
	if (document.getElementById(id).checked) {
		ch.measures.push(measureURI);
	}
	else {
		for (var i=0; i<ch.measures.length; i++) {
			if (ch.measures[i] == measureURI) {
				ch.measures.splice(i, 1);
			}
		}
	}
}

/**
 * Get a URI and parse the class name or property name from it.
 * @param uri
 * @returns
 */
function parseClass(uri) {
	var name = uri;
	if (name.lastIndexOf('#') != -1) {
		name = name.substr(name.lastIndexOf('#')+1, name.length);
	}
	else {
		if (name.lastIndexOf('/') != -1) {
			name = name.substr(name.lastIndexOf('/')+1, name.length);
		}
	}
	return name;
}

/**
 * After collecting information we can pose a query to the endpoint and visualize the results as a chart.
 */
function createChart() {
	document.getElementById('alertMsgServerWait').style.display = 'block';
	showSpinner(colorSpin);
	
	//Get static part of the query from endpoint
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/charts/staticQuery/' + hostG + '/' + endpointG + '/' + portG,
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseStaticQuery,
        error: printError
    });	
}

/**
 * Get the static part as a response and construct the final query to get the chart data.
 * @param results
 * @param status
 * @param jqXHR
 */
function parseStaticQuery(results, status, jqXHR) {
	var staticQueryPart = results.substr(0, results.indexOf('$'));
	
	//Create SELECT part of the query
	var selectPart = 'SELECT DISTINCT';
	for (var i=0; i<ch.freeDims.length; i++) {
		var element = parseClass(ch.freeDims[i].classType);
		element = ' ?' + element.toString();
		
		selectPart = selectPart + element;
	}
	for (var i=0; i<ch.measures.length; i++) {
		var element = parseClass(ch.measures[i]);
		element = ' ?' + element.toString();
		
		selectPart = selectPart + element;
	}
	
	//Create WHERE part of the query
	var wherePart = 'WHERE { ' + staticQueryPart;

	//OPTIONAL patterns start from higher to lower free dimension
	for (var j=ch.freeDims.length-1; j>=0; j--) {
		var element = parseClass(ch.freeDims[j].classType);
		element = ' ?' + element.toString();
		for (var i=0; i<ch.measures.length; i++) {
			var m = parseClass(ch.measures[i]);
			m = ' ?' + m.toString();
			
			wherePart = wherePart + ' OPTIONAL { ';
			wherePart = wherePart + element + ' <' + ch.measures[i] + '> ' + m + '. ';
			wherePart = wherePart + ' } .';
		}
	}
	
	for (var i=0; i<ch.fixedDims.length; i++) {
		var fType = parseClass(ch.fixedDims[i].classType);
		var element = ' ?' + fType;
		var type = '?type'+fType;
		wherePart = wherePart + element + ' <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ' + type +' . ';
		wherePart = wherePart + 'FILTER ( ' + element + ' = <' + ch.instance[i] + '> && ' + type +' = <' + ch.fixedDims[i].classType + '> ) .';
	}
	
	//Complete !bound values with null
	for (var i=0; i<ch.measures.length; i++) {
		var m = parseClass(ch.measures[i]);
		m = ' ?' + m.toString();
		
		wherePart = wherePart + ' BIND (IF (!bound(' + m + '), "none", ' + m + ') AS ' + m + ') . ';
	}
	wherePart = wherePart + ' }';
	
	//Order by free dimensions
	var orderPart = 'ORDER BY ';
	for (var i=0; i<ch.freeDims.length; i++) {
		var element = parseClass(ch.freeDims[i].classType);
		element = ' ?' + element.toString();
		
		orderPart = orderPart + element;
	}
	
	//Create the final query
	var query = selectPart + ' ' +wherePart + ' ' + orderPart;
	
	ch.query = query;
	
	$.ajax({
        type: 'POST',
        url: rootURL + '/endpoint/charts/finalQuery/' + hostG + '/' + endpointG + '/' + portG,
        data: query,
        dataType: 'text',
        headers: {
        	//'Accept-Charset' : 'utf-8',
        	'Content-Type'   : 'text/plain; charset=utf-8',
        },
        timeout: ajaxTimeout,
        success: parseChartData,
        error: printError
    });
}

/**
 * Get the results from the endpoint and create the chart. In order for the chart object wich is an
 * html cavas element, to appear in a modal, it needs to be rendered after the modal is shown. To do 
 * that we create for each chart an object with all the data that is needed to render the chart, and
 * then when the modal is shown, according to the chart (defined by the charId) that we want to view,
 * the chart is rendered in the modal.
 * @param results
 * @param status
 * @param jqXHR
 */
function parseChartData(results, status, jqXHR) {
	var element = document.getElementById('selectChartType');
	var chartType = element.options[element.selectedIndex].value;	
	ch.results = results;
	ch.type = chartType;
	
	//Add chart to charts table
	charts.push(ch);
	
	/**
	 * Save all information for each chart in a preRenderChart object.
	 * Highest order free dimension is rendered as line chart to be more clear,
	 * if we have more than one free dimensions.
	 */
	if (ch.freeDims.length > 1) {
		var preRendChart = new PreRenderChart(chartId, 'Line chart', ch, ch.freeDims[ch.freeDims.length-1], ch.instance, ch.id);
		preRenderedCharts.push(preRendChart);
		chartId++;
	}
	else {
		var preRendChart = new PreRenderChart(chartId, chartType, ch, ch.freeDims[ch.freeDims.length-1], ch.instance, ch.id);
		preRenderedCharts.push(preRendChart);
		chartId++;
	}
	for (var i=ch.freeDims.length-2; i>=0; i--) {
		var preRendChart = new PreRenderChart(chartId, chartType, ch, ch.freeDims[i], ch.instance, ch.id);
		preRenderedCharts.push(preRendChart);
		chartId++;
	}
	
	document.getElementById('infoNumOfCharts').innerHTML = preRenderedCharts.length;

	itter = chartId-1;
	$('#modalChartInfo').modal('show');
	$('#modalChartInfo').on('shown.bs.modal', function (e) {
		//Clear modal body from previous chart/legend elements
		clearChartModal();
		
		//Disable next/previous buttons if needed
		disableButtons();
				
		//Render chart in modal.
		renderChart(preRenderedCharts[itter], itter);
	});
	$('#modalChartInfo').on('hidden.bs.modal', function (e) {
		clearChartModal();
	});
		
	//Reset form
	ch = null;
	resetChartForm();
	hideSpinner();
    setTimeout(function() {$('#alertMsgServerWait').fadeOut('slow');}, fadeTime);
}

/**
 * Take the data from the preRenderChart object and render the chart in modal.
 * @param preRendChart
 */
function renderChart(preRendChart, itterator) {
	if (preRendChart.type === 'Bar chart') { 
		var chartTemp = barChartTemplate(preRendChart.chart, preRendChart.chart.results); 
		addDataToChart(preRendChart.chart, chartTemp, preRendChart.chart.results, preRendChart.freeDimension, itterator);
	}
	if (preRendChart.type === 'Line chart') { 
		var chartTemp = lineChartTemplate(preRendChart.chart, preRendChart.chart.results); 
		addDataToChart(preRendChart.chart, chartTemp, preRendChart.chart.results, preRendChart.freeDimension, itterator);
	}
}

/**
 * Render in modal the next chart in line.
 */
function renderNextChart() {
	itter ++;
	disableButtons();
	clearChartModal();
	renderChart(preRenderedCharts[itter], itter);
}

/**
 * Render in modal the previous chart in line.
 */
function renderPreviousChart() {
	itter --;
	disableButtons();
	clearChartModal();
	renderChart(preRenderedCharts[itter], itter);
}

/**
 * Disable previous/last buttons if we are at first or last chart in the line.
 */
function disableButtons() {
	//Disable previous button
	if (itter == 0) {
		document.getElementById('prevButton').disabled = true;
	}
	else {
		document.getElementById('prevButton').disabled = false;
	}
	
	//Disable next button
	if ( (itter == chartId-1) || (itter == 0 && chartId == 0)) {
		document.getElementById('nextButton').disabled = true;
	}
	else {
		document.getElementById('nextButton').disabled = false;			
	}
	
	//Disable download button
	if (chartId == 0) {
		document.getElementById('downloadImage').disabled = true;
	}
	else {
		document.getElementById('downloadImage').disabled = false;			
	}
	
}

/**
 * Clear the body of the charts' modal from all elements.
 */
function clearChartModal() {
	var divRef = document.getElementById('myCharts');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	divRef = document.getElementById('chartTitle');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
	divRef = document.getElementById('legendModal');
	while (divRef.firstChild) {
		divRef.removeChild(divRef.firstChild);
	}
}

/**
 * Download a chart as png image. Works in Firefox, Chrome, Android, Crome for Android
 */
function downloadChart() {
	var canvas = document.getElementById('myNewCanvas');
    var imgURI = canvas.toDataURL('image/png');
    
    var element = document.createElement('a');
    element.href = imgURI;
    element.download = 'chartImage';
    element.click();
        
}

