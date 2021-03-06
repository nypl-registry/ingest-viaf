'use strict'

module.exports = function () {
  return function (callback) {
    var db = require('nypl-registry-utils-database')
    var cluster = require('cluster')
    var glob = require('glob')
    var prompt = require('prompt')
    var clc = require('cli-color')
    var viafParse = require(`${__dirname}/viaf_parse`)
    var _ = require('highland')
    var fs = require('fs')

    var total = 0
    var totalUpdated = 0

    if (cluster.isMaster) {
      // first find out where the files are, default to the data directory of the execution
      var promptSchema = {
        properties: {
          path: {
            message: 'Path to VIAF data',
            required: true,
            default: process.cwd() + '/data/'
          }
        }
      }
      prompt.start()
      prompt.get(promptSchema, function (err, result) {
        if (err) console.log(err)
        // make sure some of the datafiles we are expecting are there
        glob(result.path + 'persist_*', function (err, files) {
          if (err) console.log(err)
          if (files.length === 0) throw new Error('Could not find the cluster files at:' + result.path + 'persist_*')
          // files=[files[0]]

          // make a copy of the array so we don't edit it while looping through
          JSON.parse(JSON.stringify(files)).forEach((filepath) => {
            // make a worker for each file
            var worker = cluster.fork()
            // the worker will send a request message to us for two reasons
            worker.on('message', function (msg) {
              // asking for the file name to use, send them the filename
              if (msg.request) {
                worker.send({ work: files.shift() })
              }
              // reporting back how many clusters it has inserted
              if (msg.matched) {
                total++
                totalUpdated++
                process.stdout.cursorTo(0)
                process.stdout.write('Total: ' + clc.black.bgGreenBright(total) + ' Total Matched: ' + clc.black.bgGreenBright(totalUpdated))
              }
              if (msg.noMatch) {
                total++
                process.stdout.cursorTo(0)
                process.stdout.write('Total: ' + clc.black.bgGreenBright(total) + ' Total Matched: ' + clc.black.bgGreenBright(totalUpdated))
              }
            })
          })
        })
      })

      cluster.on('exit', (worker, code, signal) => {
        if (Object.keys(cluster.workers).length === 0) {
          if (callback) callback()
        }
      })
    } else {
      // THE WORKER

      var updateViafRecord = _.wrapCallback(function updateViafRecord (viafMap, cb) {
        db.returnCollectionRegistry('viaf', function (err, viafCollection) {
          if (err) console.log(err)
          viafCollection.find({viaf: viafMap.newId}, {viaf: 1}).toArray((err, results) => {
            if (err) console.log(err)
            if (results.length > 0) {
              var viaf = results[0].viaf
              if (viaf.indexOf(viafMap.oldId) === -1) {
                viaf.push(viafMap.oldId)
                viafCollection.update({ viaf: viafMap.newId }, {$set: {viaf: viaf}}, function (err, res) {
                  if (err) console.log(err)
                  process.send({ matched: true })
                  cb()
                })
                return true
              }
            }
            process.send({ noMatch: true })
            cb()
          })
        })
      })

      process.on('message', (msg) => {
        console.log(cluster.worker.id, msg)
        _(fs.createReadStream(msg.work))
          .split()
          .compact()
          .map(viafParse.returnPersist)
          .compact()
          .map(updateViafRecord)
          .sequence()
          .done(function () {
            console.log('Worker: ', cluster.worker.id, ' Done.')
            db.databaseClose()
            process.exit()
          })
      })

      // ask for the file name
      process.send({ request: true })
    }
  }
}
