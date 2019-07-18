/**
   Map class
   @author Jonah Rubin
   @author Frederik Simons
   07/18/2019
*/

function initMap(listener) {
    // ID the map
    let mapDiv = document.getElementById('map');

    // store data points
    let dataPoints = [];

    // keep track of markers and their info windows
    let markers = [];
    let iwindows = [];
    let markerIndex = -1;

    // some default locations
    let guyot = {lat: 40.34585, lng: -74.65475};
    let papeete = {lat: -17.53733, lng: -149.5665};

    // our default map center
    let map = new google.maps.Map(mapDiv, {
	    // zoom: 13,
	    // center: papeete
	    disableDefaultUI: true,
	    zoomControl: true,
	    mapTypeControl: true,
	    scaleControl: true,
	    streetViewControl: false,
	    rotateControl: false,
	    fullscreenControl: true
	});

    var DataType = {
        TEXT: 1,
        BINARY: 2
    };

    // landing page
    useCallback("all");

    //other option: terrain
    map.setMapTypeId('satellite');

    // for rounding to three decimal places
    function roundit(num) {
        return parseFloat(num).toFixed(3);
    }

    // add data to map
    function addToMap(data, name) {
        let empty = Boolean(false);
	
        // scrape data from text callback response
        let rows = data.split('\n');
	
	if (rows.length <= 1) {
            empty = Boolean(true);
        }
	
	if (empty === false) {
	    
	    for (let i = 0; i < rows.length - 1; i++) {
                let corrupted = Boolean(false);
                let elements = rows[i].split(/\s+/);

                // check to make sure everything but the date is a number
                for (let j = 3; j < elements.length; j++) {
                    if (isNaN(elements[j])) {
                        console.log("Corrupted");
                        corrupted = Boolean(true);
                    }
                }

                // store each data point as an object
                if (corrupted === false) {
		    let dataPoint = new DataPoint(elements[0], elements[1] + " " + elements[2],
						  elements[3], elements[4], elements[5],
						  elements[6], elements[7], elements[8],
						  elements[9], elements[10], elements[11],
						  elements[12], elements[13], elements[14]);
                    dataPoints.push(dataPoint);
                }
            }

            // sort by date to make sure the datapoints are in
            // order from oldest to newest, which for "all"
            // requires work but for the individual floats the
            // input came sorted already
            dataPoints = selectionSort(dataPoints);

            // set up panning bounds
            let bounds = new google.maps.LatLngBounds();

            // set up variables
            let legLength;
            let legSpeed;
            let legTime;
            let netDisplacement;
            let totalDistance;
            let totalTime;
            let avgVelocity;
            let marker;

            // iterate over arrays, placing markers
            for (let i = 0; i < dataPoints.length; i++) {
                let latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

                // set up marker, fade on age, unless using the 'all' option
                if (name === 'all') {
		    marker = new google.maps.Marker({
			    position: latLng,
			    map: map,
			    clickable: true

			    // opacity between a minop and maxop
			    // opacity: (i + 1) / dataPoints.length
			});
                } else {
		    marker = new google.maps.Marker({
			    position: latLng,
			    map: map,
			    clickable: true,
			    opacity: (i + 1) / dataPoints.length
			});
                }

                // Alternate coloring for floats...
		if (dataPoints[i].name[0:3] === "P007") {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
		} else if (dataPoints[i].name[0] === "P") {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/orange-dot.png');
                } else if (dataPoints[i].name[0] === "N") {
                    marker.setIcon('http://maps.google.com/mapfiles/ms/icons/red-dot.png');
                }

                // expand bounds to fit all markers
                bounds.extend(marker.getPosition());

                // first datapoint initialized to 0
                if (i === 0) {
                    legLength = 0;
                    legSpeed = 0;
                    legTime = 0;
                    netDisplacement = 0;
                    totalDistance = 0;
                    totalTime = 0;
                    avgVelocity = 0;
		    
                } else {
                    // net calculations for each datapoint
                    netDisplacement = getDisplacement(dataPoints[0], dataPoints[i]) / 1000;
                    totalDistance = getDistance(dataPoints.slice(0, i+1)) / 1000;
                    totalTime = getTimeElapsed(dataPoints[0], dataPoints[i]);

                    if (totalTime === 0) {
                        avgVelocty = 0;
                    } else {
                        avgVelocity = (totalDistance / totalTime);
                    }
		    
                    // get displacement in m, convert to kilometers
                    legLength = getDisplacement(dataPoints[i-1], dataPoints[i]) / 1000;
                    legTime = getTimeElapsed(dataPoints[i-1], dataPoints[i]);

                    // avoid division by zero when calculating velocity
                    if (legTime === 0) {
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
            let listener = google.maps.event.addListener(map, "idle", function() {
		    if (map.getZoom() > 13) map.setZoom(13);
		    google.maps.event.removeListener(listener);
		});
        }
    }

    // for dynamic info windows
    function setInfoWindow(i, marker, netDisplacement, totalDistance, avgVelocity,
                           totalTime, legLength, legSpeed, legTime) {
        makeWMSrequest(dataPoints[i]);
	
        google.maps.event.addListener(marker, 'click', function(event) {
		// close existing windows
		closeIWindows();
		markerIndex = i;
		
		// Pan to include entire infowindow
		let center = new google.maps.LatLng(
						    parseFloat(marker.position.lat()),
						    parseFloat(marker.position.lng())
						    );
		map.panTo(center);
		
		// info window preferences
		let iwindow = new InfoBubble({
			maxWidth: 320,
			maxHeight: 250,
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
		let floatTabContent = '<div id="tabContent">' +
		    '<b>Float Name:</b> '              + dataPoints[i].name +
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
		    '<br/><b>Net Displacement:</b> '   + roundit(netDisplacement) + ' km' +
		    '<br/><b>GEBCO WMS Depth:</b> '    + dataPoints[i].wmsdepth + ' m';

		// content for earthquake tabs
		let earthquakeTabContent = '<div id="tabContent">' +
		    '<b>Code:</b> ' + "/* filler */" +
		    '<br/><b>UTC Date:</b> ' + "/* filler */" +
		    '<br/><b>Your Date:</b> ' + "/* filler */" +
		    '<br/><b>Lat/Lon:</b> ' + "/* filler */" +
		    '<br/><b>Magnitude:</b> ' + "/* filler */" +
		    '<br/><b>Great Circle Distance:</b> ' + "/* filler */" +
		    '<br/><b>Source:</b> ' + "/* filler */";
		
		let floatName = '<div id="tabNames">' + '<b>Float Info</b> ';
		
		let earthquakeName = '<div id="tabNames">' + '<b>EarthQuake Info</b> ';

		let seismograms = '<div id="tabNames">' + '<b>Seismograms</b> ';

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
	for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers.length = 0;
        dataPoints.length = 0;
        closeIWindows();
    }

    // close ALL info windows (stuff could have been left hanging if you click too quickly)
    function closeIWindows() {
        for (let i = 0; i < iwindows.length; i++) {
            iwindows[i].close();
        }
        iwindows = [];
    }

    // handles async use of data
    function useCallback(name) {
        clearMarkers();

        let url;
        if (name === "all") {
            url = "http://geoweb.princeton.edu/people/simons/SOM/all.txt";
        } else {
            url = "http://geoweb.princeton.edu/people/simons/SOM/" + name + "_030.txt";
        }

        // This is using the get function defined in fileReader.js
        resp = get(DataType.TEXT, url,
		   // this callback is invoked after the response arrives
		   function() {
		       let data = this.responseText;
		       addToMap(data, name);
		   });
    }

    // function useBinCallback(url) {
    //     resp = getBin(url,
    //         // this callback is invoked after the response arrives
    //         function() {
    //             let blob = this.response;
    //             let reader = new FileReader();
    //
    //             reader.addEventListener("loadend", function() {
    //                 ab = reader.result;
    //                 let sacFile = new SacFile(ab);
    //             });
    //
    //             reader.readAsArrayBuffer(blob);
    //         });
    //
    // }

    function useBinCallback(url) {
        resp = getBin(DataType.BINARY, url,
		      // this callback is invoked after the response arrives
		      function() {
			  let blob = this.response;
			  let reader = new FileReader();

			  reader.addEventListener("loadend", function() {
				  ab = reader.result;
				  let sacFile = new SacFile(ab);
			      });

			  reader.readAsArrayBuffer(blob);
		      });

    }


    setUpEvents();

    //################################################################################//
    //  We used to  make individual buttons like this

    // // clear
    // google.maps.event.addDomListener(clear, 'click', function() {
    // 	clearMarkers();
    //     });

    // google.maps.event.addDomListener(all, 'click', function() {
    // 	useCallback("all");
    //     });

    // google.maps.event.addDomListener(P006, 'click', function() {
    // 	useCallback("P006");
    //     });

    // and then one for every explicit number, but now that is all replaced by:

    function setUpEvents() {
        // make buttons dynamically - ALL numbers generated (but see below)... up  to:
        // this is the maximum
        const numFloats = 25;
        addEvents("all");
        markerIndex = 0;

        // autogenerate "numFloats" events
        // if they do not exist, the button will not be created
        for (let i = 0; i <= numFloats; i++) {
            let floatID;
            if (i < 10) {
                floatID = ("P00" + i.toString());
            } else if (i < 100) {
                floatID = ("P0" + i.toString());
            } else {
                floatID = ("P" + i.toString());
            }

            addEvents(floatID);
        }

        // float events
        function addEvents(id) {
            try {
                google.maps.event.addDomListener(document.getElementById(id), 'click', function() {
			useCallback(id);
			markerIndex = 0;
		    });
            }
	    // If in the index there wasn't one needed  it doesn't get made
            catch(err) {
                console.log(err.message);
            }
        }

        // sac event
        // google.maps.event.addDomListener(plot, 'click', function() {
	// 	let url = "http://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/testSAC2.SAC";
	// 	useBinCallback(url);
	//     });
	
        // clear event
        google.maps.event.addDomListener(clear, 'click', function() {
		clearMarkers();
	    });
    }

    // enable moving through markers with arrow keys
    google.maps.event.addDomListener(document, 'keyup', function(e) {
	    let code = (e.keyCode ? e.keyCode : e.which);
	    if (markerIndex !== -1) {
		if (code === 39 && markerIndex < markers.length - 1) {
		    markerIndex++;
		    google.maps.event.trigger(markers[markerIndex], 'click');

		} else if (code === 37 && markerIndex > 1) {
		    markerIndex--;
		    google.maps.event.trigger(markers[markerIndex], 'click');
		}
	    }
	});
}
