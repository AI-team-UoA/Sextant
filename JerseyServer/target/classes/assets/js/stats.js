var statData = function(fId, value) {
	this.fId = fId;
	this.value = value;
};

var clickStats = false;
var valuesPerStep = 40;
var dragButton;
var dataChart;
var currentLayer = null;

function drawAttrChart() {
	var selectDivLayer = document.getElementById('layerNameStats');
	var selectDivAttr = document.getElementById('layerAttributesStats');
	var layerName = selectDivLayer.options[selectDivLayer.selectedIndex].value;
	var attrName = selectDivAttr.options[selectDivAttr.selectedIndex].value;
	var layer = map.getLayersByName(layerName)[0];	
	dataChart = [];
	
	for (var i=0; i<layer.features.length; i++) {
		for (var key in layer.features[i].attributes) {
			if (layer.features[i].attributes.hasOwnProperty(key) && key == attrName) {
				dataChart.push(new statData(layer.features[i].id, Number(layer.features[i].attributes[key])));
				//dataChart.push(new statData(layer.features[i].id, layer.features[i].attributes[key]));
				break;
			}	
		}			
	}
	
	//Create drag button if needed
	if (dataChart.length > valuesPerStep) {
		document.getElementById('simple-slider').style.display = 'block';
		var stepNum = Math.ceil(dataChart.length/valuesPerStep);
		dragButton = new Dragdealer('simple-slider', {
			steps: stepNum,
			snap: true,
			callback: function(x,y) {
				drawCanvas((this.getStep()[0]-1)*valuesPerStep, this.getStep()[0]*valuesPerStep, layer);
			}
		});
		drawCanvas(0, valuesPerStep, layer);
	}
	else {
		drawCanvas(0, dataChart.length, layer);
	}
			
}

function drawCanvas(startIndex, endIndex, layer) {
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
	
	var selectDivAttr = document.getElementById('layerAttributesStats');
	var attrName = selectDivAttr.options[selectDivAttr.selectedIndex].value;
	
	var chartLabels = [];
	var chartDatasets = [];
	var d = [];
	var localFeatures = [];
	
	startIndex = Math.floor(startIndex);
	endIndex = Math.floor(endIndex);
	if (endIndex > dataChart.length) {
		endIndex = dataChart.length;
	}
	for (var i=startIndex; i<endIndex; i++) {
		localFeatures.push(dataChart[i].fId);
		chartLabels.push(dataChart[i].fId.replace('OpenLayers_Feature_Vector', 'f.ID'));
		d.push(dataChart[i].value);
	}
	
	zoomToChart(localFeatures, layer);
	
	var newData = new MyDataLine(attrName, 
			"rgba(151,187,205,0.2)", 	//fillColor
			"rgba(151,187,205,1)", 		//strokeColor
			"rgba(151,187,205,1)",		//pointColor
		    '#fff',						//pointStrokeColor
		    '#fff',						//pointHighlightFill
		    "rgba(151,187,205,1)", 		//pointHighlightStroke
		    d
	);
	chartDatasets.push(newData);
	
	var lineChartData = {
			labels: chartLabels,
			datasets: chartDatasets
	};
	
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
	
	var ctx = document.getElementById('myNewStatsCanvas').getContext('2d');
	var lineChart = new Chart(ctx).Line(lineChartData, {
		responsive : true,
		datasetFill : true,
		bezierCurve : false,
		pointHitDetectionRadius : 0,
		animationEasing: "easeOutQuart"
	});
	
	lineChart.update();
	
	document.getElementById('myNewStatsCanvas').onclick = function(evt){
	    var activePoints = lineChart.getPointsAtEvent(evt);
	    var featureID = activePoints[0].label.replace('f.ID', 'OpenLayers_Feature_Vector');
	    var statsFeature = layer.getFeatureById(featureID);
	    
	    popupClose(0);		
		clickStats = true;
		lonLat = statsFeature.geometry.getBounds().getCenterLonLat();
		
		for (var i=0; i<map.controls.length; i++){
			if (map.controls[i].displayClass == "olControlSelectFeature") {
				map.controls[i].select(statsFeature);
				break;
			}
		}
	};
	
	document.getElementById('downloadStatChart').disabled = false;	
}

function downloadStatsChart() {
	var canvas = document.getElementById('myNewStatsCanvas');
    var imgURI = canvas.toDataURL('image/png');
    
    var element = document.createElement('a');
    element.href = imgURI;
    element.download = 'chartImage';
    element.click();
}

function zoomToChart(localFeatures, layer) {
	for(var i=0; i< layer.features.length; i++) {
        layer.features[i].style = null;     
    }
	
	var chartBounds = new OpenLayers.Bounds();
	for (var i=0; i<localFeatures.length; i++) {
		var feature = layer.getFeatureById(localFeatures[i]);
		var featureBounds = feature.geometry.getBounds();
		chartBounds.extend(featureBounds);
		
		feature.style = new OpenLayers.Style();	        	
		feature.style.fillColor = 'rgba(151,187,205,1)';
		feature.style.strokeColor = 'rgba(151,187,205,1)';
		feature.style.strokeWidth = 1;
		feature.style.strokeOpacity = 1;
		feature.style.fillOpacity = 0.4;
		feature.style.externalGraphic = '';
	}
	
	layer.redraw();
	map.zoomToExtent(chartBounds, true);
	map.zoomOut();
}

function restoreFeaturesPanel() {
	
}





