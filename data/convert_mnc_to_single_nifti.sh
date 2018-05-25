#!/bin/bash
#Read MINC FILE
FILE=$1;
if [ ! -f $FILE ]; then
    echo "File not found!";
    exit 0;
fi
#Create OUTPUT_DIRECTORY for NIFTI FILEs
OUTPUT_DIRECTORY=${FILE%.mnc};
mkdir $OUTPUT_DIRECTORY;

#For each slice
counter=180
until [  $counter -lt 0 ]; do
	echo "Extract slice #"$counter
#Extract slice at index of counter
	mincreshape $FILE $counter.mnc -dimrange zspace=$counter,1
#Convert sclice to NIFTI
	mnc2nii $counter.mnc $OUTPUT_DIRECTORY"/"$counter.nii
	rm $counter.mnc
	let counter-=1
done
exit 0;
rm -rf $OUTPUT_DIRECTORY;