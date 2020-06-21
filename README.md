dbcartajs
===========

HTML5 Canvas+SVG vector map and image viewer. Pure JavaScript and serverless.
It uses Proj4js transformations.

 * espg:4326 - longlat;
 * epsg:3875 - Mercator projection;
 * mill - Miller Cylindrical projection;
 * laea - Lambert Azimuthal Equal Area;
 * nsper - General Vertical Near-Side Perspective projection (missing in original Proj4js code, ported from gctpc project);
 * ortho - Orthographic projection;
 * moll - Mollweide projection.

Starry Sky demo include satellite-js module.<br>

## Demos

[Moscow Metro. Карта метро Москвы 2018](https://egaxegax.github.io/dbcartajs/svg/mosmetro.html)

[Moscow Rail Map. Карта ж/д транспорта Москвы и МО 2018](https://egaxegax.github.io/dbcartajs/svg/mosrails.html)

[All demos. Все примеры](https://egaxegax.github.io/dbcartajs/index.html)

## Docs

See source comments for usage info in *dbcarta.js* and *dbcartasvg.js* files.<br>
Docs in wiki at https://github.com/egaxegax/dbcartajs/wiki.

## Usage

Download and unpack an archive, open index.html from demos folder in any browser with HTML5 support.

## Controls

 * drag to move map;
 * use Ctrl+Left-Mouse-Button to draw zoom box;
 * use mouse wheel or right bar buttons to zoom;
 * touch support (move) on Tablet PC.

##  Screenshots

![ortho1](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/ortho1.gif)
![ortho2](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/ortho2.gif)
![mosrails](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/mosrails.jpg)
![starry](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/starry.jpg)
