// sample.html func
function scale() {
  var scale = parseFloat(document.getElementById("scale").value);
  dw.scaleCarta(1); // fix labels
  dw.scaleCarta(scale);
  dw.draw();
}
function turn() {
  var cx = parseFloat(document.getElementById("turnx").value),
      cy = parseFloat(document.getElementById("turny").value);
  if (!isNaN(cx) && !isNaN(cy))
    if (dw.isSpherical()) {
      var proj = dw.initProj();
      cx += proj.long0 * 180/Math.PI;
      cy += proj.lat0 * 180/Math.PI;
      dw.initProj(' +lon_0=' + cx + ' +lat_0=' + cy);
      dw.draw();
    }
}
function proj() {
  dw.changeProject(document.getElementById('projlist').value);
  dw.draw();
}
function draw() {
  try {
    coords = eval(document.getElementById('getcoords').value); coords.length; } 
  catch (e) { 
     alert("Invalid coords!\nUse:\n[[1,2],[3,4],..]"); return; }
  dw.loadCarta([[ document.getElementById("ftype").value, Math.random(), coords, 'MyTest', coords[0], true ]], 1);
}
function init() {
  var mtab = document.createElement("table");
  mtab.width = "100%";
  var row = document.createElement("tr");
  row.style.backgroundColor = "rgb(230,230,230)";
  mtab.appendChild(row);

  var col = document.createElement("td");
  col.width = "15%";
  var el = document.createElement("h2");
  el.appendChild(document.createTextNode("Sample"));
  el.style.padding = "0";
  el.style.margin = "0";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "10%";
  col.align = "center";
  var el = document.createElement("input");
  el.type = "text";
  el.size= "3";
  el.id = "scale";
  el.value= "1";
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = scale;
  el.appendChild(document.createTextNode("scale"));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "15%";
  col.align = "center";
  el = document.createElement("input");
  el.type = "text";
  el.size= "4";
  el.id = "turnx";
  el.value= "10";
  col.appendChild(el);
  el = document.createElement("input");
  el.type = "text";
  el.size= "4";
  el.id = "turny";
  el.value= "10";
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = turn;
  el.appendChild(document.createTextNode("turn"));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "10%";
  col.align = "center";
  col.appendChild(document.createTextNode(" proj "));
  var projlist = el = document.createElement("select");
  el.id = "projlist";
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "30%";
  col.align = "center";
  el = document.createElement("select");
  el.id = "ftype";
  var el2 = document.createElement("option");
  el2.value = "Line";
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  el2 = document.createElement("option");
  el2.value = "Area";
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  el2 = document.createElement("option");
  el2.value = "DotPort";
  el2.appendChild(document.createTextNode(el2.value));
  el.appendChild(el2);
  col.appendChild(el);
  el = document.createElement("input");
  el.type = "text";
  el.id = "getcoords";
  col.appendChild(el);
  el = document.createElement('button');
  el.onclick = draw;
  el.appendChild(document.createTextNode("draw"));
  col.appendChild(el);
  row.appendChild(col);

  var col = document.createElement("td");
  col.width = "15%";
  col.align = "center";
  col.id = "coords";
  row.appendChild(col);
  document.body.appendChild(mtab);

  dw = new dbCarta();
  dw.loadCarta(window.CONTINENTS);
  window.CONTINENTS = undefined;
  dw.loadCarta(dw.createMeridians());
  // point of view
  dw.loadCarta([['DotPort', '1', [[-25,40]], 'POV']]);
  dw.draw();
  // projlist
  for(var i in dw.proj) {
    var projname = dw.proj[i].split(' ')[0].split('=')[1];
    el = document.createElement("option");
    el.value = i;
    el.appendChild(document.createTextNode(projname));
    projlist.appendChild(el);
  }
  projlist.onchange = proj;
  // curr. coords
  dw.clfunc.onmousemove = function(sd, dd) {
    mcoord = document.getElementById("coords");
    mcoord.innerHTML = " X: Y:";
    if (dd) mcoord.innerHTML = " X: " + dd[0].toFixed(2) + " Y: " + dd[1].toFixed(2);
  }
}
