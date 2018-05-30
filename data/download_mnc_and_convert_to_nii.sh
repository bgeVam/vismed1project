#!/bin/bash
# 
#
#
# This script is used to automatically download brain image data from the website brainweb.
# The script iterates over all available options on brainweb, downloads the corresponding
# image via CURL and converts it to nifti using mnc2nii. When this process is complete the 
# image is commited in a single commit to the github repository in order to maintain a 
# step-by-step progress of the image data in the repository.
#
#
#
# Modality
#  * T1 (Longitudinal Relaxation Time)
#      Tissue with high water content will appear darker (fat, edema)
#      Tissue with low water content will appear brighter (bones)
#  * T2 (Transversal Relaxation Time)
#      Tissue with high water content will appear brighter
#      Tissue with low water content will appear darker
#  * PD (Proton Density) higher concentration or density of hydrogen atoms...brightest
modalities=( "T1" "T2" "PD" )

# Slice thickness (in-plane pixel size is always 1x1mm)
#  * 1mm
#  * 3mm
#  * 5mm
#  * 7mm
#  * 9mm
thicknesses=( "1mm" "3mm" "5mm" "7mm" "9mm" )

# Noise (calculated relative to the brightest tissue)
#  * 0%
#  * 1%
#  * 3%
#  * 5%
#  * 7%
#  * 9%
noises=( "pn0" "pn1" "pn3" "pn5" "pn7" "pn9" )

# Intensity non-uniformity ("RF")
#  * 0%
#  * 20%
#  * 40%
rfs=( "rf0" "rf20" "rf40" )

# Normal Brain Data
# PROTOCOL="ICBM"
# PHANTOM_NAME="normal"
# SITE="brainweb1"

# MS Brain Data
PROTOCOL="AI"
PHANTOM_NAME="msles2"
SITE="brainweb2"

# Static Values
FORMAT="minc"
ZIP_VALUE="none"
DOWNLOAD_FOR_REAL="%5BStart+download5D"


# Download mnc file
#  * $1 modality
#  * $2 thickness
#  * $3 noise
#  * $4 rf
function download_mnc_file {
	modality=$1
	thickness=$2
	noise=$3
	rf=$4
	base_filename=$modality"_"$thickness"_"$noise"_"$rf

curl -o "$base_filename.mnc" -X POST "http://brainweb.bic.mni.mcgill.ca/cgi/$SITE" \
--data $(cat <<EOF
do_download_alias=$modality\
+$PROTOCOL\
+$PHANTOM_NAME\
+$thickness\
+$noise\
+$rf\
&download_for_real=$DOWNLOAD_FOR_REAL\
&format_value=$FORMAT\
&zip_value=$ZIP_VALUE
EOF
)
}


for ((a=0;a<${#modalities[@]};++a)); do
    for ((b=0;b<${#thicknesses[@]};++b)); do
        for ((c=0;c<${#noises[@]};++c)); do
            for ((d=0;d<${#rfs[@]};++d)); do
                echo "##########   Get Image Data for " "Modality: ${modalities[a]}" "Thickness: ${thicknesses[b]}" "Noise: ${noises[c]}" "RF: ${rfs[d]}" "    ################"
                download_mnc_file "${modalities[a]}" "${thicknesses[b]}" "${noises[c]}" "${rfs[d]}"
                mnc2nii $base_filename.mnc nifti_lesion/$base_filename.nii
                rm $base_filename.mnc
                git add nifti_lesion/$base_filename.nii
                git commit -m "Add $base_filename.nii to lesion data"
                git update-index --assume-unchanged nifti_lesion/$base_filename.nii
                git push origin master
            done
        done
    done
done
