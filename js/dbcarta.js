//
// HTML5 Canvas vector map and image viewer with Proj4js transformations.
//
// https://github.com/egaxegax/dbcartajs.git
// egax@bk.ru, 2013. b210424.
//
function dbCarta(cfg) {
  cfg = cfg||{};
  var dw = document.createElement('canvas'),
      el = document.getElementById(cfg.id);
  if (el) el.appendChild(dw);
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
    // Config
    // cfg {
    //   pid: parent id
    //   width, height: canvas size
    //   draggable: move map by cursor
    //   viewportx, viewporty: offset limits for centerCarta in degrees
    //   scalebg: bgcolor for paintBar
    //   rbar: show right bar?
    //   mapbg: bgcolor for doMap
    // }
    cfg: {
      draggable: cfg.draggable == undefined ? true : cfg.draggable,
      viewportx: cfg.viewportx || 180.0,
      viewporty: cfg.viewporty || 150.0,
      scalebg: cfg.scalebg || 'rgba(255,255,255,0.3)',
      rbar: cfg.rbar == undefined ? true : cfg.rbar,
      mapbg: cfg.mapbg || 'rgba(80,90,100,0.5)',
      mapfg: cfg.mapfg
    },
    // Base Layers
    // Options {
    //   cls: type {Image|Polygon|Line|Dot|Rect|Label}
    //   fg: : color (stroke)
    //   bg: background color (fill)
    //   dash: dash pattern [1,2]
    //   join: lineJoin
    //   cap: lineCap
    //   width: lineWidth
    //   size: arc radii or rect size
    //   scale: scalable size [0|1]
    //   labelcolor
    //   labelscale: text scalable [0|1]
    //   anchor: text pos [textAlign, textBaseline]
    //   rotate: text rotate angle
    // }
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
    // Vars store
    m: {
      delta: dw.width / 360.0,
      halfX: dw.width / 2.0,
      halfY: dw.height / 2.0,
      rotate: 0,
      scale: 1,
      offset: [0, 0],
      scaleoff: [0, 0],
      doreload: true,
      touches: []
      // marea tmap pmap bgimg mimg
    },
    // Keys store
    clfunc: {}, // user callbacks
    mflood: {}, // obj draw
    marea: {},  // area info {ftype, ftag, pts, desc} for doMap
    //
    // Proj4 projects ids defs
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
        }
      }
      return {};
    }(),
    projload: {},
    project: 0,
    // Canvas context 2d
    ctx: dw.getContext('2d'),
    //
    // Convert pixels to points
    //
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
    //
    // Init dash support
    //
    setDashLine: function(dashlist) {
      if ('setLineDash' in this.ctx)
        this.ctx.setLineDash(dashlist);
      else if ('mozDash' in this.ctx)
        this.ctx.mozDash = dashlist;
    },
    //
    // Return meridians info for loadCarta
    //
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
        lonlat.push( ['.Longtitude', [x, y].toString(), lon, x.toString(), lon[0]] );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var x = -180;
        var centerof = prev = [x, y],
            label = y;
        while (x < scale_x) {
          x += 90;
          var lat = [prev, [x, y]],
              prev = [x, y];
          lonlat.push( ['.Latitude', [x, y].toString(), lat, label, centerof] );
          label = centerof = undefined;
        }
        y += 30;
      }
      return lonlat;
    },
    // ----------------------------------
    //
    // Draw obj from mflood on Canvas
    //
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
      if (this.cfg.rbar) this.paintBar();
    },
    //
    // Rotate map on ANGLE in degrees
    //
    rotateCarta: function(angle) {
      var centerof = this.centerOf();
      this.ctx.translate(centerof[0] - this.m.offset[0], centerof[1] - this.m.offset[1]);
      this.ctx.rotate(angle * Math.PI/180);
      this.ctx.translate(-centerof[0] + this.m.offset[0], -centerof[1] + this.m.offset[1]);
      this.m.rotate += angle;
    },
    //
    // Change map scale to SCALE
    // Use twice to fix bug with labels: scaleCarta(1)->scaleCarta(SCALE)
    //
    scaleCarta: function(scale) {
      var centerof = this.centerOf();
      var ratio = scale/this.m.scale;
      var cx = centerof[0]/ratio - centerof[0],
          cy = centerof[1]/ratio - centerof[1];
      var offx = this.m.offset[0] - this.m.offset[0]/ratio,
          offy = this.m.offset[1] - this.m.offset[1]/ratio;
      this.ctx.scale(ratio, ratio);
      this.ctx.translate(cx + offx, cy + offy);
      this.m.scaleoff = [ cx, cy ];
      this.m.scale = scale;
    },
    //
    // Center map by points CX,CY. Use DOSCALE for mouse points
    //
    centerCarta: function(cx, cy, doscale) {
      var centerof = this.centerOf();
      var offx = centerof[0] - cx,
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
        this.ctx.translate(offx, offy);
        this.m.offset = [ dx, dy ];
      }
    },
    clearCarta: function() {
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.restore();
    },
    //
    // Add obj. info from DATA to mflood store.
    // DATA [[
    //   0 - ftype
    //   1 - ftag
    //   2 - coords [[x0,y0],[x1,y1],...]
    // Optional:  
    //   3 - label
    //   4 - centerof [x,y]
    //   5 - ismap 0|1
    //   6 - img (href | base64)
    // ],...]
    //
    loadCarta: function(data, dopaint) {
      for (var i=0; i<data.length; i++) {
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
    //
    // Refill obj in mflood new points from coords
    //
    reload: function(m) {
      if (m['ftype'] == '.Image' && m['coords'] && this.chkPts(m['coords'][0]) && this.chkPts(m['coords'][1])) {
        m['pts'] = [this.toPoints(m['coords'][0]), this.toPoints(m['coords'][1])];
      } else {
        m['pts'] = this.interpolateCoords(m['coords'], true, this.isSpherical() ? 10 : undefined),
        m['centerofpts'] = this.interpolateCoords([m['centerof']], true);
      }
      return m;
    },
    //
    // Find obj under mouse cursor like html MAP-AREA
    // Use ONMOUSEMOVE callback in your script to show info
    //
    doMap: function(pts) {
      if (Number(new Date()) - this.m.tmap < 100) // not so quickly
        return;
      this.m.tmap = Number(new Date());
      var fkey; // current map id
      var cx = pts[0]/this.m.scale - this.m.offset[0] - this.m.scaleoff[0],
          cy = pts[1]/this.m.scale - this.m.offset[1] - this.m.scaleoff[1];
      // points func
      var addpoints = function(self, fkey, domap) {
        var m = self.marea[fkey];
        if (!m) return;
        var mopt = self.mopt[m['ftype']];
        if (!mopt) return;
        var msize = mopt['scale'] ? (mopt['size'] || 1) : (mopt['size'] || 1) / self.m.scale,
            mwidth = (mopt['width'] || 1) / self.m.scale,
            mapfg = self.cfg.mapfg,
            mapbg = self.cfg.mapbg;
        self.ctx.beginPath();
        if (mopt['cls'] == 'Dot' && self.chkPts(m['pts'][0]))
          self.ctx.arc(m['pts'][0][0], m['pts'][0][1], msize, 0, Math.PI*2, 0);
        else if (mopt['cls'] == 'Rect' && self.chkPts(m['pts'][0]))
          self.ctx.rect(m['pts'][0][0] - msize/2.0, m['pts'][0][1] - msize/2.0, msize, msize);
        else
          for (var j=0; j<m['pts'].length; j++)
            if (self.chkPts(m['pts'][j]))
              self.ctx.lineTo(m['pts'][j][0], m['pts'][j][1]);
        if (domap != undefined && (mapfg || mapbg)) {
          self.ctx.lineWidth = mwidth;
          if (mopt['cls'] == 'Line') {
            self.ctx.strokeStyle = (domap ? mapfg || mapbg : mopt['fg']);
            self.ctx.stroke();
          } else if (mopt['cls'] == 'Dot' || mopt['cls'] == 'Rect') {
            self.ctx.strokeStyle = mopt['fg'];
            self.ctx.stroke();
            self.ctx.fillStyle = (domap ? mapbg || mapfg : mopt['bg'] || mopt['fg']);
            self.ctx.fill();
          } else {
            self.ctx.closePath();
            self.ctx.fillStyle = (domap ? mapbg || 'transparent' : mopt['bg']);
            self.ctx.fill();
            self.ctx.strokeStyle = (domap ? mapfg || 'transparent' : mopt['fg']);
            self.ctx.stroke();
          }
        }
      }
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      if (this.m.pmap) { // check prev ismap
        if (addpoints(this, this.m.pmap) || this.ctx.isPointInPath(cx, cy))
          fkey = this.m.pmap;
      } else { // check all
        for (var i in this.marea) {
          if (addpoints(this, i) || this.ctx.isPointInPath(cx, cy)) {
            fkey = i;
            break;
          }
        }
      }
      this.ctx.restore();
      if (this.m.pmap != fkey) {
        addpoints(this, fkey, true); // current
        addpoints(this, this.m.pmap, false); // restore prev
      }
      this.m.pmap = fkey;
    },
    //
    // Get snapshot or bg image for redraw
    //
    doMapImg: function() {
      if (this.m.bgimg) {
        this.m.mimg = this.m.bgimg.img; // bg img from mflood
      } else {
        this.m.mimg = new Image(); // snapshot for drag
        this.m.mimg.src = this.toDataURL();
      }
    },
    //
    // Draw Sphere radii bounds
    //
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
        this.ctx.beginPath();
        if (ry) { // ellipse
          var col_vertex = 100,
              anglestep = 2.0 * Math.PI / col_vertex;
          for (var i=0; i<=col_vertex; i++)
            this.ctx.lineTo( centerof[0] - 180/Math.PI * rx * this.m.delta * Math.cos(i * anglestep), 
                             centerof[1] + 180/Math.PI * ry * this.m.delta * Math.sin(i * anglestep) );
        } else // circle
          this.ctx.arc(centerof[0], centerof[1], 180/Math.PI * rx * this.m.delta, 0, Math.PI*2, 0);
        this.ctx.strokeStyle = this.mopt['.Arctic']['fg'];
        this.ctx.stroke();
        this.ctx.fillStyle = this.mopt['.Water']['bg'];
        this.ctx.fill();
      }
    },
    //
    // Draw curr. coords in right-bottom corner of map
    //
    paintCoords: function(coords) {
      var cw = this.width,
          ch = this.height;
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      var wcrd = this.ctx.measureText('X 0000.00 X 0000.00').width,
          hcrd = this.ctx.measureText('X').width * 2;
      this.ctx.clearRect(cw - wcrd, ch - hcrd, wcrd, hcrd);
      if (coords) {
        this.ctx.textBaseline = 'bottom';
        this.ctx.textAlign = 'end';
        this.ctx.fillStyle = 'black';
        this.ctx.fillText('X ' + coords[0].toFixed(2) + ' Y ' + coords[1].toFixed(2), cw, ch);
      }
      this.ctx.restore();
    },
    //
    // Draw right bar with scale buttons
    //
    paintBar: function() {
      var sz = this.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/4,
          w = h/2,
          tleft = cw - w - w/10,
          ttop = ch/2 - h/2,
          d = w/10; // + - size
      var cols = 20, // arc col vertex
          anglestep = Math.PI/cols;
      var mx, my; // last pos
      this.ctx.save();
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
      // right bar
      this.ctx.fillStyle = this.cfg.scalebg;
      with (this.ctx) {
        // draw scale + h -
        translate(tleft + w/2, ttop + h/4);
        beginPath();
        for (var i=-6; i<=cols+6; i++) // plus round
          lineTo(mx = (w/2 * Math.cos(i * anglestep)), my = (-w/2 * Math.sin(i * anglestep)));
        lineTo(-w/5, -d/2); lineTo(-d/2, -d/2); lineTo(-d/2, -w/5);
        lineTo(d/2, -w/5);  lineTo(d/2, -d/2);  lineTo(w/5, -d/2);
        lineTo(w/5, d/2);   lineTo(d/2, d/2);   lineTo(d/2, w/5);
        lineTo(-d/2, w/5);  lineTo(-d/2, d/2);  lineTo(-w/5, d/2);
        lineTo(-w/5, -d/2); lineTo(mx, my);
        for (var i=-6; i<=-6; i++)
          lineTo(-w/2 * Math.cos(i * anglestep), h/2 + w/2 * Math.sin(i * anglestep));
        lineTo(-w/5, h/2 - d/2); lineTo(w/5, h/2 - d/2);
        lineTo(w/5, h/2 + d/2);  lineTo(-w/5, h/2 + d/2);
        lineTo(-w/5, h/2 - d/2);
        for (var i=-6; i<=cols+6; i++) // minus round
          lineTo(mx = (-w/2 * Math.cos(i * anglestep)), my = (h/2 + w/2 * Math.sin(i * anglestep)));
        for (var i=0; i<=cols; i++) // home round
          lineTo(w/6 * Math.cos(i * 2.0 * anglestep), h/2 - h/4 + w/6 * Math.sin(i * 2.0 * anglestep));
        lineTo(mx, my);
        closePath();
        fill();
      }
      this.ctx.restore();
    },
    //
    // Draw obj with COORDS (see paintCartaPts)
    //
    paintCarta: function(coords, ftype, ftext, centerof) {
      var m = this.reload( {'coords': coords, 'centerof': centerof} );
      this.paintCartaPts(m['pts'], ftype, ftext, m['centerofpts']);
      return m;
    },
    //
    // Draw obj with POINTS, FTYPE (see mflood) and centre with FTEXT in CENTEROFPTS (see paintCarta)
    // Check points if bezierCurve as "[[1,1,'Q'],[1,2,'Q'],[2,3,'Q'],...]"
    //
    paintCartaPts: function(pts, ftype, ftext, centerofpts) {
      if (!(ftype in this.mopt))
        return;
      var m = this.mopt[ftype];
      var msize = m['scale'] ? (m['size'] || 1) : (m['size'] || 1) / this.m.scale,
          mwidth = (m['width'] || 1) / this.m.scale,
          mjoin = m['join'] || 'miter',
          mcap = m['cap'] || 'butt',
          // label defaults
          mtcolor = m['labelcolor'] || 'black',
          mtrotate = m['rotate'] || 0,
          mtalign = m['anchor'] && m['anchor'][0] || 'start',
          mtbaseline = m['anchor'] && m['anchor'][1] || 'alphabetic',
          mtfont = (m['labelscale'] ? parseInt(this.width/120) : 10) + "px sans-serif";
      this.ctx.lineWidth = mwidth;
      this.ctx.lineJoin = mjoin;
      this.ctx.lineCap = mcap;
      this.ctx.beginPath();
      this.setDashLine(m['dash'] || []);
      if (m['cls'] == 'Dot') {
        centerofpts = pts;
        for (var i=0; i<pts.length; i++)
          if (this.chkPts(pts[i])){
            this.ctx.beginPath();
            this.ctx.arc(pts[i][0], pts[i][1], msize, 0, Math.PI*2, 0);
            this.ctx.strokeStyle = m['fg'];
            this.ctx.stroke();
            this.ctx.fillStyle = m['bg'] || m['fg'];
            this.ctx.fill();
          }
      } else if (m['cls'] == 'Rect') {
        centerofpts = pts;
        if (this.chkPts(pts[0])){
          this.ctx.rect(pts[0][0] - msize/2.0, pts[0][1] - msize/2.0, msize, msize);
          this.ctx.strokeStyle = m['fg'];
          this.ctx.stroke();
          this.ctx.fillStyle = m['bg'] || m['fg'];
          this.ctx.fill();
        }
      } else {
        var mpts = [];
        for (var i=0; i<pts.length; i++) {
          if (!mpts.length && this.chkPts(pts[i]))
            this.ctx.lineTo(pts[i][0], pts[i][1]);
          if (pts[i][2] != undefined) {
            mpts.push(pts[i]);
            if (mpts.length == 3) {
              this.ctx.bezierCurveTo(mpts[0][0], mpts[0][1], mpts[1][0], mpts[1][1], mpts[2][0], mpts[2][1]);
              mpts = [];
            }
          }
        }
        if (m['cls'] == 'Polygon') {
          this.ctx.closePath();
          this.ctx.fillStyle = m['bg'];
          this.ctx.fill();
        }
        this.ctx.strokeStyle = m['fg'];
        this.ctx.stroke();
      }
      if (ftext) {
        if (centerofpts && centerofpts.length && this.chkPts(centerofpts[0])) {
          this.ctx.fillStyle = mtcolor;
          this.ctx.textAlign = mtalign;
          this.ctx.textBaseline = mtbaseline;
          if (this.ctx.font != mtfont) this.ctx.font = mtfont;
          // offset direct
          var hs = (mtalign == 'end' ? -1 : (mtalign == 'start' ? 1 : 0)),
              vs = (mtbaseline == 'bottom' ? -1 : (mtbaseline == 'top' ? 1 : 0));
          if (m['labelscale']) {
            this.ctx.fillText(ftext, centerofpts[0][0] + (msize + 3) * hs, centerofpts[0][1] + (msize + 3) * vs);
          } else {
            this.ctx.save();
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
            var mpts = [ (this.m.offset[0] + this.m.scaleoff[0] + centerofpts[0][0] + msize + 3/this.m.scale) * this.m.scale,
                         (this.m.offset[1] + this.m.scaleoff[1] + centerofpts[0][1]) * this.m.scale ];
            mpts = this.rotateCoords(mpts, -this.m.rotate, this.centerOf());
            this.ctx.translate(mpts[0], mpts[1]);
            this.ctx.rotate(mtrotate * Math.PI/180);
            this.ctx.fillText(ftext, 0, 0);
            this.ctx.restore();
          }
        }
      }
    },
    //
    // Draw image IMG if loaded with sizes in PTS
    //
    paintImage: function(img, pts) {
      if (this.chkImg(img) && pts) {
        if (this.chkPts(pts[0]) && this.chkPts(pts[1])) { // scalable
          this.ctx.drawImage(img, pts[0][0], pts[0][1], pts[1][0]-pts[0][0], pts[1][1]-pts[0][1]);
        } else if (this.chkPts(pts[0])) { // fixed size
          this.ctx.drawImage(img, pts[0][0], pts[0][1], img.width/this.m.scale, img.height/this.m.scale);
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
    //
    // Map visible borders in degrees
    //
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
    //
    // Map visible centre in degrees
    //
    viewcenterOf: function() {
      var rect = this.viewsizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    // - checks ------------------------
    //
    // Check click on right bar and do action
    //
    chkBar: function(pts, doaction) {
      if (!this.cfg.rbar) return;
      var sz = this.sizeOf(),
          cw = sz[2],
          ch = sz[3];
      var h = ch/4,
          w = h/2,
          tleft = cw - w - w/10,
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
          if (zoom < 50) zoom += 0.5;
        } else if (my > h/2 && my < h) { // minux
          if (zoom > -18) zoom -= 0.5;
        }
        zoom = (zoom > 1 ? zoom : 1/(2-zoom));
        this.scaleCarta(1); // fix labels
        this.scaleCarta(zoom);
        if (zoom == 1) {
          var centerof = this.centerOf();
          this.centerCarta(centerof[0] + this.m.offset[0] - this.m.scaleoff[0], 
                           centerof[1] + this.m.offset[1] - this.m.scaleoff[1], true);
        }
      }
    },
    //
    // Check click inside zoom box
    // Return coords of rect if not DOACTION or zoom in else
    //
    chkZoomBox: function(pts, doaction) {
      if ('.ZoomBox' in this.mflood) {
        var mpts = this.mflood['.ZoomBox']['pts'];
        var rect = [ mpts[0][0], mpts[0][1],
                     mpts[2][0], mpts[2][1] ];
        var cx = pts[0]/this.m.scale - this.m.offset[0] - this.m.scaleoff[0],
            cy = pts[1]/this.m.scale - this.m.offset[1] - this.m.scaleoff[1];
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
    //
    // Change project to NEW_PROJECT and center by visible centre
    //
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
    //
    // Change project. to PROJECT with DEFS (see Proj4js proj. definitions)
    // If no args return current projection info (Proj4js.Proj obj.)
    //
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
      if (m[2] != undefined) pts.push(m[2]); // bezier curve flag
      return pts;
    },
    //
    // Convert points to degrees
    // Use projection transform. DOTRANSFORM [0|1] and matrix transform. DONTSCALE [0|1]
    //
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
    //
    // Return spherical arc between COORD1 and COORD2 in degrees
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
    //
    // Reproject COORDS from SOURCE to DEST proj4 string definition
    //
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
    //
    // Return new COORDS rotated around Z-axis with ANGLE relative to CENTEROF
    //
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
      if (this.m.mzoom && !ev.ctrlKey) this.mouseup(ev);
      if (!this.m.mzoom && ev.ctrlKey) this.mousedown(ev);
      if (this.m.mpts) {
        if (this.cfg.draggable || this.m.mzoom) {
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
              var mpts = [ mx - this.m.offset[0] - this.m.scaleoff[0],
                           my - this.m.offset[1] - this.m.scaleoff[1] ];
              var rotate = this.m.rotate;
              this.rotateCarta(-rotate);
              mpts = this.rotateCoords(mpts, -rotate, [mpts[0] - mx, mpts[1] - my]);
              this.paintImage(this.m.mimg, [mpts, [mpts[0] + this.m.mimg.width/this.m.scale, mpts[1] + this.m.mimg.height/this.m.scale]]);
              this.rotateCarta(rotate);
            }
          }
        }
        if (this.m.mzoom) { // zoombox
          var cx = this.m.mpts[0]/this.m.scale - this.m.offset[0] - this.m.scaleoff[0],
              cy = this.m.mpts[1]/this.m.scale - this.m.offset[1] - this.m.scaleoff[1];
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
        this.clfunc.onmousemove(this, src, dst, ev);
      else
        this.paintCoords(dst);
    },
    mousedown: function(ev) {
      var spts = this.canvasXY(ev),
          pts = this.rotateCoords(spts, this.m.rotate, this.centerOf());
      if (this.m.mbar = this.chkBar(spts)) return; // if bar
      this.m.mpts = pts;
      if (this.isTurnable()) { // proj.center for spherical turn
        var proj = this.initProj();
        this.m.mcenterof = [ proj.long0 * 180/Math.PI, proj.lat0 * 180/Math.PI, proj.h ];
      } else {
        this.m.mzoom = ev.ctrlKey;
        this.doMapImg();
      }
    },
    mouseup: function(ev) {
      var spts = this.canvasXY(ev),
          pts = this.rotateCoords(spts, this.m.rotate, this.centerOf());
      if (this.m.mbar) { // bar
        this.chkBar(spts, true);
      } else if (!this.m.mmove) { // click
        if ('afterclick' in this.clfunc) {
          this.clfunc.afterclick(this, pts, ev);
          delete this.m.mimg;
          delete this.m.mpts;
          return;
        } else {
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
          this.initProj(' +h=' + this.m.mcenterof[2] + ' +lon_0=' + (this.m.mcenterof[0] + dst[0]) + ' +lat_0=' + (this.m.mcenterof[1] + dst[1]));
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
        this.clfunc.onclick(this, pts, ev);
      else // draw once
        this.draw();
    },
    // - events -----------------------------
    mousewheel: function(ev) {
      var delta = 0;
      if (ev.wheelDelta) { // WebKit / Opera / Explorer 9
        delta = ev.wheelDelta / 40;
      } else if (ev.detail) { // Firefox
        delta = -ev.detail / 3;
      }
      var zoom = (this.m.scale > 1 ? this.m.scale : 2-1/this.m.scale);
      zoom += delta * 0.5;
      zoom = (zoom > 1 ? zoom : 1/(2-zoom));
      this.scaleCarta(1); // fix labels
      this.scaleCarta(zoom);
      if ('onclick' in this.clfunc)
        this.clfunc.onclick(this);
      else // draw once
        this.draw();
    },
    touchmove: function(ev) {
      var touches = ev.changedTouches;
      if (this.m.touches.length < 2) {
        ev.preventDefault();
        this.mousemove(touches[touches.length - 1]);
      }
    },
    touchstart: function(ev) {
      this.m.dotouch = true;
      var touches = ev.changedTouches;
      for (var i=0; i<touches.length; i++)
        this.m.touches.push(touches[i]);
      if (touches.length)
        this.mousedown(touches[0]);
    },
    touchend: function(ev) {
      var touches = ev.changedTouches;
      for (var i=0; i<touches.length; i++) {
        for (var j=0; j<this.m.touches.length; j++) {
          if (this.m.touches[j].identifier == touches[i].identifier)
            this.m.touches.splice(j, 1);
        }
      }
      if (!this.m.touches.length)
        this.mouseup(touches[touches.length - 1]);
    },
    onmousemove: function(ev) {
      this.mousemove(ev);
    },
    onmousedown: function(ev) {
      if (!this.m.dotouch) this.mousedown(ev);
    },
    onmouseup: function(ev) {
      if (!this.m.dotouch) this.mouseup(ev);
    }
  });
  dw.addEventListener('onmousemove', dw.mousemove, false);
  dw.addEventListener('onmousedown', dw.mousedown, false);
  dw.addEventListener('onmouseup', dw.mouseup, false);
  dw.addEventListener('mousewheel', dw.mousewheel, false);
  dw.addEventListener('DOMMouseScroll', dw.mousewheel, false); // firefox
  dw.addEventListener('touchmove', dw.touchmove, false);
  dw.addEventListener('touchstart', dw.touchstart, false);
  dw.addEventListener('touchend', dw.touchend, false);
  dw.addEventListener("touchleave", dw.touchend, false);
  return dw;
}
