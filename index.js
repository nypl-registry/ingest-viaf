"use strict"

function IngestViaf() {
	this.ingestCluster = require(__dirname + '/lib/ingest_clusters')(this)
}

module.exports = exports = new IngestViaf();