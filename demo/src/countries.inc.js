/**
 * World's countrires and flags.
 * egax@bk.ru, 2013-15.
 */
function draw(opt) {
    if (opt) {
      var m = {};
      m.mpart = opt.target.value;
      m.cntryname = opt.target.value2;
      m.abbr = COUNTRIES[m.cntryname][m.mpart][0];
      m.coords = COUNTRIES[m.cntryname][m.mpart][1];
      m.abbr2 = COUNTRIES[m.cntryname][m.mpart][2].toLowerCase();
      m.centerof = COUNTRIES[m.cntryname][m.mpart][3];
      dw.loadCarta([['Area', m.abbr + m.mpart, m.coords, m.cntryname, m.centerof, true]]);
      dw2.loadCarta([['Area', m.abbr + m.mpart, m.coords, m.cntryname, m.centerof, true]]);
      dw3.loadCarta([['Area', m.abbr + m.mpart, m.coords, m.cntryname, m.centerof, true]]);
      dw4.loadCarta([['Area', m.abbr + m.mpart, m.coords, m.cntryname, m.centerof, true]]);
      if (FLAGSB64[m.abbr2]) {
        var mflg = {};
        mflg[m.abbr2] = new Image();
        mflg[m.abbr2].m = m;
        mflg[m.abbr2].src = FLAGSB64[m.abbr2];
        mflg[m.abbr2].onload = function() {
          var m = this.m;
          dw.loadCarta([{0:'.Image', 1: m.abbr + m.mpart, 2:[m.centerof], 6:this}], 1);
          dw2.loadCarta([{0:'.Image', 1: m.abbr + m.mpart, 2:[m.centerof], 6:this}], 1);
          dw3.loadCarta([{0:'.Image', 1: m.abbr + m.mpart, 2:[m.centerof], 6:this}], 1);
          dw4.loadCarta([{0:'.Image', 1: m.abbr + m.mpart, 2:[m.centerof], 6:this}], 1);
        }
      }
    }
  // draw on centre
  if (m.centerof) {
    var pts = dw.toPoints(m.centerof, true);
    dw.centerCarta(pts[0] + dw.m.offset[0], pts[1] + dw.m.offset[1]);
    dw2.initProj(' +lon_0=' + m.centerof[0] + ' +lat_0=' + m.centerof[1]);
    dw3.centerCarta(pts[0] + dw3.m.offset[0], pts[1] + dw3.m.offset[1]);
    dw4.centerCarta(pts[0] + dw4.m.offset[0], pts[1] + dw4.m.offset[1]);
  }
  dw.draw();
  dw2.draw();
  dw3.draw();
  dw4.draw();
}
function refresh() {
  window.location.reload(false);
}
function init() {
  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = '#d2e0f0';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  col.style.whiteSpace = 'nowrap';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode("Страны мира"));
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.colSpan = '2';
  col.align = 'center';
  col.id = 'tcoords';
  row.appendChild(col);

  var row = document.createElement('tr');
  mtab.appendChild(row);

  var dcol = document.createElement('td');
  dcol.rowSpan = '2';
  dcol.width = '15%';
  dcol.style.verticalAlign = 'top';
  var cntrylist = el = document.createElement('dl');
  el.id = 'cntrylist';
  el.style.margin = '0';
  el.style.padding = '0';
  el.style.fontSize = 'smaller';
  dcol.appendChild(el);
  row.appendChild(dcol);

  var col = document.createElement('td');
  col.id = 'canvasmap';
  col.width = '40%';
//  col.style.padding = '0';
  col.style.verticalAlign = 'top';
  row.appendChild(col);
  var col = document.createElement('td');
  col.id = 'canvasmap2';
  col.width = '40%';
  col.style.padding = '0';
  col.style.verticalAlign = 'top';
  row.appendChild(col);

  var row = document.createElement('tr');
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.id = 'canvasmap3';
  col.width = '40%';
//  col.style.padding = '0';
  col.style.verticalAlign = 'top';
  row.appendChild(col);
  var col = document.createElement('td');
  col.id = 'canvasmap4';
  col.width = '40%';
//  col.style.padding = '0';
  col.style.verticalAlign = 'top';
  row.appendChild(col);
  document.body.appendChild(mtab);

  cntrylist.style.height = dcol.offsetHeight + 'px';
  cntrylist.style.overflow = 'auto';

  dw = new dbCarta({id:'canvasmap', height: dcol.offsetHeight/2.0*0.98});
  dw.extend(dw.mopt, {
    'Area': {fg: 'yellow', bg: 'transparent', labelcolor: 'white'}
  });
  dw.cfg.mapbg = undefined; // no draw map area
  // worldmap image
  var im = new Image();
  im.src = IMGMAP['wrld_small'];
  im.onload = function() {
    dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-180,90],[180,-90]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    dw.loadCarta(dw.createMeridians());
    dw.draw();
  };
  dw2 = new dbCarta({id:'canvasmap2', height: dcol.offsetHeight/2.0*0.98});
  dw2.changeProject(203);
  dw2.scaleCarta(1.5);
  dw2.loadCarta(CONTINENTS);
  dw2.loadCarta(dw2.createMeridians());
  dw2.draw();
  dw3 = new dbCarta({id:'canvasmap3', height: dcol.offsetHeight/2.0*0.98});
  dw3.changeProject(204);
  dw3.loadCarta(CONTINENTS);
  dw3.loadCarta(dw3.createMeridians());
  dw3.draw();
  dw4 = new dbCarta({id:'canvasmap4', height: dcol.offsetHeight/2.0*0.98});
  dw4.extend(dw4.mopt, {
    'Area': {fg: 'yellow', bg: 'transparent', labelcolor: 'white'}
  });
  dw4.changeProject(102);
  // worldmap image
  var im4 = new Image();
  im4.src = IMGMAP['wrld_small_mill'];
  im4.onload = function() {
    dw4.loadCarta([{0:'.Image', 1:'wrld-mill', 2:[[-179.99,132],[179.99,-132]], 6:this}]);
    dw4.m.bgimg = dw4.mflood['.Image_wrld-mill']; // mark as bg
    dw4.loadCarta(dw4.createMeridians());
    dw4.draw();
  };
  delete CONTINENTS;
  
  //fill list
  for (var cntryname in COUNTRIES) {
    var el = document.createElement('dt');
    el.style.fontStyle = 'italic';
    el.style.fontWeight = 'bolder';
    el.appendChild(document.createTextNode(cntryname));
    cntrylist.appendChild(el);
    for (var mpart in COUNTRIES[cntryname]) {
      var el2 = document.createElement('dd');
      el2.value = mpart;
      el2.value2 = cntryname;
      el2.appendChild(document.createTextNode(COUNTRIES[cntryname][mpart][0]));
      el2.onclick = draw;
      cntrylist.appendChild(el2);
    }
  }
  
  // curr. object
  var clfunc = function(dw, src, dst, ev) {
    var mcoord = document.getElementById('tcoords');
    var label = '';
    if (ev.target.m.pmap) {
       var o = ev.target.mflood[ev.target.m.pmap];
       label = o['label'];
    }
    mcoord.innerHTML = label;
    ev.target.paintCoords(dst);
  }
  dw.clfunc.onmousemove = function(dw, src, dst, ev){ clfunc(dw, src, dst, ev); };
  dw2.clfunc.onmousemove = function(dw, src, dst, ev){ clfunc(dw, src, dst, ev); };
  dw3.clfunc.onmousemove = function(dw, src, dst, ev){ clfunc(dw, src, dst, ev); };
  dw4.clfunc.onmousemove = function(dw, src, dst, ev){ clfunc(dw, src, dst, ev); };
}
