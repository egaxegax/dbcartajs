// index.html func
// list demos with brief
function listDemos() {
  return [
    ['mosmetro.html', 'Moscow Metro', function() {
      var sp = document.createElement('span');
      var a = document.createElement('a');
      a.href = 'http://upload.wikimedia.org/wikipedia/commons/f/f3/Moscow_metro_map_ru_sb.svg';
      a.appendChild(document.createTextNode('SVG-карты'));
      sp.appendChild(document.createTextNode('Карта Московского Метрополитена 2013 с выбором станций. Переделена с '));
      sp.appendChild(a);
      var a = document.createElement('a');
      a.href = 'http://habrahabr.ru/post/193778';
      a.appendChild(document.createTextNode('Карта Московского Метро на Canvas'));
      sp.appendChild(document.createTextNode(' на Wikipedia. Загружается намного быстрее оригинала. Пунктирные линии строящихся станций отображаются только в Firefox (поддержка метода setDashLine в Canvas). Подробности в статье на Хабре "'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode('".'));
      return sp; }],
    ['mosrails.html', 'Moscow Rail Roads', function() {
      return document.createTextNode('Ещё одна карта на тему железных дорог. Схема пригородного ж/д транспорта Москвы и МО. ' + 
                                     'Оригинал этой карты можно видеть на стенах тамбуров подмосковных электричек под названием ' + 
                                     'Moscow Underground and Commuter Rail Map. Подробности на Хабре.'); }],
    ['starry.html', 'Starry Sky', function() {
      var sp = document.createElement('span');
      var a = document.createElement('a');
      a.href = 'http://habrahabr.ru/post/189692';
      a.appendChild(document.createTextNode('Звездное небо на Canvas'));
      sp.appendChild(document.createTextNode('Глобус на фоне звездного неба как в Orbitron, Marble, Xephem. Подробно написано в статье на Хабре "'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode('".'));
      return sp; }],
    ['merc.html', 'Avia Routes', function() {
      return document.createTextNode('На карте в проекции "Меркатор" изображены несколько стран со столицами. Города соединены маршрутными линиями.'); }],
    ['usemap.html', 'Area Map', function() {
      return document.createTextNode('Карта стран мира с возможностью наведения на них и выводом дополнительной информации по ним.'); }],
    ['noncart.html', 'Noncart', function() {
      return document.createTextNode('Выводим слово dbcarta по буквам в координатах.'); }],
    ['sample.html', 'Sample', function() {
      return document.createTextNode('Демо с возможностью нанесения объкетов с заданными координатами в выбранной проекции.'); }],
    ['cities.html', "World's Cities", function() {
      return document.createTextNode('Список крупнейших городов мира с возможностью выбора на карте в проекции "Меркатор".'); }],
    ['countries.html', "World's Countries", function() {
      return document.createTextNode('Список стран мира с возможностью выбора в различных проекциях.'); }]
  ];
}
function init() {
  var el = document.createElement('h2');
  el.style.textAlign = 'center';
  el.style.backgroundColor = 'rgb(230,230,230)';
  el.appendChild(document.createTextNode('dbCartajs - HTML5 Canvas map with some Proj4js projections'));
  document.body.appendChild(el);

  // anim table
  var mtab = document.createElement('table');
  mtab.width = '100%';
  var tb = document.createElement('tbody');
  mtab.appendChild(tb);
  var row = document.createElement('tr');
  tb.appendChild(row);

  var col = document.createElement('td');
  col.width = '20%';
  row.appendChild(col);

  var col = document.createElement('td');
  col.id = 'demo1';
  col.width = '30%';
  col.align = 'right';
  row.appendChild(col);

  var col = document.createElement('td');
  col.id = 'demo2';
  col.width = '30%';
  col.align = 'left';
  row.appendChild(col);

  var col = document.createElement('td');
  col.width = '20%';
  row.appendChild(col);
  document.body.appendChild(mtab);

  var el = document.createElement('p');
  el.style.textAlign = 'center';
  el.appendChild(document.createTextNode('It uses HTML5 Canvas 2D. Pure javascript and serverless. Draw, color, move, zoom map and objects.'));
  document.body.appendChild(el);
  
  var el = document.createElement('p');
  el.style.textAlign = 'center';
  el.appendChild(document.createTextNode('Карта-Навигатор с проекциями. Использует HTML5 Canvas 2D и JavaScript без сервера. Рисование, масштабирование объектов.'));
  document.body.appendChild(el);
  
  // demos table
  var mtab = document.createElement('table');
  mtab.align = 'center';
  mtab.width = '75%';
  //mtab.border = '1';
  var tb = document.createElement('tbody');
  mtab.appendChild(tb);
  var row = document.createElement('tr');
  tb.appendChild(row);

  var col = document.createElement('td');
  col.width = '60%';
  col.appendChild(document.createTextNode('Ищите больше разных карт в блоге на '));
  var el2 = document.createElement('a');
  el2.href = 'http://dbcartajs.blogspot.ru';
  el2.target = '_blank';
  el2.appendChild(document.createTextNode('dbcartajs.blogspot.ru.'));
  col.appendChild(el2);
  row.appendChild(col);
  
  // github source
  var col = document.createElement('td');
  col.align = 'center';
  var el = document.createElement('p');
  el.style.margin = '0';
  el.style.border = '1px solid #adadad';
  var el2 = document.createElement('a');
  el2.href = 'http://github.com/egaxegax/dbCartajs';
  el2.target = '_blank';
  el2.appendChild(document.createTextNode('Source Code'));
  el.appendChild(el2);
  col.appendChild(el);
  row.appendChild(col);
  document.body.appendChild(mtab);

  var row = document.createElement('tr');
  tb.appendChild(row);
  var col = document.createElement('td');
  col.colSpan = '2';
  var dl = document.createElement('dl');
  col.appendChild(dl);
  row.appendChild(col);
  for(var i in (mdemos=listDemos())){
    var div = document.createElement('div');
    if (i%2 == 0) div.style.backgroundColor = '#EEEEEE';
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    var a = document.createElement('a');
    a.href = mdemos[i][0];
    a.target = '_blank';
    a.appendChild(document.createTextNode(mdemos[i][1]));
    dt.appendChild(a);
    dd.appendChild(mdemos[i][2]());
    div.appendChild(dt);
    div.appendChild(dd);
    dl.appendChild(div);
  }

  // copyright
  var el = document.createElement('p');
  el.style.textAlign = 'center';
  el.style.fontSize = 'smaller';
  el.style.color = '#adadad';
  var el2 = document.createElement('a');
  el2.style.textAlign = 'center';
  el2.style.textDecoration = 'none';
  el2.style.color = 'inherit';
  el2.href = 'http://egaxegax.appspot.com/';
  el2.target = '_blank';
  el2.appendChild(document.createTextNode('egaxegax'));
  el.appendChild(el2);
  el.appendChild(document.createTextNode(', 2014'));
  document.body.appendChild(el);

  // add anim
  var cx = Math.random() * 360,
      cy = Math.random() * 180;
  dbcarta1 = new dbCarta({id: 'demo1'});
  dbcarta1.initProj(203, ' +lon_0=' + cx + ' +lat_0=' + cy);
  dbcarta1.loadCarta(CONTINENTS);
  dbcarta1.loadCarta(dbcarta1.createMeridians());
  dbcarta1.scaleCarta(1.4);
  dbcarta1.draw();
  dbcarta2 = new dbCarta({id: 'demo2'});
  dbcarta2.initProj(203, ' +lon_0=' + (180-cx) + ' +lat_0=' + (-cy/2.0));
  dbcarta2.loadCarta(CONTINENTS);
  dbcarta2.loadCarta(dbcarta2.createMeridians());
  dbcarta2.scaleCarta(1.4);
  delete CONTINENTS;
  dbcarta2.draw();
}