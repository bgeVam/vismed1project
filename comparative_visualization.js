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
var scene = new THREE.Scene();

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
function gui(stackHelper) {
    var stack = stackHelper.stack;
    var gui = new dat.GUI({
        autoPlace: false,
    });
    var customContainer = document.getElementById('my-gui-container');
    customContainer.appendChild(gui.domElement);

    // stack
    var stackFolder = gui.addFolder('Stack');
    // index range depends on stackHelper orientation.
    var index = stackFolder
        .add(stackHelper, 'index', 0, stack.dimensionsIJK.z - 1)
        .step(1)
        .listen();
    var orientation = stackFolder
        .add(stackHelper, 'orientation', 0, 2)
        .step(1)
        .listen();
    orientation.onChange(function(value) {
        index.__max = stackHelper.orientationMaxIndex;
        // center index
        stackHelper.index = Math.floor(index.__max / 2);
    });
    stackFolder.open();

    // slice
    var sliceFolder = gui.addFolder('Slice');
    sliceFolder
        .add(stackHelper.slice, 'windowWidth', 1, stack.minMax[1] - stack.minMax[0])
        .step(1)
        .listen();
    sliceFolder
        .add(stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
        .step(1)
        .listen();
    sliceFolder.add(stackHelper.slice, 'intensityAuto').listen();
    sliceFolder.add(stackHelper.slice, 'invert');
    sliceFolder.open();

    // bbox
    var bboxFolder = gui.addFolder('Bounding Box');
    bboxFolder.add(stackHelper.bbox, 'visible');
    bboxFolder.addColor(stackHelper.bbox, 'color');
    bboxFolder.open();

    // border
    var borderFolder = gui.addFolder('Border');
    borderFolder.add(stackHelper.border, 'visible');
    borderFolder.addColor(stackHelper.border, 'color');
    borderFolder.open();
}

/**
 * Start animation loop
 */
function animate() {
    controlsLeft.update();
    controlsRight.update();
    rendererLeft.render(scene, camera);
    rendererRight.render(scene, camera);
    // request new frame
    requestAnimationFrame(function() {
        animate();
    });
}
animate();

// Setup loader
var loaderLeft = new AMI.VolumeLoader(containerLeft);
var loaderRight = new AMI.VolumeLoader(containerRight);
var t2 = [
    '00000',
    '00001',
    '00002',
    '00003'
];
var files = t2.map(function(v) {
    return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/nifti/t1_icbm_normal_1mm_pn0_rf20.nii';
});

loaderLeft
    .load(files)
    .then(function() {
        // merge files into clean series/stack/frame structure
        var series = loaderLeft.data[0].mergeSeries(loaderLeft.data);
        var stack = series[0].stack[0];
        loaderLeft.free();
        loaderLeft = null;
        // be carefull that series and target stack exist!
        var stackHelper = new AMI.StackHelper(stack);
        stackHelper.bbox.color = 0x8bc34a;
        stackHelper.border.color = 0xf44336;

        scene.add(stackHelper);

        // build the gui
        gui(stackHelper);

        // center camera and interactor to center of bouding box
        var centerLPS = stackHelper.stack.worldCenter();
        camera.lookAt(centerLPS.x, centerLPS.y, centerLPS.z);
        camera.updateProjectionMatrix();
        controlsLeft.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    })
    .catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });

loaderRight
    .load(files)
    .then(function() {
        // merge files into clean series/stack/frame structure
        var series = loaderRight.data[0].mergeSeries(loaderRight.data);
        var stack = series[0].stack[0];
        loaderRight.free();
        loaderRight = null;
    })
    .catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });
