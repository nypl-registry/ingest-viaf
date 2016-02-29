"use strict"

function IngestViaf() {
	this.ingestCluster = require(__dirname + '/lib/ingest_clusters')(this)
	this.ingestPersist = require(__dirname + '/lib/ingest_persist')(this)
}

module.exports = exports = new IngestViaf();