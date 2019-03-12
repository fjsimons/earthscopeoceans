/**
	DataPoint object class

	@author Jonah Rubin
	03/12/2019
*/

// create datapoint object
function DataPoint(name, stdt, stla, stlo, hdop, vdop, Vbat, minV, Pint, Pext, Prange, cmdrdc, f2up, fupl) {
    this.name = name;
    this.stdt = stdt;
    this.loct = toLocDate(stdt);
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
    this.wmsdepth = 0;
}

// INPUT is in UTC, convert to browser time
function toLocDate(stdt) {
    const MonthConversions = {"Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
			      "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11};

    // parse date info
    day = parseInt(stdt.substring(0, 2));
    month = MonthConversions[stdt.substring(3, 6)];
    year = parseInt(stdt.substring(7, 11));

    hour = parseInt(stdt.substring(12, 14));
    minute = parseInt(stdt.substring(15, 17));
    second = parseInt(stdt.substring(18));

    // UTC date
    date = new Date(Date.UTC(year, month, day, hour, minute, second));

    // local date
    locDate = new Date(date.toUTCString());

    return (locDate);
}

// get time elapsed between datapoints in hours
function getTimeElapsed (datapt1, datapt2) {
    return (datapt2.loct.getTime() - datapt1.loct.getTime()) / (1000 * 60 * 60);
}

// use haversine formula do determine distance between lat/ lng points
// src: https://www.movable-type.co.uk/scripts/latlong.html
function getDisplacement(datapt1, datapt2) {
    lat1 = datapt1.stla;
    lon1 = datapt1.stlo;
    lat2 = datapt2.stla;
    lon2 = datapt2.stlo;

    // Radius of earth in KM
    var R = 6378.137;
    var dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    var dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
	Math.sin(dLon/2) * Math.sin(dLon/2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    var d = R * c;
    return d * 1000; // meters
}

// get rough distance by getting displacement between all locations
function getDistance(dataPoints) {
    var distance = 0

	for (var i = 0; i < dataPoints.length - 1; i++) {
	    distance += getDisplacement(dataPoints[i], dataPoints[i+1]);
	}

    return distance;
}

// switch to radix if the datasize grows substantially
function selectionSort(arr){
    var minIdx, temp,
	len = arr.length;
    for(var i = 0; i < len; i++){
	minIdx = i;
	for(var j = i+1; j<len; j++){
	    if(arr[j].loct.getTime() < arr[minIdx].loct.getTime()){
		minIdx = j;
	    }
	}
	temp = arr[i];
	arr[i] = arr[minIdx];
	arr[minIdx] = temp;
    }
    return arr;
}
