/**
 * dbCarta HTML5 Canvas dymanic object map.
 *
 * This is port from Python dbCarta project http://dbcarta.googlecode.com/.
 * egax@bk.ru, 2013
 */
function dbCarta(pid) {
  this.extend = function(destination, source) {
    destination = destination || {};
    if(source)
      for(var property in source)
        if(source[property] !== undefined)
          destination[property] = source[property];
    return destination;
  }
  this.initialize = function() {
    this.dw = document.createElement('canvas');
    if (!(p = document.getElementById(pid)))
      p = document.body;
    p.appendChild(this.dw);
    /* styles */
    this.dw.style.width = "100%";
    this.dw.width = cw = this.dw.offsetWidth;
    this.dw.height = cw / 2.0;
    this.dw.style.borderWidth = "0";
    this.dw.style.backgroundColor = "rgb(186,196,205)";
    /* dict of base layers */
    this.dw.mopt = {
      '.Arctic':    {'class': 'Polygon', 'fg': 'rgb(210,221,195)', 'bg': 'rgb(210,221,195)'},
      '.Mainland':  {'class': 'Polygon', 'fg': 'rgb(135,159,103)', 'bg': 'rgb(135,159,103)'},
      '.Water':     {'class': 'Polygon', 'fg': 'rgb(186,196,205)', 'bg': 'rgb(186,196,205)'},
      '.WaterLine': {'class': 'Line', 'fg': 'rgb(186,196,205)', 'smooth': 1},
      '.Latitude':  {'class': 'Line', 'fg': 'rgb(164,164,164)', 'anchor': ['start', 'bottom']},
      '.Longtitude':{'class': 'Line', 'fg': 'rgb(164,164,164)', 'anchor': ['start', 'top']},
      'DotPort':    {'class': 'Dot', 'fg': 'rgb(34,104,234)', 'anchor': ['start', 'middle'], 'size': 1},
      'Area':       {'class': 'Polygon', 'fg': 'rgb(0,130,200)', 'bg': 'rgb(0,130,200)'},
      'Line':       {'class': 'Line', 'fg': 'rgb(0,130,200)'},
      'Figure':     {'class': 'Line', 'fg': 'rgb(0,130,200)', 'width': 2},
      'CurrFigure': {'class': 'Line', 'fg': 'rgb(0,130,200)', 'anchor': 'ne', 'width': 2},
      'UserLine':   {'class': 'Line', 'fg': 'rgb(0,0,0)', 'anchor': 'nw'} };
    /* private */
    this.dw.m = {};
    this.dw.m.delta = cw / 360.0;
    this.dw.m.halfX = cw / 2.0;
    this.dw.m.halfY = this.dw.m.halfX / 2.0;
    this.dw.m.scale = 1;
    this.dw.m.zoomfactor = 1;
    this.dw.m.offset_x = 0;
    this.dw.m.offset_y = 0;
    this.dw.m.scaleoff_x = 0;
    this.dw.m.scaleoff_y = 0;
    this.dw.m.center_x = 0;
    this.dw.m.center_y = 0;
    this.dw.clfunc = {};
    this.dw.mflood = {};
    this.dw.proj = {};
    this.dw.project = 0;
    if ('Proj4js' in window) {
      this.dw.proj = {
        0: 'epsg:4326',
        101: '+proj=merc +units=m',
        201: '+proj=laea +units=m',
        202: '+proj=nsper +units=m +h=40000000 +a=6378136 +b=6378140', 
        203: '+proj=ortho +units=m +a=6378137 +b=6378137'
      }
    }
    return this.dw;
  }
  this.extend(this.initialize(), {
    canvasXY: function(ev) {
      var cw = this.offsetWidth,
          pw = this.width,
          ch = this.offsetHeight,
          ph = this.height;
      var node = ev.target,
          points = [ev.clientX, ev.clientY];
      points[0] += window.pageXOffset;
      points[1] += window.pageYOffset;
      while (node) {
         points[0] -= node.offsetLeft - node.scrollLeft;
         points[1] -= node.offsetTop - node.scrollTop;
         node = node.offsetParent;
      }
      return [ points[0] / cw * pw,
               points[1] / ch * ph ];
    },
    // -----------------------------------
    createMeridians: function () {
      var lonlat = [];
      var x = -180,
          scale_x = 180;
      while (x <= scale_x) {
        var lon = [];
        var y = -90;
        while (y <= 90) {
          lon.push([x, y]);
          y += 180;
        }
        lonlat.push( ['.Longtitude', [x, y].toString(), lon, x.toString(), lon[0]] );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var x = -180;
        var centerof = prev = [x, y];
        while (x < scale_x) {
          x += 180;
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
    drawCoords: function(coords) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
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
          ctx.fillStyle = "black";
          ctx.fillText('X ' + coords[0].toFixed(2) + ' Y ' + coords[1].toFixed(2), cw, ch);
        }
        ctx.restore();
      }
    },
    drawScale: function() {
      var cw = this.width,
          ch = this.height,
          hrect = 60,
          wrect = 26,
          tleft = cw - wrect,
          ttop = ch/2.0 - hrect/2.0;
      if (this.getContext) {
        var ctx = this.getContext("2d");
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.beginPath(); // + -
        ctx.rect(tleft + wrect/4.0, ttop + hrect/4.0, wrect/2.0, 1);
        ctx.rect(tleft + wrect/2.0 - 0.5, ttop + hrect/7.0, 1, hrect/4.0);
        ctx.rect(tleft + wrect/4.0, ttop + hrect/2.0 + hrect/4.0, wrect/2.0, 1);
        ctx.fillStyle = 'rgb(100,100,100)';
        ctx.fill();
        ctx.rect(tleft, ttop, wrect, hrect); // border
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'white';
        ctx.fill();
        ctx.restore();
      }
    },
    checkScale: function(cx, cy) {
      var cw = this.width,
          ch = this.height,
          hrect = 60,
          wrect = 26,
          tleft = cw - wrect,
          ttop = ch/2.0 - hrect/2.0;
      if (cx > tleft && cx < cw && cy > ttop && cy < ttop + hrect/2.0) {
        if (this.m.zoomfactor < 50) this.m.zoomfactor++;
      } else if (cx > tleft && cx < cw && cy > ttop + hrect/2.0 && cy < ttop + hrect) {
        if (this.m.zoomfactor > -48) this.m.zoomfactor--;
      } else return;
      return (this.m.zoomfactor > 0 ? this.m.zoomfactor : 1/-(this.m.zoomfactor-2));
    },
    draw: function() {
      this.clearCarta();
      /* viewport */
      var rect = this.viewsizeOf();
      var left = rect[0], top = rect[1],
          right = rect[2], bottom = rect[3];
      if (left < (xlimit = -179.999)) left = xlimit;
      if (top > (ylimit = (this.project == 101 ? 80 : 90))) top = ylimit;
      for (var i in this.mflood) {
        var m = this.mflood[i];
        if (m['ftype'] == '.Longtitude' && m['centerof']) {
          if (this.isSpherical()) {
             if (m['centerof'][0] > -180 && m['centerof'][0] <= 180)
               m['centerof'] = [m['centerof'][0], 0];
          } else
            m['centerof'] = [m['centerof'][0], top];
        } else if (m['ftype'] == '.Latitude' && m['centerof']) {
          if (this.isSpherical())
            m['centerof'] = [0, m['centerof'][1]];
          else
            m['centerof'] = [left, m['centerof'][1]];
        }
        this.paintCarta(m['coords'], m['ftype'], m['label'], m['centerof']);
      }
      this.drawScale();
    },
    changeProject: function(new_project) {
      if ('Proj4js' in window) {
        this.project = new_project;
      }
      if (this.isSpherical(new_project)) {
        var centerof = this.centerOf(),
            viewcenterof = this.viewcenterOf();
        this.initProj(new_project, viewcenterof[0] - this.m.center_x, viewcenterof[1] - this.m.center_y);
      } else {
        var centerof = this.toPoints([this.m.center_x, this.m.center_y], false);
        this.m.center_x = this.m.center_y = 0;
        this.initProj(new_project);
      }
      this.centerCarta(centerof[0] + this.m.offset_x, centerof[1] + this.m.offset_y);
    },
    centerPoint: function(cx, cy) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        ctx.translate(cx, cy);
      }
    },
    centerCarta: function(cx, cy, doscale) {
      var pw = this.m.halfX * 2,
          ph = this.m.halfY * 2;
      var centerof = this.centerOf();
      var offx = centerof[0] - cx;
          offy = centerof[1] - cy;
      if (doscale) {
        offx /= this.m.scale;
        offy /= this.m.scale;
      }
      /* offset */
      var dx = offx + this.m.offset_x,
          dy = offy + this.m.offset_y;
      if ((dx <= centerof[0] && dx >= centerof[0] - pw) && 
          (dy <= centerof[1] && dy >= centerof[1] - ph)) {
        this.m.offset_x = dx;
        this.m.offset_y = dy;
        this.centerPoint(offx, offy);
      }
    },
    clearCarta: function() {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, this.width, this.height);
        ctx.restore();
      }
    },
    loadCarta: function(data, dopaint) {
      for (var i in data) {
        var d = data[i],
            ftype = d[0],
            tag = d[1];
        var coords = d[2],
            label = 3 in d ? d[3] : '',
            centerof = 4 in d ? d[4] : undefined;
        var ftag = ftype + '_' + tag;
        var mflood = {};
        this.mflood[ftag] = {
          'ftype': ftype,
          'coords': coords,
          'label': label,
          'centerof': centerof
        }
        if (dopaint)
          this.paintCarta(coords, ftype, label, centerof);
      }
    },
    paintCarta: function(coords, ftype, ftext, centerof) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        var m = this.mopt[ftype];
        var points = this.approxCoords(coords, true, 10),
            centerof = this.approxCoords([centerof], true),
            msize = ('size' in m ? m['size'] : 0) / this.m.scale,
            mwidth = ('width' in m ? m['width'] : 1) / this.m.scale;
        ctx.lineWidth = mwidth;
        if (m['class'] == 'Dot') {
          if (points.length) {
            centerof = points;
            ctx.strokeStyle = m['fg'];
            ctx.beginPath();
            ctx.arc(points[0][0], points[0][1], msize, 0, Math.PI*2, 0);
            ctx.stroke();
            ctx.fillStyle = m['fg'];
            ctx.fill();
          }
        } else {
          ctx.strokeStyle = m['fg'];
          ctx.beginPath();
          for (var i in points)
            ctx.lineTo(points[i][0], points[i][1]);
          ctx.stroke();
          if (m['class'] == 'Polygon') {
            ctx.fillStyle = m['bg'];
            ctx.fill();
          }
        }
        if (ftext && centerof.length) {
          ctx.fillStyle = "black";
          if ('anchor' in m) {
            ctx.textAlign = m['anchor'][0];
            ctx.textBaseline = m['anchor'][1];
          }
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.fillText(ftext, (this.m.offset_x + this.m.scaleoff_x + centerof[0][0] + msize*2) * this.m.scale,
                              (this.m.offset_y + this.m.scaleoff_y + centerof[0][1]) * this.m.scale);
          ctx.restore();
        }
      }
    },
    scaleCarta: function(scale) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        var centerof = this.centerOf();
        var ratio = scale/this.m.scale;
        ctx.scale(ratio, ratio);
        var cx = centerof[0]/ratio - centerof[0];
            cy = centerof[1]/ratio - centerof[1];
        var offx = this.m.offset_x - this.m.offset_x/ratio,
            offy = this.m.offset_y - this.m.offset_y/ratio;
        this.centerPoint(cx + offx, cy + offy);
        this.m.scaleoff_x = cx;
        this.m.scaleoff_y = cy;
        this.m.scale = scale;
      }
    },
    initProj: function(project, dx, dy) {
      if (dx !== undefined && dy !== undefined) {
        this.m.center_x += dx;
        this.m.center_y += dy;
      }
      Proj4js.defs[String(project)] = this.proj[project] + " +lon_0=" + this.m.center_x + " +lat_0=" + this.m.center_y;
    },
    isSpherical: function(project) {
      project = project || this.project;
      return (project > 200 && project < 300);
    },
    sizeOf: function() {
      return [0, 0, this.width, this.height];
    },
    centerOf: function() {
      var rect = this.sizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
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
    // --------------------------------
    toPoints: function(coords, dotransform) {
      if (dotransform && this.project != 0) {
        if (!(coords = this.transformCoords('epsg:4326', String(this.project), coords))) return;
      }
      return [ coords[0] * this.m.delta + this.m.halfX,
              -coords[1] * this.m.delta + this.m.halfY ];
    },
    fromPoints: function(points, dotransform) {
      var coords = [ (points[0] / this.m.scale - this.m.halfX / this.m.scale - this.m.offset_x) / this.m.delta,
                    -(points[1] / this.m.scale - this.m.halfY / this.m.scale - this.m.offset_y) / this.m.delta ];
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
    approxCoords: function(coords, dopoints, step) {
      var i, approx_pts = [],
          step = step || 1;
      for (var j in coords) {
        if (!coords[j]) {
          continue;
        } else if (!i) {
          if (pts = (dopoints ? this.toPoints(coords[j], true) : coords[j]))
            approx_pts.push(pts);
          i = j;
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
          i = j;
        }
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
            if (!isNaN(destpt.z)) {
              return [ destpt.x / destproj.a * Proj4js.common.R2D,
                       destpt.y / destproj.a * Proj4js.common.R2D ];
            }
          } else {
            return [ destpt.x, destpt.y ];
          }
        }
      } else
        return coords;
    },
    // - events -----------------------------
    onmousemove: function(ev) {
      if (!ev) return;
      var points = this.canvasXY(ev);
      var coords = this.fromPoints(points, true);
      this.drawCoords(coords);
      if ('onmousemove' in this.clfunc)
        this.clfunc.onmousemove(coords);
    },
    onclick: function(ev) {
      if (!ev) return;
      var points = this.canvasXY(ev);
      if (scale = this.checkScale(points[0], points[1])) {
        this.scaleCarta(1); // fix labels
        this.scaleCarta(scale);
      } else
        this.centerCarta(points[0], points[1], true);
      this.draw();
      if ('onclick' in this.clfunc)
        this.clfunc.onclick();
    }
  });
  return this.dw;
}