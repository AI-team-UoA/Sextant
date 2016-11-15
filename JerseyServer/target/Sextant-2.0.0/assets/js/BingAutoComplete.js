function loadBingsSearchFilterLayer() {
	jq151(".searchBox").autocomplete({
		source: function (request, response) {
			$.ajax({
				url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                	key: bingMapsKey,
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                	var result = data.resourceSets[0];
                    if (result) {
                    	if (result.estimatedTotal > 0) {
                    		response($.map(result.resources, function (item) {
                    			return {
                    				data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                };
                            }));
                         }
                    }
                }
			});
        },
        minLength: 1,
        change: function (event, ui) {
        	if (!ui.item)
        		$(".searchBox").val('');
        },
        select: function (event, ui) {
            displaySelectedItem(ui.item.data);
        }
    });
}

function loadBingsSearchEvents() {
	jq151("#searchBoxEvent").autocomplete({
		source: function (request, response) {
			$.ajax({
				url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                	key: bingMapsKey,
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                	var result = data.resourceSets[0];
                    if (result) {
                    	if (result.estimatedTotal > 0) {
                    		response($.map(result.resources, function (item) {
                    			return {
                    				data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                };
                            }));
                         }
                    }
                }
			});
        },
        minLength: 1,
        change: function (event, ui) {
        	if (!ui.item)
        		$("#searchBoxEvent").val('');
        },
        select: function (event, ui) {
            displaySelectedItem(ui.item.data);
        }
    });
}

function loadBingsSearchLoadMap() {
	jq151("#searchBoxSearchMap").autocomplete({
		source: function (request, response) {
			$.ajax({
				url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                	key: bingMapsKey,
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                	var result = data.resourceSets[0];
                    if (result) {
                    	if (result.estimatedTotal > 0) {
                    		response($.map(result.resources, function (item) {
                    			return {
                    				data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                };
                            }));
                         }
                    }
                }
			});
        },
        minLength: 1,
        change: function (event, ui) {
        	if (!ui.item)
        		$("#searchBoxSearchMap").val('');
        },
        select: function (event, ui) {
            displaySelectedItem(ui.item.data);
        }
    });
}

function loadBingsSearchExtentFilter() {
	jq151("#exploreMapBingSearch").autocomplete({
		source: function (request, response) {
			$.ajax({
				url: "http://dev.virtualearth.net/REST/v1/Locations",
                dataType: "jsonp",
                data: {
                	key: bingMapsKey,
                    q: request.term
                },
                jsonp: "jsonp",
                success: function (data) {
                	var result = data.resourceSets[0];
                    if (result) {
                    	if (result.estimatedTotal > 0) {
                    		response($.map(result.resources, function (item) {
                    			return {
                    				data: item,
                                    label: item.name + ' (' + item.address.countryRegion + ')',
                                    value: item.name
                                };
                            }));
                         }
                    }
                }
			});
        },
        minLength: 1,
        change: function (event, ui) {
        	if (!ui.item)
        		$("#exploreMapBingSearch").val('');
        },
        select: function (event, ui) {
            displaySelectedItem(ui.item.data);
        }
    });
}

function displaySelectedItem(item) {
	var myLat = item.point.coordinates[0];
	var myLon = item.point.coordinates[1];
	var bbox = item.bbox;
	var bboxReverse = [bbox[1], bbox[0], bbox[3], bbox[2]];
	//$("#searchResult").empty().append('Latitude: ' + item.point.coordinates[0] + ' Longitude: ' + item.point.coordinates[1]);
	mapFilter.getView().setCenter(ol.proj.transform([myLon, myLat], 'EPSG:4326', 'EPSG:3857'));
	mapFilter.getView().fit(ol.proj.transformExtent(bboxReverse, 'EPSG:4326', 'EPSG:3857'), mapFilter.getSize());
}
        

        
    