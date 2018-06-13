/**
Create (default) files with variable settings
*/
var series;
var container = document.getElementById('container');


function fileName(state, mod, thickness, noise, rf) {
    return 'nifti_' + state + '/' + mod + '_' + thickness + 'mm_pn' + noise + '_rf' + rf + '.nii';
}

function filesName(imageParameters) {
    var images = [
    fileName('normal', imageParameters.modality, imageParameters.slicethickness, imageParameters.noise, imageParameters.rf),
    fileName('lesion', imageParameters.modality, imageParameters.slicethickness, imageParameters.noise, imageParameters.rf)
    ];
    var files = images.map(function (v) {
     return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/' + v;
 });
    return files;
}

// variable for settings
var imageParameters = {
    modality: 'T2',
    slicethickness: 9,
    noise: 0,
    rf: 0
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