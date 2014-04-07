/**
 * Sample demo.
 * Draw background images in diff. projections.
 * egax@bk.ru, 2013
 */
function scale() {
  var scale = parseFloat(document.getElementById('scale').value);
  dw.scaleCarta(1); // fix labels
  dw.scaleCarta(scale);
  dw.draw();
}
function turn() {
  var cx = parseFloat(document.getElementById('turnx').value),
      cy = parseFloat(document.getElementById('turny').value);
  if (!isNaN(cx) && !isNaN(cy))
    if (dw.isSpherical()) {
      var proj = dw.initProj();
      cx += proj.long0 * 180/Math.PI;
      cy += proj.lat0 * 180/Math.PI;
      dw.initProj(' +lon_0=' + cx + ' +lat_0=' + cy);
      dw.draw();
    }
}
// Imitate Ajax loading
function loading() {
  dw.clearCarta();
  var ctx = dw.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  var pts = [[-19,6],[-12,16],[0,20],[12,16],[19,6],[19,-6],[12,-16],[0,-20],[-12,-16],[-19,-6]];
  for (var i in pts) {
    dw.extend(dw.mopt, {
      loading: {cls: 'Line', width: 12*dw.m.scale, cap: 'round', fg: 'rgba(0,80,170,' + Math.random() + ')'}
    });
    dw.paintCarta([[pts[i][0]/2.5, pts[i][1]/2.5],
                   [pts[i][0], pts[i][1]]], 'loading');
  }
  ctx.restore();
}
function proj() {
  dw.changeProject(document.getElementById('projlist').value);
  loading();
  // worldmap raster image
  var im = new Image();
  if (dw.project == 0)
    im.src = 'demodata/img/wrld-small.jpg';
  else if (dw.project == 101)
    im.src = 'demodata/img/wrld-small-merc.jpg';
  else
    dw.draw();
  im.onload = function() {
    if (dw.project == 0)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-180,90],[180,-90]], 6:this}]);
    else if (dw.project == 101)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-179.99,84],[179.99,-84]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    dw.draw();
  }
}
function draw() {
  try {
    coords = eval(document.getElementById('getcoords').value); coords.length; } 
  catch (e) { 
     alert('Invalid coords!\nUse:\n[[1,2],[3,4],..]'); return; }
  dw.loadCarta([[ document.getElementById('ftype').value, Math.random(), coords, 'MyTest', coords[0], true ]], 1);
}
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
  el.appendChild(document.createTextNode('Sample'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'text';
  el.size= '3';
  el.id = 'scale';
  el.value= '1';
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = scale;
  el.appendChild(document.createTextNode('scale'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '15%';
  col.align = 'center';
  el = document.createElement('input');
  el.type = 'text';
  el.size= '4';
  el.id = 'turnx';
  el.value= '10';
  col.appendChild(el);
  el = document.createElement('input');
  el.type = 'text';
  el.size= '4';
  el.id = 'turny';
  el.value= '10';
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = turn;
  el.appendChild(document.createTextNode('turn'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  col.appendChild(document.createTextNode(' proj '));
  var projlist = el = document.createElement('select');
  el.id = 'projlist';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '30%';
  col.align = 'center';
  el = document.createElement('select');
  el.id = 'ftype';
  var el2 = document.createElement('option');
  el2.value = 'Line';
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  el2 = document.createElement('option');
  el2.value = 'Area';
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  el2 = document.createElement('option');
  el2.value = 'DotPort';
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  col.appendChild(el);
  el = document.createElement('input');
  el.type = 'text';
  el.id = 'getcoords';
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = draw;
  el.appendChild(document.createTextNode('draw'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '15%';
  col.align = 'center';
  col.id = 'tcoords';
  row.appendChild(col);
  
  var row = document.createElement('tr');
  var col = document.createElement('td');
  col.colSpan = '10';
  col.id = 'mcol';
  col.style.padding = '0';
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  // projlist
  for(var i in dw.projlist) {
    var projname = dw.projlist[i].split(' ')[0].split('=')[1];
    var el = document.createElement('option');
    el.value = i;
    el.appendChild(document.createTextNode(projname));
    projlist.appendChild(el);
  }
  projlist.onchange = proj;
  // curr. coords
  dw.clfunc.onmousemove = function(sd, dd) {
    var tcoords = document.getElementById('tcoords');
    tcoords.innerHTML = ' X: Y:';
    if (dd) tcoords.innerHTML = ' X: ' + dd[0].toFixed(2) + ' Y: ' + dd[1].toFixed(2);
  }
  // load
  dw.loadCarta(CONTINENTS);
  delete CONTINENTS;
  dw.loadCarta([{0:'.Image', 1:'wrld'}]);
  dw.loadCarta(dw.createMeridians());
  dw.loadCarta([
    ['DotPort', 'ny', [[-73.905,40.708]], 'New York'],
    ['DotPort', 'los', [[-118.25,34]], 'Los Angeles'],
    ['DotPort', 'lon', [[-0.178,51.488]], 'London'],
    ['DotPort', 'mos', [[37.7,55.75]], 'Moscow'],
    ['DotPort', 'bij', [[116.388,39.906]], 'Beijing'],
    ['DotPort', 'mlb', [[145.075,-37.853]], 'Melbourne'],
    ['DotPort', 'rio', [[-43.455,-22.722]], 'Rio de Janeiro'],
    ['DotPort', 'brz', [[15.285,-4.285]], 'Brazzaville']
  ]);
  proj();
}
