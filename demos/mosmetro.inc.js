// mosmetro.html func
function findstation(){
  var centerofpts, stationlist = document.getElementById('stationlist');
  for (var i=0; i<stationlist.options.length; i++) {
    var opt = stationlist.options[i];
    if (opt.selected) {
      var centerofpts = dw.mflood[opt.value]['pts'];
      break;
    }
  }
  if (centerofpts) {
    dw.centerCarta(centerofpts[0][0] + dw.m.offset[0], centerofpts[0][1] + dw.m.offset[1]);
    dw.draw();
  }
}
function init() {
  var mtab = document.createElement("table");
  mtab.width = "100%";
  var row = document.createElement("tr");
  row.style.backgroundColor = "rgb(230,230,230)";
  mtab.appendChild(row);

  var col = document.createElement("td");
  col.width = "25%";
  var el = document.createElement("h2");
  el.appendChild(document.createTextNode("Московское Метро"));
  el.style.padding = "0";
  el.style.margin = "0";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "40%";
  col.align = "center";
  col.appendChild(document.createTextNode("Станции "));
  var stationlist = el = document.createElement("select");
  el.id = "stationlist";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.align = "center";
  col.id = "coords";
  row.appendChild(col);
  document.body.appendChild(mtab);

  dw = new dbCarta();
  dw.style.backgroundColor = "white";
  // define new layers
  var route = function(o){ return dw.extend({cls: "Line", width: 5, anchor: ['start', 'middle'], labelscale: 1}, o||{}) },
      route_d = function(o){ return route(dw.extend({dash: [2,4]}, o||{})) },
      interchange = function(o){ return route(dw.extend({fg: "#000000", join: 'round', cap: 'round', width: 8}, o||{})) },
      interchange_d = function(o) { return interchange(dw.extend({fg: "#FFFFFF", width: 7}, o||{})) },
      river = function(o){ return route(dw.extend({fg: "#E2FCFC", join: 'round', cap: 'round', labelcolor: '#5555FF', labelscale: 0}, o||{})) },
      aeroexpress = function(o){ return route(dw.extend({fg: "#DDDDDD"}, o||{})) },
      aeroexpress_d = function(o){ return route(dw.extend({fg: "#FFFFFF", width: 4, dash: [10,10]}, o||{})) },
      station = function(o){ return dw.extend({cls: "Dot", bg: "white", size: 2, width: 5, labelscale: 1}, o||{}) },
      inst = function(o){ return station(dw.extend({size: 3, labelcolor: o['fg'], bg: o['fg']}, o)) },
      inst_d = function(o){ return inst(dw.extend({size: 2, width: 1}, o||{})) };
  // lines
  dw.extend(dw.mopt, {
    "r1": route({fg: "#ED1B35"}),
    "r2": route({fg: "#44B85C"}),
    "r3": route({fg: "#0078BF"}),
    "r4": route({fg: "#19C1F3"}),
    "r5": route({fg: "#894E35"}),
    "r6": route({fg: "#F58631"}),
    "r7": route({fg: "#8E479C"}),
    "r8": route({fg: "#FFCB31"}),
    "r9": route({fg: "#A1A2A3"}),
    "r10": route({fg: "#B3D445"}),
    "r11": route({fg: "#79CDCD"}),
    "r12": route({fg: "#ACBFE1"}),
    "rTPK": route_d({fg: "#554D26"}),
    "rKOZH": route_d({fg: "#DE62BE"})
  });
  // lines ext
  dw.extend(dw.mopt, {
    "r1_ext": route_d({fg: dw.mopt["r1"].fg}),
    "r2_ext": route_d({fg: dw.mopt["r2"].fg}),
    "r6_ext": route_d({fg: dw.mopt["r6"].fg}),
    "r7_ext": route_d({fg: dw.mopt["r7"].fg}),
    "r8_ext": route_d({fg: dw.mopt["r8"].fg}),
    "r10_ext": route_d({fg: dw.mopt["r10"].fg}),
    "r12_ext": route_d({fg: dw.mopt["r12"].fg})
  });
  // interchanges
  dw.extend(dw.mopt, {
    "interchange": interchange(),
    "interchange_d": interchange_d()
  });
  // rivers
  dw.extend(dw.mopt, {
    "moskva_canal": river({width: 5, rotate: -90}),
    "strogino_lake_exit": river({cls: 'Polygon', bg: river().fg, width: 5}),
    "vodootvodny_canal": river({width: 5}),
    "yauza_river": river({width: 5, rotate: 45, anchor: ['start', 'top']}),
    "Nagatino_Kozhukhovo": river({width: 5}),
    "Nagatino_poyma": river({width: 6}),
    "grebnoy_canal": river({width: 3}),
    "moskva_river": river({width: 15, rotate: 45, anchor: ['start', 'top']})
  });
  // rails
  dw.extend(dw.mopt, {
    "monorail": route({fg: "#2C87C5", width: 2, labelcolor: "#2C87C5", anchor: ['start', 'bottom']}),
    "monorail_legend": route({fg: "#2C87C5", width: 2}),
    "sheremetyevo_express_line": aeroexpress({anchor: ['end', 'top']}),
    "sheremetyevo_express_line_d": aeroexpress_d({anchor: ['end', 'top']}),
    "vnukovo_express_line": aeroexpress({anchor: ['start', 'top']}),
    "vnukovo_express_line_d": aeroexpress_d({anchor: ['end', 'top']}),
    "domodedovo_express_line": aeroexpress({anchor: ['start', 'top']}),
    "domodedovo_express_line_d": aeroexpress_d()
  });
  // stations
  dw.extend(dw.mopt, {
    "s1": station({fg: dw.mopt["r1"].fg}),
    "s1_1": inst({fg: dw.mopt["r1"].fg, anchor: ['start', 'top']}),
    "s1_2": inst({fg: dw.mopt["r1"].fg, anchor: ['end', 'top']}),
    "s2": station({fg: dw.mopt["r2"].fg}),
    "s2_1": inst({fg: dw.mopt["r2"].fg, anchor: ['start', 'middle']}),
    "s2_2": inst({fg: dw.mopt["r2"].fg, anchor: ['end', 'bottom']}),
    "s2_3": inst({fg: dw.mopt["r2"].fg, anchor: ['start', 'bottom']}),
    "s2_4": station({fg: dw.mopt["r2"].fg, anchor: ['end', 'bottom']}),
    "s2_5": inst({fg: dw.mopt["r2"].fg, anchor: ['end', 'top']}),
    "s2_6": station({fg: dw.mopt["r2"].fg, anchor: ['start', 'top']}),
    "s3": station({fg: dw.mopt["r3"].fg}),
    "s3_1": station({fg: dw.mopt["r3"].fg, anchor: ['end', 'bottom']}),
    "s3_2": station({fg: dw.mopt["r3"].fg, anchor: ['end', 'top']}),
    "s3_3": inst({fg: dw.mopt["r3"].fg, anchor: ['end', 'bottom']}),
    "s3_4": inst({fg: dw.mopt["r3"].fg, anchor: ['start', 'bottom']}),
    "s3_5": inst({fg: dw.mopt["r3"].fg, anchor: ['end', 'top']}),
    "s3_6": inst({fg: dw.mopt["r3"].fg, anchor: ['start', 'bottom']}),
    "s4": station({fg: dw.mopt["r4"].fg}),
    "s4_1": station({fg: dw.mopt["r4"].fg, anchor: ['end', 'top']}),
    "s4_2": inst({fg: dw.mopt["r4"].fg, anchor: ['end', 'bottom']}),
    "s4_3": station({fg: dw.mopt["r4"].fg, anchor: ['start', 'bottom']}),
    "s4_4": inst({fg: dw.mopt["r4"].fg, anchor: ['end', 'top']}),
    "s4_5": inst_d({fg: dw.mopt["r4"].fg}),
    "s4_6": station({fg: dw.mopt["r4"].fg, anchor: ['center', 'bottom']}),
    "s5": inst({fg: dw.mopt["r5"].fg}),
    "s5_1": inst({fg: dw.mopt["r5"].fg, anchor: ['end', 'bottom']}),
    "s5_2": inst({fg: dw.mopt["r5"].fg, anchor: ['start', 'top']}),
    "s6": station({fg: dw.mopt["r6"].fg}),
    "s6_1": station({fg: dw.mopt["r6"].fg, anchor: ['end', 'top']}),
    "s6_2": inst({fg: dw.mopt["r6"].fg}),
    "s6_3": inst({fg: dw.mopt["r6"].fg, anchor: ['end', 'bottom']}),
    "s6_4": inst({fg: dw.mopt["r6"].fg, anchor: ['start', 'top']}),
    "s7": station({fg: dw.mopt["r7"].fg, anchor: ['end', 'bottom']}),
    "s7_1": inst({fg: dw.mopt["r7"].fg, anchor: ['end', 'bottom']}),
    "s7_2": inst({fg: dw.mopt["r7"].fg, anchor: ['start', 'bottom']}),
    "s7_3": inst({fg: dw.mopt["r7"].fg, anchor: ['start', 'top']}),
    "s7_4": station({fg: dw.mopt["r7"].fg, anchor: ['start', 'bottom']}),
    "s7_5": inst_d({fg: dw.mopt["r7"].fg}),
    "s8": station({fg: dw.mopt["r8"].fg}),
    "s8_1": inst({fg: dw.mopt["r8"].fg}),
    "s8_2": inst({fg: dw.mopt["r8"].fg, anchor: ['start', 'bottom']}),
    "s8_3": inst({fg: dw.mopt["r8"].fg, anchor: ['start', 'top']}),
    "s8_4": inst({fg: dw.mopt["r8"].fg, anchor: ['end', 'top']}),
    "s8_5": inst({fg: dw.mopt["r8"].fg, anchor: ['end', 'bottom']}),
    "s8_6": inst_d({fg: dw.mopt["r8"].fg}),
    "s9": station({fg: dw.mopt["r9"].fg, anchor: ['start', 'bottom']}),
    "s9_1": inst({fg: dw.mopt["r9"].fg, anchor: ['end', 'bottom']}),
    "s9_2": inst({fg: dw.mopt["r9"].fg, anchor: ['start', 'bottom']}),
    "s9_3": inst({fg: dw.mopt["r9"].fg, anchor: ['start', 'bottom']}),
    "s9_4": station({fg: dw.mopt["r9"].fg, anchor: ['end', 'bottom']}),
    "s10": station({fg: dw.mopt["r10"].fg,  anchor: ['end', 'bottom']}),
    "s10_1": station({fg: dw.mopt["r10"].fg, anchor: ['start', 'bottom']}),
    "s10_2": inst({fg: dw.mopt["r10"].fg, anchor: ['start', 'bottom']}),
    "s10_3": inst({fg: dw.mopt["r10"].fg, anchor: ['end', 'top']}),
    "s10_4": inst_d({fg: dw.mopt["r10"].fg}),
    "s11": station({fg: dw.mopt["r11"].fg, anchor: ['start', 'bottom']}),
    "s11_1": inst({fg: dw.mopt["r11"].fg, anchor: ['start', 'top']}),
    "s11_2": inst_d({fg: dw.mopt["r11"].fg}),
    "s12": station({fg: dw.mopt["r12"].fg, anchor: ['center', 'bottom']}),
    "s12_1": station({fg: dw.mopt["r12"].fg, anchor: ['center', 'top']}),
    "s12_2": station({fg: dw.mopt["r12"].fg, anchor: ['start', 'top']}),
    "s12_3": station({fg: dw.mopt["r12"].fg, anchor: ['end', 'bottom']}),
    "s12_4": inst({fg: dw.mopt["r12"].fg, anchor: ['start', 'bottom']}),
    "s12_5": inst({fg: dw.mopt["r12"].fg, anchor: ['start', 'top']}),
    "sTPK": station({fg: dw.mopt["rTPK"].fg, anchor: ['start', 'top']}),
    "sTPK_1": station({fg: dw.mopt["rTPK"].fg, anchor: ['start', 'bottom']}),
    "sTPK_2": station({fg: dw.mopt["rTPK"].fg, anchor: ['end', 'bottom']}),
    "sTPK_3": inst({fg: dw.mopt["rTPK"].fg, anchor: ['start', 'top']}),
    "sTPK_4": inst({fg: dw.mopt["rTPK"].fg, anchor: ['end', 'bottom']}),
    "sTPK_5": inst({fg: dw.mopt["rTPK"].fg, anchor: ['start', 'bottom']}),
    "sTPK_6": inst_d({fg: dw.mopt["rTPK"].fg}),
    "sTPK_7": station({fg: dw.mopt["rTPK"].fg, anchor: ['center', 'bottom']}),
    "sKOZH": station({fg: dw.mopt["rKOZH"].fg, anchor: ['start', 'bottom']}),
    "sKOZH_1": station({fg: dw.mopt["rKOZH"].fg, anchor: ['end', 'bottom']}),
    "sKOZH_2": inst({fg: dw.mopt["rKOZH"].fg, anchor: ['start', 'bottom']}),
    "sKOZH_3": inst_d({fg: dw.mopt["rKOZH"].fg}),
    "sMono": inst({fg: dw.mopt["monorail"].fg, size: 1, anchor: ['start', 'top']}),
    "sMono_1": inst({fg: dw.mopt["monorail"].fg, size: 1, anchor: ['start', 'middle']})
  });
  dw.loadCarta(window.MLINES);
  dw.loadCarta(window.MSTATIONS);
  dw.draw();
  // station list
  window.MSTATIONS.sort(function(a,b){return a[1]>b[1]});
  for (var i in window.MSTATIONS) {
    if (!window.MSTATIONS[i][3]) continue;
    var el = document.createElement("option");
    el.value = window.MSTATIONS[i][0] + "_" + window.MSTATIONS[i][1];
    el.appendChild(document.createTextNode(window.MSTATIONS[i][3]));
    stationlist.appendChild(el);
  }
  stationlist.onchange = findstation;
  window.MLINES = undefined;
  window.MSTATIONS = undefined;
  // curr.object
  dw.clfunc.onmousemove = function() {
    var mcoord = document.getElementById("coords");
    var label = "";
    if (dw.m.pmap) {
      var o = dw.mflood[dw.m.pmap];
      label = o['label'];
    }
    mcoord.innerHTML = label;
  }
}
