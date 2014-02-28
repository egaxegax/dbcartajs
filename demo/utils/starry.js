/**
 * Starry Sky and Solar System Bodies.
 * Source: Marble, libnova, k-map.
 * egax@bk.ru, 2013
 */
var MUtil = {
  /**
  * Angle in range 0..360
  */
  ang360: function(ang) {
    while(ang < 0) ang += 360;
    while(ang >= 360) ang -= 360;
    return ang;
  },
  ang180: function(ang) {
    while(ang < -180) ang += 360;
    while(ang > 180) ang -= 360;
    return ang;
  },
  ang90: function(ang) {
    while(ang < -90) ang += 180;
    while(ang > 90) ang -= 180;
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
};
var MVector = {
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
    var ret = [ MUtil.ang180(lonlat[0] * 180/Math.PI),
                lonlat[1] * 180/Math.PI ];
    return ret;
  },
  /**
  * Return [X,Y] rotated around Z-axis with ANGLE relative to center of CX,CY.
  */
  rotateZ: function(x, y, angle, cx, cy) {
    var roll = angle * Math.PI/180,
        r = Math.sqrt((cx - x) * (cx - x) + (y - cy) * (y - cy));
    if (r > 0) {
        var a = Math.acos((cx - x) / r);
        if (y < cy) a = 2.0 * Math.PI - a;
        coords = [ cx - r * Math.cos(roll + a),
                   cy + r * Math.sin(roll + a) ];
    }
    return coords;
  }
};
var MGeo = {
  EPS: 1e-8,   // epsilon
  AE: 6378.136, // earth radii km
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
  * Circle coords.
  */
  circle2poly: function(x, y, radius, col_vertex){
    var anglestep = 2.0*Math.PI / col_vertex,
        pts = [];
    if (Math.abs(radius) <= this.EPS) return pts;
    for (var i=0; i<=col_vertex; i++){
      pts.push([ x - radius * Math.cos(i * anglestep), 
                 y + radius * Math.sin(i * anglestep) ]);
    }
    return pts;
  },
  /**
  * Circle coords on sphere.
  */
  circle1spheric: function(x, y, radius, col_vertex){
    // latitude 90
    if (Math.abs(y) - 90 < this.EPS)
      y = y + MUtil.sign(y) * this.EPS;
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
      pts.push([MUtil.ang180(dx), dy * 180/Math.PI]);
    }
    return pts;
  },
  islight: function(x, y, cx, cy) {
    x *= Math.PI/180;
    y *= Math.PI/180;
    cx *= Math.PI/180;
    cy *= Math.PI/180;
    return ((Math.sin(y) * Math.sin(cy) - Math.cos(y) * Math.cos(cy) * Math.cos(Math.PI + (cx - x)))>0);
  },
  bigcircle1spheric: function(x, y, col_vertex, cx, cy, dolight){
    var ct, L, F, T, f=0,
        k = (col_vertex || 10),
        ss1 = [], ss2 = [];
    for (var i=0; i<=360*col_vertex; i++) {
      if (y!=0) {
        ct = -1 / Math.tan(y*Math.PI/180);
        L = -180 + i / k;
        T = ct * Math.cos((L - x)*Math.PI/180);
        F = Math.atan(T)*180/Math.PI;
      } else { // equinox
        if (i<=180 * k) {
          L = x + 90;
          if ((L < -180) || (L > 180))
            L = MUtil.ang180(L);
          F = 90 - i / k;
          if ((F < -90) || (F > 90))
            F = MUtil.ang90(F);
        } else {
          L = x - 90;
          if ((L < -180) || (L > 180))
            L = MUtil.ang180(L);
          F = -90 + (i - 180 * k) / k;
          if ((F < -90) || (F > 90))
            F = MUtil.ang90(F);
        }
      }
      if (dolight != undefined && cx != undefined && cy != undefined){
        if (this.islight(L, F, cx, cy) == dolight) {
          if (!f)
            ss1.push([L, F]);
          else
            ss2.push([L, F]);
        } else {
          f = true;
        }
      } else {
        ss1.push([L, F]);
      }
    }
    return ss2.concat(ss1);
  },
  distance: function(pt1, pt2) {
    var x = pt1[0] * Math.PI/180.0,
        y = pt1[1] * Math.PI/180.0,
        x1 = pt2[0] * Math.PI/180.0,
        y1 = pt2[1] * Math.PI/180.0;
    return Math.acos(Math.cos(y) * Math.cos(y1) * Math.cos(x - x1) + Math.sin(y) * Math.sin(y1));
  },
  /**
  * Day/Night zone.
  * T time array.
  * h height above Earth (in km).
  * CX, CY center point (in deg.).
  */
  terminator: function(time, h, cx, cy) {
    var sunpos = Solar.loadSun(time),
        rect = MVector.spheric2rect(sunpos[0], sunpos[1]),
        sgeo = MVector.rect2geo(time, rect[0], rect[1], rect[2]);
    var s1 = MGeo.bigcircle1spheric(sgeo[0], sgeo[1], 1, cx, cy, true);
    h += this.AE;
    var ss1 = [];
    for(var i in s1) {
      if (this.distance(s1[i], [cx, cy])<=Math.acos(this.AE/h)) ss1.push(s1[i]);
    }
    s1 = ss1;
    var s2 = this.circle1spheric(cx, cy, this.AE*Math.acos(this.AE/h)-100,60);
    var ss1 = [], ss2 = [], f=0;
    for(var i in s2) {
      if (!this.islight(s2[i][0], s2[i][1], sgeo[0], sgeo[1])) {
        if (!f)
          ss1.push(s2[i]);
        else
          ss2.push(s2[i]);
      } else {
        f = true;
      }
    }
    s2=ss2.concat(ss1);
    if (s1.length && s2.length) {
      if (this.distance(s1[0], s2[0]) < Math.PI/2.0) s2.reverse();
    }
    var s = s1.concat(s2);
    if (s) {
      s.push(s[0]);
    }
    return s;
  }
};
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
};
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
    time,         // array date/time UTC
    darkhide,
    outhide
    ){

    darkhide = (darkhide == undefined || darkhide);
    outhide = (outhide == undefined || outhide);
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
      if (d.length < 6) // hd
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
      if ( darkhide && (z < 0 && ((px * px + py * py) < (earthRadius * earthRadius))) )
          continue;

      // outside
      if ( outhide && ((px < left || px >= right) || (py > top || py <= bottom)) )
          continue;

      // star size
      if ( mag < 7 ) size = 7.0 - mag;
      else size = 1.0;

      mstars.push([ [[px, py]], size, label, hip, {hip: hip, label: label, ra: ra, dec: dec} ]);
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
    time,         // array date/time GMT
    darkhide
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
      if ( darkhide && (z < 0 && ((px * px + py * py) < (earthRadius * earthRadius))) )
          continue;

      // outside
//      if ( (px < left || px >= right) || (py > top || py <= bottom) )
//          continue;

      if ( i == 0 ) // label
        labels.push([ [[px, py]] ]);
      else // points
        points.push([px, py]);
    }
    return [labels, [[points]]];
  }
};
var Solar = {
  /**
  * Portion days from epoch J2000.
  * TIME array (y,m,d,h,m,s) in UTC.
  */
  timeScale: function(time) {
    var Y = parseInt(time[0]),
        M = parseInt(time[1]),
        D = parseInt(time[2]),
        h = 3 in time ? parseInt(time[3]) : 0,
        m = 4 in time ? parseInt(time[4]) : 0,
        s = 5 in time ? parseInt(time[5]) : 0;
    return 367*Y - parseInt(7*( Y + parseInt((M+9)/12) ) / 4) + parseInt(275*M/9) + D - 730530 + (h*3600 + m*60 + s) / 86400.0;
  },
  /**
  * Ecliptic rectangular geliocentric to equatorial rectangular geocentric coords.
  * Return array `[x,y,z]`.
  * XE, YE, ZE rect.coords.
  * D portion days from epoch J2000.
  */
  ecl2eq: function(xe, ye, ze, d) {
    var ecl = 23.4393 - 3.563E-7 * d;
    return [ xe,
             ye * Math.cos(ecl * Math.PI/180) - ze * Math.sin(ecl * Math.PI/180),
             ye * Math.sin(ecl * Math.PI/180) + ze * Math.cos(ecl * Math.PI/180) ];
  },
  /**
  * Ecliptic rectangular geliocentric to ecliptic rectangular geocentric coords.
  * Return array `[x,y,z]`. Use Sun.
  * XE, YE, ZE rectangular coords.
  * D portion days from epoch J2000.
  * PRECESSION_EPOCH portion epoch for precession.
  */
  ecl_helio2geo: function(xe, ye, ze, r, d, precession_epoch) {
    if (precession_epoch) {
      // ecliptic spherical geliocentric
      var ecl = MVector.rect2spheric(xe, ye, ze),
          lonecl = ecl[0],
          latecl = ecl[1],
          r = ecl[2];
      // precession
      var lon_corr = 3.82394E-5 * ( 365.2422 * ( precession_epoch - 2000.0 ) - d );
      lonecl += lon_corr;
      // correct ecl.spheric geliocentic
      var rect = MVector.spheric2rect(lonecl, latecl, r),
          xe = rect[0],
          ye = rect[1],
          ze = rect[2];
    }
    // Sun position
    var ps = this.Sun(d),
        xs = ps[0],
        ys = ps[1],
        zs = ps[2];
    // ecliptic rectangular geocentric
    var xg = xe + xs,
        yg = ye + ys,
        zg = ze;
    return [ xg, yg, zg ];
  },
  /**
  * Eclipic rectangular geliocentric (geocentric for Moon) coords.
  * Return array `[x,y,z]`.
  * N longitude of the ascending node (in degrees).
  * i inclination (in degrees).
  * w argument of perigee (in degrees).
  * a average distance from the Earth's center in radiuses of the Earth (E.r.).
  * e eccentricity.
  * M mean anomaly.
  */
  eclrect: function(N, i, w, a, e, M) {
    // eccentric anomaly
    var E0 = MUtil.ang360(M + (180/Math.PI) * e * Math.sin(M * Math.PI/180) * ( 1.0 + e * Math.cos(M * Math.PI/180) )),
        E1 = MUtil.ang360(E0 - (E0 - (180/Math.PI) * e * Math.sin(E0 * Math.PI/180) - M) / (1 - e * Math.cos(E0 * Math.PI/180)));
    var x = a * (Math.cos(E1 * Math.PI/180) - e),
        y = a * Math.sqrt(1 - e*e) * Math.sin(E1 * Math.PI/180);
    // distance and true anomaly
    var r = Math.sqrt( x*x + y*y ),
        v = Math.atan2( y, x );
    return [ r * ( Math.cos(N * Math.PI/180) * Math.cos(v + w * Math.PI/180) - Math.sin(N * Math.PI/180) * Math.sin(v + w * Math.PI/180) * Math.cos(i * Math.PI/180) ),
             r * ( Math.sin(N * Math.PI/180) * Math.cos(v + w * Math.PI/180) + Math.cos(N * Math.PI/180) * Math.sin(v + w * Math.PI/180) * Math.cos(i * Math.PI/180) ),
             r * Math.sin(v + w * Math.PI/180) * Math.sin(i * Math.PI/180) ];
  },
  /**
  * Sun position.
  * D portion days from epoch J2000.
  */
  Sun: function(d) {
    // orbital kepler elements
    var N = 0.0,                                       // long.asc.node
        i = 0.0,                                       // incl.
        w = MUtil.ang360(282.9404 + 4.70935E-5 * d),   // arg.perig.
        a = 1.000000,                                  // average distance from the Sun (a.u.)
        e = 0.016709 - 1.151E-9 * d,                   // essentricity
        M = MUtil.ang360(356.0470 + 0.9856002585 * d); // mean anomaly
    // mean longtitude
    var L = MUtil.ang360(w + M);
    // eccentric anomaly
    var E = MUtil.ang360(M + (180/Math.PI) * e * Math.sin(M * Math.PI/180) * ( 1.0 + e * Math.cos(M * Math.PI/180) ));
    // ecliptic rectangular geliocentric
    var xv = Math.cos(E * Math.PI/180) - e,
        yv = Math.sqrt(1.0 - e*e) * Math.sin(E * Math.PI/180);
    // distance and true anomaly
    var r = Math.sqrt( xv*xv + yv*yv ),
        v = Math.atan2( yv, xv );
    var lon = v + w * Math.PI/180;
    // ecliptic rectangular geocentric
    var xe = r * Math.cos(lon),
        ye = r * Math.sin(lon),
        ze = 0.0;
    return [xe, ye, ze ];
  },
  Moon: function(d) {
    var N = 125.1228 - 0.0529538083 * d,
        i = 5.1454,
        w = 318.0634 + 0.1643573223 * d,
        a = 60.2666,
        e = 0.054900,
        M = 115.3654 + 13.0649929509 * d;
    return this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M));
  },
  Mercury: function(d) {
    var N = 48.3313 + 3.24587E-5 * d,
        i = 7.0047 + 5.00E-8 * d,
        w = 29.1241 + 1.01444E-5 * d,
        a = 0.387098,
        e = 0.205635 + 5.59E-10 * d,
        M = 168.6562 + 4.0923344368 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Venus: function(d) {
    var N = 76.6799 + 2.46590E-5 * d,
        i = 3.3946 + 2.75E-8 * d,
        w = 54.8910 + 1.38374E-5 * d,
        a = 0.723330,
        e = 0.006773 - 1.302E-9 * d,
        M = 48.0052 + 1.6021302244 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Mars: function(d) {
    var N = 49.5574 + 2.11081E-5 * d,
        i = 1.8497 - 1.78E-8 * d,
        w = 286.5016 + 2.92961E-5 * d,
        a = 1.523688,
        e = 0.093405 + 2.516E-9 * d,
        M = 18.6021 + 0.5240207766 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Jupiter: function(d) {
    var N = 100.4542 + 2.76854E-5 * d,
        i = 1.3030 - 1.557E-7 * d,
        w = 273.8777 + 1.64505E-5 * d,
        a = 5.20256,
        e = 0.048498 + 4.469E-9 * d,
        M = 19.8950 + 0.0830853001 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Saturn: function(d) {
    var N = 113.6634 + 2.38980E-5 * d,
        i = 2.4886 - 1.081E-7 * d,
        w = 339.3939 + 2.97661E-5 * d,
        a = 9.55475,
        e = 0.055546 - 9.499E-9 * d,
        M = 316.9670 + 0.0334442282 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Uranus: function(d) {
    var N = 74.0005 + 1.3978E-5 * d,
        i = 0.7733 + 1.9E-8 * d,
        w = 96.6612 + 3.0565E-5 * d,
        a = 19.18171 - 1.55E-8 * d,
        e = 0.047318 + 7.45E-9 * d,
        M = 142.5905 + 0.011725806 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Neptune: function(d) {
    var N = 131.7806 + 3.0173E-5 * d,
        i = 1.7700 - 2.55E-7 * d,
        w = 272.8461 - 6.027E-6 * d,
        a = 30.05826 + 3.313E-8 * d,
        e = 0.008606 + 2.15E-9 * d,
        M = 260.2471 + 0.005995147 * d;
    var ecl = this.eclrect(N, i, MUtil.ang360(w), a, e, MUtil.ang360(M)),
        xg = ecl[0],
        yg = ecl[1],
        zg = ecl[2],
        r = Math.sqrt( xg*xg+yg*yg+zg*zg );
    return [ xg, yg, zg, r ];
  },
  Pluto: function(d) {
    // Pluto some code
  },
  loadSun: function(time) {
    var d = this.timeScale(time);
    var ps = this.Sun(d),
        ecl = this.ecl2eq(ps[0], ps[1], ps[2], d),
        eq = MVector.rect2spheric(ecl[0], ecl[1], ecl[2]);
    return [ MUtil.ang360(eq[0] * 180/Math.PI) * Math.PI/180, eq[1], -26, 'Sun', 'Sun' ];
  },
  loadMoon: function(time) {
    var d = this.timeScale(time);
    var ps = this.Moon(d),
        ecl = this.ecl2eq(ps[0], ps[1], ps[2], d),
        eq = MVector.rect2spheric(ecl[0], ecl[1], ecl[2]);
    return [ MUtil.ang360(eq[0] * 180/Math.PI) * Math.PI/180, eq[1], -11, 'Moon', 'Moon' ];
  },
  /**
  * Return planet's position (ra,dec) on TIME in portion days.
  */ 
  loadPlanets: function(time) {
    var d = this.timeScale(time);
    var mplanets = [];
    var pos = {
      Mercury: this.Mercury(d),
      Venus: this.Venus(d), 
      Mars: this.Mars(d), 
      Jupiter: this.Jupiter(d), 
      Saturn: this.Saturn(d), 
      Uranus: this.Uranus(d), 
      Neptune: this.Neptune(d)
    };
    for(var i in pos) {
      var ps = pos[i],
          ecl = this.ecl_helio2geo(ps[0], ps[1], ps[2], ps[3], d),
          ecl = this.ecl2eq(ecl[0], ecl[1], ecl[2], d),
          eq = MVector.rect2spheric(ecl[0], ecl[1], ecl[2]);
      mplanets.push([ MUtil.ang360(eq[0] * 180/Math.PI) * Math.PI/180, eq[1], 2, i, i ]);
    }
    return mplanets;
  }
}
