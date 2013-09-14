// cities.html func
function draw() {
  var centerof, citylist = document.getElementById('citylist');;
  for (var i=0; i<citylist.options.length; i++) {
    var opt = citylist.options[i];
    if (opt.selected) {
      var coords = eval("[" + opt.value + "]");
      if (!centerof) centerof = coords;
      dw.loadCarta([['DotPort', opt.text, [coords], opt.text, null, 1]]);
    }
  }
  if (centerof) {
    var points = dw.toPoints(centerof, true);
    dw.centerCarta(points[0] + dw.m.offset[0], points[1] + dw.m.offset[1]);
  }
  dw.draw();
}
function refresh() {
  window.location.reload(false);
}
function init() {
  var mtab = document.createElement("table");
  mtab.width = "100%";
  var tb = document.createElement("tbody");
  mtab.appendChild(tb);
  var row = document.createElement("tr");
  row.style.backgroundColor = "rgb(230,230,230)";
  tb.appendChild(row);

  var col = document.createElement("td");
  col.width = "15%";
  var el = document.createElement("h2");
  el.appendChild(document.createTextNode("World's Cities"));
  el.style.margin = "0";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.align = "center";
  col.id = "coords";
  row.appendChild(col);

  var row = document.createElement("tr");
  tb.appendChild(row);

  var col = document.createElement("td");
  col.width = "15%";
  col.style.borderWidth = "1";
  col.style.borderStyle = "solid";
  col.style.verticalAlign = "top";
  var el = document.createElement('div');
  el.appendChild(document.createTextNode("Cities by country:"));    
  col.appendChild(el);
  var citylist = el2 = document.createElement("select");
  el2.id = "citylist"
  el2.multiple="true";
  el2.size = "20";
  el = document.createElement('div');    
  el.appendChild(el2);
  col.appendChild(el);
  el = document.createElement('div');    
  var el2 = document.createElement('button');
  el2.onclick = draw;
  el2.appendChild(document.createTextNode("show"));
  el.appendChild(el2);
  el2 = document.createElement('button');
  el2.onclick = refresh;
  el2.appendChild(document.createTextNode("refresh"));
  el.appendChild(el2);
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.id = "canvasmap";
  row.appendChild(col);
  document.body.appendChild(mtab);

  dw = new dbCarta("canvasmap");
  dw.changeProject(101);
  var points = dw.toPoints([0, 40], true);
  dw.centerCarta(points[0], points[1]);
  dw.loadCarta(window.CONTINENTS);
  dw.loadCarta(dw.createMeridians());
  dw.draw();

  for (var cntryname in window.CITIES) {
    el = document.createElement("optgroup");
    el.label = cntryname;
    for (var mpart in window.CITIES[cntryname]) {
      el2 = document.createElement("option");
      el2.value = window.CITIES[cntryname][mpart][1];
      el2.appendChild(document.createTextNode(window.CITIES[cntryname][mpart][0]));
      el.appendChild(el2);
    }
    citylist.appendChild(el);
  }
  window.CONTINENTS = undefined;
  window.CITIES = undefined;
  // curr. object
  dw.clfunc.onmousemove = function(sd, dd) {
    var mcoord = document.getElementById("coords");
    var label = "";
    if (dw.m.pmap) {
       var o = dw.mflood[dw.m.pmap];
       label = o['label'] + " : " + o['coords'];
    }
    mcoord.innerHTML = label;
  }
}
