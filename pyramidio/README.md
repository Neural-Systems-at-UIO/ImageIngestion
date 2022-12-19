# PyramidIO: image pyramid reader/writer tool.</br>Bio-Formats enhanced version.

This fork features BioFormatsImageReader which provides support for [reading over 100 image formats](https://docs.openmicroscopy.org/bio-formats/latest/supported-formats.html) and potentially converting them to [DZI pyramids](https://en.wikipedia.org/wiki/Deep_Zoom) suitable for using with different viewers, including, but not limited to, [OpenSeadragon](https://openseadragon.github.io) based viewers.

While the reader should work with the all formats supported by Bio-Formats, the preferred, most tested and efficient image input format is tiled TIFF/BigTIFF with LZW or JPEG compression. Please consider converting your images to the mentioned format by using [ImageMagick tool](https://imagemagick.org), the command example:
```
magick convert -verbose -define tiff:tile-geometry=256x256 input_image.xxx -compress jpeg -quality 95 output_image.tif
```
This will produce 256x256 tiled JPEG (lossy) compressed TIFF file.
```
magick convert -verbose -define tiff:tile-geometry=256x256 input_image.xxx -compress lzw output_image.tif
```
This will produce 256x256 tiled LZW (lossless) compressed TIFF file.

Alternatively you can try to use [bftools](https://docs.openmicroscopy.org/bio-formats/latest/users/comlinetools/index.html) 

Tip: avoid multipage TIFF files.

## CLI usage

The CLI allows to build a DZI pyramid from an image.
To start the CLI, one should use `pyramidio-cli-[version].jar` like this:

```
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o (my-output-folder || scheme:///path/file[.tar, .seq])
```

Examples:
```
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o outputfolder
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o file:///tmp/outputfolder.tar
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o s3://my-image-bucket/outputfolder
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o hdfs://localhost:9000/outputfolder
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o hdfs://localhost:9000/outputfolder.tar
java -jar pyramidio-cli-[version].jar -i my-image.jpg -o hdfs://localhost:9000/outputfolder.seq

```

To get the list of all the options, one can type:
```
java -jar pyramidio-cli-[version].jar -h
```

Please note that the default pyramid tiles format is the same as the input image. In case of TIFF you want to avoid this. The following command will specify the tiles format:
```
java -jar pyramidio-cli-[version].jar -i my-image.tif -tf png -o outputfolder
```
This will produce a pyramid with PNG (lossless) tiles.

```
java -jar pyramidio-cli-[version].jar -i my-image.tif -tf jpg -o outputfolder
```
This will produce a pyramid with JPG (lossy) tiles.

## 🚨 Memory overflow issues 🚨 ##

By default PyramidIO is trying to read and cache the entire image into the memory to achieve the best possible performance. In case of large images it might cause memory overflow issues. There are two types of them: `java.lang.OutOfMemoryError: Java heap space` and `java.lang.RuntimeException: Cannot cache region java.awt.Rectangle`
Both are usually fixable by using `-icr` parameter:
```
java -jar pyramidio-cli-[version].jar -i my-image.tif -icr 0.1 -tf png -o outputfolder
```
This means that only 10% of an image will be read/cached negatively affecting the performance.

You can also try to increase the heap size by using standard Java -XmX parameter. While this might increase the performance, it will NOT help in case of `java.lang.RuntimeException: Cannot cache region java.awt.Rectangle` - this is internal Bio-Formats limitation: only 2GB of data can be extracted at one time.

## How to view a pyramid ##

The simplest way is to use [OpenSeadragon JavaScript library](https://openseadragon.github.io). The example index.html file and the pyramid (tiled256_jpg.dzi file and tiled256_jpg_files folder) are here: https://github.com/darwinjob/pyramidio-bioformats/tree/master/test-data

The demo is avalable here https://darwinjob.github.io/pyramidio-bioformats/demo.html

## Library usage ##

### Write a DZI pyramid

To write a DZI pyramid, one should use the gov.nist.isg.pyramidio.ScalablePyramidBuilder class:
```java
ScalablePyramidBuilder spb = new ScalablePyramidBuilder(tileSize, tileOverlap, tileFormat, "dzi");
FilesArchiver archiver = new DirectoryArchiver(outputFolder);
BioFormatsImageReader pir = new BioFormatsImageReader(imageFile);
spb.buildPyramid(pir, "pyramidName", archiver, parallelism);
```
Currently the available `FilesArchiver`s are:
* `DirectoryArchiver`: save files in a directory on the filesystem.
* `TarArchiver`: save files in a tar file on the filesystem.
* `SequenceFileArchiver`: save files in a Hadoop sequence file.
* `HdfsArchiver`: save files on a HDFS filesystem.
* `TarOnHdfsArchiver`: save files in a tar file created on a HDFS filesystem.
* `S3Archiver`: save files to a folder on a S3 bucket.

As for the `PartialImageReader`s:
* `BioFormatsImageReader`: read an image using Bio-Formats library.
* `BufferedImageReader`: read an image from the disk and store it in RAM.
* `DeepZoomImageReader`: read a DZI pyramid.
* `MistStitchedImageReader`: read a [MIST](https://github.com/NIST-ISG/MIST) translation vector.

### Read a DZI pyramid

To read a DZI pyramid, one should use the `DeepZoomImageReader` class:
```java
File dziFile = new File("my-image.dzi");
DeepZoomImageReader reader = new DeepZoomImageReader(dziFile);
BufferedImage wholeImageZoom0_01 = reader.getWholeImage(0.01);
BufferedImage regionAtZoom0_1 = reader.getSubImage(
    new Rectangle(x, y, width, height), 0.1);
```

Similarly, one could use `DeepZoomImageReaderUrl` class:
```java
URL dziUrl = new URL("http://my-image.dzi");
DeepZoomImageReaderUrl reader = new DeepZoomImageReaderUrl(dziUrl);
BufferedImage wholeImageZoom0_01 = reader.getWholeImage(0.01);
BufferedImage regionAtZoom0_1 = reader.getSubImage(
    new Rectangle(x, y, width, height), 0.1);
```
   
## Disclaimer:

This software is based on https://github.com/usnistgov/pyramidio from the National Institute of Standards and Technology and https://www.openmicroscopy.org/bio-formats/ from The Open Microscopy Environment. First publication  https://www.openmicroscopy.org/community/viewtopic.php?p=17715
