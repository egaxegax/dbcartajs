dbCartajs
===========

HTML5 Canvas+SVG vector map and image viewer. Pure JavaScript and serverless.
It uses Proj4js transformations. Supported projections:

 * espg:4326, longlat;
 * epsg:3875, Mercator projection;
 * mill, Miller Cylindrical projection;
 * laea, Lambert Azimuthal Equal Area;
 * nsper, General Vertical Near-Side Perspective projection (missing in original Proj4js code, ported from gctpc project);
 * ortho, Orthographic projection;
 * moll, Mollweide projection.

Starry Sky demo include satellite-js module.<br>
Demos at http://egaxegax.github.io/dbCartajs/demo/index.html.<br>
Docs in wiki at https://github.com/egaxegax/dbCartajs/wiki.

## Usage

Simply download and unpack an archive, open index.html from demo folder in any browser with HTML5 support.

## Controls

 * drag to move map;
 * use Ctrl+Left-Mouse-Button to draw zoom box;
 * use mouse wheel or right bar buttons to zoom;
 * touch support (move) on Tablet PC.

##  Screenshots

![ortho1](https://camo.githubusercontent.com/f5f2390dc5c2da653b7ead7d69abc8f211dc22e9/687474703a2f2f696d672d666f746b692e79616e6465782e72752f6765742f393036362f3133363634303635322e302f305f62663365655f63646539373130345f6f726967)
![ortho2](https://camo.githubusercontent.com/ac40d983c70b8c622b99ef9497cfd7f2b289ea8b/687474703a2f2f696d672d666f746b692e79616e6465782e72752f6765742f393136372f3133363634303635322e302f305f62663365645f64346134613263335f6f726967)
![mosrails](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/mosrails.png)
![starry](https://raw.githubusercontent.com/egaxegax/FotoSite/master/dbcartajs/starry.png)
