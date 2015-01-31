#!/bin/sh
mkdir NaturalDocs
naturaldocs -i modules/ -i scripts/ -i routes/ -i public/js/ --output FramedHTML documentation/ --project NaturalDocs
rm -fr NaturalDocs

