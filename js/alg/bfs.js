// BFS breadth first search algorithm
// https://question-it.com/questions/158570/nahozhdenie-kratchajshego-puti-v-dvumernom-massive-javascript
//
// var m = [
//   [ 'A', '0', [[8,1]], 'B', 'A' ],
//   [ 'A', '1', [[9,1]], 'B', 'B' ],
//   [ 'A', '2', [[2,1]], 'A', 'A' ],
//   [ 'B', '0', [[3,1]], 'A', 'A' ],
//   [ 'B', '1', [[5,7]], 'A', 'A' ],
//   [ 'B', '2', [[4,1]], 'A', 'A' ]];
//  
// var inst = [['2,1'], ['3,1'], ['5,7']];
//   
// BFS(m, inst, makeind(m, 'A_0'), makeind(m, 'B_2')) // interchanges

function makeid(a){ return a[0] + '_' + a[1]; }

function maketip(a){ return a[0].split('_')[0]; }

function maketipn(a){ return a[0].split('_')[0].slice(1); }

function makeind(m, id){ return m.indexOf(m.filter(function(item){ return makeid(item) == id; }).pop()); }

function makecrds(m){ return m.map(function(a){ return a[2].map(function(b){ return String(b); }); }); }

function inarray(m, a){ return m.filter(function(b){ return String(a) == String(b); }).length; }

function findchilds(m, inst, current, stops){
  var its = inst.filter(function(a){ return a.indexOf(String(m[current][2]))>-1; });
  var stIts = m.filter(function(a){ return makeid(a) != makeid(m[current]) && its.filter(function(b){ return b.indexOf(String(a[2]))>-1; }).length });
  var stItsi = stIts.map(function(a){ return makeind(m, makeid(a)); });
  var avails = [ current - 1, current + 1 ].concat(stItsi);
  var valids = avails.filter(function(cell){ return (cell >= 0 && cell < m.length); });
  var vertexes = valids.filter(function(cell){
      // console.log(current, cell, makeid(m[current]), makeid(m[cell]), String(m[cell][2]), String(m[current][2]),
      //   stops.indexOf(cell) == -1, maketip(m[cell]) == maketip(m[current]), String(m[cell][2]) == String(m[current][2]),
      //   its.filter(function(a){ return a.indexOf(String(m[cell][2]))>-1 && a.indexOf(String(m[current][2]))>-1; }).length, its);
      return stops.indexOf(cell) == -1 &&
             (maketip(m[cell]) == maketip(m[current])) || 
             String(m[cell][2]) == String(m[current][2]) ||
             (its.filter(function(a){ return a.indexOf(String(m[cell][2]))>-1 && a.indexOf(String(m[current][2]))>-1; }).length)
    }
  );
  return vertexes;
}
function buildpath(m, tree, to){
  var path = [m[to]];
  var parent = tree[to];
  while(parent != undefined){
    path.push(m[parent]);
    parent = tree[parent];
  }
  return path.reverse();
}
// m - list of vertexes (stations)
// inst - list of interchange stations
// from - start index of m 
// to - destination index of m
// stops - list if vertexes where search stop (stations under constructed) 
function BFS(m, inst, from, to, stops){
  var tree = [];
  var visited = [];
  var q = [];
  q.push(from);
  while(q.length){
    var current = q.shift();
    visited.push(current.toString());
    if(current.toString() == to.toString()) return buildpath(m, tree, to);
    var childs = findchilds(m, inst, current, stops||[]);
    for(var c in childs){
      if(visited.indexOf(childs[c].toString()) == -1){
        tree[childs[c]] = current;
        if(childs[c] == to) q.unshift(childs[c]);
        else q.push(childs[c]);
      }
    }
  }
  return [];
}
