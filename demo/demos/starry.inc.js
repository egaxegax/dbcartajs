/**
 * Starry Sky Canvas map.
 * View stars, constellations, planets, sattelites on Earth background.
 * egax@bk.ru, 2013
 */
// list layers in order
var mopt = {
  'cntlines': {cls: 'Line', fg: 'rgba(200,200,170,0.3)', labelcolor: 'rgb(200,200,170)'},
  'cntpos': {cls: 'Dot', fg: 'rgb(17,17,96)', labelcolor: 'rgb(0,200,0)'},
  'star': {cls: 'Dot', fg: 'rgb(255,255,255)', labelcolor: 'rgb(155,155,200)'},
  'sun': {cls: 'Dot', fg: 'rgb(255,255,0)', labelcolor: 'rgb(255,255,0)'},
  'moon': {cls: 'Dot', fg: 'rgb(200,200,200)', labelcolor: 'rgb(200,200,200)'},
  'planet': {cls: 'Dot', fg: 'rgb(220,200,200)', labelcolor: 'rgb(255,155,128)'},
  'earth': {},
  'sattrac': {cls: 'Line', fg: 'rgba(100,100,220,0.4)'},    
  'satsurface': {cls: 'Dot', fg: 'rgb(0,220,0)', size: '2'},
  'sattrace': {cls: 'Dot', fg: 'rgba(220,220,0,0.3)'},
  'satsector': {cls: 'Polygon', fg: 'rgba(200,200,170,0.1)', bg: 'rgba(200,200,170,0.1)', width: '0.1'},
  'satpos':  {cls: 'Dot', fg: 'rgb(200,200,170)', labelcolor: 'rgb(200,200,170)'},
  'terminator': {cls: 'Polygon', fg: 'rgba(0,0,0,0.3)', bg: 'rgba(0,0,0,0.3)'}
}
// layers on
function layers() {
  var m = {};
  for (var i in mopt)
    if (!mopt[i]['hide']) m[i] = mopt[i];
  return m;
}
// Rotate Sphere on sides
function turn(cx, cy) {
  if (!isNaN(cx) && !isNaN(cy))
    if (dw.isSpherical()) {
      var proj = dw.initProj();
      cx += proj.long0 * 180/Math.PI;
      cy += proj.lat0 * 180/Math.PI;
      dw.initProj(' +h=' + proj.h + ' +lon_0=' + cx + ' +lat_0=' + cy);
      draw();
    }
}
// Calcucate Right Ascention and Declination (Ra/Dec)
function calcSpheric(coords, dt) {
  var proj = dw.initProj();
  var skyratio = proj.h/proj.a;
      gmst = Starry.siderealTime(dt),
      skyRotationAngle = gmst / 12.0 * Math.PI;
  coords[0] /= skyratio;
  coords[1] /= skyratio;
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
// Render points (stars, tracs) on lonlat
function drawlonlat(pts, ftype, areasize){
  var proj = dw.initProj();
  var projh = document.getElementById('projh').value * 1000,
      cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI;
  // switch to lonlat
  dw.initProj(0, '');
  for(var i in pts) {
    var mcoords = pts[i][0],
        msize = pts[i][1] / 8,
        mlabel = pts[i][2],
        mftag = pts[i][3] || mlabel;
    if (msize) 
      dw.mopt[ftype]['size'] = msize;
    var m = dw.paintCarta(mcoords, ftype, mlabel);
    // add map area
    if (mftag && dw.chkPts(m['pts'][0])) {
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
  dw.initProj(202, ' +h=' + projh + ' +lon_0=' + cx + ' +lat_0=' + cy);
}
// Render all layers
function draw(){
  var mlayers = layers();
  var proj = dw.initProj();
  var projh = document.getElementById('projh').value * 1000,
      cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI,
      rect = dw.viewsizeOf(),
      skyRadius = 180/Math.PI * projh/proj.a,
      eaRadius = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)) * 180/Math.PI,
      eaRadiusM = proj.a,
      gmtime = getSelTime(),
      darkhide = ('earth' in mlayers);
  dw.clearCarta();
  // clear map area
  dw.marea = {};
  for (var ftype in mlayers) {
    switch (ftype) {
    case 'earth':
      dw.draw(1);
      break;
    case 'star':
      var stars = STARS,
          mstars = Starry.renderSky(stars, rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide);
      drawlonlat(mstars, 'star', 3);
      break;
    case 'cntlines':
      var lns = CLNS;      
      for (var i=0; i<lns.length; i=i+2) {
        var m = Starry.renderSky([lns[i], lns[i+1]], rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide, true);
        if (m.length == 1)
          m = Starry.renderSky([lns[i], lns[i+1]], rect, skyRadius, eaRadius, cx, cy, gmtime, false, false);
        if (m.length > 1)
          drawlonlat([[[m[0][0][0], m[1][0][0]]]], 'cntlines');
      }
      break;
    case 'cntpos':
      var cnts = CNTS,
          mcnts = Starry.renderSky(cnts, rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide);
      drawlonlat(mcnts, 'cntpos');
      break;
    case 'sun':
      var sun = Solar.loadSun(gmtime),
          msun = Starry.renderSky([sun], rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide);
      drawlonlat(msun, 'sun', 5);
      break;
    case 'moon':
      var moon = Solar.loadMoon(gmtime),
          mmoon = Starry.renderSky([moon], rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide);
      drawlonlat(mmoon, 'moon', 4);
      break;
    case 'planet':
      var planets = Solar.loadPlanets(gmtime),
          mplanets = Starry.renderSky(planets, rect, skyRadius, eaRadius, cx, cy, gmtime, darkhide);
      drawlonlat(mplanets, 'planet', 4);
      break;
    case 'terminator':
      var term = MGeo.terminator(gmtime, projh/1000.0, cx, cy);
      dw.paintCarta(term, 'terminator');
      break;
    case 'satpos':
    case 'sattrac':
    case 'sattrace':
    case 'satsurface':
    case 'satsector':
      var tledata = TLEDATA;
      for (var i in tledata){
        if (!tledata[i][1])
          continue; // check data
        var pos = [];
        var satrec = satellite.twoline2satrec(tledata[i][1], tledata[i][2]);
        // by 2 mean motion ago
        var utc1 = Date.UTC(gmtime[0], gmtime[1], gmtime[2], gmtime[3], gmtime[4], gmtime[5]),
            ps = 2.0 * Math.PI * 1/satrec.no * 60.0,
            delta = 0, step = ps / 100.0, vrect = [];
        while (delta < ps) {
          var utc2 = new Date();
          utc2.setTime(utc1 - delta * 1000);
          var pv = satellite.propagate(satrec, utc2.getUTCFullYear(), utc2.getUTCMonth()+1, utc2.getUTCDate(), utc2.getHours(), utc2.getMinutes(), utc2.getSeconds());
          delta += step;
          vrect.push(pv[0]);
        }
        var tracs = [tledata[i][0], vrect];
        var mtracs = Starry.renderSat(tracs[1], rect, eaRadius, eaRadiusM, cx, cy, gmtime, darkhide),
            mcoords = MVector.rect2geo(gmtime, tracs[1][0][0], tracs[1][0][1], tracs[1][0][2]);
        // orbit
        if (ftype == 'sattrac') {
          drawlonlat(mtracs[1], 'sattrac');
        }
        // surface point
        if (ftype == 'satsurface') {
          var m = dw.paintCarta([mcoords], 'satsurface');
          if (dw.chkPts(m['pts'][0])) {
            dw.marea['satsurface'+i] = {
              'ftype': 'satsurface',
              'ftag': i,
              'pts': m['pts'],
              'desc': tracs[0]
            }
          }
        }
        // surface trace
        if (ftype == 'sattrace') {
          if (!trace[i]) trace[i] = [];
          trace[i].push(mcoords);
          if (trace[i].length > 40) trace[i].shift();
          for(var j in trace[i])
            dw.paintCarta([trace[i][j]], 'sattrace');
        }
        if (mtracs[0].length) {
          // sat.fields of vision
          if (ftype == 'satsector') {
            var pts = MGeo.circle1spheric(mcoords[0], mcoords[1], MGeo.AE * 18 * Math.PI/180, 20);
            // conv to lonlat
            for(var j in pts){
              if (pt = dw.transformCoords('epsg:4326', String(dw.project), pts[j])) {
                if (!pt[2]) // backside intersect ea
                  pt = MGeo.lineNcircle([ mtracs[0][0][0][0], pt ], eaRadius);
                if (j > 0) // triangle sector
                  drawlonlat([[[mtracs[0][0][0][0], pt, pt1]]], 'satsector');
                var pt1 = pt; // previous pt
              }
            }
          }
          if (ftype == 'satpos') {
            // calc sat.height
            var x = tracs[1][0][0], y = tracs[1][0][1], z = tracs[1][0][2], 
                h = Math.sqrt(x*x + y*y + z*z);
            // draw sat.label
            drawlonlat([[[mtracs[0][0][0][0]], 16, tracs[0], i, {label: tracs[0], height: Math.floor(h)}]], 'satpos');
          }
        }
      }
      break;
    }
  }
}
// Scale map by height above Earth
function scaleheight() {
  var proj = dw.initProj();
  var projh = document.getElementById('projh').value * 1000,
      cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI;
  // set height
  var proj = dw.initProj(' +h=' + projh + ' +lon_0=' + cx + ' +lat_0=' + cy);
  // skyratio measure on 40000 km
  var rhscale = ((proj.p15 - 1.0)/(proj.p15 + 1.0)),
      etalon_p15 = (1.0 + 40000000/proj.a),
      etalon_rhscale = ((etalon_p15 - 1.0)/(etalon_p15 + 1.0)),
      sh = (rhscale/etalon_rhscale * rhscale/etalon_rhscale);
  dw.scaleCarta(1);
  dw.scaleCarta(1/sh);
}
function getSelTime() {
  return [Number(document.getElementById('yy').value),
          Number(document.getElementById('mm').value),
          Number(document.getElementById('dd').value),
          Number(document.getElementById('hh').value),
          Number(document.getElementById('mi').value),
          Number(document.getElementById('ss').value)]
}
function setSelTime(interval) {
  if (interval) {
    var st = getSelTime(),
        ut = Date.UTC(st[0],st[1]-1,st[2],st[3],st[4],st[5]);
    var dt = new Date(ut + interval);
  } else
    var dt = new Date();
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
    document.getElementById('btauto').textContent = 'play';
  } else {
    window.autotime = setInterval(function() {
      setSelTime(500*1000);
      draw();
    }, 500);
    document.getElementById('btauto').textContent = 'stop';
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
  col.width = '10%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Starry Sky'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  el = document.createElement('button');
  el.id = 'btup';
  el.onclick = function() { turn(0, -5) };
  el.title = 'Turn Up';
  el.appendChild(document.createTextNode('U'));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btdown';
  el.onclick = function() { turn(0, 5) };
  el.title = 'Turn Down';
  el.appendChild(document.createTextNode('D'));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btleft';
  el.onclick = function() { turn(5, 0) };
  el.title = 'Turn Left';
  el.appendChild(document.createTextNode('L'));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btright';
  el.onclick = function() { turn(-5, 0) };
  el.title = 'Turn Right';
  el.appendChild(document.createTextNode('R'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '5%';
  col.align = 'center';
  var lstlayers = el = document.createElement('select');
  el.id = 'lstlayers';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  col.appendChild(document.createTextNode('height '));
  var projh = el = document.createElement('select');
  el.id = 'projh';
  col.appendChild(el);
  col.appendChild(document.createTextNode(' km'));
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '20%';
  col.align = 'center';
  var yy = document.createElement('select');
  yy.id = 'yy';
  var mm = document.createElement('select');
  mm.id = 'mm';
  var dd = document.createElement('select');
  dd.id = 'dd';
  dd.style.marginRight = '0.5em';
  var hh = document.createElement('select');
  hh.id = 'hh';
  var mi = document.createElement('select');
  mi.id = 'mi';
  var ss = document.createElement('select');
  ss.id = 'ss';
  ss.style.marginRight = '0.5em';
  el = document.createElement('button');
  el.id = 'btauto';
  el.onclick = setAutoTime;
  el.title = 'autoupdate by interval';
  el.appendChild(document.createTextNode('play'));
  col.appendChild(yy);
  col.appendChild(document.createTextNode('-'));
  col.appendChild(mm);
  col.appendChild(document.createTextNode('-'));
  col.appendChild(dd);
  col.appendChild(hh);
  col.appendChild(document.createTextNode(':'));
  col.appendChild(mi);
  col.appendChild(document.createTextNode(':'));
  col.appendChild(ss);
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('div');
  el.id = 'coords';
  col.appendChild(el);
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
  // change some colors
  dw.style.backgroundColor = 'rgb(17,17,96)';
  dw.mopt['DotPort']['fg'] = 'rgb(220,0,0)';
  dw.mopt['DotPort']['size'] = '3';
  // define new layers
  dw.extend(dw.mopt, layers());
  var optfunc = function(v, o) {
    var el = document.createElement('option');
    el.id = 'o-' + v;
    el.value = v;
    el.appendChild(document.createTextNode(v));
    o.appendChild(el);
  };
  // list layers
  optfunc('layers...', lstlayers)
  for(var i in layers()) optfunc(i, lstlayers);
  // nsper proj height list
  for(var i=1000; i<103000; i+=3000) optfunc(i, projh);
  projh.value = 25000;
  // fill date/time
  for(i=1999; i<2050; i++) optfunc(i, yy);
  for(i=1; i<13; i++) optfunc(i, mm);
  for(i=1; i<32; i++) optfunc(i, dd);
  for(i=0; i<24; i++) optfunc(i, hh);
  for(i=0; i<60; i++) optfunc(i, mi);
  for(i=0; i<60; i++) optfunc(i, ss);
  // events
  lstlayers.onchange = function() {
    var opt = document.getElementById('o-' + this.value);
    mopt[this.value]['hide'] = (!mopt[this.value]['hide']);
    opt.style.color = (mopt[this.value]['hide'] ? 'lightgray' : '');
    this.value = 'layers...';
    draw();
  }
  projh.onchange = function() {
    scaleheight();
    draw();
  }
  yy.onchange = draw;
  mm.onchange = draw;
  dd.onchange = draw;
  hh.onchange = draw;
  mi.onchange = draw;
  ss.onchange = draw;
  dw.clfunc.onclick = draw;
  // curr. coords
  dw.clfunc.onmousemove = function(sd) {
    mcoord = document.getElementById('coords');
    mcoord.innerHTML = 'Ra/Dec:';
    if (scoords = calcSpheric(sd, getSelTime())) {
      // in radians
      mcoord.innerHTML = 'Ra: ' + scoords[0].toFixed(4) + ' Dec: ' + scoords[1].toFixed(4);
      // in hms, dms
//      var ra = MUtil.deg2hms(scoords[0] * 180/Math.PI).join(':'),
//          dec = MUtil.deg2dms(scoords[1] * 180/Math.PI).join(':');
//      mcoord.innerHTML = 'Ra: ' + ra + ' Dec: ' + dec;
    }
  }
  // draw
  var pov = [37.700,55.750];
  dw.initProj(202, ' +h=' + projh.value * 1000 + ' +lon_0=' + pov[0] + ' +lat_0=' + pov[1]);
  dw.loadCarta(CONTINENTS);
  dw.loadCarta(dw.createMeridians());
  dw.loadCarta([['DotPort', 'Moscow', [pov], 'Москва']]);
  delete dw.cfg.mapbg; // no draw map area
  //delete CONTINENTS;
  window.trace = {};
  setSelTime();
  scaleheight();
  draw();
}
