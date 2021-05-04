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

function childs(m, inst, root){
  var its = inst.filter(function(a){ return a.indexOf(String(m[root][2]))>-1; });
  var stIts = m.filter(function(a){ return makeid(a) != makeid(m[root]) && its.filter(function(b){ return b.indexOf(String(a[2]))>-1; }).length });
  var stItsi = stIts.map(function(a){ return makeind(m, makeid(a)); });
  var avails = [ root - 1, root + 1 ].concat(stItsi);
  var valids = avails.filter(function(cell){ return (cell >= 0 && cell < m.length); });
  var vertexes = valids.filter(function(cell){
//      console.log(root, cell, makeid(m[root]), makeid(m[cell]), String(m[cell][2]), String(m[root][2]),
//      maketip(m[cell]) == maketip(m[root]), String(m[cell][2]) == String(m[root][2]),
//      its.filter(function(a){ return a.indexOf(String(m[cell][2]))>-1 && a.indexOf(String(m[root][2]))>-1; }).length, its);
      return (maketip(m[cell]) == maketip(m[root])) || 
             String(m[cell][2]) == String(m[root][2]) ||
             (its.filter(function(a){ return a.indexOf(String(m[cell][2]))>-1 && a.indexOf(String(m[root][2]))>-1; }).length)
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
// to - destionation index of m
function BFS(m, inst, from, to){
  var tree = [];
  var visited = [];
  var q = [];
  q.push(from);
  while(q.length){
    var subroot = q.shift();
    visited.push(subroot.toString());
    if(subroot.toString() == to.toString()) return buildpath(m, tree, to);
    var child = childs(m, inst, subroot);
    for(var i in child){
      if(visited.indexOf(child[i].toString()) == -1){
        tree[child[i]] = subroot;
        if(child[i] == to) q.unshift(child[i]);
        else q.push(child[i]);
      }
    }
  }
  return [];
}
