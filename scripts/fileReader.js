/**
	File reader class

	@author Jonah Rubin
	11/20/2018
*/

// for textfiles
function get(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.onreadystatechange = function () {
  	  // defensive check
      if (xhr.readyState == 4) {
          if (typeof callback === "function") {
          	  //apply callback to response
              callback.apply(xhr);
          }
      }
  };
  xhr.send();
}

// for binary files
function getBin(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);
  xhr.responseType = 'blob';
  xhr.onreadystatechange = function () {
  	  // defensive check
      if (xhr.readyState == 4) {
          if (typeof callback === "function") {
          	  //apply callback to response
              callback.apply(xhr);
          }
      }
  };
  xhr.send();
}

