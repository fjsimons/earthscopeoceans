/**
 File reader class

 @author Jonah Rubin
 03/12/2019
 */

// for textfiles
function get(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
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

// for binary files
function getBin(url, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.responseType = 'blob';
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

