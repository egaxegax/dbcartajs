// countries.html func
function draw() {
  var centerof, cntrylist = document.getElementById('cntrylist');
  for (var i=0; i<cntrylist.options.length; i++) {
    var opt = cntrylist.options[i];
    if (opt.selected) {
      var mpart = opt.value,
          cntryname = opt.parentNode.label,
          abbr = COUNTRIES[cntryname][mpart][0],
          coords = COUNTRIES[cntryname][mpart][1],
          centerof = COUNTRIES[cntryname][mpart][3];
      dw.loadCarta([['Area', abbr + mpart, coords, cntryname, centerof, true]]);
      dw2.loadCarta([['Area', abbr + mpart, coords, cntryname, centerof, true]]);
      dw3.loadCarta([['Area', abbr + mpart, coords, cntryname, centerof, true]]);
      dw4.loadCarta([['Area', abbr + mpart, coords, cntryname, centerof, true]]);
    }
  }
  // draw on centre
  if (centerof) {
    var points = dw.toPoints(centerof, true);
    dw.centerCarta(points[0] + dw.m.offset[0], points[1] + dw.m.offset[1]);
    dw2.initProj(' +lon_0=' + centerof[0] + ' +lat_0=' + centerof[1]);
    dw3.initProj(' +lon_0=' + centerof[0] + ' +lat_0=' + centerof[1]);
    dw4.centerCarta(points[0] + dw4.m.offset[0], points[1] + dw4.m.offset[1]);
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
  mtab.width = '100%';
  var tb = document.createElement('tbody');
  mtab.appendChild(tb);
  var row = document.createElement('tr');
  row.style.backgroundColor = 'rgb(230,230,230)';
  tb.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  el = document.createElement('h2');
  el.appendChild(document.createTextNode("World's Countries"));
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.colSpan = '2';
  col.align = 'center';
  col.id = 'coords';
  row.appendChild(col);

  var row = document.createElement('tr');
  tb.appendChild(row);

  var col = document.createElement('td');
  col.rowSpan = '2';
  col.width = '15%';
  col.style.borderWidth = '1';
  col.style.borderStyle = 'solid';
  col.style.verticalAlign = 'top';
  var el = document.createElement('div');
  el.appendChild(document.createTextNode('Countries by part:'));
  col.appendChild(el);
  var cntrylist = el2 = document.createElement('select');
  el2.id = 'cntrylist'
  el2.multiple='true';
  el2.size = '20';
  el = document.createElement('div');
  el.appendChild(el2);
  col.appendChild(el);
  el = document.createElement('div');
  var el2 = document.createElement('button');
  el2.onclick = draw;
  el2.appendChild(document.createTextNode('show'));
  el.appendChild(el2);
  el2 = document.createElement('button');
  el2.onclick = refresh;
  el2.appendChild(document.createTextNode('refresh'));
  el.appendChild(el2);
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.id = 'canvasmap';
  col.width = '40%';
  row.appendChild(col);
  var col = document.createElement('td');
  col.id = 'canvasmap2';
  col.width = '40%';
  row.appendChild(col);

  var row = document.createElement('tr');
  tb.appendChild(row);

  var col = document.createElement('td');
  col.id = 'canvasmap3';
  col.width = '40%';
  row.appendChild(col);
  var col = document.createElement('td');
  col.id = 'canvasmap4';
  col.width = '40%';
  row.appendChild(col);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'canvasmap'});
  dw.loadCarta(CONTINENTS);
  dw.loadCarta(meridians = dw.createMeridians());
  dw.draw();
  dw2 = new dbCarta({id:'canvasmap2'});
  dw2.changeProject(203);
  dw2.scaleCarta(3);
  dw2.loadCarta(CONTINENTS);
  dw2.loadCarta(meridians);
  dw2.draw();
  dw3 = new dbCarta({id:'canvasmap3'});
  dw3.changeProject(201);
  dw3.scaleCarta(2);
  dw3.loadCarta(CONTINENTS);
  dw3.loadCarta(meridians);
  dw3.draw();
  dw4 = new dbCarta({id:'canvasmap4'});
  dw4.changeProject(101);
  dw4.scaleCarta(3);
  dw4.loadCarta(CONTINENTS);
  dw4.loadCarta(meridians);
  dw4.draw();
  delete CONTINENTS;

  for (var cntryname in COUNTRIES) {
    el = document.createElement('optgroup');
    el.label = cntryname;
    for (var mpart in COUNTRIES[cntryname]) {
      el2 = document.createElement('option');
      el2.value = mpart;
      el2.appendChild(document.createTextNode(COUNTRIES[cntryname][mpart][0]));
      el.appendChild(el2);
    }
    cntrylist.appendChild(el);
  }
  // curr. object
  var clfunc = function(md) {
    var mcoord = document.getElementById('coords');
    var label = '';
    if (md.m.pmap) {
       var o = md.mflood[md.m.pmap];
       label = o['label'];
    }
    mcoord.innerHTML = label;
  }
  dw.clfunc.onmousemove = function(){ clfunc(dw) };
  dw2.clfunc.onmousemove = function(){ clfunc(dw2) };
  dw3.clfunc.onmousemove = function(){ clfunc(dw3) };
  dw4.clfunc.onmousemove = function(){ clfunc(dw4) };
}
