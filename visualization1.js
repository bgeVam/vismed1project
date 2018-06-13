/* globals dat, AMI*/


//Setup link
var link = document.getElementById('ab');

/**
initalize function
*/
function initVisualization1() {

    if (visualization1init == false) {
    // Setup renderer left
    containerLeft = document.getElementById('container_left');
    rendererLeft = new THREE.WebGLRenderer({
        antialias: true
    });
    rendererLeft.setSize(containerLeft.offsetWidth, containerLeft.offsetHeight);
    rendererLeft.setClearColor(0x353535, 1);
    rendererLeft.setPixelRatio(window.devicePixelRatio);
    containerLeft.appendChild(rendererLeft.domElement);

    // Setup renderer right
    containerRight = document.getElementById('container_right');
    rendererRight = new THREE.WebGLRenderer({
        antialias: true
    });
    rendererRight.setSize(containerRight.offsetWidth, containerRight.offsetHeight);
    rendererRight.setClearColor(0x353535, 1);
    rendererRight.setPixelRatio(window.devicePixelRatio);
    containerRight.appendChild(rendererRight.domElement);

    // Setup scene
    sceneLeft = new THREE.Scene();
    sceneRight = new THREE.Scene();

    // Setup camera1
    camera1 = new THREE.PerspectiveCamera(45, containerLeft.offsetWidth / containerLeft.offsetHeight, 0.01, 10000000);
    camera1.position.x = 150;
    camera1.position.y = 150;
    camera1.position.z = 100;

    // Setup controls
    controlsLeft = new AMI.TrackballControl(camera1, containerLeft);
    controlsRight = new AMI.TrackballControl(camera1, containerRight);
    visualization1init = true;
}


    /**
     * Handle window resize
     */
     function onWindowResize() {
        camera1.aspect = containerLeft.offsetWidth / containerLeft.offsetHeight;
        camera1.updateProjectionMatrix();

        rendererLeft.setSize(containerLeft.offsetWidth, containerLeft.offsetHeight);
        rendererRight.setSize(containerRight.offsetWidth, containerRight.offsetHeight);
    }
    window.addEventListener('resize', onWindowResize, false);
    /**
    Start animation loop
    */
    function animate() {
        controlsLeft.update();
        controlsRight.update();
        rendererLeft.render(sceneLeft, camera1);
        rendererRight.render(sceneRight, camera1);
        // request new frame

        requestAnimationFrame(function () {
            if (visualization==1)
            {
             animate();
         }  
     });
    }
    animate();
}

/**
 * Build GUI
 */
 function gui(stackHelperLeft, stackHelperRight, settingsVar) {

    var stackLeft = stackHelperLeft.stack;
    var stackRight = stackHelperRight.stack;
    var settings = settingsVar;
    var params = {
        refresh: false,
        visualization: 'juxtaposition'
    }

    var gui = new dat.GUI({
        autoPlace: false,
    });
    var customContainer1 = document.getElementById('my-gui-container1');
    while (customContainer1.firstChild) {
        customContainer1.removeChild(customContainer1.firstChild);
    }
    customContainer1.appendChild(gui.domElement);

    // switch visualization
    var visualizationFolder = gui.addFolder('Visualization');
    var switchVis = visualizationFolder
    .add(params, 'visualization', ['juxtaposition', 'overlay']);
    switchVis.onChange(function (value) {
        if (value == 'overlay') {
            window.location.href = "viewers_compare.html";
        }
    })
    visualizationFolder.open();

    // image settings
    var settingsFolder = gui.addFolder('Settings');
    var mod = settingsFolder
    .add(settingsVar, 'modality', ['T1', 'T2', 'PD'])
    var thickness = settingsFolder
        .add(settingsVar, 'slicethickness', 1, 9).step(1) // funktioniert noch nicht so wie es sollte!      
        var noise = settingsFolder
        .add(settingsVar, 'noise', 0, 9).step(1) // funktioniert noch nicht so wie es sollte!     
        var rf = settingsFolder
        .add(settingsVar, 'rf', { '0%': 0, '20%': 20, '40%': 40 })
        var refresh = settingsFolder
        .add(params, 'refresh');
        refresh.onChange(function (value) {
        if (settingsVar.slicethickness % 2 == 0) { // even slice thickness does not exist -> 
            settingsVar.slicethickness = settingsVar.slicethickness - 1;
        }
        if ((settingsVar.noise % 2 == 0) && (settingsVar.noise != 0)) {
            settingsVar.noise = settingsVar.noise - 1;
        }
        if (mod.isModified() || thickness.isModified() || noise.isModified() || rf.isModified()) {
            // reload images with current settingsVar
            sceneRight.remove(stackHelperRight);
            sceneLeft.remove(stackHelperLeft);
            customContainer1.removeChild(gui.domElement);
            loadFiles(filesName(settingsVar));
            //filesName(settingsVar)
            //loadImagesVisualization1();
        }
    })
        settingsFolder.open();

    // slice
    var stackFolder = gui.addFolder('Slice');
    var index = stackFolder
    .add(stackHelperLeft, 'index', 0, stackLeft.dimensionsIJK.z - 1)
    .step(1)
    .listen();
    index.onChange(function (value) {
        //update Right index
        stackHelperRight.index = stackHelperLeft.index;
    });

    var orientation = stackFolder
    .add(stackHelperLeft, 'orientation', 0, 2)
    .step(1)
    .listen();
    orientation.onChange(function (value) {
        index.__max = stackHelperLeft.orientationMaxIndex;
        stackHelperLeft.index = Math.floor(index.__max / 2);
        //update Right orientation and index
        stackHelperRight.orientation = stackHelperLeft.orientation;
        stackHelperRight.index = stackHelperLeft.index;
    });
    stackFolder.open();

    // image
    var sliceFolder = gui.addFolder('Image');
    var colorDepth = sliceFolder
    .add(stackHelperLeft.slice, 'windowWidth', 1, stackLeft.minMax[1] - stackLeft.minMax[0])
    .step(1)
    .listen();
    colorDepth.onChange(function (value) {
        //update Right colorDepth
        stackHelperRight.slice.windowWidth = stackHelperLeft.slice.windowWidth;
    });
    var brightness = sliceFolder
    .add(stackHelperLeft.slice, 'windowCenter', stackLeft.minMax[0], stackLeft.minMax[1])
    .step(1)
    .listen();
    brightness.onChange(function (value) {
        //update Right brightness
        stackHelperRight.slice.windowCenter = stackHelperLeft.slice.windowCenter;
    });
    var intensityAuto = sliceFolder
    .add(stackHelperLeft.slice, 'intensityAuto')
    .listen();
    intensityAuto.onChange(function (value) {
        //update Right intensityAuto
        stackHelperRight.slice.intensityAuto = stackHelperLeft.slice.intensityAuto;
    });
    var invert = sliceFolder
    .add(stackHelperLeft.slice, 'invert')
    .listen();
    invert.onChange(function (value) {
        //update Right invert
        stackHelperRight.slice.invert = stackHelperLeft.slice.invert;
    });
    sliceFolder.close();

    // bbox
    var bboxFolder = gui.addFolder('Bounding Box');
    var boundingVisible = bboxFolder
    .add(stackHelperLeft.bbox, 'visible');
    boundingVisible.onChange(function (value) {
        //update Right invert
        stackHelperRight.bbox.visible = stackHelperLeft.bbox.visible;
    });
    bboxFolder.close();

    // border
    var borderFolder = gui.addFolder('Border');
    var borderVisible = borderFolder
    .add(stackHelperLeft.border, 'visible');
    borderVisible.onChange(function (value) {
        //update Right invert
        stackHelperRight.border.visible = stackHelperLeft.border.visible;
    });
    borderFolder.close();
}

function loadImagesVisualization1() {
    //console.log("LEFT IS" + series[0]._seriesInstanceUID);
    //console.log("RIGHT IS" + series[1]._seriesInstanceUID);
    var stackLeft = series[0].stack[0];
    var stackRight = series[1].stack[0];

    // be carefull that series and target stack exist!
    var stackHelperLeft = new AMI.StackHelper(stackLeft);
    stackHelperLeft.bbox.color = 0x8bc34a;
    stackHelperLeft.border.color = 0xf44336;
    sceneLeft.add(stackHelperLeft);

    // be carefull that series and target stack exist!
    var stackHelperRight = new AMI.StackHelper(stackRight);
    stackHelperRight.bbox.color = 0x8bc34a;
    stackHelperRight.border.color = 0xf44336;
    sceneRight.add(stackHelperRight);

    if (stackLeft._dimensionsIJK.z != stackRight._dimensionsIJK.z) {
        throw new Error("Image size does not match");
    }

    // center camera1 and interactor to center of bouding box
    var centerLPS = stackHelperLeft.stack.worldCenter();
    camera1.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
    camera1.updateProjectionMatrix();
    controlsLeft.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

    // build the gui
    gui(stackHelperLeft, stackHelperRight, settingsVar);

}

