/**
 * XmlHttpRequest updater.
 * egax, 2013
 */
var upfunc = function(item){
  // par [{[id:%,]url:%[,params:%,mycallback:%]},...] 
  var success = function(r){
    if (r.readyState == 4) {
      if ('el' in r.obj) r.obj.el.innerHTML=r.responseText;
      if ('mycallback' in r.obj) r.obj.mycallback(r);
    }
  }
  if (item.id) item.el = document.getElementById(item.id);
  //if (item.loadMask) item.el.innerHTML = item.loadMask;
  //if (item.nocache) item.url += '&' + Math.random();
  var req = new XMLHttpRequest();
  req.obj = item;
  req.onreadystatechange = function () { success(req) };
  req.open("GET", item.url, true);
  req.send(null);
}