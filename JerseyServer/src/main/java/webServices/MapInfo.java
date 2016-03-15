package webServices;

import java.util.Vector;

import javax.xml.bind.annotation.XmlRootElement; 

@XmlRootElement
public class MapInfo {
	//must be public for xml to create the root element
	public String name;
	public String producedByQuery ;
	public String kmlFile;
	public String endpointUri;
	public String polystyleColor;
	public String polylineColor;
	public String iconUri;
	public String iconScale;
	public String isTemporal;
	public String imageBox;
	
	public String chartType;
	public String chartResults;
	public String measures;
	public String freeDims;
	public String instances;
	
	public MapInfo() {
		
	}
	
	public MapInfo(String name, String query, String endpoint, String type, String results, String measures, String freeDims, String instances) {
		this.name = name;
		this.producedByQuery = query;
		this.endpointUri = endpoint;
		this.chartType = type;
		this.chartResults = results;
		this.measures = measures;
		this.freeDims = freeDims;
		this.instances = instances;
	}
	
	public void init( Vector<String> v ){
		this.name = v.get(0);
		this.producedByQuery = v.get(1);
		this.kmlFile = v.get(2);
		this.endpointUri = v.get(3);
		this.polystyleColor = v.get(4);
		this.polylineColor = v.get(5);
		this.iconUri = v.get(6);
		this.iconScale = v.get(7);
		this.isTemporal = v.get(8);
		this.imageBox = v.get(9);
	}
	
	public void print() {
		System.out.println(this.name);
		System.out.println(this.producedByQuery);
		System.out.println(this.kmlFile);
		System.out.println(this.endpointUri);
		System.out.println(this.polystyleColor);
		System.out.println(this.polylineColor);
		System.out.println(this.iconUri);
		System.out.println(this.iconScale);
		System.out.println(this.isTemporal);
		System.out.println(this.imageBox);
	}
}
