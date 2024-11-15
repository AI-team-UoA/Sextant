/**
 * IMORTANT: set eclipse encoding of files to UTF-8
 * 				(Eclipse.Preferences.General.Workspace.TextFileEncoding)
 */
package webServices;

import java.awt.image.BufferedImage;
import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.math.BigInteger;
import java.net.MalformedURLException;
import java.net.URL;
import java.net.URLConnection;
import java.net.URLEncoder;
import java.nio.charset.Charset;
import java.security.SecureRandom;
import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.util.Vector;
import java.util.regex.PatternSyntaxException;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.xml.bind.annotation.XmlRootElement;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.entity.UrlEncodedFormEntity;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.BasicNameValuePair;
import org.glassfish.jersey.media.multipart.FormDataContentDisposition;
import org.glassfish.jersey.media.multipart.FormDataParam;
import org.openrdf.model.Value;
import org.openrdf.query.Binding;
import org.openrdf.query.BindingSet;
import org.openrdf.query.QueryEvaluationException;
import org.openrdf.query.TupleQueryResult;
import org.openrdf.query.TupleQueryResultHandlerException;
import org.openrdf.query.resultio.QueryResultIO;
import org.openrdf.query.resultio.QueryResultParseException;
import org.openrdf.query.resultio.TupleQueryResultFormat;
import org.openrdf.query.resultio.UnsupportedQueryResultFormatException;
import org.openrdf.query.resultio.sparqlkml.stSPARQLResultsKMLWriter;
import org.openrdf.query.resultio.sparqlxml.stSPARQLXMLWriter;
import org.openrdf.sail.generaldb.model.XMLGSDatatypeUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.jsonldjava.core.JsonLdOptions;

import eu.earthobservatory.constants.GeoConstants;
import eu.earthobservatory.org.StrabonEndpoint.client.EndpointResult;
import eu.earthobservatory.org.StrabonEndpoint.client.SPARQLEndpoint;
import eu.earthobservatory.org.StrabonEndpoint.client.SpatialEndpoint;
import server.Chart;
import server.EndpointCommunicationException;
import server.GeneralSpatialEndpoint;
import server.KmlEditor;
import server.Layer;
import server.MapEndpointStore;
import server.MapMemoryStore;
import server.MapVocabulary;
import server.ServerConfiguration;
// import twitter4j.GeoLocation;
// import twitter4j.Query;
// import twitter4j.QueryResult;
// import twitter4j.Status;
// import twitter4j.Twitter;
// import twitter4j.TwitterException;
// import twitter4j.TwitterFactory;
// import twitter4j.conf.ConfigurationBuilder;
import webServices.RestServiceImpl.MyMap;

import javax.annotation.PostConstruct;
import javax.imageio.ImageIO;
import javax.imageio.stream.ImageInputStreamImpl;
import javax.servlet.ServletContext; 
import javax.servlet.ServletConfig;
import javax.servlet.http.HttpServletRequest;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Base64;


/**
 *
 * @author George Stamoulis <gstam@di.uoa.gr>
 */

@Path("/service")
public class RestServiceImpl {
	/****************************************************************************************************/
	private static final Logger logger = LoggerFactory.getLogger(webServices.RestServiceImpl.class);
	
	/** 
	 * The name of this class to be used in logging.
	 */
	private final static String moduleName = RestServiceImpl.class.getSimpleName();
	
	private static final String KML_FILE_EXT			= ".kml";
	private static final String GML_FILE_EXT			= ".gml";

	private String HTTP					= "http://";
	
	private static final String STORE_KMLFOLDER			= ServerConfiguration.getString("STORE_KMLFOLDER");
	private static final String MAPONTOLOGYFOLDER		= ServerConfiguration.getString("MAP_ONTOLOGY_FOLDER");
	private static final String MAPSFOLDER				= ServerConfiguration.getString("MAPS_FOLDER");
	private static final String STORE_FOLDER			= ServerConfiguration.getString("STORE_FOLDER");
	private static final String TMP_FOLDER				= ServerConfiguration.getString("TMP_FOLDER");
	private static final String GDAL_PATH				= ServerConfiguration.getString("GDAL");
	private static final String PROXY_STATUS			= ServerConfiguration.getString("PROXY_STATUS");
	private static final String PROXY_NAME				= ServerConfiguration.getString("PROXY_NAME");
	private static final String PROXY_PORT				= ServerConfiguration.getString("PROXY_PORT");
	private static final String BING_MAPS_KEY			= ServerConfiguration.getString("BING_MAPS_KEY");
		
	public static final String ENDPOINT_FAILURE_MSG	= "Error during communication with the SPARQL endpoint at ";
	
	public static final String CONSUMER_KEY				= ServerConfiguration.getString("CONSUMER_KEY");
	public static final String CONSUMER_SECRET			= ServerConfiguration.getString("CONSUMER_SECRET");
	public static final String ACCESS_TOKEN				= ServerConfiguration.getString("ACCESS_TOKEN");
	public static final String ACCESS_TOKEN_SECRET		= ServerConfiguration.getString("ACCESS_TOKEN_SECRET");
		
	/**
	 * The store keeping the RDF representation of the currently visible map
	 */
	private MapMemoryStore memoryStore = new MapMemoryStore();
	
	/**
	 * The registry that has all the maps
	 */
	private MapEndpointStore endpointStore = new MapEndpointStore();
	
	/**
	 * The name of the web application
	 */
	private static String webappName;
	
	// private ConfigurationBuilder cb = new ConfigurationBuilder();
	// private Twitter twitter;
	/****************************************************************************************************/
	
	@Context
    private ServletContext context;
	
	@Context
	private HttpServletRequest servlet;

	@PostConstruct
	public void init() {
		// get the context of the servlet   
    webappName = context.getServletContextName() + context.getContextPath() + "/";
    if (!webappName.startsWith("/")) {
      webappName = "/" + webappName;
    }
    
		//Check for HTTPS
		if (servlet.isSecure()) {
			HTTP = "https://";
		}

    //Layers' URLs format
    //HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath()             
        
    //System.out.println("********* servlet.getServerName(): "+servlet.getServerName());
    //System.out.println("********* servlet.getServerPort(): "+servlet.getServerPort());
        
    //System.out.println("********* servlet.getRemoteHost(): "+servlet.getRemoteHost());
    //System.out.println("********* servlet.getRemotePort(): "+servlet.getRemotePort());
        
    //System.out.println("********* context.getContextPath(): "+context.getContextPath());
        
      //   cb.setDebugEnabled(true)
		  // .setOAuthConsumerKey(CONSUMER_KEY)
		  // .setOAuthConsumerSecret(CONSUMER_SECRET)
		  // .setOAuthAccessToken(ACCESS_TOKEN)
		  // .setOAuthAccessTokenSecret(ACCESS_TOKEN_SECRET);
			
		//twitter = new TwitterFactory(cb.build()).getInstance();
	}
	
	@POST 
	@Path("/saveMap/{host}/{endpoint}/{title}/{creator}/{license}/{theme}/{description}/{port}/{user}/{pass}/{mapId}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
	public String saveMap(String mapInfo, 
			@PathParam("host") String host, @PathParam("endpoint") String endpoint, 
		    @PathParam("title") String title, @PathParam("creator") String creator, @PathParam("license") String license,
		    @PathParam("theme") String theme, @PathParam("description") String description, @PathParam("port") int port, 
		    @PathParam("user") String user, @PathParam("pass") String pass, 
		    @PathParam("mapId") String mapId) {
		
		DateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss");
		Date date = new Date();
		
		//Generate folders for map files
		File dir = new File(context.getRealPath("/") + MAPONTOLOGYFOLDER);  
		dir.mkdir();
		String filename = context.getRealPath("/") + MAPONTOLOGYFOLDER + title + "_map.nt";
		
		String layersInfo = mapInfo.substring(0, mapInfo.indexOf("@@@"));
		String geosparql = mapInfo.substring(mapInfo.indexOf("###")+3, mapInfo.indexOf("!!!"));
		String userAddedInfo = null;
		String chartsInfo = null;
		try {
			chartsInfo = mapInfo.substring(mapInfo.indexOf("@@@")+3, mapInfo.indexOf("###"));
			userAddedInfo = mapInfo.substring(mapInfo.indexOf("!!!")+3, mapInfo.length());
		}
		catch (IndexOutOfBoundsException e) {
			e.printStackTrace();
		}
		
		//Parse layers' information
		Vector<Layer> layers = parseLayersInfo(layersInfo);
		
		//Create new mapID or keep the existing one. Also add creation/modification date
		String mapID = mapId;
		String createDate;
		String modifyDate;
		
		if (mapId.equalsIgnoreCase("empty")) {
			mapID = createNewMapId();
			createDate = dateFormat.format(date);
			modifyDate = dateFormat.format(date);
		}
		else {
			//Get create day from query and set modify date
			try {
				createDate = endpointStore.getMapCreateDate(mapID, host, endpoint, port);
				if (createDate.equalsIgnoreCase("none")) {
					createDate = dateFormat.format(date);
				}
			} catch (EndpointCommunicationException e) {
				e.printStackTrace();
				createDate = dateFormat.format(date);
			}
			
			modifyDate = dateFormat.format(date);
		}
				
		memoryStore.setMapID(mapID);

		//Save each layer
		for (int i=0; i<layers.size(); i++) {
			memoryStore.saveLayer(i, layers.get(i).getQueryText(), layers.get(i).getUri(), 
					layers.get(i).getName(), layers.get(i).getEndpoint(), 
					layers.get(i).getFillColor(), layers.get(i).getStrokeColor(), 
					layers.get(i).getIconUri(), layers.get(i).getIconSize(), 
					layers.get(i).getIsTemp(), layers.get(i).getImageBox(), layers.get(i).getType(),
					title, creator, license, theme, createDate, modifyDate, geosparql, description);			
		}
		
		//Parse charts' information
		if (chartsInfo != null) {
			Vector<Chart> charts = parseChartsInfo(chartsInfo);
			for (int i=0; i<charts.size(); i++) {
				memoryStore.saveChart(i, charts.get(i).getQuery(), charts.get(i).getEndpoint(), charts.get(i).getType(), charts.get(i).getMeasures(), charts.get(i).getFreeDims(), charts.get(i).getInstances());
			}
		}
		
		//Create user added information KML file
		if (userAddedInfo != null) {
			// generate folder for kml files
			dir = new File(context.getRealPath("/") + STORE_FOLDER);  
			dir.mkdir();
			
			try {
				PrintWriter out = new PrintWriter(context.getRealPath("/") + STORE_FOLDER + mapID + "userInfo.kml");
				out.println(userAddedInfo);
				out.close();
			} catch (FileNotFoundException e) {
				e.printStackTrace();
			}
		}
		
		memoryStore.storeFileToDisk(filename);

		endpointStore.saveMapToEndpoint(filename, mapID, host, endpoint, port, user, pass);
		
		return mapID + "," + host + "/" + endpoint + "," + createDate + "," + modifyDate;
	}

	@GET 
	@Path("/mapLayersInfo/{id}/{host}/{endpoint}/{qType}/{port}")
    @Produces(MediaType.APPLICATION_XML)
    public List<MapInfo> getMapLayers(@PathParam("id") String id, @PathParam("host") String host, 
    		@PathParam("endpoint") String endpoint, @PathParam("qType") String qType, @PathParam("port") int port) throws EndpointCommunicationException{		
		
		//Reset to default registry values
		endpointStore = new MapEndpointStore();
		
		//Get host info if the map is not saved in Registry
		if (!host.equalsIgnoreCase("none")) {
			endpointStore.setEndpointQuery(host, port, endpoint + "/" + qType);
		}
		
		//query registry to get the layers of the map with the specific id
		Vector<Vector<String>> results = endpointStore.openMapFromLink(id);
		
		int chartPosition = -1;
		
		//Pose queries to endpoints to get the KML files
		for (int i=0; i<results.size(); i++) {
			Vector<String> temp = results.get(i);
			
			//End this loop at chart info separator
			if (temp.get(0).equalsIgnoreCase("@@@")) {
				chartPosition = i+1;
				break;
			}
			
			String kmlFile = null;
			String hostName = null;
			String endpointName = null;
			String[] parts = null;
			String[] hostArr = null;
			
			//If an endpointURI exists, get the host and the name of it			
			if (temp.get(3) != null) {
				parts = temp.get(3).split("/");
				hostName = parts[2];
				port = 80;
				hostArr = hostName.split(":");
				if (hostArr.length > 1) {
					port = Integer.parseInt(hostArr[1]);
				}
				
				endpointName = "";
				for (int b=3; b<parts.length-1; b++) {
					//endpointName = parts[3] + "/" + parts[4];	
					endpointName += parts[b] + "/";
				}
				endpointName += parts[parts.length-1];
			}

			/**
			 * Query the respective endpoint to get the .kml file
			 */
			if (parts != null && temp.get(1) != null) {
				if (!hostName.equalsIgnoreCase("data.ordnancesurvey.co.uk")) {
					//Strabon endpoint
					try {
						//System.out.println("*** Query: " + temp.get(1));
						//System.out.println("*** LayerName: " + temp.get(0));
						//System.out.println("*** Host: " + hostName);
						//System.out.println("*** Port: " + port);
						//System.out.println("*** EndpointName: " + endpointName);
						kmlFile = passQuery(temp.get(1), temp.get(0), hostName, port, endpointName);
						//kmlFile = passQuery(query, name, host, port, endpointName.replaceAll("@@@", "/"));

					}
					catch (RuntimeException e) {
						e.printStackTrace();
					}
				}
				else {
					//Ordnance Survey SPARQL endpoint
					try {
						kmlFile = passQueryOS(temp.get(1), temp.get(0));
					}
					catch (RuntimeException e) {
	
					} catch (QueryResultParseException e) {
						e.printStackTrace();
					} catch (TupleQueryResultHandlerException e) {
						e.printStackTrace();
					} catch (QueryEvaluationException e) {
						e.printStackTrace();
					} catch (IOException e) {
						e.printStackTrace();
					}
				}
									
				temp.set(2, kmlFile);
				results.set(i, temp);
				
			}
		}
		
		//Wrap the results 
		ArrayList<MapInfo> mapInformation = new ArrayList<MapInfo>(); 
					
		for (int i=0; i<results.size(); i++) {
			MapInfo info = new MapInfo();
					
			Vector<String> temp = results.get(i);
			//End this loop at chart info separator
			if (temp.get(0).equalsIgnoreCase("@@@")) {
				break;
			}
					
			info.init(temp);
			mapInformation.add(info);				
		}
		
		//Pose queries to endpoints to get chart results and wrap results
		if (chartPosition != -1) {
			for (int i=chartPosition; i<results.size(); i++) {
				Vector<String> temp = results.get(i);
				
				String hostName = null;
				String endpointName = "";
				String[] parts = null;
				String[] hostArr = null;
				
				//Get the host and the name of the endpoint		
				parts = temp.get(3).split("/");
				hostName = parts[2];
				port = 80;
				hostArr = hostName.split(":");
				if (hostArr.length > 1) {
					port = Integer.parseInt(hostArr[1]);
				}
				
				for (int j=3; j<parts.length-1; j++) {
					endpointName = endpointName.concat(parts[j]);	
					endpointName = endpointName.concat("/");
				}
				endpointName = endpointName.concat(parts[parts.length-1]);
				
				Vector<String> resultsChart = new Vector<String>();
				String format = "";
				
				resultsChart = endpointStore.getDataForChart(hostName, endpointName, port, temp.get(2));
				
				for(int j=0; j<resultsChart.size(); j++) {
					format = format.concat(resultsChart.get(j));
					format = format.concat("$");
				}
				
				MapInfo info = new MapInfo("chart", temp.get(2), temp.get(3), temp.get(1), format, temp.get(4), temp.get(5), temp.get(6));
				mapInformation.add(info);
			}			
		}	
				
		return mapInformation;
    }
	
	@GET 
	@Path("/mapInformation/{id}/{host}/{endpoint}/{qType}/{port}")
    @Produces(MediaType.TEXT_PLAIN)
    public String getMapInformation(@PathParam("id") String id, @PathParam("host") String host, 
    		@PathParam("endpoint") String endpoint, @PathParam("qType") String qType, @PathParam("port") int port) throws EndpointCommunicationException{		
		
		//Reset to default registry values
		endpointStore = new MapEndpointStore();
		
		//Get host info if the map is not saved in Registry
		if (!host.equalsIgnoreCase("none")) {
			endpointStore.setEndpointQuery(host, port, endpoint + "/" + qType);
		}
		
		//query registry to get the layers of the map with the specific id
		Vector<String> results = endpointStore.getMapInformation(id);
		String format = "";
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}
		
		//Add the application host to the results, for user feature loading
		if (PROXY_STATUS.equalsIgnoreCase("on")) {
			format = format.concat(HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + STORE_FOLDER);
		}
		else {
			format = format.concat(HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + STORE_FOLDER);
		}
		format = format.concat("$");
		
		return format;		
	}
	
	@POST 
	@Path("/endpoint/{host}/{endpointName}/{name}/{port}/{tempLayer}")
	@Consumes({MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.APPLICATION_JSON})
    public String getQueryResult(String query, 
    		@PathParam("host") String host, @PathParam("endpointName") String endpointName, 
    		@PathParam("name") String name, @PathParam("port") int port, 
    		@PathParam("tempLayer") String tempLayer) {		
		String kmlFile = null;
		String results = null;

		try {
			System.out.println("*** Query: " + query);
			//System.out.println("*** LayerName: " + name);
			System.out.println("*** Host: " + host);
			//System.out.println("*** Port: " + port);
			//System.out.println("*** EndpointName: " + endpointName.replaceAll("@@@", "/"));
			kmlFile = passQuery(query, name, host, port, endpointName.replaceAll("@@@", "/"));
		}
		catch (RuntimeException e) {

		}
		
		if (kmlFile == null) {
			kmlFile = "null";
		}
		results = kmlFile;
		results = results.concat("$").concat(query);
		results = results.concat("$").concat(name);
		results = results.concat("$").concat(host);
		results = results.concat("$").concat(endpointName.replaceAll("@@@", "/"));
		results = results.concat("$").concat(tempLayer);

		return results;
	}
	
	@POST 
	@Path("/endpoint/OS/{name}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.APPLICATION_JSON})
    public String getOSResult(String query, @PathParam("name") String name) {	
		String kmlFile = null;
		String results = null;
		
	    //Get KML file from: http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql
		try {
			try {
				kmlFile = passQueryOS(query, name);
			} catch (QueryResultParseException e) {
				e.printStackTrace();
			} catch (TupleQueryResultHandlerException e) {
				e.printStackTrace();
			} catch (UnsupportedQueryResultFormatException e) {
				e.printStackTrace();
			} catch (QueryEvaluationException e) {
				e.printStackTrace();
			}
		} catch (IOException e) {

		}
			
		results = kmlFile;
		results = results.concat("$").concat(query);
		results = results.concat("$").concat(name);
		
		return results;
	}
	
	@POST 
	@Path("/loadFile/{name}/{type}")
	@Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces({MediaType.TEXT_PLAIN})
    public String loadFile(@FormDataParam("uploadfile") InputStream fileInputStream,
    						@FormDataParam("uploadfile") FormDataContentDisposition contentDispositionHeader, 
    						@PathParam("name") String name,
    						@PathParam("type") String type) {	
		
		String fileURI = null;
		String fileType = "";
		if (!type.equalsIgnoreCase("geotiff")) {
			fileType = fileType.concat("."+type);
		}
		
		// generate folder for kml files
		File dir = new File(context.getRealPath("/") + STORE_FOLDER);  
		dir.mkdir();	
		
		OutputStream out = null;
		try{
			out = new FileOutputStream(new File(context.getRealPath("/") + STORE_FOLDER + name + fileType));
			int read = 0;
			byte[] bytes = new byte[1024];
			while ((read = fileInputStream.read(bytes)) != -1) {
				out.write(bytes, 0, read);
			}

			if (PROXY_STATUS.equalsIgnoreCase("on")) {
				fileURI = HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + STORE_FOLDER + name + fileType;
			}
			else {
				fileURI = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + STORE_FOLDER + name + fileType;				
			}
		}
		catch (IOException e) {
			e.printStackTrace();
		}
		finally {
		    try {
				out.close();
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
	
		return fileURI;
	}
	
	@POST 
	@Path("/createFile/{name}/{type}")
	@Consumes({MediaType.TEXT_PLAIN})
    @Produces({MediaType.TEXT_PLAIN})
    public String createFile(String data, 
    						@PathParam("name") String name,
    						@PathParam("type") String type) {	
		
		String fileURI = null;
		String fileType = "";
		fileType = fileType.concat("."+type);
		//System.out.println(data);
		
		// generate folder for kml files
		File dir = new File(context.getRealPath("/") + STORE_FOLDER);  
		dir.mkdir();	
		
		PrintWriter out = null;
		try{
			out = new PrintWriter(new File(context.getRealPath("/") + STORE_FOLDER + name + fileType));
			out.println(data);

			if (PROXY_STATUS.equalsIgnoreCase("on")) {
				fileURI = HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + STORE_FOLDER + name + fileType;
			}
			else {
				fileURI = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + STORE_FOLDER + name + fileType;				
			}
		}
		catch (IOException e) {
			e.printStackTrace();
		}
		finally {
			out.close();
		}
	
		return fileURI;
	}
	
	@POST
	@Path("/downloadFile/")
	@Consumes({MediaType.TEXT_PLAIN})
	@Produces({MediaType.TEXT_PLAIN})
	public String startDownload(String aurl){
    	int count;
    	String outName = null;
    	
    	// generate folder for kml files
    	File dir = new File(context.getRealPath("/") + STORE_FOLDER);  
    	dir.mkdir();
    	
		try {
			String fileName = aurl.substring(aurl.lastIndexOf('/') + 1);
			if (PROXY_STATUS.equalsIgnoreCase("on")) {
				outName = HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + STORE_FOLDER + fileName;
			}
			else {
				outName = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + STORE_FOLDER + fileName;				
			}
			
			URL url = new URL(aurl);
			URLConnection conexion = url.openConnection();
			conexion.connect();

			InputStream input = new BufferedInputStream(url.openStream());			
			OutputStream output = new FileOutputStream(new File(context.getRealPath("/") + STORE_FOLDER + fileName));		
			
			byte data[] = new byte[1024];

			while ((count = input.read(data)) != -1) {
				output.write(data, 0, count);
			}

			output.flush();
			output.close();
			input.close();
		} catch (Exception e) {}

		return (outName);
    }
	
	@POST 
	@Path("/endpoint/queries/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getQueries( @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		results = endpointStore.getQueriesText(host, endpoint.replaceAll("@@@", "/"), port);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format;		
	}
	
	@POST 
	@Path("/endpoint/explore/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getExploreClasses( @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		results = endpointStore.getExploreClasses(host, endpoint.replaceAll("@@@", "/"), port);
		System.out.println("Returned------");
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}
		System.out.println("Ending------");
		return format;		
	}
	
	@POST 
	@Path("/endpoint/explore/properties/{host}/{endpoint}/{port}")
	@Consumes({MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getExploreProperties(String classURI, @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = classURI+"$";
		results = endpointStore.getExploreProperties(host, endpoint.replaceAll("@@@", "/"), port, classURI);
		
		if (results != null) {
			for(int i=0; i<results.size(); i++) {
				format = format.concat(results.get(i));
				format = format.concat("$");
			}
		}
		
		return format;		
	}
	
	@POST 
	@Path("/endpoint/discover/{host}/{endpoint}/{port}")
	@Consumes({MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getExploreDescribe(String classURI, @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		results = endpointStore.getExploreDescribe(host, endpoint.replaceAll("@@@", "/"), port, classURI);
		
		if (results != null) {
			for(int i=0; i<results.size(); i++) {
				format = format.concat(results.get(i));
				format = format.concat("$");
			}
		}
		
		return format;		
	}
	
	@POST 
	@Path("/endpoint/charts/dimensions/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getDimensions( @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		
		results = endpointStore.getDimensionsNames(host, endpoint.replaceAll("@@@", "/"), port);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format;		
	}
	
@POST
	@Path("/geoqa/")
	@Consumes({ MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
	@Produces(MediaType.TEXT_PLAIN)
	public String getGeoQAResponse(String question) throws EndpointCommunicationException {

		String qaResponse = new String("Error in request");
		System.out.println("The question is:" + question);

		try {
			
			// Construct the URL with query parameters
			StringBuilder stringBuilder = new StringBuilder("http://195.134.71.116:12345/sextant-qa?question=");
			stringBuilder.append(URLEncoder.encode(question, "UTF-8"));
			System.out.println(stringBuilder.toString());

			URL url = new URL(stringBuilder.toString());
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();

			// Set up the request properties
			connection.setRequestMethod("GET");
			String username = "user";
			String password = "omn1ss1@h";
			String auth = username + ":" + password;
			String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
			connection.setRequestProperty("Authorization", "Basic " + encodedAuth);

			// Check the response code
			int responseCode = connection.getResponseCode();
			if (responseCode == HttpURLConnection.HTTP_OK) { // success
				// Read the response
				BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				String inputLine;
				StringBuilder response = new StringBuilder();

				while ((inputLine = in.readLine()) != null) {
					response.append(inputLine);
				}
				in.close();

				// Print the response
				System.out.println(response.toString());
				qaResponse = response.toString();

			} else {
				// Handle error
				System.out.println("GET request failed. Response Code: " + responseCode);
				qaResponse = "GET request failed. Response Code: " + responseCode;
			}

			// Disconnect the connection
			connection.disconnect();
		} catch (Exception e) {
			e.printStackTrace();
		}

		
		return qaResponse;
	}

	@POST
	@Path("/geoqa/layer/")
	@Consumes({ MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
	@Produces(MediaType.TEXT_PLAIN)
	public String getGeoQASPARQLResponse(String query) throws EndpointCommunicationException {

		String sparqlResponse = new String("Error in request");
		String kmlFile = null;
		System.out.println("The query is:\n" + query);

		try {
			
			// Construct the URL with query parameters
			StringBuilder stringBuilder = new StringBuilder("http://195.134.71.116:7200/repositories/pnyqa_kg?query=");
			stringBuilder.append(URLEncoder.encode(query, "UTF-8"));
			System.out.println(stringBuilder.toString());

			URL url = new URL(stringBuilder.toString());
			HttpURLConnection connection = (HttpURLConnection) url.openConnection();
			connection.setRequestProperty("Accept", "application/sparql-results+json");

			// Set up the request properties
			connection.setRequestMethod("GET");
			String username = "user";
			String password = "omn1ss1@h";
			String auth = username + ":" + password;
			String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
			connection.setRequestProperty("Authorization", "Basic " + encodedAuth);

			// Check the response code
			int responseCode = connection.getResponseCode();
			if (responseCode == HttpURLConnection.HTTP_OK) { // success
				// Read the response
				BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()));
				String inputLine;
				StringBuilder response = new StringBuilder();

				while ((inputLine = in.readLine()) != null) {
					response.append(inputLine);
				}
				in.close();

				// Print the response
				//System.out.println(response.toString());
				sparqlResponse = response.toString();

			} else {
				// Handle error
				System.out.println("GET request failed. Response Code: " + responseCode);
				sparqlResponse = "GET request failed. Response Code: " + responseCode;
			}

			// Disconnect the connection
			connection.disconnect();
		} catch (Exception e) {
			e.printStackTrace();
		}

		
		return sparqlResponse;
	}

	public class MyMap {
		public String id;
		public String type;
	    public String title;
	    public String creator;
	    public String license;
	    public String theme;
	    public String description;
	    public String landingPage;
	    public Extent spatial;
	    public Vector<Distribution> distributions;

	    public MyMap() {}

	    public MyMap(String url, String title, String creator, String license, String theme, String description, Extent extent, Vector<Distribution> ds) {
	    	this.id = url;
	    	this.type = "Dataset";
	    	this.title = title;
	    	this.creator = creator;
	    	this.license = license;
	    	this.theme = theme;
	    	this.description = description;
	    	this.landingPage = url;
	    	this.spatial = extent;
	    	this.distributions = ds;
	    }
	}
	
	public class Extent {
		public String type;
		public String geometry;
		
		public Extent() {}
		
		public Extent(String type, String geometry) {
			this.type = type;
			
			String[] parse=geometry.replace("POLYGON((", "").replace("))", "").replace(", ", ",").split(",");
			String lonLatGeom = "POLYGON((";
			for (int i=0; i<parse.length; i++) {
				String[] latLon = parse[i].split(" ");
				lonLatGeom += latLon[1]+" "+latLon[0];
				if (i!=parse.length-1) {
					lonLatGeom += ", ";
				}
			}
			lonLatGeom += "))";

			this.geometry = lonLatGeom;
		}
	}
	
	public class Distribution {
		public String type;
		public String title;
		public String accessURL;
		public String mediaType;
		
		public Distribution() {}
		
		public Distribution(String type, String title, String url) {
			this.type = type;
			this.title = title;
			this.accessURL = url;
			this.mediaType = "text/html";
		}
	}
	
	public class Maps {
		public String context;
		public String type;
		public String title;
		public Vector<MyMap> datasets;
		
		public Maps() {}
		
		public Maps(Vector<MyMap> maps, String appURL) {
			this.context = "https://raw.githubusercontent.com/zefyros/Sextant/master/context.jsonld";
			this.type = "Catalog";
			this.title = "Sextant Maps";
			this.datasets = maps;			
		}
		
	}
	
	@GET
	@Path("/requestMaps")
	@Produces({MediaType.APPLICATION_JSON})
    public Response requestMaps(@QueryParam("title") String title, @QueryParam("creator") String creator,
    						  @QueryParam("license") String license, @QueryParam("theme") String theme,
    						  @QueryParam("extent") String extent) throws EndpointCommunicationException, JsonProcessingException {	
		
		String mapURL = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "?mapid=";
		
		Vector<MyMap> mapResults = new Vector<MyMap>();
		
		//Reset to default registry values
		endpointStore = new MapEndpointStore();
				
		//Construct query
		String query = "PREFIX strdf: <http://strdf.di.uoa.gr/ontology#> " +
					   "PREFIX geof: <http://www.opengis.net/def/function/geosparql/> " +
					   "SELECT ?mapId ?title ?creator ?license ?theme ?description ?geom WHERE { " +
					   "?mapId <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + MapVocabulary.MAP + ">  . " +
					   "?mapId <" + MapVocabulary.HASTITLE + "> ?title . " +
					   "?mapId <" + MapVocabulary.HASCREATOR + "> ?creator . " +
					   "?mapId <" + MapVocabulary.HASLICENSE + "> ?license . " +
					   "?mapId <" + MapVocabulary.HASTHEME + "> ?theme . " +
					   "?mapId <" + MapVocabulary.HASDESCRIPTION + "> ?description . " +
					   "?mapId <" + MapVocabulary.HASGEOMETRY + "> ?geom . ";
		
		if (title != null) {
			query = query.concat("FILTER regex(?title, \"" + title + "\", \"i\") . ");
		}
		if (creator != null) {
			query = query.concat("FILTER regex(?creator, \"" + creator + "\", \"i\") . ");
		}
		if (license != null) {
			query = query.concat("FILTER regex(?license, \"" + license + "\", \"i\") . ");
		}
		if (theme != null) {
			query = query.concat("FILTER regex(?theme, \"" + theme + "\", \"i\") . ");
		}
		if (extent != null) {
			String wkt = extentToWKT(extent);
			System.out.println(wkt);
			query = query.concat("FILTER (strdf:mbbIntersects(?geom, \"" + wkt + "\"^^<http://www.opengis.net/ont/geosparql#wktLiteral>)) . ");
		}
		query = query.concat("}");
		
		//Pose query
		Vector<String> results = endpointStore.searchForMaps(query);
		
		//Parse results
		for (int i=0; i<results.size(); i=i+7) {
			Vector<Distribution> ds = new Vector<Distribution>();
			ds.add(new Distribution("Distribution", "Sextant", mapURL.concat(results.get(i).substring(results.get(i).lastIndexOf("/")+1))));
			
			MyMap tempMap = new MyMap(mapURL.concat(results.get(i).substring(results.get(i).lastIndexOf("/")+1, results.get(i).length())), results.get(i+1), results.get(i+2), results.get(i+3), results.get(i+4), results.get(i+5), new Extent("Location", results.get(i+6).substring(results.get(i+6).indexOf("POLYGON"), results.get(i+6).length())), ds);
			mapResults.add(tempMap);			
		}	
		
		ObjectMapper mapper = new ObjectMapper();
	
		String output = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(new Maps(mapResults, HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath()));
		output = output.replaceAll("\"context\"", "\"@context\"");
		output = output.replaceAll("\"type\"", "\"@type\"");
		output = output.replaceAll("\"id\"", "\"@id\"");
				
		return Response.ok().entity(output).header("Access-Control-Allow-Origin", "*").header("Access-Control-Allow-Methods", "GET").build();		
	}
	
	public String extentToWKT(String extent) {
		extent = extent.replace("[", "").replace("]", "").replace(" ", "");
		String[] parse = extent.split(",");
		String minx = parse[0];
		String miny = parse[1];
		String maxx = parse[2];
		String maxy = parse[3];
		
		return "<http://www.opengis.net/def/crs/EPSG/0/4326> POLYGON(("+
			   minx + " " + miny + ", " +
			   maxx + " " + miny + ", " +
			   maxx + " " + maxy + ", " +
			   minx + " " + maxy + ", " +
			   minx + " " + miny + "))";
	}
	
	public String wktToExtent(String wkt) {
		Vector<Double> allX = new Vector<Double>();
		Vector<Double> allY = new Vector<Double>();
		
		wkt = wkt.substring(wkt.indexOf("((")+2, wkt.indexOf("))"));
		
		String[] parse = wkt.split(", ");
		
		try {
			for (int i=0; i<parse.length; i++) {
				String[] getXY = parse[i].split(" ");
				allX.add(Double.parseDouble(getXY[0]));
				allY.add(Double.parseDouble(getXY[1]));
			}
			
			return "[" + Collections.min(allX).toString() + ", " +
				         Collections.min(allY).toString() + ", " +
				         Collections.max(allX).toString() + ", " +
				         Collections.max(allY).toString() + "]";
		}
		catch (NumberFormatException e) {
			return "[-180.0, -90.0, 180.0, 90.0]";
		}		
	}
	
	public class TwitterResults {
		public String twitterIds;
		public long sinceId;
		public long maxId;
		
		TwitterResults (String twitterIds, long sinceId, long maxId) {
			this.twitterIds = twitterIds;
			this.sinceId = sinceId;
			this.maxId = maxId;
		}
	}
	
	// @GET
	// @Path("/findTwittsRest")
	// @Produces({MediaType.TEXT_PLAIN})
  //   public String twitterSearchRest(@QueryParam("keys") String searchKeys, 
  //   								@QueryParam("sinceId") long sinceId,
  //   								@QueryParam("maxId") long maxId,
  //   								@QueryParam("update") boolean update,
  //   								@QueryParam("location") String location) {
		
	// 	final Vector<String> results = new Vector<String>();  
	// 	String output = "";
	// 	long higherStatusId = Long.MIN_VALUE;
	// 	long lowerStatusId = Long.MAX_VALUE;
		
  //       Query searchQuery = new Query(searchKeys);
  //       searchQuery.setCount(50);
  //       searchQuery.setResultType(Query.ResultType.recent);
        
  //       if (sinceId != 0) {
  //       	if (update) {
  //           	searchQuery.setSinceId(sinceId);
  //       	}
  //       	higherStatusId = sinceId;
  //       }
  //       if (maxId != 0) {
  //       	if (!update) {
  //           	searchQuery.setMaxId(maxId); 
  //       	}
  //       	lowerStatusId = maxId;
  //       }  
  //       if (location != null) {
  //       	double lat = Double.parseDouble(location.substring(0, location.indexOf(",")));
  //       	double lon = Double.parseDouble(location.substring(location.indexOf(",")+1, location.length()));
        	
  //       	searchQuery.setGeoCode(new GeoLocation(lat, lon), 10, Query.KILOMETERS);
  //       }
         
  //       try {
  //       	QueryResult qResult = twitter.search(searchQuery);
        	
	// 		for (Status status : qResult.getTweets()) {
	// 	        //System.out.println(Long.toString(status.getId())+"  ***  "+Long.toString(status.getUser().getId())+"  ***  "+status.isRetweet()+"  ***  "+status.isRetweeted());
		        
	// 	        higherStatusId = Math.max(status.getId(), higherStatusId);
	// 	        lowerStatusId = Math.min(status.getId(), lowerStatusId);
		        
	// 	        if (!status.isRetweet()) {
	// 	        	if (status.getGeoLocation() != null) {
	// 	        		System.out.println(Long.toString(status.getId())+"@"+Double.toString(status.getGeoLocation().getLatitude())+","+Double.toString(status.getGeoLocation().getLongitude()));		        				        		
	// 	        		results.add(Long.toString(status.getId())+
	// 	        					"@"+Double.toString(status.getGeoLocation().getLatitude())+
	// 	        					","+Double.toString(status.getGeoLocation().getLongitude()));
	// 	        	}
	// 	        	else {
	// 	        		results.add(Long.toString(status.getId())+"@null");
	// 	        	}
	// 	        }
	// 	    }
			
	// 	} catch (TwitterException e1) {
	// 		// TODO Auto-generated catch block
	// 		e1.printStackTrace();
	// 	}
        
  //       TwitterResults resultsObj = new TwitterResults(results.toString(), higherStatusId, lowerStatusId);
  //       ObjectMapper mapper = new ObjectMapper();
	// 	try {
	// 		output = mapper.writerWithDefaultPrettyPrinter().writeValueAsString(resultsObj);
	// 	} catch (JsonProcessingException e) {
	// 		// TODO Auto-generated catch block
	// 		e.printStackTrace();
	// 	}
        
  //       return output;		
	// }
	
	@GET
	@Path("/bingKey")
	@Produces({MediaType.TEXT_PLAIN})
    public String getBingMapsHey() {		
		return BING_MAPS_KEY;		
	}
	
	@POST 
	@Path("/endpoint/charts/instances/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getInstances( String data, @PathParam("host") String host, @PathParam("endpoint") String endpoint, 
    							@PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		String fixedDim = data.substring(0, data.indexOf("$"));
		String fixedType = data.substring(data.indexOf("$")+1, data.length());
		
		results = endpointStore.getInstancesNames(host, endpoint.replaceAll("@@@", "/"), port, fixedDim, fixedType);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format.concat(fixedType);		
	}
	
	@POST 
	@Path("/endpoint/charts/measurements/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getMeasurements(@PathParam("host") String host, @PathParam("endpoint") String endpoint, 
    							@PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		
		results = endpointStore.getMeasureProperties(host, endpoint.replaceAll("@@@", "/"), port);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format;		
	}
	
	@POST 
	@Path("/endpoint/charts/staticQuery/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getStaticQuery(@PathParam("host") String host, @PathParam("endpoint") String endpoint, 
    							@PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		
		results = endpointStore.getStaticPart(host, endpoint.replaceAll("@@@", "/"), port);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format;		
	}
	
	@POST 
	@Path("/endpoint/charts/finalQuery/{host}/{endpoint}/{port}")
	@Consumes({MediaType.TEXT_PLAIN, MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String getChartData(String query, @PathParam("host") String host, @PathParam("endpoint") String endpoint, 
    							@PathParam("port") int port) throws EndpointCommunicationException {	
		Vector<String> results = new Vector<String>();
		String format = "";
		
		results = endpointStore.getDataForChart(host, endpoint.replaceAll("@@@", "/"), port, query);
		
		for(int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}

		return format;		
	}
	
	@POST 
	@Path("/mapSearch/{host}/{endpoint}/{port}")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String mapSearchQuery(String inputData, @PathParam("host") String host, @PathParam("endpoint") String endpoint, @PathParam("port") int port) throws EndpointCommunicationException {	
		String format = "";
		String[] parser = inputData.split("\\$");
		String title = parser[0];
		String creator = parser[1];
		String license = parser[2];
		String theme = parser[3];
		String extent = parser[4];
		
		//Reset to default registry values
		endpointStore = new MapEndpointStore();
				
		//Get host info if the map is not saved in Registry
		if (!host.equalsIgnoreCase("registry")) {
			endpointStore.setEndpointQuery(host, port, endpoint + "/Query");
		}
				
		//Construct query
		String query = "PREFIX strdf: <http://strdf.di.uoa.gr/ontology#> " +
				       "PREFIX geof: <http://www.opengis.net/def/function/geosparql/> " +
					   "SELECT ?mapId ?title ?creator ?license ?theme ?description WHERE { " +
					   "?mapId <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <" + MapVocabulary.MAP + ">  . " +
					   "?mapId <" + MapVocabulary.HASTITLE + "> ?title . " +
					   "?mapId <" + MapVocabulary.HASCREATOR + "> ?creator . " +
					   "?mapId <" + MapVocabulary.HASLICENSE + "> ?license . " +
					   "?mapId <" + MapVocabulary.HASTHEME + "> ?theme . " +
					   "?mapId <" + MapVocabulary.HASDESCRIPTION + "> ?description . " +
					   "?mapId <" + MapVocabulary.HASGEOMETRY + "> ?geom . ";
		
		if (!title.equalsIgnoreCase("none")) {
			query = query.concat("FILTER regex(?title, \"" + title + "\", \"i\") . ");
		}
		if (!creator.equalsIgnoreCase("none")) {
			query = query.concat("FILTER regex(?creator, \"" + creator + "\", \"i\") . ");
		}
		if (!license.equalsIgnoreCase("none")) {
			query = query.concat("FILTER regex(?license, \"" + license + "\", \"i\") . ");
		}
		if (!theme.equalsIgnoreCase("none")) {
			query = query.concat("FILTER regex(?theme, \"" + theme + "\", \"i\") . ");
		}
		if (!extent.equalsIgnoreCase("none")) {
			query = query.concat("FILTER (strdf:mbbIntersects(?geom, \"" + extent + "\"^^<http://www.opengis.net/ont/geosparql#wktLiteral>)) . ");
		}
		query = query.concat("}");
		System.out.println(query);
		
		//Pose query
		Vector<String> results = endpointStore.searchForMaps(query);
		
		//Parse results
		for (int i=0; i<results.size(); i++) {
			format = format.concat(results.get(i));
			format = format.concat("$");
		}	
		
		return format;		
	}
	
	@POST 
	@Path("/gdalInfo/")
	@Consumes({MediaType.WILDCARD, MediaType.APPLICATION_JSON })
    @Produces({MediaType.TEXT_PLAIN})
    public String parseImageGDAL(String fileUrl) {
		String fileName = fileUrl.substring(fileUrl.lastIndexOf("/")+1, fileUrl.length());
		String realFileUrl = context.getRealPath("/") + STORE_FOLDER + fileName;
		String data = "";
		String fileTMP = "";
		
		// generate folder for temp files
		File dir = new File(context.getRealPath("/") + TMP_FOLDER);  
		dir.mkdir();
				
		//System.out.println("Filename: "+ fileName);
		if (fileName.indexOf(".") != -1) {
			fileTMP = context.getRealPath("/") + TMP_FOLDER + fileName.substring(0, fileName.indexOf(".")).concat("4326");
		}
		else {
			fileTMP = context.getRealPath("/") + TMP_FOLDER + fileName.concat("4326");
		}
		
		//System.out.println("origin: "+realFileUrl);
		//System.out.println("temp: "+fileTMP);
		try {
			Process p1 = Runtime.getRuntime().exec(new String[] {GDAL_PATH + "gdalwarp", "-t_srs", "EPSG:4326", realFileUrl, fileTMP});
			try {
				p1.waitFor();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			/*
			ProcessBuilder builder = new ProcessBuilder(GDAL_PATH + "gdalinfo", fileTMP);
			builder.redirectOutput(new File(fileTMP.concat(".txt")));
			Process p2 = builder.start();*/
			Process p2 = Runtime.getRuntime().exec(new String[] {GDAL_PATH + "gdalinfo", fileTMP});
			try {
				p2.waitFor();
				BufferedReader reader = new BufferedReader(new InputStreamReader(p2.getInputStream()));
				String line = "";
				
				while( (line = reader.readLine()) != null) {
					data = data.concat(line);
				}
				reader.close();
			} catch (InterruptedException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}	
		//System.out.println("DATA: "+data);
		return data;
	}
	
	public String passQueryOS(String query, String fileName) throws IOException, QueryResultParseException, TupleQueryResultHandlerException, UnsupportedQueryResultFormatException, QueryEvaluationException {
		HttpClient hc = new DefaultHttpClient();
		String fileURI = null;


		// create a post method to execute
		HttpPost method = new HttpPost("http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql");
						
		// set the query parameter
		List<NameValuePair> params = new ArrayList<NameValuePair>();
		params.add(new BasicNameValuePair("query", query));
		UrlEncodedFormEntity encodedEntity = new UrlEncodedFormEntity(params, "UTF-8");
		method.setEntity(encodedEntity);
								
		// set the content type
		method.setHeader("Content-Type", "application/x-www-form-urlencoded");
						
		// set the accept format
		method.addHeader("Accept", "application/sparql-results+xml");
						
		try {
			//http://data.ordnancesurvey.co.uk/datasets/os-linked-data/apis/sparql
			// execute the method
			HttpResponse response = hc.execute(method);
				
			// If the response does not enclose an entity, there is no need
			// to worry about connection release
			HttpEntity entity = response.getEntity();
			
			//parse the file and transform it to kml form
			if (entity != null) {
				// generate random filename
				SecureRandom random = new SecureRandom();  
				fileName = new BigInteger(130, random).toString(32);
				
				// generate folder for kml files
				File dir = new File(context.getRealPath("/") + TMP_FOLDER);  
				dir.mkdir();
				
				InputStream inputStr = entity.getContent();
				String xml = IOUtils.toString(inputStr, "UTF-8");

				//Set the geometry literal to gmlLiteral
				xml = xml.replaceAll("http://www.w3.org/1999/02/22-rdf-syntax-ns#XMLLiteral", GeoConstants.GML);
				xml = xml.replaceAll("&lt;gml:Polygon&gt;", "&lt;gml:Polygon srsName=\"EPSG:27700\"&gt;");
				
				InputStream inputStream = new ByteArrayInputStream(xml.getBytes("UTF-8"));  
				TupleQueryResult results = QueryResultIO.parse(inputStream, TupleQueryResultFormat.SPARQL);
				
				FileOutputStream outputStream = new FileOutputStream(new File(context.getRealPath("/") + TMP_FOLDER + fileName + KML_FILE_EXT));
				stSPARQLResultsKMLWriter kmlWriter = new stSPARQLResultsKMLWriter(outputStream);
					
				kmlWriter.startQueryResult(results.getBindingNames());							
				while(results.hasNext()){
					BindingSet bindingSet = results.next();	
					kmlWriter.handleSolution(bindingSet);
				}							
				kmlWriter.endQueryResult();
				
				if (PROXY_STATUS.equalsIgnoreCase("on")) {
					fileURI = HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + TMP_FOLDER + fileName + KML_FILE_EXT;
				}
				else {
					fileURI = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + TMP_FOLDER + fileName + KML_FILE_EXT;					
				}
			}
			
			return fileURI;

		} catch (IOException e) {
			throw e;
							
		} finally {
			// release the connection.
			method.releaseConnection();
		}					
	}
	
	public String passQuery(String query, String layerName, String hostname, int port, String strabonendpoint) {
		String fileURI = null;
		String filename = "";
		try {
			System.out.println(hostname);
			System.out.println(port);
			System.out.println(strabonendpoint);
			GeneralSpatialEndpoint endpoint = new GeneralSpatialEndpoint(hostname, port, strabonendpoint);
			EndpointResult response = endpoint.queryForKML(query, hostname);
			if (response.getStatusCode() != 200) {
				System.out.println("Failed : HTTP error code : " + response.getStatusCode() + " " + response.getStatusText());
				throw new RuntimeException("Failed : HTTP error code : " + response.getStatusCode() + " " + response.getStatusText());
			}
			
			if (!hasSpatialResult(response.getResponse())){
				System.out.println("no spatial");
				return null;		
			}
						
			// generate random filename
			SecureRandom random = new SecureRandom();  
			filename = new BigInteger(130, random).toString(32);
			
			// generate folder for kml files
			File dir = new File(context.getRealPath("/") + TMP_FOLDER);  
			dir.mkdir();
			
			//Write in UTF8
			Writer out = new BufferedWriter(new OutputStreamWriter(
				    new FileOutputStream(new File(context.getRealPath("/") + TMP_FOLDER + filename + KML_FILE_EXT)), "UTF8"));
			try {
			    out.write(response.getResponse());
			    if (PROXY_STATUS.equalsIgnoreCase("on")) {
			    	fileURI = HTTP + PROXY_NAME + ":" + PROXY_PORT + context.getContextPath() + "/" + TMP_FOLDER + filename + KML_FILE_EXT;
			    }
			    else {
			    	fileURI = HTTP + servlet.getServerName() + ":" + servlet.getServerPort() + context.getContextPath() + "/" + TMP_FOLDER + filename + KML_FILE_EXT;			    	
			    }
			} finally {
			    out.close();
			}
			
			changeLayerNameInKmlFile(layerName, context.getRealPath("/") + TMP_FOLDER + filename + KML_FILE_EXT);
			
		}catch (IOException e) {
			e.printStackTrace();
		} catch (QueryResultParseException e) {
			e.printStackTrace();
		} catch (TupleQueryResultHandlerException e) {
			e.printStackTrace();
		} catch (UnsupportedQueryResultFormatException e) {
			e.printStackTrace();
		} catch (QueryEvaluationException e) {
			e.printStackTrace();
		}
				
		return fileURI;
	}
	
	private boolean hasSpatialResult(String response){
		
		try{
			 
			BufferedReader br = new BufferedReader(new StringReader(response));
			String strLine;
			
			while ((strLine = br.readLine()) != null)   {
			  
				if (strLine.contains("<coordinates>"))
					return true;
			}
			
		}catch (Exception e){ //Catch exception if any
		  logger.error("[{}] Error while checking response for containment of spatial results: {}", moduleName, e.getMessage());
		}
		
		return false;
	}
	
	private void changeLayerNameInKmlFile(String LayerName, String pathToKml){
		KmlEditor kmlEditor = new KmlEditor(LayerName);
		kmlEditor.changePlacemarkName(pathToKml);
	}
	
	public String createNewMapId() {		
		 // generate random number
		SecureRandom random = new SecureRandom();  
		String id = new BigInteger(130, random).toString(32).substring(0, 15);
		
		memoryStore = new MapMemoryStore();
		
		String mapId = "m"+id+"_";
		memoryStore.setMapID(mapId);
	
		return mapId;
	}
	
	public Vector<Layer> parseLayersInfo (String info) {
		Vector<Layer> layersInfo = new Vector<Layer>();
		Vector<String> values = new Vector<String>();
				
		String val = null;
		String[] data;
		String[] attr;
		String[] layerInfo = info.split("\\{\"nam");
		
		//For each layer
		for (int i=1; i<layerInfo.length; i++ ) {
			//Initialize values temp variable
			values = new Vector<String>();			
			data = layerInfo[i].split("\\$");

			//Attributes of each layer
			for (int j=0; j<data.length-1; j++) {
				attr = data[j].split("\":\"");				
				if (attr.length > 1) {
					val = attr[1];
				}
				else {
					val = "";
				}
				if (val.equalsIgnoreCase("")) {
					values.add(null);
				}
				else {
					values.add(val);
				}
			}		
			
			/**
			 * Fix null values
			 */
			if (values.get(10) == null) {
				values.set(10, "");
			}
			
			if (values.get(9) == null) {
				values.set(9, "");
			}			
			
			if (values.get(8) == null) {
				values.set(8, "");
			}
			
			if (values.get(7) == null) {
				values.set(7, "");
			}			
			
			Layer temp = new Layer(values.get(0), values.get(1), Boolean.parseBoolean(values.get(2)), values.get(3), values.get(4), values.get(5), values.get(6), values.get(7), values.get(8), values.get(9), values.get(10), values.get(11), values.get(12));

			layersInfo.add(temp);
		}
		
		return layersInfo;
	}
	
	public Vector<Chart> parseChartsInfo (String info) {
		Vector<Chart> chartsInfo = new Vector<Chart>();
		Vector<String> values = new Vector<String>();
		
		String[] data;
		String[] attr;
		String[] chartInfo = info.split("\\{\"nam");
		
		//For each chart
		for (int i=1; i<chartInfo.length; i++ ) {
			//Initialize values temp variable
			values = new Vector<String>();			
			data = chartInfo[i].split("\\$");

			//Attributes of each chart
			for (int j=0; j<data.length-1; j++) {
				attr = data[j].split("\":\"");				
				values.add(attr[1]);
			}					
					
			Chart temp = new Chart(values.get(1), values.get(2), values.get(3), values.get(4), values.get(5), values.get(6));
			chartsInfo.add(temp);
		}		
		
		return chartsInfo;
	}
}
