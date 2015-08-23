/**
 * Starry Sky Canvas map r4.
 * View stars, constellations, planets, sattelites on Earth background.
 * egax@bk.ru, 2013-15.
 */
// list layers in order
var mopt = {
  'cntlines': {cls: 'Line', fg: 'rgba(200,200,170,0.3)', labelcolor: 'rgb(200,200,170)'},
  'cntpos': {cls: 'Dot', fg: 'rgb(17,17,96)', labelcolor: 'rgb(0,200,0)'},
  'stars': {cls: 'Dot', fg: 'rgb(255,255,255)', labelcolor: 'rgb(155,155,200)'},
  'sun': {cls: 'Dot', fg: 'rgb(255,255,0)', labelcolor: 'rgb(255,255,0)'},
  'moon': {cls: 'Dot', fg: 'rgb(200,200,200)', labelcolor: 'rgb(200,200,200)'},
  'planets': {cls: 'Dot', fg: 'rgb(220,200,200)', labelcolor: 'rgb(255,155,128)'},
  'earth': {},
  'sattrac': {cls: 'Line', fg: 'rgba(100,100,220,0.4)'},    
  'satsurface': {cls: 'Dot', fg: 'rgba(255,255,220,0.9)', size: '2'},
  'sattrace': {cls: 'Line', fg: 'rgb(255,255,0)'},
  'satsector': {cls: 'Polygon', fg: 'rgba(200,200,170,0.1)', bg: 'rgba(200,200,170,0.1)', width: '0.1'},
  'satpos':  {cls: 'Dot', fg: 'rgb(200,200,170)', labelcolor: 'rgb(200,200,170)'},
  'terminator': {cls: 'Polygon', fg: 'rgba(0,0,0,0.3)', bg: 'rgba(0,0,0,0.3)'}
};
// list sat
var msat = {};
// layers on
function layers() {
  var m = {};
  for (var i in mopt) if (!mopt[i]['hide']) m[i] = mopt[i];
  return m;
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
  else {
    scaleheight();
    draw();
  }
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
    draw();
  };
}
// Rotate map
function rotate() {
  var tval = parseFloat(document.getElementById('tvalue').value);
  dw.rotateCarta(tval);
  draw();
}
// Change proj
function proj() { 
  dw.changeProject(document.getElementById('projlist').value);
  // reset map
  var centerof = dw.toPoints([0, 0], false);
  dw.centerCarta(centerof[0] + dw.m.offset[0], centerof[1] + dw.m.offset[1]);
  dw.style.backgroundColor = dw.isTurnable() ? 'rgb(17,17,96)' : 'rgb(186,196,205)';
  freeImg();
  document.getElementById('chkbg').checked ? loadImg() : draw();
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
// Calculate Right Ascention and Declination (ra/dec)
function calcSpheric(coords, dt) {
  if (!dw.isTurnable()) return;
  var proj = dw.initProj();
  var rect = dw.viewsizeOf(),
      skyRadius = 0.6 * Math.sqrt((rect[2]-rect[0])*(rect[2]-rect[0]) + (rect[3]-rect[1])*(rect[3]-rect[1])),
      gmst = Starry.siderealTime(dt),
      skyRotationAngle = gmst / 12.0 * Math.PI;
  coords[0] /= skyRadius * Math.PI/180;
  coords[1] /= skyRadius * Math.PI/180;
  var cy = -proj.lat0 * 180/Math.PI,
      cx = proj.long0 * 180/Math.PI + skyRotationAngle * 180/Math.PI;
  var skyproj = '+proj=ortho +units=m +a=' + proj.a + ' +b=' + proj.b + ' +lon_0=' + cx + ' +lat_0=' + cy;
  Proj4js.defs['SKY'] = skyproj;
  dw.projload['SKY'] = new Proj4js.Proj('SKY');
  var pt = dw.transformCoords('SKY', 'epsg:4326', coords);
  if (pt) {
    // backside
    pt[0] = MUtil.ang360(180 - (pt[0] - cx) + cx) * Math.PI/180;
    pt[1] = pt[1] * Math.PI/180;
  }
  return pt;
}
// Night zone coords
function terminator(time, h, cx, cy) {
  var sunpos = Solar.loadSun(time),
      srect = MVector.spheric2rect(sunpos[0], sunpos[1]),
      sgeo = MVector.rect2geo(time, srect[0], srect[1], srect[2]);
  if (dw.isTurnable()) {
    var s1 = MGeo.bigcircle1spheric(sgeo[0], sgeo[1], 1, cx, cy, true);
    h += MGeo.AE;
    var ss1 = [];
    for(var i in s1) {
      if (MGeo.distance(s1[i], [cx, cy])<=Math.acos(MGeo.AE/h)) ss1.push(s1[i]);
    }
    s1 = ss1;
    var s2 = MGeo.circle1spheric(cx, cy, MGeo.AE*Math.acos(MGeo.AE/h)-100,60);
    var ss1 = [], ss2 = [], f=0;
    for(var i in s2) {
      if (!MGeo.islight(s2[i][0], s2[i][1], sgeo[0], sgeo[1])) {
        if (!f)
          ss1.push(s2[i]);
        else
          ss2.push(s2[i]);
      } else {
        f = true;
      }
    }
    s2=ss2.concat(ss1);
    if (s1.length && s2.length) {
      if (MGeo.distance(s1[0], s2[0]) < Math.PI/4.0) s2.reverse();
    }
    var s = s1.concat(s2);
    if (s) {
      s.push(s[0]);
    }
  } else {
    var s = MGeo.bigcircle1spheric(sgeo[0], sgeo[1], 5),
        isnight = MGeo.isnight(srect, 179.99, ylimit),
        ylimit = (dw.project == 101 ? 84 : 89.99);
    if (dw.project !== 201) {
      if (isnight) s.push([179.99,ylimit]); else s.push([179.99,-ylimit]);
      if (isnight) s.push([-179.99,ylimit]); else s.push([-179.99,-ylimit]);
    }
    s.push(s[0]);
  }
  return s;
}
// Render points (stars, tracs) on lonlat
function drawlonlat(pts, ftype, areasize) {
  if (!dw.isTurnable()) return;
  var proj = dw.initProj();
  var cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI;
  // switch to lonlat
  dw.initProj(0, '');
  for(var i in pts) {
    var mcoords = pts[i][0],
        msize = pts[i][1],
        mlabel = pts[i][2],
        mftag = pts[i][3] || mlabel;
    if (msize) 
      dw.mopt[ftype]['size'] = msize / 8;
    var m = dw.paintCarta(mcoords, ftype, mlabel);
    // add map area
    if (mftag) {
      var desc = [];
      if (pts[i][4]) // opt.info
        for (var k in pts[i][4])
          if (pts[i][4][k]) desc.push('<b>' + k + '</b>: ' + pts[i][4][k]);
      dw.marea[ftype + '_' + mftag] = {
        'ftype': ftype,
        'ftag': mftag,
        'pts': m['pts'],
        'desc': desc.join('<br/>')
      };
    }
    if (areasize) // fix size for area map
      dw.mopt[ftype]['size'] = areasize;
  }
  // restore spherical proj
  dw.initProj(202, ' +h=' + proj.h + ' +lon_0=' + cx + ' +lat_0=' + cy);
}
// Render all layers
function draw() {
  var mlayers = layers();
  var proj = dw.initProj();
  var cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI,
      rect = dw.viewsizeOf(),
      skyRadius = 0.6 * Math.sqrt((rect[2]-rect[0])*(rect[2]-rect[0]) + (rect[3]-rect[1])*(rect[3]-rect[1])),
      eaRadius = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)) * 180/Math.PI,
      eaRadiusM = proj.a,
      rotate = dw.m.rotate,
      centerof = dw.viewcenterOf(),
      gmtime = getSelTime(),
      darkhide = ('earth' in mlayers);
  var sat = {};
  // clear all
  dw.clearCarta();
  for (var i in dw.mflood) {
    switch (dw.mflood[i]['ftype']) {
    case 'terminator':
    case 'sattrace':
    case 'satsurface':
      delete dw.mflood[i];
    }
  }
  // clear map area
  dw.marea = {};
  for (var ftype in mlayers) {
    switch (ftype) {
    case 'earth':
      dw.draw(1);
      break;
    case 'stars':
      var stars = STARS,
          mstars = Starry.renderSky(stars, rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide);
      drawlonlat(mstars, ftype, 3);
      break;
    case 'cntlines':
      var lns = CLNS,
          mpts = [];
      for (var i=0; i<lns.length; i=i+2) {
        var m = Starry.renderSky([lns[i], lns[i+1]], rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide, true);
        if (m.length == 1)
          m = Starry.renderSky([lns[i], lns[i+1]], rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, false, false);
        if (m.length > 1)
          mpts.push([[m[0][0][0], m[1][0][0]]]);
      }
      drawlonlat(mpts, ftype);
      break;
    case 'cntpos':
      var cnts = CNTS,
          mcnts = Starry.renderSky(cnts, rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide);
      drawlonlat(mcnts, ftype);
      break;
    case 'sun':
      var sun = Solar.loadSun(gmtime),
          msun = Starry.renderSky([sun], rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide);
      drawlonlat(msun, ftype, 5);
      break;
    case 'moon':
      var moon = Solar.loadMoon(gmtime),
          mmoon = Starry.renderSky([moon], rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide);
      drawlonlat(mmoon, ftype, 4);
      break;
    case 'planets':
      var planets = Solar.loadPlanets(gmtime),
          mplanets = Starry.renderSky(planets, rect, skyRadius, eaRadius, cx, cy, rotate, centerof, gmtime, darkhide);
      drawlonlat(mplanets, ftype, 4);
      break;
    case 'terminator':
      var term = terminator(gmtime, proj.h/1000, cx, cy);
      dw.loadCarta([[ftype, '1', term]], 1);
      break;
    case 'satpos':
    case 'sattrac':
    case 'sattrace':
    case 'satsurface':
    case 'satsector':
      var tledata = TLEDATA.GLONASS;
      for (var i in tledata){
        if (!tledata[i])
          continue; // check data
        if (msat[tledata[i][0]])
          continue; // skip hidden
        if (!sat[i]) {
          var satrec = satellite.twoline2satrec(tledata[i][1], tledata[i][2]);
          // orbital period
          var utc1 = Date.UTC(gmtime[0], gmtime[1]-1, gmtime[2], gmtime[3], gmtime[4], gmtime[5]),
              ps = 2.0 * Math.PI * 60.0/satrec.no, // rad.per min to 2 period
              delta = 0, step = ps / 200.0, vrect = [], vgeo = [];
          while (delta <= ps) {
            var utc2 = new Date();
            utc2.setTime(utc1 - delta * 1000);
            var pv = satellite.propagate(satrec, utc2.getUTCFullYear(), utc2.getUTCMonth()+1, utc2.getUTCDate(), utc2.getUTCHours(), utc2.getUTCMinutes(), utc2.getUTCSeconds()),
                gmst = satellite.gstime_from_date(utc2.getUTCFullYear(), utc2.getUTCMonth()+1, utc2.getUTCDate(), utc2.getUTCHours(), utc2.getUTCMinutes(), utc2.getUTCSeconds()),
                pgeo = satellite.eci_to_geodetic(pv['position'], gmst);
            delta += step;
            vrect.push([pv['position']['x'], pv['position']['y'], pv['position']['z']]);
            vgeo.push([MUtil.ang180(pgeo['longitude'] * 180/Math.PI), MUtil.ang90(pgeo['latitude'] * 180/Math.PI)]);
          }
          sat[i] = {
            'tracs': [tledata[i][0], vrect],
            'mtracs': Starry.renderSat(vrect, rect, eaRadius, eaRadiusM, cx, cy, gmtime, darkhide),
            'mcoords': vgeo
          };
        }
        var tracs = sat[i]['tracs'], 
            mtracs = sat[i]['mtracs'], 
            mcoords = sat[i]['mcoords'];
        // calc sat.height
        var sath = Math.sqrt(tracs[1][0][0]*tracs[1][0][0] + tracs[1][0][1]*tracs[1][0][1] + tracs[1][0][2]*tracs[1][0][2]);
        sath = (sath - MGeo.AE).toFixed(0) + ' km';
        // orbit
        if (ftype == 'sattrac')
          drawlonlat(mtracs[1], ftype);
        // surface point
        if (ftype == 'satsurface') {
          dw.loadCarta([[ftype, i, [mcoords[0]]]], 1);
          var m = {label: tracs[0], lon: mcoords[0][0].toFixed(4), lat: mcoords[0][1].toFixed(4), h: sath},
              desc = [];
          for (var k in m) if (m[k]) desc.push('<b>' + k + '</b>: ' + m[k]);
          dw.marea[ftype + '_' + i] = {
            'ftype': ftype,
            'ftag': i,
            'pts': dw.mflood[ftype + '_' + i]['pts'],
            'desc': desc.join('<br/>')
          };
        }
        // surface trace
        if (ftype == 'sattrace') {
          var trace = [];
          for (var j in mcoords)
            if (mcoords[j-1] && mcoords[j][0] - mcoords[j-1][0] < 90)
              trace.push([ftype, i + '.' + j, [mcoords[j-1], mcoords[j]]]);
          dw.loadCarta(trace, 1);
        }
        if (dw.isTurnable() && mtracs[0].length) {
          // sat.fields of vision
          if (ftype == 'satsector') {
            var pts = MGeo.circle1spheric(mcoords[0][0], mcoords[0][1], MGeo.AE * 18 * Math.PI/180, 20);
            // conv to lonlat
            var mpts = [];
            for(var j in pts){
              var pt = dw.transformCoords('epsg:4326', String(dw.project), pts[j]);
              if (pt) {
                if (!pt[2]) // backside intersect ea
                  pt = MGeo.lineNcircle([ mtracs[0][0][0][0], pt ], eaRadius);
                if (j > 0) // triangle sector
                  mpts.push([[mtracs[0][0][0][0], pt, pt1]]);
                var pt1 = pt; // previous pt
              }
            }
            drawlonlat(mpts, ftype);
          }
          // sat.label
          if (ftype == 'satpos')
            drawlonlat([[[mtracs[0][0][0][0]], 16, tracs[0], i, {label: tracs[0], h: sath}]], ftype);
        }
      }
      break;
    }
  }
}
// Scale map by height above Earth
function scaleheight() {
  if (!dw.isTurnable()) return;
  var proj = dw.initProj();
  var projh = document.getElementById('projh').value * 1000,
      cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI;
  // set height
  var proj = dw.initProj(' +h=' + projh + ' +lon_0=' + cx + ' +lat_0=' + cy);
  // skyratio
  var rhscale = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0));
  dw.scaleCarta(1);
  dw.scaleCarta(1/rhscale * 4/proj.p15);
}
function getSelTime() {
  return [ Number(document.getElementById('yy').value),
           Number(document.getElementById('mm').value),
           Number(document.getElementById('dd').value),
           Number(document.getElementById('hh').value),
           Number(document.getElementById('mi').value),
           Number(document.getElementById('ss').value) ];
}
function setSelTime(interval) {
  if (interval) {
    var st = getSelTime(),
        ut = Date.UTC(st[0],st[1]-1,st[2],st[3],st[4],st[5]);
    var dt = new Date(ut + interval);
  } else
    var dt = new Date();
//    var dt = new Date(Date.UTC(2010, 12-1, 22, 7, 33, 0));
  document.getElementById('yy').value = dt.getUTCFullYear();
  document.getElementById('mm').value = dt.getUTCMonth()+1;
  document.getElementById('dd').value = dt.getUTCDate();
  document.getElementById('hh').value = dt.getUTCHours();
  document.getElementById('mi').value = dt.getUTCMinutes();
  document.getElementById('ss').value = dt.getUTCSeconds();
}
function setAutoTime() {
  if (window.autotime) {
    window.autotime = window.clearInterval(window.autotime);
    document.getElementById('btauto').textContent = '▶';
  } else {
    window.autotime = setInterval(function() {
      setSelTime(500*1000);
      draw();
    }, 500);
    document.getElementById('btauto').textContent = '◼';
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
  col.width = '5%';
  col.style.whiteSpace = 'nowrap';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Звезды'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '25%';
  var layerlist = el = document.createElement('select');
  el.id = 'layerlist';
  col.appendChild(el);
  var satlist = el = document.createElement('select');
  el.id = 'satlist';
  col.appendChild(el);
  var projh = el = document.createElement('select');
  el.id = 'projh';
  col.appendChild(el);
  var projlist = el = document.createElement('select');
  el.id = 'projlist';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'text';
  el.size= '3';
  el.id = 'tvalue';
  el.value= '1';
  col.appendChild(el);
  var el = document.createElement('button');
  el.onclick = rotate;
  el.appendChild(document.createTextNode('rotate'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  var yy = el = document.createElement('select');
  yy.id = 'yy';
  col.appendChild(el);
  var mm = el = document.createElement('select');
  mm.id = 'mm';
  col.appendChild(el);
  var dd = el = document.createElement('select');
  dd.id = 'dd';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '9%';
  var hh = el = document.createElement('select');
  hh.id = 'hh';
  col.appendChild(el);
  var mi = el = document.createElement('select');
  mi.id = 'mi';
  col.appendChild(el);
  var ss = el = document.createElement('select');
  ss.id = 'ss';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '1%';
  el = document.createElement('button');
  el.id = 'btauto';
  col.appendChild(el);
  el.onclick = setAutoTime;
  el.title = 'Обновлять по таймеру';
  el.appendChild(document.createTextNode('▶'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '5%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'checkbox';
  el.id = 'chkbg';
  el.checked = true;
  el.onclick = function(o) {
    freeImg();
    o.target.checked ? loadImg() : draw();
  };
  col.appendChild(el);
  col.appendChild(document.createTextNode('Фон'));
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('div');
  el.id = 'tcoord';
  el.style.fontSize = 'smaller';
  col.appendChild(el);
  row.appendChild(col);

  var row = document.createElement('tr');
  var col = document.createElement('td');
  col.colSpan = '50';
  col.id = 'mcol';
  col.style.padding = '0';
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  // domap tooltip
  var el = document.createElement('div');
  el.id = 'maptooltip';
  el.style.borderRadius = '4px';
  el.style.border = '1px solid rgb(190,210,220)';
  el.style.backgroundColor = 'rgba(190,210,220,0.7)';
  el.style.color = 'rgba(0,0,0,0.7)';
  el.style.padding = '4px';
  el.style.position = 'absolute';
  el.style.zIndex = '10000';
  el.onmousemove = function(){ this.innerHTML = ''; };
  document.body.appendChild(el);

  dw = new dbCarta({id:'mcol', height:col.offsetHeight});
  // define new layers
  dw.extend(dw.mopt, layers());
  var optfunc = function(o, k, v) {
    var el = document.createElement('option');
    el.value = k;
    el.appendChild(document.createTextNode(v || k));
    o.appendChild(el);
  };
  // list layers
  optfunc(layerlist, 'Слои...');
  layerlist.options[layerlist.selectedIndex].disabled = 'true';
  for(var i in layers()) optfunc(layerlist, i);
  // list sat
  optfunc(satlist, 'Аппараты...');
  satlist.options[satlist.selectedIndex].disabled = 'true';
  for(var i in TLEDATA.GLONASS) optfunc(satlist, TLEDATA.GLONASS[i][0]);
  // list nsper proj height
  optfunc(projh, 'Высота...');
  projh.options[projh.selectedIndex].disabled = 'true';
  for(var i=1000; i<103000; i+=3000) optfunc(projh, i);
  projh.value = 40000;
  // list proj
  optfunc(projlist, 'Проекции...');
  projlist.options[projlist.selectedIndex].disabled = 'true';
  var pl = [0, 101, 102, 201, 202, 204]; // exlude ortho
  for(var i in pl) optfunc(projlist, pl[i], dw.projlist[pl[i]].split(' ')[0].split('=')[1]);
  projlist.value = '202';
  // fill date/time
  for(i=1999; i<2050; i++) optfunc(yy, i);
  for(i=1; i<13; i++) optfunc(mm, i);
  for(i=1; i<32; i++) optfunc(dd, i);
  for(i=0; i<24; i++) optfunc(hh, i);
  for(i=0; i<60; i++) optfunc(mi, i);
  for(i=0; i<60; i++) optfunc(ss, i);
  // events
  layerlist.onchange = function() {
    mopt[this.value]['hide'] = (!mopt[this.value]['hide']);
    this.options[this.selectedIndex].style.color = (mopt[this.value]['hide'] ? 'lightgray' : '');
    this.selectedIndex = 0;
    draw();
  };
  satlist.onchange = function() {
    msat[this.value] = (!msat[this.value]);
    this.options[this.selectedIndex].style.color = (msat[this.value] ? 'lightgray' : '');
    this.selectedIndex = 0;
    draw();
  };
  // hide some sat
  for(var i=0; i<satlist.options.length; i++) {
    if (i>1) {
      satlist.options[i].style.color = 'lightgray';
      msat[satlist.options[i].value] = true;
    }
  }
  projh.onchange = function() {
    scaleheight();
    draw();
  };
  projlist.onchange = proj;
  yy.onchange = draw;
  mm.onchange = draw;
  dd.onchange = draw;
  hh.onchange = draw;
  mi.onchange = draw;
  ss.onchange = draw;
  dw.clfunc.onclick = draw;
  // curr. coords
  dw.clfunc.onmousemove = function(dw, sd, dd, ev) {
    var scoords, tcoord = document.getElementById('tcoord');
    tcoord.innerHTML = '';
    if (dw.isTurnable()) {
      if (scoords = calcSpheric(sd, getSelTime())) {
        // in radians
        tcoord.innerHTML = 'Ra: ' + scoords[0].toFixed(4) + ' Dec: ' + scoords[1].toFixed(4);
        // in hms, dms
//        var ra = MUtil.deg2hms(scoords[0] * 180/Math.PI).join(':'),
//            dec scoords= MUtil.deg2dms(scoords[1] * 180/Math.PI).join(':');
//        tcoord.innerHTML = 'Ra: ' + ra + ' Dec: ' + dec;
      }
    } else if (dd) {
      tcoord.innerHTML = ' Lon: ' + dd[0].toFixed(2) + ' Lat: ' + dd[1].toFixed(2);
    }
    infobox(ev);
  };
  // draw
  dw.loadCarta(CONTINENTS);
  //delete CONTINENTS;
  dw.loadCarta([{0:'.Image', 1:'wrld'}]);
  dw.loadCarta(dw.createMeridians());
  dw.loadCarta([['DotPort', 'Moscow', [[37.700,55.750]], 'Москва', null, 1]]);
  // center pov
  var pov = dw.mflood['DotPort_Moscow']['coords'][0],
      pts = dw.toPoints(pov, true);
  dw.centerCarta(pts[0] + dw.m.offset[0], pts[1] + dw.m.offset[1]);
  delete dw.cfg.mapbg; // no draw map area
  setSelTime();
  proj();
}
