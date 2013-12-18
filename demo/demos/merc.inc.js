// merc.html func
function init() {
  var mtab = document.createElement('table');
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = 'rgb(230,230,230)';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Mercator Proj'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var row = document.createElement('tr');
  var col = document.createElement('td');
  col.colSpan = '10';
  col.id = 'mcol';
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  dw.initProj(101, '+lon_0=0 +lat_0=0');
  dw.scaleCarta(1.4);
  dw.loadCarta(CONTINENTS);
  dw.loadCarta(dw.createMeridians());
  // draw country
  var cntrylist = {
    'Brazil': [12,4],
    'South Africa': [1,1],
    'Spain': [0,5]
  };
  var route = [];
  for(var cntryname in cntrylist) {
    var npart = cntrylist[cntryname][0],
        ncity = cntrylist[cntryname][1];
    for(var mpart in COUNTRIES[cntryname]) {
      var abbr = COUNTRIES[cntryname][mpart][0],
          coords = COUNTRIES[cntryname][mpart][1],
          centerof = COUNTRIES[cntryname][mpart][3];
      dw.loadCarta([['Area', abbr + mpart, coords, (mpart==npart ? cntryname : ''), centerof]]);
    }
    // capitals
    if (CITIES[cntryname]) {
      var cityname = CITIES[cntryname][ncity][0],
          citycoords = CITIES[cntryname][ncity][1];
      dw.loadCarta([['DotPort', cityname, citycoords, cityname, null, 1]]);
      route.push(citycoords[0]);
    }
  }
  // concat
  if (route) {
    route.push(route[0]);
    route.push(route[1]);
  }
  dw.loadCarta([['Line', 'route1', route, null, null, 1]]);
  delete CONTINENTS;
  delete COUNTRIES;
  delete CITIES;
  dw.draw();
}
