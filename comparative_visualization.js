/* globals dat, AMI*/

// Setup renderer left
var container_left = document.getElementById('container_left');
var renderer_left = new THREE.WebGLRenderer({
    antialias: true
});
renderer_left.setSize(container_left.offsetWidth, container_left.offsetHeight);
renderer_left.setClearColor(0x353535, 1);
renderer_left.setPixelRatio(window.devicePixelRatio);
container_left.appendChild(renderer_left.domElement);

// Setup renderer left
var container_right = document.getElementById('container_right');
var renderer_right = new THREE.WebGLRenderer({
    antialias: true
});
renderer_right.setSize(container_right.offsetWidth, container_right.offsetHeight);
renderer_right.setClearColor(0x353535, 1);
renderer_right.setPixelRatio(window.devicePixelRatio);
container_right.appendChild(renderer_right.domElement);

// Setup scene
var scene = new THREE.Scene();

// Setup camera
var camera = new THREE.PerspectiveCamera(45, container_left.offsetWidth / container_left.offsetHeight, 0.01, 10000000);
camera.position.x = 150;
camera.position.y = 150;
camera.position.z = 100;

// Setup controls
var controls_left = new AMI.TrackballControl(camera, container_left);
var controls_right = new AMI.TrackballControl(camera, container_right);
/**
 * Handle window resize
 */
function onWindowResize() {
    camera.aspect = container_left.offsetWidth / container_left.offsetHeight;
    camera.updateProjectionMatrix();

    renderer_left.setSize(container_left.offsetWidth, container_left.offsetHeight);
    renderer_right.setSize(container_right.offsetWidth, container_right.offsetHeight);
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
    controls_left.update();
    controls_right.update();
    renderer_left.render(scene, camera);
    renderer_right.render(scene, camera);
    // request new frame
    requestAnimationFrame(function() {
        animate();
    });
}
animate();

// Setup loader
var loader_left = new AMI.VolumeLoader(container_left);
var loader_right = new AMI.VolumeLoader(container_right);
var t2 = [
    '36444280',
    '36444294',
    '36444308',
    '36444322',
    '36444336',
    '36444350',
    '36444364',
    '36444378',
    '36444392',
    '36444406',
    '36444434',
    '36444448',
    '36444462',
    '36444476',
    '36444490',
    '36444504',
    '36444518',
    '36444532',
    '36746856'
];
var files = t2.map(function(v) {
    return 'https://cdn.rawgit.com/FNNDSC/data/master/dicom/adi_brain/' + v;
});

loader_left
    .load(files)
    .then(function() {
        // merge files into clean series/stack/frame structure
        var series = loader_left.data[0].mergeSeries(loader_left.data);
        var stack = series[0].stack[0];
        loader_left.free();
        loader_left = null;
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
        controls_left.target.set(centerLPS.x, centerLPS.y, centerLPS.z);
    })
    .catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });

loader_right
    .load(files)
    .then(function() {
        // merge files into clean series/stack/frame structure
        var series = loader_right.data[0].mergeSeries(loader_right.data);
        var stack = series[0].stack[0];
        loader_right.free();
        loader_right = null;
    })
    .catch(function(error) {
        window.console.log('oops... something went wrong...');
        window.console.log(error);
    });
