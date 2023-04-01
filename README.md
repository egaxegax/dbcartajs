## dbcartajs

Pan, zoom vector map and images (Canvas, SVG)<br>
*Просмотр векторных карт и изображений с навигацией в JavaScript*

#### Примеры (demos)

Интерактивные схемы метро Москвы со строящимися линиями и станциями и Петербурга в <i>2023</i> году, 
пригородного ж/д транспорта Москвы и МО в <i>2015</i> году.
По выбранным станциям рассчитывается кратчайший путь по алгоритму <i>BFS</i>.
Выбор станций возможен по клику, сброс маршрута - по двойному клику.

<table>
 <tr>
  <td width="320px"> <i>Схема метро Москвы</i><br><sup>Moscow Metro</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/mosmetro.html"> Canvas </a> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/mosmetro.html"> SVG </a> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/mosmetro2.html"> SVG(Википедия) </a> </td>
 </tr>
 <tr>
  <td> <i>Схема ж/д Москвы и МО</i><br><sup>Moscow Railroad</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/mosrails.html"> Canvas </a> </td>
  <td colspan=2> <a href="https://egaxegax.github.io/dbcartajs/svg/mosrails.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Схема метро Петербурга</i><br><sup>St. Petersburg Metro</sup> </td>
  <td> - </td>
  <td colspan=2> <a href="https://egaxegax.github.io/dbcartajs/svg/metrospb.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Схема метро Тбилиси</i><br><sup>Tbilisi Metro</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/metro-tbilisi.html"> Canvas </a> </td>
  <td colspan=2> - </td>
 </tr>
</table>

Просмотр *jpeg* и *svg* картинок с возможностью масштабирования.

<table>
 <tr>
  <td width="320px"> <i>Просмотровщик картинок</i><br><sup>Image Viewer</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/imgviewer.html"> Canvas </a> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/imgviewer.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Масштабирование SVG-изображения</i><br><sup>Pan Zoom</sup> </td>
  <td> - </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/panzoom.html"> SVG </a> </td>
 </tr>
</table>

Интерактивные карты мира со списками городов и стран в различных проекциях. 
Идея и стиль позаимствованы с примеров <a href="http://www.highcharts.com/maps/demo">highmaps</a> 

<table>
 <tr>
  <td width="320px"> <i>Атлас мира</i><br><sup>Atlas</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/atlas.html"> Canvas </a> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/atlas.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Население мира</i><br><sup>Population</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/usemap.html"> Canvas </a> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/usemap.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Население США</i><br><sup>Population USA</sup> </td>
  <td> - </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/us.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Города мира</i><br><sup>Cities</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/cities.html"> Canvas </a> </td>
  <td> - </td>
 </tr>
 <tr>
  <td> <i>Города России без расстояний</i><br><sup>Russian Cities</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/russ.html"> Canvas </a> </td>
  <td> - </td>
 </tr>
 <tr>
  <td> <i>Страны мира</i><br><sup>Countries</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/countries.html"> Canvas </a> </td>
  <td> - </td>
 </tr>
 <tr>
  <td> <i>Маршруты на карте</i><br><sup>Routes</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/merc.html"> Canvas </a> </td>
  <td> - </td>
 </tr>
</table>

Примеры использования градиента и *svg*-анимации с эффектом движения.

<table>
 <tr>
  <td width="320px"> <i>Настенные часы</i><br><sup>Wall Clock</sup> </td>
  <td> - </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/clock.html"> SVG </a> </td>
 </tr>
 <tr>
  <td> <i>Анимация движения</i><br><sup>Roller Ball</sup> </td>
  <td width="80px"> - </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/svg/rollerball.html"> SVG </a> </td>
 </tr>
</table>

Отрисовка картинки в канвасе <i>3d</i> с пересчетом проекции отображения через шейдеры <i>WebGL</i> на основе примеров с с сайта "<a href="http://vcg.isti.cnr.it/~tarini/spinnableworldmaps/">Spinnable World Maps</a>". 
Звездное небо в канвасе <i>2d</i> и <i>3d</i> с использованием скриптов <a href="https://github.com/mrdoob/three.js">three.js</a>.

<table>
 <tr>
  <td width="320px"> <i>Атлас 3D</i><br><sup>Atlas 3D</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/map3d.html"> Canvas </a> </td>
 </tr>
 <tr>
  <td> <i>Звездное небо</i><br><sup>Starry Sky</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/starry.html"> Canvas </a> </td>
 </tr>
 <tr>
  <td> <i>Звездное небо 3D</i><br><sup>Sky 3D</sup> </td>
  <td> <a href="https://egaxegax.github.io/dbcartajs/sky3d.html"> Canvas </a> </td>
 </tr>
</table>
