/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (C) 2012, 2013 Pyravlos Team
 *
 * http://www.strabon.di.uoa.gr/
 */
package server;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.util.ArrayList;
import java.util.List;

import javax.net.ssl.SSLContext;
import javax.net.ssl.X509TrustManager;

import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.client.utils.URIBuilder;
import org.apache.http.message.BasicNameValuePair;
import org.apache.xerces.impl.dv.util.Base64;
import org.openrdf.query.resultio.TupleQueryResultFormat;
import org.openrdf.query.resultio.stSPARQLQueryResultFormat;
import org.openrdf.rio.RDFFormat;

import eu.earthobservatory.org.StrabonEndpoint.client.EndpointResult;
import eu.earthobservatory.org.StrabonEndpoint.client.HTTPClient;


/**
 * This class is the implementation of a java client for accessing
 * SPARQLEndpoint instances.
 * 
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 * @author Kallirroi Dogani <kallirroi@di.uoa.gr
 * @author George Stamoulis <gstam@di.uoa.gr>
 */
public class GeneralSPARQLEndpoint extends HTTPClient{

	public GeneralSPARQLEndpoint(String host, int port) {
		super(host, port);
	}
	
	public GeneralSPARQLEndpoint(String host, int port, String endpointName) {
		super(host, port, endpointName);
	}
	
	
	/**
	 * Executes a SPARQL query on the Endpoint and get the results
	 * in the format specified by stSPARQLQueryResultFormat, which is
	 * an instance of class (or a subclass) {@link TupleQueryResultFormat}.   
	 * 
	 * According to the type of the SPARQL endpoint we add the required parameters
	 * in the http request.
	 * 
	 * @param sparqlQuery
	 * @param format
	 * @param endpointType
	 * @return
	 * @throws IOException
	 */
	public EndpointResult query(String sparqlQuery, stSPARQLQueryResultFormat format, String endpointType) throws IOException {
		assert(format != null);
		
		// create a method to execute
		
		String newUrl =  getConnectionURL();
		//String newUrl =  getConnectionURL().replace("http:", "https:");
		System.out.println(newUrl);
		
		HttpPost method = new HttpPost(getConnectionURL());
		HttpGet testMethod = new HttpGet(newUrl);

		// set the query parameter
		List<NameValuePair> params = new ArrayList<NameValuePair>();
		params.add(new BasicNameValuePair("query", sparqlQuery));
		params.add(new BasicNameValuePair("format", format.getDefaultMIMEType()));
		
		UrlEncodedFormEntity encodedEntity = new UrlEncodedFormEntity(params, Charset.forName("UTF-8"));
		method.setEntity(encodedEntity);
		try {
			URI uri = new URIBuilder(method.getURI())
				.addParameter("query", sparqlQuery)
				.addParameter("format", format.getDefaultMIMEType())
				.build();
				method.setURI(uri);	
		} catch (URISyntaxException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
		
		// set the content type
		method.setHeader("Content-Type", "application/x-www-form-urlencoded");
		testMethod.setHeader("Content-Type", "application/x-www-form-urlencoded");
		
		// set the accept format
		System.out.println(format.getDefaultMIMEType());
		method.addHeader("Accept", format.getDefaultMIMEType());	
		testMethod.addHeader("Accept", format.getDefaultMIMEType());	
		
		try {
			// response that will be filled next
			String responseBody = "";
			
			

			// execute the method - NO HTTPS supported
			HttpResponse response = hc.execute(method);


			int statusCode = response.getStatusLine().getStatusCode();
			System.out.println(statusCode);
			
			// If the response does not enclose an entity, there is no need
			// to worry about connection release
			HttpEntity entity = response.getEntity();
			if (entity != null) {
				InputStream instream = entity.getContent();
				try {

					BufferedReader reader = new BufferedReader(new InputStreamReader(instream));
					StringBuffer strBuf = new StringBuffer();
					
					// do something useful with the response
					String nextLine;
					while ((nextLine = reader.readLine()) != null) {
						strBuf.append(nextLine + "\n");
						//System.out.println(nextLine);
					}
					
					// remove last newline character
					if (strBuf.length() > 0) {
						strBuf.setLength(strBuf.length() - 1);
					}
					
					responseBody = strBuf.toString();
					System.out.println(responseBody);

				} catch (IOException ex) {
					// In case of an IOException the connection will be released
					// back to the connection manager automatically
					throw ex;

				} catch (RuntimeException ex) {
					// In case of an unexpected exception you may want to abort
					// the HTTP request in order to shut down the underlying
					// connection and release it back to the connection manager.
					method.abort();
					throw ex;

				} finally {
					// Closing the input stream will trigger connection release
					instream.close();
				}
			}
			 
			return new EndpointResult(statusCode, response.getStatusLine().getReasonPhrase(), responseBody);

		} catch (IOException e) {
			throw e;
			
		} finally {
			// release the connection.
			method.releaseConnection();
		}
	}

	
	/* Functions 'store' and 'update' do not follow the SPARQL Protocol.
	 * This means that only Strabon Endpoint supports these operations.
	 * In future they must be modified in order to be compatible with
	 * Virtuso and Parliament endpoints.
	 */
	
	
	/**
	 * Stores the RDF <code>data</code> which are in the RDF format
	 * <code>format</code> in the named graph specified by the URL
	 * <code>namedGraph</code>.
	 * 
	 * @param data 
	 * @param format
	 * @param namedGraph
	 * @return <code>true</code> if store was successful, <code>false</code> otherwise
	 * @throws IOException 
	 */
	public boolean store(String data, RDFFormat format, URL namedGraph) throws IOException {
		assert(format != null);
		
		// create a post method to execute
		HttpPost method = new HttpPost(getConnectionURL());
		
		// set the url and fromurl parameters
		List<NameValuePair> params = new ArrayList<NameValuePair>();
		params.add(new BasicNameValuePair("data", data));
		if (namedGraph!=null)
			params.add(new BasicNameValuePair("graph", namedGraph.toString()));
		UrlEncodedFormEntity encodedEntity = new UrlEncodedFormEntity(params, Charset.defaultCharset());
		method.setEntity(encodedEntity);
		
		// set the content type
		method.setHeader("Content-Type", "application/x-www-form-urlencoded");
		
		// set the accept format
		method.addHeader("Accept", format.getDefaultMIMEType());
		
		//set username and password
		if (getUser()!=null && getPassword()!=null){
			
			String userPass = getUser()+":"+ getPassword();
			String encoding = Base64.encode(userPass.getBytes());
			method.setHeader("Authorization", "Basic "+ encoding);
		}
		
		try {
			// response that will be filled next
		//	String responseBody = "";
			
			// execute the method
			HttpResponse response = hc.execute(method);
			int statusCode = response.getStatusLine().getStatusCode();
			
			if (statusCode==200)
				return true;
			else{
				System.err.println("Status code " + statusCode);
				return false;
			}
				
			

		} catch (IOException e) {
			throw e;
			
		} finally {
			// release the connection.
			method.releaseConnection();
		}
	}

	/**
	 * Stores the RDF data located at <code>data</code> which are in the
	 * RDF format <code>format</code> in the named graph specified by the
	 * URL <code>namedGraph</code>.
	 * 
	 * @param data
	 * @param format
	 * @param namedGraph
	 * @return <code>true</code> if store was successful, <code>false</code> otherwise
	 */


	/*
	 * Comment: in order to make queries to strabon endpoint we must create a SPARQLEndpoint
	 * with endpointName ".../Query". To store data to strabon endpoint the endpointName of
	 * SPARQLEndpoint must be something like ".../Store". This means that the same object of
	 * SPARQLEndpoint cannot execute store and query operations for strabon endpoints.
	 * This is wrong and must be fixed. Also, the main idea is that the SPARQLEndpoint client 
	 * should be a general endpoint client that supports strabon, virtuoso and parliament endpoints.
	 */
	public boolean store(URL data, RDFFormat format, URL namedGraph) throws IOException{
		
		assert(format != null);
		
		// create a post method to execute
		HttpPost method = new HttpPost(getConnectionURL());
		
		// set the url and fromurl parameters
		List<NameValuePair> params = new ArrayList<NameValuePair>();
		params.add(new BasicNameValuePair("url", data.toString()));
		params.add(new BasicNameValuePair("fromurl", ""));
		if (namedGraph!=null)
			params.add(new BasicNameValuePair("graph", namedGraph.toString()));
		UrlEncodedFormEntity encodedEntity = new UrlEncodedFormEntity(params, Charset.defaultCharset());
		method.setEntity(encodedEntity);
		
		// set the content type
		method.setHeader("Content-Type", "application/x-www-form-urlencoded");
		
		// set the accept format
		method.addHeader("Accept", format.getDefaultMIMEType());
		
		//set username and password
		if (getUser()!=null && getPassword()!=null){
			
			String userPass = getUser()+":"+ getPassword();
			String encoding = Base64.encode(userPass.getBytes());
			method.setHeader("Authorization", "Basic "+ encoding);
		}
		
		try {
			// response that will be filled next
		//	String responseBody = "";
			
			// execute the method
			HttpResponse response = hc.execute(method);
			int statusCode = response.getStatusLine().getStatusCode();
			
			if (statusCode==200)
				return true;
			else{
				System.err.println("Status code " + statusCode);
				return false;
			}
				
			

		} catch (IOException e) {
			throw e;
			
		} finally {
			// release the connection.
			method.releaseConnection();
		}
	}
		

	/**
	 * Executes the SPARQL Update query specified in <code>sparqlUpdate</code>.
	 * 
	 * @param sparqlUpdate
	 * @return <code>true</code> if store was successful, <code>false</code> otherwise
	 * @throws IOException 
	 */

	public boolean update(String sparqlUpdate) throws IOException {
		
		// create a post method to execute
		HttpPost method = new HttpPost(getConnectionURL());
		
		// set the query parameter
		List<NameValuePair> params = new ArrayList<NameValuePair>();
		params.add(new BasicNameValuePair("query", sparqlUpdate));
		UrlEncodedFormEntity encodedEntity = new UrlEncodedFormEntity(params, Charset.defaultCharset());
		method.setEntity(encodedEntity);
		
		// set the content type
		method.setHeader("Content-Type", "application/x-www-form-urlencoded");
		
		// set the accept format
		method.addHeader("Accept", "text/xml");
		
		//set username and password
		if (getUser()!=null && getPassword()!=null){
			
			String userPass = getUser()+":"+ getPassword();
			String encoding = Base64.encode(userPass.getBytes());
			method.setHeader("Authorization", "Basic "+ encoding);
		}
		
		try {
			// response that will be filled next
			
			// execute the method
			HttpResponse response = hc.execute(method);
			int statusCode = response.getStatusLine().getStatusCode();
			
			if (statusCode==200)
				return true;
			else{
				System.err.println("Status code " + statusCode);
				return false;
			}
				
			

		} catch (IOException e) {
			throw e;
			
		} finally {
			// release the connection.
			method.releaseConnection();
		}
		
	}

	public EndpointResult describe(String sparqlDescribe) {
		throw new UnsupportedOperationException();
	}

	public EndpointResult construct(String sparqlConstruct) {
		throw new UnsupportedOperationException();
	}
	
	public EndpointResult ask(String sparqlAsk) {
		throw new UnsupportedOperationException();
	}
	
	
	public static void main(String args[]) {
		if (args.length < 4) {
			System.err.println("Usage: eu.earthobservatory.org.StrabonEndpoint.client.SPARQLEndpoint <HOST> <PORT> <APPNAME> [<FORMAT>]");
			System.err.println("       where <HOST>       is the hostname of the Strabon Endpoint");
			System.err.println("             <PORT>       is the port to connect to on the host");
			System.err.println("             <APPNAME>    is the application name of Strabon Endpoint as deployed in the Tomcat container");
			System.err.println("             <QUERY>      is the query to execute on the endpoint");
			System.err.println("             [<FORMAT>]   is the format of your results. Should be one of XML (default), KML, KMZ, GeoJSON, TSV, or HTML.");
			System.exit(1);
		}
		
		String host = args[0];
		Integer port = new Integer(args[1]);
		String appName = args[2];
		String query = args[3];
		String format = "";
		String endpointType = "";
		
		if (args.length == 5) {
			format = args[4];
			
		} else {
			format = "XML";
		}
		
		GeneralSPARQLEndpoint endpoint = new GeneralSPARQLEndpoint(host, port, appName);
		
		try {
			EndpointResult result = endpoint.query(query, (stSPARQLQueryResultFormat) stSPARQLQueryResultFormat.valueOf(format), endpointType);
			
			System.out.println("Status code: " + result.getStatusCode());
			System.out.println("Status text: " + result.getStatusText());
			System.out.println("<----- Result ----->");
			System.out.println(result.getResponse().replaceAll("\n", "\n\t"));
			System.out.println("<----- Result ----->");
			
		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
