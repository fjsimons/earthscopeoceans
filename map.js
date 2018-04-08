function initMap() {
	// ID the map
	var mapDiv = document.getElementById('map');
	
	// some default locations
	var guyot = {lat: 40.34585, lng: -74.65475};
	var papeete = {lat: -17.53733, lng: -149.5665};
	// default map center
	var map = new google.maps.Map(mapDiv, {
		zoom: 13,
		center: papeete
	});

	//infowindow = new google.maps.InfoWindow;


	// place marker
	var marker = new google.maps.Marker({
	position: papeete,
		map: map
	});

	// use haversine formula do determine distance between points
	function getDisplacement(lat1, lon1, lat2, lon2){  // generally used geo measurement function
	    var R = 6378.137; // Radius of earth in KM
	    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
	    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
	    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
	    Math.sin(dLon/2) * Math.sin(dLon/2);
	    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
	    var d = R * c;
	    return d * 1000; // meters
	}


	// add data to map
	function addToMap(data, name) {
		// store coords in parallel arrays
		var lat = [];
		var lon = [];  

		var markers = [];
	

		// scrape data from text callback response
		var rows = data.split('\n');
		 for (i = 0; i < rows.length-2; i++) {
		    var coords = rows[i].split(/\s+/);
		   	lat.push(coords[8]);
		    lon.push(coords[9]);
		}

		var displacement = getDisplacement(lat[1], lon[1], lat[lat.length-1], lon[lon.length-1]);

       

		// iterate over arrays, placing markers
		for (var i = 0; i < lat.length; i++) {
			var latLng = new google.maps.LatLng(lat[i],lon[i]);

			
			var marker = new google.maps.Marker({
			position: latLng,
			map: map,
			clickable: true
			//content: node
			});


			marker.info = new google.maps.InfoWindow({
			  content: '<b>Float Name:</b> ' + name + 
			  		   '<BR/><b>Net Displacement:</b> ' + parseFloat(displacement).toFixed(2) + ' meters' //+
			  		   //'<BR/><b>Lat/ lon:</b> '  + this.getPosition().lat() + ', ' + this.getPosition().lng()


			});

			google.maps.event.addListener(marker, 'click', function() {
    			marker.info.open(map, this);
			});


			markers.push(marker);

	
		}

		//use exact center for panning
		//var latCenter = 0;
		//var lonCenter = 0;

		// for (var i = 0; i < lat.length; i ++) {
		// 	latCenter += parseFloat(lat[i]);
		// 	lonCenter += parseFloat(lon[i]);
		// }

		// latCenter /= (rows.length - 1);
		// lonCenter /= (rows.length - 1);
		
		//use aprox. center for panning (middle location)
		latCenter = lat[Math.floor(lat.length/2)];
		lonCenter = lon[Math.floor(lon.length/2)];
			
		var latLng = new google.maps.LatLng(latCenter, lonCenter);



		map.panTo(latLng);
		map.setZoom(11);
	}

	
	//listen for use of scrollbar
	//all
	google.maps.event.addDomListener(all, 'click', function() {
		window.alert("all clicked");
	});
		//raffa
	google.maps.event.addDomListener(raffa, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/RAFFA_030.txt"
		var name = "Raffa";
			resp = get(url,
			    // this callback is invoked AFTER the response arrives
			    function () {
			        
			        var data  = this.responseText;
			        // now do something with response
			        addToMap(data, name);
			    }
			);
	});
	//robin
	google.maps.event.addDomListener(robin, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/ROBIN_030.txt" 
		var name = "Robin";
			resp = get(url,
			    // this callback is invoked AFTER the response arrives
			    function () {
			        
			        var data  = this.responseText;
			        // now do something with response
			        addToMap(data, name);
			    }
			);
	});
}
