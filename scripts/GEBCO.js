function makeWMSrequest(dataPoint) {

  stlap = dataPoint.stla - .5;
  stlop = dataPoint.stlo - .5;
  stlam = dataPoint.stla + .5;
  stlom = dataPoint.stlo + .5;
  const rqtHead = 'http://www.gebco.net/data_and_products/gebco_web_services/web_map_service/mapserv?';

  // Integer width and height of the map (when requesting a feature, keep it small!)
  const pxw = 5;
  const pxh = 5;

  // Integer pixel count inside the map where you want to extract the point
  const pxx = 2;
  const pxy = 2;


  // get featureInfo
  const rqt = 'getfeatureinfo';

  const rqtTail = 'request=' + rqt + '&service=wms&crs=EPSG:4326&layers=gebco_latest_2&query_layers=gebco_latest_2&BBOX='
                  + stlap +','+ stlop + ','+ stlam + ','+ stlom + '&info_format=text/plain&service=wms&x=200&y=200&width=900&height=900&version=1.3.0'

  var url = rqtHead + rqtTail;

  resp = get(url,
  function () {
    console.log(this.responseText.split("\'")[7]);
    dataPoint.depth = this.responseText.split("\'")[7];

  });

  // console.log(depth);

}
