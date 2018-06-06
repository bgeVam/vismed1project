/* globals dat, AMI*/

// Setup renderer left
var containerLeft = document.getElementById('container_left');
var rendererLeft = new THREE.WebGLRenderer({
    antialias: true
});
rendererLeft.setSize(containerLeft.offsetWidth, containerLeft.offsetHeight);
rendererLeft.setClearColor(0x353535, 1);
rendererLeft.setPixelRatio(window.devicePixelRatio);
containerLeft.appendChild(rendererLeft.domElement);

// Setup renderer right
var containerRight = document.getElementById('container_right');
var rendererRight = new THREE.WebGLRenderer({
    antialias: true
});
rendererRight.setSize(containerRight.offsetWidth, containerRight.offsetHeight);
rendererRight.setClearColor(0x353535, 1);
rendererRight.setPixelRatio(window.devicePixelRatio);
containerRight.appendChild(rendererRight.domElement);

// Setup scene
var sceneLeft = new THREE.Scene();
var sceneRight = new THREE.Scene();

// Setup camera
var camera = new THREE.PerspectiveCamera(45, containerLeft.offsetWidth / containerLeft.offsetHeight, 0.01, 10000000);
camera.position.x = 150;
camera.position.y = 150;
camera.position.z = 100;

// Setup controls
var controlsLeft = new AMI.TrackballControl(camera, containerLeft);
var controlsRight = new AMI.TrackballControl(camera, containerRight);
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
 * Build GUI
 */
 function gui(stackHelperLeft, stackHelperRight) {

    var stackLeft = stackHelperLeft.stack;
    var stackRight = stackHelperRight.stack;

    var gui = new dat.GUI({
        autoPlace: false,
    });
    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    var stackFolder = gui.addFolder('Slice');
    var index = stackFolder
        .add(stackHelperLeft, 'index', 0, stackLeft.dimensionsIJK.z - 1)
        .step(1)
        .listen();
    index.onChange(function(value) {
       //update Right index
       stackHelperRight.index = stackHelperLeft.index;
    });

    var orientation = stackFolder
        .add(stackHelperLeft, 'orientation', 0, 2)
        .step(1)
        .listen();
    orientation.onChange(function(value) {
        index.__max = stackHelperLeft.orientationMaxIndex;
        stackHelperLeft.index = Math.floor(index.__max / 2);
        //update Right orientation and index
        stackHelperRight.orientation = stackHelperLeft.orientation;
        stackHelperRight.index = stackHelperLeft.index;
    });
    stackFolder.open();


    // slice
    var sliceFolder = gui.addFolder('Image');
    var colorDepth = sliceFolder
        .add(stackHelperLeft.slice, 'windowWidth', 1, stackLeft.minMax[1] - stackLeft.minMax[0])
        .step(1)
        .listen();
    colorDepth.onChange(function(value) {
       //update Right colorDepth
       stackHelperRight.slice.windowWidth = stackHelperLeft.slice.windowWidth;
    });
    var brightness = sliceFolder
        .add(stackHelperLeft.slice, 'windowCenter', stackLeft.minMax[0], stackLeft.minMax[1])
        .step(1)
        .listen();
    brightness.onChange(function(value) {
       //update Right brightness
       stackHelperRight.slice.windowCenter = stackHelperLeft.slice.windowCenter;
    });
    var intensityAuto = sliceFolder
        .add(stackHelperLeft.slice, 'intensityAuto')
        .listen();
    intensityAuto.onChange(function(value) {
       //update Right intensityAuto
       stackHelperRight.slice.intensityAuto = stackHelperLeft.slice.intensityAuto;
    });
    var invert = sliceFolder
        .add(stackHelperLeft.slice, 'invert')
        .listen();
    invert.onChange(function(value) {
       //update Right invert
       stackHelperRight.slice.invert = stackHelperLeft.slice.invert;
    });

    sliceFolder.open();

    // bbox
    var bboxFolder = gui.addFolder('Bounding Box');
    bboxFolder.add(stackHelperLeft.bbox, 'visible');
    bboxFolder.open();

    // border
    var borderFolder = gui.addFolder('Border');
    borderFolder.add(stackHelperLeft.border, 'visible');

    borderFolder.open();

    // image settings
    var settingsFolder = gui.addFolder('Settings');
    settingsFolder.open();
}

/**
 * Start animation loop
 */
function animate() {
    controlsLeft.update();
    controlsRight.update();
    rendererLeft.render(sceneLeft, camera);
    rendererRight.render(sceneRight, camera);
    // request new frame
    requestAnimationFrame(function() {
        animate();
    });
}
animate();

// Setup loader
var loaderLeft = new AMI.VolumeLoader(containerLeft);
var loaderRight = new AMI.VolumeLoader(containerRight);

var filesLeft = 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/nifti_normal/T2_9mm_pn0_rf0.nii';
var filesRight = 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/nifti_lesion/T2_9mm_pn0_rf0.nii';

loaderLeft
.load(filesLeft)
.then(function() {
    window.console.log('Done Loading Left');
    loaderRight
    .load(filesRight)
    .then(function() {
        window.console.log('Done Loading Right');
        
        // merge files into clean series/stack/frame structure
        var seriesLeft = loaderLeft.data[0].mergeSeries(loaderLeft.data);
        var stackLeft = seriesLeft[0].stack[0];
        loaderLeft.free();
        loaderLeft = null;

        // merge files into clean series/stack/frame structure
        var seriesRight = loaderRight.data[0].mergeSeries(loaderRight.data);
        var stackRight = seriesRight[0].stack[0];
        loaderRight.free();
        loaderRight = null;

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

        if (stackLeft._dimensionsIJK.z != stackRight._dimensionsIJK.z)
        {
         throw new Error("Image size does not match");
        }
        // build the gui
        gui(stackHelperLeft, stackHelperRight);

        // center camera and interactor to center of bouding box
        var centerLPS = stackHelperLeft.stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        controlsLeft.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    })
    .catch(function(error) {
        window.console.log('Failed to load right');
        window.console.log(error);
    });
})
.catch(function(error) {
    window.console.log('Failed to load left');
    window.console.log(error);
});


