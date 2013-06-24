/**
 * Starry Sky and Solar System Bodies.
 * Source: Marble, libnova, k-map.
 * egax, 2013
 */
var MUtil = {
  /**
  * Angle in range 0..360
  */
  ang360: function(angle) {
    if (angle >= 0.0 && angle < 360.0) return angle;
    var temp = parseInt(angle / 360);
    if (angle < 0.0) temp --;
    temp *= 360;
    return angle - temp;
  },
  /**
  * Angle in range -PI..PI
  */
  angPI: function(ang) {
    while(ang < -Math.PI) ang += 2.0 * Math.PI;
    while(ang > Math.PI) ang -= 2.0 * Math.PI;
    return ang;
  },
  /**
  * Convert degrees D to [hh,mm,ss] (Right Ascention).
  */
  deg2hms: function(d) {
    var dtemp;
    var deg = this.ang360(d);
    // hours fom degrees
    dtemp = deg / 15.0;
    var h = parseInt(dtemp);
    // min
    dtemp = 60*(dtemp - h);
    var m = parseInt(dtemp);
    // sec
    dtemp = 60*(dtemp - m);
    var s = parseInt(dtemp);
    // overflow
    if (s > 59) {
      s = 0;
      m++;
    }
    if (m > 59) {
      m = 0;
      h++;
    }
    return [h, m, s];
  },
  /**
  * Convert [hh,mm,ss] to degrees (Right Ascention).
  */
  hms2deg: function(h, m, s) {
    var d = (h / 24.0) * 360;
    d += (m / 60.0) * 15;
    d += (s / 60.0) * 0.25;
    return d;
  },
  /**
  * Convert [deg,mm,ss] to degrees (Declination).
  */
  dms2deg: function(d, m, s) {
    var deg = Math.abs(d);
    deg += Math.abs(m / 60.0);
    deg += Math.abs(s / 3600.0);
    // negative ?
    if (d < 0) deg *= -1.0;
    return deg;
  },
  /**
  * Convert degrees DEG to [deg,mm,ss] (Declination).
  */
  deg2dms: function(deg) {
    var dtemp;
    var dd = Math.abs(deg);
    var d = parseInt(dd);
    // min
    dtemp = 60*(dd - d);
    var m = parseInt(dtemp);
    // sec
    dtemp = 60*(dtemp - m);
    var s = parseInt(dtemp);
    // overflow
    if (s > 59) {
      s = 0;
      m++;
    }
    if (m > 59) {
      m = 0;
      d++;
    }
    if (deg < 0) d *= -1.0;
    return [d, m, s];
  },
  sign: function(x) {
    if (x > 0)
      return 1.0;
    else if (x < 0)
      return -1.0;
    else
      return 0.0;
  }
}
var MVector = {
  EPS: 1e-8,   // epsilon
  AE: 6378.136, // earth radii km
  /**
  * Z-rotation matrix on angle ANG.
  */
  matrZ: function(ang){
    return [ [ Math.cos(ang), -Math.sin(ang), 0 ],
             [ Math.sin(ang), Math.cos(ang), 0 ],
             [ 0, 0, 1 ] ];
  },
  /**
  * Mult. matrix A on vector B.
  */
  multmatr3: function(a, b) {
    var c = []; 
    for (var j=0; j<=2; j++) {
      var ss = 0;
      for (var i=0; i<=2; i++)
        ss += a[i][j] * b[i];
      c.push(ss);
    }
    return c;
  },
  /**
  * Rect.(x,y,z) to spherical (ra,dec,r).
  */
  rect2spheric: function(xe, ye, ze) {
    return [ Math.atan2( ye, xe ),
             Math.atan2( ze, Math.sqrt(xe*xe+ye*ye) ),
             Math.sqrt(xe*xe+ye*ye+ze*ze) ];
  },
  /**
  * Spheric.(ra,dec) to rect.(x,y,z).
  */
  spheric2rect: function(lon, lat) {
    return [ Math.cos(lon) * Math.cos(lat),
             Math.sin(lon) * Math.cos(lat),
             Math.sin(lat) ];
  },
  /**
  * Rect.(x,y,z) to spherical geodetic (lon,lat).
  */
  rect2geo: function(dt, xe, ye, ze) {
    var gmst = Starry.siderealTime(dt),
        skyRotationAngle = gmst / 12.0 * Math.PI;
    var mz = this.matrZ(skyRotationAngle);
    var v = this.multmatr3(mz, [xe, ye, ze]),
        lonlat = this.rect2spheric(v[0], v[1], v[2]);
    var ret = [ MUtil.angPI(lonlat[0]) * 180/Math.PI,
                lonlat[1] * 180/Math.PI ];
    return ret;
  },
  /**
  * Intersect. line MA and circle R.
  */
  lineNcircle: function(ma, r){
     // y=kx+e
    var k = (ma[1][1] - ma[0][1])/(ma[1][0] - ma[0][0]),
        e = ma[1][1] - k * ma[1][0];
    // ax+bx+c=0
    var a = -k, b = 1, c = -e;
    var x0 = -a*c/(a*a+b*b),
        y0 = -b*c/(a*a+b*b);
    if (c*c > r*r*(a*a+b*b)) // no points
      return;
    else if (Math.abs(c*c - r*r*(a*a+b*b)) < 0) // 1 point
      return ma[1];
    else {  // 2 points
      var d = r*r - c*c/(a*a+b*b),
          mult = Math.sqrt(d / (a*a+b*b));
      var ax = x0 + b * mult,
          bx = x0 - b * mult;
          ay = y0 - a * mult;
          by = y0 + a * mult;
      // closest
      var r1 = Math.sqrt((ma[0][0] - ax)*(ma[0][0] - ax) + (ma[0][1] - ay)*(ma[0][1] - ay)),
          r2 = Math.sqrt((ma[0][0] - bx)*(ma[0][0] - bx) + (ma[0][1] - by)*(ma[0][1] - by));
      if (r1 < r2)
        return [ ax, ay ];
      else
        return [ bx, by ];
    }
  },
  /**
  * Circle points on sphere.
  */
  circle1spheric: function(x, y, radius, col_vertex){
    // latitude 90
    if (Math.abs(y) - 90 < this.eps)
      y = y + MUtil.sign(y) * this.eps;

    var r = radius / this.AE,
      anglestep = 2.0 * Math.PI / col_vertex,
      angle, dx, dy,
      pts = [];
    for (var i=0; i<=col_vertex; i++) {
      angle = i * anglestep;
    
      dy = Math.asin((((Math.cos(angle) * Math.sin(r) * Math.sin(r) + Math.cos(r) * Math.cos(r)) * Math.cos(y * Math.PI/180)) - Math.cos(r) * Math.cos(y * Math.PI/180 + r)) / Math.sin(r));
      dx = ((Math.cos(r) - Math.sin(dy) * Math.sin(y * Math.PI/180)) / ((Math.cos(dy) * Math.cos(y * Math.PI/180))));
    
      if (dx > 1)
        dx = 0; 
      else if (dx < -1) 
        dx = Math.PI;
      else 
        dx = Math.acos(dx);
    
      if (angle <= Math.PI)
        dx = x - dx * 180/Math.PI;
      else
        dx = x + dx * 180/Math.PI;
      
      pts.push([MUtil.angPI(dx * Math.PI/180) * 180/Math.PI, dy * 180/Math.PI]);
    }
    return pts;
  }
}
var Qn = {
  fromEuler: function (pitch, yaw, roll) {
    var cPhi = Math.cos(0.5 * pitch),
        cThe = Math.cos(0.5 * yaw),
        cPsi = Math.cos(0.5 * roll),
        sPhi = Math.sin(0.5 * pitch),
        sThe = Math.sin(0.5 * yaw),
        sPsi = Math.sin(0.5 * roll);
    var w = cPhi * cThe * cPsi + sPhi * sThe * sPsi,
        x = sPhi * cThe * cPsi - cPhi * sThe * sPsi,
        y = cPhi * sThe * cPsi + sPhi * cThe * sPsi,
        z = cPhi * cThe * sPsi - sPhi * sThe * cPsi;
    return [w, x, y, z];
  },
  toMatrix: function(qpos) {
    var w = qpos[0], x = qpos[1], y = qpos[2], z = qpos[3];
    var m = [];
    var xy = x * y,
        yy = y * y,
        zw = z * w;
    var xz = x * z,
        yw = y * w,
        zz = z * z;
    m.push( [1.0 - 2.0 * (yy + zz), 2.0 * (xy + zw), 2.0 * (xz - yw), 0.0] );
    var xx = x * x,
        xw = x * w,
        yz = y * z;
    m.push( [2.0 * (xy - zw), 1.0 - 2.0 * (xx + zz), 2.0 * (yz + xw), 0.0] );
    m.push( [2.0 * (xz + yw), 2.0 * (yz - xw), 1.0 - 2.0 * (xx + yy), 0.0] );
    return m;
  },
  rotateAroundAxis: function(centerof, m) {
    var w = centerof[0], x = centerof[1], y = centerof[2], z = centerof[3];
    var vx = m[0][0] * x + m[1][0] * y + m[2][0] * z,
        vy = m[0][1] * x + m[1][1] * y + m[2][1] * z,
        vz = m[0][2] * x + m[1][2] * y + m[2][2] * z;
    return [1.0, vx, vy, vz];
  },
  inverse: function(qpos) {
    var w = qpos[0], x = qpos[1], y = qpos[2], z = qpos[3];
    var inverse = [w, -x, -y, -z];
    return this.normalize(inverse);
  },
  length: function(qpos) {
    var w = qpos[0], x = qpos[1], y = qpos[2], z = qpos[3];    
    return Math.sqrt(w * w + x * x + y * y + z * z);
  },
  normalize: function(qpos) {
    var w = qpos[0], x = qpos[1], y = qpos[2], z = qpos[3];
    var v = 1.0 / this.length(qpos);
    return [w * v, x * v, y * v, z * v];
  },
  fromSpherical: function(lon, lat) {
    var w = 0.0,
        x = Math.cos(lat) * Math.sin(lon),
        y = Math.sin(lat),
        z = Math.cos(lat) * Math.cos(lon);
    return [w, x, y, z];
  }
}
var Starry = {
  /**
  * String date to array.
  */
  parseDate: function(dt) {
    var dt = dt.split(" ");
    var d = dt[0].split("."),
        t = dt[1].split(":");
    return [Number(d[2]),Number(d[1]),Number(d[0]),Number(t[0]),Number(t[1]),Number(t[2])];
  },
  /**
  * Modified Julian Day MJD.
  */
  gregorianToJulian: function(y, m, d) {
    if (y <= 99)
      y += 1900;
    if (m > 2)
      m -= 3;
    else {
      m += 9;
      y -= 1;
    }
    var c = y;
    c /= 100;
    var ya = y - 100*c;
    return (1721119 + d + (146097*c)/4 + (1461*ya)/4 + (153*m+2)/5);
  },
  /**
  * Sidereal time in J2000.
  */
  siderealTime: function(dt) {
    // mjd UTC
    var mjdUtc = parseInt(this.gregorianToJulian(parseInt(dt[0]), parseInt(dt[1]), parseInt(dt[2])));
    // sec midnight UTC
    var h = parseInt(dt[3]);
    var m = parseInt(dt[4]);
    var s = parseInt(dt[5]);
    var offsetUtcSecs = h * 3600 + m * 60 + s;
    var d_days = mjdUtc - 2451545.5;
    var d = d_days + ( offsetUtcSecs / ( 24.0 * 3600 ) );  
    // hours (0..24)
    var gmst = 18.697374558 + 24.06570982441908 * d;
    return gmst - parseInt( gmst / 24.0 ) * 24.0;
  },
  /**
  * Calc stars pos on lonlat.
  */
  renderSky: function(
    starsdata,    // array stars
    viewport,     // viewport in degrees
    skyRadius,    // degrees
    earthRadius,  // degrees
    centerx,      // degrees
    centery,      // degrees
    time          // array date/time GMT
    ){

    var left = viewport[0], top = viewport[1],
        right = viewport[2], bottom = viewport[3];
    var cx = centerx * Math.PI/180,
        cy = centery * Math.PI/180;
    
    var gmst = this.siderealTime(time),
        skyRotationAngle = gmst / 12.0 * Math.PI,
        skyAxis = Qn.fromEuler(-cy, cx + skyRotationAngle, 0.0),
        skyAxisMatrix = Qn.toMatrix(Qn.inverse(skyAxis));
    
    var mstars = [];
    for(var i in starsdata) {
      var d = starsdata[i], size;
      if (d.length < 8) // hd
        var ra = d[0], dec = d[1], mag = d[2], hip = d[3], label = d[4];
      else // tycho
        var ra = d[0], dec = d[1], mag = d[6], hip = d[5], label = d[7];
      var qpos = Qn.fromSpherical(ra, dec);      
      var q = Qn.rotateAroundAxis(qpos, skyAxisMatrix);
      var w = q[0], x = q[1], y = q[2], z = q[3];
      
      if ( z > 0 )
        continue;
        
      var px = x * skyRadius,
          py = y * skyRadius;
      
      // darkside
      if ( z < 0 && ( (px * px + py * py) < (earthRadius * earthRadius) ) )
          continue;

      // outside
      if ( (px < left || px >= right) || (py > top || py <= bottom) )
          continue;

      // star size
      if ( mag < -1 ) size = 8.0;
      else if ( mag < 0 ) size = 7.0;
      else if ( mag < 1 ) size = 6.0;
      else if ( mag < 2 ) size = 5.0;
      else if ( mag < 3 ) size = 4.0;
      else if ( mag < 4 ) size = 3.0;
      else if ( mag < 5 ) size = 2.0;
      else size = 1.0;

      mstars.push([ [[px, py]], size, label ]);
    }
    return mstars;
  },
  /**
  * Calc sat pos by height above Earth on lonlat.
  */
  renderSat: function(
    tracs,    // array stars
    viewport,     // viewport in degrees
    earthRadius,  // degrees
    earthRadiusM, // meters
    centerx,      // degrees
    centery,      // degrees
    time          // array date/time GMT
    ){

    var left = viewport[0], top = viewport[1],
        right = viewport[2], bottom = viewport[3];
    var cx = centerx * Math.PI/180,
        cy = centery * Math.PI/180;
    
    var gmst = this.siderealTime(time),
        skyRotationAngle = gmst / 12.0 * Math.PI,
        skyAxis = Qn.fromEuler(-cy, cx + skyRotationAngle, 0.0),
        skyAxisMatrix = Qn.toMatrix(Qn.inverse(skyAxis));
    
    var labels = [], points = [];
    for(var i in tracs) {
      var d = tracs[i], size;
      var xe = d[0], ye = d[1], ze = d[2];  // vector
      var re = Math.sqrt(xe*xe + ye*ye + ze*ze); // altitude
      var qpos = [0, ye/re, ze/re, xe/re];   // rotate axis
      var q = Qn.rotateAroundAxis(qpos, skyAxisMatrix);
      var w = q[0], x = q[1], y = q[2], z = q[3];
      var skyRadius = earthRadius * (re * 1000 + earthRadiusM) / earthRadiusM;

      var px = x * skyRadius,
          py = y * skyRadius;
      
      // darkside
      if ( z < 0 && ( (px * px + py * py) < (earthRadius * earthRadius) ) )
          continue;

      // outside
      //if ( (px < left || px >= right) || (py > top || py <= bottom) )
      //    continue;

      if ( i == 0 ) // label
        labels.push([ [[px, py]] ]);
      else // points
        points.push([px, py]);
    }
    return [labels, [[points]]];
  }
}