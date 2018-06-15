/**
 * This class loads images into the visualizations.
 */
var visualization1init = false;
var visualization2init = false;
var series;
var container = document.getElementById('container');
var imageParameters = {
    modality: 'T2',
    slicethickness: 9,
    noise: 0,
    rf: 0
}

function buildFileName(state, mod, thickness, noise, rf) {
    return 'nifti_' + state + '/' + mod + '_' + thickness + 'mm_pn' + noise + '_rf' + rf + '.nii';
}

function filesName(imageParameters) {
    var images = [
    buildFileName('normal', imageParameters.modality, imageParameters.slicethickness, imageParameters.noise, imageParameters.rf),
    buildFileName('lesion', imageParameters.modality, imageParameters.slicethickness, imageParameters.noise, imageParameters.rf)
    ];
    var files = images.map(
        function (v) {
         return 'data/' + v;
     }
     );
    return files;
}

loadFiles(filesName(imageParameters));

function loadFiles(files) {
    var universalLoader = new AMI.VolumeLoader(container);
    console.log(files);
    console.log("Loading images for " + imageParameters.modality + "/" + imageParameters.slicethickness + "/" + imageParameters.noise + "/" + imageParameters.rf);
    universalLoader
    .load(files)
    .then(function () { 
        series = universalLoader.data[0].mergeSeries(universalLoader.data);
        loadImagesVisualization1();
        if (visualization2init == true) {
           loadImagesVisualization2();
       }
       universalLoader.free();
       universalLoader = null;
   })
    .catch(function (error) {
        window.console.log('Failed to load images');
        window.console.log(error);
    });
}