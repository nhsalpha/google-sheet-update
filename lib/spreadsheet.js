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

function safelyParseJSON (json) {
  var parsed

  try {
    parsed = JSON.parse(json)
  } catch (e) {
    // didn't parse, but that's okay
  }

  return parsed
}

/*============================
  Class Constructor
==============================*/

function Spreadsheet () {
  this.SHEET_ID = config.sheetId
  this.SHEET_NAME = config.sheetName
}


/*============================
  Public Methods
==============================*/

Spreadsheet.prototype.update = function () {
  var self = this

  return q.all([
    //list
    api.getList(),
    //lastRow
    self.readSheet(self.SHEET_NAME)
      .then(function (result) {
        var lastRowIdx = _.size(result)
        var lastRow = _.findLast(result, function(n) {
          return n;
        })

        return {
          index: lastRowIdx,
          value: lastRow,
        }
      }),
  ]).then(function(resultsArray) {
    var results = {
        list: resultsArray[0],
        lastRow: resultsArray[1]
    }
    var updateObj = {}
    var newItems = _.filter(results.list, function(obj) {
      var feedbackText = obj.text || '';
      if (feedbackText.indexOf('StatusCake') !== -1 || feedbackText.indexOf('Pingdom') !== -1) {
        return
      }

      if (!results.lastRow.value || Date.parse(obj.dateAdded) > Date.parse(results.lastRow.value['1'])) {
        return true
      }
      return
    })

    // start with last existing row plus one
    updateObj[results.lastRow.index + 1] = _.map(_.sortBy(newItems, 'dateAdded'), function(obj) {
      const formData = safelyParseJSON(obj.jSonData);
      const ip = formData && formData.hasOwnProperty('ip') ? formData.ip : '';
      const found = formData && formData.hasOwnProperty('found') ? formData.found : '';
      const theme = formData && formData.hasOwnProperty('theme') ? formData.theme : '';
      const themeOther = formData && formData.hasOwnProperty('themeOther') ? formData.themeOther : '';

      const themeString = Array.isArray(theme) ? theme.join(',') : '';

      return [
        obj.dateAdded,
        obj.pageId,
        themeString,
        themeOther,
        found,
        obj.text,
        ip,
      ]
    })

    return self.updateSheet(self.SHEET_NAME, updateObj)
  })
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
    spreadsheet.send({ autoSize: true }, function (err) {
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
