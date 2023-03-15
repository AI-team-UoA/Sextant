package server;

import org.openrdf.model.URI;
import org.openrdf.sail.memory.model.MemURI;

public interface QueryVocabulary {
	public static final String Q_NAMESPACE 			= "http://geo.linkedopendata.gr/query/ontology/";
	
	//classes
	public static final URI QUERY 				= new MemURI(null, Q_NAMESPACE, "predefinedQuery");
	
	//properties
	public static final URI HASTEXT  			= new MemURI(null, Q_NAMESPACE, "hasText");
	public static final URI HASLABEL  			= new MemURI(null, Q_NAMESPACE, "hasLabel");
	public static final URI IS_TEMPORAL_QUERY	= new MemURI(null, Q_NAMESPACE, "isTemporal");
}
