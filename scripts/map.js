/**
   Map class
   @author Jonah Rubin and Frederik J Simons 10/31/2021
*/

function initMap(listener) {
	// ID the map
	let mapDiv = document.getElementById('map');

	// store data points
	let dataPoints = [];

	// set up slideshow
	let slideShowOn = false;
	const slideShowInterval = 3000;

	// keep track of markers and their info windows
	const numFloats = 54;
	let markers = [];
	let iwindows = [];
	let markerIndex = -1;
	let floatIDS = [];
	let currFloat = "";
	let showAll = false;
	let showTail = "_030.txt";

	// legend initial state
	let showDict = {
		"geoazur": true,
		"dead": true,
		"princeton": true,
		"sustech": true,
		"jamstec": true,
		"stanford": true
	};

	// some default locations
	let guyot = { lat: 40.34585, lng: -74.65475 };
	let papeete = { lat: -17.53733, lng: -149.5665 };

	// set up icons
	let iconBase = 'http://maps.google.com/mapfiles/ms/icons/';
	let icons = {
		geoazur: {
			name: 'Géoazur',
			icon: iconBase + 'blue-dot.png'
		},
		sustech: {
			name: 'SUSTech',
			icon: iconBase + 'yellow-dot.png'
		},
		princeton: {
			name: 'Princeton',
			icon: iconBase + 'orange-dot.png'
		},
		jamstec: {
			name: 'JAMSTEC',
			icon: iconBase + 'red-dot.png'
		},
		stanford: {
			name: 'Stanford',
			icon: iconBase + 'green-dot.png'
		},
		dead: {
			name: 'Inactive',
			icon: iconBase + 'purple-dot.png'
		}
	};

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

	var IconColor = {};

	// legend generation
	var legend = document.getElementById('legend');
	for (var key in icons) {
		var type = icons[key];
		var name = type.name;
		var icon = type.icon;
		var div = document.createElement('div');
		div.innerHTML = '<img src="' + icon + '" id="' + name + '">' + type.name;

		legend.appendChild(div);

		legendClosure(name, key);
	}

	var toggle = document.getElementById('toggle');
	var div2 = document.createElement('div');
	var toggleSrc = "http://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/aux/history.png";
	div2.innerHTML = '<img src="' + toggleSrc + '" id="' + 'toggleButton' + '">';

	google.maps.event.addDomListener(document.getElementById('toggle'), 'click', function () {
		showAll = !showAll;
		if (showAll === false) {
			showTail = '_030.txt';
		} else {
			showTail = '_all.txt';
		}

		console.log("show all: " + showAll);

		// convert id then use
		handlePlotRequest(currFloat);

	});

	toggle.appendChild(div2);

	map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
	map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(toggle);

	handlePlotRequest("all");

	//other option: terrain
	map.setMapTypeId('satellite');

	// for rounding to three decimal places
	function roundit(num) {
		return parseFloat(num).toFixed(3);
	}

	// enabling legend toggling without hanging in the last state
	function legendClosure(name, key) {
		google.maps.event.addDomListener(document.getElementById(name), 'click', function () {
			// the real legend toggling
			showDict[key] = !showDict[key];
			handlePlotRequest("all");
		});
	}

	// add data to map
	async function addToMap(data, name) {
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
				// The next "if" wasn't there for a good while, latest change
				if (elements.length !== 15)
					corrupted = Boolean(true);
				else {
					// check to make sure everything but the date is a number
					for (let j = 3; j < elements.length; j++) {
						if (isNaN(elements[j])) {
							console.log("Corrupted");
							corrupted = Boolean(true);
						}
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

			console.log("datapoints size given name: " + name + "  " + dataPoints.length);

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
				if (showDict[dataPoints[i].owner] === true) {
					if (name === 'all') {
						marker = new google.maps.Marker({
							position: latLng,
							map: map,
							clickable: true
						});
					} else {
						// if (slideShowOn === true) {
						//     await sleep(1000);
						// }
						// // expand bounds to fit all markers
						// bounds.extend(marker.getPosition());

						marker = new google.maps.Marker({
							position: latLng,
							map: map,
							clickable: true,
							// opacity between a minop and maxop
							opacity: (i + 1) / dataPoints.length
						});
					}

					// Alternate coloring for floats..
					// GEOAZUR MERMAIDs
					if (dataPoints[i].owner === "geoazur") {
						marker.setIcon(icons.geoazur.icon);
						// Dead MERMAIDs
					} else if (dataPoints[i].owner === "dead") {
						marker.setIcon(icons.dead.icon);
						// SUSTECH MERMAIDs
					} else if (dataPoints[i].owner === "sustech") {
						marker.setIcon(icons.sustech.icon);
						// Princeton MERMAIDs
					} else if (dataPoints[i].owner === "princeton") {
						marker.setIcon(icons.princeton.icon);
						// Stanford MERMAIDs
					} else if (dataPoints[i].owner === "stanford") {
						marker.setIcon(icons.stanford.icon);
						// JAMSTEC MERMAIDs
					} else if (dataPoints[i].owner === "jamstec") {
						marker.setIcon(icons.jamstec.icon);
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
						totalDistance = getDistance(dataPoints.slice(0, i + 1)) / 1000;
						totalTime = getTimeElapsed(dataPoints[0], dataPoints[i]);

						if (totalTime === 0) {
							avgVelocty = 0;
						} else {
							avgVelocity = (totalDistance / totalTime);
						}

						// get displacement in m, convert to kilometers
						legLength = getDisplacement(dataPoints[i - 1], dataPoints[i]) / 1000;
						legTime = getTimeElapsed(dataPoints[i - 1], dataPoints[i]);

						// avoid division by zero when calculating velocity
						if (legTime === 0) {
							legSpeed = 0;
						} else {
							legSpeed = legLength / legTime;
						}
					}

					let allPage = name === 'all';

					// create info windows
					setInfoWindow(allPage, i, marker, netDisplacement, totalDistance, avgVelocity,
						totalTime, legLength, legSpeed, legTime);

					markers.push(marker);
				}
			}

			// pan to bounds
			// updated to use a min zoom (13) to avoid missing imagery
			map.fitBounds(bounds);
			let listener = google.maps.event.addListener(map, "idle", function () {
				if (map.getZoom() > 12) map.setZoom(12);
				google.maps.event.removeListener(listener);
			});
		}
	}

	function handlePlotRequest(name) {
		currFloat = name;
		getFloatData(name).then((value) => {
			console.log(value);
			addToMap(value, name);
		});
	}

	// for dynamic info windows
	function setInfoWindow(allPage, i, marker, netDisplacement, totalDistance, avgVelocity,
		totalTime, legLength, legSpeed, legTime) {

		makeWMSrequest(dataPoints[i]);

		google.maps.event.addListener(marker, 'click', function (event) {
			// close existing windows
			closeIWindows();
			markerIndex = i;
			// Pan to include entire infowindow
			let offset = -0.32 + (3000000) / (1 + Math.pow((map.getZoom() / 0.0055), 2.07));
			let center = new google.maps.LatLng(
				parseFloat(marker.position.lat() + offset /2),
				parseFloat(marker.position.lng())
			);
			map.panTo(center);

			// info window preferences
			let iwindow = new InfoBubble({
				maxWidth: 320,
				maxHeight: 265,
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

			let floatTabContent;

			if (allPage === true) {
				// content for float data tab
				floatTabContent = '<div id="tabContent">' +
					'<b>Float Name:</b> ' + dataPoints[i].name +
					'<br/><b>UTC Date:</b> ' + dataPoints[i].stdt +
					'<br/><b>Your Date:</b> ' + dataPoints[i].loct +
					'<br/><b>GPS Lat/Lon:</b> ' + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
					'<br/><b>GPS Hdop/Vdop:</b> ' + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
					'<br/><b>Battery:</b> ' + dataPoints[i].Vbat + ' mV' +
					'<br/><b>Internal Pressure:</b> ' + dataPoints[i].Pint + ' Pa' +
					'<br/><b>External Pressure:</b> ' + dataPoints[i].Pext + ' mbar' +
					'<br/> ' +
					'<br/><b>Total Time:</b> ' + roundit(totalTime) + ' h' +
					'<br/><b>Distance Travelled:</b> ' + roundit(totalDistance) + ' km' +
					'<br/><b>Average Speed:</b> ' + roundit(avgVelocity) + ' km/h' +
					'<br/><b>Net Displacement:</b> ' + roundit(netDisplacement) + ' km' +
					'<br/><b>GEBCO WMS Depth:</b> ' + dataPoints[i].wmsdepth + ' m';
			} else {
				// content for float data tab
				floatTabContent = '<div id="tabContent">' +
					'<b>Float Name:</b> ' + dataPoints[i].name +
					'<br/><b>UTC Date:</b> ' + dataPoints[i].stdt +
					'<br/><b>Your Date:</b> ' + dataPoints[i].loct +
					'<br/><b>GPS Lat/Lon:</b> ' + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
					'<br/><b>GPS Hdop/Vdop:</b> ' + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
					'<br/><b>Battery:</b> ' + dataPoints[i].Vbat + ' mV' +
					'<br/><b>Internal Pressure:</b> ' + dataPoints[i].Pint + ' Pa' +
					'<br/><b>External Pressure:</b> ' + dataPoints[i].Pext + ' mbar' +
					'<br/> ' +
					'<br/><b>Leg Length:</b> ' + roundit(legLength) + ' km' +
					'<br/><b>Leg Time:</b> ' + roundit(legTime) + ' h' +
					'<br/><b>Leg Speed:</b> ' + roundit(legSpeed) + ' km/h' +

					'<br/><b>Total Time:</b> ' + roundit(totalTime) + ' h' +
					'<br/><b>Distance Travelled:</b> ' + roundit(totalDistance) + ' km' +
					'<br/><b>Average Speed:</b> ' + roundit(avgVelocity) + ' km/h' +
					'<br/><b>Net Displacement:</b> ' + roundit(netDisplacement) + ' km' +
					'<br/><b>GEBCO WMS Depth:</b> ' + dataPoints[i].wmsdepth + ' m';
			}
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
	async function getFloatData(name) {
		clearMarkers();

		let url;
		if (name === "all") {
			url = "http://geoweb.princeton.edu/people/simons/SOM/all.txt";
		} else {
			url = "http://geoweb.princeton.edu/people/simons/SOM/" + name + showTail;
		}

		let dataPromise = fetchAndDecodeFloatData(url, 'text');
		let values = await Promise.all([dataPromise]);
		return values[0];

	}

	setUpEvents();

	//################################################################################//
	//  We used to  make individual buttons like this
	// // clear
	// google.maps.event.addDomListener(clear, 'click', function() {
	// 	clearMarkers();
	//     });
	// google.maps.event.addDomListener(all, 'click', function() {
	// 	getFloatData("all");
	//     });
	// google.maps.event.addDomListener(P006, 'click', function() {
	// 	getFloatData("P006");
	//     });
	// and then one for every explicit number, but now that is all replaced by:

	function setUpEvents() {
		// make buttons dynamically - ALL numbers generated (but see below)... up to: numFloats
		// this is the maximum. Also need to set the labels explicitly in ../index.html.
		addEvents("all");
		markerIndex = 0;
		allFloats = getAllFloatNames();

		// autogenerate "numFloats" events
		// if they do not exist, the button will not be created
		for (let i = 0; i <= allFloats.length; i++) {
			addEvents(allFloats[i]);
		}

		// float events
		function addEvents(id) {
			try {
				google.maps.event.addDomListener(document.getElementById(id), 'click', function (referer) {
					if (referer !== "slideShow") {
						slideShowOn = false;
					}
					handlePlotRequest(id);
					markerIndex = 0;
				});
				floatIDS.push(id);
			}
			// If in the index there wasn't one needed it doesn't get made
			catch (err) {
				console.log(err.message);
			}
		}
		// sac event
		// google.maps.event.addDomListener(plot, 'click', function() {
		// 	let url = "http://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/testSAC2.SAC";
		// 	    useBinCallback(url);
		//     });

		// clear event
		google.maps.event.addDomListener(clear, 'click', function () {
			clearMarkers();
			slideShowOn = false;
		});

		// slideshow event
		google.maps.event.addDomListener(slide, 'click', function () {
			slideShow();
		});
	}

	// enable moving through markers with arrow keys
	google.maps.event.addDomListener(document, 'keyup', function (e) {
		let code = (e.keyCode ? e.keyCode : e.which);
		if (markerIndex !== -1) {
			if (code === 39) {
				if (markerIndex === markers.length - 1) {
					markerIndex = 0;
				} else {
					markerIndex++;
				}
				google.maps.event.trigger(markers[markerIndex], 'click');

			} else if (code === 37) {
				if (markerIndex === 0) {
					markerIndex = markers.length - 1
				} else {
					markerIndex--;
				}
				google.maps.event.trigger(markers[markerIndex], 'click');

			} else if (code === 27) {
				closeIWindows();
			}
		}
	});

	function sleep(ms) {
		return new Promise(resolve => setTimeout(resolve, ms));
	}

	async function slideShow() {
		if (slideShowOn === false) {
			slideShowOn = true;
			for (let i = 1; i < floatIDS.length; i++) {

				if (slideShowOn === true && showDict[getOwner(floatIDS[i])] === true) {
					let referer = "slideShow";
					google.maps.event.trigger(document.getElementById(floatIDS[i]), 'click', referer);
					await sleep(slideShowInterval);
					if (i >= floatIDS.length - 1) {
						i = 1;
					}
				}
			}
		} else {
			slideShowOn = false;
		}
	}
}
