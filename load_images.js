/**
 * This class loads images into the visualizations.
 */
var juxtapositionloaded = false;
var overlayloaded = false;
var CustomProgressBar = function(container) {
    this._container = container;
    this._modes = {
        load: {
            name: 'load',
            color: '#FF0000'
        },
        parse: {
            name: 'parse',
            color: '#00FF00'
        }
    };
    this._requestAnimationFrameID = null;
    this._mode = null;
    this._value = null;
    this._total = null;

    this.init = function() {
        var container = document.createElement('div');
        container.classList.add('progress');
        container.classList.add('container');
        container.innerHTML =
            '<div class="progress load"></div><div class="progress parse">Loading image... <div class="beat">♥</div></div>';
        this._container.appendChild(container);
        // start rendering loop
        this.updateUI();
    }.bind(this);

    this.update = function(value, total, mode) {
        this._mode = mode;
        this._value = value;
        // depending on CDN, total return to XHTTPRequest can be 0.
        // In this case, we generate a random number to animate the progressbar
        if (total === 0) {
            this._total = value;
            this._value = Math.random() * value;
        } else {
            this._total = total;
        }
    }.bind(this);

    this.updateUI = function() {
        var self = this;
        this._requestAnimationFrameID = requestAnimationFrame(self.updateUI);

        if (!(
                this._modes.hasOwnProperty(this._mode) &&
                this._modes[this._mode].hasOwnProperty('name') &&
                this._modes[this._mode].hasOwnProperty('color')
            )) {
            return false;
        }

        var progress = Math.round(this._value / this._total * 100);
        var color = this._modes[this._mode].color;

        var progressBar = this._container.getElementsByClassName('progress ' + this._modes[this._mode].name);
        if (progressBar.length > 0) {
            progressBar[0].style.borderColor = color;
            progressBar[0].style.width = progress + '%';
        }
        progressBar = null;

        if (this._mode === 'parse') {
            // hide progress load
            var loader = this._container.getElementsByClassName('progress load');
            loader[0].style.display = 'none';
            // show progress parse
            var container = this._container.getElementsByClassName('progress container');
            container[0].style.height = 'auto';
            container[0].style.width = 'auto';
            container[0].style.padding = '10px';
            var parser = this._container.getElementsByClassName('progress parse');
            parser[0].style.display = 'block';
            parser[0].style.width = '100%';
        }
    }.bind(this);

    this.free = function() {
        var progressContainers = this._container.getElementsByClassName('progress container');
        // console.log( progressContainers );
        if (progressContainers.length > 0) {
            progressContainers[0].parentNode.removeChild(progressContainers[0]);
        }
        progressContainers = null;
        // stop rendering loop
        window.cancelAnimationFrame(this._requestAnimationFrameID);
    }.bind(this);

    this.init();
};


var juxtapositioninit = false;
var overlayinit = false;
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
        function(v) {
            return 'data/' + v;
        }
    );
    return files;
}

loadFiles(filesName(imageParameters));

function loadFiles(files) {
    var universalLoader = new AMI.VolumeLoader(container, CustomProgressBar);
    console.log(files);
    console.log("Loading images for " + imageParameters.modality + "/" + imageParameters.slicethickness + "/" + imageParameters.noise + "/" + imageParameters.rf);
    universalLoader
        .load(files)
        .then(function() {
            series = universalLoader.data[0].mergeSeries(universalLoader.data);
            if (juxtapositionloaded == true) {
                clearImagesJuxtaposition();
            }
            loadImagesJuxtaposition();
            if (overlayloaded == true) {
                clearImagesOverlay();
            }
            if (overlayinit == true) {
                loadImagesOverlay();
            }
            universalLoader.free();
            universalLoader = null;
        })
        .catch(function(error) {
            window.console.log('Failed to load images');
            window.console.log(error);
        });
}