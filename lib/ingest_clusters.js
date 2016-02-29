"use strict"

module.exports = function(){

	return function(callback){

		var db = require("nypl-registry-utils-database")
		var cluster = require('cluster')
		var glob = require('glob')
		var prompt = require('prompt')
		var clc = require('cli-color')

		var total=0


		if (cluster.isMaster) {
			//first find out where the files are, default to the data directory of the execution
			var promptSchema = {
				properties: {
					path: {
						message: 'Path to VIAF data',
						required: true,
						//default: process.cwd()+ "/data/"
						default: '/Volumes/beastmachine.local/Desktop/matts/viaf/'
					}
				}
			}
			prompt.start()
			prompt.get(promptSchema, function (err, result) {
				//make sure some of the datafiles we are expecting are there
				glob(result.path + "cluster_*", function (err, files) {
					if (files.length==0) throw new Error("Could not find the cluster files at:" + result.path + "cluster_*")

					console.log(clc.whiteBright.bgRedBright("----- About to Drop the VIAF collection in 5 seconds ----- ctrl-c now to abort"))
					setTimeout(function(){
						//files=[files[0]]
						db.prepareViaf(function(){


							//done with db
							db.databaseClose()

							//make a copy of the array so we don't edit it while looping through
							JSON.parse(JSON.stringify(files)).forEach(filepath =>{
								var worker = cluster.fork()
								//the worker will send a request message to us for two reasons
								worker.on('message', function(msg) {
									//asking for the file name to use, send them the filename
									if (msg.request){
										worker.send({ work: files.shift() })
									}
									//reporting back how many clusters it has inserted
									if (msg.report){
										total = total+ msg.report
										process.stdout.cursorTo(0)
										process.stdout.write("Total Inserted: "+ clc.black.bgGreenBright(total))
									}
								})
							})
						})
					},5000)

				})
			})

			cluster.on('exit', (worker, code, signal) => {
				if (Object.keys(cluster.workers).length==0){
					if (callback) callback()
				}
			})

		}else{

			//THE WORKER
			var viafParse = require(__dirname + '/viaf_parse')
			var _ = require('highland')
			var fs = require('fs')
			var db = require("nypl-registry-utils-database")
			var clc = require('cli-color')

			//the bulk insert function, it gets a unordered bulk operation from the db
			function insert(agents, callback) {
				//ask for a new bulk operation
				db.newRegistryIngestBulkOp("viaf", bulk =>{
					//insert all the operations
					agents.forEach( a => bulk.insert(a))
					bulk.execute(function(err, result) {
						if (err){
							console.log(err)
						}
						//tell how many we just updated
						process.send({ report: agents.length })
						callback()
					})
				})
			}


			process.on('message', msg => {

				console.log(cluster.worker.id, msg)

				_(fs.createReadStream(msg.work))
					.split()
					.compact()
					.map(xmlLine => {
						//find the start of the XML cluster and the ID
						var viafId = xmlLine.substring(0,xmlLine.search("<VIAFCluster")).trim()
						//Using strings now, because there are now huge 20 digit viaf IDs that cannot be parseInt-ed
						//if (viafId.length<16) viafId = parseInt(viafId)
						xmlLine = xmlLine.substring(xmlLine.search("<VIAFCluster")).trim()
						return viafParse.returnAgent(viafId,xmlLine)
					})
					.compact()
					.batch(999)
					.map(_.curry(insert))
					.nfcall([])
					.series()
					.done(function() {
						console.log("Worker: ",cluster.worker.id," Done.")
						process.exit(0)
					})

			})

			//ask for the file name
			process.send({ request: true })

		}




	}
}

