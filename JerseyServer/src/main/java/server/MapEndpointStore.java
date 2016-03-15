/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * 
 * Copyright (C) 2012, 2013 Pyravlos Team
 * 
 * http://www.sextant.di.uoa.gr/
 */
package server;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;
import java.util.Vector;

import org.apache.commons.io.IOUtils;
import org.openrdf.model.Value;
import org.openrdf.model.datatypes.XMLDatatypeUtil;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.query.BindingSet;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.query.TupleQueryResultHandlerException;
import org.openrdf.query.resultio.QueryResultIO;
import org.openrdf.query.resultio.QueryResultParseException;
import org.openrdf.query.resultio.TupleQueryResultFormat;
import org.openrdf.query.resultio.UnsupportedQueryResultFormatException;
import org.openrdf.query.resultio.stSPARQLQueryResultFormat;
import org.openrdf.rio.RDFFormat;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import eu.earthobservatory.org.StrabonEndpoint.client.EndpointResult;
import eu.earthobservatory.org.StrabonEndpoint.client.SPARQLEndpoint;

/**
 *
 * @author Kallirroi Dogani <kallirroi@di.uoa.gr>
 * @author George Stamoulis <gstam@di.uoa.gr>
 */

public class MapEndpointStore {
	
	private final static Logger logger = LoggerFactory.getLogger(server.MapEndpointStore.class);
	public static final String ENDPOINT_FAILURE_MSG	= "Error during communication with the SPARQL endpoint at ";

	/** 
	 * The name of this class to be used in logging.
	 */
	private final static String moduleName = MapEndpointStore.class.getCanonicalName();
	
	private String HOSTNAME							= ServerConfiguration.getString("HOSTNAME");
	private Integer PORT							= Integer.parseInt(ServerConfiguration.getString("PORT"));
	private String ENDPOINTNAME_QUERY				= ServerConfiguration.getString("ENDPOINTNAME_QUERY");
	private String ENDPOINTNAME_STORE				= ServerConfiguration.getString("ENDPOINTNAME_STORE");
	private String ENDPOINTNAME_UPDATE				= ServerConfiguration.getString("ENDPOINTNAME_UPDATE");
	
	// user and password for the authentication on endpoints (store and update operations)
	private String USER							= ServerConfiguration.getString("USER_STORE");
	private String PASSWORD						= ServerConfiguration.getString("PASS_STORE");
	
	private GeneralSPARQLEndpoint endpoint_query;
	private GeneralSPARQLEndpoint endpoint_store;
	private GeneralSPARQLEndpoint endpoint_update;
	
	private GeneralSPARQLEndpoint myEndpoint_query;
	private GeneralSPARQLEndpoint myEndpoint_store;
	private GeneralSPARQLEndpoint myEndpoint_update;
	
	private GeneralSPARQLEndpoint myGeneralEndpoint_query;
	
	public MapEndpointStore(){		
		endpoint_query = new GeneralSPARQLEndpoint(HOSTNAME, PORT, ENDPOINTNAME_QUERY);
		
		endpoint_store = new GeneralSPARQLEndpoint(HOSTNAME, PORT, ENDPOINTNAME_STORE);
		//Prepei na mpoyn sto configuration file
		endpoint_store.setUser(USER);
		endpoint_store.setPassword(PASSWORD);
		
		endpoint_update = new GeneralSPARQLEndpoint(HOSTNAME, PORT, ENDPOINTNAME_UPDATE);
		endpoint_update.setUser(USER);
		endpoint_update.setPassword(PASSWORD);
	}
	
	public void setEndpointQuery (String host, Integer port, String nameAndType) {
		endpoint_query = new GeneralSPARQLEndpoint(host, port, nameAndType);
	}
	
	public void saveMapToEndpoint(String url, String mapId, String host, String endpoint, int port, String user, String pass){
		
		/**
		 * If endpoint is set to "registry", we save the map to the Sextant registry,
		 * else we save the map only to the given endpoint.
		 */
		
		String data = null;
		FileInputStream inputFile;
		try {
			inputFile = new FileInputStream(new File(url));
			data = IOUtils.toString(inputFile, "UTF-8");
			//System.out.println(data);
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}
		
		URL namedGraph;
		String graph = " graph <http://geo.linkedopendata.gr/map/"+mapId+"> "; 
		String updateQuery = "delete {?x ?y ?z} where{"+graph+" {?x ?y ?z} }";
		try {
			
			if (endpoint.equalsIgnoreCase("tempendpoint")) {
				endpoint_update.update(updateQuery);
				
				namedGraph = new URL("http://geo.linkedopendata.gr/map/"+mapId);
				endpoint_store.store(data, RDFFormat.NTRIPLES, namedGraph);
			}
			else {
				//Initialize the endpoint given by the user.
				myEndpoint_store = new GeneralSPARQLEndpoint(host, port, endpoint.concat("/Store"));
				myEndpoint_store.setUser(user);
				myEndpoint_store.setPassword(pass);
				
				myEndpoint_update = new GeneralSPARQLEndpoint(host, port, endpoint.concat("/Update"));
				myEndpoint_update.setUser(user);
				myEndpoint_update.setPassword(pass);
				
				//Update and save in my endpoint
				myEndpoint_update.update(updateQuery);
				
				namedGraph = new URL("http://geo.linkedopendata.gr/map/"+mapId);
				myEndpoint_store.store(data, RDFFormat.NTRIPLES, namedGraph);
			}
			
		} catch (MalformedURLException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		}		
	}

	public String getMapCreateDate(String mapId, String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = null;

		String map = MapVocabulary.INSTANCE_NAMESPACE + mapId;
		String graph = " GRAPH <http://geo.linkedopendata.gr/map/"+mapId + "> ";
		
		if (endpoint.equalsIgnoreCase("tempendpoint")) {
			String mapCreateDate =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASCREATEDATE + "> ?x .}}";
			results = getResultFromQuery(endpoint_query, mapCreateDate, "strabon");
			if (results.size()!=0){
				return results.get(0);
			}
			else{
				return "none";
			}	
		}
		else {
			String mapCreateDate =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASCREATEDATE + "> ?x .}}";
			myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint.concat("/Query"));

			results = getResultFromQuery(myEndpoint_query, mapCreateDate, "strabon");
			if (results.size()!=0){
				return results.get(0);
			}
			else{
				return "none";
			}
		}		
	}
	
	public Vector<String> getMapInformation(String mapId) throws EndpointCommunicationException {
   		Vector<String> info = new Vector<String>();
   		Vector<String> results = null;
		    
   		String map = MapVocabulary.INSTANCE_NAMESPACE + mapId;
   		String graph = " GRAPH <http://geo.linkedopendata.gr/map/"+mapId + "> ";
		    
   		//construct query to get map title
   		String mapTitle =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASTITLE + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapTitle, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}
		    		
   		//construct query to get map creator
   		String mapCreator =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASCREATOR + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapCreator, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}	
   		
   		//construct query to get map license
   		String mapLicense =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASLICENSE + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapLicense, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}
		    		
   		//construct query to get map theme
   		String mapTheme =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASTHEME + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapTheme, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}	
   		
   		//construct query to get map creation date
   		String mapCreateDate =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASCREATEDATE + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapCreateDate, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}
   		
   		//construct query to get map modification date
   		String mapModifyDate =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASMODIFYDATE + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapModifyDate, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}
   		
   		//construct query to get map extent
   		String mapExtent =  "SELECT ?x WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASGEOMETRY + "> ?x .}}";
   		results = getResultFromQuery(endpoint_query, mapExtent, "strabon");
   		if (results.size()!=0){
   			info.add(results.get(0));
   		}
   		else{
   			info.add("unknown");
   		}
		    				
   		return info;
	}
	
	public Vector<String> getQueriesText(String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();

		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		
		String queryList = "SELECT ?q ?l ?t WHERE { ?x <" + RDF.TYPE.toString() + "> <" + 
							QueryVocabulary.QUERY.toString() + "> . " + "?x <" + QueryVocabulary.HASTEXT.toString() + 
							"> ?q .?x <" + QueryVocabulary.HASLABEL.toString() + "> ?l . ?x <" + 
							QueryVocabulary.IS_TEMPORAL_QUERY.toString() + "> ?t . }";	
		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}
		else {
			info.add(null);
		}

		return info;
	}
	
	
	
	public Vector<String> getExploreClasses(String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		String queryList = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
				+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
				+ "SELECT DISTINCT  ?super ?class "
				+ "WHERE { "
				+ "?s rdf:type ?class . "
				+ "OPTIONAL { ?class rdfs:subClassOf ?super . } . "
				+ "BIND ( IF(!bound(?super), \"null\", ?super) AS ?super ). "
				+ "} "
				+ "ORDER BY ?super";	
		
		String queryList2 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
				+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
				+ "PREFIX owl: <http://www.w3.org/2002/07/owl#> "
				+ "SELECT DISTINCT  ?super ?class "
				+ "WHERE { "
				+ "{?class rdf:type rdfs:Class . "
				+ "OPTIONAL { ?class rdfs:subClassOf ?super . } . "
				+ "BIND ( IF(!bound(?super), \"null\", ?super) AS ?super ).} "
				+ "UNION "
				+ "{?class rdf:type owl:Class . "
				+ "OPTIONAL { ?class rdfs:subClassOf ?super . } . "
				+ "BIND ( IF(!bound(?super), \"null\", ?super) AS ?super ).} "
				+ "} "
				+ "ORDER BY ?super";	
		
		//Initialize the endpoint given by the user and pose query
		results = getQueryResults(host, port, endpoint, queryList2);
						
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}
		else {
			info.add(null);
		}

		return info;
	}
	
	public Vector<String> getExploreProperties(String host, String endpoint, int port, String classURI) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();				
		
		//Use RDFS, OWL and the data to get all the properties of a Class and it's super classes
		String queryList1 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
				+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
				+ "PREFIX owl: <http://www.w3.org/2002/07/owl#> "
				+ "SELECT DISTINCT  ?p ?range "
				+ "WHERE { "
				+ "{?s rdf:type <"+ classURI +"> . "
				+ "?s ?p ?o . "
				+ "?p rdf:type owl:DatatypeProperty . "
				+ "OPTIONAL { ?p rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ). }"
				+ "UNION "
				+ "{?s rdf:type <"+ classURI +"> . "
				+ "?s ?p ?o . "
				+ "?p rdf:type owl:ObjectProperty . "
				+ "OPTIONAL { ?p rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ). }"
				+ "UNION "
				+ "{?s rdf:type <"+ classURI +"> . "
				+ "?s ?p ?o . "
				+ "?p rdf:type rdf:Property . "
				+ "OPTIONAL { ?p rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ). }"
				+ "} ";	
		
		String queryList = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
				+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
				+ "PREFIX owl: <http://www.w3.org/2002/07/owl#> "
				+ "SELECT DISTINCT  ?p ?range "
				+ "WHERE { "
				+ "?s rdf:type <"+ classURI +"> . "
				+ "?s ?p ?o . "
//				+ "?p rdf:type ?pType . "
//				+ "FILTER (?pType = owl:DatatypeProperty || ?pType = owl:ObjectProperty || ?pType = rdf:Property) . "
				+ "OPTIONAL { ?p rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ). "				
				+ "} ";	
		
		//Use RDFS and OWL to get the properties of a Class. It is faster than queryList1, but we dont get the properties of the super classes
		String queryList2 = "PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#> "
				+ "PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#> "
				+ "PREFIX owl: <http://www.w3.org/2002/07/owl#> "
				+ "SELECT DISTINCT  ?x ?range "
				+ "WHERE { "
				+ "{?x rdf:type owl:DatatypeProperty . "
				+ "?x rdfs:domain <"+ classURI +"> . "
				+ "OPTIONAL { ?x rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ).} "
				+ "UNION "
				+ "{?x rdf:type owl:ObjectProperty . "
				+ "?x rdfs:domain <"+ classURI +"> . "
				+ "OPTIONAL { ?x rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ).} "
				+ "UNION "
				+ "{?x rdf:type rdf:Property . "
				+ "?x rdfs:domain <"+ classURI +"> . "
				+ "OPTIONAL { ?x rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ).} "
				+ "UNION "
				+ "{?x rdfs:subPropertyOf+ rdf:Property . "
				+ "?x rdfs:domain <"+ classURI +"> . "
				+ "OPTIONAL { ?x rdfs:range ?range . } . "
				+ "BIND ( IF(!bound(?range), \"null\", ?range) AS ?range ).} "
				+ "}";
		
		//Initialize the endpoint given by the user and pose query
		results = getQueryResults(host, port, endpoint, queryList);
				
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}
		else {
			info = null;
		}

		return info;
	}
	
	public Vector<String> getExploreDescribe(String host, String endpoint, int port, String classURI) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		String queryList = "SELECT ?s ?p ?o "
				+ "WHERE { "
				+ "?s ?p ?o . "
				+ "FILTER (( ?s = <"+ classURI +">) || (?p = <"+ classURI +">) || (?o = <"+ classURI +">)) "				
				+ "} "
				+ "LIMIT 2000";

		//Initialize the endpoint given by the user and pose query
		results = getQueryResults(host, port, endpoint, queryList);
		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}
		else {
			info = null;
		}

		return info;
	}
	
	public Vector<String> getDimensionsNames(String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		
		//Get dimensions with position "subject"
		String queryList = "SELECT DISTINCT ?dim ?order ?c WHERE { ?dim <" + RDF.TYPE.toString() + "> <" + 
							StatisticsVocabulary.DIMENSION.toString() + "> . " + "?dim <" + StatisticsVocabulary.ORDER.toString() + 
							"> ?order . ?dim <" + StatisticsVocabulary.POSITION.toString() + "> ?pos . " + 
							"FILTER (?pos = \"subject\"^^<http://www.w3.org/2001/XMLSchema#string>) ." +
							"?s ?dim ?o . " +
							"?s <" + RDF.TYPE.toString() + "> ?c . }";	
		
		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}		
		
		//Get dimensions with position "object"
		queryList = "SELECT DISTINCT ?dim ?order ?c WHERE { ?dim <" + RDF.TYPE.toString() + "> <" + 
				StatisticsVocabulary.DIMENSION.toString() + "> . " + "?dim <" + StatisticsVocabulary.ORDER.toString() + 
				"> ?order . ?dim <" + StatisticsVocabulary.POSITION.toString() + "> ?pos . " + 
				"FILTER (?pos = \"object\"^^<http://www.w3.org/2001/XMLSchema#string>) ." +
				"?s ?dim ?o . " +
				"?o <" + RDF.TYPE.toString() + "> ?c . }";	

		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}

		return info;
	}
	
	public Vector<String> getInstancesNames(String host, String endpoint, int port, String fixedDim, String fixedType) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		
		//Get instances if position is "subject"
		String queryList = "SELECT DISTINCT ?instance WHERE { ?instance <" + fixedDim + "> ?o . " +
							"<" + fixedDim + "> <" + StatisticsVocabulary.POSITION.toString() + "> ?pos . " + 
							"FILTER (?pos = \"subject\"^^<http://www.w3.org/2001/XMLSchema#string>) ." +
							"?instance <" + RDF.TYPE.toString() + "> <" + fixedType + "> . }";	
		
		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}		
		
		//Get instances if position is "object"
		queryList = "SELECT DISTINCT ?instance WHERE { ?s <" + fixedDim + "> ?instance . " +
				"<" + fixedDim + "> <" + StatisticsVocabulary.POSITION.toString() + "> ?pos . " + 
				"FILTER (?pos = \"object\"^^<http://www.w3.org/2001/XMLSchema#string>) ." +
				"?instance <" + RDF.TYPE.toString() + "> <" + fixedType + "> . }";

		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}

		return info;
	}
	
	public Vector<String> getMeasureProperties(String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		
		//Get instances if position is "subject"
		String queryList = "SELECT DISTINCT ?measure WHERE { ?measure <" + RDF.TYPE.toString() + "> <"+ StatisticsVocabulary.MEASURE.toString() + "> . }";	
		
		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}		

		return info;
	}
	
	public Vector<String> getStaticPart(String host, String endpoint, int port) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		
		//Get instances if position is "subject"
		String queryList = "SELECT DISTINCT ?static WHERE { ?s <" + StatisticsVocabulary.STATIC_PART.toString() + "> ?static . }";	
		
		results = getResultFromQuery(myEndpoint_query, queryList, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}		

		return info;
	}
	
	public Vector<String> getDataForChart(String host, String endpoint, int port, String query) throws EndpointCommunicationException {
		Vector<String> results = new Vector<String>();
		Vector<String> info = new Vector<String>();
		
		//Initialize the endpoint given by the user.
		myEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
				
		results = getResultFromQuery(myEndpoint_query, query, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				info.add(results.get(i));
			}
		}		

		return info;
	}
	
	public Vector<Vector<String>> openMapFromLink(String mapId) throws EndpointCommunicationException {
		
		Vector<Vector<String>> allLayersInfo = new Vector<Vector<String>>();
		Vector<String> results = null;
		int count = 0;
				
		String map = MapVocabulary.INSTANCE_NAMESPACE + mapId;
		String list = null;
		
		String graph = " GRAPH <http://geo.linkedopendata.gr/map/"+mapId + "> ";
		
		//construct query to get layer list for this map
		String queryList = "SELECT ?l WHERE {"+ graph + "{<" + map+"> <" + MapVocabulary.HASORDEREDLIST +"> ?l .}}";
		results = getResultFromQuery(endpoint_query,queryList, "strabon");
		if (results.size()!=0){
			list = new String(results.get(0));
		}
		else{
			return null;
		}
		
		//construct query to get the number of layers 
		String queryCount = "SELECT (COUNT(?x) as ?c) WHERE {"+ graph + " {?x <"+ RDF.TYPE.toString() + "> <" + MapVocabulary.LAYER.toString() + "> . <" +
							list+"> ?hasLayer ?x .}}";
		results = getResultFromQuery(endpoint_query,queryCount, "strabon");
		if (results.size()!=0){
			count = Integer.parseInt(results.get(0));
		}
		else{
			return null;
		}
		
		for(int i=0; i<count; i++){
			
			Vector<String> layerInfo = new Vector<String>();
			allLayersInfo.add(layerInfo);
			
			results = null;
			
			String id = ((Integer) (i+1)).toString();
			
			String query0 = "SELECT ?x WHERE {"+ graph + " {<"+list+"> <" + RDF.NAMESPACE + "_" + id + "> ?x}}";
			results = getResultFromQuery(endpoint_query, query0, "strabon");
			if (results.size()!=0){
				
				String layerId= results.get(0);
				
				String query1= "SELECT ?x WHERE { "+ graph + " {<"+ layerId +"> <" + MapVocabulary.HASNAME.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query1, "strabon");
				String layerName = results.get(0);
				if (results.size()!=0) {
					layerInfo.add(layerName);
					
				} else {
					layerInfo.add(null);
				}
				
				String query2= "SELECT ?x WHERE {"+ graph + " {<"+ layerId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q." +
						"?q <" + MapVocabulary.HASVALUE.toString() + "> ?x.}}";
				results = getResultFromQuery(endpoint_query, query2, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);
				
				String query3= "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASKMLFILE.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query3, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);
				
				String query4= "SELECT ?x WHERE {"+ graph + " {<"+ layerId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q." +
								"?q  <" + MapVocabulary.DERIVEDBY.toString() + "> ?e. ?e <" + MapVocabulary.HASURI.toString() + "> ?x.}}";
				results = getResultFromQuery(endpoint_query, query4, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);	
				
				String query5= "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASPOLYSTYLECOLOR.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query5, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);
				
				String query6= "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASLINESTYLECOLOR.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query6, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);
				
				String query7= "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASICON.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query7, "strabon");
				if (results.size()!=0)
					layerInfo.add(results.get(0));
				else
					layerInfo.add(null);
				
				String query8 = "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASICONSCALE.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query8, "strabon");
				if (results.size()!=0) {
					layerInfo.add(results.get(0));
					
				} else {
					layerInfo.add(null);
				}
				
				String query9 = "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.IS_TEMPORAL_LAYER.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query9, "strabon");
				if (results.size() > 0) {
					/*
					 * The result is a String corresponding to a Boolean value (e.g., true, True, false, False, 0, or 1)
					 * However, in Java valid boolean values are the first two, plus "yes" and "no".
					 * Therefore, to be on the safe side, I parse the result using the utility of Sesame to get
					 * a Boolean Java object and then I get the corresponding String value for which I
					 * am sure that when I construct a Boolean object on the client side (e.g., when initializing
					 * whether a layer is temporal or not), there will not be any errors.
					 */
					layerInfo.add(String.valueOf(XMLDatatypeUtil.parseBoolean(results.get(0))));
					
					
					if (logger.isDebugEnabled()) {
						if (XMLDatatypeUtil.parseBoolean(results.get(0))) {
							logger.debug("[{}] Layer '{}' is temporal.", moduleName, layerName);
						}	
					}
				} else {
					// for compatibility with maps that have been produced with the
					// older version of Sextant in which there is no RDF property
					// inserted to mark a layer whether is temporal or not
					layerInfo.add(String.valueOf(false));
				}
				
				String query10 = "SELECT ?x WHERE { "+ graph + "{<"+ layerId +"> <" + MapVocabulary.HASIMAGEBOX.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query10, "strabon");
				if (results.size()!=0) {
					layerInfo.add(results.get(0));
					
				} else {
					layerInfo.add(null);
				}
							
			}
			else{
				
				return null;
			}
							
		}		
		
		//construct query to get the number of charts 
		String queryCountCharts = "SELECT (COUNT(?x) as ?c) WHERE {"+ graph + " {?x <"+ RDF.TYPE.toString() + "> <" + MapVocabulary.CHART.toString() + "> . }}";
		results = getResultFromQuery(endpoint_query, queryCountCharts, "strabon");
		if (results.size()!=0){
			count = Integer.parseInt(results.get(0));
			
			//Add to allLayersInfo a Vector<String> to separate layers' info from charts' info
			Vector<String> separate = new Vector<String>();
			separate.add("@@@");
			allLayersInfo.add(separate);
			
			//Get the charts' information
			for(int i=0; i<count; i++){
				Vector<String> chartInfo = new Vector<String>();
				allLayersInfo.add(chartInfo);
				
				results = null;
				String id = ((Integer) (i)).toString();
				String chartId = map.concat("ch"+id);
				
				String query11 = "SELECT ?x WHERE { "+ graph + "{<"+ chartId +"> <" + RDF.TYPE.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query11, "strabon");
				if (results.size()!=0) {
					chartInfo.add(results.get(0));
				} else {
					chartInfo.add(null);
				}
				
				String query12 = "SELECT ?x WHERE { "+ graph + "{<"+ chartId +"> <" + MapVocabulary.HASCHARTTYPE.toString() + "> ?x}}";
				results = getResultFromQuery(endpoint_query, query12, "strabon");
				if (results.size()!=0) {
					chartInfo.add(results.get(0));
				} else {
					chartInfo.add(null);
				}
				
				String query13 = "SELECT ?x WHERE { "+ graph + "{<"+ chartId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q . " +
								 "?q <" + MapVocabulary.HASVALUE.toString() + "> ?x . }}";
				results = getResultFromQuery(endpoint_query, query13, "strabon");
				if (results.size()!=0) {
					chartInfo.add(results.get(0));
				} else {
					chartInfo.add(null);
				}
				
				String query14= "SELECT ?x WHERE {"+ graph + " {<"+ chartId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q." +
						"?q  <" + MapVocabulary.DERIVEDBY.toString() + "> ?e. ?e <" + MapVocabulary.HASURI.toString() + "> ?x.}}";
				results = getResultFromQuery(endpoint_query, query14, "strabon");
				if (results.size()!=0) {
					chartInfo.add(results.get(0));
				}
				else {
					chartInfo.add(null);
				}
				
				//construct query to get the number of measures in the chart 
				String queryCountMeasures = "SELECT (COUNT(?x) as ?c) WHERE {"+ graph + " { <" + map + "listMeasures" + id + "> ?p ?x . FILTER(?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ) . }}";
				results = getResultFromQuery(endpoint_query, queryCountMeasures, "strabon");
				Vector<String> m = new Vector<String>();
				if (results.size()!=0){
					int counter = Integer.parseInt(results.get(0));
					for (int j=0; j<counter; j++) {
						String query15 = "SELECT ?x WHERE { "+ graph + "{<"+ chartId +"> <" + MapVocabulary.HASMEASURES.toString() + "> <" + map + "listMeasures" + id + "> . " +
								 "<" + map + "listMeasures" + id + "> <" + RDF.NAMESPACE +"Measure_" + id + "_" + new Integer(j).toString() + "> ?m . " +
								 "?m <" + MapVocabulary.HASNAME.toString() + "> ?x . }}";
						results = getResultFromQuery(endpoint_query, query15, "strabon");
						if (results.size()!=0) {
							m.add(results.get(0));
						} else {
							m.add(null);
						}
					}
					chartInfo.add(m.toString());
				}
				
				//construct query to get the number of freeDims in the chart 
				String queryCountFreeDims = "SELECT (COUNT(?x) as ?c) WHERE {"+ graph + " { <" + map + "listFreeDims" + id + "> ?p ?x . FILTER(?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ) . }}";
				results = getResultFromQuery(endpoint_query, queryCountFreeDims, "strabon");
				Vector<String> dims = new Vector<String>();
				if (results.size()!=0){
					int counter = Integer.parseInt(results.get(0));
					for (int j=0; j<counter; j++) {
						String query16 = "SELECT ?x ?order ?ref WHERE { "+ graph + "{<"+ chartId +"> <" + MapVocabulary.HASFREEDIMS.toString() + "> <" + map + "listFreeDims" + id + "> . " +
								"<" + map + "listFreeDims" + id + "> <" + RDF.NAMESPACE +"FreeDim_" + id + "_" + new Integer(j).toString() + "> ?fd . " +
								 "?fd <" + MapVocabulary.HASNAME.toString() + "> ?x . " +
								 "?fd <" + StatisticsVocabulary.ORDER.toString() + "> ?order . " +
								 "?fd <" + MapVocabulary.REFERS.toString() + "> ?ref . }}";
						results = getResultFromQuery(endpoint_query, query16, "strabon");
						if (results.size()!=0) {
							for(int k=0; k<results.size(); k++) {
								dims.add(results.get(k));
							}
						} else {
							dims.add(null);
						}
					}
					chartInfo.add(dims.toString());
				}
				
				//construct query to get the number of instances in the chart 
				String queryCountInstances = "SELECT (COUNT(?x) as ?c) WHERE {"+ graph + " { <" + map + "listInstances" + id + "> ?p ?x . FILTER(?p != <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> ) . }}";
				results = getResultFromQuery(endpoint_query, queryCountInstances, "strabon");
				Vector<String> inst = new Vector<String>();
				if (results.size()!=0){
					int counter = Integer.parseInt(results.get(0));
					for (int j=0; j<counter; j++) {
						String query17 = "SELECT ?x WHERE { "+ graph + "{<"+ chartId +"> <" + MapVocabulary.HASINSTANCES.toString() + "> <" + map + "listInstances" + id + "> . " +
								 "<" + map + "listInstances" + id + "> <" + RDF.NAMESPACE +"Instance_" + id + "_" + new Integer(j).toString() + "> ?inst . " +
								 "?inst <" + MapVocabulary.HASNAME.toString() + "> ?x . }}";
						results = getResultFromQuery(endpoint_query, query17, "strabon");
						if (results.size()!=0) {
							inst.add(results.get(0));
						} else {
							inst.add(null);
						}
					}
					chartInfo.add(inst.toString());
				}
			}
		}
		
		return allLayersInfo;
	}
	
	private Vector<String> getResultFromQuery(GeneralSPARQLEndpoint endpoint, String query, String endpointType) throws EndpointCommunicationException { 
		String msg = MapEndpointStore.ENDPOINT_FAILURE_MSG + endpoint.getConnectionURL();
				
		Vector<String> res = new Vector<String>();		

		try {	
			EndpointResult response = endpoint.query(query, stSPARQLQueryResultFormat.XML, endpointType);			

			InputStream inputStream = new ByteArrayInputStream(response.getResponse().getBytes("UTF-8")); 
			
			TupleQueryResult results = QueryResultIO.parse(inputStream, TupleQueryResultFormat.SPARQL);
			
			List<String> bindingNames = results.getBindingNames();
		
			while (results.hasNext()) {
				BindingSet bindingSet = results.next();
				for (int i = 0; i < bindingSet.size(); i++)
				{
					Value value =  bindingSet.getValue(bindingNames.get(i));
					res.add(value.stringValue());	
				}
			}
			
			results.close();
				
		} catch (QueryEvaluationException e) {
			logger.error("[{}] Error during query evaluation.", moduleName, e);
			throw new EndpointCommunicationException(msg + ".");
			
		} catch (IOException e) {
			logger.error("[{}] Error in reading query results.", moduleName, e);
			throw new EndpointCommunicationException(msg + ".");
			
		} catch (QueryResultParseException e) {
			logger.error("[{}] Unexpected query result format (expecting XML). Probably the endpoint at {} has lost its connection to the database.", new Object[] {moduleName, endpoint.getConnectionURL()}, e);
			throw new EndpointCommunicationException(msg + ".");
			
		} catch (TupleQueryResultHandlerException e) {
			logger.error("[{}] Error in handling query result.", moduleName, e);
			throw new EndpointCommunicationException(msg + ".");
			
		} catch (UnsupportedQueryResultFormatException e) {
			logger.error("[{}] Requested query result format (XML) is not supported.", moduleName, e);
			throw new EndpointCommunicationException(msg + ".");
		}
	
		return res;
	}

	public Vector<String> searchForMaps(String query) throws EndpointCommunicationException {
		Vector<String> searchResults = new Vector<String>();
		Vector<String> results = new Vector<String>();
		
		results = getResultFromQuery(endpoint_query, query, "strabon");		
		if (results.size() != 0) {
			for (int i=0; i<results.size(); i++) {
				searchResults.add(results.get(i));
			}
		}
		else {
			searchResults.add("none");
		}
		
		return searchResults;
	}
	
	public Vector<String> getQueryResults(String host, int port, String endpoint, String queryString) throws EndpointCommunicationException{
		Vector<String> results = new Vector<String>();
		//Initialize the endpoint given by the user.
		myGeneralEndpoint_query = new GeneralSPARQLEndpoint(host, port, endpoint);
		results = getResultFromQuery(myGeneralEndpoint_query, queryString, host);		
		
		return results;
	}
}
