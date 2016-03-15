Sextant
------------


Introduction
============
Sextant is a web-based and mobile ready application for exploring, interacting,
and visualizing time-evolving linked geospatial data. Sextant has been designed
with the aim of being flexible, portable, and interoperable with other GIS
tools.

The core feature of Sextant is the ability to create thematic maps by combining
geospatial and temporal information that exists in a number of heterogeneous
data sources ranging from standard SPARQL endpoints, to SPARQL endpoints
following the standard GeoSPARQL defined by the Open Geospatial Consortium
(OGC), or well-adopted geospatial file formats, like KML, GML and GeoTIFF. In
this manner we overcome the main disadvantage of existing semantic web tools
that allow the visualization of a single SPARQL endpoint, and provide
functionality to domain experts from different fields in creating thematic
maps, which emphasize spatial variation of one or a small number of geographic
distributions.  Moreover we go beyond and present a map ontology that assists
on modeling these maps in RDF and allow for easy sharing, editing and search
mechanisms over existing maps.

One of our goals was to build a tool that is interoperable with GIS tools. To achieve that we
try to support some of the most promising file formats used in the GIS area. Two are the main
categories of these file formats according to the way the information is represented in the files.
These are the raster and the vector file formats. In Sextant we currently support the visualization of
KML, GML, GeoTIFF and WMS layers and provide tools for interaction with these layers,
such as the colorization of geometry features according to specific values to create color maps for better
understanding of the various aspects of layers. Another important feature is the utilization
of the temporal dimension. Implementation of the valid time component of stRDF and
stSPARQL in system Strabon allows us to query both the spatial and the temporal dimension.
Enriching our results with temporal information allows us to create layers with
valid time. Using the SIMILE Timeline widget we can make these layers appear
and disappear from the map according to their valid time. This feature allows
the creation of thematic maps that change over time and can assist experts in
the fields of agriculture, biodiversity, climate, disasters, ecosystems,
energy, water and weather, in visualizing temporal maps that help them
understand the evolution of data.

Apart from visualizing the spatial and temporal dimension, statistical charts
play an important role in understanding the various measures of datasets.
Statistical data is a foundation for policy prediction, planning and
adjustments and underpins many of the mash-ups and visualizations we see on the
web. There is strong interest in being able to publish statistical data in a
web-friendly format to enable it to be linked and combined with related
information.  At the heart of a statistical dataset is a set of observed values
organized along a group of dimensions, together with associated metadata. The
Data Cube vocabulary enables such information to be represented using the W3C
RDF standard and published following the principles of linked data. We
demonstrate how to utilize the Data Cube vocabulary to enhance existing
datasets and allow the creation of charts through Sextant in an intuitive way
that does not involve the use of SPARQL from the user point of view.


Sextant Homepage
================
The homepage of Sextant may be accessed at http://sextant.di.uoa.gr.
There you can find links to download the application in desktop or mobile version
and access demo maps that illustrate the capabilities of the application.


How to build and run Sextant from command line
==============================================
Assuming you have already installed Maven (http://maven.apache.org/download.html),
downloaded Sextant and you are in the top-level
directory of the source code, issue the following commands to build it from
command line:

	$ cd JerseyServer
	$ mvn clean package

After you have successfully built Sextant, you can find the .war file in the
target folder under JerseyServer, to deploy in Tomcat(6+) server.

Getting Started
===============
To get started  with Sextant please have a look at the manual:
	
	http://sextant.di.uoa.gr/data/Sextant_manual.pdf


Developer Guide
===============
Assuming that you are familiar with Maven, the following steps need to be
followed in order to use Sextant in Eclipse:

  1. Install Maven from http://maven.apache.org/download.html.
  2. Install Eclipse from http://www.eclipse.org/downloads/.
  3. Install the m2e plugin for Eclipse from http://www.eclipse.org/m2e/.
  4. Install the MercurialEclipse plugin for Eclipse from
     http://javaforge.com/project/HGE .
  5. From Eclipse, go to File --> Import --> Mercurial --> Clone Existing
     Mercurial Repository --> Next. In the URL textarea paste the following
     URL: http://hg.strabon.di.uoa.gr/Sextant-New and then press Next --> Next -->
     Finish. Right click on the project and select Configure --> Convert to
     Maven project. Eclipse will enable Maven dependency management for the
     project, download any dependencies and build the project. 	


Publications
============
You can learn about Sextant by reading the following publications: 

  * Charalampos Nikolaou, Kallirroi Dogani, Konstantina Bereta, George Garbis,
    Manos Karpathiotakis, Kostis Kyzirakos, Manolis Koubarakis: "Sextant: Visualizing
    time-evolving linked geospatial data". Web Semantics: Science, Services and Agents
    on the World Wide Web, 34(C)

  * G. Stamoulis. Master Thesis: Visualizaing and exploring time-evolving
    linked geospatial data. National and Kapodistian University of Athens. 
    Athens, June 2015
    [pdf: http://sextant.di.uoa.gr/data/thesis.pdf]
    
  * C. Nikolaou, K. Kyzirakos, K. Bereta, K. Dogani, S. Giannakopoulou, P.
    Smeros, G. Garbis, M. Koubarakis, D. E. Molina, O. C. Dumitru, G. Schwarz,
    M. Datcu: "Improving knowledge discovery from synthetic aperture radar
    images using the linked open data cloud and Sextant". In Informal
    Proceedings of the Image Information Mining Conference: The Sentinels Era
    (ESA-EUSC-JRC 2014), Bucharest, Romania, 5-7 March, 2014.
    [pdf: http://cgi.di.uoa.gr/~charnik/files/pubs/2014/iim2014.pdf]
    
  * Konstantina Bereta, Charalampos Nikolaou, Manos Karpathiotakis, Kostis
    Kyzirakos, and Manolis Koubarakis: "SexTant: Visualizing Time-Evolving
    Linked Geospatial Data." In the 12th International Semantic Web Conference
    (ISWC 2013), Sydney, Australia, October 21-25, 2013.
    [pdf: http://www.strabon.di.uoa.gr/files/sexTant.pdf]
	
  * Charalampos Nikolaou, Kallirroi Dogani, Kostis Kyzirakos, and Manolis
    Koubarakis: "Sextant: Browsing and Mapping the Ocean of Linked Geospatial
    Data." In the 10th ExtendedSemantic Web Conference (ESWC 2013),
    Montpellier, France, May 26-30, 2013.
    [pdf: http://www.strabon.di.uoa.gr/files/sextant.pdf]


Contributors
============
The system Sextant has been developed by the following members of our team:

  * Giorgos Stamoulis       <gstam@di.uoa.gr>
  * Charalampos Nikolaou    <charnik@di.uoa.gr>
  * Konstantina Bereta      <konstantina.bereta@di.uoa.gr>
  * Kallirroi Dogani        <kallirroi@di.uoa.gr>
  * Giorgos Garbis          <ggarbis@di.uoa.gr>
  * Manos Karpathiotakis    <mk@di.uoa.gr>
  * Kostis Kyzirakos        <Kostis.Kyzirakos@cwi.nl>
  * Manolis Koubarakis      <koubarak@di.uoa.gr>


Support
============
We are always trying to improve Sextant and are looking forward to hearing from
you comments and suggestions that will help us improve the available features
and add new ones, to assist you in visualizing and exploring linked geospatial
data using the advantages of semantic web technologies.

Contact info: 
 
  * <gstam@di.uoa.gr>

  * Strabon-users, is used as a communication channel for Strabon users.
	To subscribe to the mailing-list, please visit page 
	http://cgi.di.uoa.gr/~mailman/listinfo/strabon-users. To post e-mails
	to Strabon-users mailing-list, write to strabon-users@di.uoa.gr.


Bugs
====
Please report bugs to:

  * <gstam@di.uoa.gr>

  * Strabon-users, is used as a communication channel for Strabon users.
	To subscribe to the mailing-list, please visit page 
	http://cgi.di.uoa.gr/~mailman/listinfo/strabon-users. To post e-mails
	to Strabon-users mailing-list, write to strabon-users@di.uoa.gr.


Known Issues
============
There are no issues that we are aware of.


License
=======
This Source Code Form is subject to the terms of the Mozilla Public
License, v. 2.0. If a copy of the MPL was not distributed with this
file, You can obtain one at http://mozilla.org/MPL/2.0/.

Copyright (C) 2014, 2015, Pyravlos Team

http://sextant.di.uoa.gr


How to apply the license
========================

 * In the beginning of Java source code files paste the following statement:
	/**
	 * This Source Code Form is subject to the terms of the Mozilla Public
	 * License, v. 2.0. If a copy of the MPL was not distributed with this
	 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
	 * 
	 * Copyright (C) 2014, 2015, Pyravlos Team
	 * 
	 * http://sextant.di.uoa.gr
	 */

 * In the beginning of HTML/XML files paste the following statement:
	<!-- This Source Code Form is subject to the terms of the Mozilla Public
	   - License, v. 2.0. If a copy of the MPL was not distributed with this
	   - file, You can obtain one at http://mozilla.org/MPL/2.0/. 
	   -
	   - Copyright (C) 2014, 2015, Pyravlos Team
	   -
	   - http://sextant.di.uoa.gr
	-->
