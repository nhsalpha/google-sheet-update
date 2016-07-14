var spreadsheet = require('./lib/spreadsheet.js');

spreadsheet.update()
  .then(function () {
    console.log('Updated successfully')
  })
  .catch(console.error)
