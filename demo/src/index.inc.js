// index.html func
// list demos with brief
function listDemos() {
  return [
    [['mosmetro.html'], ['Карта метро Москвы'], function() {
      var sp = document.createElement('span');
      var a = document.createElement('a');
      a.href = 'http://upload.wikimedia.org/wikipedia/commons/f/f3/Moscow_metro_map_ru_sb.svg';
      a.appendChild(document.createTextNode('SVG-карты'));
      sp.appendChild(document.createTextNode('Карта Московского Метрополитена 2015 с выбором станций. Переделена с '));
      sp.appendChild(a);
      var a = document.createElement('a');
      a.href = 'http://habrahabr.ru/post/193778';
      a.appendChild(document.createTextNode('Карта Московского Метро на Canvas'));
      sp.appendChild(document.createTextNode(' на Wikipedia. Загружается намного быстрее оригинала. Также добавлен вывод информации о станции при наведении. ' +
                                             'Пунктирные линии строящихся станций отображаются только в Firefox (поддержка метода setDashLine в Canvas). Подробности в статье на Хабре "'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode('".'));
      return sp; }],
    [['mosrails.html'], ['Карта ж/д Москвы и МО'], function() {
      return document.createTextNode('Ещё одна карта на тему железных дорог. Схема пригородного ж/д транспорта Москвы и МО. ' + 
                                     'Оригинал этой карты можно видеть на стенах тамбуров подмосковных электричек под названием ' + 
                                     'Moscow Underground and Commuter Rail Map. Подробности на Хабре.'); }],
    [['http://dbcartajs.blogspot.ru/2014/01/spbmetro.html#cont-spbmetro',
      'http://dbcartajs.blogspot.ru/2014/02/metro-novosibirsk.html#cont-nsbmetro',
      'http://dbcartajs.blogspot.ru/2014/02/metro-kiev.html#cont-kievmetro',
      'http://dbcartajs.blogspot.ru/2014/02/metro-tbilisi.html#cont-tbilisimetro'], [
      'Санкт-Петербург', 'Новосибирск', 'Киев', 'Тбилиси'], function() {
      return document.createTextNode('Подборка прочих карт со схемами метро наиболее крупных городов России и СНГ из блога проекта. ' + 
                                     'Небольшие схемы по сравнению с московской. В целом вообще по протяженности и количеству станций с московским метро ' + 
                                     'могут сравниться только метро Нью-Йорка и Лондона.'); }],
    [['starry.html'], ['Звездное небо'], function() {
      var sp = document.createElement('span');
      var a = document.createElement('a');
      a.href = 'http://habrahabr.ru/post/189692';
      a.appendChild(document.createTextNode('Звездное небо на Canvas'));
      sp.appendChild(document.createTextNode('Глобус на фоне звездного неба как в Orbitron, Marble, Xephem c эфемеридами космических аппаратов. ' + 
                                             'Подробно написано в статье на Хабре "'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode('".'));
      return sp; }],
    [['sky3d.html'], ['Звездное небо 3D'], function() {
      var sp = document.createElement('span');
      var a = document.createElement('a');
      a.href = 'http://habrahabr.ru/post/247571';
      a.appendChild(document.createTextNode('Звездное небо 3D'));
      sp.appendChild(document.createTextNode('Переделанный вариант "Звездного неба" с Canvas на отрисовку через WebGL с использованием скриптов three.js. ' + 
                                             'Вращайте, перемещайте левой и правой кнопками мыши объекты Солнечной Системы. ' + 
                                             'Подробно написано в статье на Хабре "'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode('". '));
      sp.appendChild(document.createTextNode('Идея и стиль позаимствованы с примеров на ')); 
      var a = document.createElement('a');
      a.href = 'http://www.apoapsys.com';
      a.appendChild(document.createTextNode('apoapsys.com'));
      sp.appendChild(a);
      return sp; }],
    [['merc.html'], ['Маршруты'], function() {
      return document.createTextNode('На карте в проекции "Меркатор" изображены несколько стран со столицами. Города соединены маршрутными линиями.'); }],
    [['noncart.html'], ['Изображение по точкам'], function() {
      return document.createTextNode('Выводим слово dbcarta по буквам в координатах.'); }],
    [['sample.html'], ['Атлас'], function() {
      return document.createTextNode('Демо с возможностью нанесения объектов с заданными координатами в выбранной проекции.'); }],
    [['cities.html'], ["Города мира"], function() {
      return document.createTextNode('Список крупнейших городов мира с выводом на карте в проекции "Миллер".'); }],
    [['countries.html'], ["Страны мира"], function() {
      return document.createTextNode('Список стран мира с отображением в различных проекциях.'); }],
    [['usemap.html'], ['Население мира'], function() {
      var sp = document.createElement('span');
      sp.appendChild(document.createTextNode('Карта плотности населения мира по странам с возможностью наведения на них и выводом дополнительной информации по клику. ')); 
      sp.appendChild(document.createTextNode('Идея и стиль позаимствованы с примеров ')); 
      var a = document.createElement('a');
      a.href = 'http://www.highcharts.com/maps/demo';
      a.appendChild(document.createTextNode('highmaps'));
      sp.appendChild(a);
      sp.appendChild(document.createTextNode(' из проекта '));
      var a = document.createElement('a');
      a.href = 'http://www.highcharts.com';
      a.appendChild(document.createTextNode('highcharts.com'));
      sp.appendChild(a);
      return sp; }]
  ];
}
function init() {
  var el = document.createElement('h2');
  el.style.textAlign = 'center';
  el.style.backgroundColor = '#d2e0f0';
  el.appendChild(document.createTextNode('dbCartajs - HTML5 Canvas карта с проекциями Proj4js'));
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
    if (i%2 == 0) div.style.backgroundColor = '#d2e0f0';
    var dt = document.createElement('dt');
    var dd = document.createElement('dd');
    var ul = document.createElement('ul');
    ul.style.padding = 0;
    ul.style.margin = 0;
    for(var j in mdemos[i][0]){
      var li = document.createElement('li');
      li.style.display = 'inline';
      li.style.paddingRight = '20px';
      var a = document.createElement('a');
      a.href = mdemos[i][0][j];
      a.target = '_blank';
      a.appendChild(document.createTextNode(mdemos[i][1][j]));
      li.appendChild(a);
      ul.appendChild(li);
    }
    dt.appendChild(ul);
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
  el.appendChild(document.createTextNode(', 2015'));
  document.body.appendChild(el);

  // add anim
  var cx = Math.random() * 360,
      cy = Math.random() * 180;
  dbcarta1 = new dbCarta({id: 'demo1', rbar: false});
  dbcarta1.initProj(203, ' +lon_0=' + cx + ' +lat_0=' + cy);
  dbcarta1.loadCarta(CONTINENTS);
  dbcarta1.loadCarta(dbcarta1.createMeridians());
  dbcarta1.scaleCarta(1.4);
  dbcarta1.draw();
  dbcarta2 = new dbCarta({id: 'demo2', rbar: false});
  dbcarta2.initProj(202, ' +lon_0=' + (180-cx) + ' +lat_0=' + (-cy/2.0));
  dbcarta2.loadCarta(CONTINENTS);
  dbcarta2.loadCarta(dbcarta2.createMeridians());
  dbcarta2.scaleCarta(1.6);
  delete CONTINENTS;
  dbcarta2.draw();
}