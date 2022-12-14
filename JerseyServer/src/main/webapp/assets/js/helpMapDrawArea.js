var mapFilter;
var draw;

var source = new ol.source.Vector({wrapX: false});

var base = new ol.layer.Tile({
    source: new ol.source.MapQuest({layer: 'sat'})
});

var vector = new ol.layer.Vector({
    source: source,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      }),
      stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
      }),
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
          color: '#ffcc33'
        })
      })
    })
});

function addInteraction() {   
	var geometryFunction, maxPoints;
    var value = 'LineString';
    maxPoints = 2;
    geometryFunction = function(coordinates, geometry) {
        if (!geometry) {
        	geometry = new ol.geom.Polygon(null);
        }
        var start = coordinates[0];
        var end = coordinates[1];
        geometry.setCoordinates([
              [start, [start[0], end[1]], end, [end[0], start[1]], start]
        ]);
        return geometry;
    };
        
    draw = new ol.interaction.Draw({
    	source: source,
        type: /** @type {ol.geom.GeometryType} */ (value),
        geometryFunction: geometryFunction,
        maxPoints: maxPoints
    });
    mapFilter.addInteraction(draw);
    
    draw.on('drawstart', function(evt) {
        vector.getSource().clear();
    });
}