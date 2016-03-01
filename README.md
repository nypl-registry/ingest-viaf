# ingest-viaf
[![travis](https://travis-ci.org/nypl-registry/ingest-viaf.svg)](https://travis-ci.org/nypl-registry/ingest-viaf/)


Creates VIAF lookup table in the registry ingest database


These methods require you have the data downloaded and prepared before executing.

For the inital ingest of clusters and persist data you need to run [download_data.sh](download_data.sh):
```
chmod +x download_data.sh
./download_data.sh 20160215
```
This will create around 115GB of data in that directory.

The ingest process is found in `ingestCluster` and `ingestPersist` methods. These can be run mannualy but would normally be called from the [dispatch module](https://github.com/nypl-registry/dispatch) as a job.



