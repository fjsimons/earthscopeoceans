/**
DataPoint object class

@author Jonah Rubin and Frederik J Simons 04/17/2024
Last modified by Frederik J Simons 03/30/2025
*/

const JAMSTEC_FLOATS = [
    "N0001", "N0002", "N0004", "N0005", 
    "P0053", "P0054", "T0100", "T0101", "T0102"
];
const GEOAZUR_FLOATS = [
    "P0006"
];
const PRINCETON_FLOATS = [
    "P0011", "P0013",
    "P0016", "P0017", "P0018", "P0019", "P0020", "P0021",
    "P0023", "P0024", "P0025"
];
const SUSTECH_FLOATS = [
    "P0026", "P0027", "P0028", "P0029", "P0031", "P0032",
    "P0033", "P0035", "P0036", "P0037", "P0038", "P0039", 
    "P0040", "P0041", "P0042", "P0044", "P0045", 
    "P0046", "P0048", "P0049", "R0061", 
    "R0062", "R0069", "R0073"
];
const STANFORD_FLOATS = [
    "R0002", "R0003", "R0004", "R0005", "R0007"
];
const DEAD_FLOATS = [
    "N0003", "P0007", "P0034", "P0047", "R0006", "P0008", "R0001", "R0065",
    "R0066", "R0067", "P0009","P0043", "R0063", "P0052", "P0050", "P0010",
    "P0012", "P0022", "R0072", "R0071", "R0058", "R0059"
]

// create datapoint object
function DataPoint(name, stdt, stla, stlo, hdop, vdop, Vbat, minV, Pint, Pext, Prange, cmdrdc, f2up, fupl) {
    this.name = name;
    this.owner = getOwner(this.name);
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
    this.showIcon = true;
}

function getOwner(name) {
    if (DEAD_FLOATS.includes(name))
        return("dead")
    if (JAMSTEC_FLOATS.includes(name))
        return("jamstec");
    if (GEOAZUR_FLOATS.includes(name))
        return("geoazur");
    if (PRINCETON_FLOATS.includes(name))
        return("princeton");
    if (SUSTECH_FLOATS.includes(name))
        return("sustech");
    if (STANFORD_FLOATS.includes(name))
        return("stanford");
}

function getAllFloatNames() {
    all = [];
    all = all.concat(
        JAMSTEC_FLOATS, GEOAZUR_FLOATS, PRINCETON_FLOATS, SUSTECH_FLOATS, STANFORD_FLOATS, DEAD_FLOATS
    )

    return all
}

// INPUT is in UTC, convert to browser time
function toLocDate(stdt) {
    const MonthConversions = {
        "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
        "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
    };

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
function getTimeElapsed(datapt1, datapt2) {
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
    let R = 6378.137;
    let dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180;
    let dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180;
    let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    let d = R * c;
    return d * 1000; // meters
}

// get rough distance by getting displacement between all locations
function getDistance(dataPoints) {
    let distance = 0;

    for (let i = 0; i < dataPoints.length - 1; i++) {
        distance += getDisplacement(dataPoints[i], dataPoints[i + 1]);
    }

    return distance;
}

function selectionSort(arr) {
    let minIdx, temp,
        len = arr.length;
    for (let i = 0; i < len; i++) {
        minIdx = i;
        for (let j = i + 1; j < len; j++) {
            if (arr[j].loct.getTime() < arr[minIdx].loct.getTime()) {
                minIdx = j;
            }
        }
        temp = arr[i];
        arr[i] = arr[minIdx];
        arr[minIdx] = temp;
    }
    return arr;
}


