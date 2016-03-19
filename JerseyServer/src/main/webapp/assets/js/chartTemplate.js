/**
 * Object that represents a color for bar chart.
 */
var ChartColor = function(fillColor,
						  strokeColor,
						  highlightFill,
						  highlightStroke) {
	this.fillColor = fillColor;
	this.strokeColor = strokeColor;
	this.highlightFill = highlightFill;
	this.highlightStroke = highlightStroke;
};

/**
 * Object that keeps stats about measures.
 */
var Stats = function(min,
					 max,
					 step,
					 stepNum) {
	this.min = min;
	this.max = max;
	this.step = step;
	this.stepNum = stepNum;
};

/**
 * Object that keeps the min and max order values in the free dimensions of a chart object.
 */
var ChartOrders = function (minOrder,
							maxOrder) {
	this.minOrder = minOrder;
	this.maxOrder = maxOrder;
};

/**
 * Object that represents a measure as data object in bar chart.
 */
var MyDataBar = function(label,
					fillColor,
					strokeColor,
					highlightFill,
					highlightStroke,
					data) {
	this.label = label;
	this.fillColor = fillColor;
	this.strokeColor = strokeColor;
	this.highlightFill = highlightFill;
	this.highlightStroke = highlightStroke;
	this.data = data;
};

/**
 * Object that represents a measure as data object in line chart.
 */
var MyDataLine = function(label,
					fillColor,
					strokeColor,
					pointColor,
					pointStrokeColor,
					pointHighlightFill,
					pointHighlightStroke,
					data) {
	this.label = label;
	this.fillColor = fillColor;
	this.strokeColor = strokeColor;
	this.pointColor = pointColor;
	this.pointStrokeColor = pointStrokeColor;
	this.pointHighlightFill = pointHighlightFill;
	this.pointHighlightStroke = pointHighlightStroke;
	this.data = data;
};

/**
 * Object that has a table with the averaged values from a portion of
 * data from the results the chart query returned, and the position in
 * those results that we are at the moment.
 */
var AvgResult = function(value, currentPos) {
	this.value = value;
	this.currentPos = currentPos;
};

/**
 * Create 15 different colors for measures for bar charts.
 */
var colorPal = [];
var c1 = new ChartColor("rgba(220,0,20,0.5)", "rgba(220,0,20,0.8)", "rgba(220,0,20,0.75)", "rgba(220,0,20,1)");
var c2 = new ChartColor("rgba(20,220,220,0.5)", "rgba(20,220,220,0.8)", "rgba(20,220,220,0.75)", "rgba(20,220,220,1)");
var c3 = new ChartColor("rgba(220,20,220,0.5)", "rgba(220,20,220,0.8)", "rgba(220,20,220,0.75)", "rgba(220,20,220,1)");
var c4 = new ChartColor("rgba(220,220,20,0.5)", "rgba(220,220,20,0.8)", "rgba(220,220,20,0.75)", "rgba(220,220,20,1)");
var c5 = new ChartColor("rgba(20,20,220,0.5)", "rgba(20,20,220,0.8)", "rgba(20,20,220,0.75)", "rgba(20,20,220,1)");
colorPal.push(c1);
colorPal.push(c2);
colorPal.push(c3);
colorPal.push(c4);
colorPal.push(c5);

/**
 * Create a template for bar chart.
 * @param myChart
 * @returns
 */
function barChartTemplate(myChart, queryResults) {
	var labs = ["test", "test"];
	var data = [];
	
	for (var i=0; i<myChart.measures.length; i++) {
		var d = [0, 0];
		var newData = new MyDataBar(parseClass(myChart.measures[i]), 
										    colorPal[i].fillColor, 
										    colorPal[i].strokeColor, 
										    colorPal[i].highlightFill, 
										    colorPal[i].highlightStroke, 
										    d);
		data.push(newData);
	}
	
	var barChartData = {
		labels: labs,
		datasets: data
	};
		
	//Get stats
	var st = calculateStats(myChart, queryResults);
	
	//Create canvas element to put the chart
	var divRef = document.getElementById('myCharts');
	var element = document.createElement('canvas');
	element.id = 'myNewCanvas';
	divRef.appendChild(element);
	
	var ctx = document.getElementById('myNewCanvas').getContext('2d');
	var barChartTemplate = new Chart(ctx).Bar(barChartData, {
		responsive : true,
		pointHitDetectionRadius : 5,
		animation: false,
		//Set manual scale
		scaleOverride: true,
		scaleSteps: Number(st.stepNum),
		scaleStepWidth: Number(st.step),
		scaleStartValue: Number(st.min),
	});
	
	return barChartTemplate;
}

/**
 * Create a template for line chart.
 * @param myChart
 * @returns
 */
function lineChartTemplate(myChart, queryResults) {
	var labs = ["test", "test"];
	var data = [];
	
	for (var i=0; i<myChart.measures.length; i++) {
		var d = [0, 0];
		var newData = new MyDataLine(parseClass(myChart.measures[i]), 
										    colorPal[i].fillColor, 
										    colorPal[i].highlightStroke, 
										    colorPal[i].highlightStroke,
										    '#fff',
										    '#fff',
										    colorPal[i].highlightStroke, 
										    d);
		data.push(newData);
	}
	
	var lineChartData = {
		labels: labs,
		datasets: data
	};
		
	//Get stats
	var st = calculateStats(myChart, queryResults);
	
	//Create canvas element to put the chart
	var divRef = document.getElementById('myCharts');
	var element = document.createElement('canvas');
	element.id = 'myNewCanvas';
	divRef.appendChild(element);
	
	var ctx = document.getElementById('myNewCanvas').getContext('2d');
	var lineChartTemplate = new Chart(ctx).Line(lineChartData, {
		responsive : true,
		datasetFill : false,
		bezierCurve : false,
		pointHitDetectionRadius : 5,
		animation: false,
		//Set manual scale
		scaleOverride: true,
		scaleSteps: Number(st.stepNum),
		scaleStepWidth: Number(st.step),
		scaleStartValue: Number(st.min),
	});
	
	return lineChartTemplate;
}

/**
 * Add values to a bar chart template from the query results.
 * @param myChart
 * @param barTemplate
 * @param queryResults
 */
function addDataToChart(myChart, chartTemplate, queryResults, dimension, myChartId) {
	var dimFreeNum = myChart.freeDims.length;
	var measureNum = myChart.measures.length;
	var num = dimFreeNum + measureNum;
	var orders = getChartOrders(myChart);
	
	var arr = queryResults.split('\$');
	
	//Initialize avgClass and position of free dimension in tuple
	var avgClass = null;
	var position = 0;
	var className = '/'+parseClass(dimension.classType)+'/';
	for (var k=0; k<num; k++) {
		if (arr[k].search(className) != -1) {
			avgClass = arr[k];
			position = k;
		}
	}
	
	//Draw up to 100 different elements in chart, else the browser crashes
	var maxElements = 100;
	var counter = 0;
	
	for (var i=0; i<arr.length-1; i+=num) {	
		var d = [];	
		if (dimension.order == orders.maxOrder) {
			//Base line 
			for (var j=0; j<measureNum; j++) {
				if (arr[i+dimFreeNum+j] != 'none') {
					d.push(Number(arr[i+dimFreeNum+j]));
				}
				else {
					d.push(null);
				}
			}
			//Add the data to chart
			chartTemplate.addData(d, parseClass(dimension.classType) + ': ' +parseClass(arr[i+position].toString()));
			counter ++;
			if (counter > maxElements) {
				break;
			}
		}
		else {
			//Get average values according to the dimension that is free
			var result = averageMeasures(avgClass, i, queryResults, measureNum, dimFreeNum, dimension);
			d = result.value;
			
			//Add the data to chart
			chartTemplate.addData(d, parseClass(dimension.classType) + ': ' +parseClass(arr[Number(result.currentPos)-num+position].toString()));
			counter ++;
			if (counter > maxElements) {
				break;
			}
			
			i = result.currentPos - num;
			if (Number(result.currentPos) != arr.length -1) {
				for (var k=Number(result.currentPos); k<Number(result.currentPos)+num; k++) {
					if (arr[k].search(className) != -1) {
						avgClass = arr[k];
					}
				}
			}
		}		
	}
	
	//Draw the chart
	chartTemplate.update();
	
	//Remove the first 0 values that the template inserted
	chartTemplate.removeData();
	chartTemplate.removeData();
		
	//Create legend
	createLegend(myChart, myChartId);
}

/**
 * Calculate min/max values for the measure data in a given chart.
 * @param myChart
 * @param queryResults
 * @returns {Stats}
 */
function calculateStats(myChart, queryResults) {
	var min = Number.MAX_VALUE;
	var max = Number.MIN_VALUE;
	var step, stepNum;
	var dimFreeNum = myChart.freeDims.length;
	var measureNum = myChart.measures.length;
	var num = dimFreeNum + measureNum;
	
	var arr = queryResults.split('\$');
	
	for (var i=0; i<arr.length-1; i+=num) {
		for (var j=0; j<measureNum; j++) {
			if (arr[i+dimFreeNum+j] != 'none') {
				if (Number(arr[i+dimFreeNum+j]) > max) {
					max = Number(arr[i+dimFreeNum+j]);
				}
				if (Number(arr[i+dimFreeNum+j]) < min) {
					min = Number(arr[i+dimFreeNum+j]);
				}
			}
		}
	}
	
	stepNum = 10;
	step = Math.ceil((max - min)/stepNum);
	var st = new Stats(min, max, step, stepNum);
	return st;
}

/**
 * Create a legend box for the given chart.
 * @param myChart
 * @param myChartId
 */
function createLegend(myChart, myChartId) {
	var num = myChart.measures.length;
	var divRef, element, row, colorBox, measureName; 

	//Add title
	divRef = document.getElementById('chartTitle');
	element = document.createElement('h5');
	element.setAttribute('class', 'form-signin-heading');
	element.innerHTML = 'Chart ' + (myChartId+1).toString() + ': ' + preRenderedCharts[myChartId].title;
	element.setAttribute('style', 'text-align: center');
	divRef.appendChild(element);
	
	//Add legend
	divRef = document.getElementById('legendModal');
	element = document.createElement('div');
	element.id = 'newLegend';
	divRef.appendChild(element);
	
	for (var i=0; i<num; i++) {
		//Create a new row
		divRef = document.getElementById('newLegend');
		row = document.createElement('div');
		row.setAttribute('class', 'row');
		divRef.appendChild(row);
		
		//Add color box to row
		divRef = row;
		element = document.createElement('div');
		element.setAttribute('class', 'col-md-1 col-sm-1 col-xs-2');
		element.setAttribute('style', 'margin-top: 2px');
		divRef.appendChild(element);
		
		divRef = element;
		colorBox = document.createElement('button');	
		colorBox.setAttribute('type', 'button');
		colorBox.setAttribute('class', 'btn btn-md');
		colorBox.setAttribute('style', 'background-color: '+colorPal[i].fillColor);
		divRef.appendChild(colorBox);
		
		//Add the measure for the color
		divRef = row;
		element = document.createElement('div');
		element.setAttribute('class', 'col-md-11 col-sm-11 col-xs-16');
		divRef.appendChild(element);
						
		divRef = element;
		measureName = document.createElement('label');	
		measureName.innerHTML = parseClass(myChart.measures[i]);
		divRef.appendChild(measureName);
	}
	
	//CSS on legend
	document.getElementById('newLegend').style.margin = '5%';
}

/**
 * Get the min and max values from the free dimensions of a chart object.
 * @param myChart
 * @returns {ChartOrders}
 */
function getChartOrders(myChart) {
	var min = Number.MAX_VALUE;
	var max = Number.MIN_VALUE;
	
	for (var i=0; i<myChart.freeDims.length; i++) {
		if (Number(myChart.freeDims[i].order) > max) {
			max = Number(myChart.freeDims[i].order);
		}
		if (Number(myChart.freeDims[i].order) < min) {
			min = Number(myChart.freeDims[i].order);
		}
	}
	
	var orders = new ChartOrders(min, max);
	return orders;
}

/**
 * Get the name of the instance (avgClass) of a free dimension. Produce an average value for each
 * measure from all the sub-instances that the given instance contains.
 * @param avgClass
 * @param currentI
 * @param queryResults
 * @param measureNum
 * @param dimFreeNum
 * @param dimension
 * @returns {AvgResult}
 */
function averageMeasures(avgClass, currentI, queryResults, measureNum, dimFreeNum, dimension) {
	var num = dimFreeNum + measureNum;
	var className = '/'+parseClass(dimension.classType)+'/';
	var it = null;
	var arr = queryResults.split('\$');
	
	var averages = new Array();
	for (var i=0; i<measureNum; i++) {
		averages[i] = new Array();
	}
	
	for (var i=currentI; i<arr.length-1; i+=num) {
		//Get current class id in the tuple
		for (var k=i; k<i+num; k++) {
			if (arr[k].search(className) != -1) {
				it = arr[k];
			}
		}
		
		if (it === avgClass) {
			//Same class id, add values
			for (var j=0; j<measureNum; j++) {
				if (arr[i+dimFreeNum+j] != 'none') {
					averages[j].push(Number(arr[i+dimFreeNum+j]));
				}
			}
		}
		else {
			currentI = i;
			var avgResult = new AvgResult([], currentI);
			for (var a=0; a<measureNum; a++) {
				var mValue = 0;
				for (var b=0; b<averages[a].length; b++) {
					mValue += Number(averages[a][b]);
				}
				if (averages[a].length != 0) {
					mValue = mValue/averages[a].length;
				}
				else {
					mValue = null;
				}
				avgResult.value.push(mValue);
			}
			
			return avgResult;
		}	
	}
	
	//Last block of data
	currentI = arr.length-1;
	var avgResult = new AvgResult([], currentI);
	for (var a=0; a<measureNum; a++) {
		var mValue = 0;
		for (var b=0; b<averages[a].length; b++) {
			mValue += Number(averages[a][b]);
		}
		if (averages[a].length != 0) {
			mValue = mValue/averages[a].length;
		}
		avgResult.value.push(mValue);
	}
	
	return avgResult;
}
