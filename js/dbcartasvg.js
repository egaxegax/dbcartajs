//
// HTML5 SVG vector map and image viewer library with Proj4js transformations
//
// https://github.com/egaxegax/dbcartajs.git
// egax@bk.ru, 2015. b230303.
//
function dbCartaSvg(cfg) {
  var SVG_NS = 'http://www.w3.org/2000/svg',
      self = this;
  //
  // Set new obj key/value
  //
  self.extend = function(dst, src){
    if (!src) {
      src = dst;
      dst = self;
    }
    for(var prop in src)
      if(src[prop] !== undefined)
        dst[prop] = src[prop];
    return dst;
  };
  //
  // Set DOM obj attribute
  //
  self.attr = function(dst, src){
    if (!src) {
      src = dst;
      dst = self;
    }
    for(var prop in src)
      if (src[prop]) dst.setAttribute(prop, src[prop]);
    return dst;
  };
  //
  // Add SVG figure (polygon, path, ...)
  //
  self.append = function(parent, name, at){
    if (!at) {
      at = name;
      name = parent;
      parent = self.vp || self.root;
    }
    var el = document.createElementNS(SVG_NS, name);
    if (parent) parent.appendChild(el);
    self.attr(el, at);
    return el;
  };
  // Constructor config {
  //   id: parent id to add new
  //   svgRoot: exists SVG dom id
  //   svgViewport: exists viewport (g tag) dom id
  //   width, height: map size
  //   draggable: move map by cursor
  //   bg: map bgcolor
  //   boundbg: bgcolor for Sphere bound
  //   scalebg: bgcolor for paintBar
  //   sbar: show scale bar?
  //   sbarpos: bar pos {left|right}
  //   sbarsize: bar size {height/6}
  // }
  cfg = cfg||{};
  // Use exists svg or create new
  //   svgRoot: svg root node (not transform)
  //   svgViewport: g viewport node (rotate, scale, translate)
  if(cfg.svgRoot && cfg.svgViewport) { // use exists svg container
    self.root = cfg.svgRoot;
    self.vp = cfg.svgViewport;
    self.attr(self.root, { 
      width: cfg.width,
      height: cfg.height
    });
  } else { // add new
    var cont = document.createElement('div'),
        el = document.getElementById(cfg.id);
    if (el) el.appendChild(cont);
    self.root = self.append(cont, 'svg', {
      version: '1.1',
      xlmns: SVG_NS,
      width: cfg.width ? cfg.width : el.offsetWidth,
      height: cfg.height ? cfg.height : el.offsetWidth / 2.0
    });
    self.vp = self.append(self.root, 'g', {});
  }
  self.attr(self.vp, {
    width: self.root.getAttribute('width'),
    height: self.root.getAttribute('height')
  });
  self.root.style.backgroundColor = cfg.bg||'none';
  //
  // Add props
  //
  self.extend(self, {
    cfg: {
      draggable: cfg.draggable == undefined ? true : cfg.draggable,
      boundbg: cfg.boundbg || 'rgb(90,140,190)',
      scalebg: cfg.scalebg || 'rgba(200,200,200,0.3)',
      sbar: cfg.sbar == undefined ? true : cfg.sbar,
      sbarpos: cfg.sbarpos || 'right',
      sbarsize: cfg.sbarsize||4
    },
    // Internal vars
    m: {
      delta: self.root.getAttribute('width') / 360.0,
      halfX: self.root.getAttribute('width') / 2.0,
      halfY: self.root.getAttribute('height') / 2.0,
      rotate: 0,
      scale: 1,
      offset: [0, 0],
      touches: [],
      dtouch: 0
    },
    //
    // Proj4 defs
    //
    projlist: function(){
      if ('Proj4js' in window){
        return {
          0: '+proj=longlat',
          101: '+proj=merc +units=m',
          102: '+proj=mill +units=m',
          201: '+proj=laea +units=m',
          202: '+proj=nsper +units=m +h=40000000',
          203: '+proj=ortho +units=m',
          204: '+proj=moll +units=m'
        };
      }
      return {};
    }(),
    projload: {},
    project: 0,
    //
    // Convert pixels to points
    //
    canvasXY: function(ev) {
      var node = cont,
          pts = [ev.clientX, ev.clientY];
      if (!/WebKit/.test(navigator.userAgent)) {
        pts[0] += window.pageXOffset;
        pts[1] += window.pageYOffset;
      }
      while (node) {
         pts[0] -= node.offsetLeft - node.scrollLeft;
         pts[1] -= node.offsetTop - node.scrollTop;
         node = node.offsetParent;
      }
      return pts;
    },
    //
    // Return meridians coords
    //
    createMeridians: function() {
      var lonlat = [];
      var x = -180,
          scale_x = 180;
      while (x <= scale_x) {
        var lon = [];
        var y = -90;
        while (y <= 90) {
          lon.push([x, y]);
          y += (y == -90 || y == 85 ? 5 : 85); // mercator fix
        }
        lonlat.push( lon );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var x = -180,
            prev = [x, y];
        while (x < scale_x) {
          x += 90;
          var lat = [prev, [x,y]],
              prev = [x, y];
          lonlat.push( lat );
        }
        y += 30;
      }
      return lonlat;
    },
    // - transforms ---------------------------------
    //
    // Rotate map on ANGLE in degrees
    //
    rotateCarta: function(angle) {
      self.m.rotate += angle;
      self.scaleCarta(self.m.scale);
    },
    //
    // Change map scale to SCALE
    //
    scaleCarta: function(scale) {
      var centerof = self.centerOf();
      var cx = centerof[0]/scale - centerof[0],
          cy = centerof[1]/scale - centerof[1];
      var offx = self.m.offset[0] + cx,
          offy = self.m.offset[1] + cy;
      self.attr(self.vp, {
        transform: 'rotate(' + self.m.rotate + ' ' + centerof[0] + ' ' + centerof[1] + ') scale(' + scale + ') translate(' + offx + ',' + offy + ')'
      });
      self.m.scale = scale;
      if('clscale' in window) clscale();
    },
    //
    // Center map by points PTS
    //
    centerCarta: function(pts) {
      var scale = self.m.scale;
      var centerof = self.centerOf();
      var dx = centerof[0] - pts[0],
          dy = centerof[1] - pts[1];
      var offx = centerof[0]/scale - pts[0],
          offy = centerof[1]/scale - pts[1];
      var mx = (self.m.mpts ? self.m.mpts[0] : 0),
          my = (self.m.mpts ? self.m.mpts[1] : 1);
      offx -= mx;
      offy -= my;
      if(self.chkPts([ offx, offy ])) {
        self.attr(self.vp, {
          transform: 'rotate(' + self.m.rotate + ' ' + centerof[0] + ' ' + centerof[1] + ') scale(' + scale + ') translate(' + offx + ',' + offy + ')'
        });
        self.m.offset = [ dx - mx, dy - my ];
      }
    },
    //
    // Select EV.TARGET obj under mouse cursor like html MAP-AREA
    // with AT attributes
    //
    doMap: function(ev, at) {
      self.mousemove(ev[0] || ev);
      if (!self.m.pmap) {
        var elems = [];
        if(!ev.length) {
          ev = [ev];
        }
        if(!at.length) {
          at = [at];
        }
        for(var i=0; i<ev.length; i++) {
          var el = ev[i].target,
              ats = at[i],
              mattr = {};
          if(!el || !ats) continue;
          for (var prop in ats) { // save current
            mattr[prop] = el.getAttribute(prop);
          }
          if (!mattr['transform']) mattr['transform'] = 'scale(1)';
          self.attr(el, ats); // set new
          elems.push({
            el: el,
            attr: mattr
          });
        };
        self.m.pmap = {
          elems: elems
        };
      };
      self.m.pmap.i = 1; // set counter
    },
    // - paints ---------------------------------
    //
    // Draw Sphere bounds by radius
    //
    paintBound: function() {
      var centerof = self.centerOf();
      var rx, ry, proj = self.initProj();
      // spherical radii
      switch (String(self.project)) {
        case '201': rx = 2.0; break;
        case '202': rx = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)); break;
        case '203': rx = 1.0; break;
        case '204': ry = 1.4142135623731; rx = 2.0 * ry; break;
      }
      if (rx) {
        return self.append('ellipse', {
          cx: centerof[0],
          cy: centerof[1],
          rx: rx * self.m.delta * 180/Math.PI,
          ry: (ry || rx) * self.m.delta * 180/Math.PI,
          fill: self.cfg.boundbg
        });
      }
    },
    //
    // Draw left/right bar with scale buttons
    //
    paintBar: function() {
      if (!self.cfg.sbar) return;
      var sz = self.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/self.cfg.sbarsize,
          w = h/2,
          tleft = (self.cfg.sbarpos == 'left') ? w/10 : cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10; // + - size
      var cols = 20, // arc col vertex
          anglestep = Math.PI/cols;
      var mx, my; // last pos
      var pts = [];
      // plus round
      for (var i=-6; i<=cols+6; i++)
        pts.push(mx = (w/2 * Math.cos(i * anglestep)), my = (-w/2 * Math.sin(i * anglestep)));
      pts.push(-w/5, -d/2); pts.push(-d/2, -d/2); pts.push(-d/2, -w/5);
      pts.push(d/2, -w/5);  pts.push(d/2, -d/2);  pts.push(w/5, -d/2);
      pts.push(w/5, d/2);   pts.push(d/2, d/2);   pts.push(d/2, w/5);
      pts.push(-d/2, w/5);  pts.push(-d/2, d/2);  pts.push(-w/5, d/2);
      pts.push(-w/5, -d/2); pts.push(mx, my);
      // minus round
      for (var i=-6; i<=-6; i++)
        pts.push(-w/2 * Math.cos(i * anglestep), h/2 + w/2 * Math.sin(i * anglestep));
      pts.push(-w/5, h/2 - d/2); pts.push(w/5, h/2 - d/2);
      pts.push(w/5, h/2 + d/2);  pts.push(-w/5, h/2 + d/2);
      pts.push(-w/5, h/2 - d/2);
      for (var i=-6; i<=cols+6; i++)
        pts.push(mx = (-w/2 * Math.cos(i * anglestep)), my = (h/2 + w/2 * Math.sin(i * anglestep)));
      // home round
      for (var i=0; i<=cols; i++)
        pts.push(w/6 * Math.cos(i * 2.0 * anglestep), h/2 - h/4 + w/6 * Math.sin(i * 2.0 * anglestep));
      pts.push(mx, my);
      var dx = tleft + w/2,
          dy = ttop + h/4,
          path = 'M ' + pts[0] + ' ' + pts[1] + ' L ' + pts.join(' ') + ' z';
      return self.append(self.root, 'path', {
        fill: self.cfg.scalebg,
        d: path,
        transform: 'translate (' + dx + ',' + dy + ')'
      });
    },
    // - sizes ----------------------------
    //
    // Return sizes of map in pixels
    //
    sizeOf: function() {
      return [0, 0, self.root.getAttribute('width'), self.root.getAttribute('height')];
    },
    centerOf: function() {
      var rect = self.sizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    resize: function(w, h) {
      self.attr(self.root, {
        width: w,
        height: h
      });
      self.attr(self.vp, {
        width: w,
        height: h
      });
      self.m.delta = w / 360;
      self.m.halfX = w / 2.0;
      self.m.halfY = h / 2.0;
    },
    //
    // Return visible borders in degrees
    //
    viewsizeOf: function() {
      var rect = self.sizeOf();
      var left = self.fromPoints([rect[0], rect[1]], false),
          leftproj = self.fromPoints([rect[0], rect[1]], !self.isSpherical()),
          right = self.fromPoints([rect[2], rect[3]], false),
          rightproj = self.fromPoints([rect[2], rect[3]], !self.isSpherical());
      var mleft = left[0], mtop = leftproj[1],
          mright = right[0], mbottom = rightproj[1];
      return [mleft, mtop, mright, mbottom];
    },
    viewcenterOf: function() {
      var rect = self.viewsizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    // - checks ------------------------
    //
    // Check click on scale bar and do action
    //
    chkBar: function(pts, doaction) {
      if (!self.cfg.sbar) return;
      var sz = self.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/self.cfg.sbarsize,
          w = h/2,
          tleft = (self.cfg.sbarpos == 'left') ? w/10 : cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10;
      var mx = pts[0] - tleft,
          my = pts[1] - ttop;
      if (mx > 0 && mx < w && my > 0 && my < h) { // scale
        if (!doaction) return true;
        var zoom = (self.m.scale > 1 ? self.m.scale : 2-1/self.m.scale);
        if (my > h/2 - w/6 && my < h/2 + w/6) { // home
          return;
        } else if (my > 0 && my < h/2) { // plus
          if (zoom < 50) zoom += 0.5;
        } else if (my > h/2 && my < h) { // minux
          if (zoom > -18) zoom -= 0.5;
        }
        zoom = (zoom > 1 ? zoom : 1/(2-zoom));
        self.scaleCarta(zoom);
//        if (zoom == 1) {
//          self.centerCarta(self.centerOf());
//        }
      }
    },
    chkPts: function(pts) {
      return (pts && !isNaN(pts[0]) && !isNaN(pts[1]));
    },
    // - reproject ------------------------
    //
    // Change project to NEW_PROJECT and center by visible centre
    //
    changeProject: function(new_project) {
      // curr. centerof
      if (self.isTurnable()) {
        var proj = self.initProj();
        viewcenterof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI ];
      } else {
        var viewcenterof = self.fromPoints(self.centerOf(), true);
      }
      // new centerof
      if (self.isTurnable(new_project)) {
        self.centerCarta(self.centerOf());
        self.initProj(new_project, ' +lon_0=' + viewcenterof[0] + ' +lat_0=' + viewcenterof[1]);
      } else {
        self.initProj(new_project, ' +lon_0=0 +lat_0=0');
        var centerof = self.toPoints(viewcenterof, true);
        if (!self.chkPts(centerof)) centerof = self.centerOf();
        self.centerCarta(centerof);
      }
    },
    //
    // Change project. to PROJECT with DEFS (see Proj4js proj. definitions)
    // If no args return current projection info (Proj4js.Proj obj.)
    //
    initProj: function(project, defs) {
      if ('Proj4js' in window) {
        if (project !== undefined) {
          if (defs == undefined) {
            defs = project;
            project = self.project;
          }
          var old_defs = Proj4js.defs[String(project)],
              new_defs = self.projlist[project] + (defs || '');
          self.m.doreload = (self.project != project) || (old_defs != new_defs); // recalc points?
          self.project = project;
          Proj4js.defs[String(project)] = new_defs;
        }
        if (String(self.project) in Proj4js.defs) {
          self.projload['epsg:4326'] = new Proj4js.Proj('epsg:4326');
          self.projload[String(self.project)] = new Proj4js.Proj(String(self.project));
          return self.projload[String(self.project)];
        }
      }
    },
    isSpherical: function(project) {
      project = project || self.project;
      return (project > 200 && project < 300);
    },
    isTurnable: function(project) {
      project = project || self.project;
      return (project == 202 || project == 203);
    },
    //
    // Convert COORDS degrees to points
    // Use projection transform. DOTRANSFORM [0|1]
    //
    toPoints: function(coords, dotransform) {
      var m = coords;
      if (dotransform && self.project != 0) {
        if (!(coords = self.transformCoords('epsg:4326', String(self.project), coords))) return;
        else if (!coords[2]) return; //backside filter
      }
      var pts = [ coords[0] * self.m.delta + self.m.halfX,
                 -coords[1] * self.m.delta + self.m.halfY ];
      if (m[2]) pts.push(m[2]); // bezier flag
      return pts;
    },
    //
    // Convert PTS points to degrees
    // Use projection transform. DOTRANSFORM [0|1] and matrix transform. DONTSCALE [0|1]
    //
    fromPoints: function(pts, dotransform, dontscale) {
      if (dontscale) { // dont use matrix transformations
        var coords = [ (pts[0] - self.m.halfX) / self.m.delta,
                      -(pts[1] - self.m.halfY) / self.m.delta ];
      } else {
        var coords = [ (pts[0]/self.m.scale - self.m.halfX/self.m.scale - self.m.offset[0]) / self.m.delta,
                      -(pts[1]/self.m.scale - self.m.halfY/self.m.scale - self.m.offset[1]) / self.m.delta ];
      }
      if (dotransform && self.project != 0 && coords[0] != 0 && coords[1] != 0) {
        if (!(coords = self.transformCoords(String(self.project), 'epsg:4326', coords))) return;
      }
      return coords;
    },
    //
    // Return spherical arc between CRD1 and CRD2 in degrees
    //
    distance: function(coord1, coord2) {
      var x = coord1[0] * Math.PI/180.0,
          y = coord1[1] * Math.PI/180.0,
          x1 = coord2[0] * Math.PI/180.0,
          y1 = coord2[1] * Math.PI/180.0;
      return Math.acos(Math.cos(y) * Math.cos(y1) * Math.cos(x - x1) + Math.sin(y) * Math.sin(y1)) * 180.0/Math.PI;
    },
    //
    // Interpolate (and convert to points if DOPOINTS) coords with STEP in degrees
    //
    interpolateCoords: function(coords, dopoints, step) {
      var i, pts, interpol_pts = [];
      for (var j in coords) {
        if (!coords[j]) {
          continue;
        } else if (!i || !step) {
          if (pts = (dopoints ? self.toPoints(coords[j], true) : coords[j]))
            interpol_pts.push(pts);
        } else {
          var x = coords[i][0],
              y = coords[i][1],
              x1 = coords[j][0],
              y1 = coords[j][1];
          var d = self.distance([x, y], [x1, y1]),
              scalestep = 1;
          if (d > step)
            scalestep = parseInt(d / step);
          var _x = x, _y = y;
          for (var k=0; k<scalestep; k++) {
            _x += (x1 - x) / scalestep;
            _y += (y1 - y) / scalestep;
            if (pts = (dopoints ? self.toPoints([_x, _y], true) : [_x, _y]))
              interpol_pts.push(pts);
          }
        }
        i = j;
      }
      return interpol_pts;
    },
    //
    // Reproject COORDS from SOURCE to DEST proj4 string definition
    //
    transformCoords: function(sourcestr, deststr, coords) {
      if ('Proj4js' in window) {
        var sourceproj = self.projload[sourcestr],
            destproj = self.projload[deststr];
        if (destproj.projName == 'longlat') {
          coords[0] = sourceproj.a * coords[0] * Proj4js.common.D2R;
          coords[1] = sourceproj.a * coords[1] * Proj4js.common.D2R;
        }
        var sourcept = new Proj4js.Point(coords[0], coords[1]);
        var destpt = Proj4js.transform(sourceproj, destproj, sourcept);
        if (!isNaN(destpt.x) && !isNaN(destpt.y)) {
          if (sourceproj.projName == 'longlat') {
            return [ destpt.x / destproj.a * Proj4js.common.R2D,
                     destpt.y / destproj.a * Proj4js.common.R2D,
                     !isNaN(destpt.z) ];
          } else {
            return [ destpt.x, destpt.y ];
          }
        }
      } else
        return coords;
    },
    //
    // Return new PTS rotated around Z-axis with ANGLE relative to CENTEROF
    // used for mouse events
    //
    rotatePts: function(pts, angle, centerof) {
      var roll = angle * Math.PI/180,
          x = pts[0], y = pts[1], cx = centerof[0], cy = centerof[1],
          r = Math.sqrt((cx - x) * (cx - x) + (y - cy) * (y - cy));
      if (r > 0) {
          var a = Math.acos((cx - x) / r);
          if (y < cy) a = 2.0 * Math.PI - a;
          pts = [ cx - r * Math.cos(roll + a),
                  cy + r * Math.sin(roll + a) ];
      }
      return pts;
    },
    savetoimage: function() {
      if (self.cfg.sbar) self.cfg.sbar.setAttribute('fill', 'none');
      var xml  = new XMLSerializer().serializeToString(self.root),
          data = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml))),
          img  = new Image();
      if (self.cfg.sbar) self.cfg.sbar.setAttribute('fill', self.cfg.scalebg);
      img.src = data;
      img.onload = function() {
        var a = document.createElement('a');
        a.download = 'image.svg';
        a.href = data;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
    },
    // - handlers -----------------------------
    mousemove: function(ev) {
      var spts = self.canvasXY(ev),
          pts = self.rotatePts(spts, self.m.rotate, self.centerOf());
      if (self.m.mpts && self.cfg.draggable && !self.isTurnable()) {
        var centerof = self.centerOf();
        self.centerCarta([ centerof[0] - pts[0]/self.m.scale, centerof[1] - pts[1]/self.m.scale ]);
      }
      if (self.m.pmap) {
        if (self.m.pmap.i === 0) {
          for(var i=0; i<self.m.pmap.elems.length; i++) {
            self.attr(self.m.pmap.elems[i].el, self.m.pmap.elems[i].attr);
          }
          delete self.m.pmap;
        } else
          self.m.pmap.i = 0;
      }
    },
    mousedown: function(ev) {
      if (ev.preventDefault) ev.preventDefault(); // skip events
      var spts = self.canvasXY(ev),
          pts = self.rotatePts(spts, self.m.rotate, self.centerOf());
      if (self.m.mbar = self.chkBar(spts)) return; // if bar
      if (self.isTurnable()) { // proj.center for spherical turn
        var dst = self.fromPoints(pts, true);
        if(dst){
          var proj = self.initProj();
          self.m.mcenterof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI, proj.h ];
        }
        self.m.mpts = pts;
      } else { // for drag
        self.m.mpts = [
          pts[0]/self.m.scale - self.m.offset[0],
          pts[1]/self.m.scale - self.m.offset[1] ];
      }
    },
    mouseup: function(ev) {
      var spts = self.canvasXY(ev),
          pts = self.rotatePts(spts, self.m.rotate, self.centerOf());
      if (self.m.mbar) { // bar
        self.chkBar(spts, true);
      } else { //turn
        if (self.m.mcenterof && self.isTurnable()) {
          var centerof = self.centerOf();
          var mpts = [
            centerof[0] - pts[0] + (self.m.mpts ? self.m.mpts[0] : 0),
            centerof[1] - pts[1] + (self.m.mpts ? self.m.mpts[1] : 0) ];
          var dst = self.fromPoints(mpts, false, self.isTurnable());
          self.initProj(' +h=' + self.m.mcenterof[2] + ' +lon_0=' + (self.m.mcenterof[0] + dst[0]) + ' +lat_0=' + (self.m.mcenterof[1] + dst[1]));
          if ('draw' in window) draw();
        }
      }
      delete self.m.mpts;
      delete self.m.mcenterof;
    }
  });
  // - root events -----------------------------
  self.extend(self.root, {
    mousewheel: function(ev, dlt) {
      ev.preventDefault();
      var delta = 0;
      if (ev.wheelDelta) { // WebKit / Opera / Explorer 9
        delta = ev.wheelDelta / 150;
      } else if (ev.detail) { // Firefox
        delta = -ev.detail / 4;
      } else if (dlt) { // touched
        delta = dlt / 10;
      }
      var zoom = (self.m.scale > 1 ? self.m.scale : 2-1/self.m.scale);
      zoom += delta * 0.25;
      zoom = (zoom > 1 ? zoom : 1/(2-zoom));
      self.scaleCarta(zoom);
    },
    touchmove: function(ev) {
      ev.preventDefault(); // prevent window scroll
      var touches = ev.changedTouches;
      if (self.m.touches.length == 1) {
        self.mousemove(touches[touches.length - 1]);
      } else if (self.m.touches.length == 2) {
        for (var i=0; i<touches.length; i++) {
          for (var j=0; j<self.m.touches.length; j++) {
            if (self.m.touches[j].identifier == touches[i].identifier)
              self.m.touches[j] = touches[i];
          }
        }
        var a = self.canvasXY(self.m.touches[0]),
            b = self.canvasXY(self.m.touches[1]);
        var d = Math.sqrt( Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2) );
        if (d && self.m.dtouch) {
          self.root.mousewheel(ev, d - self.m.dtouch);
        }
        self.m.dtouch = d;
      }
    },
    touchstart: function(ev) {
      var touches = ev.changedTouches;
      for (var i=0; i<touches.length; i++)
        self.m.touches.push(touches[i]);
      if (touches.length)
        self.mousedown(touches[0]);
    },
    touchend: function(ev) { 
      var touches = ev.changedTouches;
      for (var i=0; i<touches.length; i++) {
        for (var j=0; j<self.m.touches.length; j++) {
          if (self.m.touches[j].identifier == touches[i].identifier)
            self.m.touches.splice(j, 1);
        }
      }
      if (self.m.touches.length) {
        self.m.touches = [];
        self.m.dtouch = 0;
      } else
        self.mouseup(touches[touches.length - 1]);
    },
    onmousemove: function(ev) {
      self.mousemove(ev);
    },
    onmousedown: function(ev) {
      self.mousedown(ev);
    },
    onmouseup: function(ev) {
      self.mouseup(ev);
    }
  });
  self.root.addEventListener('wheel', self.root.mousewheel, false);
  self.root.addEventListener('mousewheel', self.root.mousewheel, false);
  self.root.addEventListener('DOMMouseScroll', self.root.mousewheel, false); // firefox
  self.root.addEventListener('touchmove', self.root.touchmove, false);
  self.root.addEventListener('touchstart', self.root.touchstart, false);
  self.root.addEventListener('touchend', self.root.touchend, false);
  self.root.addEventListener('touchleave', self.root.touchend, false);

  self.cfg.sbar = self.paintBar();
  return self;
}
