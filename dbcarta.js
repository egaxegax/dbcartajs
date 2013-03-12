/**
 * dbCarta HTML5 Canvas dymanic object map.
 *
 * This is port from Python dbCarta project http://dbcarta.googlecode.com/.
 * egax@bk.ru, 2013
 */
function dbCarta(pid) {
  this.extend = function(destination, source) {
    destination = destination || {};
    if(source) {
      for(var property in source) {
        var value = source[property];
        if(value !== undefined) {
          destination[property] = value;
        }
      }
    }
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
      'DotPort':    {'class': 'Dot', 'fg': 'rgb(34,104,234)', 'anchor': ['end', 'bottom']},
      'Area':       {'class': 'Polygon', 'fg': 'rgb(0,130,200)', 'bg': ''},
      'Line':       {'class': 'Line', 'fg': 'rgb(0,130,200)'},
      'Figure':     {'class': 'Line', 'fg': 'rgb(0,130,200)', 'width': 2},
      'CurrFigure': {'class': 'Line', 'fg': 'rgb(0,130,200)', 'anchor': 'ne', 'width': 2},
      'UserLine':   {'class': 'Line', 'fg': 'rgb(0,0,0)', 'anchor': 'nw'} };
    this.dw.m = {};
    this.dw.m.delta = cw / 360.0;
    this.dw.m.halfX = cw / 2.0;
    this.dw.m.scale = 1;
    this.dw.m.offset_x = 0;
    this.dw.m.offset_y = 0;
    this.dw.m.scaleoff_x = 0;
    this.dw.m.scaleoff_y = 0;
    this.dw.m.center_x = 0;
    this.dw.m.center_y = 0;
    this.dw.clfunc = {};
    this.dw.mflood= {};
    return this.dw;
  }
  this.extend(this.initialize(), {
    canvasX: function(p) {
      var cw = this.offsetWidth,
          pw = this.width;
      return p / cw * pw;
    },
    canvasY: function(p) {
      var ch = this.offsetHeight,
          ph = this.height;
      return p / ch * ph;
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
          y += 90;
        }
        lonlat.push( ['.Longtitude', [x, y].toString(), lon, x.toString(), lon[0]] );
        x += 30;
      }
      var y = -90;
      while (y <= 90) {
        var centerof = [-180, y];
        var prev = centerof;
        var x = -180;
        while (x < scale_x) {
          x += 90;
          var lat = [prev, [x, y]],
              prev = [x, y];
          lonlat.push( ['.Latitude', [x, y].toString(), lat, y.toString(), centerof] );
          centerof = "";
        }
        y += 30;
      }
      this.loadCarta(lonlat);
    },
    // ----------------------------------
    draw: function() {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        this.clearCarta();
        /* viewport */
        var rect = this.viewsizeOf();
        var left = rect[0], top = rect[1],
            right = rect[2], bottom = rect[3];
        if (left < -180) left = -180; else if (right > 180) right = 180;
        if (top > 90) top = 90; else if (bottom < -90) bottom = -90;
        for (var i in this.mflood) {
          var m = this.mflood[i];
          if (m['ftype'] == '.Longtitude') {
            if (this.project == 2) {
               if (m['centerof'][0] >-180 && m['centerof'][0] <= 180)
                 this.paintCarta([[m['centerof'][0], 0]], m['ftype'], m['label']);
            } else if (m['centerof'][0] >= left && m['centerof'][0] <= right) {
               this.paintCarta([[m['centerof'][0], top]], m['ftype'], m['label']);
            }
          } else if (m['ftype'] == '.Latitude') {
            if (this.project == 2) {
              this.paintCarta([[0, m['centerof'][1]]], m['ftype'], m['label']);
            } else if (m['centerof'][1] >= bottom && m['centerof'][1] <= top) {
              this.paintCarta([[left, m['centerof'][1]]], m['ftype'], m['label']);
            }
          }
          this.paintCarta(m['coords'], m['ftype']);
        }
      }
    },
    changeProject: function(new_project) {
      this.m.halfY = this.m.halfX / 2.0;
      if ('Proj4js' in window) {
        this.project = new_project;
      }
    },
    centerPoint: function(cx, cy) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        ctx.translate(cx, cy);
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
    loadCarta: function(data) {
      for (var i in data) {
        var d = data[i],
            ftype = d[0],
            tag = d[1];
        var coords = d[2],
            label = 3 in d ? d[3] : '',
            centerof = 4 in d ? d[4] : '';
        var ftag = ftype + '_' + tag;
        var mflood = {};
        this.mflood[ftag] = {
          'ftype': ftype,
          'coords': this.approxPoints(coords),
          'label': label,
          'centerof': centerof
        }
      }
    },
    paintCarta: function(coords, ftype, ftext) {
      if (this.getContext) {
        var ctx = this.getContext("2d");
        var m = this.mopt[ftype];
        ctx.lineWidth = ('width' in m ? m['width'] : 1) / this.m.scale;
        if (ftext) {
          ctx.fillStyle = "black";
          if ('anchor' in m) {
            ctx.textAlign = m['anchor'][0];
            ctx.textBaseline = m['anchor'][1];
          }
          if (points = this.toPoints(coords[0], 1)) {
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillText(ftext, (this.m.offset_x + this.m.scaleoff_x + points[0]) * this.m.scale,
                                (this.m.offset_y + this.m.scaleoff_y + points[1]) * this.m.scale);
            ctx.restore();
          }
        } else if (m['class'] == 'Dot') {
        } else {
          ctx.strokeStyle = m['fg'];
          ctx.beginPath();
          for (var i in coords) {
            if (points = this.toPoints(coords[i], 1))
              ctx.lineTo(points[0], points[1]);
          }
          ctx.stroke();
          if (m['class'] == 'Polygon') {
            ctx.fillStyle = m['bg'];
            ctx.fill();
          }
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
    translateCarta: function(dx, dy) {
      /* proj4 init */
      this.m.center_x += dx;
      this.m.center_y += dy;
      if ('Proj4js' in window) Proj4js.defs['ORTHO'] = "+proj=ortho +units=m +a=6378137 +b=6378137 +lat_0=" + this.m.center_x + " +lon_0=" + this.m.center_y;
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
      var m = this.fromPoints([rect[0], rect[1]], 0);
      var n = this.fromPoints([rect[2], rect[3]], 0);
      var mleft = m[0], mtop = m[1],
          mright = n[0], mbottom = n[1];
      return [mleft, mtop, mright, mbottom];
    },
    viewcenterOf: function() {
      var rect = this.viewsizeOf();
      return [ (rect[0] + rect[2]) / 2.0,
               (rect[1] + rect[3]) / 2.0 ];
    },
    // --------------------------------
    toPoints: function(coords, dosphere) {
      if (dosphere && this.project == 2) {
        if (!(coords = this.transformCoords('epsg:4326', 'ortho', coords))) return;
      }
      return [ coords[0] * this.m.delta + this.m.halfX,
              -coords[1] * this.m.delta + this.m.halfY ];
    },
    fromPoints: function(points, dosphere) {
      var coords = [ (points[0] / this.m.scale - this.m.halfX / this.m.scale - this.m.offset_x) / this.m.delta,
                    -(points[1] / this.m.scale - this.m.halfY / this.m.scale - this.m.offset_y) / this.m.delta ];
      if (dosphere && this.project == 2) {
        if (!(coords = this.transformCoords('ortho', 'epsg:4326', coords))) return;
      }
      return coords;
    },
    distance: function(coords2) {
      var x = coords2[0][0] * Math.PI/180.0,
          y = coords2[0][1] * Math.PI/180.0,
          x1 = coords2[1][0] * Math.PI/180.0,
          y1 = coords2[1][1] * Math.PI/180.0;
      return 6378.136 * Math.acos(Math.cos(y) * Math.cos(y1) * Math.cos(x - x1) + Math.sin(y) * Math.sin(y1));
    },
    approxPoints: function(coords) {
      var approx_pts = coords;
      for (var i=0; i<coords.length-1; i++) {
        var x = coords[i][0],
            y = coords[i][1],
            x1 = coords[i+1][0],
            y1 = coords[i+1][1];
        if (i==0)
          approx_pts = [[x, y]];
        var d = this.distance([[x, y], [x1, y1]]),
            scalestep = 1;
        /* by step 100 km */
        if (d > 1000)
          scalestep = parseInt(d / 500.0);
        var _x = x, _y = y;
        for (var j=0; j<scalestep; j++) {
          _x += (x1 - x) / scalestep;
          _y += (y1 - y) / scalestep;
          approx_pts.push([_x, _y]);
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
            return [ destpt.x / destproj.a * Proj4js.common.R2D,
                     destpt.y / destproj.a * Proj4js.common.R2D ];
          } else if (sourceproj.projName == 'ortho') {
            if (Math.sqrt(coords[0]*coords[0] + coords[1]*coords[1]) < sourceproj.a + 0.00001) {
              return [ destpt.x, destpt.y ];
            }
          }
        }
      } else {
        return coords;
      }
    },
    // - events -----------------------------
    onmousemove: function(ev, callback) {
      var cleft = this.offsetLeft,
          ctop = this.offsetTop,
          wx = window.scrollX,
          wy = window.scrollY,
          bw = parseInt(this.style.borderWidth) / 2.0;
      var cx = this.canvasX(ev.clientX - cleft - bw + wx),
          cy = this.canvasY(ev.clientY - ctop - bw + wy);
      var coords = this.fromPoints([cx, cy], 1);
      if ('onmousemove' in this.clfunc)
        this.clfunc.onmousemove(coords);
      if (this.getContext) {
        var ctx = this.getContext("2d");
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        var wcrd = ctx.measureText('X 0000.00 X 0000.00').width,
            hcrd = ctx.measureText('X').width * 2;
        var tleft = this.width,
            ttop = this.height;
        ctx.clearRect(tleft - wcrd, ttop - hcrd, wcrd, hcrd);
        if (coords) {
          ctx.textBaseline = 'bottom';
          ctx.textAlign = 'end';
          ctx.fillStyle = "black";
          ctx.fillText('X ' + coords[0].toFixed(2) + ' Y ' + coords[1].toFixed(2), tleft, ttop);
        }
        ctx.restore();
      }
    },
    onclick: function(ev) {
      var cleft = this.offsetLeft,
          ctop = this.offsetTop,
          cw = this.offsetWidth,
          ch = this.offsetHeight,
          wx = window.scrollX,
          wy = window.scrollY,
          bw = parseInt(this.style.borderWidth) / 2.0;
      var centerof = this.centerOf();
      /* delta center */
      var cx = -(this.canvasX(ev.clientX - cleft - bw + wx) - centerof[0]) / this.m.scale,
          cy = -(this.canvasY(ev.clientY - ctop - bw + wy )- centerof[1]) / this.m.scale;
      /* offset */
      var dx = cx + this.m.offset_x,
          dy = cy + this.m.offset_y;
      if ((dx < centerof[0] && dx > centerof[0] - this.canvasX(cw)) && 
          (dy < centerof[1] && dy > centerof[1] - this.canvasY(ch))) {
        this.m.offset_x = dx;
        this.m.offset_y = dy;
        this.centerPoint(cx, cy);
        this.draw();
        if ('onclick' in this.clfunc)
          this.clfunc.onclick();
      }
    },
    // ---------------------------------
    run: function() {
      this.createMeridians(); 
      this.scaleCarta(1);
      this.changeProject(0);
      this.translateCarta(300, 0);
      this.draw();
    }
  });
  return this.dw;
}