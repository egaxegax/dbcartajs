/*
 * dbCartajs HTML5 SVG vector object map v2.0.2.
 * It uses Proj4js transformations.
 *
 * Source at https://github.com/egaxegax/dbCartajs.git.
 * egax@bk.ru, 2015.
 */
var SVG_NS = 'http://www.w3.org/2000/svg';

function dbCartaSvg(cfg) {
  var el, cont, root, vp,
      self = this;
  var extend = function(dst, src){
    if (!src) {
      src = dst;
      dst = this;
    }
    for(var prop in src)
      if(src[prop] !== undefined)
        dst[prop] = src[prop];
    return dst;
  };
  var attr = function(dst, src){
    if (!src) {
      src = dst;
      dst = this;
    }
    for(var prop in src)
      if (src[prop]) dst.setAttribute(prop, src[prop]);
    return dst;
  };
  var append = function(parent, name, at){
    if (!at) {
      at = name;
      name = parent;
      parent = vp || root;
    }
    var el = document.createElementNS(SVG_NS, name);
    if (parent) parent.appendChild(el);
    attr(el, at);
    return el;
  };
  cfg = cfg||{};
  el = document.getElementById(cfg.id);
  cont = document.createElement('div'); // container
  if (el) el.appendChild(cont);
  // root node
  root = append(cont, 'svg', {
    width: cfg.width ? cfg.width : el.offsetWidth,
    height: cfg.height ? cfg.height : el.offsetWidth / 2.0,
    version: '1.1',
    xlmns: SVG_NS
  });
  root.style.backgroundColor = cfg.bg||'rgb(186,196,205)';
  // child
  vp = append(root, 'g', {
    width: root.getAttribute('width'),
    height: root.getAttribute('height')
  });
  // add props
  extend(this, {
    /**
     * Public
     */
    root: root, // svg node
    vp: vp, // g node (rotate, scale, translate)
    extend: extend,
    attr: attr,
    append: append,
    /**
     * Config.
     * cfg {
     *   pid: parent id
     *   width, height: map size
     *   draggable: move map by cursor
     *   boundbg: bgcolor for sphere bound
     *   scalebg: bgcolor for paintBar
     *   sbar: show scale bar?
     *   sbarpos: bar pos {left|right}
     * }
     */
    cfg: {
      draggable: cfg.draggable == undefined ? true : cfg.draggable,
      boundbg: cfg.boundbg || 'rgb(90,140,190)',
      scalebg: cfg.scalebg || 'rgba(200,200,200,0.3)',
      sbar: cfg.sbar == undefined ? true : cfg.sbar,
      sbarpos: cfg.sbarpos || 'right'
    },
    /**
     * Interval vars
     */
    m: {
      delta: root.getAttribute('width') / 360.0,
      halfX: root.getAttribute('width') / 2.0,
      halfY: root.getAttribute('height') / 2.0,
      rotate: 0,
      scale: 1,
      offset: [0, 0],
      touches: []
    },
    /*
     * Proj4 defs
     */
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
        }
      }
      return {};
    }(),
    projload: {},
    project: 0,
    /**
    * Convert pixels to points.
    */
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
    /**
    * Return meridians coords.
    */
    createMeridians: function () {
      var lonlat = [];
      var x = -180,
          scale_x = 180;
      while (x <= scale_x) {
        var lon = [];
        var y = -90;
        while (y <= 90) {
          lon.push([x, y]);
          y += (y == -90 || y == 84 ? 6 : 84); // mercator fix
        }
        lonlat.push( lon );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var prev, x = -180;
        var centerof = prev = [x, y],
            label = y;
        while (x < scale_x) {
          x += 90;
          var lat = [prev, [x,y]],
              prev = [x, y];
          lonlat.push( lat );
          label = centerof = undefined;
        }
        y += 30;
      }
      return lonlat;
    },
    // - transforms ---------------------------------
    /**
     * Rotate map on ANGLE in degrees.
     */
    rotateCarta: function(angle) {
      this.m.rotate += angle;
      this.scaleCarta(this.m.scale);
    },
    /**
    * Change map scale to SCALE.
    */
    scaleCarta: function(scale) {
      var centerof = this.centerOf();
      var cx = centerof[0]/scale - centerof[0],
          cy = centerof[1]/scale - centerof[1];
      var offx = this.m.offset[0] + cx,
          offy = this.m.offset[1] + cy;
      attr(vp, {
        transform: 'rotate(' + this.m.rotate + ' ' + centerof[0] + ' ' + centerof[1] + ') scale(' + scale + ') translate(' + offx + ',' + offy + ')'
      });
      this.m.scale = scale;
    },
    /**
    * Center map by points PTS.
    */
    centerCarta: function(pts) {
      var scale = this.m.scale;
      var centerof = this.centerOf();
      var cx = centerof[0]/scale - centerof[0],
          cy = centerof[1]/scale - centerof[1];
      var offx = pts[0]/scale - this.m.mpts[0],
          offy = pts[1]/scale - this.m.mpts[1];
      var fx = offx + cx,
          fy = offy + cy;
      attr(vp, {
        transform: 'rotate(' + this.m.rotate + ' ' + centerof[0] + ' ' + centerof[1] + ') scale(' + scale + ') translate(' + fx + ',' + fy + ')'
      });
      this.m.offset = [ offx, offy ];
    },
    /**
     * Select obj under mouse cursor like html MAP-AREA.
     */
    doMap: function(ev, at) {
      this.mousemove(ev);
      if (!this.m.pmap) {
        var mattr = {};
        for (var prop in at) { // save current
          mattr[prop] = ev.target.getAttribute(prop);
        }
        if (!mattr['transform']) mattr['transform'] = 'scale(1)';
        attr(ev.target, at); // set new
        this.m.pmap = {
          ev: ev,
          attr: mattr
        };
      };
      this.m.pmap.i = 1; // set counter
    },
    /**
    * Append Sphere radii bounds.
    */
    paintBound: function() {
      var centerof = this.centerOf();
      var rx, ry, proj = this.initProj();
      // spherical radii
      switch (String(this.project)) {
        case '201': rx = 2.0; break;
        case '202': rx = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)); break;
        case '203': rx = 1.0; break;
        case '204': ry = 1.4142135623731; rx = 2.0 * ry; break;
      }
      if (rx) {
        return append('ellipse', {
          cx: centerof[0],
          cy: centerof[1],
          rx: rx * this.m.delta * 180/Math.PI,
          ry: (ry || rx) * this.m.delta * 180/Math.PI,
          fill: this.cfg.boundbg
        });
      }
    },
    /**
    * Append right bar with scale buttons.
    */
    paintBar: function() {
      if (!this.cfg.sbar) return;
      var sz = this.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/6,
          w = h/2,
          tleft = this.cfg.sbarpos == 'left' ? w/10 : cw - w - w/10,
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
      append(root, 'path', {
        fill: this.cfg.scalebg,
        d: path,
        transform: 'translate (' + dx + ',' + dy + ')'
      });
    },
    // - sizes ----------------------------
    sizeOf: function() {
      return [0, 0, root.getAttribute('width'), root.getAttribute('height')];
    },
    centerOf: function() {
      var rect = this.sizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    /**
    * Map visible borders in degrees.
    */
    viewsizeOf: function() {
      var rect = this.sizeOf();
      var left = this.fromPoints([rect[0], rect[1]], false),
          leftproj = this.fromPoints([rect[0], rect[1]], !this.isSpherical()),
          right = this.fromPoints([rect[2], rect[3]], false),
          rightproj = this.fromPoints([rect[2], rect[3]], !this.isSpherical());
      var mleft = left[0], mtop = leftproj[1],
          mright = right[0], mbottom = rightproj[1];
      return [mleft, mtop, mright, mbottom];
    },
    viewcenterOf: function() {
      var rect = this.viewsizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    // - checks ------------------------
    /**
     * Check click on right bar and do action.
     */
    chkBar: function(pts, doaction) {
      if (!this.cfg.sbar) return;
      var sz = this.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/6,
          w = h/2,
          tleft = this.cfg.sbarpos == 'left' ? w/10 : cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10;
      var mx = pts[0] - tleft,
          my = pts[1] - ttop;
      if (mx > 0 && mx < w && my > 0 && my < h) { // scale
        if (!doaction) return true;
        var zoom = (this.m.scale > 1 ? this.m.scale : 2-1/this.m.scale);
        if (my > h/2 - w/6 && my < h/2 + w/6) { // home
          zoom = 1;
        } else if (my > 0 && my < h/2) { // plus
          if (zoom < 50) zoom += 0.1;
        } else if (my > h/2 && my < h) { // minux
          if (zoom > -18) zoom -= 0.1;
        }
        zoom = (zoom > 1 ? zoom : 1/(2-zoom));
        this.scaleCarta(zoom);
        if (zoom == 1) {
          var centerof = this.centerOf();
//          this.centerCarta(centerof[0] + this.m.offset[0] - this.m.scaleoff[0], 
//                           centerof[1] + this.m.offset[1] - this.m.scaleoff[1], true);
        }
      }
    },
    chkPts: function(pts) {
      return (pts && !isNaN(pts[0]) && !isNaN(pts[1]));
    },
    // - reproject ------------------------
    /**
    * Change project to NEW_PROJECT and center by visible centre.
    */
    changeProject: function(new_project) {
      // curr. centerof
      var centerof = this.centerOf();
      if (this.isTurnable()) {
        var proj = this.initProj();
        viewcenterof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI ];
      } else {
        var viewcenterof = this.fromPoints(centerof, true);
      }
      // new centerof
      if (this.isTurnable(new_project)) {
//        this.centerCarta([centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]]);
        this.initProj(new_project, ' +lon_0=' + viewcenterof[0] + ' +lat_0=' + viewcenterof[1]);
      } else {
        this.initProj(new_project, ' +lon_0=0 +lat_0=0');
        var centerof = this.toPoints(viewcenterof, true);
        if (!this.chkPts(centerof)) centerof = [0, 0];
//        this.centerCarta([centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]]);
      }
    },
    /**
    * Change project. to PROJECT with DEFS (see Proj4js proj. definitions).
    * If no args return current projection info (Proj4js.Proj obj.).
    */
    initProj: function(project, defs) {
      if ('Proj4js' in window) {
        if (project !== undefined) {
          if (defs == undefined) {
            defs = project;
            project = this.project;
          }
          var old_defs = Proj4js.defs[String(project)],
              new_defs = this.projlist[project] + (defs || '');
          this.m.doreload = (this.project != project) || (old_defs != new_defs); // recalc points?
          this.project = project;
          Proj4js.defs[String(project)] = new_defs;
        }
        if (String(this.project) in Proj4js.defs) {
          this.projload['epsg:4326'] = new Proj4js.Proj('epsg:4326');
          this.projload[String(this.project)] = new Proj4js.Proj(String(this.project));
          return this.projload[String(this.project)];
        }
      }
    },
    isSpherical: function(project) {
      project = project || this.project;
      return (project > 200 && project < 300);
    },
    isTurnable: function(project) {
      project = project || this.project;
      return (project == 202 || project == 203);
    },
    toPoints: function(coords, dotransform) {
      var m = coords;
      if (dotransform && this.project != 0) {
        if (!(coords = this.transformCoords('epsg:4326', String(this.project), coords))) return;
        else if (!coords[2]) return; //backside filter
      }
      var pts = [ coords[0] * this.m.delta + this.m.halfX,
                 -coords[1] * this.m.delta + this.m.halfY ];
      if (m[2]) pts.push(m[2]); // bezier flag
      return pts;
    },
    /**
     * Convert points to degrees.
     * Use projection transform. DOTRANSFORM [0|1] and matrix transform. DONTSCALE [0|1].
     */
    fromPoints: function(pts, dotransform, dontscale) {
      if (dontscale) { // dont use matrix transformations
        var coords = [ (pts[0] - this.m.halfX) / this.m.delta,
                      -(pts[1] - this.m.halfY) / this.m.delta ];
      } else {
        var coords = [ (pts[0]/this.m.scale - this.m.halfX/this.m.scale - this.m.offset[0]) / this.m.delta,
                      -(pts[1]/this.m.scale - this.m.halfY/this.m.scale - this.m.offset[1]) / this.m.delta ];
      }
      if (dotransform && this.project != 0 && coords[0] != 0 && coords[1] != 0) {
        if (!(coords = this.transformCoords(String(this.project), 'epsg:4326', coords))) return;
      }
      return coords;
    },
    /**
     * Return spherical arc between CRD1 and CRD2 in degrees.
     */
    distance: function(coord1, coord2) {
      var x = coord1[0] * Math.PI/180.0,
          y = coord1[1] * Math.PI/180.0,
          x1 = coord2[0] * Math.PI/180.0,
          y1 = coord2[1] * Math.PI/180.0;
      return Math.acos(Math.cos(y) * Math.cos(y1) * Math.cos(x - x1) + Math.sin(y) * Math.sin(y1)) * 180.0/Math.PI;
    },
    /**
    * Interpolate (and convert to points if DOPOINTS) coords with STEP in degrees.
    */
    interpolateCoords: function(coords, dopoints, step) {
      var i, pts, interpol_pts = [];
      for (var j in coords) {
        if (!coords[j]) {
          continue;
        } else if (!i || !step) {
          if (pts = (dopoints ? this.toPoints(coords[j], true) : coords[j]))
            interpol_pts.push(pts);
        } else {
          var x = coords[i][0],
              y = coords[i][1],
              x1 = coords[j][0],
              y1 = coords[j][1];
          var d = this.distance([x, y], [x1, y1]),
              scalestep = 1;
          if (d > step)
            scalestep = parseInt(d / step);
          var _x = x, _y = y;
          for (var k=0; k<scalestep; k++) {
            _x += (x1 - x) / scalestep;
            _y += (y1 - y) / scalestep;
            if (pts = (dopoints ? this.toPoints([_x, _y], true) : [_x, _y]))
              interpol_pts.push(pts);
          }
        }
        i = j;
      }
      return interpol_pts;
    },
    /**
     * Reproject COORDS from SOURCE to DEST proj4 string definition.
     */
    transformCoords: function(sourcestr, deststr, coords) {
      if ('Proj4js' in window) {
        var sourceproj = this.projload[sourcestr],
            destproj = this.projload[deststr];
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
    /**
    * Return new COORDS rotated around Z-axis with ANGLE relative to CENTEROF.
    */
    rotateCoords: function(coords, angle, centerof) {
      var roll = angle * Math.PI/180,
          x = coords[0], y = coords[1], cx = centerof[0], cy = centerof[1],
          r = Math.sqrt((cx - x) * (cx - x) + (y - cy) * (y - cy));
      if (r > 0) {
          var a = Math.acos((cx - x) / r);
          if (y < cy) a = 2.0 * Math.PI - a;
          coords = [ cx - r * Math.cos(roll + a),
                     cy + r * Math.sin(roll + a) ];
      }
      return coords;
    },
    // - handlers -----------------------------
    mousemove: function(ev) {
      var spts = this.canvasXY(ev),
          pts = this.rotateCoords(spts, this.m.rotate, this.centerOf());
      if (this.m.mpts && this.cfg.draggable) {
        this.centerCarta(pts, true);
      }
      if (this.m.pmap) {
        if (this.m.pmap.i === 0) {
          attr(this.m.pmap.ev.target, this.m.pmap.attr);
          delete this.m.pmap;
        } else
          this.m.pmap.i = 0;
      }
    },
    mousedown: function(ev) {
      if (ev.preventDefault) {
        ev.preventDefault();
      }
      var spts = this.canvasXY(ev),
          pts = this.rotateCoords(spts, this.m.rotate, this.centerOf());
      if (this.m.mbar = this.chkBar(spts)) { // if bar
        return;
      } else if (this.isTurnable()) { // proj.center for spherical turn
        var dst = this.fromPoints(pts, true);
        if (dst) {
          var proj = this.initProj();
          this.initProj(' +h=' + proj.h + ' +lon_0=' + dst[0] + ' +lat_0=' + dst[1]);
        }
      } else { // for drag
        this.m.mpts = [
          pts[0]/this.m.scale - this.m.offset[0],
          pts[1]/this.m.scale - this.m.offset[1] ];
      }
    },
    mouseup: function(ev) {
      var spts = this.canvasXY(ev),
          pts = this.rotateCoords(spts, this.m.rotate, this.centerOf());
      if (this.m.mbar) { // bar
        this.chkBar(spts, true);
      }
      with (this.m) {
        delete mpts;
      }
    }
  });
  // - events -----------------------------
  extend(root, {
    mousewheel: function(ev) {
      var delta = 0;
      if (ev.wheelDelta) { // WebKit / Opera / Explorer 9
        delta = ev.wheelDelta / 40;
      } else if (ev.detail) { // Firefox
        delta = -ev.detail / 3;
      }
      var zoom = (self.m.scale > 1 ? self.m.scale : 2-1/self.m.scale);
      zoom += delta * 0.5;
      zoom = (zoom > 1 ? zoom : 1/(2-zoom));
      self.scaleCarta(zoom);
    },
    touchmove: function(ev) {
      var touches = ev.changedTouches;
      if (self.m.touches.length < 2) {
        ev.preventDefault();
        self.mousemove(touches[touches.length - 1]);
      }
    },
    touchstart: function(ev) {
      self.m.dotouch = true;
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
      if (!self.m.touches.length)
        self.mouseup(touches[touches.length - 1]);
    },
    onmousemove: function(ev) {
      self.mousemove(ev);
    },
    onmousedown: function(ev) {
      if (!self.m.dotouch) self.mousedown(ev);
    },
    onmouseup: function(ev) {
      if (!self.m.dotouch) self.mouseup(ev);
    }
  });
  root.addEventListener('mousewheel', root.mousewheel, false);
  root.addEventListener('DOMMouseScroll', root.mousewheel, false); // firefox
  root.addEventListener('touchmove', root.touchmove, false);
  root.addEventListener('touchstart', root.touchstart, false);
  root.addEventListener('touchend', root.touchend, false);
  root.addEventListener("touchleave", root.touchend, false);

  this.paintBar();
  return this;
}
