// starry.html func
function draw() {
  if (dw.isSpherical()) {
    var proj = dw.initProj();
    var projh = document.getElementById('projh').value * 1000,
        cx = proj.long0 * 180/Math.PI,
        cy = proj.lat0 * 180/Math.PI;
    // scale by altitude (height)
    dw.initProj(' +h=' + projh + ' +lon_0=' + cx + ' +lat_0=' + cy);
    dw.scaleCarta(1);
    dw.scaleCarta(1/scaleheight());
    dw.draw();
    loadStarry();
  }
}
// Rotate Sphere on sides
function turn(cx, cy) {
  if (!isNaN(cx) && !isNaN(cy))
    if (dw.isSpherical()) {
      var proj = dw.initProj();
      cx += proj.long0 * 180/Math.PI;
      cy += proj.lat0 * 180/Math.PI;
      dw.initProj(' +h=' + proj.h + ' +lon_0=' + cx + ' +lat_0=' + cy);
      dw.draw();
      loadStarry();
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
  var skyproj = "+proj=ortho +units=m +a=" + proj.a + " +b=" + proj.b + " +lon_0=" + cx + " +lat_0=" + cy;
  Proj4js.defs["SKY"] = skyproj;
  var pt = dw.transformCoords("SKY", 'epsg:4326', coords);
  if (pt) {
    // backside
    pt[0] = Proj4js.common.adjust_lon((180 - (pt[0] - cx) + cx) * Math.PI/180);
    pt[1] = pt[1] * Math.PI/180;
  }
  return pt;
}
// Draw points (stars, tracs) on lonlat
function drawlonlat(pts, ftype){
  var proj = dw.initProj();
  var cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI;
  // switch to lonlat
  dw.initProj(0, '');
  for(var i in pts) {
    dw.mopt[ftype]['size'] = pts[i][1] / 8;
    dw.paintCarta(pts[i][0], ftype, pts[i][2]);
  }
  // restore spherical proj
  dw.initProj(202, ' +h=' + proj.h + ' +lon_0=' + cx + ' +lat_0=' + cy);
}
// Render sky obj
function loadStarry(){
  var proj = dw.initProj();
  var rect = dw.viewsizeOf(),
      skyRadius = 180/Math.PI * proj.h/proj.a,
      eaRadius = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)) * 180/Math.PI,
      eaRadiusM = proj.a,
      cx = proj.long0 * 180/Math.PI,
      cy = proj.lat0 * 180/Math.PI,
      gmtime = getSelTime();
  // stars
  var stars = window.STARS,
      mstars = Starry.renderSky(stars, rect, skyRadius, eaRadius, cx, cy, gmtime);
  drawlonlat(mstars, 'star');
  // sun
  var sun = Solar.loadSun(gmtime),
      msun = Starry.renderSky([sun], rect, skyRadius, eaRadius, cx, cy, gmtime);
  drawlonlat(msun, 'sun');
  // moon
  var moon = Solar.loadMoon(gmtime),
      mmoon = Starry.renderSky([moon], rect, skyRadius, eaRadius, cx, cy, gmtime);
  drawlonlat(mmoon, 'moon');
  // planets
  var planets = Solar.loadPlanets(gmtime),
      mplanets = Starry.renderSky(planets, rect, skyRadius, eaRadius, cx, cy, gmtime);
  drawlonlat(mplanets, 'planet');
  // terminator
  var term = MGeo.terminator(gmtime, proj.h/1000.0, cx, cy);
  dw.paintCarta(term, 'terminator');
  // sat.tracs
  var tledata = window.TLEDATA;
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
    var mtracs = Starry.renderSat(tracs[1], rect, eaRadius, eaRadiusM, cx, cy, gmtime),
        mcoords = MVector.rect2geo(gmtime, tracs[1][0][0], tracs[1][0][1], tracs[1][0][2]);
    drawlonlat(mtracs[1], 'sattrac');
    dw.paintCarta([mcoords], 'satsurface');
    if (!trace[i]) trace[i] = [];
    trace[i].push(mcoords);
    if (trace[i].length > 40) trace[i].shift();
    // surface trace
    for(var j in trace[i])
      dw.paintCarta([trace[i][j]], 'sattrace');
    if ((label = mtracs[0]).length) {
      // sat.fields of vision
      var pts = MGeo.circle1spheric(mcoords[0], mcoords[1], MGeo.AE * 18 * Math.PI/180, 20);
      // conv to lonlat
      for(var j in pts){
        if (pt = dw.transformCoords('epsg:4326', String(dw.project), pts[j])) {
          // backside intersect ea
          if (!pt[2])
            pt = MGeo.lineNcircle([ label[0][0][0], pt ], eaRadius);
          // triangle sector
          if (j > 0)
            drawlonlat([[[label[0][0][0], pt, pt1]]], 'sector');
          // previous pt
          var pt1 = pt;
        }
      }
      // draw sat.label
      drawlonlat([[[label[0][0][0]], 16, tracs[0]]], 'satpos');
    }
  }
}
// Calc maps scale by height above Earth
function scaleheight() {
  var proj = dw.initProj();
  var rhscale = ((proj.p15 - 1.0)/(proj.p15 + 1.0));
  // skyratio measure above 40000 km
  var etalon_p15 = (1.0 + 40000000/proj.a);
  var etalon_rhscale = ((etalon_p15 - 1.0)/(etalon_p15 + 1.0));
  return (rhscale/etalon_rhscale * rhscale/etalon_rhscale);
}
function getSelTime() {
  return [Number(document.getElementById("yy").value),
          Number(document.getElementById("mm").value),
          Number(document.getElementById("dd").value),
          Number(document.getElementById("hh").value),
          Number(document.getElementById("mi").value),
          Number(document.getElementById("ss").value)]
}
function setSelTime(interval) {
  if (interval) {
    var st = getSelTime(),
        ut = Date.UTC(st[0],st[1]-1,st[2],st[3],st[4],st[5]);
    var dt = new Date(ut + interval);
  } else
    var dt = new Date();
  document.getElementById("yy").value = dt.getUTCFullYear();
  document.getElementById("mm").value = dt.getUTCMonth()+1;
  document.getElementById("dd").value = dt.getUTCDate();
  document.getElementById("hh").value = dt.getUTCHours();
  document.getElementById("mi").value = dt.getUTCMinutes();
  document.getElementById("ss").value = dt.getUTCSeconds();
}
function setAutoTime() {
  if (window.autotime) {
    window.autotime = window.clearInterval(window.autotime);
    document.getElementById("btauto").textContent = "play";
  } else {
    window.autotime = setInterval(function() {
      setSelTime(300*1000);
      draw();
    }, 300);
    document.getElementById("btauto").textContent = "stop";
  }
}
function init() {
  var mtab = document.createElement("table");
  mtab.width = "100%";
  var row = document.createElement("tr");
  row.style.height = "1px";
  row.style.backgroundColor = "rgb(230,230,230)";
  mtab.appendChild(row);

  var col = document.createElement("td");
  col.width = "10%";
  var el = document.createElement("h2");
  el.appendChild(document.createTextNode("Starry Sky"));
  el.style.padding = "0";
  el.style.margin = "0";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "10%";
  col.align = "center";
  el = document.createElement('button');
  el.id = 'btup';
  el.onclick = function() { turn(0, -5) };
  el.title = "Turn Up";
  el.appendChild(document.createTextNode("U"));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btdown';
  el.onclick = function() { turn(0, 5) };
  el.title = "Turn Down";
  el.appendChild(document.createTextNode("D"));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btleft';
  el.onclick = function() { turn(5, 0) };
  el.title = "Turn Left";
  el.appendChild(document.createTextNode("L"));
  col.appendChild(el);
  el = document.createElement('button');
  el.id = 'btright';
  el.onclick = function() { turn(-5, 0) };
  el.title = "Turn Right";
  el.appendChild(document.createTextNode("R"));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "10%";
  col.align = "center";
  col.appendChild(document.createTextNode("height "));
  var projh = el = document.createElement("select");
  el.id = "projh";
  col.appendChild(el);
  col.appendChild(document.createTextNode(" km"));
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "20%";
  col.align = "center";
  var yy = document.createElement("select");
  yy.id = "yy";
  var mm = document.createElement("select");
  mm.id = "mm";
  var dd = document.createElement("select");
  dd.id = "dd";
  dd.style.marginRight = "0.5em";
  var hh = document.createElement("select");
  hh.id = "hh";
  var mi = document.createElement("select");
  mi.id = "mi";
  var ss = document.createElement("select");
  ss.id = "ss";
  ss.style.marginRight = "0.5em";
  el = document.createElement("button");
  el.id = "btauto";
  el.onclick = setAutoTime;
  el.title = "autoupdate by interval";
  el.appendChild(document.createTextNode("play"));
  col.appendChild(yy);
  col.appendChild(document.createTextNode("-"));
  col.appendChild(mm);
  col.appendChild(document.createTextNode("-"));
  col.appendChild(dd);
  col.appendChild(hh);
  col.appendChild(document.createTextNode(":"));
  col.appendChild(mi);
  col.appendChild(document.createTextNode(":"));
  col.appendChild(ss);
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "15%";
  col.align = "center";
  var el = document.createElement("div");
  el.id = "coords";
  col.appendChild(el);
  row.appendChild(col);

  var row = document.createElement("tr");
  var col = document.createElement("td");
  col.colSpan = "10";
  col.id = "mcol";
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  dw = new dbCarta({id:"mcol", height:col.offsetHeight});
  // change some colors
  dw.style.backgroundColor = "rgb(17,17,96)";
  dw.mopt['DotPort']['fg'] = "rgb(220,0,0)";
  dw.mopt['DotPort']['size'] = "3";
  // define new types
  dw.extend(dw.mopt, {
    "star": {cls: "Dot", fg: "rgb(255,255,255)", labelcolor: "rgb(155,155,200)"},
    "sun": {cls: "Dot", fg: "rgb(255,255,0)", labelcolor: "rgb(255,255,0)"},
    "moon": {cls: "Dot", fg: "rgb(200,200,200)", labelcolor: "rgb(200,200,200)"},
    "planet": {cls: "Dot", fg: "rgb(220,200,200)", labelcolor: "rgb(255,155,128)"},
    "satpos":  {cls: "Dot", fg: "rgb(200,200,170)", labelcolor: "rgb(200,200,170)"},
    "sattrac": {cls: "Line", fg: "rgba(200,200,170,0.1)", labelcolor: "rgb(200,200,170)"},
    "sattrace": {cls: "Dot", fg: "rgba(220,220,0,0.3)"},
    "satsurface": {cls: "Dot", fg: "rgb(0,220,0)", size: '2'},
    "sector": {cls: "Polygon", fg: "rgba(200,200,170,0.1)", bg: "rgba(200,200,170,0.1)", width: '0.1'},
    "terminator": {cls: "Polygon", fg: "rgba(0,0,0,0.3)", bg: "rgba(0,0,0,0.3)"}
  });
  // init proj
  var pov = [37.700,55.750];
  var proj = dw.initProj(202, ' +lon_0=' + pov[0] + ' +lat_0=' + pov[1]);
  var optfunc = function(v, o) {
    var el = document.createElement("option");
    el.value = v;
    el.appendChild(document.createTextNode(v));
    o.appendChild(el);
  };
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
  // curr. coords
  dw.clfunc.onmousemove = function(sd) {
    mcoord = document.getElementById("coords");
    mcoord.innerHTML = "Ra/Dec:";
    if (scoords = calcSpheric(sd, getSelTime())) {
      // in radians
      //mcoord.innerHTML = 'Ra: ' + scoords[0].toFixed(2) + ' Dec: ' + scoords[1].toFixed(2);
      // in hms, dms
      var ra = MUtil.deg2hms(scoords[0] * 180/Math.PI).join(':'),
          dec = MUtil.deg2dms(scoords[1] * 180/Math.PI).join(':');
      mcoord.innerHTML = 'Ra: ' + ra + ' Dec: ' + dec;
    }
  }
  // events
  projh.onchange = draw;
  yy.onchange = draw;
  mm.onchange = draw;
  dd.onchange = draw;
  hh.onchange = draw;
  mi.onchange = draw;
  ss.onchange = draw;
  dw.clfunc.onclick = loadStarry;
  // draw
  dw.loadCarta(window.CONTINENTS);
  dw.loadCarta(dw.createMeridians());
  dw.loadCarta([['DotPort', '1', [pov], 'Moscow']]);
  //window.CONTINENTS = undefined;
  window.trace = {};
  setSelTime();
  draw();
}
