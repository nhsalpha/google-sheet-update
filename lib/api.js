var request = require('request').defaults({json: true})
var q = require('q')
var _ = require('lodash')
var config = require('../config')

/*============================
  Private variables
==============================*/
var API_BASE = config.apiBase
var API_EXT = ''
var API_KEY = config.apiKey

/*============================
  Private Methods
==============================*/

// 'this' is bound to the deferred object for each call
function _handleDeferredRequest (err, res, body) {
  var deferred = this

  if (err) return deferred.reject(err)

  if (res.statusCode !== 200) {
    return deferred.reject({ statusCode: res.statusCode, statusMessage: res.statusMessage })
  }

  deferred.resolve(body)
}

/*============================
  Class Constructor
==============================*/

function Api () {}

/*============================
  Public Methods
==============================*/

Api.prototype.get = function (endpoint) {
  var deferred = q.defer()
  var options = {
    url: API_BASE + endpoint + API_EXT,
    headers: {
      'Ocp-Apim-Subscription-Key': API_KEY,
    },
  };

  request(options, _handleDeferredRequest.bind(deferred))

  return deferred.promise
}

Api.prototype.getList = function () {
  return this.get('list')
}

/*============================
  Export Class
==============================*/

module.exports = new Api()
