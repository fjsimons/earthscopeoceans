/*
  Last modified by Stefan Kildal-Brandt, 6-27-2022
 */

// Point in Polygon function borrowed from https://www.algorithms-and-technologies.com/point_in_polygon/javascript
function pointInPolygon(point, polygon){
	let inside = false;
	let j = polygon.length-1;
	for (let i=0;i<polygon.length;i++){
		if(((polygon[i][1]>point[1])!==(polygon[j][1]>point[1]))&(point[0]<((polygon[j][0]-polygon[i][0])*(point[1]-polygon[i][1])/(polygon[j][1]-polygon[i][1])+polygon[i][0]))){
			inside = !inside;
		}
		j=i;
	}
	return inside
}

// Determines the Exclusive Economic Zone
async function eezFinder(lat, lon, EEZList, AllGeometries){
    const newfilt = EEZList.filter(item => (item["minLatitude"]<=lat && item["maxLatitude"]>=lat) && (item["minLongitude"]<=lon && item["maxLongitude"]>=lon || item["minLongitude"]>item["maxLongitude"]) && item["status"]!="deleted");
    if(newfilt.length>0){
	for(let i=0;i<newfilt.length;i++){
	    let MRGID = newfilt[i]["MRGID"];
	    let data = AllGeometries[`${MRGID}`]
		for(let j=0;j<data.length;j++){
		    if(pointInPolygon([lon,lat],data[j])){
			return newfilt[i]["preferredGazetteerName"]
		    }
		}
	}
	return "No EEZ"
	    }
    else {
	return "No EEZ"
	    }
}

