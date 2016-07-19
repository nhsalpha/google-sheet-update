var async = require('async')
var q = require('q')
var _ = require('lodash')
var google = require('googleapis');
var JWTAuth = google.auth.JWT;
var EditSpreadsheet = require('edit-google-spreadsheet')
var config = require('../config')
var api = require('./api')


/*============================
  Private variables
==============================*/
var _debug = config.env === 'production' ? false : true
var _authClient = new JWTAuth(
  config.googleEmail,
  null,
  config.googleKey,
  ['https://spreadsheets.google.com/feeds']
)


/*============================
  Private Methods
==============================*/


/*============================
  Class Constructor
==============================*/

function Spreadsheet () {
  this.SHEET_ID = config.sheetId
}


/*============================
  Public Methods
==============================*/

Spreadsheet.prototype.update = function () {
  var self = this
  var deferred = q.defer()

  async.parallel({
    list: function (callback) {
      api.getList()
        .then(function (res) {
          callback(null, res)
        })
        .catch(callback)
    },
    lastRow: function (callback) {
      self.readSheet('Sheet1')
        .then(function (result) {
          var lastRowIdx = _.size(result)
          var lastRow = _.findLast(result, function(n) {
            return n;
          })

          callback(null, {
            index: lastRowIdx,
            value: lastRow,
          })
        })
        .catch(callback)
    }
  },
  function(err, results) {
    if (err) return deferred.reject(err)

    var updateObj = {}
    var newItems = _.filter(results.list, function(obj) {

      if(Date.parse(obj.dateAdded) > Date.parse(results.lastRow.value['1'])) {
        var feedbackText = obj.text;
        if (feedbackText.indexOf('StatusCake') == -1 && feedbackText.indexOf('Pingdom') == -1) {
          return true
        }
      }
      return
    })

    // start with last existing row plus one
    updateObj[results.lastRow.index + 1] = _.map(_.sortBy(newItems, 'dateAdded'), function(obj) {
      return [
        obj.dateAdded,
        obj.pageId,
        obj.text,
      ]
    })

    self.updateSheet('Sheet1', updateObj)
      .then(deferred.resolve)
      .catch(deferred.reject)
  })

  return deferred.promise
}

Spreadsheet.prototype.updateSheet = function (sheet, cells) {
  var self = this
  var deferred = q.defer()

  EditSpreadsheet.load({
    debug: _debug,
    spreadsheetId: self.SHEET_ID,
    worksheetName: sheet,
    accessToken: function (callback) {
      _authClient.authorize(function (err, tokens) {
        if (err) callback(err)

        callback(null, { type: tokens.token_type, token: tokens.access_token })
      });
    }
  }, function sheetReady (err, spreadsheet) {
    if (err) return deferred.reject(err)

    spreadsheet.add(cells)
    spreadsheet.send(function (err) {
      if (err) return deferred.reject(err)

      deferred.resolve()
    })
  });

  return deferred.promise
}

Spreadsheet.prototype.readSheet = function (sheet) {
  var self = this
  var deferred = q.defer()

  EditSpreadsheet.load({
    debug: _debug,
    spreadsheetId: self.SHEET_ID,
    worksheetName: sheet,
    accessToken: function (callback) {
      _authClient.authorize(function (err, tokens) {
        if (err) callback(err)

        callback(null, { type: tokens.token_type, token: tokens.access_token })
      });
    }
  }, function sheetReady (err, spreadsheet) {
    if (err) return deferred.reject(err)

    spreadsheet.receive(function (err, rows) {
      if (err) return deferred.reject(err)

      deferred.resolve(rows)
    })
  });

  return deferred.promise
}


/*============================
  Export Class
==============================*/

module.exports = new Spreadsheet();
