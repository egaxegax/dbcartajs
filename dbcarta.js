/*
 * dbCartajs HTML5 Canvas dymanic object map v1.3
 * It uses Proj4js transformations.
 *
 * Initially ported from Python dbCarta project http://dbcarta.googlecode.com/.
 * egax@bk.ru, 2013
 */
function dbCarta(cfg) {
  cfg = cfg||{};
  var dw = document.createElement('canvas'),
      el = document.getElementById(cfg.id);
  if (!el) el = document.body;
  el.appendChild(dw);
  // styles
  dw.style.border = 'none';
  dw.style.backgroundColor = cfg.bg||'rgb(186,196,205)';
  if (!cfg.width) dw.style.width = '100%';
  dw.width = (cfg.width ? cfg.width : dw.offsetWidth);
  dw.height = (cfg.height ? cfg.height : dw.offsetWidth / 2.0);
  dw.extend = function(dst, src) {
    if (!src) {
      src = dst;
      dst = this;
    }
    for(var prop in src)
      if(src[prop] !== undefined)
        dst[prop] = src[prop];
    return dst;
  };
  dw.extend({
    /**
     * Public
     * cfg - config {
     *   pid: parent id
     *   width, height: canvas size
     *   viewportx, viewporty: offset limits for centerCarta in degrees
     *   scalebg: bgcolor for paintScale
     * }
     */
    cfg: {
      viewportx: cfg.viewportx || 180.0,
      viewporty: cfg.viewporty || 90.0,
      scalebg: cfg.scalebg || 'rgba(255,255,255,0.3)'
    },
    /**
     * Base Layers
     * Options {
     *   cls:  type {Polygon|Line|Dot|Rect}
     *   fg: : color (stroke)
     *   bg: - background color (fill)
     *   dash: - dash patten [1,2]
     *   join: lineJoin
     *   cap: lineCap
     *   width: lineWidth
     *   size: arc radii or rect size
     *   labelcolor
     *   labelscale: text scalable [0|1]
     *   anchor: text pos [textAlign, textBaseline]
     *   rotate: text rotate
     * }
     */
    mopt: {
      '.Arctic':    {cls: 'Polygon', fg: 'rgb(210,221,195)', bg: 'rgb(210,221,195)'},
      '.Mainland':  {cls: 'Polygon', fg: 'rgb(135,159,103)', bg: 'rgb(135,159,103)'},
      '.Water':     {cls: 'Polygon', fg: 'rgb(90,140,190)', bg: 'rgb(90,140,190)'},
      '.WaterLine': {cls: 'Line', fg: 'rgb(186,196,205)'},
      '.Latitude':  {cls: 'Line', fg: 'rgb(164,164,164)', anchor: ['start', 'bottom']},
      '.Longtitude':{cls: 'Line', fg: 'rgb(164,164,164)', anchor: ['start', 'top']},
      'DotPort':    {cls: 'Dot', fg: 'rgb(240,220,0)', anchor: ['start', 'middle'], size: 2},
      'Area':       {cls: 'Polygon', fg: 'rgb(0,80,170)', bg: 'rgb(0,80,170)'},
      'Line':       {cls: 'Line', fg: 'rgb(0,130,200)'},
      'DashLine':   {cls: 'Line', fg: 'rgba(0,0,0,0.2)', dash: [1,2]}
    },
    /**
     * Private
     */
    m: {
      delta: dw.width / 360.0,
      halfX: dw.width / 2.0,
      halfY: dw.height / 2.0,
      scale: 1,
      offset: [0, 0],
      scaleoff: [0, 0],
      domap: false,
      doreload: true
    },
    /**
     * Stores
     */ 
    clfunc: {},
    mflood: {},
    proj: function(){
      if ('Proj4js' in window){
        return {
          0: '+proj=longlat',
          101: '+proj=merc +units=m',
          201: '+proj=laea +units=m',
          202: '+proj=nsper +units=m +h=40000000',
          203: '+proj=ortho +units=m'
        }
      }
      return {};
    }(),
    project: 0,
    /**
    * Convert pixels to points.
    */
    canvasXY: function(ev) {
      var cw = this.offsetWidth,
          pw = this.width,
          ch = this.offsetHeight,
          ph = this.height;
      var node = ev.target,
          pts = [ev.clientX, ev.clientY];
      pts[0] += window.pageXOffset;
      pts[1] += window.pageYOffset;
      while (node) {
         pts[0] -= node.offsetLeft - node.scrollLeft;
         pts[1] -= node.offsetTop - node.scrollTop;
         node = node.offsetParent;
      }
      return [ pts[0] / cw * pw,
               pts[1] / ch * ph ];
    },
    /**
    * Dash support.
    */
    setDashLine: function(dashlist) {
      var ctx = this.getContext('2d');
      if ('setLineDash' in ctx)
        ctx.setLineDash(dashlist);
      else if ('mozDash' in ctx)
        ctx.mozDash = dashlist;
    },
    // -----------------------------------
    /**
    * Add meridians info to mflood.
    */
    createMeridians: function () {
      var lonlat = [];
      var x = -180,
          scale_x = 180;
      while (x <= scale_x) {
        var lon = [];
        var y = -89.99;
        while (y <= 89.99) {
          lon.push([x, y]);
          y += 89.99;
        }
        lonlat.push( ['.Longtitude', [x, y].toString(), lon, x.toString(), lon[0]] );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var x = -180;
        var centerof = prev = [x, y];
        while (x < scale_x) {
          x += 90;
          var lat = [prev, [x, y]],
              prev = [x, y];
          lonlat.push( ['.Latitude', [x, y].toString(), lat, y.toString(), centerof] );
          centerof = undefined;
        }
        y += 30;
      }
      return lonlat;
    },
    // ----------------------------------
    checkScale: function(cx, cy) {
      var cw = this.width,
          ch = this.height,
          h = ch/5,
          w = h/2,
          tleft = cw - w,
          ttop = ch/2 - h/2;
      var zoom = (this.m.scale < 1 ? 2-1/this.m.scale : this.m.scale);
      if (cx > tleft && cx < cw && cy > ttop && cy < ttop + h/2.0) {
        if (zoom < 50) zoom++;
      } else if (cx > tleft && cx < cw && cy > ttop + h/2.0 && cy < ttop + h) {
        if (zoom > -18) zoom--;
      } else return;
      return (zoom > 1 ? zoom : 1/(2-zoom));
    },
    /**
    * Draw obj from mflood on Canvas.
    */
    draw: function() {
      this.clearCarta();
      this.paintBound();
      // current view
      var rect = this.viewsizeOf();
      var left = rect[0], top = rect[1],
          right = rect[2], bottom = rect[3];
      if (left < (xlimit = -179.999)) left = xlimit;
      if (top > (ylimit = (this.project == 101 ? 84 : 90))) top = ylimit;
      this.m.domap = false;
      for (var i in this.mflood) {
        var doreload, m = this.mflood[i];
        if (m['ftype'] == '.Longtitude' && m['centerof']) {
          if (this.isSpherical()) {
             if (m['centerof'][0] > -180 && m['centerof'][0] <= 180)
               m['centerof'] = [m['centerof'][0], 0];
          } else {
            m['centerof'] = [m['centerof'][0], top];
            doreload = true;
          }
        } else if (m['ftype'] == '.Latitude' && m['centerof']) {
          if (this.isSpherical())
            m['centerof'] = [0, m['centerof'][1]];
          else {
            m['centerof'] = [left, m['centerof'][1]];
            doreload = true;
          }
        }
        if (m['ismap']) 
          this.m.domap = true;
        if (this.m.doreload || doreload)
          this.reload(m);
        this.paintCartaPts(m['pts'], m['ftype'], m['label'], m['centerofpts']);
      }
      this.m.doreload = false;
      this.paintScale();
    },
    /**
    * Change project to NEW_PROJECT and center by visible centre.
    */
    changeProject: function(new_project) {
      if (this.isSpherical(new_project)) {
        var centerof = this.centerOf(),
            viewcenterof = this.viewcenterOf();
      } else {
        var centerof = [0, 0],
            viewcenterof = [0, 0];
        if ((proj = this.initProj()) !== undefined)
          centerof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI ];
        centerof = this.toPoints(centerof, false);
      }
      this.centerCarta(centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]);
      this.initProj(new_project, ' +lon_0=' + viewcenterof[0] + ' +lat_0=' + viewcenterof[1]);
    },
    /**
    * Center map by points CX,CY. Use DOSCALE for mouse points.
    */
    centerCarta: function(cx, cy, doscale) {
      var centerof = this.centerOf();
      var offx = centerof[0] - cx;
          offy = centerof[1] - cy;
      if (doscale) {
        offx /= this.m.scale;
        offy /= this.m.scale;
      }
      // translate offset
      var dx = offx + this.m.offset[0],
          dy = offy + this.m.offset[1];
      // viewport
      var vp = this.toPoints([this.cfg.viewportx, this.cfg.viewporty], false);
      if ((dx <= vp[0] - this.width/2.0 && dx >= this.width/2.0 - vp[0]) &&
          (dy <= this.height/2.0 - vp[1] && dy >= vp[1] - this.height/2.0)) {
        var ctx = this.getContext('2d');
        ctx.translate(offx, offy);
        this.m.offset = [ dx, dy ];
      }
    },
    clearCarta: function() {
      var ctx = this.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, this.width, this.height);
      ctx.restore();
    },
    /**
    * Add obj. info from DATA to mflood store.
    */
    loadCarta: function(data, dopaint) {
      for (var i in data) {
        var d = data[i],
            ftype = d[0],
            tag = d[1],
            ftag = ftype + '_' + tag;
        var coords = d[2],
            label = 3 in d ? d[3] : '',
            centerof = 4 in d ? d[4] : undefined,
            ismap = 5 in d ? d[5] : undefined;
        var m = {
          'ftype': ftype,
          'coords': coords,
          'label': label,
          'centerof': centerof,
          'ismap': ismap
        }
        if (dopaint) {
          this.m.domap = ismap;
          this.reload(m); // add points
          this.paintCartaPts(m['pts'], ftype, label, m['centerofpts']);
        }
        this.mflood[ftag] = m;
      }
    },
    /**
    * Refill obj PID in mfood new points of coords.
    */
    reload: function(m) {
      var pts = this.approxCoords(m['coords'], true, this.project ? 10 : undefined),
          centerofpts = this.approxCoords([m['centerof']], true);
      m['pts'] = pts;
      m['centerofpts'] = centerofpts;
      return m;
    },
    /**
    * Highlight obj under mouse cursor like html MAP.
    */
    doMap: function(pts) {
      if (Number(new Date()) - this.m.tmap < 100) // not so quickly
        return;
      this.m.tmap = Number(new Date());
      var pid; // current map id
      var ctx = this.getContext('2d');
      var cx = -this.m.offset[0] - this.m.scaleoff[0] + pts[0] / this.m.scale,
          cy = -this.m.offset[1] - this.m.scaleoff[1] + pts[1] / this.m.scale;
      // points func
      var addpoints = function(self, pid, domap) {
        var m = self.mflood[pid],
            mopt = self.mopt[m['ftype']],
            msize =  mopt['size']/self.m.scale,
            mwidth = (mopt['width'] || 1) / self.m.scale,
            mcolor = 'rgba(80,90,100,0.5)';
        ctx.beginPath();
        if (mopt['cls'] == 'Dot')
          ctx.arc(m['pts'][0][0], m['pts'][0][1], msize, 0, Math.PI*2, 0);
        else if (mopt['cls'] == 'Rect')
          ctx.rect(m['pts'][0][0] - msize/2.0, m['pts'][0][1] - msize/2.0, msize, msize);
        else
          for (var j in m['pts'])
            ctx.lineTo(m['pts'][j][0], m['pts'][j][1]);
        if (domap != undefined) {
          ctx.lineWidth = mwidth;
          if (mopt['cls'] == 'Line') {
            ctx.strokeStyle = (domap ? mcolor : mopt['fg']);
            ctx.stroke();            
          } else {
            ctx.strokeStyle = mopt['fg'];
            ctx.stroke();
            ctx.fillStyle = (domap ? mcolor : mopt['bg'] || mopt['fg']);
            ctx.fill();
          }
        }
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // check ismap
      for (var i in this.mflood)
        if (this.mflood[i]['ismap']) {
          addpoints(this, i);
          if (ctx.isPointInPath(cx, cy)) {
            pid = i;
            break;
          }
        }
      ctx.restore();
      if (this.m.pmap != pid) {
        // current
        if (pid)
          addpoints(this, pid, true);
        // restore prev
        if (this.m.pmap)
          addpoints(this, this.m.pmap, false);
      }
      this.m.pmap = pid;
    },
    /**
    * Draw Sphere radii bounds.
    */
    paintBound: function() {
      var ctx = this.getContext('2d');
      var centerof = this.centerOf();
      var ratio, proj = this.initProj();
      // spherical radii
      switch (String(this.project)) {
        case '201':  ratio = 2.0; break;
        case '202': ratio = Math.sqrt((proj.p15 - 1.0)/(proj.p15 + 1.0)); break;
        case '203': ratio = 1.0; break;
      }
      if (ratio) {
        ctx.beginPath();
        ctx.arc(centerof[0], centerof[1], 180/Math.PI * ratio * this.m.delta, 0, Math.PI*2, 0);
        ctx.strokeStyle = this.mopt['.Arctic']['fg'];
        ctx.stroke();
        ctx.fillStyle = this.mopt['.Water']['bg'];
        ctx.fill();
      }
    },
    /**
    * Draw curr. coords in right-bottom corner of map.
    */
    paintCoords: function(coords) {
      var ctx = this.getContext('2d');
      var cw = this.width,
          ch = this.height;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      var wcrd = ctx.measureText('X 0000.00 X 0000.00').width,
          hcrd = ctx.measureText('X').width * 2;
      ctx.clearRect(cw - wcrd, ch - hcrd, wcrd, hcrd);
      if (coords) {
        ctx.textBaseline = 'bottom';
        ctx.textAlign = 'end';
        ctx.fillStyle = 'black';
        ctx.fillText('X ' + coords[0].toFixed(2) + ' Y ' + coords[1].toFixed(2), cw, ch);
      }
      ctx.restore();
    },
    /**
    * Draw zoom scale by right side.
    */
    paintScale: function() {
      var cw = this.width,
          ch = this.height,
          h = ch/5,
          w = h/2,
          tleft = cw - w,
          ttop = ch/2 - h/2,
          d = w/18; // + - size
      var ctx = this.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.beginPath(); // + -
      ctx.translate(tleft, ttop);
      with (ctx) {
        lineTo(w, h);
        lineTo(w, 0);
        lineTo(0, 0);
        lineTo(0, h/4 - d/2);
        lineTo(w/2 - d/2, h/4 - d/2);
        lineTo(w/2 - d/2, h/8);
        lineTo(w/2 + d/2, h/8);
        lineTo(w/2 + d/2, h/4 - d/2);
        lineTo(w/2 + w/4, h/4 - d/2);
        lineTo(w/2 + w/4, h/4 + d/2);
        lineTo(w/2 + d/2, h/4 + d/2);
        lineTo(w/2 + d/2, h/4 + w/4);
        lineTo(w/2 - d/2, h/4 + w/4);
        lineTo(w/2 - d/2, h/4 + d/2);
        lineTo(w/4, h/4 + d/2);
        lineTo(w/4, h/4 - d/2);
        lineTo(0, h/4 - d/2);
        lineTo(0, h/2 + h/4 - d/2);
        lineTo(w/2 + w/4, h/2 + h/4 - d/2);
        lineTo(w/2 + w/4, h/2 + h/4 + d/2);
        lineTo(w/4, h/2 + h/4 + d/2);
        lineTo(w/4, h/2 + h/4 - d/2);
        lineTo(0, h/2 + h/4 - d/2);
        lineTo(0, h);
      }
      ctx.fillStyle = this.cfg.scalebg;
      ctx.fill();
      ctx.restore();
    },
    /**
    * Draw obj with COORDS (see paintCartaPts).
    */
    paintCarta: function(coords, ftype, ftext, centerof) {
      var m = this.reload( {'coords': coords, 'centerof': centerof} );
      this.paintCartaPts(m['pts'], ftype, ftext, m['centerofpts']);
    },
    /**
    * Draw obj with POINTS, FTYPE (see mflood) and centre with FTEXT in CENTEROFPTS (see paintCarta).
    * Check points if bezierCurve as "[[1,1,'Q'],[1,2,'Q'],[2,3,'Q'],...]".
    */
    paintCartaPts: function(pts, ftype, ftext, centerofpts) {
      if (!(ftype in this.mopt))
        return;
      var chkPts =  function(pts) { // validate pts
        return (pts && !isNaN(pts[0]) && !isNaN(pts[1]));
      }
      var m = this.mopt[ftype];
      var msize = (m['size'] || 1) / this.m.scale,
          mwidth = (m['width'] || 1) / this.m.scale,
          mjoin = m['join'] || 'miter',
          mcap = m['cap'] || 'butt',
          // label defaults
          mtcolor = m['labelcolor'] || 'black',
          mtrotate = m['rotate'] || 0,
          mtalign = m['anchor'] && m['anchor'][0] || 'start',
          mtbaseline = m['anchor'] && m['anchor'][1] || 'alphabetic',
          mtfont = (m['labelscale'] ? parseInt(this.width/125) : 10) + "px sans-serif";
      var ctx = this.getContext('2d');
      ctx.lineWidth = mwidth;
      ctx.lineJoin = mjoin;
      ctx.lineCap = mcap;
      ctx.beginPath();
      this.setDashLine(m['dash'] || []);
      if (m['cls'] == 'Dot' || m['cls'] == 'Rect') {
        if (chkPts(pts[0])){
          centerofpts = pts;
          if (m['cls'] == 'Dot')
            ctx.arc(pts[0][0], pts[0][1], msize, 0, Math.PI*2, 0);
          else
            ctx.rect(pts[0][0] - msize/2.0, pts[0][1] - msize/2.0, msize, msize);
          ctx.strokeStyle = m['fg'];
          ctx.stroke();
          ctx.fillStyle = m['bg'] || m['fg'];
          ctx.fill();
        }
      } else {
        var mpts = [];
        for (var i in pts) {
          if (!mpts.length && chkPts(pts[i]))
            ctx.lineTo(pts[i][0], pts[i][1]);
          if (pts[i][2] == 'Q') {
            mpts.push(pts[i]);
            if (mpts.length == 3) {
              ctx.bezierCurveTo(mpts[0][0], mpts[0][1], mpts[1][0], mpts[1][1], mpts[2][0], mpts[2][1]);
              mpts = [];
            }
          }
        }
        ctx.strokeStyle = m['fg'];
        ctx.stroke();
        if (m['cls'] == 'Polygon') {
          ctx.fillStyle = m['bg'];
          ctx.fill();
        }
      }
      if (ftext)
        if (centerofpts && centerofpts.length) {
          ctx.fillStyle = mtcolor;
          ctx.textAlign = mtalign;
          ctx.textBaseline = mtbaseline;
          if (ctx.font != mtfont) ctx.font = mtfont;
          // offset direct
          var hs = (mtalign == 'end' ? -1 : (mtalign == 'start' ? 1 : 0)),
              vs = (mtbaseline == 'bottom' ? -1 : (mtbaseline == 'top' ? 1 : 0));
          if (m['labelscale']) {
            ctx.fillText(ftext, centerofpts[0][0] + (msize + 3) * hs, centerofpts[0][1] + (msize + 3) * vs);
          } else {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.translate((this.m.offset[0] + this.m.scaleoff[0] + centerofpts[0][0] + msize + 3/this.m.scale) * this.m.scale,
                          (this.m.offset[1] + this.m.scaleoff[1] + centerofpts[0][1]) * this.m.scale);
            ctx.rotate(mtrotate * Math.PI/180);
            ctx.fillText(ftext, 0, 0);
            ctx.restore();
          }
        }
    },
    /**
    * Change map scale to SCALE.
    * Use twice to fix bug with labels: scaleCarta(1)->scaleCarta(SCALE)
    */
    scaleCarta: function(scale) {
      var ctx = this.getContext('2d');
      var centerof = this.centerOf();
      var ratio = scale/this.m.scale;
      ctx.scale(ratio, ratio);
      var cx = centerof[0]/ratio - centerof[0];
          cy = centerof[1]/ratio - centerof[1];
      var offx = this.m.offset[0] - this.m.offset[0]/ratio,
          offy = this.m.offset[1] - this.m.offset[1]/ratio;
      ctx.translate(cx + offx, cy + offy);
      this.m.scaleoff = [ cx, cy ];
      this.m.scale = scale;
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
              new_defs = this.proj[project] + (defs || '');
          this.m.doreload = (this.project != project) || (old_defs != new_defs); // recalc points?
          this.project = project;
          Proj4js.defs[String(project)] = new_defs;
        }
        if (String(this.project) in Proj4js.defs)
          return (new Proj4js.Proj(String(this.project)));
      }
    },
    isSpherical: function(project) {
      project = project || this.project;
      return (project > 200 && project < 300);
    },
    // - sizes ----------------------------
    sizeOf: function() {
      return [0, 0, this.width, this.height];
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
    /**
    * Map visible centre in degrees.
    */
    viewcenterOf: function() {
      var rect = this.viewsizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    // - transforms ------------------------
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
    fromPoints: function(pts, dotransform) {
      var coords = [ (pts[0] / this.m.scale - this.m.halfX / this.m.scale - this.m.offset[0]) / this.m.delta,
                    -(pts[1] / this.m.scale - this.m.halfY / this.m.scale - this.m.offset[1]) / this.m.delta ];
      if (dotransform && this.project != 0) {
        if (!(coords = this.transformCoords(String(this.project), 'epsg:4326', coords))) return;
      }
      return coords;
    },
    distance: function(coords2) {
      var x = coords2[0][0] * Math.PI/180.0,
          y = coords2[0][1] * Math.PI/180.0,
          x1 = coords2[1][0] * Math.PI/180.0,
          y1 = coords2[1][1] * Math.PI/180.0;
      return Math.acos(Math.cos(y) * Math.cos(y1) * Math.cos(x - x1) + Math.sin(y) * Math.sin(y1)) * 180.0/Math.PI;
    },
    /**
    * Approx. (and convert to points if DOPOINTS) coords with STEP (deg.).
    */
    approxCoords: function(coords, dopoints, step) {
      var i, approx_pts = [];
      for (var j in coords) {
        if (!coords[j]) {
          continue;
        } else if (!i || !step) {
          if (pts = (dopoints ? this.toPoints(coords[j], true) : coords[j]))
            approx_pts.push(pts);
        } else {
          var x = coords[i][0],
              y = coords[i][1],
              x1 = coords[j][0],
              y1 = coords[j][1];
          var d = this.distance([[x, y], [x1, y1]]),
              scalestep = 1;
          if (d > step)
            scalestep = parseInt(d / step);
          var _x = x, _y = y;
          for (var k=0; k<scalestep; k++) {
            _x += (x1 - x) / scalestep;
            _y += (y1 - y) / scalestep;
            if (pts = (dopoints ? this.toPoints([_x, _y], true) : [_x, _y]))
              approx_pts.push(pts);
          }
        }
        i = j;
      }
      return approx_pts;
    },
    transformCoords: function(sourcestr, deststr, coords) {
      if ('Proj4js' in window) {
        var sourceproj = new Proj4js.Proj(sourcestr);
        var destproj = new Proj4js.Proj(deststr);
        destproj.loadProjDefinition();
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
    // - events -----------------------------
    onmousemove: function(ev) {
      var pts = this.canvasXY(ev);
      if (this.m.mimg && this.m.mimg.height > 0 && this.m.mimg.width > 0) { // if img is loaded
        var ctx = this.getContext('2d');
        var dx = pts[0] - this.m.mpts[0],
            dy = pts[1] - this.m.mpts[1];
        var cx = -this.m.offset[0] - this.m.scaleoff[0] + dx / this.m.scale,
            cy = -this.m.offset[1] - this.m.scaleoff[1] + dy / this.m.scale;
        this.clearCarta();
        ctx.drawImage(this.m.mimg, cx, cy, this.m.mimg.width/this.m.scale, this.m.mimg.height/this.m.scale);
        this.m.mmove = true;
      } else {
        var src = this.fromPoints(pts, false);
        var dst = this.fromPoints(pts, true);
        if (this.m.domap)
          this.doMap(pts);
        this.paintCoords(dst);
        if ('onmousemove' in this.clfunc)
          this.clfunc.onmousemove(src, dst);
      }
    },
    onmousedown: function(ev) {
      if (!this.isSpherical()) {
        this.m.mpts = this.canvasXY(ev);
        // save image for drag
        this.m.mimg = new Image();
        this.m.mimg.src = this.toDataURL();
      }
    },
    onmouseup: function(ev) {
      if (!this.isSpherical()) {
        var pts = this.canvasXY(ev);
        var centerof = this.centerOf();
        this.centerCarta(
          centerof[0] - pts[0] + this.m.mpts[0],
          centerof[1] - pts[1] + this.m.mpts[1], true);
        delete this.m.mimg;
        this.draw();
      };
    },
    onclick: function(ev) {
      var scale, pts = this.canvasXY(ev);
      if (scale = this.checkScale(pts[0], pts[1])) {
        this.scaleCarta(1); // fix labels
        this.scaleCarta(scale);
      } else if (this.isSpherical()) {
        var dst = this.fromPoints(pts, true);
        if (!dst) return;
        var proj = this.initProj();
        this.initProj(' +h=' + proj.h + ' +lon_0=' + dst[0] + ' +lat_0=' + dst[1]);
      } else if (!this.m.mmove)
        this.centerCarta(pts[0], pts[1], true);
      else
        return;
      this.draw();
      if ('onclick' in this.clfunc)
        this.clfunc.onclick();
    }
  });
  return dw;
}
