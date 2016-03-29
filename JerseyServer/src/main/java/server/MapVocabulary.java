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

import org.openrdf.model.URI;
import org.openrdf.sail.memory.model.MemURI;

/**
 * This interface defines the vocabulary used by the Map Ontology.
 * 
 * @author Charalampos Nikolaou <charnik@di.uoa.gr>
 * @authr Kallirroi Dogani <kallirroi@di.uoa.gr>
 */
public interface MapVocabulary  {
	
	public static final String NAMESPACE 			= "http://geo.linkedopendata.gr/map/ontology/";
	public static final String INSTANCE_NAMESPACE 	= "http://geo.linkedopendata.gr/map/id/";
	
	// classes
	public static final URI MAP 		= new MemURI(null, NAMESPACE, "Map");
	public static final URI LAYER 		= new MemURI(null, NAMESPACE, "Layer");
	public static final URI CHART 		= new MemURI(null, NAMESPACE, "Chart");
	public static final URI QUERY 		= new MemURI(null, NAMESPACE, "Query");
	public static final URI ENDPOINT 	= new MemURI(null, NAMESPACE, "Endpoint");
	public static final URI DATASET 	= new MemURI(null, NAMESPACE, "Dataset");
	
	// properties
	public static final URI HASKMLFILE  		= new MemURI(null, NAMESPACE, "hasKmlFile");
	public static final URI PRODUCEDBYQUERY 	= new MemURI(null, NAMESPACE, "producedByQuery");
	public static final URI DISPLAYEDAT  		= new MemURI(null, NAMESPACE, "displayedAt");
	public static final URI HASVALUE  			= new MemURI(null, NAMESPACE, "hasValue");
	public static final URI HASORDEREDLIST  	= new MemURI(null, NAMESPACE, "hasOrderedList");
	public static final URI HASNAME  			= new MemURI(null, NAMESPACE, "hasName");
	public static final URI DERIVEDBY  			= new MemURI(null, NAMESPACE, "derivedBy");
	public static final URI HASURI  			= new MemURI(null, NAMESPACE, "hasURI");
//	public static final URI HASNAMESPACE  		= new MemURI(null, Namespace, "hasNamespace");
//	public static final URI HASGEOPROPERTY  	= new MemURI(null, Namespace, "hasGeoProperty");	
//	public static final URI HASDATASET  		= new MemURI(null, Namespace, "hasDataset");
	public static final URI HASPOLYSTYLECOLOR 	= new MemURI(null, NAMESPACE, "hasPolyStyleColor");
	public static final URI HASLINESTYLECOLOR 	= new MemURI(null, NAMESPACE, "hasLineStyleColor");
	public static final URI HASICON  			= new MemURI(null, NAMESPACE, "hasIcon");
	public static final URI HASICONSCALE  		= new MemURI(null, NAMESPACE, "hasIconScale");
	public static final URI IS_TEMPORAL_LAYER	= new MemURI(null, NAMESPACE, "isTemporalLayer");
	
	public static final URI HASIMAGEBOX  		= new MemURI(null, NAMESPACE, "hasImageBox");
	public static final URI HASLAYERTYPE  		= new MemURI(null, NAMESPACE, "hasLayerType");
	
	public static final URI HASTITLE  			= new MemURI(null, NAMESPACE, "hasTitle");
	public static final URI HASCREATOR  		= new MemURI(null, NAMESPACE, "hasCreator");
	public static final URI HASLICENSE  		= new MemURI(null, NAMESPACE, "hasLicense");
	public static final URI HASTHEME  			= new MemURI(null, NAMESPACE, "hasTheme");
	public static final URI HASDESCRIPTION  	= new MemURI(null, NAMESPACE, "hasDescription");
	public static final URI HASCREATEDATE  		= new MemURI(null, NAMESPACE, "hasCreateDate");
	public static final URI HASMODIFYDATE  		= new MemURI(null, NAMESPACE, "hasModifyDate");
	public static final URI HASGEOMETRY  		= new MemURI(null, NAMESPACE, "hasGeometry");
	
	public static final URI HASCHARTTYPE  		= new MemURI(null, NAMESPACE, "hasChartType");
	public static final URI HASMEASURES  		= new MemURI(null, NAMESPACE, "hasMeasures");
	public static final URI HASFREEDIMS  		= new MemURI(null, NAMESPACE, "hasFreeDims");
	public static final URI HASINSTANCES  		= new MemURI(null, NAMESPACE, "hasInstances");
	public static final URI REFERS  			= new MemURI(null, NAMESPACE, "refersTo");	
}
