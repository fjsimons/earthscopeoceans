/**
 * Map class
 @author Jonah Rubin, Stefan Kildal-Brandt, and Frederik J Simons 07/06/2022
*/

async function initMap(listener) {
    // ID the map
    let mapDiv = document.getElementById('map');
    
    // store data points
    let dataPoints = [];

    // set up slideshow
    let slideShowOn = false;
    const slideShowInterval = 6000;

    // keep track of markers and their info windows
    const numFloats = 67;
    let markers = [];
    let dropMarkers = [];
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

    //Initializing list of All EEZ and their coordinates
    let EEZList = await fetchAndDecodeFloatData('https://geoweb.princeton.edu/people/simons/earthscopeoceans/data/EEZData/AllEEZ','text');
    EEZList = JSON.parse(EEZList);
    let AllGeometries = await fetchAndDecodeFloatData('https://geoweb.princeton.edu/people/simons/earthscopeoceans/data/EEZData/AllGeometries','text');
    AllGeometries = JSON.parse(AllGeometries);

    // some default locations
    let guyot = { lat: 40.34585, lng: -74.65475 };
    let papeete = { lat: -17.53733, lng: -149.5665 };

    // set up icons found at https://sites.google.com/site/gmapsdevelopment/
    let iconBase = 'https://maps.google.com/mapfiles/ms/icons/';
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
        zoom: 7,
        // center: papeete
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: true,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: true,
        keyboardShortcuts: false,
        minZoom: 2,
        // maxZoom: 11,
        restriction: {latLngBounds: {
                    north: 85,
                    south: -85,
                    east: 360,
                    west: -360
                },
            },
        });

    var IconColor = {};
    
    //inialize dropListener variable on top scope so that the listener can
    //be removed at various places after it is enabled
    var dropListener;
    var markerNum;

    // legend generation
    var legend = document.getElementById('legend');
    legend.setAttribute('class','button-visible');
    for (var key in icons) {
        var type = icons[key];
        var name = type.name;
        var icon = type.icon;
        var div = document.createElement('div');
        div.innerHTML = '<div id="' + name + '_div"><img src="' + icon + '" id="' + name + '" style=cursor:pointer;"/>' + type.name + '</div>';

        legend.appendChild(div);

        legendClosure(name, key);
    }

    //Creates toggle button and drop pin button and configures their html/css
    var toggle = document.getElementById('toggle');
    toggle.setAttribute('class', 'button-hidden');
    var toggleSrc = "https://geoweb.princeton.edu/people/simons/earthscopeoceans/aux/history.png";
    var revToggleSrc = "https://geoweb.princeton.edu/people/simons/earthscopeoceans/aux/future.png";
    var div2 = document.createElement('div');
    div2.innerHTML = '<img src="' + toggleSrc + '" id="' + 'toggleButton' + '">';
    let dropButton = document.getElementById('drop-button');
    dropButton.setAttribute('class', 'button-visible');
    let dropButtonSrc = "https://geoweb.princeton.edu/people/sk8609/DEVearthscopeoceans/aux/dropper.png"
    let div3 = document.createElement('div');
    div3.innerHTML = '<img src="' + dropButtonSrc + '" id="' + 'drop-button-div' + '">';

    //Adds functionality to the toggle button
    google.maps.event.addDomListener(toggle, 'click', function () {
            if (dropListener){
                google.maps.event.removeListener(dropListener);
            }
            showAll = !showAll;
            if (showAll === false) {
                showTail = '_030.txt';
            } else {
                showTail = '_all.txt';
            }
            if(showAll === true) {
                document.getElementById('toggleButton').src=revToggleSrc
            }
            else {
                document.getElementById('toggleButton').src=toggleSrc
            }

            // convert id then use
            handlePlotRequest(currFloat);
        });
    
    //Adds functionality to the drop pin button
    google.maps.event.addDomListener(dropButton, 'click', function (dropEvent) {
            if(dropListener) {
                google.maps.event.removeListener(dropListener);
            }
            dropListener = google.maps.event.addDomListener(map, 'click', async function(dropEvent) {
                    //Add a marker based on where map is clicked
                    marker = new google.maps.Marker({
                            position: dropEvent.latLng,
                            map: map,
                            clickable: true,
                            icon: "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",
                            title: markerNum.toString(),
                        });
                    markerNum++;
                    let lat = dropEvent.latLng.toJSON().lat.toFixed(6);
                    let lng = dropEvent.latLng.toJSON().lng.toFixed(6);
                    EEZ = await eezFinder(lat, lng, EEZList, AllGeometries);
                    GEBCODepth = await makeWMSrequestCoords(lat, lng);
                    dropMarkers.push(marker);
                    //Sets an info marker for the map
                    await setInfoWindow('drop', 0, 0, marker, 0, 0, 0, 0, 0, 0, 0, GEBCODepth, EEZ, lat, lng);
                    google.maps.event.trigger(marker, 'click');
                    google.maps.event.removeListener(dropListener);
                });

        });

    toggle.appendChild(div2);
    dropButton.appendChild(div3);

    //Places the buttons in their respective quadrants of the map
    map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(legend);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(dropButton);
    map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(toggle);

    handlePlotRequest("all");

    //other option: terrain
    map.setMapTypeId('satellite');

    // for rounding to  decimal places
    function roundit(num,dex) {
        return parseFloat(num).toFixed(dex);
    }

    // enabling legend toggling without hanging in the last state
    function legendClosure(name, key) {
        google.maps.event.addDomListener(document.getElementById(name + '_div'), 'click', function () {
            // the real legend toggling
            showDict[key] = !showDict[key];
            if (showDict[key]!=true) {
                document.getElementById(name).src="https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png";
            } else {
                document.getElementById(name).src=icons[key].icon;
            }
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
                if (elements.length !== 15) {
                    corrupted = Boolean(true);
                } else {
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
            let EEZ;
            let GEBCODepth;
            let marker;
    
            // iterate over arrays, placing markers
            let k = 0; //k value labels floats in cases where some are turned off in legend (fixes problems with arrow keys on map)
            let initial=0;
            let data;

            //Grab data for floats given the tab the map is currentlu in
            if (name === 'all') {
                data = await grabAllData();
            }
            else {
                data = await grabIndData(name);
            }
            //Properly account for the index of the data table given we are only looking for the most recent 30 float points
            let iniIndex=0;
            if (showAll === false){
                iniIndex=data.length-60;
                if(iniIndex<0){
                    iniIndex=0;
                }
            }

            for (let i = 0; i < dataPoints.length; i++) {
                let latLng = new google.maps.LatLng(dataPoints[i].stla, dataPoints[i].stlo);

                // set up marker, fade on age, unless using the 'all' option
                if (showDict[dataPoints[i].owner] === true) {
                    if(k===0){
                        initial = k;
                    }
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

                    //Handle case of all floats separately from individual floats
                    if (name !== 'all'){
                        EEZ = await eezFinder(dataPoints[i].stla, dataPoints[i].stlo, EEZList, AllGeometries);
                        // Get float data from data array
                        netDisplacement = data[iniIndex+i][2]/1000;
                        totalDistance = data[iniIndex+i][3]/1000;
                        totalTime = data[iniIndex+i][4];
                        // Fills data with depth so makeWMSrequest becomes superfluous
                        GEBCODepth = data[iniIndex+i][5];

                        if (totalTime === 0) {
                            avgVelocity = 0;
                        } else {
                            avgVelocity = (totalDistance / totalTime);
                        }

                        legLength = data[iniIndex+i][0]/1000;
                        legTime = data[iniIndex+i][1];

                        // avoid division by zero when calculating velocity
                        if (legTime === 0) {
                            legSpeed = 0;
                        } else {
                            legSpeed = legLength / legTime;
                        }
                    } else if (name === 'all') { //Gather proper float information for all floats
                        EEZ = await eezFinder(dataPoints[i].stla, dataPoints[i].stlo, EEZList, AllGeometries);
                        let dataArr = data.filter(item => item[0]===dataPoints[i].name);
                        netDisplacement = dataArr[0][1]/1000;
                        totalDistance = dataArr[0][2]/1000;
                        totalTime = dataArr[0][3];
                        GEBCODepth = dataArr[0][4]
                        if (totalTime === 0) {
                            avgVelocty = 0;
                        } else {
                            avgVelocity = (totalDistance / totalTime);
                        }
                    }

                    let allPage = name === 'all';

                    // create info windows
                    setInfoWindow(allPage, k, i, marker, netDisplacement, totalDistance, avgVelocity,
                                  totalTime, legLength, legSpeed, legTime, GEBCODepth, EEZ, 0, 0);

                    markers.push(marker);
                    k++;
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
                addToMap(value, name);
        });
    }

    // for dynamic info windows
    function setInfoWindow(allPage, k, i, marker, netDisplacement, totalDistance, avgVelocity,
                           totalTime, legLength, legSpeed, legTime, GEBCODepth, EEZ, lat, lng) {
        // No more live requests since the data get read by grabIndData
        // makeWMSrequest(dataPoints[k]);

        google.maps.event.addListener(marker, 'click', function (event) {
                // close existing windows
                closeIWindows();
                if (allPage!=='drop'){
                    markerIndex = k;
                }

                //Redeclare variables for jQuery (it doesn't work if I don't do this, I have no idea why)
                dropMarkerList = dropMarkers;
                currentMarker = dropMarkers.findIndex(item => {
                        if (item.title === marker.title) {
                            return true;
                        }
                        return false;
                    });
                tempClose = closeIWindows;

                // Pan to include entire infowindow
                let offset = -0.32 + (10000000) / (1 + Math.pow((map.getZoom() / 0.0035), 2.07));
                let center = new google.maps.LatLng(
                                                    parseFloat(marker.position.lat() + offset / 1.5),
                                                    parseFloat(marker.position.lng() + offset / 2)
                                                    );
                map.panTo(center);
                let iwindow;
                // info window preferences
                if (allPage==="drop") {
                    iwindow = new InfoBubble({
                        maxWidth: 270,
                        maxHeight: 150,
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

                } else {
                    iwindow = new InfoBubble({
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
                }

                let floatTabContent;

                if (allPage === true) {
                    // content for float data tab
                    floatTabContent = '<div id="tabContent">' +
                        // '<b>Float Name:</b> ' + dataPoints[i].name +
                        // '<br/> ' +
                        '<b>UTC:</b> ' + dataPoints[i].stdt +
                        // '<br/><b>Your Date:</b> ' + dataPoints[i].loct +
                        '<br/><b>GPS Lat/Lon:</b> ' + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
                        '<br/><b>GPS Hdop/Vdop:</b> ' + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
                        '<br/><b>GEBCO WMS Depth:</b> ' + GEBCODepth + ' m' +
                        '<br/><b>EEZ:</b> ' + EEZ +
                        '<br/> ' +
                        '<br/><b>Battery:</b> ' + dataPoints[i].Vbat + ' mV' +
                        '<br/><b>Internal Pressure:</b> ' + dataPoints[i].Pint + ' Pa' +
                        '<br/><b>External Pressure:</b> ' + dataPoints[i].Pext + ' mbar' +
                        '<br/> ' +
                        '<br/><b>Total Time:</b> ' + roundit(totalTime,0) + ' h' +
                        '<br/><b>Distance Travelled:</b> ' + roundit(totalDistance,0) + ' km' +
                        '<br/><b>Average Speed:</b> ' + roundit(avgVelocity,3) + ' km/h' +
                        '<br/><b>Net Displacement:</b> ' + roundit(netDisplacement,0) + ' km';
                } else if (allPage === 'drop'){
                    // content for dropped marker tab
                    floatTabContent = '<div id="tabContent">' +
                        '<br/><b>GPS Lat/Lon:</b> ' + lat + ', ' + lng +
                        '<br/><b>GEBCO WMS Depth:</b> ' + GEBCODepth + ' m' +
                        '<br/><b>EEZ:</b> ' + EEZ +
                        //This next line we create an <a> tag with an href that calls a javascript function using jQuery
                        '<br/><br/><span style="cursor:pointer;display:inline-block;"><a href="javascript:dropMarkerList[currentMarker].setMap(null);tempClose();void dropMarkerList.splice(currentMarker,1);"><b>Clear Marker</b></a></span>';
                } else {
                    // content for float data tab
                    floatTabContent = '<div id="tabContent">' +
                        // '<b>Float Name:</b> ' + dataPoints[i].name +
                        // '<br/> ' +
                        '<b>UTC:</b> ' + dataPoints[i].stdt +
                        // '<br/><b>Your Date:</b> ' + dataPoints[i].loct +
                        '<br/><b>GPS Lat/Lon:</b> ' + dataPoints[i].stla + ', ' + dataPoints[i].stlo +
                        // '<br/><b>GPS Hdop/Vdop:</b> ' + dataPoints[i].hdop + ' m , ' + dataPoints[i].vdop + ' m' +
                        // We're not making a WMS request here so no more datapoint and now more that field
                        // '<br/><b>GEBCO WMS Depth:</b> ' + dataPoints[i].wmsdepth + ' m' +
                        '<br/><b>GEBCO WMS Depth:</b> ' + GEBCODepth + ' m' +
                        '<br/><b>EEZ:</b> ' + EEZ +
                        // '<br/> ' +
                        // '<br/><b>Battery:</b> ' + dataPoints[i].Vbat + ' mV' +
                        // '<br/><b>Internal Pressure:</b> ' + dataPoints[i].Pint + ' Pa' +
                        // '<br/><b>External Pressure:</b> ' + dataPoints[i].Pext + ' mbar' +
                        '<br/> ' +
                        '<br/><b>Leg Length:</b> ' + roundit(legLength,1) + ' km' +
                        '<br/><b>Leg Time:</b> ' + roundit(legTime,2) + ' h' +
                        '<br/><b>Leg Speed:</b> ' + roundit(legSpeed,3) + ' km/h' +
                        '<br/> ' +
                        '<br/><b>Total Time:</b> ' + roundit(totalTime,0) + ' h' +
                        '<br/><b>Distance Travelled:</b> ' + roundit(totalDistance,0) + ' km' +
                        '<br/><b>Average Speed:</b> ' + roundit(avgVelocity,3) + ' km/h' +
                        '<br/><b>Net Displacement:</b> ' + roundit(netDisplacement,0) + ' km';
                }
                // content for earthquake tabs
                let earthquakeTabContent = '<div id="tabContent">' +
                    '<b>Code:</b> ' + "/* filler */" +
                    '<br/><b>UTC:</b> ' + "/* filler */" +
                    '<br/><b>Your Date:</b> ' + "/* filler */" +
                    '<br/><b>Lat/Lon:</b> ' + "/* filler */" +
                    '<br/><b>Magnitude:</b> ' + "/* filler */" +
                    '<br/><b>Great Circle Distance:</b> ' + "/* filler */" +
                    '<br/><b>Source:</b> ' + "/* filler */";
                
                let floatName;

                if(allPage === 'drop'){
                    floatName = '<div id="tabNames">' + '<b>' + 'Drop Pin' + '</b> ';
                } else {
                    floatName = '<div id="tabNames">' + '<b>' + dataPoints[i].name + '</b> ';
                }

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
        for (let i = 0; i < dropMarkers.length; i++) {
            dropMarkers[i].setMap(null);
        }
        markerNum=0;
        markers.length = 0;
        dropMarkers.length=0;
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
            url = "https://geoweb.princeton.edu/people/simons/SOM/all.txt";
        } else {
            url = "https://geoweb.princeton.edu/people/simons/SOM/" + name + showTail;
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
    //  clearMarkers();
    //     });
    // google.maps.event.addDomListener(all, 'click', function() {
    //  getFloatData("all");
    //     });
    // google.maps.event.addDomListener(P006, 'click', function() {
    //  getFloatData("P006");
    //     });
    // and then one for every explicit number, but now that is all replaced by:

    async function setUpEvents() {
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
        async function addEvents(id) {
            try {
                google.maps.event.addDomListener(document.getElementById(id), 'click', function (referer) {
                        if (referer !== "slideShow") {
                            slideShowOn = false;
                        }
                        if (id==='all') {
                            //Toggles visibility of buttons
                            toggle.setAttribute('class', 'button-hidden');
                            legend.setAttribute('class','button-visible');
                        } else {
                            //Toggles visibility of buttons
                            toggle.setAttribute('class', 'button-visible');
                            legend.setAttribute('class','button-hidden');
                            //Turn legend on for this float
                            showDict[getOwner(id)]=true;
                            document.getElementById(icons[getOwner(id)].name).src=icons[getOwner(id)].icon;
                        }
                        if (slideShowOn==false) {
                            dropButton.setAttribute('class', 'button-visible');
                        }
                        if (dropListener) {
                             google.maps.event.removeListener(dropListener);
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
        //  let url = "https://geoweb.princeton.edu/people/jnrubin/DEVearthscopeoceans/testSAC2.SAC";
        //      useBinCallback(url);
        //     });

        // clear event
        google.maps.event.addDomListener(clear, 'click', function () {
                clearMarkers();
                toggle.setAttribute('class','button-hidden');
                legend.setAttribute('class','button-hidden');
                if (dropListener) {
                    google.maps.event.removeListener(dropListener);
                }
                slideShowOn = false;
            });

        // slideshow event
        google.maps.event.addDomListener(slide, 'click', function () {
                if (dropListener) {
                    google.maps.event.removeListener(dropListener);
                }
                legend.setAttribute('class','button-visible');
                dropButton.setAttribute('class', 'button-hidden')
                slideShow();
            });
        // drop marker event
        google.maps.event.addDomListener(drop, 'click', async function() {
                clearMarkers();
                toggle.setAttribute('class','button-hidden');
                dropButton.setAttribute('class', 'button-hidden');
                legend.setAttribute('class','button-hidden');
                slideShowOn = false;
                map.setZoom(2);
                if (dropListener) {
                    google.maps.event.removeListener(dropListener);
                }
                //Adds a listener that can tell when and where the map is clicked
                dropListener = google.maps.event.addDomListener(map, 'click', async function(dropEvent) {
                        clearMarkers();
                        //Add a marker based on where map is clicked
                        marker = new google.maps.Marker({
                                position: dropEvent.latLng,
                                map: map,
                                clickable: true,
                                icon: "https://maps.google.com/mapfiles/ms/icons/ltblue-dot.png",
                                title: markerNum.toString(),
                            });
                        let lat = dropEvent.latLng.toJSON().lat.toFixed(6);
                        let lng = dropEvent.latLng.toJSON().lng.toFixed(6);
                        EEZ = await eezFinder(lat, lng, EEZList, AllGeometries);
                        GEBCODepth = await makeWMSrequestCoords(lat, lng);
                        dropMarkers.push(marker);
                        //Sets an info marker for the map
                        setInfoWindow('drop', 0, 0, marker, 0, 0, 0, 0, 0, 0, 0, GEBCODepth, EEZ, lat, lng);
                        google.maps.event.trigger(marker, 'click');
                    });
            });
    }

    // enable moving through markers with arrow keys
    google.maps.event.addDomListener(document, 'keyup', function (e) {
            let code = (e.keyCode ? e.keyCode : e.which);
            if (markerIndex !== -1) {
                if (markerIndex > markers.length + dropMarkers.length - 1){
                    markerIndex=0
                }
                if (code === 39) {
                    if (markerIndex >= markers.length + dropMarkers.length - 1) {
                        markerIndex = 0;
                    } else {
                        markerIndex++;
                    }

                    if(markerIndex < markers.length) {
                        google.maps.event.trigger(markers[markerIndex], 'click');
                    } else {
                        google.maps.event.trigger(dropMarkers[markerIndex - markers.length], 'click');
                    }

                } else if (code === 37) {
                    if (markerIndex === 0) {
                        markerIndex = markers.length + dropMarkers.length - 1;
                    } else {
                        markerIndex--;
                    }

                    if(markerIndex < markers.length) {
                        google.maps.event.trigger(markers[markerIndex], 'click');
                    } else {
                        google.maps.event.trigger(dropMarkers[markerIndex - markers.length], 'click');
                    }

                } else if (code === 27) {
                    closeIWindows();
                }
            }
            console.log(markerIndex);
        });

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function slideShow() {
        if (slideShowOn === false) {
            slideShowOn = true;
            const tempDict = {...showDict};
            for (let i = 1; i < floatIDS.length; i++) {

                if (slideShowOn === true && tempDict[getOwner(floatIDS[i])] === true) {
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

    //Grab float data from distances.txt
    async function grabAllData(){
        let dataArr=[];
        let data = await fetchAndDecodeFloatData("https://geoweb.princeton.edu/people/sk8609/DEVearthscopeoceans/data/FloatInfo/distances.txt", 'text');
        tempArr = data.split('\n');
        for(let i=0; i<tempArr.length;i++){
            let splitArr = tempArr[i].split(' ');
            dataArr.push([splitArr[0], parseInt(splitArr[1]), parseInt(splitArr[2]), parseFloat(splitArr[3]), parseInt(splitArr[4])]);
        }
        return dataArr
    }
    
    // Gets time, distance, and depth
    async function grabIndData(Float){
        let dataArr=[];
        let data = await fetchAndDecodeFloatData(`https://geoweb.princeton.edu/people/sk8609/DEVearthscopeoceans/data/FloatInfo/${Float}.txt`, 'text');
        tempArr = data.split('\n');
        for(let i=0; i<tempArr.length;i++){
            let splitArr = tempArr[i].split(' ');
            dataArr.push([parseInt(splitArr[0]), parseFloat(splitArr[1]), parseInt(splitArr[2]), parseInt(splitArr[3]), parseFloat(splitArr[4]), parseInt(splitArr[5])]);
        }
        return dataArr;
    }
}
