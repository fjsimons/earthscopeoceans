 function initMap() {
		 	    	// ID the map
		 	    	var mapDiv = document.getElementById('map');
		 	    	
		 	    	// some default locations
		 	    	var guyot = {lat: 40.34585, lng: -74.65475};
		 			var papeete = {lat: -17.53733, lng: -149.5665};
		 			// default map center
		 			var map = new google.maps.Map(mapDiv, {
		 				zoom: 13,
		 				center: papeete
		 			});
		 
		 			// place marker
		 			var marker = new google.maps.Marker({
						position: papeete,
		 				map: map
		 			});
					
					// add data to map
		 			function addToMap(data) {
		 				// store coords in parallel arrays
          				var x = [];
            			var y = [];  
            			

            			// scrape data from text callback response
		 				var rows = data.split('\n');
		 				 for (i = 0; i < rows.length-1; i++) {
		 				    var coords = rows[i].split(/\s+/);
		 				   	x.push(coords[8]);
		 				    y.push(coords[9]);
		 				}

		 				// iterate over arrays, placing markers
		 				for (var i = 0; i < x.length; i++) {
          					var latLng = new google.maps.LatLng(x[i],y[i]);
          					var marker = new google.maps.Marker({
            					position: latLng,
            					map: map
          					});
        				}
        				

            			//use exact center for panning
            			//var xCenter = 0;
            			//var yCenter = 0;

        				// for (var i = 0; i < x.length; i ++) {
        				// 	xCenter += parseFloat(x[i]);
        				// 	yCenter += parseFloat(y[i]);
        				// }

        				// xCenter /= (rows.length - 1);
        				// yCenter /= (rows.length - 1);
        				
        				//use aprox. center for panning (middle location)
        				xCenter = x[Math.floor(x.length/2)];
        				yCenter = y[Math.floor(y.length/2)];
        				

        				var latLng = new google.maps.LatLng(xCenter, yCenter);
        				map.panTo(latLng);
        				map.setZoom(11);
		 			}
		 			// listen for use of scrollbar
		 			//all
		 			google.maps.event.addDomListener(all, 'click', function() {
		 				window.alert("all clicked");
        			});
		 			//raffa
        			google.maps.event.addDomListener(raffa, 'click', function() {
        				var url = "http://geoweb.princeton.edu/people/simons/SOM/RAFFA_030.txt"
		 				resp = get(url,
		 				    // this callback is invoked AFTER the response arrives
		 				    function () {
		 				        
		 				        var data  = this.responseText;
		 				        // now do something with response
		 				        addToMap(data);
		 				    }
		 				);
        			});
        			//robin
        			google.maps.event.addDomListener(robin, 'click', function() {
        				var url = "http://geoweb.princeton.edu/people/simons/SOM/ROBIN_030.txt" 
		 				resp = get(url,
		 				    // this callback is invoked AFTER the response arrives
		 				    function () {
		 				        
		 				        var data  = this.responseText;
		 				        // now do something with response
		 				        addToMap(data);
		 				    }
		 				);
        			});
		 	}