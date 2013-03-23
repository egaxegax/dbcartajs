/**
 * Load some data functions to dbcarta.
 */
/* Load continents as substrate. */
function loadConts() {
  var data = [];
  if ('CONTINENTS' in window) {
    for(var i in window.CONTINENTS) {
      var label = window.CONTINENTS[i][0],
          poly = window.CONTINENTS[i][1];
      for(var j in poly) {
        var ftype = (label == 'Antarctica' || label == 'Greenland' ? '.Arctic' : '.Mainland');
        data.push([ftype, label + "." + j, poly[j]]);
      }
    }
    window.CONTINENTS = undefined;
  }
  return data;
}
/* Load cities data to select list EL. */
function loadCities() {
  var data = {};
  if ('CITIES' in window) {
    for(var i in window.CITIES) {
      var cityname = window.CITIES[i][0],
          countryname = window.CITIES[i][1],
          coords = window.CITIES[i][2];
      if (!(countryname in data)) data[countryname] = {};
      data[countryname][cityname] = coords.join();
    }
    window.CITIES = undefined;
  }
  return data;
}
