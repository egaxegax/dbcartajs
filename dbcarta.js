/*
 * dbCartajs HTML5 Canvas dymanic object map v1.7.
 * It uses Proj4js transformations.
 *
 * Source at https://github.com/egaxegax/dbCartajs.git.
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
     * Config.
     * cfg {
     *   pid: parent id
     *   width, height: canvas size
     *   viewportx, viewporty: offset limits for centerCarta in degrees
     *   scalebg: bgcolor for paintBar
     *   mapbg: bgcolor for doMap
     * }
     */
    cfg: {
      viewportx: cfg.viewportx || 180.0,
      viewporty: cfg.viewporty || 150.0,
      scalebg: cfg.scalebg || 'rgba(255,255,255,0.3)',
      mapbg: cfg.mapbg || 'rgba(80,90,100,0.5)',
      mapfg: cfg.mapfg
    },
    /**
     * Base Layers.
     * Options {
     *   cls:  type {Polygon|Line|Dot|Rect}
     *   fg: : color (stroke)
     *   bg: - background color (fill)
     *   dash: - dash pattern [1,2]
     *   join: lineJoin
     *   cap: lineCap
     *   width: lineWidth
     *   size: arc radii or rect size
     *   labelcolor
     *   labelscale: text scalable [0|1]
     *   anchor: text pos [textAlign, textBaseline]
     *   rotate: text rotate angle
     * }
     */
    mopt: {
      '.Image':     {cls: 'Image'},
      '.ZoomBox':   {cls: 'Polygon', fg: 'rgb(50,150,255)', bg: 'rgba(100,140,180,0.2)'},
      '.ZoomRect':  {cls: 'Polygon', fg: 'rgb(50,150,255)', bg: 'transparent'},
      '.Arctic':    {cls: 'Polygon', fg: 'rgb(210,221,195)', bg: 'rgb(210,221,195)'},
      '.Mainland':  {cls: 'Polygon', fg: 'rgb(135,159,103)', bg: 'rgb(135,159,103)'},
      '.Water':     {cls: 'Polygon', fg: 'rgb(90,140,190)', bg: 'rgb(90,140,190)'},
      '.WaterLine': {cls: 'Line', fg: 'rgb(186,196,205)'},
      '.Latitude':  {cls: 'Line', fg: 'rgb(164,164,164)', anchor: ['start', 'bottom']},
      '.Longtitude':{cls: 'Line', fg: 'rgb(164,164,164)', anchor: ['start', 'top']},
      'DotPort':    {cls: 'Dot', fg: 'rgb(240,220,0)', anchor: ['start', 'middle'], size: 2, labelcolor: 'rgb(255,155,128)'},
      'Area':       {cls: 'Polygon', fg: 'rgb(0,80,170)', bg: 'rgb(0,80,170)'},
      'Line':       {cls: 'Line', fg: 'rgb(0,130,200)'},
      'DashLine':   {cls: 'Line', fg: 'rgba(0,0,0,0.2)', dash: [1,2]}
    },
    /**
     * Vars store.
     * User defines {
     *   marea - area info {ftype, ftag, pts, desc} for doMap
     *   bgimg - bg image for drag (mflood ref)
     * }
     */
    m: {
      delta: dw.width / 360.0,
      halfX: dw.width / 2.0,
      halfY: dw.height / 2.0,
      scale: 1,
      offset: [0, 0],
      scaleoff: [0, 0],
      doreload: true
      // marea tmap pmap bgimg mimg
    },
    /**
     * Stores
     */
    clfunc: {}, // callbacks
    mflood: {}, // obj draw
    marea: {},  // map area
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
      var cw = this.offsetWidth,
          pw = this.width,
          ch = this.offsetHeight,
          ph = this.height;
      var node = ev.target,
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
    /**
    * Draw obj from mflood on Canvas.
    */
    draw: function(dontclear) {
      if (!dontclear) this.clearCarta();
      this.paintBound();
      // current view
      var rect = this.viewsizeOf();
      var left = rect[0], top = rect[1], right = rect[2], bottom = rect[3];
      var xlimit = -179.999, ylimit = (this.project == 101 ? 84 : 90);
      if (left < xlimit) left = xlimit;
      if (top > ylimit) top = ylimit;
      for (var i in this.mflood) {
        var m = this.mflood[i];
        if (m['ftype'] == '.Longtitude' && m['centerof']) {
          if (this.isSpherical() && m['centerof'][0] > -180 && m['centerof'][0] <= 180)
            m['centerof'] = [m['centerof'][0], 0];
          else {
            m['centerof'] = [m['centerof'][0], top];
            delete m['pts'];
          }
        } else if (m['ftype'] == '.Latitude' && m['centerof']) {
          if (this.isSpherical())
            m['centerof'] = [0, m['centerof'][1]];
          else {
            m['centerof'] = [left, m['centerof'][1]];
            delete m['pts'];
          }
        }
        if (m['ismap']) // map area info
          this.marea[i] = m;
        if (this.m.doreload || !m['pts'])
          this.reload(m);
        if (m['ftype'] == '.Image') {
          this.paintImage(m['img'], m['pts']);
        } else {
          this.paintCartaPts(m['pts'], m['ftype'], m['label'], m['centerofpts']);
        }
      }
      this.m.doreload = false;
      this.paintBar();
    },
    /**
    * Change map scale to SCALE.
    * Use twice to fix bug with labels: scaleCarta(1)->scaleCarta(SCALE)
    */
    scaleCarta: function(scale) {
      var centerof = this.centerOf();
      var ratio = scale/this.m.scale;
      var cx = centerof[0]/ratio - centerof[0],
          cy = centerof[1]/ratio - centerof[1];
      var offx = this.m.offset[0] - this.m.offset[0]/ratio,
          offy = this.m.offset[1] - this.m.offset[1]/ratio;
      var ctx = this.getContext('2d');
      ctx.scale(ratio, ratio);
      ctx.translate(cx + offx, cy + offy);
      this.m.scaleoff = [ cx, cy ];
      this.m.scale = scale;
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
    * DATA [[
    *   0 - ftype
    *   1 - ftag
    *   2 - coords [[x0,y0],[x1,y1],...]
    * Optional:  
    *   3 - label
    *   4 - centerof [x,y]
    *   5 - ismap 0|1
    *   6 - img (href | base64)
    * ],...]
    */
    loadCarta: function(data, dopaint) {
      for (var i in data) {
        var d = data[i],
            ftype = d[0],
            ftag = d[1],
            fkey = ftype + '_' + ftag;
        var coords = d[2];
        var opts = {
          'label': 3 in d ? d[3] : '',
          'centerof': 4 in d ? d[4] : undefined,
          'ismap': 5 in d ? d[5] : undefined,
          'img': 6 in d ? d[6] : undefined
        }
        var m = {
          'ftype': ftype,
          'ftag': ftag,
          'coords': coords
        }
        for (var j in opts) // optional args
          if (opts[j]) m[j] = opts[j]
        if (dopaint) {
          if (m['ismap'])
            this.marea[fkey] = m; // add area map
          this.reload(m); // add points
          if (m['ftype'] == '.Image')
            this.paintImage(m['img'], m['pts']);
          else
            this.paintCartaPts(m['pts'], m['ftype'], m['label'], m['centerofpts']);
        }
        this.mflood[fkey] = m;
      }
    },
    /**
    * Refill obj in mflood new points from coords.
    */
    reload: function(m) {
      if (m['ftype'] == '.Image') {
        m['pts'] = [];
        for (var i in m['coords'])
          m['pts'].push(this.toPoints(m['coords'][i]));
      } else {
        m['pts'] = this.interpolateCoords(m['coords'], true, this.isSpherical() ? 10 : undefined),
        m['centerofpts'] = this.interpolateCoords([m['centerof']], true);
      }
      return m;
    },
    /**
    * Find obj under mouse cursor like html MAP-AREA.
    * Use ONMOUSEMOVE callback in your script to show info.
    */
    doMap: function(pts) {
      if (Number(new Date()) - this.m.tmap < 100) // not so quickly
        return;
      this.m.tmap = Number(new Date());
      var fkey; // current map id
      var ctx = this.getContext('2d');
      var cx = -this.m.offset[0] - this.m.scaleoff[0] + pts[0] / this.m.scale,
          cy = -this.m.offset[1] - this.m.scaleoff[1] + pts[1] / this.m.scale;
      // points func
      var addpoints = function(self, fkey, domap) {
        var m = self.marea[fkey];
        if (!m) return;
        var mopt = self.mopt[m['ftype']];
        if (!mopt) return;
        var msize =  mopt['size']/self.m.scale,
            mwidth = (mopt['width'] || 1) / self.m.scale,
            mapfg = self.cfg.mapfg,
            mapbg = self.cfg.mapbg;
        ctx.beginPath();
        if (mopt['cls'] == 'Dot' && self.chkPts(m['pts'][0]))
          ctx.arc(m['pts'][0][0], m['pts'][0][1], msize, 0, Math.PI*2, 0);
        else if (mopt['cls'] == 'Rect' && self.chkPts(m['pts'][0]))
          ctx.rect(m['pts'][0][0] - msize/2.0, m['pts'][0][1] - msize/2.0, msize, msize);
        else
          for (var j in m['pts'])
            if (self.chkPts(m['pts'][j]))
              ctx.lineTo(m['pts'][j][0], m['pts'][j][1]);
        if (domap != undefined && (mapfg || mapbg)) {
          ctx.lineWidth = mwidth;
          if (mopt['cls'] == 'Line') {
            ctx.strokeStyle = (domap ? mapfg || mapbg : mopt['fg']);
            ctx.stroke();
          } else if (mopt['cls'] == 'Dot' || mopt['cls'] == 'Rect') {
            ctx.strokeStyle = mopt['fg'];
            ctx.stroke();
            ctx.fillStyle = (domap ? mapbg || mapfg : mopt['bg'] || mopt['fg']);
            ctx.fill();
          } else {
            ctx.closePath();
            ctx.fillStyle = (domap ? mapbg || 'transparent' : mopt['bg']);
            ctx.fill();
            ctx.strokeStyle = (domap ? mapfg || 'transparent' : mopt['fg']);
            ctx.stroke();
          }
        }
      }
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.m.pmap) { // check prev ismap
        if (addpoints(this, this.m.pmap) || ctx.isPointInPath(cx, cy))
          fkey = this.m.pmap;
      } else { // check all
        for (var i in this.marea) {
          if (addpoints(this, i) || ctx.isPointInPath(cx, cy)) {
            fkey = i;
            break;
          }
        }
      }
      ctx.restore();
      if (this.m.pmap != fkey) {
        addpoints(this, fkey, true); // current
        addpoints(this, this.m.pmap, false); // restore prev
      }
      this.m.pmap = fkey;
    },
    /**
     * Get snapshot or bg image for redraw.
     */
    doMapImg: function() {
      if (this.m.bgimg) {
        this.m.mimg = this.m.bgimg.img; // bg img from mflood
      } else {
        this.m.mimg = new Image(); // snapshot for drag
        this.m.mimg.src = this.toDataURL();
      }
    },
    /**
    * Draw Sphere radii bounds.
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
        var ctx = this.getContext('2d');
        ctx.beginPath();
        if (ry) { // ellipse
          var col_vertex = 100,
              anglestep = 2.0 * Math.PI / col_vertex;
          for (var i=0; i<=col_vertex; i++)
            ctx.lineTo( centerof[0] - 180/Math.PI * rx * this.m.delta * Math.cos(i * anglestep), 
                        centerof[1] + 180/Math.PI * ry * this.m.delta * Math.sin(i * anglestep) );
        } else // circle
          ctx.arc(centerof[0], centerof[1], 180/Math.PI * rx * this.m.delta, 0, Math.PI*2, 0);
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
      var cw = this.width,
          ch = this.height;
      var ctx = this.getContext('2d');
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
    * Draw right bar with moves and scale buttons.
    */
    paintBar: function() {
      var cw = this.width,
          ch = this.height,
          h = ch/6,
          w = h/2,
          tleft = cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10; // + - size
      var cols = 20, // arc col vertex
          anglestep = Math.PI/cols;
      var mx, my; // last pos
      var ctx = this.getContext('2d');
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      // right bar
      ctx.fillStyle = this.cfg.scalebg;
      with (ctx) {
        // draw scale + h -
        translate(tleft + w/2, ttop + h/4);
        beginPath();
        for (var i = -6; i <= cols + 6; i++) // plus round
          lineTo(mx = (w/2 * Math.cos(i * anglestep)), my = (-w/2 * Math.sin(i * anglestep)));
        lineTo(-w/5, -d/2); lineTo(-d/2, -d/2); lineTo(-d/2, -w/5);
        lineTo(d/2, -w/5);  lineTo(d/2, -d/2);  lineTo(w/5, -d/2);
        lineTo(w/5, d/2);   lineTo(d/2, d/2);   lineTo(d/2, w/5);
        lineTo(-d/2, w/5);  lineTo(-d/2, d/2);  lineTo(-w/5, d/2);
        lineTo(-w/5, -d/2); lineTo(mx, my);
        for (var i = -6; i <= -6; i++)
          lineTo(-w/2 * Math.cos(i * anglestep), h/2 + w/2 * Math.sin(i * anglestep));
        lineTo(-w/5, h/2 - d/2); lineTo(w/5, h/2 - d/2);
        lineTo(w/5, h/2 + d/2);  lineTo(-w/5, h/2 + d/2);
        lineTo(-w/5, h/2 - d/2);
        for (var i = -6; i <= cols + 6; i++) // minus round
          lineTo(mx = (-w/2 * Math.cos(i * anglestep)), my = (h/2 + w/2 * Math.sin(i * anglestep)));
        for (var i = 0; i <= cols; i++) // home round
          lineTo(w/6 * Math.cos(i * 2.0 * anglestep), h/2 - h/4 + w/6 * Math.sin(i * 2.0 * anglestep));
        lineTo(mx, my);
        closePath();
        fill();
        // draw moves
        translate(0, -h + h/4);
        beginPath();
        for (var i = 0; i <= cols/2.0 - cols/4.0; i++)
          lineTo(mx = (w/2 * Math.cos(i * 2.0 * anglestep)), my = (-w/2 * Math.sin(i * 2.0 * anglestep)));
        lineTo(mx, my + d); lineTo(mx + d, my + d + d); lineTo(mx - d, my + d + d); lineTo(mx, my + d); lineTo(mx, my);
        for (var i = cols/2.0 - cols/4.0; i <= cols/2.0; i++)
          lineTo(mx = (w/2 * Math.cos(i * 2.0 * anglestep)), my = (-w/2 * Math.sin(i * 2.0 * anglestep)));
        lineTo(mx + d, my); lineTo(mx + d + d, my - d); lineTo(mx + d + d, my + d); lineTo(mx + d, my); lineTo(mx, my);
        for (var i = cols/2.0; i <= cols/2.0 + cols/4.0; i++)
          lineTo(mx = (w/2 * Math.cos(i * 2.0 * anglestep)), my = (-w/2 * Math.sin(i * 2.0 * anglestep)));
        lineTo(mx, my - d); lineTo(mx - d, my - d - d); lineTo(mx + d, my - d - d); lineTo(mx, my - d); lineTo(mx, my);
        for (var i = cols/2.0 + cols/4.0; i <= cols; i++)
          lineTo(mx = (w/2 * Math.cos(i * 2.0 * anglestep)), my = (-w/2 * Math.sin(i * 2.0 * anglestep)));
        lineTo(mx - d, my); lineTo(mx - d - d, my + d); lineTo(mx - d - d, my - d); lineTo(mx - d, my); lineTo(mx, my);
        closePath();
        fill();
      }
      ctx.restore();
    },
    /**
    * Draw obj with COORDS (see paintCartaPts).
    */
    paintCarta: function(coords, ftype, ftext, centerof) {
      var m = this.reload( {'coords': coords, 'centerof': centerof} );
      this.paintCartaPts(m['pts'], ftype, ftext, m['centerofpts']);
      return m;
    },
    /**
    * Draw obj with POINTS, FTYPE (see mflood) and centre with FTEXT in CENTEROFPTS (see paintCarta).
    * Check points if bezierCurve as "[[1,1,'Q'],[1,2,'Q'],[2,3,'Q'],...]".
    */
    paintCartaPts: function(pts, ftype, ftext, centerofpts) {
      if (!(ftype in this.mopt))
        return;
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
        if (this.chkPts(pts[0])){
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
          if (!mpts.length && this.chkPts(pts[i]))
            ctx.lineTo(pts[i][0], pts[i][1]);
          if (pts[i][2] == 'Q') {
            mpts.push(pts[i]);
            if (mpts.length == 3) {
              ctx.bezierCurveTo(mpts[0][0], mpts[0][1], mpts[1][0], mpts[1][1], mpts[2][0], mpts[2][1]);
              mpts = [];
            }
          }
        }
        if (m['cls'] == 'Polygon') {
          ctx.closePath();
          ctx.fillStyle = m['bg'];
          ctx.fill();
        }
        ctx.strokeStyle = m['fg'];
        ctx.stroke();
      }
      if (ftext && centerofpts)
        if (centerofpts.length && this.chkPts(centerofpts[0])) {
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
    * Draw image IMG if loaded with sizes in PTS.
    */
    paintImage: function(img, pts) {
      if (this.chkImg(img) && pts) {
        var ctx = this.getContext('2d');
        if (this.chkPts(pts[0]) && this.chkPts(pts[1])) { // scalable
          ctx.drawImage(img, pts[0][0], pts[0][1], pts[1][0]-pts[0][0], pts[1][1]-pts[0][1]);
        } else if (this.chkPts(pts[0])) { // fixed size
          ctx.drawImage(img, pts[0][0], pts[0][1], img.width/this.m.scale, img.height/this.m.scale);
        }
      }
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
    // - checks ------------------------
    /**
     * Check click on right bar and do action.
     */
    chkBar: function(pts, doaction) {
      var cw = this.width,
          ch = this.height,
          h = ch/6,
          w = h/2,
          tleft = cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10;
      var mx = pts[0] - tleft,
          my = pts[1] - (ttop - h + h/4);
      if (mx > 0 && mx < w && my > 0 && my < h/2) { // moves
        if (!doaction) return true;
        var sx = cw/100,
            sy = ch/100, moves = [0, 0];
        if (my > 0 && my < 3*d) {
          moves = [0, sy]; // up
        } else if (mx > 0 && mx < 3*d) {
          moves = [sx, 0]; // left
        } else if (mx > w - 3*d && mx < w) {
          moves = [-sx, 0]; // right
        } else if (my > h/2 - 3*d && my < h/2) {
          moves = [0, -sy]; // down
        } else if (mx > 4*d && mx < w - 4*d && my > 4*d && my < h/2 - 4*d) { // center
          moves = [-this.m.offset[0], -this.m.offset[1]];
        }
        if (this.isTurnable()) {
          var proj = dw.initProj();
          this.initProj(' +lon_0=' + (proj.long0 * 180/Math.PI + moves[0]) + ' +lat_0=' + (proj.lat0 * 180/Math.PI + moves[1]));
        } else {
          var centerof = this.centerOf();
          this.centerCarta(centerof[0] - moves[0], centerof[1] - moves[1], true);
        }
      }
      var my = pts[1] - ttop;
      if (mx > 0 && mx < w && my > 0 && my < h) { // scale
        if (!doaction) return true;
        var zoom = (this.m.scale > 1 ? this.m.scale : 2-1/this.m.scale);
        if (my > h/2 - w/6 && my < h/2 + w/6) {
          zoom = 1; // home
        } else if (my > 0 && my < h/2) { // plus
          if (zoom < 50) zoom += 0.5;
        } else if (my > h/2 && my < h) { // minux
          if (zoom > -18) zoom -= 0.5;
        }
        zoom = (zoom > 1 ? zoom : 1/(2-zoom));
        this.scaleCarta(1); // fix labels
        this.scaleCarta(zoom);
      }
    },
    /**
     * Check click into zoom box.
     * Return coords of rect if not DOACTION or zoom in else.
     */
    chkZoomBox: function(pts, doaction) {
      if ('.ZoomBox' in this.mflood) {
        var mpts = this.mflood['.ZoomBox']['pts'];
        var rect = [ mpts[0][0], mpts[0][1],
                     mpts[2][0], mpts[2][1] ];
        var cx = -this.m.offset[0] - this.m.scaleoff[0] + pts[0] / this.m.scale,
            cy = -this.m.offset[1] - this.m.scaleoff[1] + pts[1] / this.m.scale;
        if (((cx > rect[0] && cx < rect[2]) || (cx > rect[2] && cx < rect[0])) &&
            ((cy > rect[1] && cy < rect[3]) || (cy > rect[3] && cy < rect[1]))) {
          if (!doaction) return mpts;
          var size = this.sizeOf();
          var cs = Math.max(size[2], size[3]);
          // zoombox
          var centerof = [ (rect[0] + rect[2]) / 2.0,
                           (rect[1] + rect[3]) / 2.0 ];
          var wb = Math.abs(rect[0] - rect[2]),
              hb = Math.abs(rect[1] - rect[3]),
              bs = Math.max(wb, hb);
          var zoom = Math.min(cs / bs, 50);
          this.centerCarta(centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]);
          this.scaleCarta(1);
          this.scaleCarta(zoom);
        }
      }
    },
    chkImg: function(img) {
      return (img && img.height > 0 && img.width > 0);
    },
    chkPts: function(pts) {
      return (pts && !isNaN(pts[0]) && !isNaN(pts[1]));
    },
    // - transforms ------------------------
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
        this.centerCarta(centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]);
        this.initProj(new_project, ' +lon_0=' + viewcenterof[0] + ' +lat_0=' + viewcenterof[1]);
      } else {
        this.initProj(new_project, ' +lon_0=0 +lat_0=0');
        var centerof = this.toPoints(viewcenterof, true);
        if (!this.chkPts(centerof)) centerof = [0, 0];
        this.centerCarta(centerof[0] + this.m.offset[0], centerof[1] + this.m.offset[1]);
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
        var coords = [ (pts[0] / this.m.scale - this.m.halfX / this.m.scale - this.m.offset[0]) / this.m.delta,
                      -(pts[1] / this.m.scale - this.m.halfY / this.m.scale - this.m.offset[1]) / this.m.delta ];
      }
      if (dotransform && this.project != 0 && coords[0] != 0 && coords[1] != 0) {
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
          var d = this.distance([[x, y], [x1, y1]]),
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
    // - events -----------------------------
    onmousemove: function(ev) {
      var pts = this.canvasXY(ev);
      if (this.m.mzoom && !ev.ctrlKey) this.onmouseup(ev);
      if (!this.m.mzoom && ev.ctrlKey) this.onmousedown(ev);
      if (this.m.mpts) {
        this.m.mmove = true;
        var dx = (pts[0] - this.m.mpts[0]) / this.m.scale,
            dy = (pts[1] - this.m.mpts[1]) / this.m.scale;
        var mx = dx, my = dy;
        if (this.m.mzoom) mx = my = 0;
        if (this.chkImg(this.m.mimg)) { // if img is loaded
          this.clearCarta();
          if (this.m.bgimg && this.m.bgimg.pts && this.chkPts(this.m.bgimg.pts[0]) && this.chkPts(this.m.bgimg.pts[1])) { // bg img
            this.paintImage(this.m.mimg, [[mx + this.m.bgimg.pts[0][0], my + this.m.bgimg.pts[0][1]], [mx + this.m.bgimg.pts[1][0], my + this.m.bgimg.pts[1][1]]]);
          } else { // snapshot
            var cx = -this.m.offset[0] - this.m.scaleoff[0] + mx,
                cy = -this.m.offset[1] - this.m.scaleoff[1] + my;
            this.paintImage(this.m.mimg, [[cx, cy], [cx + this.m.mimg.width/this.m.scale, cy + this.m.mimg.height/this.m.scale]]);
          }
        }
        if (this.m.mzoom) { // zoombox
          var cx = -this.m.offset[0] - this.m.scaleoff[0] + this.m.mpts[0] / this.m.scale,
              cy = -this.m.offset[1] - this.m.scaleoff[1] + this.m.mpts[1] / this.m.scale;
          this.mflood['.ZoomBox'] = {
            'ftype': '.ZoomBox',
            'pts': [[cx, cy], [cx + dx, cy], [cx + dx, cy + dy], [cx, cy + dy]]
          };
          this.paintCartaPts(this.mflood['.ZoomBox']['pts'], '.ZoomRect');
        }
      } else { // move only
        for (var i in this.marea) {
          this.doMap(pts);
          break;
        }
      }
      var src = this.fromPoints(pts, false),
          dst = this.fromPoints(pts, true);
      if ('onmousemove' in this.clfunc)
        this.clfunc.onmousemove(src, dst, ev);
      else
        this.paintCoords(dst);
    },
    onmousedown: function(ev) {
      var pts = this.canvasXY(ev);
      if (this.m.mbar = this.chkBar(pts)) // if bar
        return;
      this.m.mpts = pts;
      if (this.isTurnable()) { // proj.center for spherical turn
        var proj = this.initProj();
        this.m.mcenterof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI ];
      } else {
        this.m.mzoom = ev.ctrlKey;
        this.doMapImg();
      }
    },
    onmouseup: function(ev) {
      var pts = this.canvasXY(ev);
      if (this.m.mbar) { // bar
        this.chkBar(pts, true);
      } else if (!this.m.mmove) { // click
        if ('afterclick' in this.clfunc)
          this.clfunc.afterclick(pts, ev);
        else {
          this.chkZoomBox(pts, true);
          delete this.mflood['.ZoomBox'];
        }
      } else if (this.m.mzoom) {
      } else { //drag
        var centerof = this.centerOf();
        var mpts = [
          centerof[0] - pts[0] + this.m.mpts[0],
          centerof[1] - pts[1] + this.m.mpts[1] ];
        if (this.isTurnable()) {
          var dst = this.fromPoints(mpts);
          if (!dst) return;
          var proj = this.initProj();
          this.initProj(' +h=' + proj.h + ' +lon_0=' + (this.m.mcenterof[0] + dst[0]) + ' +lat_0=' + (this.m.mcenterof[1] + dst[1]));
        } else {
          this.centerCarta(mpts[0], mpts[1], true);
        }
      }
      with (this.m) {
        delete mimg;
        delete mmove;
        delete mzoom;
        delete mpts;
        delete mcenterof;
      }
      if ('onclick' in this.clfunc)
        this.clfunc.onclick(pts, ev);
      else // draw once
        this.draw();
    }
  });
  return dw;
}
