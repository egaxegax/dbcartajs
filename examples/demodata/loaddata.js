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
/* Load city's data. */
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
/* Load country's data. */
function loadCountries() {
  var data = {};
  if ('COUNTRIES' in window) {
    for(var i in window.COUNTRIES) {
      var name = window.COUNTRIES[i][0],
          abbr =  window.COUNTRIES[i][1],
          poly = window.COUNTRIES[i][2];
      if (!(abbr in data)) data[abbr] = {};
      data[abbr] = [name, poly];
    }
    window.COUNTRIES = undefined;
  }
   return data;
}