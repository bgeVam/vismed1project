# Comparative Brain Visualization

This projects intention is to realize comparative brain visualization utilizing [AMI](https://github.com/FNNDSC/ami). The goal of this application is to provide a comparative visualization tool to make a comparison between healthy brain MRIs and MRIs with Multiple sclerosis (MS) lesions possible.

Check out the application online, hosted by GitHub Pages:

https://bgevam.github.io/vismed1project/


## Overlay Visualization
![Alt Text](https://github.com/bgeVam/vismed1project/blob/master/overlay.gif)

## Juxtaposition Visualization
![Alt Text](https://github.com/bgeVam/vismed1project/blob/master/juxtaposition.gif)

## How to run locally?

1. Clone this repository
```
git clone https://github.com/bgeVam/vismed1project.git
```
2. Run a webserver
```
# If Python version returned above is 3.X
python -m http.server
# If Python version returned above is 2.X
python -m SimpleHTTPServer
```

3. Access index.html in your browser

[http://localhost:8000](http://localhost:8000)

To start the application simply launch the index.html file in browser. The comparative_visualization.css file is for designing the elements of the html. The *.js files handle the logic of the application. The image files are located in the data/ folder. To enable debugging in the browser press "F12" to open the developer options. 

## Background

 Multiple sclerosis (MS) is a chronic autoimmune disorder that damages the central nervous system. Magnetic Resonance Imaging (MRI) is used for the diagnosis of MS. The goal of this work is to provide a comparative visualization tool to make a comparison between healthy brain MRIs and MRIs with MS lesions possible. Thus, the understanding of how MS affects the brain should be improved. The used dataset was taken from the BrainWeb database and consists of the simulated MRI data files of a normal brain and of a patient with MS. The developed tool is a web application including two visualization approaches: juxtaposition and a hybrid method of superimposition and interchangeable. Selected visualization parameters, such as the intensity and gray level can be adapted to the users preference as well as image parameters, such as the visible slice index or the orientation. Furthermore, it can be chosen for both methods between different dataset parameters, such as data acquisition modality, noise level or slice thickness. 
 
## BrainWeb

All images used in this application are provided by the [BrainWeb](http://brainweb.bic.mni.mcgill.ca/). Use the following curl snipped to download an image via post request:

```sh
curl -o "image.mnc" -X POST "http://brainweb.bic.mni.mcgill.ca/cgi/brainweb1" \
--data $(cat <<EOF
do_download_alias=T2\
+ICBM\
+normal\
+1mm\
+pn0\
+rf0\
&download_for_real=%5BStart+download5D\
&format_value=minc\
&zip_value=none
EOF
)
```

