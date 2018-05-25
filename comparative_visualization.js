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
'0',
'1',
'2',
'3',
'4',
'5',
'6',
'7',
'8',
'9',
'10',
'11',
'12',
'13',
'14',
'15',
'16',
'17',
'18',
'19',
'20',
'21',
'22',
'23',
'24',
'25',
'26',
'27',
'28',
'29',
'30',
'31',
'32',
'33',
'34',
'35',
'36',
'37',
'38',
'39',
'40',
'41',
'42',
'43',
'44',
'45',
'46',
'47',
'48',
'49',
'50',
'51',
'52',
'53',
'54',
'55',
'56',
'57',
'58',
'59',
'60',
'61',
'62',
'63',
'64',
'65',
'66',
'67',
'68',
'69',
'70',
'71',
'72',
'73',
'74',
'75',
'76',
'77',
'78',
'79',
'80',
'81',
'82',
'83',
'84',
'85',
'86',
'87',
'88',
'89',
'90',
'91',
'92',
'93',
'94',
'95',
'96',
'97',
'98',
'99',
'100',
'101',
'102',
'103',
'104',
'105',
'106',
'107',
'108',
'109',
'110',
'111',
'112',
'113',
'114',
'115',
'116',
'117',
'118',
'119',
'120',
'121',
'122',
'123',
'124',
'125',
'126',
'127',
'128',
'129',
'130',
'131',
'132',
'133',
'134',
'135',
'136',
'137',
'138',
'139',
'140',
'141',
'142',
'143',
'144',
'145',
'146',
'147',
'148',
'149',
'150',
'151',
'152',
'153',
'154',
'155',
'156',
'157',
'158',
'159',
'160',
'161',
'162',
'163',
'164',
'165',
'166',
'167',
'168',
'169',
'170',
'171',
'172',
'173',
'174',
'175',
'176',
'177',
'178',
'179',
'180'
];
var files = t2.map(function(v) {
    return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/pd_icbm_normal_1mm_pn0_rf20/' + v + '.nii';
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
