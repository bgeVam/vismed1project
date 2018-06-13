/**
 * This class performs dynamic page loading.
 */
var visualization=1;

function switchVisualizations() {
    if (visualization==1)
    {
        loadVisualization2();
        visualization=2;
    }
    else if (visualization==2)
    {
        loadVisualization1();
        visualization=1;
    }
}

function hideHtmlElement(htmlElementId) {
    var htmlElement = document.getElementById(htmlElementId);
    htmlElement.style.display = "none";
}

function showHtmlElement(htmlElementId) {
    var htmlElement = document.getElementById(htmlElementId);
    htmlElement.style.display = "block";
}

function loadVisualization2() {
    hideHtmlElement('container_left');
    hideHtmlElement('container_right');
    hideHtmlElement('my-gui-container1');
    showHtmlElement('my-gui-container2');
    showHtmlElement('my-lut-container');
    showHtmlElement('my-lut-canvases-l0');
    showHtmlElement('my-lut-canvases-l1');
    showHtmlElement('r3d');
    initVisualization2();
}

function loadVisualization1() {
    hideHtmlElement('my-gui-container2');
    hideHtmlElement('my-lut-container');
    hideHtmlElement('my-lut-canvases-l0');
    hideHtmlElement('my-lut-canvases-l1');
    hideHtmlElement('r3d');
    showHtmlElement('container_left');
    showHtmlElement('container_right');
    showHtmlElement('my-gui-container1');
    initVisualization1();
}