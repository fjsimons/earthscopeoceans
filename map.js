/**
	Map class

	@Author Jonah Rubin
	5/31/18
*/


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

	// for rounding to two decimal places
	function roundTwo(num) {
		return parseFloat(num).toFixed(2);
	}

	// add data to map
	function addToMap(data, name) {
		var empty = new Boolean(false);

		// scrape data from text callback response
		var rows = data.split('\n');
		if (rows.length <= 1) {
			empty = new Boolean(true);
		}

		if (empty == false) {
		 for (i = 0; i < rows.length - 1; i++) {
			  var corrupted = new Boolean(false);
		    var elements = rows[i].split(/\s+/);

				 for (var j = 2; j < elements.length; j++) {
					if (isNaN(elements[j])) {
						corrupted = new Boolean(true);
					}
				 }

				// store each data point as an object
				if (corrupted == false) {
		    	var dataPoint = new DataPoint(name, elements[0] + " " + elements[1],
                                                        elements[2], elements[3],elements[4],
                                                        elements[5], elements[6],elements[7],
                                                        elements[8], elements[9], elements[10],
                                                        elements[11], elements[12], elements[13]);
     			dataPoints.push(dataPoint);
			}
		}

		var netDisplacement;
		var totalDistance;
		var totalTime;
		var avgVelocity;

		if (dataPoints.length > 1) {
			// do calculations (units: km/h)
			netDisplacement = getDisplacement(dataPoints[0].stla, dataPoints[0].stlo,
	  			  		                     dataPoints[dataPoints.length-1].stla, dataPoints[dataPoints.length-1].stlo) / 1000;
			totalDistance = getDistance(dataPoints) / 1000;
			totalTime = getTimeElapsed(dataPoints[0], dataPoints[dataPoints.length-1]);

			avgVelocity = (totalDistance / totalTime);

		} else {
			netDisplacement = 0;
			totalDistance = 0
			totalTime = 0;
			avgVelocty = 0;

		}

		// set up panning bounds
		var bounds = new google.maps.LatLngBounds();

		// iterate over arrays, placing markers
		for (var i = 0; i < dataPoints.length; i++) {
			var latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

			// set up marker, fade on age
			var marker = new google.maps.Marker({
				position: latLng,
				map: map,
				clickable: true,
				opacity: (i + 1) / dataPoints.length
			});

			// expand bounds to fit all markers
			bounds.extend(marker.getPosition());

			var legLength;
			var legSpeed;
			var legTime;

			// create infowindow
			if (i == 0) {
				legLength = 0;
				legSpeed = 0;
				legTime = 0;
			} else {
				legLength = getDisplacement(dataPoints[i-1].stla, dataPoints[i-1].stlo,
																		dataPoints[i].stla, dataPoints[i].stlo) / 1000;
				legTime = getTimeElapsed(dataPoints[i-1], dataPoints[i]);
				legSpeed = legLength / legTime;
			}

			setInfoWindow(i, marker, netDisplacement, totalDistance, avgVelocity,
				            totalTime, legLength, legSpeed, legTime);

			markers.push(marker);

		}

		// pan to bounds
		map.fitBounds(bounds);
		}
	}

	// for dynamic info windows
	function setInfoWindow(i, marker, netDisplacement, totalDistance, avgVelocity,
								                     totalTime, legLength, legSpeed, legTime) {

		google.maps.event.addListener(marker, 'click', function(event) {
			if (iwindows.length == 1) {
				iwindows[0].close();
				iwindows = [];
			}

			// set up window
			var iwindow = new google.maps.InfoWindow();
			iwindow.setContent('<b>Float Name:</b> '    + dataPoints[i].name +
				       '<br/><b>UTC Date:</b> '           + dataPoints[i].stdt +
				       '<br/><b>Your Date:</b> '          + dataPoints[i].loct +
    				   '<br/><b>GPS Lat/Lon:</b> '        + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
    				   '<br/><b>GPS Hdop/Vdop:</b> '      + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
				       '<br/><b>Battery:</b> '            + dataPoints[i].Vbat + ' mV' +
				       '<br/><b>Internal Pressure:</b> '  + dataPoints[i].Pint + ' Pa' +
				       '<br/><b>External Pressure:</b> '  + dataPoints[i].Pext + ' mbar' +
               '<br/> ' +
     		  		 '<br/><b>Leg Length:</b> '         + roundTwo(legLength) + ' km' +
							 '<br/><b>Leg Time:</b> '           + roundTwo(legTime) + ' h' +
							 '<br/><b>Leg Speed:</b> '          + roundTwo(legSpeed) + ' km/h' +

		  		     '<br/><b>Total Time:</b> '         + roundTwo(totalTime) + ' h' +
     		  		 '<br/><b>Distance Travelled:</b> ' + roundTwo(totalDistance) + ' km' +
				       '<br/><b>Average Speed:</b> '      + roundTwo(avgVelocity) + ' km/h' +
     		  		 '<br/><b>Net Displacement:</b> '   + roundTwo(netDisplacement) + ' km'
                                       )
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

        //################################################################################//

	// listen for use of scrollbar

	// all
	// google.maps.event.addDomListener(all, 'click', function() {
	// 	document.getElementById("P001").click()
	//
 	// 	map.setZoom(2);
	// });

	// clear
	google.maps.event.addDomListener(clear, 'click', function() {
		clearMarkers();
	});

	// the following list has been autogenerated by aux/Pseed2

	google.maps.event.addDomListener(P001, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/dummy.txt"
		    clearMarkers();
		useCallback(url,"P001");
	    });

	google.maps.event.addDomListener(P002, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P002_030.txt"
		    clearMarkers();
		useCallback(url,"P002");
	    });

	google.maps.event.addDomListener(P003, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P003_030.txt"
		    clearMarkers();
		useCallback(url,"P003");
	    });

	google.maps.event.addDomListener(P004, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P004_030.txt"
		    clearMarkers();
		useCallback(url,"P004");
	    });

	google.maps.event.addDomListener(P005, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P005_030.txt"
		    clearMarkers();
		useCallback(url,"P005");
	    });

	google.maps.event.addDomListener(P006, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P006_030.txt"
		    clearMarkers();
		useCallback(url,"P006");
	    });

	google.maps.event.addDomListener(P007, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P007_030.txt"
		    clearMarkers();
		useCallback(url,"P007");
	    });

	google.maps.event.addDomListener(P008, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P008_030.txt"
		    clearMarkers();
		useCallback(url,"P008");
	    });

	google.maps.event.addDomListener(P009, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P009_030.txt"
		    clearMarkers();
		useCallback(url,"P009");
	    });

	google.maps.event.addDomListener(P010, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P010_030.txt"
		    clearMarkers();
		useCallback(url,"P010");
	    });

	google.maps.event.addDomListener(P011, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P011_030.txt"
		    clearMarkers();
		useCallback(url,"P011");
	    });

	google.maps.event.addDomListener(P012, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P012_030.txt"
		    clearMarkers();
		useCallback(url,"P012");
	    });

	google.maps.event.addDomListener(P013, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P013_030.txt"
		    clearMarkers();
		useCallback(url,"P013");
	    });

	google.maps.event.addDomListener(P014, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P014_030.txt"
		    clearMarkers();
		useCallback(url,"P014");
	    });

	google.maps.event.addDomListener(P015, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P015_030.txt"
		    clearMarkers();
		useCallback(url,"P015");
	    });

	google.maps.event.addDomListener(P016, 'click', function() {
		var url = "http://geoweb.princeton.edu/people/simons/SOM/P016_030.txt"
		    clearMarkers();
		useCallback(url,"P016");
	    });


}
