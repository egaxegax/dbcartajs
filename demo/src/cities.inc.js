/**
 * World's cities by countries.
 * egax@bk.ru, 2013-15.
 */
function draw() {
  var centerof, citylist = document.getElementById('citylist');
  for (var i=0; i<citylist.options.length; i++) {
    var opt = citylist.options[i];
    if (opt.selected) {
      var coords = eval('[' + opt.value + ']');
      if (!centerof) centerof = coords;
      dw.loadCarta([['DotPort', opt.text, [coords], opt.text, null, 1]]);
    }
  }
  if (centerof) {
    var points = dw.toPoints(centerof, true);
    dw.centerCarta(points[0] + dw.m.offset[0], points[1] + dw.m.offset[1]);
  }
  dw.draw();
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
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode("Города мира"));
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.align = 'center';
  col.id = 'tcoords';
  row.appendChild(col);

  var row = document.createElement('tr');
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  col.style.borderWidth = '1';
  col.style.borderStyle = 'solid';
  col.style.verticalAlign = 'top';

  var citylist = el2 = document.createElement('select');
  el2.id = 'citylist';
  el2.multiple = 'true';
  el2.size = '20';
  col.appendChild(el2);
  var el2 = document.createElement('button');
  el2.onclick = draw;
  el2.appendChild(document.createTextNode('show'));
  col.appendChild(el2);
  var el2 = document.createElement('button');
  el2.onclick = refresh;
  el2.appendChild(document.createTextNode('refresh'));
  col.appendChild(el2);
  row.appendChild(col);

  var col = document.createElement('td');
  col.id = 'mcol';
  col.style.padding = '0';
  row.appendChild(col);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  dw.extend(dw.mopt['DotPort'], {labelcolor: 'yellow'});
  dw.changeProject(102); // miller proj
  // worldmap img
  var im = new Image();
  im.src = IMGMAP['wrld_small_mill'];
  im.onload = function() {
    dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-179.99,132],[179.99,-132]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    dw.loadCarta(dw.createMeridians());
    dw.draw();
  }
  for (var cntryname in CITIES) {
    el = document.createElement('optgroup');
    el.label = cntryname;
    for (var mpart in CITIES[cntryname]) {
      el2 = document.createElement('option');
      el2.value = CITIES[cntryname][mpart][1];
      el2.appendChild(document.createTextNode(CITIES[cntryname][mpart][0]));
      el.appendChild(el2);
    }
    citylist.appendChild(el);
  }
  delete CITIES;
  // curr. object
  dw.clfunc.onmousemove = function(dw, sd, dd) {
    var mcoord = document.getElementById('tcoords');
    var label = '';
    if (dw.m.pmap) {
       var o = dw.mflood[dw.m.pmap];
       label = o['label'] + ' : ' + o['coords'];
    }
    mcoord.innerHTML = label;
    dw.paintCoords(dd);
  }
}
