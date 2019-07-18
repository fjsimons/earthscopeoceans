function makeWMSrequest(dataPoint) {
    // This is inspired by the known 2014 resolution
    const bb = 1/60/2/5;

    stlap = dataPoint.stla - bb;
    stlop = dataPoint.stlo - bb;
    stlam = dataPoint.stla + bb;
    stlom = dataPoint.stlo + bb;
    const rqtHead = 'http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?';

    // Integer width and height of the map (when requesting a feature, keep it small!)
    const pxw = 10;
    const pxh = 10;

    // Integer pixel count inside the map where you want to extract the point
    const pxx = 5;
    const pxy = 5;

    // get featureInfo
    const rqt = 'getfeatureinfo';

    const rqtTail = 'request=' + rqt + '&service=wms&crs=EPSG:4326&layers=gebco_latest_2&query_layers=gebco_latest_2&BBOX='
	+ stlap + ',' + stlop + ',' + stlam + ',' + stlom + '&info_format=text/plain&service=wms&x='
	+ pxx + '&y=' + pxy + '&width=' + pxw + '&height=' + pxh + '&version=1.3.0'

	let url = rqtHead + rqtTail;

    // Use the "get" method defined in the fileReader.js
    resp = get(url,
	       function () {
		   // We expect a return to look like this, so you parse on the quote and get the 7th field
		   //  GetFeatureInfo results:
		   // Layer 'GEBCO_LATEST_2'
		   // Feature 0: 
		   // x = '23.2375'
		   // y = '65.095833'
		   // value_list = '-101'

		   // console.log(this.responseText.split("\'")[7]);
		   dataPoint.wmsdepth = this.responseText.split("\'")[7];
	       });

    // console.log(depth);
}
