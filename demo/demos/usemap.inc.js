/**
 * User Map area.
 * View countries under mouse cursor.
 * egax@bk.ru, 2013
 */
function proj() {
  dw.changeProject(document.getElementById('projlist').value);
  dw.draw();
}
// tooltip under cursor
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
  mtab.width = '100%';
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = 'rgb(230,230,230)';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Use Map Area'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  col.appendChild(document.createTextNode('proj '));
  var projlist = el = document.createElement('select');
  el.id = 'projlist';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.align = 'center';
  col.id = 'tcoords';
  row.appendChild(col);
  document.body.appendChild(mtab);

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
  el.style.padding = '5px';
  el.style.backgroundColor = 'rgba(190,170,220,0.9)';
  el.style.position = 'absolute';
  el.style.zIndex = '10000';
  el.onmousemove = function(){ this.innerHTML = ''; };
  document.body.appendChild(el);

  dw = new dbCarta({
    id:'mcol', 
    height:col.offsetHeight,
    mapbg: 'transparent',
    mapfg: 'rgb(220,250,0)'
  });
  // add new layers
  dw.extend(dw.mopt, {
    'Arctic': {cls: 'Polygon', fg: 'rgb(200,200,200)', bg: dw.mopt['.Arctic']['bg']},
    'Country': {cls: 'Polygon', fg: 'rgb(200,200,200)', bg: dw.mopt['.Mainland']['bg']}
  });
  dw.loadCarta(COUNTRIES);
  delete COUNTRIES;
  dw.loadCarta(dw.createMeridians());
  proj();
  // projlist
  for(var i in dw.projlist) {
    var projname = dw.projlist[i].split(' ')[0].split('=')[1];
    el = document.createElement('option');
    el.value = i;
    el.appendChild(document.createTextNode(projname));
    projlist.appendChild(el);
  }
  projlist.onchange = proj;
  // curr.object
  dw.clfunc.onmousemove = function(sd, dd, ev) {
    var mcoord = document.getElementById('tcoords');
    var label = '';
    if (dw.m.pmap) {
      var m, o = dw.mflood[dw.m.pmap];
      // cities count
      if (m = CITIES[o['label']]) label = ' : ' + m.length + ' cities';
      label = o['label'] + ' : ' + dw.m.pmap.split('_')[1] + label;
    } 
    mcoord.innerHTML = label;
    infobox(ev);
  }
}
