//add callback to handle asynchronous response 
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
