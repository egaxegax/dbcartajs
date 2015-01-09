/**
 * Starry Sky 3D v1.0. 
 * It uses WebGL rendering by Three.js framework.
 * View stars, constellations, planets, sattelites bodies and orbits in motion.
 * egax@bk.ru, 2014-15.
 */
var initMap = function() {

  if (!Detector.webgl) { // require webgl support
    document.body.appendChild(Detector.getWebGLErrorMessage());
    return;
  }

  // layers
  var mopt = {
    cntlines: {text: 'Созвездия', fg: 0x28285a, opacity: 0.9, labelcolor: 0x00c800},
    stars: {text: 'Звезды', bg: 0xffffff, labelcolor: 0x8282b4},
    sun: {text: 'Солнце', bg: 0xe8c800, labelcolor: 0xffff00},
    moon: {text: 'Луна', bg: 0xd8d8d8, fg: 0x236e77, opacity: 0.8, labelcolor: 0xc8c8c8},
    planets: {text: 'Планеты', bg: 0xffc8c8, fg: 0x323c96, opacity: 0.8, labelcolor: 0xff9b80},
    earth: {text: 'Земля', bg: 0xffc8c8, fg: 0xc86400, opacity: 0.8},
    meridians: {text: 'Коорд.сетка', fg: 0x8a8a8a, opacity: 0.8},
    sattrac: {text: 'Орбиты КА', bg: 0xfa1e3c, fg: 0x646478, opacity: 0.5}
  };

  var radius = 6378.136,  // ea radius
      ae = 149597870.691, // a.e
      eaGm = 398600, // earth gravity const
      sunGm = 132712439940, // sun gravity const
      eaGmf = Math.pow(Math.sqrt(eaGm)/(2 * Math.PI), 2.0/3.0),
      sunGmf = Math.pow(Math.sqrt(sunGm)/(2 * Math.PI), 2.0/3.0);
  var moonDist = 384467; // km
  var planetsDist = {
    Mercury: 0.38,
    Venus: 0.72,
    Mars: 1.52,
    Jupiter: 5.20,
    Saturn: 9.54,
    Uranus: 19.22,
    Neptune: 30.06
  };
  var eaScale = 1.006;
  var sunScale = 109;
  var moonScale = 0.273; // ea radii
  var planetsScale = {
    Mercury: 0.382,
    Venus: 0.949,
    Mars: 0.53,
    Jupiter: 11.2,
    Saturn: 9.41,
    Uranus: 3.98,
    Neptune: 3.81
  };
  var planetsColors = {
    Mercury: 0xffffff, // white
    Venus: 0xffc8c8, // light pink
    Mars: 0xdd0000, // red
    Jupiter: 0xaabbcc, // blue
    Saturn: 0x009900, // green
    Uranus: 0x49931d, // light green
    Neptune: 0xdd00dd // pink
  };
  var satColors = {
    ISS: 0x786464, // space stations
    GEO: 0x787864, // geostationary
    GLONASS: 0x646478, // glonass nav
    GPS: 0x647864 // gps nav
  };
  var satRadius = 50;

  // list sat
  var msat = {};

  var render = function() {
    var cam = new THREE.Vector3( camera.position.x, camera.position.y, camera.position.z );
    var s = cam.length() / radius;
    // stars radii
    gstars.scale.set(ae * s, ae * s, ae * s);
    gstars.updateMatrix();
    // sat
    var gtrac = gsolar.getObjectByName('sattrac');
    if (gtrac) {
      var gsat = gtrac.getObjectByName('satpos');
      for (var i=0; i<gsat.children.length; i++) {
        gsat.children[i].scale.set(satRadius * s, satRadius * s, satRadius * s);
      }
    }
    // labels
    var mtext = cam.length().toFixed(2);
    var tcoord = document.getElementById('tcoord');
    tcoord.innerHTML = mtext;
    dw.render(scene, camera);
  };

  var addGeometry = function(coords, opt, s) {
    var pts = [];
    for (var i in coords) {
      if (isNaN(coords[i][2])) { // spherical
        var rect = MVector.spheric2rect(coords[i][0]*Math.PI/180, coords[i][1]*Math.PI/180);
      } else { // rectangular
        var rect = coords[i];
      }
      if (rect && !isNaN(rect[0]) && !isNaN(rect[1]) && !isNaN(rect[2])) {
        pts.push( new THREE.Vector3 ( rect[0], rect[1], rect[2] ) );
      }
    }
    var shape = new THREE.Shape(),
        geometry = shape.createGeometry( pts ),
        obj = new THREE.Line( geometry, new THREE.LineBasicMaterial( { opacity: opt.opacity || 1, transparent: true, color: opt.fg } ) );
    obj.scale.set( s, s, s );
    return obj;
  };

  var removeLayer = function(name, group) {
    var m = group.getObjectByName(name);
    if (m) {
      group.remove(m);
      if (m.geometry) m.geometry.dispose();
    }
  };

  var addLayer = function(name, group, mesh) {
    removeLayer(name, group);
    mesh.name = name;
    group.add(mesh);
  };

  var ellipse2poly = function(x, y, z, a, b, col_vertex){
    var anglestep = 2.0*Math.PI / col_vertex,
        pts = [];
    for (var i=0; i<=col_vertex; i++){
      pts.push([ x - a * Math.cos(i * anglestep), y,
                 z + b * Math.sin(i * anglestep) ]);
    }
    return pts;
  };

  var loadPlanet = function(gmtime, name) {
    var d = Solar.timeScale(gmtime),
        pos = Solar[name](d),
        ecl = Solar.ecl2eq(pos[0], pos[1], pos[2], d),
        eq = MVector.rect2spheric(ecl[0], ecl[1], ecl[2]), // to ra,dec
        rect = MVector.spheric2rect(eq[0], eq[1], eq[2]); // to rect
    return rect;
  };

  var layers = function() {
    var m = {};
    for (var i in mopt) if (!mopt[i]['hide']) m[i] = mopt[i];
    return m;
  };

  // Return Date
  var getSelTime = function(){
    return new Date(
      Number(document.getElementById('yy').value),
      Number(document.getElementById('mm').value)-1,
      Number(document.getElementById('dd').value),
      Number(document.getElementById('hh').value),
      Number(document.getElementById('mi').value),
      Number(document.getElementById('ss').value) );
  };

  // Convert to UTC
  var getSelUTC = function(dtm){
    return [ dtm.getUTCFullYear(),
             dtm.getUTCMonth()+1,
             dtm.getUTCDate(),
             dtm.getUTCHours(),
             dtm.getUTCMinutes(),
             dtm.getUTCSeconds() ];
  };

  // Set date/time in controls
  var setSelTime = function(interval){
    if (interval) {
      var st = getSelTime(),
          tt = st.getTime();
      var dtm = new Date(tt + interval);
    } else {
      var dtm = new Date();
//      var dtm = new Date(2010, 12-1, 22, 7, 33, 0);
    }
    document.getElementById('yy').value = dtm.getFullYear();
    document.getElementById('mm').value = dtm.getMonth()+1;
    document.getElementById('dd').value = dtm.getDate();
    document.getElementById('hh').value = dtm.getHours();
    document.getElementById('mi').value = dtm.getMinutes();
    document.getElementById('ss').value = dtm.getSeconds();
  };

  // Start/stop timer
  var setAutoTime = function() {
    if (window.autotime) {
      window.autotime = window.clearInterval(window.autotime);
      document.getElementById('btauto').textContent = '▶';
    } else {
      window.autotime = setInterval(function() {
        setSelTime(500*20);
        update();
      }, 200);
      document.getElementById('btauto').textContent = '◼';
    }
  };

  // Update map
  var update = function(mlayers) {
    mlayers = mlayers || layers();
    var gmtime = getSelUTC(getSelTime());
    var gmst = Starry.siderealTime(gmtime),
        skyRotationAngle = gmst / 12.0 * Math.PI;
    gstars.rotation.z = -skyRotationAngle;
    gsolar.rotation.z = -skyRotationAngle;

    for (var ftype in mlayers) {
      var layer = mlayers[ftype];
      var group = new THREE.Object3D();
      switch (ftype) {

      case 'earth':

        var sun = Solar.loadSun(gmtime),
            sunrect = MVector.spheric2rect(sun[0], sun[1]);
        // orbit
        var tp = Math.pow(ae / sunGmf, 1.5) * 1000,
            dtm = new Date(Number(gmtime[0]), Number(gmtime[1])-1, Number(gmtime[2]), Number(gmtime[3]), Number(gmtime[4]), Number(gmtime[5]));
        var pts = [];
        for (var j=0; j<100; j++) {
          var t = new Date(dtm.getTime() + tp * j/100),
              gmt = [t.getFullYear(), t.getMonth()+1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()],
              mcoords = Solar.loadSun(gmt),
              rect = MVector.spheric2rect(mcoords[0], mcoords[1]);
          pts.push([sunrect[0] - rect[0], sunrect[1] - rect[1], sunrect[2] - rect[2]]);
        }
        pts.push(pts[0]);
        addLayer(ftype + 'orbit', gsolar, addGeometry(pts, layer, ae));
        break;

      case 'sun':

        var sun = Solar.loadSun(gmtime),
            rect = MVector.spheric2rect(sun[0], sun[1]);
        gsolar.getObjectByName(ftype).position.set(ae * rect[0], ae * rect[1], ae * rect[2]);
        gsolar.getObjectByName('sunLight').position.set(ae * rect[0], ae * rect[1], ae * rect[2]);
        break;

      case 'moon':

        var moon = Solar.loadMoon(gmtime),
            rect = MVector.spheric2rect(moon[0], moon[1]);
        // pos
        gsolar.getObjectByName(ftype).getObjectByName(ftype).position.set(moonDist * rect[0], moonDist * rect[1], moonDist * rect[2]);
        // orbit
        var tp = Math.pow(moonDist / eaGmf, 1.5) * 1000,
            dtm = new Date(Number(gmtime[0]), Number(gmtime[1])-1, Number(gmtime[2]), Number(gmtime[3]), Number(gmtime[4]), Number(gmtime[5]));
        var pts = [];
        for (var i=0; i<100; i++) {
          var t = new Date(dtm.getTime() + tp * i/100),
              gmt = [t.getFullYear(), t.getMonth()+1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()],
              mcoords = Solar.loadMoon(gmt),
              rect = MVector.spheric2rect(mcoords[0], mcoords[1]);
          pts.push(rect);
        }
        pts.push(pts[0]);
        addLayer(ftype + 'orbit', gsolar, addGeometry(pts, layer, moonDist));
        break;

      case 'planets':

        var sun = Solar.loadSun(gmtime),
            sunrect = MVector.spheric2rect(sun[0], sun[1]);
        for (var name in planetsDist) {
          var dist = planetsDist[name] * ae,
              rect = loadPlanet(gmtime, name);
          // pos
          gsolar.getObjectByName(ftype).getObjectByName(name).position.set(dist * rect[0] + ae * sunrect[0], dist * rect[1] + ae * sunrect[1], dist * rect[2] + ae * sunrect[2]);
          // orbit
          var tp = Math.pow(dist / sunGmf, 1.5) * 1000,
              dtm = new Date(Number(gmtime[0]), Number(gmtime[1])-1, Number(gmtime[2]), Number(gmtime[3]), Number(gmtime[4]), Number(gmtime[5]));
          var pts = [];
          for (var j=0; j<100; j++) {
            var t = new Date(dtm.getTime() + tp * j/100),
                gmt = [t.getFullYear(), t.getMonth()+1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()],
                rect = loadPlanet(gmt, name);
            pts.push([dist * rect[0] + ae * sunrect[0], dist * rect[1] + ae * sunrect[1], dist * rect[2] + ae * sunrect[2]]);
          }
          pts.push(pts[0]);
          addLayer(name, group, addGeometry(pts, layer, 1));
        }
        addLayer(ftype + 'orbit', gsolar, group);
        break;

      case 'sattrac':

        var tledata = TLEDATA;
        var gorbit = new THREE.Object3D();
        var gsat = new THREE.Object3D();
        for (var name in tledata){
          for (var j in tledata[name]){
            if (!tledata[name][j])
              continue; // check data
            if (msat[name])
              continue; // skip hidden
            var satrec = satellite.twoline2satrec(tledata[name][j][1], tledata[name][j][2]);
            var  tp = 2.0 * Math.PI * 60.0/satrec.no;
            // pos
            var pv = satellite.propagate(satrec, gmtime[0], gmtime[1], gmtime[2], gmtime[3], gmtime[4], gmtime[5]);
            if (!pv['position']){
              console.log(name, j);
              continue;
            }
            var sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: (tledata[name][j][0] == 'ISS (ZARYA)' ? issTexture : satelliteTexture), color: layer.bg}));
            sprite.position.set( pv['position']['x'], pv['position']['y'], pv['position']['z'] );
            sprite.scale.set(satRadius, satRadius, satRadius);
            gsat.add(sprite);
            // orbit
            var dtm = new Date(Number(gmtime[0]), Number(gmtime[1])-1, Number(gmtime[2]), Number(gmtime[3]), Number(gmtime[4]), Number(gmtime[5]));
            var pts = [];
            for (var j=0; j<50; j++) {
              var t = new Date(dtm.getTime() + tp * 1000 * j/50),
                  gmt = [t.getFullYear(), t.getMonth()+1, t.getDate(), t.getHours(), t.getMinutes(), t.getSeconds()],
                  pv = satellite.propagate(satrec, gmt[0], gmt[1], gmt[2], gmt[3], gmt[4], gmt[5]),
                  rect = [pv['position']['x'], pv['position']['y'], pv['position']['z']];
              pts.push(rect);
            }
            pts.push(pts[0]);
            layer.fg = satColors[name];
            gorbit.add(addGeometry(pts, layer, 1));
          }
        }
        addLayer('satorbit', group, gorbit);
        addLayer('satpos', group, gsat);
        addLayer(ftype, gsolar, group);
        break;

      }
    }
    render();
  };

  // Create map
  var init = function(mlayers){
    mlayers = mlayers || layers();
    for (var ftype in mlayers) {
      var layer = mlayers[ftype];
      var group = new THREE.Object3D();
      switch (ftype) {

      case 'earth':

        // planet
        var sphere = new THREE.SphereGeometry( radius, 40, 20 );
        sphere.computeTangents();
        var mesh = new THREE.Mesh( sphere, new THREE.MeshLambertMaterial( { map: planetTexture, overdraw: 0.5 } ) );
        group.add(mesh);
        // clouds
        var materialClouds = new THREE.MeshLambertMaterial( { color: 0xffffff, map: cloudsTexture, transparent: true } );
        var mesh = new THREE.Mesh( sphere, materialClouds );
        mesh.scale.set( 1.005, 1.005, 1.005 );
        group.add(mesh);
        addLayer(ftype, gplanet, group);
        break;

      case 'meridians':

        var x = -180;
        while (x <= 180) {
          var lon = [];
          var y = -90;
          while (y <= 90) {
            lon.push([x, y]);
            y += 5;
          }
          group.add( addGeometry(lon, layer, radius * eaScale) );
          x += 30;
        }
        var y = -90;
        while (y <= 90) {
          var lat = [];
          var x = -180;
          while (x <= 180) {
            lat.push([x, y]);
            x += 5;
          }
          group.add( addGeometry(lat, layer, radius * eaScale) );
          y += 30;
        }
        addLayer(ftype, gearth, group);
        break;

      case 'stars':

        var stars = STARS,
            starsGeometry = {};
        for (var i in stars) {
          var ra = stars[i][0], dec = stars[i][1], mag = stars[i][2], hd = stars[i][3], label = stars[i][4];
          var i, rect = MVector.spheric2rect(ra, dec);
          if ( mag < 0 ) i = 0;
          else if ( mag < 1 ) i = 1;
          else if ( mag < 2 ) i = 2;
          else if ( mag < 3 ) i = 3;
          else if ( mag < 4 ) i = 4;
          else if ( mag < 5 ) i = 5;
          else i = 6;
          if (!starsGeometry[i])
            starsGeometry[String(i)] = new THREE.Geometry();
          starsGeometry[String(i)].vertices.push( new THREE.Vector3(radius * rect[0], radius * rect[1], radius * rect[2]) );
        }
        for (var i in starsGeometry) {
          var m = ([[1,3],[0.866666,3],[1,2],[0.866666,2],[0.666666,2],[1,1],[0.8666666,1]])[Number(i)];
          var material = new THREE.PointCloudMaterial( {
            map: starTexture,
            color: layer.bg * m[0],
            size: m[1]*3,
            sizeAttenuation : false,
            transparent : true
          } );
          group.add( new THREE.PointCloud( starsGeometry[String(i)], material ) );
        }
        addLayer(ftype, gstars, group);
        break;

      case 'cntlines':

        var lns = CNTLS;
        for (var i=0; i<lns.length; i++) {
          for (var j=0; j<lns[i].paths.length; j++) {
          var mcoords = [];
            for (var k=0; k<lns[i].paths[j].length; k++) {
              mcoords.push([
                lns[i].paths[j][k][0]*15,
                lns[i].paths[j][k][1]
              ]);
            }
            group.add( addGeometry(mcoords, layer, radius) );
          }
        }
        addLayer(ftype, gstars, group);
        break;

      case 'sun':

        var tDiffuse = coronaTexture;
        tDiffuse.wrapS = tDiffuse.wrapT = THREE.ClampToEdgeWrapping;
        tDiffuse.format = THREE.RGBAFormat;
        var coronaRadius = radius * sunScale * 10;
        var material = new THREE.SpriteMaterial({
          fog : false,
          map : tDiffuse,
          color : layer.bg,
          sizeAttenuation : true,
          transparent : false,
          blending : THREE.AdditiveBlending,
          useScreenCoordinates: false,
          depthWrite: false,
          depthTest: true
        });
        var sprite = new THREE.Sprite(material);
        sprite.scale.set(coronaRadius, coronaRadius, coronaRadius);
        addLayer(ftype, gsolar, sprite);
        // light
        var mesh = new THREE.PointLight( 0xffffff, 1.2 );
        addLayer('sunLight', gsolar, mesh);
        var mesh = new THREE.AmbientLight( 0x222222 );
        addLayer('ambientLight', gsolar, mesh);
        break;

      case 'moon':

        var sphere = new THREE.SphereGeometry( radius * moonScale, 40, 20 );
        var mesh = new THREE.Mesh( sphere, new THREE.MeshPhongMaterial( { color: layer.bg } ) );
        addLayer(ftype, group, mesh);
        addLayer(ftype, gsolar, group);
        break;

      case 'planets':

        for (var name in planetsScale) {
          var sphere = new THREE.SphereGeometry( radius * planetsScale[name] * 100, 40, 20 );
          var mesh = new THREE.Mesh( sphere, new THREE.MeshLambertMaterial( { color: planetsColors[name] } ) );
          addLayer(name, group, mesh);
        }
        addLayer(ftype, gsolar, group);
        break;

      }
    }
  };

  var resize = function() {
    var w = mcol.offsetWidth, h = mcol.offsetHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    dw.setSize( w, h );
    dw.domElement.style.width = '100%';
    dw.domElement.style.height = '100%';
    render();
  };

  // renderer
  var dw = new THREE.WebGLRenderer( { antialias: false } );
//  dw.setSize( 0, 0 );
  dw.setClearColor( 0x070741, 0 );

  var camera = new THREE.PerspectiveCamera( 25, 1, 50, 1e15 );
  camera.position.x = radius * 6;

  var controls = new THREE.OrbitControls( camera, dw.domElement );
  controls.addEventListener( 'change', render );
  controls.rotateSpeed = 1.0;
  controls.zoomSpeed = 5;
  controls.panSpeed = 1;
  controls.noZoom = false;
  controls.noPan = false;
  controls.staticMoving = true;
  controls.dynamicDampingFactor = 0.3;

  var scene = new THREE.Scene();

  var planetTexture   = THREE.ImageUtils.loadTexture('data/img/textures/earth_kmap.jpg');
  var cloudsTexture   = THREE.ImageUtils.loadTexture('data/img/textures/earth_clouds_1024.png');
  var coronaTexture   = THREE.ImageUtils.loadTexture('data/img/textures/corona.png');
  var starTexture = THREE.ImageUtils.loadTexture('data/img/textures/star_particle.png');
  var satelliteTexture = THREE.ImageUtils.loadTexture('data/img/textures/satellite_100x100.png');
  var issTexture = THREE.ImageUtils.loadTexture('data/img/textures/iss_100x100.png');

  // layer groups
  var gplanet = new THREE.Object3D();
  scene.add(gplanet);

  var gearth = new THREE.Object3D();
  gearth.rotation.x = -90*Math.PI/180;
  scene.add(gearth);

  var gstars = new THREE.Object3D();
  gstars.rotation.x = -90*Math.PI/180;
  scene.add(gstars);

  var gsolar = new THREE.Object3D();
  gsolar.rotation.x = -90*Math.PI/180;
  scene.add(gsolar);

  var gbao = new THREE.Object3D();
  gbao.rotation.x = -90*Math.PI/180;
  scene.add(gbao);

  // html controls

  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = '#d2e0f0';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '15%';
  col.style.whiteSpace = 'nowrap';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Звезды 3d'));
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
  col.width = '10%';
  col.align = 'center';
  var el = document.createElement('div');
  el.id = 'tcoord';
  el.style.fontSize = 'smaller';
  col.appendChild(el);
  row.appendChild(col);

  var row = document.createElement('tr');
  var mcol = document.createElement('td');
  mcol.colSpan = '50';
  mcol.style.padding = '0';
  row.appendChild(mcol);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  // add select entry
  var optfunc = function(o, k, v) {
    var el = document.createElement('option');
    el.value = k;
    el.appendChild(document.createTextNode(v || k));
    o.appendChild(el);
  };

  // list layers
  optfunc(layerlist, 'Слои...');
  layerlist.options[layerlist.selectedIndex].disabled = 'true';
  for(var i in mopt) optfunc(layerlist, i);

  layerlist.onchange = function() {
    var name = this.value;
    mopt[name]['hide'] = (!mopt[name]['hide']);
    this.options[this.selectedIndex].style.color = (mopt[name]['hide'] ? 'lightgray' : '');
    this.selectedIndex = 0;
    if (mopt[name]['hide']) {
      removeLayer(name, gplanet);
      removeLayer(name, gearth);
      removeLayer(name, gstars);
      removeLayer(name, gsolar);
      removeLayer(name + 'orbit', gsolar);
      removeLayer(name, gbao);
      render();
    } else {
      var layer = {};
      layer[name] = mopt[name];
      init(layer);
      update(layer);
    }
  };

  // list sat
  optfunc(satlist, 'Аппараты...');
  satlist.options[satlist.selectedIndex].disabled = 'true';
  for(var i in TLEDATA) optfunc(satlist, i);

  satlist.onchange = function() {
    msat[this.value] = (!msat[this.value]);
    this.options[this.selectedIndex].style.color = (msat[this.value] ? 'lightgray' : '');
    this.selectedIndex = 0;
    update();
  };

  // fill date/time
  for(i=1999; i<2050; i++) optfunc(yy, i);
  for(i=1; i<13; i++) optfunc(mm, i);
  for(i=1; i<32; i++) optfunc(dd, i);
  for(i=0; i<24; i++) optfunc(hh, i);
  for(i=0; i<60; i++) optfunc(mi, i);
  for(i=0; i<60; i++) optfunc(ss, i);

  yy.onchange = update;
  mm.onchange = update;
  dd.onchange = update;
  hh.onchange = update;
  mi.onchange = update;
  ss.onchange = update;

  // events
  mcol.appendChild(dw.domElement);
  resize();

  setSelTime();
  init();
  update();
  setAutoTime();

};
