/**
 * This class handels the juxtaposition visualization.
 */
var customContainer1;
var stackHelperLeft;
var stackHelperRight;
var juxtapositionGUI;

/**
 * initalize function
 */
function initJuxtaposition() {

    if (juxtapositioninit == false) {
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
        juxtapositioninit = true;
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

        requestAnimationFrame(function() {
            if (visualization == 1) {
                animate();
            }
        });
    }
    animate();
}

/**
 * Build GUI
 */
function buildJuxtapositionGUI(stackHelperLeft, stackHelperRight, imageParameters) {

    var stackLeft = stackHelperLeft.stack;
    var stackRight = stackHelperRight.stack;
    
    var refreshButton = function(imageParameters){
        this.mod = imageParameters.modality;
        this.thickness = imageParameters.slicethickness;
        this.noise = imageParameters.noise;
        this.rf = imageParameters.rf;
        this.refreshSwitch = function(imageParameters){
            if (this.mod!=imageParameters.modality || this.thickness!=imageParameters.slicethickness || this.noise != imageParameters.noise || this.rf != imageParameters.rf){
                return true;
            }
            else {
                return false;
            }
        }
        this.refresh = function(){
            if (this.refreshSwitch(imageParameters)){
                if (imageParameters.slicethickness % 2 == 0) { // even slice thickness does not exist -> 
                    imageParameters.slicethickness = imageParameters.slicethickness - 1;
                }
                if ((imageParameters.noise % 2 == 0) && (imageParameters.noise != 0)) {
                    imageParameters.noise = imageParameters.noise - 1;
                }
                loadFiles(filesName(imageParameters));
            }
        }
    }

    var params = {
        visualization: 'juxtaposition',
        orientation: 0        
    }

    juxtapositionGUI = new dat.GUI({
        autoPlace: false
    });
    customContainer1 = document.getElementById('my-gui-container1');
    while (customContainer1.firstChild) {
        customContainer1.removeChild(customContainer1.firstChild);
    }
    customContainer1.appendChild(juxtapositionGUI.domElement);

    // switch visualization
    var visualizationFolder = juxtapositionGUI.addFolder('Visualization');
    var switchVis = visualizationFolder
        .add(params, 'visualization', ['juxtaposition', 'overlay'])
        .name('Visualization');
    switchVis.onChange(function(value) {
        if (value == 'overlay') {
            switchVisualizations();
        }
    })
    visualizationFolder.open();

    // image settings
    var settingsFolder = juxtapositionGUI.addFolder('Settings');
    var mod = settingsFolder
        .add(imageParameters, 'modality', ['T1', 'T2', 'PD'])
        .name('Modality');
    var thickness = settingsFolder
        .add(imageParameters, 'slicethickness', 1, 9).step(1) // funktioniert noch nicht so wie es sollte!  
        .name('Slice thickness');  
    var noise = settingsFolder
        .add(imageParameters, 'noise', 0, 9).step(1) // funktioniert noch nicht so wie es sollte! 
        .name('Noise level');   
    var rf = settingsFolder
        .add(imageParameters, 'rf', {
            '0%': 0,
            '20%': 20,
            '40%': 40
        })
        .name('RF');
    var button = new refreshButton(imageParameters);
    var refresh = settingsFolder
        .add(button,'refresh')
        .name('Refresh images')
    settingsFolder.open();

    // slice
    var stackFolder = juxtapositionGUI.addFolder('Slice');
    var index = stackFolder
        .add(stackHelperLeft, 'index', 0, stackLeft.dimensionsIJK.z - 1)
        .name('Slice index')
        .step(1)
        .listen();
    index.onChange(function(value) {
        //update Right index
        stackHelperRight.index = stackHelperLeft.index;
    });
    var orientation = stackFolder
        .add(params,'orientation', {
            axial: 0,
            sagittal: 1,
            coronal: 2
        })
        .name('Orientation')
    orientation.onChange(function(value) {
        stackHelperLeft.orientation = Number(value);
        index.__max = stackHelperLeft.orientationMaxIndex;
        stackHelperLeft.index = Math.floor(index.__max / 2);
        //update Right orientation and index
        stackHelperRight.orientation = stackHelperLeft.orientation;
        stackHelperRight.index = stackHelperLeft.index;
    });
    stackFolder.open();

    // image
    var sliceFolder = juxtapositionGUI.addFolder('Image');
    var grayLevel = sliceFolder
        .add(stackHelperLeft.slice, 'windowWidth', 1, stackLeft.minMax[1] - stackLeft.minMax[0])
        .name('Gray Levels')
        .step(1)
        .listen();
    grayLevel.onChange(function(value) {
        //update Right grayLevel
        stackHelperRight.slice.windowWidth = stackHelperLeft.slice.windowWidth;
    });
    var intensity = sliceFolder
        .add(stackHelperLeft.slice, 'windowCenter', stackLeft.minMax[0], stackLeft.minMax[1])
        .name('Intensity')
        .step(1)
        .listen();
    intensity.onChange(function(value) {
        //update Right intensity
        stackHelperRight.slice.windowCenter = stackHelperLeft.slice.windowCenter;
    });
    var intensityAuto = sliceFolder
        .add(stackHelperLeft.slice, 'intensityAuto')
        .name('Reset Intensity')
        .listen();
    intensityAuto.onChange(function(value) {
        //update Right intensityAuto
        stackHelperRight.slice.intensityAuto = stackHelperLeft.slice.intensityAuto;
    });
    var invert = sliceFolder
        .add(stackHelperLeft.slice, 'invert')
        .name('Invert')
        .listen();
    invert.onChange(function(value) {
        //update Right invert
        stackHelperRight.slice.invert = stackHelperLeft.slice.invert;
    });
    sliceFolder.close();

    // bbox
    var bboxFolder = juxtapositionGUI.addFolder('Bounding Box');
    var boundingVisible = bboxFolder
        .add(stackHelperLeft.bbox, 'visible');
    boundingVisible.onChange(function(value) {
        //update Right invert
        stackHelperRight.bbox.visible = stackHelperLeft.bbox.visible;
    });
    bboxFolder.close();

    // border
    var borderFolder = juxtapositionGUI.addFolder('Border');
    var borderVisible = borderFolder
        .add(stackHelperLeft.border, 'visible');
    borderVisible.onChange(function(value) {
        //update Right invert
        stackHelperRight.border.visible = stackHelperLeft.border.visible;
    });
    borderFolder.close();
}

function clearImagesJuxtaposition() {
    sceneRight.remove(stackHelperRight);
    sceneLeft.remove(stackHelperLeft);
    customContainer1.removeChild(juxtapositionGUI.domElement);
}

function loadImagesJuxtaposition() {
    //console.log("LEFT IS" + series[0]._seriesInstanceUID);
    //console.log("RIGHT IS" + series[1]._seriesInstanceUID);
    var stackLeft = null;
    var stackRight = null;

    //Fix layers: Lesion always left
    if (series[0].seriesInstanceUID.includes("nifti_normal")) {
        stackLeft = series[1].stack[0];
        stackRight = series[0].stack[0];
    } else {
        stackLeft = series[0].stack[0];
        stackRight = series[1].stack[0];
    }

    // be carefull that series and target stack exist!
    stackHelperLeft = new AMI.StackHelper(stackLeft);
    stackHelperLeft.bbox.color = 0x8bc34a;
    stackHelperLeft.border.color = 0xf44336;
    sceneLeft.add(stackHelperLeft);

    // be carefull that series and target stack exist!
    stackHelperRight = new AMI.StackHelper(stackRight);
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

    // build the juxtapositionGUI
    buildJuxtapositionGUI(stackHelperLeft, stackHelperRight, imageParameters);
    juxtapositionloaded = true;
}