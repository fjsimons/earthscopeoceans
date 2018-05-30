function initMap() {
	// ID the map
	var mapDiv = document.getElementById('map');

	// keep track of markers
	var markers = [];

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
	function getDistance(lat, lon) {
		var distance = 0
		for (var i = 0; i < lat.length - 2; i++) {
			distance += getDisplacement(lat[i], lon[i], lat[i+1], lon[i+1])
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
		// store coords in parallel arrays
		var dataPoints = []

		// scrape data from text callback response
		var rows = data.split('\n');
		 for (i = 0; i < rows.length - 1; i++) {
		    var elements = rows[i].split(/\s+/);

				// store each data point as an object
				var dataPoint = new DataPoint(elements[0] + " " + elements[1], elements[2], elements[3],
																			elements[4],elements[5],elements[6],elements[7], elements[8],
																		  elements[9], elements[10], elements[11], elements[12], elements[13]);


				dataPoints.push(dataPoint);

		}

		// do calculations (units: km/h)

		var displacement = getDisplacement(dataPoints[1].stla, dataPoints[1].stlo,
																			 dataPoints[dataPoints.length-1].stla, dataPoints[dataPoints.length-1].stlo) / 1000;

		//var distance = getDistance(lat, lon) / 1000;

		// this only works as long as the intervals between
		// updates are all 1 hour, or sum to 1 hr * numUpdates
		//var velocity = distance / lat.length;

		// iterate over arrays, placing markers
		for (var i = 0; i < dataPoints.length; i++) {
			var latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				clickable: true
			});



			// marker.info = new google.maps.InfoWindow({
			//   content:'<b>Float Name:</b> ' + name +
			//   		   '<BR/><b>Distance Travelled:</b> ' + roundTwo(distance) + ' kilometers' +
			//   		   '<BR/><b>Net Displacement:</b> ' + roundTwo(displacement) + ' kilometers' +
			//   		   '<BR/><b>Average Velocity:</b> ' + roundTwo(velocity) + ' km/h'
			// });
			//
			// google.maps.event.addListener(marker, 'click', function(event) {
			// 		marker.info.close();
    	// 		marker.info.open(map, this);
			// });

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

		// use aprox. center for panning (middle location)
		latCenter = dataPoints[Math.floor(dataPoints.length/2)].stla;
		lonCenter = dataPoints[Math.floor(dataPoints.length/2)].stlo;

		var latLng = new google.maps.LatLng(latCenter, lonCenter);

		map.panTo(latLng);
		//map.setZoom(10);
	}

	// delete all added markers
	function clearMarkers() {
  		for (var i = 0; i < markers.length; i++ ) {
    		markers[i].setMap(null);
  		}
 		markers.length = 0;
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
	google.maps.event.addDomListener(all, 'click', function() {
		document.getElementById("raffa").click()
		document.getElementById("robin").click()

 		map.setZoom(2);
	});

	// clear
	google.maps.event.addDomListener(clear, 'click', function() {
		clearMarkers();
	});

	// raffa
	google.maps.event.addDomListener(raffa, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/Raffa_030.txt"

		useCallback(url, name);
	});

	// robin
	google.maps.event.addDomListener(robin, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/Robin_030.txt"
		useCallback(url, name);
	});
}

// create datapoint object
function DataPoint(stdt, stla, stlo, hdop, vdop, Vbat, minV, Pint, Pext, Prange, cmdrdc, f2up, fupl) {

	this.stdt = stdt;
  this.stla = stla;
  this.stlo = stlo;
  this.hdop = hdop;
	this.vdop = vdop;
	this.Vbat = Vbat;
	this.minV = minV;
	this.Pint = Pint;
	this.Pext = Pext;
	this.Prange = Prange;
  this.cmdrdc = cmdrdc;
  this.f2up = f2up;
  this.fupl = fupl;

  this.getStla = function() {
  	return this.stla
  };

	this.getStlo = function() {
		return this.stlo;
	};


}

