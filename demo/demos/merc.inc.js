/**
 * Mercator projection.
 * egax@bk.ru, 2013
 */
function init() {
  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
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
  col.style.padding = "0";
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  dw.initProj(101, '+lon_0=0 +lat_0=0');
  dw.scaleCarta(1.4);

  // worldmap img
  var im = new Image();
  im.src = 'demodata/img/wrld-small-merc.jpg';
  im.onload = function() {
    dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-179.99,84],[179.99,-84]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    dw.loadCarta(dw.createMeridians());
    // draw countries
    var cntrylist = {
      'Brazil': [12,4],
      'South Africa': [1,1],
      'Spain': [0,5]
    };
    var route = [];
    for(var cntryname in cntrylist) {
      var npart = cntrylist[cntryname][0],
          ncity = cntrylist[cntryname][1],
          m = {};
      for(var mpart in COUNTRIES[cntryname]) {
        m.abbr = COUNTRIES[cntryname][mpart][0];
        m.coords = COUNTRIES[cntryname][mpart][1];
        m.centerof = COUNTRIES[cntryname][mpart][3];
        dw.loadCarta([['Area', m.abbr + mpart, m.coords, (mpart==npart ? cntryname : ''), m.centerof]]);
      }
      // capitals
      if (CITIES[cntryname]) {
        m.cityname = CITIES[cntryname][ncity][0];
        m.citycoords = CITIES[cntryname][ncity][1];
        dw.loadCarta([['DotPort', m.cityname, m.citycoords, m.cityname, null, 1]]);
        route.push(m.citycoords[0]);
        // flags
        var abbrf = m.abbr.replace(mpart, '').toLowerCase();
        if (FLAGSB64[abbrf]) {
          var im = new Image();
          im.m = m;
          im.src = FLAGSB64[abbrf];
          im.onload = function() {
            var m = this.m;
            dw.loadCarta([{0:'.Image', 1:m.abbr, 2:[m.citycoords], 6:this}], 1);
          }
        }
      }
    }
    // concat
    if (route) {
      route.push(route[0]);
      route.push(route[1]);
    }
    dw.loadCarta([['Line', 'route1', route, null, null, 1]]);
    delete COUNTRIES;
    delete CITIES;
    dw.draw();
  }
}
