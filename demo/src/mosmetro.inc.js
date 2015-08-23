/**
 * Moscow Metro map.
 * View lines and stations with additional info.
 * egax@bk.ru, 2013-15.
 */
function rotate() {
  var tval = parseFloat(document.getElementById('tvalue').value);
  dw.rotateCarta(tval);
  dw.draw();
}
function findstation(){
  var stationlist = document.getElementById('stationlist'),
      opt = stationlist.options[stationlist.selectedIndex];
  if (opt) {
    var centerofpts = dw.mflood[opt.value]['pts'];
    dw.centerCarta(centerofpts[0][0] + dw.m.offset[0], centerofpts[0][1] + dw.m.offset[1]);
    dw.draw();
    drawcrosshair();
  }
}
function drawcrosshair() {
  var ctx = dw.getContext('2d');
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.beginPath();
  ctx.moveTo(dw.width/2.0, 0);
  ctx.lineTo(dw.width/2.0, dw.height);
  ctx.moveTo(0, dw.height/2.0);
  ctx.lineTo(dw.width, dw.height/2.0);
  ctx.lineWidth = 15;
  ctx.strokeStyle = 'rgba(100,100,200,0.2)';
  ctx.stroke();
  ctx.restore();
}
// tooltip under cursor
function infobox(ev, label) {
  var mtip = document.getElementById('maptooltip');
  if (dw.m.pmap && label) {
    mtip.innerHTML = label;
    mtip.style.display = 'block';
    mtip.style.left = ev.clientX + window.pageXOffset + 'px';
    mtip.style.top = ev.clientY + window.pageYOffset - mtip.offsetHeight * 1.2 + 'px';
  } else {
    mtip.style.display = 'none';
  }
}
function init() {
  var mtab = document.createElement('table');
  mtab.style.borderCollapse = 'collapse';
  var row = document.createElement('tr');
  row.style.height = '1px';
  row.style.backgroundColor = '#d2e0f0';
  mtab.appendChild(row);

  var col = document.createElement('td');
  col.width = '30%';
  var el = document.createElement('h2');
  el.appendChild(document.createTextNode('Московское метро'));
  el.style.padding = '0';
  el.style.margin = '0';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '15%';
  col.align = 'center';
  var el = document.createElement('input');
  el.type = 'text';
  el.size = '3';
  el.id = 'tvalue';
  el.value = '10';
  col.appendChild(el);
  var el = document.createElement('button');
  el.onclick = rotate;
  el.appendChild(document.createTextNode('rotate'));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '30%';
  col.align = 'center';
  col.style.whiteSpace = 'nowrap';
  col.appendChild(document.createTextNode('Станции '));
  var stationlist = el = document.createElement('select');
  el.id = 'stationlist';
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement('td');
  col.align = 'center';
  col.id = 'tcoords';
  row.appendChild(col);
  document.body.appendChild(mtab);

  var row = document.createElement('tr');
  var col = document.createElement('td');
  col.colSpan = '10';
  col.id = 'mcol';
  col.style.padding = "0";
  row.appendChild(col);
  mtab.appendChild(row);
  document.body.appendChild(mtab);

  // domap tooltip
  var el = document.createElement('div');
  el.id = 'maptooltip';
  el.style.padding = '5px';
  el.style.color = '#333333';
  el.style.font = '12px Verdana';
  el.style.border = '2px solid rgba(19,64,117,0.5)';
  el.style.borderRadius = '4px';
  el.style.backgroundColor = 'rgba(250,250,250,0.9)';
  el.style.position = 'absolute';
  el.style.zIndex = '10000';
  el.onmousemove = function(){ this.innerHTML = ''; };
  document.body.appendChild(el);

  dw = new dbCarta({
    id: 'mcol',
    height: col.offsetHeight,
    viewportx: 220,
    viewporty: 220,
    scalebg: 'rgba(100,200,100,0.2)'
  });
  dw.style.backgroundColor = 'white';
  // define new layers
  var route = function(o){ return dw.extend({cls: 'Line', width: 5, anchor: ['start', 'middle'], labelscale: 1}, o||{}) },
      route_d = function(o){ return route(dw.extend({dash: [2,4]}, o||{})) },      
      interchange = function(o){ return route(dw.extend({fg: '#000000', join: 'round', cap: 'round', width: 8}, o||{})) },
      interchange_d = function(o) { return interchange(dw.extend({fg: '#ffffff', width: 7}, o||{})) },
      river = function(o){ return route(dw.extend({fg: '#e2fcfc', join: 'round', cap: 'round', labelcolor: '#5555ff', labelscale: 0}, o||{})) },
      aeroexpress = function(o){ return route(dw.extend({fg: '#dddddd', labelscale: 0}, o||{})) },
      aeroexpress_d = function(o){ return route(dw.extend({fg: '#ffffff', labelscale: 0, width: 4, dash: [10,10]}, o||{})) },
      label = function(o){ return dw.extend({cls: 'Label', labelscale: 1, anchor: ['start', 'top']}, o||{}) },
      station = function(o){ return dw.extend({cls: 'Rect', bg: 'white', size: 5, width: 3, scale: 1, labelscale: 1}, o||{}) },
      inst = function(o){ return station(dw.extend({size: 3, labelcolor: o['fg'], bg: o['fg']}, o)) },
      inst_d = function(o){ return inst(dw.extend({size: 2, width: 1}, o||{})) };
  // lines
  dw.extend(dw.mopt, {
    'r1': route({fg: '#ed1b35'}),
    'r2': route({fg: '#44b85c'}),
    'r3': route({fg: '#0078bf'}),
    'r4': route({fg: '#19c1f3'}),
    'r5': route({fg: '#894e35'}),
    'r6': route({fg: '#f58631'}),
    'r7': route({fg: '#8e479c'}),
    'r8': route({fg: '#ffcb31'}),
    'r9': route({fg: '#a1a2a3'}),
    'r10': route({fg: '#b3d445'}),
    'r11': route({fg: '#79cdcd'}),
    'r12': route({fg: '#acbfe1'}),
    'rTPK': route_d({fg: '#554d26'}),
    'rKOZH': route_d({fg: '#de62be'})
  });
  // lines ext
  dw.extend(dw.mopt, {
    'r1_ext': route_d({fg: dw.mopt['r1'].fg}),
    'r2_ext': route_d({fg: dw.mopt['r2'].fg}),
    'r6_ext': route_d({fg: dw.mopt['r6'].fg}),
    'r7_ext': route_d({fg: dw.mopt['r7'].fg}),
    'r8_ext': route_d({fg: dw.mopt['r8'].fg}),
    'r10_ext': route_d({fg: dw.mopt['r10'].fg}),
    'r12_ext': route_d({fg: dw.mopt['r12'].fg})
  });
  // interchanges
  dw.extend(dw.mopt, {
    'interchange': interchange(),
    'interchange_d': interchange_d()
  });
  // rivers
  dw.extend(dw.mopt, {
    'moskva_canal': river({width: 5}),
    'moskva_canal_label': river({rotate: -90, anchor: ['start', 'middle']}),
    'strogino_lake_exit': river({cls: 'Polygon', bg: river().fg, width: 5}),
    'vodootvodny_canal': river({width: 5}),
    'yauza_river': river({width: 5}),
    'yauza_river_label': river({rotate: 45, anchor: ['start', 'top']}),
    'Nagatino_Kozhukhovo': river({width: 5}),
    'Nagatino_poyma': river({width: 6}),
    'grebnoy_canal': river({width: 3}),
    'moskva_river': river({width: 15}),
    'moskva_river_label': river({rotate: 45, anchor: ['start', 'top']})
  });
  // rails
  dw.extend(dw.mopt, {
    'monorail': route({fg: '#2c87c5', width: 2}),
    'monorail_legend': route({fg: '#2c87c5', width: 2}),
    'monorail_label': route({labelcolor: '#2c87c5', anchor: ['start', 'bottom']}),
    'sheremetyevo_express_line': aeroexpress(),
    'sheremetyevo_express_line_label': label({anchor: ['end', 'middle']}),
    'sheremetyevo_express_line_d': aeroexpress_d(),
    'sheremetyevo_express_line_d_label': label({anchor: ['end', 'top']}),
    'vnukovo_express_line': aeroexpress(),
    'vnukovo_express_line_label': label({anchor: ['start', 'middle']}),
    'vnukovo_express_line_d': aeroexpress_d(),
    'vnukovo_express_line_d_label': label({anchor: ['center', 'top']}),
    'domodedovo_express_line': aeroexpress(),
    'domodedovo_express_line_label': label({anchor: ['start', 'middle']}),
    'domodedovo_express_line_d': aeroexpress_d(),
    'domodedovo_express_line_d_label': label()
  });
  // stations
  dw.extend(dw.mopt, {
    's1': station({fg: dw.mopt['r1'].fg, anchor: ['start', 'middle']}),
    's1_1': inst({fg: dw.mopt['r1'].fg, anchor: ['start', 'middle']}),
    's1_2': inst({fg: dw.mopt['r1'].fg, anchor: ['end', 'middle']}),
    's1_3': inst({fg: dw.mopt['r1'].fg, anchor: ['end', 'bottom']}),
    's1_4': inst({fg: dw.mopt['r1'].fg, anchor: ['start', 'top']}),
    's2': station({fg: dw.mopt['r2'].fg}),
    's2_1': inst({fg: dw.mopt['r2'].fg}),
    's2_2': inst({fg: dw.mopt['r2'].fg, anchor: ['end', 'middle']}),
    's2_3': inst({fg: dw.mopt['r2'].fg, anchor: ['start', 'bottom']}),
    's2_4': station({fg: dw.mopt['r2'].fg, anchor: ['end', 'middle']}),
    's2_5': inst({fg: dw.mopt['r2'].fg, anchor: ['end', 'top']}),
    's2_6': station({fg: dw.mopt['r2'].fg, anchor: ['start', 'top']}),
    's3': station({fg: dw.mopt['r3'].fg, anchor: ['start', 'middle']}),
    's3_1': station({fg: dw.mopt['r3'].fg, anchor: ['end', 'middle']}),
    's3_2': station({fg: dw.mopt['r3'].fg, anchor: ['end', 'top']}),
    's3_3': inst({fg: dw.mopt['r3'].fg, anchor: ['end', 'bottom']}),
    's3_4': inst({fg: dw.mopt['r3'].fg, anchor: ['start', 'bottom']}),
    's3_5': inst({fg: dw.mopt['r3'].fg, anchor: ['end', 'top']}),
    's3_6': inst({fg: dw.mopt['r3'].fg, anchor: ['end', 'middle']}),
    's3_7': inst({fg: dw.mopt['r3'].fg, anchor: ['end']}),
    's4': station({fg: dw.mopt['r4'].fg}),
    's4_1': station({fg: dw.mopt['r4'].fg, anchor: ['end', 'hanging']}),
    's4_2': inst({fg: dw.mopt['r4'].fg, anchor: ['end', 'middle']}),
    's4_3': station({fg: dw.mopt['r4'].fg, anchor: ['start', 'bottom']}),
    's4_4': inst({fg: dw.mopt['r4'].fg, anchor: ['end', 'top']}),
    's4_5': inst_d({fg: dw.mopt['r4'].fg}),
    's4_6': station({fg: dw.mopt['r4'].fg, anchor: ['center', 'bottom']}),
    's5': inst({fg: dw.mopt['r5'].fg}),
    's5_1': inst({fg: dw.mopt['r5'].fg, anchor: ['end', 'bottom']}),
    's5_2': inst({fg: dw.mopt['r5'].fg, anchor: ['start', 'top']}),
    's6': station({fg: dw.mopt['r6'].fg, anchor: ['start', 'middle']}),
    's6_1': station({fg: dw.mopt['r6'].fg, anchor: ['end', 'middle']}),
    's6_2': inst({fg: dw.mopt['r6'].fg, anchor: ['start', 'middle']}),
    's6_3': inst({fg: dw.mopt['r6'].fg, anchor: ['end', 'bottom']}),
    's6_4': inst({fg: dw.mopt['r6'].fg, anchor: ['start', 'top']}),
    's6_5': inst({fg: dw.mopt['r6'].fg, anchor: ['end', 'middle']}),
    's7': station({fg: dw.mopt['r7'].fg, anchor: ['end', 'middle']}),
    's7_1': inst({fg: dw.mopt['r7'].fg, anchor: ['end', 'middle']}),
    's7_2': inst({fg: dw.mopt['r7'].fg, anchor: ['start', 'bottom']}),
    's7_3': inst({fg: dw.mopt['r7'].fg, anchor: ['start', 'top']}),
    's7_4': station({fg: dw.mopt['r7'].fg, anchor: ['start', 'bottom']}),
    's7_5': inst_d({fg: dw.mopt['r7'].fg}),
    's7_6': inst({fg: dw.mopt['r7'].fg, anchor: ['start', 'middle']}),
    's7_7': station({fg: dw.mopt['r7'].fg, anchor: ['center', 'bottom']}),
    's8': station({fg: dw.mopt['r8'].fg, anchor: ['start', 'middle']}),
    's8_1': inst({fg: dw.mopt['r8'].fg}),
    's8_2': inst({fg: dw.mopt['r8'].fg, anchor: ['start', 'top']}),
    's8_4': inst({fg: dw.mopt['r8'].fg, anchor: ['end', 'top']}),
    's8_5': inst({fg: dw.mopt['r8'].fg, anchor: ['end', 'bottom']}),
    's8_6': inst_d({fg: dw.mopt['r8'].fg}),
    's9': station({fg: dw.mopt['r9'].fg, anchor: ['start', 'middle']}),
    's9_1': inst({fg: dw.mopt['r9'].fg, anchor: ['end', 'middle']}),
    's9_2': inst({fg: dw.mopt['r9'].fg, anchor: ['start', 'middle']}),
    's9_3': inst({fg: dw.mopt['r9'].fg, anchor: ['start', 'top']}),
    's9_4': station({fg: dw.mopt['r9'].fg, anchor: ['end', 'middle']}),
    's9_5': inst({fg: dw.mopt['r9'].fg, anchor: ['start', 'bottom']}),
    's9_6': inst({fg: dw.mopt['r9'].fg, anchor: ['end', 'bottom']}),
    's10': station({fg: dw.mopt['r10'].fg,  anchor: ['end', 'middle']}),
    's10_1': station({fg: dw.mopt['r10'].fg, anchor: ['start', 'middle']}),
    's10_2': inst({fg: dw.mopt['r10'].fg, anchor: ['start', 'middle']}),
    's10_3': inst({fg: dw.mopt['r10'].fg, anchor: ['end', 'top']}),
    's10_4': inst_d({fg: dw.mopt['r10'].fg}),
    's11': station({fg: dw.mopt['r11'].fg, anchor: ['center', 'bottom']}),
    's11_1': inst({fg: dw.mopt['r11'].fg, anchor: ['start', 'top']}),
    's11_2': inst_d({fg: dw.mopt['r11'].fg}),
    's12': station({fg: dw.mopt['r12'].fg, anchor: ['center', 'bottom']}),
    's12_1': station({fg: dw.mopt['r12'].fg, anchor: ['center', 'top']}),
    's12_2': station({fg: dw.mopt['r12'].fg, anchor: ['start', 'top']}),
    's12_3': station({fg: dw.mopt['r12'].fg, anchor: ['end', 'middle']}),
    's12_4': inst({fg: dw.mopt['r12'].fg, anchor: ['start', 'middle']}),
    's12_5': inst({fg: dw.mopt['r12'].fg, anchor: ['start', 'top']}),
    'sTPK': station({fg: dw.mopt['rTPK'].fg, anchor: ['start', 'top']}),
    'sTPK_1': station({fg: dw.mopt['rTPK'].fg, anchor: ['start', 'bottom']}),
    'sTPK_2': station({fg: dw.mopt['rTPK'].fg, anchor: ['end', 'middle']}),
    'sTPK_3': inst({fg: dw.mopt['rTPK'].fg, anchor: ['start', 'middle']}),
    'sTPK_4': inst({fg: dw.mopt['rTPK'].fg, anchor: ['end', 'bottom']}),
    'sTPK_5': inst_d({fg: dw.mopt['rTPK'].fg}),
    'sTPK_6': station({fg: dw.mopt['rTPK'].fg, anchor: ['center', 'bottom']}),
    'sTPK_7': station({fg: dw.mopt['rTPK'].fg, anchor: ['start', 'middle']}),
    'sTPK_8': station({fg: dw.mopt['rTPK'].fg, anchor: ['end', 'bottom']}),
    'sTPK_9': inst({fg: dw.mopt['rTPK'].fg, anchor: ['end', 'middle']}),
    'sKOZH': station({fg: dw.mopt['rKOZH'].fg, anchor: ['start', 'middle']}),
    'sKOZH_1': station({fg: dw.mopt['rKOZH'].fg, anchor: ['end', 'middle']}),
    'sKOZH_2': inst({fg: dw.mopt['rKOZH'].fg, anchor: ['start', 'middle']}),
    'sKOZH_3': inst_d({fg: dw.mopt['rKOZH'].fg, anchor: ['start', 'middle']}),
    'sMono': inst({fg: dw.mopt['monorail'].fg, size: 3, anchor: ['start', 'top']}),
    'sMono_1': inst({fg: dw.mopt['monorail'].fg, size: 3, anchor: ['start', 'middle']})
  });
  // callbacks
  dw.extend(dw.clfunc, {
    onmousemove: function(dw, sd, dd, ev) {
      var mcoord = document.getElementById('tcoords');
      var mtip, label = '';
      if (dw.m.pmap) {
        var o, m = dw.mflood[dw.m.pmap];
        label = m['label'] || m['ftag'];
        // tooltip
        mtip = label;
        if (INFOMST[dw.m.pmap]) {
          var st = INFOMST[dw.m.pmap];
          mtip = label + '<br>' + 'Открыта: ' + st[0] + '<br>' + 'Глубина: ' + st[1];
        }
      }
      // text
      mcoord.innerHTML = label;
      infobox(ev, mtip);
      dw.paintCoords(dd);
    }
  });
  dw.loadCarta([{0:'.Image', 1:'bg'}]); // first layer
//  dw.loadCarta(MLINES);
//  dw.loadCarta(MLEGEND);
  dw.loadCarta(MLABEL);
  dw.loadCarta(MSTATIONS);
  // bgimg from mlines
  var im = new Image();
  im.src = IMGDATA['mosmetro'];
  im.onload = function() {
    dw.loadCarta([{0:'.Image', 1:'bg', 2:[[-174.65,155.35],[170.2,-199.65]], 6:this}]);
    dw.m.bgimg = dw.mflood['.Image_bg']; // mark as bg
    dw.draw();
  };
  
  // fill station list
  MSTATIONS.sort(function(a,b){return (a[3]>b[3]) ? 1 : -1});
  for (var i in MSTATIONS) {
    if (!MSTATIONS[i][3]) continue;
    var el = document.createElement('option');
    el.value = MSTATIONS[i][0] + '_' + MSTATIONS[i][1];
    el.appendChild(document.createTextNode(MSTATIONS[i][3]));
    stationlist.appendChild(el);
  };
  stationlist.onchange = findstation;
  
  delete MLINES;
  delete MLEGEND;
  delete MLABEL;
  delete MSTATIONS;
}
