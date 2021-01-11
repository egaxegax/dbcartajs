![logo](https://raw.githubusercontent.com/egaxegax/dbcartajs/master/img/fav.svg)
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

* [Moscow Metro Map](https://egaxegax.github.io/dbcartajs/mosmetro.html). [*SVG version*](https://egaxegax.github.io/dbcartajs/svg/mosmetro.html)
* [Moscow Rail Map](https://egaxegax.github.io/dbcartajs/mosrails.html). [*SVG verion*](https://egaxegax.github.io/dbcartajs/svg/mosrails.html)
* [Starry Sky 3d](https://egaxegax.github.io/dbcartajs/starry.html)
* [Image Viewer](https://egaxegax.github.io/dbcartajs/imgviewer.html). [*SVG version*](https://egaxegax.github.io/dbcartajs/imgviewer.html)
* [World Atlas](https://egaxegax.github.io/dbcartajs/atlas.html). [*SVG version*](https://egaxegax.github.io/dbcartajs/svg/atlas.html)
* [World Population](https://egaxegax.github.io/dbcartajs/usemap.html). [*SVG version*](https://egaxegax.github.io/dbcartajs/svg/usemap.html)
* [Clock](https://egaxegax.github.io/dbcartajs/svg/clock.html)
* [Starry Sky 3d](https://egaxegax.github.io/dbcartajs/sky3d.html)
* [Projection 3d](https://egaxegax.github.io/dbcartajs/map3d.html)

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

