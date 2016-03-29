package server;

/*"name": layerNames[i],
        "uri": layerUrls[i],
        "isTemp": isTemporal[i],
        "fileType": layerTypes[i],
        "queryText": queriesText[i],
        "endpointURI": endpointURIs[i],
        "mapId": belongsToMap[i],
        "fillColor" : fillColors[i],
        "strokeColor" : strokeColors[i],
        "iconURI" : icons[i],
        "iconSize" : iconSizes[i]
        */

public class Layer {
	private String name;
	private String uri;
	private Boolean isTemp;
	private String fileType;
	private String queryText;
	private String endpoint;
	private String mapId;
	private String fillColor;
	private String strokeColor;
	private String iconUri;
	private Double iconSize;
	private String imageBox;
	private String type;
	
	public Layer (String name, String uri, Boolean isTemp, String fileType, 
			String queryText, String endpoint, String mapId, String fillColor,
			String strokeColor, String iconUri, Double iconSize, String bbox, String type) {
		this.name = name;
		this.uri = uri;
		this.isTemp = isTemp;
		this.fileType = fileType;
		this.queryText = queryText;
		this.endpoint = endpoint;
		this.mapId = mapId;
		this.fillColor = fillColor;
		this.strokeColor = strokeColor;
		this.iconUri = iconUri;
		this.iconSize = iconSize;
		this.imageBox = bbox;
		this.type = type;
	}
	
	public String getName() {
		return name;
	}

	public String getUri() {
		return uri;
	}

	public Boolean getIsTemp() {
		return isTemp;
	}

	public String getFileType() {
		return fileType;
	}

	public String getQueryText() {
		return queryText;
	}

	public String getEndpoint() {
		return endpoint;
	}

	public String getMapId() {
		return mapId;
	}

	public String getFillColor() {
		return fillColor;
	}

	public String getStrokeColor() {
		return strokeColor;
	}

	public String getIconUri() {
		return iconUri;
	}

	public Double getIconSize() {
		return iconSize;
	}
	
	public String getImageBox() {
		return imageBox;
	}
	
	public String getType() {
		return type;
	}
}
