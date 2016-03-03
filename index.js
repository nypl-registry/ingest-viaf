'use strict'

function IngestViaf () {
  /**
   * Will prompt for the location of the VIAF cluster split file and fork a process for each file bulk inserting it into the registry-ingest database
   *
   * @param  {function} cb - Nothing returned
   */
  this.ingestCluster = require(`${__dirname}/lib/ingest_clusters`)(this)

  /**
   * Will do the same prompt and update the existing cluster with previous ids that redirect to it.
   *
   * @param  {function} cb - Nothing returned
   */
  this.ingestPersist = require(`${__dirname}/lib/ingest_persist`)(this)
}

module.exports = exports = new IngestViaf()
