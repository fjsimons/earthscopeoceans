/**
	Map class
	@author Jonah Rubin
	@author Frederik Simons
	11/20/2018
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

	// our default map center
	var map = new google.maps.Map(mapDiv, {
		// zoom: 13,
		// center: papeete
	});

	// landing page
	useCallback("all");
	console.log("here");

	//other option: terrrain
	map.setMapTypeId('satellite');

        // place marker
	// var marker = new google.maps.Marker({
	// position: papeete,
	// 	map: map
	// });

	// for rounding to two decimal places
	function roundit(num) {
		return parseFloat(num).toFixed(3);
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

			// check to make sure everything but the date is a number
			for (var j = 3; j < elements.length; j++) {
			    if (isNaN(elements[j])) {
				corrupted = new Boolean(true);

			    }
			}

			// store each data point as an object
			if (corrupted == false) {

			    var dataPoint = new DataPoint(elements[0], elements[1] + " " + elements[2],
							  elements[3], elements[4],elements[5],
							  elements[6], elements[7],elements[8],
							  elements[9], elements[10], elements[11],
							  elements[12], elements[13], elements[14]);
			    dataPoints.push(dataPoint);
			}
		    }

		// set up panning bounds
		var bounds = new google.maps.LatLngBounds();

		// set up variables
		var legLength;
		var legSpeed;
		var legTime;
		var netDisplacement;
		var totalDistance;
		var totalTime;
		var avgVelocity;

		// iterate over arrays, placing markers
		for (var i = 0; i < dataPoints.length; i++) {
			var latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

			// set up marker, fade on age, unless using the 'all' option
			if (dataPoints[i].name === 'all') {
				var marker = new google.maps.Marker({
					position: latLng,
					map: map,
					clickable: true
				});
			} else {
				var marker = new google.maps.Marker({
					position: latLng,
					map: map,
					clickable: true,
					opacity: (i + 1) / dataPoints.length
				});
			}

			// expand bounds to fit all markers
			bounds.extend(marker.getPosition());

			// first datapoint initialized to 0
			if (i == 0) {
				legLength = 0;
				legSpeed = 0;
				legTime = 0;
				netDisplacement = 0;
				totalDistance = 0
				totalTime = 0;
				avgVelocity = 0;

			} else {
					// net calculations for each datapoint
					netDisplacement = getDisplacement(dataPoints[0], dataPoints[i])/1000;
					totalDistance = getDistance(dataPoints.slice(0, i+1)) / 1000;
					totalTime = getTimeElapsed(dataPoints[0], dataPoints[i]);

				if (totalTime == 0) {
					avgVelocty = 0
				} else {
						avgVelocity = (totalDistance / totalTime);
			}

				// get displacement in m, convert to kilometers
				legLength = getDisplacement(dataPoints[i-1], dataPoints[i]) / 1000;
				legTime = getTimeElapsed(dataPoints[i-1], dataPoints[i]);

				// avoid division by zero when calculating velocity
				if (legTime == 0) {
					legSpeed = 0;
				} else {
					legSpeed = legLength / legTime;
				}
			}

			// create info windows
			setInfoWindow(i, marker, netDisplacement, totalDistance, avgVelocity,
				            totalTime, legLength, legSpeed, legTime);

			markers.push(marker);
		}

		// pan to bounds
		// updated to use a min zoom (13) to avoid missing imagery
		map.fitBounds(bounds);
		var listener = google.maps.event.addListener(map, "idle", function() {
  		if (map.getZoom() > 13) map.setZoom(13);
  		google.maps.event.removeListener(listener);
		});

		}
	}

	// for dynamic info windows
	function setInfoWindow(i, marker, netDisplacement, totalDistance, avgVelocity,
								                     totalTime, legLength, legSpeed, legTime) {

		google.maps.event.addListener(marker, 'click', function(event) {
			// close existing windows
			closeIWindows();

			// info window preferences
			var  iwindow = new InfoBubble({
				maxWidth: 320,
				maxHeight: 230,
				shadowStyle: 1,
				padding: 10,
				backgroundColor: 'rgb(255,255,255)',
				borderRadius: 4,
				arrowSize: 20,
				borderWidth: 2,
				borderColor: '#000F35',
				disableAutoPan: true,
				hideCloseButton: false,
				arrowPosition: 30,
				backgroundClassName: 'phoney',
				arrowStyle: 0,
				disableAnimation: 'true'
			});

			// content for float data tab
			var floatTabContent = '<div id="tabContent">' +
							 '<b>Float Name:</b> '    + dataPoints[i].name +
							 '<br/><b>UTC Date:</b> '           + dataPoints[i].stdt +
							 '<br/><b>Your Date:</b> '          + dataPoints[i].loct +
							 '<br/><b>GPS Lat/Lon:</b> '        + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
							 '<br/><b>GPS Hdop/Vdop:</b> '      + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
							 '<br/><b>Battery:</b> '            + dataPoints[i].Vbat + ' mV' +
							 '<br/><b>Internal Pressure:</b> '  + dataPoints[i].Pint + ' Pa' +
							 '<br/><b>External Pressure:</b> '  + dataPoints[i].Pext + ' mbar' +
							 '<br/> ' +
							 '<br/><b>Leg Length:</b> '         + roundit(legLength) + ' km' +
							 '<br/><b>Leg Time:</b> '           + roundit(legTime) + ' h' +
							 '<br/><b>Leg Speed:</b> '          + roundit(legSpeed) + ' km/h' +

							 '<br/><b>Total Time:</b> '         + roundit(totalTime) + ' h' +
							 '<br/><b>Distance Travelled:</b> ' + roundit(totalDistance) + ' km' +
							 '<br/><b>Average Speed:</b> '      + roundit(avgVelocity) + ' km/h' +
							 '<br/><b>Net Displacement:</b> '   + roundit(netDisplacement) + ' km'

			// content for earthquake tabs
			var earthquakeTabContent = '<div id="tabContent">' +
							 '<b>Code:</b> '    + "/* filler */" +
							 '<br/><b>UTC Date:</b> '           + "/* filler */" +
							 '<br/><b>Your Date:</b> '          +"/* filler */" +
							 '<br/><b>Lat/Lon:</b> '        + "/* filler */" +
							 '<br/><b>Magnitude:</b> '      + "/* filler */" +
							 '<br/><b>Great Circle Distance:</b> '            +"/* filler */" +
							 '<br/><b>Source:</b> ' +"/* filler */"

			var floatName      = '<div id="tabNames">' + '<b>Float Info</b> '

			var earthquakeName = '<div id="tabNames">' + '<b>EarthQuake Info</b> '

			var seismograms    = '<div id="tabNames">' + '<b>Seismograms</b> '

			// add info window tabs
			iwindow.addTab(floatName, floatTabContent);
			// iwindow.addTab(earthquakeName, earthquakeTabContent);
			// iwindow.addTab(seismograms, "");

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
		closeIWindows();
	}

	// close all info windows
	function closeIWindows() {
		if (iwindows.length == 1) {
			iwindows[0].close();
			iwindows = [];
		}
	}

	// handles async use of data
	function useCallback(name) {
		clearMarkers();

		var url;
		if (name === "all") {
			url = "http://geoweb.princeton.edu/people/simons/SOM/all.txt";
		} else {
			url = "http://geoweb.princeton.edu/people/simons/SOM/" + name + "_030.txt";
		}


	    resp = get(url,
		       // this callback is invoked after the response arrives

		       function () {
			   var data  = this.responseText;
			   addToMap(data, name);
		       }
		       );

	}

	function useBinCallback(url) {
	    resp = getBin(url,
			  // this callback is invoked after the response arrives
			  function () {
			      var blob = this.response;
			      var reader = new FileReader();

			      reader.addEventListener("loadend", function() {
				      ab = reader.result;
				      var sacFile = new SacFile(ab);
				  });

			      reader.readAsArrayBuffer(blob);
			  }
			  );

	}

	//################################################################################//
	// make buttons dynamically 
	// var floatIDs = [P006, P007, P008, P009, P010, P011, P012];
	//
	//
	// for (var i = 0; i < floatIDs.length; i++) {
	// 	google.maps.event.addDomListener(floatIDs[i], 'click', function() {
	//
	// 		useCallback(floatStrs[i]);
	// 	});
	//
	// }

		// listen for use of scrollbar

		google.maps.event.addDomListener(plot, 'click', function() {
				var url = "http://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/testSAC2.SAC"
				useBinCallback(url);

				});

			// clear
			google.maps.event.addDomListener(clear, 'click', function() {
				clearMarkers();
			    });


			google.maps.event.addDomListener(all, 'click', function() {
				useCallback("all");
			    });

			google.maps.event.addDomListener(P006, 'click', function() {
				useCallback("P006");
			    });

			google.maps.event.addDomListener(P007, 'click', function() {
				useCallback("P007");
			    });

			google.maps.event.addDomListener(P008, 'click', function() {
				useCallback("P008");
			    });

			google.maps.event.addDomListener(P009, 'click', function() {
				useCallback("P009");
			    });

			google.maps.event.addDomListener(P010, 'click', function() {
				useCallback("P010");
			    });

			google.maps.event.addDomListener(P011, 'click', function() {
				useCallback("P011");
			    });

			google.maps.event.addDomListener(P012, 'click', function() {
				useCallback("P012");
			    });

			google.maps.event.addDomListener(P013, 'click', function() {
				useCallback("P013");
			    });

			google.maps.event.addDomListener(P016, 'click', function() {
				useCallback("P016");
			    });

			google.maps.event.addDomListener(P017, 'click', function() {
				useCallback("P017");
			    });

			google.maps.event.addDomListener(P018, 'click', function() {
				useCallback("P018");
			    });

			google.maps.event.addDomListener(P019, 'click', function() {
				useCallback("P019");
			    });

			google.maps.event.addDomListener(P020, 'click', function() {
				useCallback("P020");
			    });

			google.maps.event.addDomListener(P021, 'click', function() {
				useCallback("P021");
			    });

			google.maps.event.addDomListener(P022, 'click', function() {
				useCallback("P022");
			    });

			google.maps.event.addDomListener(P023, 'click', function() {
				    clearMarkers();
				useCallback("P023");
			    });

			google.maps.event.addDomListener(P024, 'click', function() {
				    clearMarkers();
				useCallback("P024");
			    });

			google.maps.event.addDomListener(P025, 'click', function() {
				    clearMarkers();
				useCallback("P025");
			    });

		}
