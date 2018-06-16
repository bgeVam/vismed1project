/**
 * This class handels the overlay visualization.
 */
var customContainer2;
// standard global variables
var controls2;
var renderer2;
var camera2;
//var statsyay;
var threeD;
//
var mouse = {
    x: 0,
    y: 0,
};
var overlayGUI;

function onMouseMove(event) {
    // calculate mouse position in normalized device coordinates
    // (-1 to +1) for both components

    mouse.x = (event.clientX / threeD.clientWidth) * 2 - 1;
    mouse.y = -(event.clientY / threeD.clientHeight) * 2 + 1;

    // push to shaders
    uniformsLayerMix.uMouse.value = new THREE.Vector2(mouse.x, mouse.y);
}

var sceneLayer0TextureTarget;
var sceneLayer1TextureTarget;
var sceneLayer0;
var lutLayer0;
var sceneLayer1;
var meshLayer1;
var uniformsLayer1;
var materialLayer1;
var lutLayer1;
var sceneLayerMix;
var meshLayerMix;
var uniformsLayerMix;
var materialLayerMix;
var stackHelper;

var layer1 = {
    opacity: 1.0,
    lut: null,
    interpolation: 1,
};

var layerMix = {
    opacity0: 1.0,
    opacity1: 1.0,
    type0: 0,
    type1: 1,
    trackMouse: true,
};

/**
 * Build GUI
 */
function buildOverlayGUI(stackHelper, imageParameters) {
    function updateLayer1() {
        // update layer1 geometry...
        if (meshLayer1) {
            meshLayer1.geometry.dispose();
            meshLayer1.geometry = stackHelper.slice.geometry;
            meshLayer1.geometry.verticesNeedUpdate = true;
        }
    }

    function updateLayerMix() {
        // update layer1 geometry...
        if (meshLayerMix) {
            sceneLayerMix.remove(meshLayerMix);
            meshLayerMix.material.dispose();
            // meshLayerMix.material = null;
            meshLayerMix.geometry.dispose();
            // meshLayerMix.geometry = null;

            // add mesh in this scene with right shaders...
            meshLayerMix = new THREE.Mesh(stackHelper.slice.geometry, materialLayerMix);
            // go the LPS space
            meshLayerMix.applyMatrix(stackHelper.stack._ijk2LPS);

            sceneLayerMix.add(meshLayerMix);
        }
    }

    var stack = stackHelper._stack;

    overlayGUI = new dat.GUI({
        autoPlace: false,
    });
    customContainer2 = document.getElementById('my-gui-container2');
    while (customContainer2.firstChild) {
        customContainer2.removeChild(customContainer2.firstChild);
    }
    customContainer2.appendChild(overlayGUI.domElement);
    var params = {
        refresh: false,
        visualization: 'overlay'
    }

    //
    // switch visualization
    //
    var visualizationFolder = overlayGUI.addFolder('Visualization');
    var switchVis = visualizationFolder
        .add(params, 'visualization', ['juxtaposition', 'overlay']);
    switchVis.onChange(function(value) {
        if (value == 'juxtaposition') {
            switchVisualizations();
        }
    })
    visualizationFolder.open();

    //
    // image settings
    //
    var settingsFolder = overlayGUI.addFolder('Settings');
    var mod = settingsFolder
        .add(imageParameters, 'modality', ['T1', 'T2', 'PD'])
    var thickness = settingsFolder
        .add(imageParameters, 'slicethickness', 1, 9).step(1) // funktioniert noch nicht so wie es sollte!      
    var noise = settingsFolder
        .add(imageParameters, 'noise', 0, 9).step(1) // funktioniert noch nicht so wie es sollte!     
    var rf = settingsFolder
        .add(imageParameters, 'rf', {
            '0%': 0,
            '20%': 20,
            '40%': 40
        })
    var refresh = settingsFolder
        .add(params, 'refresh');
    refresh.onChange(function(value) {
        if (imageParameters.slicethickness % 2 == 0) { // even slice thickness does not exist -> 
            imageParameters.slicethickness = imageParameters.slicethickness - 1;
        }
        if ((imageParameters.noise % 2 == 0) && (imageParameters.noise != 0)) {
            imageParameters.noise = imageParameters.noise - 1;
        }
        if (mod.isModified() || thickness.isModified() || noise.isModified() || rf.isModified()) {
            // reload images with current imageParameters
            loadFiles(filesName(imageParameters));
        }
    })
    settingsFolder.open();

    //
    // layer 0 folder
    //
    var layer0Folder = overlayGUI.addFolder('Layer 0 (Normal)');
    layer0Folder
        .add(stackHelper.slice, 'windowWidth', 1, stack.minMax[1])
        .name('Gray Levels')
        .step(1)
        .listen();
    layer0Folder
        .add(stackHelper.slice, 'windowCenter', stack.minMax[0], stack.minMax[1])
        .name('Intensity')
        .step(1)
        .listen();
    layer0Folder.add(stackHelper.slice, 'intensityAuto');
    layer0Folder.add(stackHelper.slice, 'invert');

    var lutUpdate = layer0Folder.add(
        stackHelper.slice, 'lut', lutLayer0.lutsAvailable());
    lutUpdate.onChange(function(value) {
        lutLayer0.lut = value;
        stackHelper.slice.lutTexture = lutLayer0.texture;
    });

    var indexUpdate = layer0Folder.add(
        stackHelper, 'index', 0, stack.dimensionsIJK.z - 1).step(1).listen();
    indexUpdate.onChange(function() {
        updateLayer1();
        updateLayerMix();
    });

    layer0Folder.open();

    //
    // layer 1 folder
    //
    var layer1Folder = overlayGUI.addFolder('Layer 1 (Lesion)');
    var layer1LutUpdate =
        layer1Folder.add(layer1, 'lut', lutLayer1.lutsAvailable());
    layer1LutUpdate.onChange(function(value) {
        lutLayer1.lut = value;
        // propagate to shaders
        uniformsLayer1.uLut.value = 1;
        uniformsLayer1.uTextureLUT.value = lutLayer1.texture;
    });

    layer1Folder.open();

    //
    // layer mix folder
    //
    var layerMixFolder = overlayGUI.addFolder('Layer Mix');
    var opacityLayerMix = layerMixFolder.add(layerMix, 'opacity1', 0, 1).step(0.01).listen();
    opacityLayerMix.onChange(function(value) {
        uniformsLayerMix.uOpacity1.value = value;
    });

    var layerMixTrackMouseUpdate = layerMixFolder.add(layerMix, 'trackMouse');
    layerMixTrackMouseUpdate.onChange(function(value) {
        if (value) {
            uniformsLayerMix.uTrackMouse.value = 1;
        } else {
            uniformsLayerMix.uTrackMouse.value = 0;
        }
    });

    layerMixFolder.open();

    // hook up callbacks
    controls2.addEventListener('OnScroll', function(e) {
        if (e.delta > 0) {
            if (stackHelper.index >= stack.dimensionsIJK.z - 1) {
                return false;
            }
            stackHelper.index += 1;
        } else {
            if (stackHelper.index <= 0) {
                return false;
            }
            stackHelper.index -= 1;
        }

        updateLayer1();
        updateLayerMix();
    });

    updateLayer1();
    updateLayerMix();

    function onWindowResize() {
        var threeD = document.getElementById('r3d');
        camera2.canvas = {
            width: threeD.clientWidth,
            height: threeD.clientHeight,
        };
        camera2.fitBox(2);

        sceneLayer0TextureTarget.setSize(threeD.clientWidth, threeD.clientHeight);
        sceneLayer1TextureTarget.setSize(threeD.clientWidth, threeD.clientHeight);

        renderer2.setSize(threeD.clientWidth, threeD.clientHeight);
    }
    window.addEventListener('resize', onWindowResize, false);
    onWindowResize();

    // mouse move cb
    window.addEventListener('mousemove', onMouseMove, false);
}

function clearImagesOverlay() {
    sceneLayer0.remove(stackHelper);
    sceneLayer1.remove(meshLayer1);
    sceneLayerMix.remove(meshLayerMix);
    customContainer2.removeChild(overlayGUI.domElement);
}


function loadImagesOverlay() {

    updateSeries();
    //force 1st render
    render();
    // notify puppeteer to take screenshot
    const puppetDiv = document.createElement('div');
    puppetDiv.setAttribute('id', 'puppeteer');
    document.body.appendChild(puppetDiv);
    overlayloaded = true;
}

//handles series in loader
function updateSeries() {

    var stack = null;
    var stack2 = null;

    //Fix layers: Lesion always on top
    if (series[0].seriesInstanceUID.includes("nifti_normal")) {
        stack = series[0].stack[0];
        stack2 = series[1].stack[0];
    } else {
        stack = series[1].stack[0];
        stack2 = series[0].stack[0];
    }

    stackHelper = new AMI.StackHelper(stack);
    stackHelper.bbox.visible = false;
    stackHelper.border.visible = false;

    sceneLayer0.add(stackHelper);

    //
    // create layer 1....

    // prepare it
    // * ijk2LPS transforms
    // * Z spacing
    // * etc.
    //
    stack2.prepare();
    // pixels packing for the fragment shaders now happens there
    stack2.pack();

    var textures2 = [];
    for (var m = 0; m < stack2._rawData.length; m++) {
        var tex = new THREE.DataTexture(
            stack2.rawData[m],
            stack2.textureSize,
            stack2.textureSize,
            stack2.textureType,
            THREE.UnsignedByteType,
            THREE.UVMapping,
            THREE.ClampToEdgeWrapping,
            THREE.ClampToEdgeWrapping,
            THREE.NearestFilter,
            THREE.NearestFilter);
        tex.needsUpdate = true;
        tex.flipY = true;
        textures2.push(tex);
    }

    // create material && mesh then add it to sceneLayer1
    uniformsLayer1 = AMI.DataUniformShader.uniforms();
    uniformsLayer1.uTextureSize.value = stack2.textureSize;
    uniformsLayer1.uTextureContainer.value = textures2;
    uniformsLayer1.uWorldToData.value = stack2.lps2IJK;
    uniformsLayer1.uNumberOfChannels.value = stack2.numberOfChannels;
    uniformsLayer1.uPixelType.value = stack2.pixelType;
    uniformsLayer1.uBitsAllocated.value = stack2.bitsAllocated;
    uniformsLayer1.uPackedPerPixel.value = stack2.packedPerPixel;
    uniformsLayer1.uWindowCenterWidth.value = [stack2.windowCenter, stack2.windowWidth];
    uniformsLayer1.uRescaleSlopeIntercept.value = [stack2.rescaleSlope, stack2.rescaleIntercept];
    uniformsLayer1.uDataDimensions.value = [stack2.dimensionsIJK.x, stack2.dimensionsIJK.y, stack2.dimensionsIJK.z];
    uniformsLayer1.uLut.value = [...stack2.minMax];

    // generate shaders on-demand!
    var fs = new AMI.DataFragmentShader(uniformsLayer1);
    var vs = new AMI.DataVertexShader();
    materialLayer1 = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: uniformsLayer1,
        vertexShader: vs.compute(),
        fragmentShader: fs.compute(),
    });

    // add mesh in this scene with right shaders...
    meshLayer1 = new THREE.Mesh(stackHelper.slice.geometry, materialLayer1);
    // go the LPS space
    meshLayer1.applyMatrix(stack._ijk2LPS);
    sceneLayer1.add(meshLayer1);

    // Create the Mix layer
    uniformsLayerMix = AMI.LayerUniformShader.uniforms();
    uniformsLayerMix.uTextureBackTest0.value = sceneLayer0TextureTarget.texture;
    uniformsLayerMix.uTextureBackTest1.value = sceneLayer1TextureTarget.texture;
    uniformsLayerMix.uTrackMouse.value = 1;
    uniformsLayerMix.uMouse.value = new THREE.Vector2(0, 0);

    // generate shaders on-demand!
    var fls = new AMI.LayerFragmentShader(uniformsLayerMix);
    var vls = new AMI.LayerVertexShader();
    materialLayerMix = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        uniforms: uniformsLayerMix,
        vertexShader: vls.compute(),
        fragmentShader: fls.compute(),
        transparent: true,
    });

    // add mesh in this scene with right shaders...
    meshLayerMix = new THREE.Mesh(stackHelper.slice.geometry, materialLayerMix);
    // go the LPS space
    meshLayerMix.applyMatrix(stack._ijk2LPS);
    sceneLayerMix.add(meshLayerMix);

    // set camera2
    var worldbb = stack.worldBoundingBox();
    var lpsDims = new THREE.Vector3(
        worldbb[1] - worldbb[0],
        worldbb[3] - worldbb[2],
        worldbb[5] - worldbb[4]
    );

    // box: {halfDimensions, center}
    var box = {
        center: stack.worldCenter().clone(),
        halfDimensions: new THREE.Vector3(lpsDims.x + 50, lpsDims.y + 50, lpsDims.z + 50),
    };

    // init and zoom
    var canvas = {
        width: threeD.clientWidth,
        height: threeD.clientHeight,
    };

    camera2.directions = [stack.xCosine, stack.yCosine, stack.zCosine];
    camera2.box = box;
    camera2.canvas = canvas;
    camera2.update();
    camera2.fitBox(2);

    // CREATE LUT
    domTarget0 = document.getElementById('my-lut-canvases-l0');
    domTarget1 = document.getElementById('my-lut-canvases-l1');
    if (domTarget0.children.length > 0) {
        domTarget0.removeChild(domTarget0.children[1]);
        domTarget0.removeChild(domTarget0.children[0]);
    }
    if (domTarget1.children.length > 0) {
        domTarget1.removeChild(domTarget1.children[1]);
        domTarget1.removeChild(domTarget1.children[0]);
    }

    lutLayer0 = new AMI.LutHelper(
        domTarget0,
        'default',
        'linear', [
            [0, 0, 0, 0],
            [1, 1, 1, 1]
        ], [
            [0, 1],
            [1, 1]
        ]);
    lutLayer0.luts = AMI.LutHelper.presetLuts();

    lutLayer1 = new AMI.LutHelper(
        domTarget1,
        'default',
        'linear', [
            [0, 0, 0, 0],
            [1, 1, 1, 1]
        ], [
            [0, 1],
            [1, 1]
        ]);
    lutLayer1.luts = AMI.LutHelper.presetLuts();
    layer1.lut = lutLayer1;

    buildOverlayGUI(stackHelper, imageParameters);
}

function render() {
    // render
    controls2.update();
    // render first layer offscreen
    renderer2.render(sceneLayer0, camera2, sceneLayer0TextureTarget, true);
    // render second layer offscreen
    renderer2.render(sceneLayer1, camera2, sceneLayer1TextureTarget, true);
    // mix the layers and render it ON screen!
    renderer2.render(sceneLayerMix, camera2);
    //statsyay.update();
}

/**
 * initalize function
 */
function initOverlay() {
    // init threeJS...
    // this function is executed on each animation frame
    function animate() {
        render();

        // request new frame
        requestAnimationFrame(function() {
            animate();
        });
    }

    if (overlayinit == false) {
        // renderer2
        threeD = document.getElementById('r3d');
        renderer2 = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
        });
        renderer2.setSize(threeD.clientWidth, threeD.clientHeight);
        renderer2.setClearColor(0x353535, 1);

        threeD.appendChild(renderer2.domElement);

        // stats
        //statsyay = new Stats();
        //threeD.appendChild(statsyay.domElement);

        // scene
        sceneLayer0 = new THREE.Scene();
        sceneLayer1 = new THREE.Scene();
        sceneLayerMix = new THREE.Scene();

        // render to texture!!!!
        sceneLayer0TextureTarget = new THREE.WebGLRenderTarget(
            threeD.clientWidth,
            threeD.clientHeight, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
            });

        sceneLayer1TextureTarget = new THREE.WebGLRenderTarget(
            threeD.clientWidth,
            threeD.clientHeight, {
                minFilter: THREE.LinearFilter,
                magFilter: THREE.NearestFilter,
                format: THREE.RGBAFormat,
            });

        // camera2
        camera2 = new AMI.OrthographicCamera(
            threeD.clientWidth / -2, threeD.clientWidth / 2,
            threeD.clientHeight / 2, threeD.clientHeight / -2,
            0.1, 10000);

        // controls2
        controls2 = new AMI.TrackballOrthoControl(camera2, threeD);
        controls2.staticMoving = true;
        controls2.noRotate = true;
        camera2.controls = controls2;
    }

    overlayinit = true;
    animate();


    loadImagesOverlay();
};