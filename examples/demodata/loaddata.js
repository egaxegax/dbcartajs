/**
 * Load some data functions to dbcarta.
 */
/* Load continents as substrate. */
function loadConts() {
  if ('CONTINENTS' in window) {
    var data = [];
    for(var i in window.CONTINENTS) {
      var label = window.CONTINENTS[i][0],
          poly = window.CONTINENTS[i][1];
      for(var j in poly) {
        var ftype = (label == 'Antarctica' || label == 'Greenland' ? '.Arctic' : '.Mainland');
        data.push([ftype, label + "." + j, poly[j]]);
      }
    }
    if ('dbcarta' in window)
      dbcarta.loadCarta(data);
  }
}
/* Load cities data to select list EL. */
function loadCities(el) {
  if ('CITIES' in window) {
    var data = [];
    for(var i in window.CONTINENTS) {
      var label = window.CONTINENTS[i][0],
          poly = window.CONTINENTS[i][1];
      for(var j in poly) {
        var ftype = (label == 'Antarctica' || label == 'Greenland' ? '.Arctic' : '.Mainland');
        data.push([ftype, label + "." + j, poly[j]]);
      }
    }
    if ('dbcarta' in window)
      dbcarta.loadCarta(data);
  }
}
