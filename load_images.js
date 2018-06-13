/**
Create (default) files with variable settings
*/
var series;
var container = document.getElementById('container');


function fileName(state, mod, thickness, noise, rf) {
    return 'nifti_' + state + '/' + mod + '_' + thickness + 'mm_pn' + noise + '_rf' + rf + '.nii';
}

function filesName(settingsVar) {
    var images = [
    fileName('normal', settingsVar.modality, settingsVar.slicethickness, settingsVar.noise, settingsVar.rf),
    fileName('lesion', settingsVar.modality, settingsVar.slicethickness, settingsVar.noise, settingsVar.rf)
    ];
    var files = images.map(function (v) {
     return 'https://cdn.rawgit.com/bgeVam/vismed1project/master/data/' + v;
 });
    return files;
}

// variable for settings
var settingsVar = {
    modality: 'T2',
    slicethickness: 9,
    noise: 0,
    rf: 0
}

loadFiles(filesName(settingsVar));

function loadFiles(files) {
    var universalLoader = new AMI.VolumeLoader(container);
    console.log(files);
    console.log("Loading images for " + settingsVar.modality + "/" + settingsVar.slicethickness + "/" + settingsVar.noise + "/" + settingsVar.rf);
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