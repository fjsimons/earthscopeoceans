let openBios = [];

// When the user clicks on div, open the popup and close other popups
function myFunction(id) {
    for (let item of openBios){
        if (item.id !== id){
            item.classList.toggle("show");
        }
        openBios = openBios.filter(obj => obj!==item || obj.id==id);
    }
    let popup = document.getElementById(id);
    popup.classList.toggle("show");
    if (openBios.filter(obj => obj.id === id).length > 0){
        openBios = openBios.filter(obj => obj.id !== id);
        return
    }
    openBios.push(popup);
}
