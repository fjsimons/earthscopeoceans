// Last modified by SKB, JNR, and FJS 6/23/26
// 
//      Both scripts query the GEBCO database at a chosen location
//
//      Here is an example of a working link:
//          https://wms.gebco.net/mapserv?request=getfeatureinfo&crs=EPSG:4326&layers=GEBCO_LATEST_2&query_layers=GEBCO_LATEST_2&BBOX=65.0874996667,23.2291666667,65.1041663333,23.2458333333&info_format=text/plain&service=wms&i=2&j=2&width=5&height=5&version=1.3.0
//
//          https://wms.gebco.net/mapserv?request=getfeatureinfo&crs=EPSG:4326&layers=GEBCO_LATEST_2&query_layers=GEBCO_LATEST_2&BBOX=50.9542,-199875,50.9708,-19.9708&info_format=text/plain&service=wms&i=2&j=2&width=5&height=5&version=1.3.0
//
// Function to get GEBCO depth from a datapoint parameter
function makeWMSrequest(dataPoint) {
    // This is inspired by the known 2014 resolution
    const bb = 1/60/2;
    stlap = parseFloat(dataPoint.stla) - bb;
    stlop = parseFloat(dataPoint.stlo) - bb;
    stlam = parseFloat(dataPoint.stla) + bb;
    stlom = parseFloat(dataPoint.stlo) + bb;

    const rqtHead = 'https://wms.gebco.net/mapserv?';

    // Integer width and height of the map (when requesting a feature, keep it small!)
    const pxw = 5;
    const pxh = 5;

    // Integer pixel count inside the map where you want to extract the point
    const pxx = 2;
    const pxy = 2;

    // get featureInfo
    const rqt = 'getfeatureinfo';

    const rqtTail = 'request=' + rqt + '&service=wms&crs=EPSG:4326&layers=GEBCO_LATEST_2&query_layers=GEBCO_LATEST_2&BBOX='
          + stlap + ',' + stlop + ',' + stlam + ',' + stlom + '&info_format=text/plain&service=wms&i='
          + pxx + '&j=' + pxy + '&width=' + pxw + '&height=' + pxh + '&version=1.3.0';

    let url = rqtHead + rqtTail;

    // console.log(url);

    // Use the "get" method defined in the fileReader.js
    //console.log(url);
    resp = get(DataType.TEXT, url,
        function () {
            // We expect a return to look like this, so you parse on the quote and get the 7th field
            //  GetFeatureInfo results:
            // Layer 'GEBCO_LATEST_2'
            // Feature 0: 
            // x = '23.2375'
            // y = '65.095833'
            // value_list = '-101'

            dataPoint.wmsdepth = this.responseText.split("\'")[7];
        });

    //console.log(depth);
}

//Function to get GEBCO depth from coordinate parameters
async function makeWMSrequestCoords(lat, lng) {
    // This is inspired by the known 2014 resolution
    const bb = 1/60/2;
    stlap = parseFloat(lat) - bb;
    stlop = parseFloat(lng) - bb;
    stlam = parseFloat(lat) + bb;
    stlom = parseFloat(lng) + bb;

    const rqtHead = 'https://wms.gebco.net/mapserv?';

    // Integer width and height of the map (when requesting a feature, keep it small!)
    const pxw = 5;
    const pxh = 5;

    // Integer pixel count inside the map where you want to extract the point
    const pxx = 2;
    const pxy = 2;

    // get featureInfo
    const rqt = 'getfeatureinfo';

    const rqtTail = 'request=' + rqt + '&service=wms&crs=EPSG:4326&layers=GEBCO_LATEST_2&query_layers=GEBCO_LATEST_2&BBOX='
          + stlap + ',' + stlop + ',' + stlam + ',' + stlom + '&info_format=text/plain&service=wms&i='
          + pxx + '&j=' + pxy + '&width=' + pxw + '&height=' + pxh + '&version=1.3.0';

    let url = rqtHead + rqtTail;
    //returns the data fetched from GEBCO website
    resp = await fetchAndDecodeFloatData(url, 'text')
    return resp.split("\'")[7];
}

