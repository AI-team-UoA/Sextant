package server;

import org.openrdf.model.URI;
import org.openrdf.sail.memory.model.MemURI;

public class StatisticsVocabulary {
	public static final String DATACUBE_NAMESPACE 		= "http://purl.org/linked-data/cube#";
	public static final String DC_EXTEND_NAMESPACE 		= "http://geo.linkedopendata.gr/statistics/ontology/";

	
	//classes
	public static final URI DIMENSION  					= new MemURI(null, DATACUBE_NAMESPACE, "DimensionProperty");
	public static final URI MEASURE  					= new MemURI(null, DATACUBE_NAMESPACE, "MeasureProperty");
	public static final URI ATTRIBUTE					= new MemURI(null, DATACUBE_NAMESPACE, "AttributeProperty");
	
	//properties
	public static final URI ORDER  						= new MemURI(null, DATACUBE_NAMESPACE, "order");
	public static final URI POSITION  					= new MemURI(null, DC_EXTEND_NAMESPACE, "position");
	public static final URI STATIC_PART  				= new MemURI(null, DC_EXTEND_NAMESPACE, "query/hasStaticPart");

}
