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
import java.io.IOException;
import java.util.List;
import java.util.Vector;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import de.micromata.opengis.kml.v_2_2_0.Document;
import de.micromata.opengis.kml.v_2_2_0.Feature;
import de.micromata.opengis.kml.v_2_2_0.Folder;
import de.micromata.opengis.kml.v_2_2_0.IconStyle;
import de.micromata.opengis.kml.v_2_2_0.Kml;
import de.micromata.opengis.kml.v_2_2_0.LineStyle;
import de.micromata.opengis.kml.v_2_2_0.Placemark;
import de.micromata.opengis.kml.v_2_2_0.Style;

/**
 * Provides editing capabilities on KML files, such as changing
 * the style of rendered geometries, displayed icons, and naming
 * of layers.
 * 
 * @author Kallirroi Dogani <kallirroi@di.uoa.gr>
 * @author George Stamoulis <gstam@di.uoa.gr>
 */
public class KmlEditor {

	private static final Logger logger = LoggerFactory.getLogger(server.KmlEditor.class);
	private static final String moduleName = KmlEditor.class.getSimpleName(); 
			
	private String styleUrl;
	private String polystyleColor;
	private String linestyleColor;
	
	private String refForIcon;
	private double scale;
	
	private Kml kml;
	private Kml newKml;
	private Kml[] kmz;
	
	private String newLayerName;
	
	private int hasDocTag = 0;
		
	public KmlEditor() {
		
		newLayerName = null;
	}
	
	public KmlEditor(String styleUrl, String polystyleColor, String linestyleColor, String refForIcon, double scale){
		
		this.styleUrl = new String(styleUrl);
		
		if (polystyleColor != null) {
			if (!polystyleColor.isEmpty()) {
				if (polystyleColor.equals("0000000")) {
					this.polystyleColor = "50FFFFFF";
				}
				else {
					this.polystyleColor = polystyleColor;
				}
			}
			else {
				this.polystyleColor = "50FFFFFF";
			}
		}
		
		if (linestyleColor != null) {
			if (!linestyleColor.isEmpty()) {
				this.linestyleColor = linestyleColor;
			}
			else {
				this.linestyleColor = "50FFFFFF";
			}
		}
		
		this.refForIcon = refForIcon;
		this.scale = scale;
		newLayerName = null;
	}
	
	public KmlEditor(String layerName){
		
		newLayerName = new String(layerName);
	}

	public void processKmlFile(String path, String kmlFile){
		
		if (kmlFile.endsWith(".kml")) {
			processKml(path, kmlFile);
			
		} else if (kmlFile.endsWith(".kmz")) {
			// TODO
		}
	}
	
	public void processKml(String path, String kmlFile){
		
		String pathToKml = path + kmlFile;
		
		try {
		
			newKml = new Kml();
			kml = Kml.unmarshal(new File(pathToKml));
			
			if (kml != null){
	
				Feature feature = kml.getFeature();
				processFeature(feature);
			}
				
		newKml.marshal(new File(pathToKml));
		
		File oldKml = new File(pathToKml); 
		File newKml = new File( path + "n_" + kmlFile );
		boolean success = oldKml.renameTo(newKml);
	    if (!success) {
	        // File was not successfully renamed
	    	System.out.println("Not renamed");
	    }

		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} 
	
		
	}
	
	public void changePlacemarkName(String pathToKml){
		
		try {
			
			newKml = new Kml();
			kml = Kml.unmarshal(new File(pathToKml));
			
			if (kml != null){
	
				Feature feature = kml.getFeature();
				processFeature(feature);
			}
				
			newKml.marshal(new File(pathToKml));
		
		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} 
	}
	
	public void processKmz(String path, String kmlFile){
		
		String pathToKml = path + kmlFile;
		
		try {
		
			newKml = new Kml();
			kmz = Kml.unmarshalFromKmz(new File(pathToKml));
			
			if (kmz != null){
	
				for (Kml kml : kmz) {

					Feature feature = kml.getFeature();
					processFeature(feature);
				}
			}
				
			newKml.marshalAsKmz(pathToKml);
			
			File oldKml = new File(pathToKml); 
			File newKml = new File( path + "n_" + kmlFile );
			boolean success = oldKml.renameTo(newKml);
		    if (!success) {
		        // File was not successfully renamed
		    	System.out.println("Not renamed");
	    }

		} catch (FileNotFoundException e) {
			e.printStackTrace();
		} catch (IOException e) {
			e.printStackTrace();
		} 
	
		
	}
	
	public void processFeature(Feature feature) {
		
		if (feature instanceof Document) {
			hasDocTag = 1;
			processDocument((Document) feature);
			newKml.setFeature(feature);
			
		} else if (feature instanceof Folder) {
			processFolder((Folder) feature);
			newKml.setFeature(feature);
			
		} else if (feature instanceof Placemark) {
			processPlacemark((Placemark) feature);
			
		}
	}

	
	public void processDocument(Document doc) {
		
		List<Feature> features = doc.getFeature();

		//System.out.println("Document " + doc.getName());

		for (Feature docFeature : features){
			processFeature(docFeature);
		}
		
		
		//Add styles for placemarks
		Style style = doc.createAndAddStyle().withId(styleUrl);
		if (linestyleColor!=null){
			if (!linestyleColor.equals("")){
				LineStyle lineStyle = style.createAndSetLineStyle();
				lineStyle.withColor(linestyleColor);
				lineStyle.withWidth(2.5);
			}
		}
		if (polystyleColor!=null){
				if (!polystyleColor.equals(""))
					style.createAndSetPolyStyle().withColor(polystyleColor);
		}
		
		IconStyle iconstyle = style.createAndSetIconStyle();
		if (scale!=-1.0)
			iconstyle.setScale(scale);
		
		
		if (refForIcon!=null){
			if(!refForIcon.equals(""))
				iconstyle.createAndSetIcon().withHref(refForIcon);
		}
	}
	
	public void processFolder(Folder folder){
		
		List<Feature> features = folder.getFeature();
		
		for (Feature folderFeature : features){
			processFeature(folderFeature);
		}
		
		//If KML file doenst have document tag (produced by endpoint) then add styles in folder tag
		if (hasDocTag != 1) {
			Style style = folder.createAndAddStyle().withId(styleUrl);
			if (linestyleColor!=null){
				if (!linestyleColor.equals("")){
					LineStyle lineStyle = style.createAndSetLineStyle();
					lineStyle.withColor(linestyleColor);
					lineStyle.withWidth(2.5);
				}
			}
			if (polystyleColor!=null){
					if (!polystyleColor.equals(""))
						style.createAndSetPolyStyle().withColor(polystyleColor);
			}
			
			IconStyle iconstyle = style.createAndSetIconStyle();
			if (scale!=-1.0)
				iconstyle.setScale(scale);
			
			
			if (refForIcon!=null){
				if(!refForIcon.equals(""))
					iconstyle.createAndSetIcon().withHref(refForIcon);
			}
		}
		
	}
	
	public void processPlacemark(Placemark placemark){
		
		//System.out.println("Change Style!");
		
		if (newLayerName!=null) {
			placemark.setName(newLayerName);
		}
		else {
			placemark.setStyleUrl("#" + styleUrl);
		}
		
		
	}

	/**
	 * Merges a set of KML files into one. 
	 *  
	 * @param path the absolute path where all KML files reside
	 * @param newKmlFile the filename of the resulting KML file
	 * @param kmlFiles the KML files to merge
	 */
	public void mergeKMLFiles(String path, String newKmlFile, List<String> kmlFiles) {
		
		try{
			File file = new File(path + newKmlFile);
			file.createNewFile();
			
			newKml = new Kml();
			
			Document document = new Document();
			
			Vector<Feature> list = new Vector<Feature>();
			for (int i = 0; i < kmlFiles.size(); i++) {
					Kml kml = Kml.unmarshal(new File(path + kmlFiles.get(i)));
					Feature feature = kml.getFeature();
					if (feature instanceof Document) {
						list.addAll(((Document) feature).getFeature());
						
					} else if (feature instanceof Folder){
						// list.addAll(((Folder) feature).getFeature());
						list.add(feature);
					}
			}
			
			document.setFeature(list);
			newKml.setFeature(document);
			
			newKml.marshal(file);
			
		} catch (FileNotFoundException e) {
			logger.error("[{}] Cannot access KML file for merging.", moduleName, e);
			
		} catch (IOException e) {
			logger.error("[{}] Cannot read/write KML files for merging.", moduleName, e);
		}
	}
	
	/**
	 * Given a remote KML file, checks whether it contains 
	 * temporal elements such as "TimePrimitive", "TimeStamp",
	 * or "TimeSpan".
	 * 
	 * @param kmlURL
	 * @return
	 */
//	public static boolean containsTemporalElements(URL kmlURL) {
//		InputStream input = null;
//		
//		try {
//			input = kmlURL.openStream();
//			
//			Kml kml = Kml.unmarshal(new BufferedInputStream(input));
//			
//			kml.getFeature();
//			
//		} catch (IOException e) {
//			e.printStackTrace();
//			
//		} finally {
//			if (input != null) {
//				try {
//					input.close();		
//					
//				} catch (IOException e) {
//					e.printStackTrace();
//				}
//			}
//		}
//	}
}
