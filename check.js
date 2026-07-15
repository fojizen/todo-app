var fs = require('fs');
var code = fs.readFileSync('app.js','utf8');
var html = fs.readFileSync('index.html','utf8');
var lines = code.split('\n');
var missingIds = [];
lines.forEach(function(line, i) {
  var matches = line.match(/getElementById\(['"]([^'"]+)['"]\)/g);
  if (matches) {
    matches.forEach(function(call) {
      var m = call.match(/getElementById\(['"]([^'"]+)['"]\)/);
      if (m) {
        var id = m[1];
        if (html.indexOf('id="' + id + '"') === -1 && html.indexOf("id='" + id + "'") === -1) {
          missingIds.push({ line: i+1, id: id });
        }
      }
    });
  }
});
if (missingIds.length) {
  console.log('MISSING IDs in HTML:');
  missingIds.forEach(function(c) { console.log('  Line ' + c.line + ': #' + c.id); });
} else {
  console.log('All getElementById targets found in HTML');
}
