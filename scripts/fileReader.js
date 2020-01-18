/**
   File reader class

   @author Jonah Rubin
   11/27/2019
*/

// for textfiles
function get(type, url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    if (type === "bin") {
        xhr.responseType = 'blob';

    }
    xhr.onreadystatechange = function () {
        // defensive check
        if (xhr.readyState === 4) {
            if (typeof callback === "function") {
                //apply callback to response
                callback.apply(xhr);
            }
        }
    };
    xhr.send();
}
