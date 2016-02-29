#!/bin/bash
echo "***********************************************************************************************"
echo "This script will download about 115GB of data, make sure there is enough disk space!!!
echo "***********************************************************************************************"


if [ -z "$1" ]; then
  echo ""
  echo "  What dataset date to download? e.g. $ ./download_extract.sh 20160215"
  echo ""
  echo "   Check http://viaf.org/viaf/data/ for the latest available."
  echo ""
  exit 1
fi

VIAFDATE=$1

echo "Downaloding http://viaf.org/viaf/data/viaf-${VIAFDATE}-clusters.xml.gz"

wget -O viaf_cluster.xml.gz "http://viaf.org/viaf/data/viaf-${VIAFDATE}-clusters.xml.gz"

echo "Spliting Cluster File"

gunzip -c viaf_cluster.xml.gz | split -l 3000000 - cluster_

echo "Downaloding http://viaf.org/viaf/data/viaf-${VIAFDATE}-persist-rdf.xml.gz"

wget -O viaf_persist.xml.gz "http://viaf.org/viaf/data/viaf-${VIAFDATE}-persist-rdf.xml.gz"

echo "Spliting persist file"
gunzip -c viaf_persist.xml.gz | split -l 1500000 - persist_

echo "Done!""