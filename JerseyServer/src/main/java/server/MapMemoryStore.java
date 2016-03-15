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

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.net.URL;
import java.util.HashMap;
import java.util.List;
import java.util.Vector;

import org.openrdf.model.Literal;
import org.openrdf.model.URI;
import org.openrdf.model.Value;
import org.openrdf.model.ValueFactory;
import org.openrdf.model.datatypes.XMLDatatypeUtil;
import org.openrdf.model.impl.BooleanLiteralImpl;
import org.openrdf.model.vocabulary.RDF;
import org.openrdf.query.BindingSet;
import org.openrdf.query.MalformedQueryException;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.QueryLanguage;
import org.openrdf.query.TupleQuery;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.repository.Repository;
import org.openrdf.repository.RepositoryConnection;
import org.openrdf.repository.RepositoryException;
import org.openrdf.repository.sail.SailRepository;
import org.openrdf.rio.RDFFormat;
import org.openrdf.rio.RDFHandler;
import org.openrdf.rio.RDFHandlerException;
import org.openrdf.rio.RDFParseException;
import org.openrdf.rio.ntriples.NTriplesWriter;
import org.openrdf.sail.memory.MemoryStore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 * @author Kallirroi Dogani <kallirroi@di.uoa.gr>
 * @author George Stamoulis <gstam@di.uoa.gr>
 */
public class MapMemoryStore {

	private final static Logger logger = LoggerFactory.getLogger(server.MapEndpointStore.class);

	/** 
	 * The name of this class to be used in logging.
	 */
	private final static String moduleName = MapMemoryStore.class.getSimpleName();
	
	/**
	 *  The underlying RDF store
	 */
	private Repository repo;
	
	private HashMap<String, Integer> endpointURIs;
	private String mapID;

	public MapMemoryStore() {
			repo = createNewMemoryRepository();
	}
	
	public String getMapID() {
		return mapID;
	}

	public void setMapID(String mapID) {
		this.mapID = mapID;
	}
	
	/* this function is called only when a map is opened */
	public boolean openConnectionToFile(String pathtofile) {
		RepositoryConnection con = null; 
		
		try {
			// get connection
			con = repo.getConnection();

			// delete all previous triples
			con.clear();
			con.add(new URL(pathtofile), null, RDFFormat.NTRIPLES);
			
		} catch (RDFParseException e) {
			logger.error("[{}] RDF parse error.", moduleName, e);
			
		} catch (IOException e) {
			logger.error("[{}] Error while storing.", moduleName, e);
			
		} catch (RepositoryException e) {
			logger.error("[{}] Failed to delete all triples from the memory store.", moduleName, e);
			
		} finally { // ensure close of connection
			closeConnection(con);
		}

		return true;
	}
	
	public void saveLayer(int layerNumber, String query, String pathtokml, String layerName, 
							String endpointURI, String polyStyleColor, String lineStyleColor,
							String IconRef, Double scale, boolean isTemporal, String imageBox, 
							String title, String creator, String license, String theme,
							String createDate, String modifyDate, String geosparql, String description) {
		
		RepositoryConnection con = null;
		
		try {
			con = repo.getConnection();
		
			ValueFactory f = repo.getValueFactory();
						
			URI mapId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID);
			URI listId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "list");
			URI layerId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "l"+ new Integer(layerNumber).toString());
			URI order = f.createURI(RDF.NAMESPACE +"_"+ new Integer(layerNumber+1).toString());
			URI kml = f.createURI(pathtokml);
			Literal layernameLiteral = f.createLiteral(layerName);
			
			Literal titleLabel = f.createLiteral(title);
			Literal creatorLabel = f.createLiteral(creator);
			Literal licenseLabel = f.createLiteral(license);
			Literal themeLabel = f.createLiteral(theme);
			Literal descriptionLabel = f.createLiteral(description);
			URI dateTime = f.createURI("http://www.w3.org/2001/XMLSchema#dateTime");
			Literal createDateLabel = f.createLiteral(createDate, dateTime);
			Literal modifyDateLabel = f.createLiteral(modifyDate, dateTime);
			URI geosparqlWKT = f.createURI("http://www.opengis.net/ont/geosparql#wktLiteral");
			Literal geosparqlWKTLiteral = f.createLiteral(geosparql, geosparqlWKT);
			
			if (layerNumber ==0){  /* the first layer to be saved */
				endpointURIs = new HashMap<String, Integer>();
				
				con.add(mapId, RDF.TYPE, MapVocabulary.MAP);
				con.add(mapId, MapVocabulary.HASORDEREDLIST, listId);
				con.add(listId, RDF.TYPE, RDF.SEQ);
				
				//Add map title, creator and theme
				con.add(mapId, MapVocabulary.HASTITLE, titleLabel);
				con.add(mapId, MapVocabulary.HASCREATOR, creatorLabel);
				con.add(mapId, MapVocabulary.HASLICENSE, licenseLabel);
				con.add(mapId, MapVocabulary.HASTHEME, themeLabel);
				con.add(mapId, MapVocabulary.HASDESCRIPTION, descriptionLabel);
				con.add(mapId, MapVocabulary.HASCREATEDATE, createDateLabel);
				con.add(mapId, MapVocabulary.HASMODIFYDATE, modifyDateLabel);
				con.add(mapId, MapVocabulary.HASGEOMETRY, geosparqlWKTLiteral);
			}
		
			con.remove(layerId, null, null);
			con.remove(listId, null, layerId);
			
			con.add(layerId, RDF.TYPE, MapVocabulary.LAYER);
			con.add(layerId, MapVocabulary.HASNAME, layernameLiteral);
			con.add(layerId, MapVocabulary.HASKMLFILE , kml);
			con.add(layerId, MapVocabulary.DISPLAYEDAT , MapVocabulary.MAP);
			con.add(layerId, MapVocabulary.IS_TEMPORAL_LAYER, new BooleanLiteralImpl(isTemporal));
			
			con.add(listId, order, layerId);
			
			if (polyStyleColor!=null && !polyStyleColor.equals("")){
				Literal polyStyleLiteral = f.createLiteral(polyStyleColor);
				con.add(layerId, MapVocabulary.HASPOLYSTYLECOLOR, polyStyleLiteral);
			}
			if (lineStyleColor!=null && !lineStyleColor.equals("")){
				Literal lineStyleLiteral = f.createLiteral(lineStyleColor);
				con.add(layerId, MapVocabulary.HASLINESTYLECOLOR, lineStyleLiteral);
			}
			if (IconRef!=null && !IconRef.equals("")){
				URI iconRef = f.createURI(IconRef);
				con.add(layerId, MapVocabulary.HASICON, iconRef);
			}
			if (scale!=-1.0){
				Literal iconScaleLiteral = f.createLiteral(scale);
				con.add(layerId, MapVocabulary.HASICONSCALE, iconScaleLiteral);
			}
			if (imageBox!=null && !imageBox.equals("")){
				Literal imageBoxUri = f.createLiteral(imageBox);
				con.add(layerId, MapVocabulary.HASIMAGEBOX, imageBoxUri);
			}
			
			if ( (endpointURI!=null && !endpointURI.equalsIgnoreCase("")) && (query!=null && !query.equalsIgnoreCase(""))){ /*null values when loading a KML file*/
				
				Integer id = endpointURIs.get(endpointURI);
				
				URI endpointId;
				if (id==null){   	/* this endpoint hasn't been saved before */
					
					endpointId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "e" + layerNumber);
					URI endpoint = f.createURI(endpointURI);
					con.add(endpointId, MapVocabulary.HASURI, endpoint);
					con.add(endpointId, RDF.TYPE, MapVocabulary.ENDPOINT);
					
					endpointURIs.put(endpointURI, layerNumber);
				}
				else{	
					endpointId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "e" + id);
				}

				URI queryId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "q"+ new Integer(layerNumber).toString());
				Literal queryLiteral = f.createLiteral(query); 
				con.remove(queryId,null,null);
				
				con.add(queryId, RDF.TYPE, MapVocabulary.QUERY);
				con.add(queryId, MapVocabulary.HASVALUE, queryLiteral);
				con.add(layerId, MapVocabulary.PRODUCEDBYQUERY, queryId);

				con.add(queryId, MapVocabulary.DERIVEDBY, endpointId);
			}
			
						
		} catch (RepositoryException e) {
			logger.error("[{}] Could not insert triples to memory store.", moduleName, e);
			
		} finally {
			closeConnection(con);
		}
		
	}
	
	public void saveChart(int chartNumber, String query, String endpointURI, String type, String measures, String freeDims, String instances) {

		RepositoryConnection con = null;

		try {
			con = repo.getConnection();

			ValueFactory f = repo.getValueFactory();

			URI chartId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "ch"+ new Integer(chartNumber).toString());
			con.remove(chartId,null,null);
			
			con.add(chartId, RDF.TYPE, MapVocabulary.CHART);
			
			Literal typeLabel = f.createLiteral(type);
			
			URI listMeasuresId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "listMeasures" + new Integer(chartNumber).toString());
			URI listFreeDimsId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "listFreeDims" + new Integer(chartNumber).toString());
			URI listInstancesId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "listInstances" + new Integer(chartNumber).toString());
			
			con.add(listMeasuresId, RDF.TYPE, RDF.SEQ);
			String[] measureList = measures.split(",");
			for (int i=0; i<measureList.length; i++) {
				URI measureId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "measure" + new Integer(chartNumber).toString() + "_" + new Integer(i).toString());
				URI measureOrder = f.createURI(RDF.NAMESPACE +"Measure_" + new Integer(chartNumber).toString() + "_" + new Integer(i).toString());
				con.add(listMeasuresId, measureOrder, measureId);
				URI measureURI = f.createURI(measureList[i]);
				con.add(measureId, RDF.TYPE, StatisticsVocabulary.MEASURE);
				con.add(measureId, MapVocabulary.HASNAME, measureURI);
			}
			
			con.add(listFreeDimsId, RDF.TYPE, RDF.SEQ);
			String[] freeDimsList = freeDims.split(", ");
			for (int i=0; i<freeDimsList.length; i+=3) {
				int position = (i == 0) ? i : i-2;
				URI freeDimId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "freeDim" + new Integer(chartNumber).toString() + "_" + new Integer(position).toString());
				URI freeDimOrder = f.createURI(RDF.NAMESPACE +"FreeDim_" + new Integer(chartNumber).toString() + "_" + new Integer(position).toString());
				con.add(listFreeDimsId, freeDimOrder, freeDimId);
				URI freeDimURI = f.createURI(freeDimsList[i]);
				Literal dimOrder = f.createLiteral(freeDimsList[i+1]);
				URI dimType = f.createURI(freeDimsList[i+2]);
				con.add(freeDimId, RDF.TYPE, StatisticsVocabulary.DIMENSION);
				con.add(freeDimId, MapVocabulary.HASNAME, freeDimURI);
				con.add(freeDimId, StatisticsVocabulary.ORDER, dimOrder);
				con.add(freeDimId, MapVocabulary.REFERS, dimType);
			}
			
			con.add(listInstancesId, RDF.TYPE, RDF.SEQ);
			String[] instancesList = instances.split(",");
			for (int i=0; i<instancesList.length; i++) {
				URI isntanceId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "instance" + new Integer(chartNumber).toString() + "_" + new Integer(i).toString());
				URI instanceOrder = f.createURI(RDF.NAMESPACE +"Instance_" + new Integer(chartNumber).toString() + "_" + new Integer(i).toString());
				con.add(listInstancesId, instanceOrder, isntanceId);
				URI instanceURI = f.createURI(instancesList[i]);
				con.add(isntanceId, MapVocabulary.HASNAME, instanceURI);
			}
			
			con.add(chartId, MapVocabulary.HASCHARTTYPE, typeLabel);

			Integer id = endpointURIs.get(endpointURI);

			URI endpointId;
			if (id==null) {   	/* this endpoint hasn't been saved before */
				endpointId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "e" + chartNumber);
				URI endpoint = f.createURI(endpointURI);
				con.add(endpointId, MapVocabulary.HASURI, endpoint);
				con.add(endpointId, RDF.TYPE, MapVocabulary.ENDPOINT);

				endpointURIs.put(endpointURI, chartNumber);
			}
			else{	
				endpointId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "e" + id);
			}

			URI queryId = f.createURI(MapVocabulary.INSTANCE_NAMESPACE + mapID + "qC"+ new Integer(chartNumber).toString());
			Literal queryLiteral = f.createLiteral(query); 
			con.remove(queryId,null,null);
			
			con.add(queryId, RDF.TYPE, MapVocabulary.QUERY);
			con.add(queryId, MapVocabulary.HASVALUE, queryLiteral);
			con.add(chartId, MapVocabulary.PRODUCEDBYQUERY, queryId);
			con.add(queryId, MapVocabulary.DERIVEDBY, endpointId);	
			con.add(chartId, MapVocabulary.HASMEASURES, listMeasuresId);
			con.add(chartId, MapVocabulary.HASFREEDIMS, listFreeDimsId);
			con.add(chartId, MapVocabulary.HASINSTANCES, listInstancesId);
		
		} catch (RepositoryException e) {
			logger.error("[{}] Could not insert triples to memory store.", moduleName, e);

		} finally {
			closeConnection(con);
		}

	}	
	
	public void storeFileToDisk(String pathtofile){
		RepositoryConnection con = null; 
		
		try{
			con = repo.getConnection();			
			File file = new File(pathtofile);
			
			if (file.exists()) {
				PrintWriter writer = new PrintWriter(file);
				writer.print("");
				writer.close();
			}
			
			RDFHandler ntriplesWriter = new NTriplesWriter(new FileOutputStream(file));
			con.export(ntriplesWriter);	
		
		} catch (RepositoryException e) {
			logger.error("[{}] Could not open connection to memory store.", moduleName, e);
			
		} catch (FileNotFoundException e) {
			logger.error("[{}] Output file to write was not found.", moduleName, e);
			
		} catch (RDFHandlerException e) {
			logger.error("[{}] Error in instantiating the NtriplesWriter.", moduleName, e);
			
		} finally {
			closeConnection(con);
		}
	}
	
	
	public Vector<Vector<String>> loadMap(){
		Vector<Vector<String>> allLayersInfo = new Vector<Vector<String>>();
		RepositoryConnection con = null;
		int count = 0;
		
		try{
			con = repo.getConnection();
			String queryCount = "select (count(?x) as ?c) where {?x <"+ RDF.TYPE.toString() + "> <" + MapVocabulary.LAYER.toString() + ">}";
			TupleQuery tupleQuery = con.prepareTupleQuery(QueryLanguage.SPARQL, queryCount);	
			TupleQueryResult result = tupleQuery.evaluate();
		
			while (result.hasNext()) {
				BindingSet bindingSet = result.next();
				Value valueOfC =  bindingSet.getValue("c");
				String countString = valueOfC.stringValue();
				count = Integer.parseInt(countString);
				if (logger.isDebugEnabled()) {
					logger.debug("[{}] Map contains {} layers.", moduleName, count);
				}
			}
			
			result.close();
			
			for(int i=0; i<count; i++){
				
				Vector<String> layerInfo = new Vector<String>();
				allLayersInfo.add(layerInfo);
				
				Vector<String> results = null;
				
				String id = ((Integer) (i+1)).toString();
				
				String query0 = "select ?x where{ ?k <" + RDF.NAMESPACE + "_" + id + "> ?x}";
				results = getResultFromQuery(con,query0);
				if (results.size()!=0){
					String layerId= results.get(0);
				
					String query1= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASNAME.toString() + "> ?x}";
					results = getResultFromQuery(con,query1);
					String layerName = results.get(0);
					if (results.size()!=0) {
						layerInfo.add(layerName);
						
					} else {
						layerInfo.add(null);
						
					}
					
					String query2= "select ?x where { <"+ layerId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q." +
							"?q <" + MapVocabulary.HASVALUE.toString() + "> ?x.}";
					results = getResultFromQuery(con,query2);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
					
					String query3= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASKMLFILE.toString() + "> ?x}";
					results = getResultFromQuery(con,query3);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
					
					String query4= "select ?x where { <"+ layerId +"> <" + MapVocabulary.PRODUCEDBYQUERY.toString() + "> ?q." +
									"?q  <" + MapVocabulary.DERIVEDBY.toString() + "> ?e. ?e <" + MapVocabulary.HASURI.toString() + "> ?x.}";
					results = getResultFromQuery(con,query4);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);	
					
					String query5= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASPOLYSTYLECOLOR.toString() + "> ?x}";
					results = getResultFromQuery(con,query5);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
					
					String query6= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASLINESTYLECOLOR.toString() + "> ?x}";
					results = getResultFromQuery(con,query6);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
					
					String query7= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASICON.toString() + "> ?x}";
					results = getResultFromQuery(con,query7);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
					
					String query8= "select ?x where { <"+ layerId +"> <" + MapVocabulary.HASICONSCALE.toString() + "> ?x}";
					results = getResultFromQuery(con,query8);
					if (results.size()!=0)
						layerInfo.add(results.get(0));
					else
						layerInfo.add(null);
				
					String query9 = "SELECT ?x WHERE { <"+ layerId +"> <" + MapVocabulary.IS_TEMPORAL_LAYER.toString() + "> ?x}";
					results = getResultFromQuery(con, query9);
					if (results.size()!=0) {
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
						layerInfo.add(null);
					}
				}
				else{
					
					return null;
				}
				
			}
		
		} catch (QueryEvaluationException e) {
			logger.error("[{}] Error during query evaluation.", moduleName, e);
			
		} catch (RepositoryException e) {
			logger.error("[{}] Cannot open connection to memory store.", moduleName, e);
			
		} catch (MalformedQueryException e) {
			logger.error("[{}] Malformed query in loadMap().", moduleName, e);
			
		} finally {
			closeConnection(con);
		}
		
		return allLayersInfo;
	}
	
	private Vector<String> getResultFromQuery(RepositoryConnection con, String query) {
		Vector<String> res = new Vector<String>();		
		
		try {
			TupleQuery tupleQuery = con.prepareTupleQuery(QueryLanguage.SPARQL, query);	
			TupleQueryResult result = tupleQuery.evaluate();
		
			List<String> bindingNames = result.getBindingNames();
			while (result.hasNext()) {
				BindingSet bindingSet = result.next();
				Value value = bindingSet.getValue(bindingNames.get(0));
				res.add(value.stringValue());
			}
			
			result.close();
	
		} catch (Exception e) {
			logger.error("[{}] Error during querying in method getResultFromQuery()", moduleName, e);
		}
		
		return res;
	}
	
	/**
	 * Creates a new MemoryStore repository.
	 * 
	 * @return
	 */
	private Repository createNewMemoryRepository() {
		try {
			
			Repository repo = new SailRepository(new MemoryStore());
			repo.initialize();
			
			return repo;
				
		}catch (RepositoryException e) {
			logger.error("[{}] Failed to create {} object.", moduleName, moduleName);
		}
		
		return null;
	}
	
	/**
	 * Safely closes the connection to the underlying repository.
	 * 
	 * @param con
	 */
	private void closeConnection(RepositoryConnection con) {
		try {
			if (con != null) {
				con.close();
			}
			
		} catch (RepositoryException e) {
			logger.error("[{}] Failed to close connection to memory store.", moduleName, e);
		}
	}
}
