package server;

public class Chart {
	private String endpoint;
	private String query;
	private String type;
	private String measures;
	private String freeDims;
	private String instances;
	
	public Chart(String endpoint, String query, String type, String measures, String freeDims, String instances) {
		this.endpoint = endpoint;
		this.query = query;
		this.type = type;
		this.measures = measures;
		this.freeDims = freeDims;
		this.instances = instances;
	}
	
	public String getEndpoint() {
		return this.endpoint;
	}
	
	public String getQuery() {
		return this.query;
	}
	
	public String getType() {
		return this.type;
	}
	
	public String getMeasures() {
		return this.measures;
	}
	
	public String getFreeDims() {
		return this.freeDims;
	}
	
	public String getInstances() {
		return this.instances;
	}
}
