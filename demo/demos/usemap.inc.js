// usemap.html func
function proj() {
  dw.changeProject(document.getElementById('projlist').value);
  dw.draw();
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
  col.id = 'coords';
  row.appendChild(col);
  document.body.appendChild(mtab);

  var row = document.createElement('tr');
  var col = document.createElement('td');
  col.colSpan = '10';
  col.id = 'mcol';
  col.style.padding = "0";
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  // add new layers
  dw.extend(dw.mopt, {
    'Arctic': {cls: 'Polygon', fg: 'rgb(200,200,200)', bg: dw.mopt['.Arctic']['bg']},
    'Country': {cls: 'Polygon', fg: 'rgb(200,200,200)', bg: dw.mopt['.Mainland']['bg']}
  });
  dw.loadCarta(COUNTRIES);
  delete COUNTRIES;
  dw.loadCarta(dw.createMeridians());
  dw.draw();
  // projlist
  for(var i in dw.proj) {
    var projname = dw.proj[i].split(' ')[0].split('=')[1];
    el = document.createElement('option');
    el.value = i;
    el.appendChild(document.createTextNode(projname));
    projlist.appendChild(el);
  }
  projlist.onchange = proj;
  // curr.object
  dw.clfunc.onmousemove = function() {
    var mcoord = document.getElementById('coords');
    var label = '';
    if (dw.m.pmap) {
      var o = dw.mflood[dw.m.pmap];
      // cities count
      if (m = CITIES[o['label']])
        label = ' : ' + m.length + ' cities';
      label = o['label'] + ' : ' + dw.m.pmap.split('_')[1] + label;
    }
    mcoord.innerHTML = label;
  }
}
