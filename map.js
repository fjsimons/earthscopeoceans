function initMap() {
	// ID the map
	var mapDiv = document.getElementById('map');

	// store data points
	var dataPoints = []

	// keep track of markers and their info windows
	var markers = [];
	var iwindows = []

	// some default locations
	var guyot = {lat: 40.34585, lng: -74.65475};
	var papeete = {lat: -17.53733, lng: -149.5665};

	// default map center
	var map = new google.maps.Map(mapDiv, {
		zoom: 13,
		center: papeete
	});

	map.setMapTypeId('hybrid');

	// place marker
	var marker = new google.maps.Marker({
	position: papeete,
		map: map
	});

	// get rough distance by getting displacement between all coord elements
	function getDistance(dataPoints) {
		var distance = 0
		for (var i = 0; i < dataPoints.length - 2; i++) {
			distance += getDisplacement(dataPoints[i].stla, dataPoints[i].stlo, dataPoints[i+1].stla, dataPoints[i+1].stlo)
		}
		return distance;
	}

	// use haversine formula do determine distance between lat/ lng points
	function getDisplacement(lat1, lon1, lat2, lon2){
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

	// for rounding to two decimal places
	function roundTwo(num) {
		return parseFloat(num).toFixed(2);
	}

	// add data to map
	function addToMap(data, name) {

		//getTimeElapsed();

		// scrape data from text callback response
		var rows = data.split('\n');
		 for (i = 0; i < rows.length - 1; i++) {
		    var elements = rows[i].split(/\s+/);

				// store each data point as an object
				var dataPoint = new DataPoint(name, elements[0] + " " + elements[1], elements[2], elements[3],
																			elements[4],elements[5],elements[6],elements[7], elements[8],
																		  elements[9], elements[10], elements[11], elements[12], elements[13]);

				dataPoints.push(dataPoint);
		}

		// do calculations (units: km/h)
		var displacement = getDisplacement(dataPoints[0].stla, dataPoints[0].stlo,
																			 dataPoints[dataPoints.length-1].stla, dataPoints[dataPoints.length-1].stlo) / 1000;
		var distance = getDistance(dataPoints) / 1000;
		var time = getTimeElapsed(dataPoints[0], dataPoints[dataPoints.length-1]);
		var velocity = (distance / time);


		var bounds = new google.maps.LatLngBounds();


		// iterate over arrays, placing markers
		for (var i = 0; i < dataPoints.length; i++) {
			var latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				clickable: true,
				opacity: (i + 1) / dataPoints.length
			});

			bounds.extend(marker.getPosition());
			setInfoWindow(i, marker, displacement, distance, velocity);

			markers.push(marker);
		}

		// use aprox. center for panning (middle location)
		latCenter = dataPoints[Math.floor(dataPoints.length/2)].stla;
		lonCenter = dataPoints[Math.floor(dataPoints.length/2)].stlo;

		var latLng = new google.maps.LatLng(latCenter, lonCenter);


		map.fitBounds(bounds);
		map.panTo(latLng);
	}

	function setInfoWindow(i, marker, displacement, distance, velocity) {
		google.maps.event.addListener(marker, 'click', function(event) {
			if (iwindows.length == 1) {
				iwindows[0].close();
				iwindows = [];
			}

			// set up info windows
			var iwindow = new google.maps.InfoWindow();
			iwindow.setContent('<b>Float Name:</b> ' + dataPoints[i].name +
		  		   '<BR/><b>Distance Travelled:</b> ' + roundTwo(distance) + ' km' +
		  		   '<BR/><b>Net Displacement:</b> ' + roundTwo(displacement) + ' km' +
						 '<BR/><b>Avg Velocity:</b> ' + roundTwo(velocity) + ' km/h' +

						 '<BR/><b>Lat/ lon:</b> ' + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
						 '<BR/><b>Date:</b> ' + dataPoints[i].stdt)

			iwindow.open(map, this);
			iwindows.push(iwindow);
		});

	}

	// delete all added markers
	function clearMarkers() {
  		for (var i = 0; i < markers.length; i++ ) {
    		markers[i].setMap(null);
  		}
 		markers.length = 0;
		dataPoints.length = 0;
	}

	//handles asnyc use of data
	function useCallback(url, name) {
		resp = get(url,
				// this callback is invoked after the response arrives
				function () {

						var data  = this.responseText;
						addToMap(data, name);
				}
		);

	}

	// listen for use of scrollbar
	// all
	// google.maps.event.addDomListener(all, 'click', function() {
	// 	document.getElementById("raffa").click()
	// 	document.getElementById("robin").click()
	//
 	// 	map.setZoom(2);
	// });

	// clear
	google.maps.event.addDomListener(clear, 'click', function() {
		clearMarkers();
	});

	// raffa
	google.maps.event.addDomListener(raffa, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/Raffa_030.txt"

		clearMarkers();
		useCallback(url, "Raffa");
	});

	// robin
	google.maps.event.addDomListener(robin, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/Robin_030.txt"

		clearMarkers();
		useCallback(url, "Robin");
	});
}
