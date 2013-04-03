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
  * String date to array
  */
  parseDate: function(dt) {
    var dt = dt.split(" ");
    var d = dt[0].split("."),
        t = dt[1].split(":");
    return [parseInt(d[2]),parseInt(d[1]),parseInt(d[0]),parseInt(t[0]),parseInt(t[1]),parseInt(t[2])];
  },
  /**
  * Modified Julian Day MJD
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
  * Sidereal time in J2000
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
  * Calc stars pos on lonlat
  */
  renderSky: function(
    starsdata,    // array stars
    viewport,     // viewport in degrees
    skyRadius,    // degrees
    earthRadius,  // degrees
    center_x,     // degrees
    center_y,     // degrees
    time          // array date/time GMT
    ){

    var left = viewport[0], top = viewport[1],
        right = viewport[2], bottom = viewport[3];
    var cx = center_x * Math.PI/180,
        cy = center_y * Math.PI/180;
    
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
  }
}