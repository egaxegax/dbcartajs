dbCartajs
===========

HTML5 Canvas dymanic object map. Pure JavaScript and serverless.
It uses Proj4js transformations. Supported projections:
 * espg:4326, longlat;
 * epsg:3875, Mercator projection;
 * mill, Miller Cylindrical projection;
 * laea, Lambert Azimuthal Equal Area;
 * nsper, General Vertical Near-Side Perspective projection (missing in original Proj4js code, ported from gctpc project);
 * ortho, Orthographic projection;
 * moll, Mollweide projection.

Starry Sky demo include satellite-js module.

![ortho-ns.gif] (http://img-fotki.yandex.ru/get/9066/136640652.0/0_bf3ee_cde97104_orig "ortho-ns.gif")
![ortho-ew.gif] (http://img-fotki.yandex.ru/get/9167/136640652.0/0_bf3ed_d4a4a2c3_orig "ortho-ew.gif")

Demos at http://dbcartajs.appspot.com/. Docs in wiki at https://github.com/egaxegax/dbCartajs/wiki.

## Usage

Simply download, unpack and open index.html from demo folder in any browser with HTML5 support.

## Controls

 * drag to move map;
 * use Ctrl+Left-Mouse-Button to draw zoom box;
 * use right bar buttons to move if mouse drag unavailable (on Tablet PC).

##  Screenshots

Mercator Projection:

![mercv.png] (http://img-fotki.yandex.ru/get/9832/136640652.0/0_df04d_d154d06b_XL.png "Mercator")

Starry Sky. Featured, copmlicated demo like Orbitron, Marble, Xephem but more lightweight.

![starry.png] (http://img-fotki.yandex.ru/get/9802/136640652.0/0_df04b_fbe77af7_XL.png "Starry Sky")

![sat-view.png] (http://img-fotki.yandex.ru/get/9751/136640652.0/0_df049_a3bc71d1_XL.png "Satellite Viewer")

Moscow Metro Map:

![mosmetro.png] (http://img-fotki.yandex.ru/get/9328/136640652.0/0_c6660_9d3ca715_XL.png "Moscow Metro")

Moscow Rail Map:

![mosrails.png] (http://habrastorage.org/files/5aa/e52/1b3/5aae521b3a02452d8ab24e25ac7c1c4d.png "Moscow Rail Map")
