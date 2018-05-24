# Comparative Brain Visualization

This projects intention is to realize comparative brain visualization utilizing [AMI](https://github.com/FNNDSC/ami).

To start the application simply launch the index.html file in browser. The comparative_visualization.css file is for designing the elements of the html. The comparative_visualization.js handels the logic of the application. The dicom files are located in the data/ folder. To enable debugging in the browser press "F12" to open the developer options. 

To download an image via post request:
curl -o "file_#1.txt" -X POST  'http://brainweb.bic.mni.mcgill.ca/cgi/brainweb1' --data "do_download_alias=T2+ICBM+normal+1mm+pn0+rf0&download_for_real=%5BStart+download5D&format_value=minc&who_email=&who_institution=&who_name=&zip_value=none"

