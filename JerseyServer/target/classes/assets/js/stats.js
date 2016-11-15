var statData = function(fId, value) {
	this.fId = fId;
	this.value = value;
};

var valuesPerStep = 40;
var dragButton;
var dataChart;

function drawAttrChart() {
	var selectDivLayer = document.getElementById('layerNameStats');
	var selectDivAttr = document.getElementById('layerAttributesStats');
	var layerName = selectDivLayer.options[selectDivLayer.selectedIndex].value;
	var attrName = selectDivAttr.options[selectDivAttr.selectedIndex].value;
	var selectedLayer = null;	
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == layerName) {
    		selectedLayer = layer;
    	}
    });
	
	var layerPosition = null;
	for (var i=0; i<mapLayers.length; i++) {
        if (mapLayers[i].name == layerName) {
        	layerPosition = i;
        }
    }
	
	dataChart = [];
	var layerFeatures = selectedLayer.getSource().getSource().getFeatures();
	
	for (var i=0; i<layerFeatures.length; i++) {
		//Non-temporal layers
		if (!mapLayers[layerPosition].isTemp) {
			for (var key in layerFeatures[i].getProperties()) {
				if (key == attrName) {
					dataChart.push(new statData(layerFeatures[i], Number(layerFeatures[i].getProperties()[key])));
					break;
				}
			}
		}
		else {
			//Temporal layers
			if (layerFeatures[i].getStyle() == null) {
				for (var key in layerFeatures[i].getProperties()) {
					if (key == attrName) {
						dataChart.push(new statData(layerFeatures[i], Number(layerFeatures[i].getProperties()[key])));
						break;
					}
				}	
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
				drawCanvas((this.getStep()[0]-1)*valuesPerStep, this.getStep()[0]*valuesPerStep, selectedLayer);
			}
		});
		drawCanvas(0, valuesPerStep, selectedLayer);
	}
	else {
		drawCanvas(0, dataChart.length, selectedLayer);
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
		chartLabels.push('f.ID_'+i);
		d.push(dataChart[i].value);
	}
	
	//zoomToChart(localFeatures, layer);
	
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
	    var index = Number(activePoints[0].label.replace('f.ID_', ''));
	    var feature = dataChart[index].fId;
	    
	    //Clear popups
		clearPopup();
		
		//Clear selected features and add the new one
		//mapSelectInterraction.getFeatures().clear();
		//mapSelectInterraction.getFeatures().push(feature);
		clearOverlayFeatures();
		var overlayFeature = feature.clone();
	    featureOverlay.getSource().getSource().addFeature(overlayFeature);
		
		//Create popup on the selected feature
		var featureCenter = feature.getGeometry().getExtent();
		var coordinate = [(featureCenter[0]+featureCenter[2])/2, (featureCenter[1]+featureCenter[3])/2];
		content.innerHTML = '';
		
	    for (var key in feature.getProperties()) {
			if (key != 'description' && key != 'geometry' && key != 'name') {
				content.innerHTML += '<tr><td><b>'+key+'</b></td><td>'+feature.getProperties()[key]+'</td></tr>';
			}
			if (key == 'name') {
				document.getElementById('popupTitle').innerHTML = feature.getProperties()[key];
			}
		}
	    	        	        
	    overlay.setPosition(coordinate);
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
	/*
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
	*/
}

function updateLayerStats(label) {
	var selectDiv = document.getElementById('layerNameStats');
	selectDiv.innerHTML += '<option value="'+label+'">'+label+'</option>';
}

function updateAttrStatsSelect() {
	var selectDivLayer = document.getElementById('layerNameStats');
	var selectDivAttr = document.getElementById('layerAttributesStats');
	selectDivAttr.innerHTML = '<option value="" disabled selected>Attribute</option>';
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
	var layerName = selectDivLayer.options[selectDivLayer.selectedIndex].value;	
	if (layerName == 'defaultVal') {
		selectDivAttr.disabled = true;
		document.getElementById('downloadStatChart').disabled = true;
		document.getElementById('simple-slider').style.display = 'none';
		return;
	}
	
	var selectedLayer = null;	
	map.getLayers().forEach(function(layer) {
    	if (layer.get('title') == layerName) {
    		selectedLayer = layer;
    	}
    });
	var layerFeatures = selectedLayer.getSource().getSource().getFeatures();
	
	for (var i=0; i<layerFeatures.length; i++) {
		for (var key in layerFeatures[i].getProperties()) {
			var attrFound = false;
			//console.log(key + ': ' + layerFeatures[i].getProperties()[key]);
			//var testDate = new Date(layerFeatures[i].getProperties()[key]);
			if  (key != 'name' && !isNaN(layerFeatures[i].getProperties()[key]) ) {
				for (var j=0; j<selectDivAttr.length; j++) {
					if (selectDivAttr.options[j].value == key) {
						attrFound = true;
						break;
					}
				}
				if (!attrFound) {
					selectDivAttr.innerHTML += '<option value="'+key+'">'+key+'</option>';
				}
			}
		}			
	}
	
	if (selectDivAttr.length > 1) {
		selectDivAttr.disabled = false;
	}
	
	document.getElementById('downloadStatChart').disabled = true;
	
	//map.getView().fit(selectedLayer.getSource().getSource().getExtent(), map.getSize());
}

function resetStatsInfo(label) {
	var selectDivLayer = document.getElementById('layerNameStats');
	for (var i=0; i<selectDivLayer.length; i++) {
		if (selectDivLayer.options[i].value == label) {
			selectDivLayer.remove(i);
		}
	}
	selectDivLayer.value = 'defaultVal';
	
	var selectDivAttr = document.getElementById('layerAttributesStats');
	selectDivAttr.innerHTML = '<option value="" disabled selected>Attribute</option>';
	selectDivAttr.disabled = true;
	document.getElementById('downloadStatChart').disabled = true;	
	
	var canvasChartDiv = document.getElementById('statsChart');
	canvasChartDiv.innerHTML = '<canvas id="myNewStatsCanvas"></canvas>';
}

function getLayerFeatureNames(layer) {
	var featureNames = [];
	var features = layer.getSource().getSource().getFeatures();
	for (var i=0; i<features.length; i++) {
		for (var key in features[i].getProperties()) {
			if (featureNames.indexOf(key) == -1 && key != 'description' && key != 'geometry' && key != 'name') {
				featureNames.push(key);
				break;
			}
		}			
	}
	
	return featureNames.toString();
}



