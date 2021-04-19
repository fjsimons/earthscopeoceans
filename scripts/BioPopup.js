let openBios = [];

// When the user clicks on div, open the popup
function myFunction(id) {
    
    let popup = document.getElementById(id);
    popup.classList.toggle("show");
    openBios.push(popup);
}