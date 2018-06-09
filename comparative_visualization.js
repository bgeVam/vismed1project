/* globals dat, AMI*/

//Setup link
var link = document.getElementById('ab');

/**
initalize function
*/
function init() {
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

    // Setup camera
    camera = new THREE.PerspectiveCamera(45, containerLeft.offsetWidth / containerLeft.offsetHeight, 0.01, 10000000);
    camera.position.x = 150;
    camera.position.y = 150;
    camera.position.z = 100;

    // Setup controls
    controlsLeft = new AMI.TrackballControl(camera, containerLeft);
    controlsRight = new AMI.TrackballControl(camera, containerRight);


    /**
     * Handle window resize
     */
    function onWindowResize() {
        camera.aspect = containerLeft.offsetWidth / containerLeft.offsetHeight;
        camera.updateProjectionMatrix();

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
        rendererLeft.render(sceneLeft, camera);
        rendererRight.render(sceneRight, camera);
        // request new frame
        requestAnimationFrame(function () {
            animate();
        });
    }
    animate();
}
init();

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
    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

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
    // var switchVisualization = document.createElement('a');
    // var linkText = document.createTextNode("Switch Visualizations");
    // switchVisualization.appendChild(linkText);
    // switchVisualization.title = "Switch Visualizations";
    // switchVisualization.href = "viewers_compare.html";
    // switchVisualization.setAttribute("class", "abc");
    // customContainer.appendChild(switchVisualization);

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
        if (mod.isModified() || thickness.isModified() || noise.isModified || rf.isModified) {
            // reload images with current settingsVar - noch nicht ganz richtig, da altes ebenfalls noch dargestellt wird
            sceneRight.remove(stackHelperRight);
            sceneLeft.remove(stackHelperLeft);
            customContainer.removeChild(gui.domElement);
            loadImages(filesName(settingsVar));
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

/**
Create (default) files with variable settings
*/
function fileName(state, mod, thickness, noise, rf) {
    return 'nifti_' + state + '/' + mod + '_' + thickness + 'mm_pn' + noise + '_rf' + rf + '.nii';
}

function filesName(settingsVar) {
    let images = [
        fileName('normal', settingsVar.modality, settingsVar.slicethickness, settingsVar.noise, settingsVar.rf),
        fileName('lesion', settingsVar.modality, settingsVar.slicethickness, settingsVar.noise, settingsVar.rf)
    ];
    let files = images.map(function (v) {
        return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/' + v;
    });
    return files;
}

// variable for settings
let settingsVar = {
    modality: 'T2',
    slicethickness: 9,
    noise: 0,
    rf: 0,
}
let files = filesName(settingsVar);

// var images = [
//     fileName('normal',settingsVar.modality,settingsVar.slicethickness,settingsVar.noise,settingsVar.rf),
//     fileName('lesion',settingsVar.modality,settingsVar.slicethickness,settingsVar.noise,settingsVar.rf)
// ];

// var images = [
//     'nifti_normal/T2_9mm_pn0_rf0.nii',//left  = normal
//     'nifti_lesion/T2_9mm_pn0_rf0.nii' //right = lesion
// // ];
// var files = images.map(function(v) {
//     return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/' + v;
// });

/*
Setup loader
*/
function loadImages(files) {

    var loader = new AMI.VolumeLoader(containerLeft);

    loader
        .load(files)
        .then(function () {

            var series = loader.data[0].mergeSeries(loader.data);
            console.log("LEFT IS" + series[0]._seriesInstanceUID);
            console.log("RIGHT IS" + series[1]._seriesInstanceUID);
            var stackLeft = series[0].stack[0];
            var stackRight = series[1].stack[0];
            loader.free();
            loader = null;

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

            // center camera and interactor to center of bouding box
            var centerLPS = stackHelperLeft.stack.worldCenter();
            camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
            camera.updateProjectionMatrix();
            controlsLeft.target.set(centerLPS.x, centerLPS.y, centerLPS.z);

            // build the gui
            gui(stackHelperLeft, stackHelperRight, settingsVar);
        })
        .catch(function (error) {
            window.console.log('Failed to load images');
            window.console.log(error);
        });
}

loadImages(files)
