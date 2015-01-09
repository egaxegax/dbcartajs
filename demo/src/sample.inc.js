/**
 * Atlas demo.
 * Draw background images in diff. projections.
 * egax@bk.ru, 2013-15.
 */
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
// Free bg image
function freeImg() {
  delete dw.m.bgimg;
  delete dw.mflood['.Image_wrld']['img'];
}
// Load worldmap raster image
function loadImg() {
  var im = new Image();
  if (dw.project == 0)
    im.src = IMGMAP['wrld_small'];
  else if (dw.project == 101)
    im.src = IMGMAP['wrld_small_merc'];
  else if (dw.project == 102)
    im.src = IMGMAP['wrld_small_mill'];
  else if (dw.project == 204)
    im.src = IMGMAP['wrld_small_moll'];
  else
    dw.draw();
  im.onload = function() {
    if (dw.project == 0)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-180,90],[180,-90]], 6:this}]);
    else if (dw.project == 101)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-179.99,168],[179.99,-168]], 6:this}]);
    else if (dw.project == 102)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-179.99,132],[179.99,-132]], 6:this}]);
    else if (dw.project == 204)
      dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-162,81],[162,-81]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    dw.draw();
  }
}
function rotate() {
  var tval = parseFloat(document.getElementById('tvalue').value);
  dw.rotateCarta(tval);
  dw.draw();
}
function scale() {
  var tval = parseFloat(document.getElementById('tvalue').value);
  dw.scaleCarta(1); // fix labels
  dw.scaleCarta(tval);
  dw.draw();
}
function proj() {
  dw.changeProject(document.getElementById('projlist').value);
  freeImg();
  document.getElementById('chkbg').checked ?
    loading() || loadImg() :
    dw.draw();
}
function draw() {
  try {
    coords = eval(document.getElementById('getcoords').value); coords.length; } 
  catch (e) { 
     alert('Invalid coords!\nUse:\n[[1,2],[3,4],..]'); return; }
  dw.loadCarta([[ document.getElementById('ftype').value, Math.random(), coords, 'MyTest', coords[0], true ]]);
  // center pov
  var pov = coords[0],
      pts = dw.toPoints(pov, true);
  dw.centerCarta(pts[0] + dw.m.offset[0], pts[1] + dw.m.offset[1]);
  dw.draw();
}
// Tooltip under cursor
function infobox(ev) {
  var mtip = document.getElementById('maptooltip');
  if (dw.m.pmap) {
    mtip.innerHTML = dw.marea[dw.m.pmap]['desc'] || dw.marea[dw.m.pmap]['label'] || dw.marea[dw.m.pmap]['ftag'];
    mtip.style.display = 'block';
    mtip.style.left = ev.clientX + window.pageXOffset + 'px';
    mtip.style.top = ev.clientY + window.pageYOffset - mtip.offsetHeight * 1.2 + 'px';
  } else {
    mtip.style.display = 'none';
  }
}
function init() {
  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = '#d2e0f0';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '10%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Атлас'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '15%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'text';
  el.size= '3';
  el.id = 'tvalue';
  el.value= '1';
  col.appendChild(el);
  var el = document.createElement('button');
  el.onclick = scale;
  el.appendChild(document.createTextNode('scale'));
  col.appendChild(el);
  var el = document.createElement('button');
  el.onclick = rotate;
  el.appendChild(document.createTextNode('rotate'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  col.appendChild(document.createTextNode(' Проекции '));
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
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'checkbox';
  el.id = 'chkbg';
  el.checked = true;
  el.onclick = function(o) {
    freeImg();
    o.target.checked ? loadImg() : dw.draw();
  };
  col.appendChild(el);
  col.appendChild(document.createTextNode('Фон'));
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

  // domap tooltip
  var el = document.createElement('div');
  el.id = 'maptooltip';
  el.style.padding = '2px';
  el.style.backgroundColor = 'rgba(255,255,255,0.5)';
  el.style.position = 'absolute';
  el.style.zIndex = '10000';
  el.onmousemove = function(){ this.innerHTML = ''; };
  document.body.appendChild(el);

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
  dw.clfunc.onmousemove = function(dw, sd, dd, ev) {
    var tcoords = document.getElementById('tcoords');
    tcoords.innerHTML = ' X: Y:';
    if (dd) tcoords.innerHTML = ' X: ' + dd[0].toFixed(2) + ' Y: ' + dd[1].toFixed(2);
    infobox(ev);
    dw.paintCoords(dd);
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
  imgMapB64(); // reload images base64
  proj();
}
