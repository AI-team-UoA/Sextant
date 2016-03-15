function loadMenu() {
	document.getElementById('menuBar').innerHTML = '<div class="navbar navbar-default navbar-fixed-top" role="navigation">'+
	'<div class="container-fluid">'+
	'    <div class="navbar-header">'+
	'    	<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-collapse">'+
	'        <span class="sr-only">Toggle navigation</span>'+
	'      </button>'+
	'      <a class="navbar-brand" href="http://sextant.di.uoa.gr/" target="_blank"><img src="../images/SEXTANT.png" width="140" id="logo2" alt=""></a>'+  
	'    </div>'+
	'    <div class="navbar-collapse collapse">'+
	'      <ul class="nav navbar-nav navbar-left">'+
	'        <li class=""><a class="dropdown-toggle" href=""></a></li>'+
	'        <li class="dropdown">'+
	'          <a class="dropdown-toggle" data-toggle="dropdown" >Basic Functionality</a>'+
	'          <ul class="dropdown-menu" role="menu">'+
	'            <li><a href="./manual.html">Screen Layout</a></li>'+
	'            <li><a href="./zoomMap.html">Zoom on map</a></li>'+                	            
	'            <li><a href="./userInfo.html">Add POIs and AOIs</a></li>'+
	'            <li><a href="./cursor.html">Cursor position</a></li>'+
	'            <li><a href="./showAll.html">Show/Hide all Layers</a></li>'+
	'            <li><a href="./zoomAll.html">Zoom to all Layers</a></li>'+
	'            <li><a href="./baseMap.html">Select base map</a></li>'+
	'            <li><a href="./showMainPanel.html">Show/Hide main panel</a></li>'+
	'            <li><a href="./showTimeline.html">Show/Hide Timeline</a></li>'+
	'            <li><a href="./proxy.html">Proxy server</a></li>'+
	'          </ul>'+
	'        </li>'+
	'        <li class="dropdown">'+
	'            <a class="dropdown-toggle" data-toggle="dropdown">Layers</a>'+
	'            <ul class="dropdown-menu" role="menu">'+
	'                <li class="dropdown-header"><b>Create new Layer</b></li>'+
	'                <li><a href="./KML.html">KML</a></li>'+
	'                <li><a href="./GML.html">GML</a></li>'+
	'                <li><a href="./image.html">Image</a></li>'+
	'                <li><a href="./WMS.html">WMS</a></li>'+
	'                <li><a href="./querySPARQL.html">Query SPARQL Endpoint</a></li>'+
	'                <li><a href="./predQueries.html">Predefined Queries</a></li>'+
	'                <li class="divider"></li>'+
	'            	 <li class="dropdown-header"><b>Layer Manipulation</b></li>'+
	'            	 <li><a href="./layerButtons.html">Layer functions</a></li>'+
	'            	 <li><a href="./showLayer.html">Show/Hide</a></li>'+
	'            	 <li><a href="./zoomLayer.html">Zoom</a></li>'+
	'                <li><a href="./layerInfo.html">Info</a></li>'+
	'                <li><a href="./updateLayer.html">Update</a></li>'+
	'                <li><a href="./globalStyles.html">Global Styles</a></li>'+
	'                <li><a href="./featureStyles.html">Feature Styling</a></li>'+
	'                <li><a href="./spatialFilter.html">Spatial Filtering</a></li>'+
	'                <li><a href="./moveTop.html">Move on top</a></li>'+
	'                <li><a href="./download.html">Download</a></li>'+
	'                <li><a href="./delete.html">Delete</a></li>'+
	'                <li class="divider"></li>'+
	'            	 <li class="dropdown-header"><b>Timeline-Temporal Layers</b></li>'+
	'            	 <li><a href="./moveTimeline.html">Move Timeline</a></li>'+
	'                <li><a href="./adjustTimeSpan.html">Adjust time span</a></li>'+
	'            </ul>'+
	'        </li>'+
	'        <li class="dropdown">'+
	'        	  <a href="#" class="dropdown-toggle" data-toggle="dropdown">Maps</a>'+
	'            <ul class="dropdown-menu" role="menu">'+
	'                <li><a href="./saveMap.html">Create/Save</a></li>'+
	'                <li><a href="./loadMap.html">Load</a></li>'+
	'                <li><a href="./mapSearch.html">Search</a></li>'+
	'            </ul>'+
	'        </li>'+
	'        <li class="dropdown">'+
	'        	  <a class="dropdown-toggle" data-toggle="dropdown">Extra Functionality</a>'+
	'            <ul class="dropdown-menu" role="menu">'+
	'                <li><a href="./explore.html">Explore</a></li>'+
	'                <li><a href="./GEOSS.html">GEOSS portal</a></li>'+
	'                <li><a href="./statistical.html">Statistical Charts</a></li>'+
	'            </ul>'+
	'        </li>'+
	'      </ul>'+
	'    </div><!--/.nav-collapse -->'+
	'  </div><!--/.container-fluid -->'+
	'</div> ';
}




