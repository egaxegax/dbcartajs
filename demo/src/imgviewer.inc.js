/**
 * Image viewer.
 * egax@bk.ru, 2015.
 */
function setka(coords, n) {
  var left = coords[0][0],
      right = coords[1][0],
      top = coords[0][1],
      bottom = coords[1][1];
  var lonlat = [];
  var xstep = (right - left)/n,
      ystep = (top - bottom)/n;
  var x = left;
  while (x <= right) {
    var lon = [];
    var y = bottom;
    while (y <= top) {
      lon.push([x, y]);
      y += ystep;
    }
    lonlat.push( ['.Latitude', lonlat.length, lon] );
    x += xstep;
  }
  var y = bottom;
  while (y <= top) {
    var lat = [];
    var x = left;
    while (x <= right) {
      lat.push([x, y]);
      x += xstep;
    }
    lonlat.push( ['.Latitude', lonlat.length, lat] );
    y += ystep;
  }
  return lonlat;
}
function init() {
  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = '#d2e0f0';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.colSpan = '10';
  col.width = '1%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode("Просмотровщик"));
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('button');
  el.appendChild(document.createTextNode("Сетка"));
  el.onclick = function(o) {
    var mimg = dw.mflood['.Image_wrld'];
    if (mimg)
      dw.loadCarta( setka(mimg['coords'], 3) );
    dw.draw();
  };
  col.appendChild(el);
  row.appendChild(col);

  var row = document.createElement('tr');

  var col = document.createElement('td');
  col.width = '120px';
  col.style.borderWidth = '1';
  col.style.borderStyle = 'solid';
  col.style.verticalAlign = 'top';
  row.appendChild(col);
  var md = document.createElement('div');
  col.appendChild(md);

  var col = document.createElement('td');
  col.colSpan = '10';
  col.id = 'mcol';
  col.style.padding = '0';
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  md.style.height = col.offsetHeight + 'px';
  md.style.overflow = 'auto';
  // local img
  for (var i in IMGMAP) {
    var el2 = document.createElement('img');
    el2.style.display = 'block';
    el2.width = 100;
    el2.src = IMGMAP[i];
    el2.onclick = function(){ 
      im.src = this.src;
    };
    md.appendChild(el2);
  }
  // urls img
  var urls = [
    'http://lh4.ggpht.com/5VuzQYNHzN_HgUDdCVnnL0JlRV34NA-ZY9LJq32WpMnq-YOe7nC0gZ8seBEn45tjUQfewSAaq632FbYKo_A',
    'http://lh3.ggpht.com/jYrGCi0FD5EOaGaourdjhWIwqUTYzQ66NJmb-dOHrSh0Uw1rpv1Qm5eW5DCVSzyGpZlRu1qwXM0RQtUA1-g',
    'http://lh5.ggpht.com/Mbb_vJ9fWs5Hp-BUItjEvgA3d0wdrd2OLJhL9u8MfDbWQnZba9msNR8gmd6tHvyjYUSHbcObRsx9zIgeZSs',
    'http://lh4.ggpht.com/Vjcwowzd6fHMnDwOQqqa5Pil0xzXlaNGXJuka4RjYa-Pnz-_RrUsNfeFgbNmO5Vf7qadJUphQ4jpCdFpzT0B'
  ];
  for (var i=0; i<urls.length; i++) {
    var el2 = document.createElement('img');
    el2.style.display = 'block';
    el2.width = 100;
    el2.src = urls[i] + '=s320'; // google image size change for appspot.com
    el2.onclick = function(){
      im.src = this.src;
    };
    md.appendChild(el2);
  }

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  dw.extend(dw.mopt, {'.Latitude': {fg: 'white', width: .25}});
  // worldmap img
  var im = new Image();
  im.src = IMGMAP['wrld_small'];
  im.onload = function() {
    var ratio = im.width/im.height;
    dw.loadCarta([{0:'.Image', 1:'wrld', 2:[[-90*ratio,90],[90*ratio,-90]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_wrld']; // mark as bg
    // clear setka
    for (var tag in dw.mflood){
      if (tag.split('_')[0] == '.Latitude') 
        delete dw.mflood[tag];
    }
    dw.draw();
  }
}
