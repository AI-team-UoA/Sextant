/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (C) 2012, 2013, Pyravlos Team
 *
 * http://www.strabon.di.uoa.gr/
 */
package server;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.query.TupleQueryResultHandlerException;
import org.openrdf.query.resultio.QueryResultIO;
import org.openrdf.query.resultio.QueryResultParseException;
import org.openrdf.query.resultio.TupleQueryResultFormat;
import org.openrdf.query.resultio.UnsupportedQueryResultFormatException;
import org.openrdf.query.resultio.stSPARQLQueryResultFormat;
import org.openrdf.query.resultio.sparqlkml.stSPARQLResultsKMLWriter;

import org.openrdf.query.BindingSet;
import org.openrdf.query.Binding;
import org.openrdf.model.Literal;
import org.openrdf.sail.generaldb.model.XMLGSDatatypeUtil;


import eu.earthobservatory.org.StrabonEndpoint.client.EndpointResult;

/**
 * SpatialEndpoint is a SPARQLEndpoint which can store and 
 * query for spatial data. It also supports KML format for 
 * this kind of data.
 * 
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 * @author Kallirroi Dogani <kallirroi@di.uoa.gr>
 * @author George Stamoulis <gstam@di.uoa.gr>
 */
public class GeneralSpatialEndpoint extends GeneralSPARQLEndpoint {
	
	public GeneralSpatialEndpoint(String host, int port) {
		super(host, port);
	}
	
	public GeneralSpatialEndpoint(String host, int port, String endpointName) {
		super(host, port, endpointName);
	}
	
	public EndpointResult queryForKML(String sparqlQuery, String endpointType) throws IOException, QueryResultParseException, TupleQueryResultHandlerException, UnsupportedQueryResultFormatException, QueryEvaluationException{
		
		EndpointResult xmlResult = query(sparqlQuery, stSPARQLQueryResultFormat.XML, endpointType);
		
		if (xmlResult.getStatusCode() != 200) {
			throw new RuntimeException("Failed : HTTP error code : " + xmlResult.getStatusCode() + " " + xmlResult.getStatusText());
		}
		
		String xml = xmlResult.getResponse();
		System.out.println(xml);
		
		InputStream inputStream = new ByteArrayInputStream(xml.getBytes("UTF-8"));  
		TupleQueryResult results = QueryResultIO.parse(inputStream, TupleQueryResultFormat.SPARQL);
		
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		stSPARQLResultsKMLWriter kmlWriter = new stSPARQLResultsKMLWriter(outputStream);
			
		kmlWriter.startQueryResult(results.getBindingNames());
		
		while(results.hasNext()){
				BindingSet bs = results.next();				
				kmlWriter.handleSolution(bs);
		}	
					
		kmlWriter.endQueryResult();
		//System.out.println(outputStream.toString());

		EndpointResult kmlResult = new EndpointResult(xmlResult.getStatusCode(), xmlResult.getStatusText(), outputStream.toString());
		return kmlResult;
	}

}
