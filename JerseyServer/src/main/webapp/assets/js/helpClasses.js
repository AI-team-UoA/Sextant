/**
 * Object that represents each layer
 */
var Layer = function(name, 
					 uri, 
					 isTemp, 
					 type, 
					 query, 
					 endpoint, 
					 fillColor, 
					 strokeColor, 
					 icon, 
					 iconSize, 
					 mapId, 
					 imageBbox, 
					 features) {
	this.name = name;
	this.uri = uri;
	this.isTemp = isTemp;
	this.type = type;
	this.query = query;
	this.endpoint = endpoint;
	this.fillColor = fillColor;
	this.strokeColor = strokeColor;
	this.icon = icon;
	this.iconSize = iconSize;
	this.mapId = mapId;
	this.imageBbox = imageBbox;
	this.features = features;
};

/**
 * Object that represents each predefined query
 */
var PredQuery = function(text, label, isTemp) {
	this.text = text.toString();
	this.label = label.toString();
	this.isTemp = isTemp.toString();
};

/**
 * Object that represents each dimension property
 */
var Dimension = function(name, order, classType) {
	this.name = name;
	this.order = order;
	this.classType = classType;
};

/**
 * Object that represents a chart
 */
var MyChart = function(endpointURI,
					 port,
					 fixedDims,
					 freeDims,
					 instance, 
					 measures,
					 query,
					 results,
					 type,
					 chartNum,
					 id) {
	this.endpointURI = endpointURI;
	this.port = port;
	this.fixedDims = fixedDims;
	this.freeDims = freeDims;
	this.instance = instance;
	this.measures = measures;
	this.query = query;
	this.results = results;
	this.type = type;
	this.id = id;
};

/**
 * Object with all chart information needed to render it
 */
var PreRenderChart = function(id,
							  type,
							  chart,
							  freeDimension,
							  title,
							  belongsToChart) {
	this.id = id;
	this.type = type;
	this.chart = chart;
	this.freeDimension = freeDimension;
	this.title = title;
	this.belongsToChart = belongsToChart;
};

/**
 * Take an array of dimensions and return it to string
 * @param dims
 * @returns {String}
 */
function dimArrayToString(dims) {
	var str = '';
	for (var i=0; i<dims.length; i++) {
		str += dims[i].name + ', ' + dims[i].order + ', ' + dims[i].classType + ', ';
	}
	return str;
}

/**
 * Take a string and return an array of dimensions
 * @param str
 * @returns {Array}
 */
function stringToDimArray(myStr) {
	var dims = [];
	var arrInput = myStr.split(', ');
	for (var i=0; i<arrInput.length-1; i+=3) {
		var dim = new Dimension(arrInput[i], arrInput[i+1], arrInput[i+2]);
		dims.push(dim);
	}
	return dims;
}

var ImageMetaData = function (bbox, size) {
	this.bbox = bbox;
	this.size = size;
};

/**
 * Object to represent temporal feature
 */
var TempFeature = function(layerName, featureID, timelineID, when, begin, end, icon, color, dirty) {
	this.layerName = layerName;
	this.featureID = featureID;
	this.timelineID = timelineID;
	this.when = when;
	this.begin = begin;
	this.end = end;
	this.icon = icon;
	this.color = color;
	this.dirty = dirty;
};

var controlWMS = function(layerName, controlName) {
	this.layerName = layerName;
	this.controlName = controlName;
};

var eventWMSinfo = function (lonlat, event) {
	this.lonlat = lonlat;
	this.event = event;
};

var styleFilter = function(startInterval, endInterval, dataType, color, attrName) {
	this.startInterval = startInterval;
	this.endInterval = endInterval;
	this.dataType = dataType;
	this.color = color;
	this.attrName = attrName;
};
