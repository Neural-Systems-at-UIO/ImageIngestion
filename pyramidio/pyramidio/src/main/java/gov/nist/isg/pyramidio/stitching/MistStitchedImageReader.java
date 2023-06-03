/*
 * This software was developed at the National Institute of Standards and
 * Technology by employees of the Federal Government in the course of
 * their official duties. Pursuant to title 17 Section 105 of the United
 * States Code this software is not subject to copyright protection and is
 * in the public domain. This software is an experimental system. NIST assumes
 * no responsibility whatsoever for its use by other parties, and makes no
 * guarantees, expressed or implied, about its quality, reliability, or
 * any other characteristic. We would appreciate acknowledgement if the
 * software is used.
 */
package gov.nist.isg.pyramidio.stitching;

import gov.nist.isg.pyramidio.PartialImageReader;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

/**
 * Partial image reader for stitching vectors generated by MIST:
 * https://github.com/usnistgov/MIST
 *
 * @author Antoine Vandecreme
 */
public class MistStitchedImageReader implements PartialImageReader {

    private final File tilesDirectory;
    private final FilenameConverter filenameConverter;
    private final List<ImageTile> tiles;
    private int tilesWidth;
    private int tilesHeight;

    private final int width;
    private final int height;

    // Sample image to easily create a similar image with the same type
    private BufferedImage sampleImage;

    public MistStitchedImageReader(File positionFile, File tilesDirectory)
            throws IOException {
        this(positionFile, tilesDirectory, new FilenameConverter() {
            @Override
            public String convert(String fileName) {
                return fileName;
            }
        });
    }

    public MistStitchedImageReader(File positionFile, File tilesDirectory,
            FilenameConverter converter) throws IOException {
        this.tilesDirectory = tilesDirectory;
        this.filenameConverter = converter;
        tiles = getTilesFromPositionFile(positionFile);

        int maxX = 0;
        int maxY = 0;
        for (ImageTile tile : tiles) {
            Rectangle region = tile.getRegion();
            if (region.x > maxX) {
                maxX = region.x;
            }
            if (region.y > maxY) {
                maxY = region.y;
            }
        }
        width = maxX + tilesWidth;
        height = maxY + tilesHeight;
    }

    private void loadTilesDetails(File file) throws IOException {
        try (ImageInputStream iis = ImageIO.createImageInputStream(file)) {
            if (iis == null) {
                throw new IOException(
                        "Can not create image input stream for file " + file);
            }
            Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
            if (!readers.hasNext()) {
                throw new IOException("No image reader found for file " + file);
            }
            ImageReader reader = readers.next();
            reader.setInput(iis);
            tilesWidth = reader.getWidth(0);
            tilesHeight = reader.getHeight(0);

            ImageReadParam param = reader.getDefaultReadParam();
            // Read just one pixel
            param.setSourceRegion(new Rectangle(1, 1));
            sampleImage = reader.read(0, param);
        }
    }

    private List<ImageTile> getTilesFromPositionFile(File positionFile)
            throws IOException {
        String patternStr = "(\\S+): (\\S+|\\(\\S+, \\S+\\));";
        Pattern pattern = Pattern.compile(patternStr);

        List<ImageTile> tileList = new ArrayList<>();

        try (BufferedReader br = new BufferedReader(
                new FileReader(positionFile))) {

            String line;
            while ((line = br.readLine()) != null) {
                File file = null;
                double correlation = 0;
                int xPos = 0;
                int yPos = 0;

                Matcher matcher = pattern.matcher(line);
                while (matcher.find()) {
                    if (matcher.groupCount() == 2) {
                        String key = matcher.group(1);
                        String value = matcher.group(2);

                        switch (key) {
                            case "file":
                                file = new File(tilesDirectory,
                                        filenameConverter.convert(value));
                                if (tilesWidth == 0 || tilesHeight == 0
                                        || sampleImage == null) {
                                    loadTilesDetails(file);
                                }
                                break;
                            case "corr":
                                try {
                                    correlation = Double.parseDouble(value);
                                } catch (NumberFormatException e) {
                                    throw new IOException(e);
                                }
                                break;
                            case "position":
                                value = value.replace("(", "");
                                value = value.replace(")", "");
                                String[] posSplit = value.split(",");
                                try {
                                    xPos = Integer.parseInt(posSplit[0].trim());
                                    yPos = Integer.parseInt(posSplit[1].trim());
                                } catch (NumberFormatException e) {
                                    throw new IOException(e);
                                }
                                break;
                        }
                    }
                }
                tileList.add(new ImageTile(
                        file,
                        new Rectangle(xPos, yPos, tilesWidth, tilesHeight),
                        correlation));
            }
        }

        return tileList;
    }

    @Override
    public BufferedImage read() throws IOException {
        return read(new Rectangle(width, height));
    }

    @Override
    public BufferedImage read(Rectangle rectangle) throws IOException {
        Blender blender = new NormalBlender(rectangle.width, rectangle.height,
                sampleImage);
        for (ImageTile tile : tiles) {
            Rectangle intersection
                    = tile.getIntersectionWithStitchedImageRegion(rectangle);
            if (intersection.isEmpty()) {
                continue;
            }
            BufferedImage region = tile.readStitchedImageRegion(rectangle);

            blender.blend(region,
                    intersection.x - rectangle.x,
                    intersection.y - rectangle.y);
        }

        return blender.getResult();
    }

    @Override
    public int getWidth() {
        return width;
    }

    @Override
    public int getHeight() {
        return height;
    }

    public List<ImageTile> getTiles() {
        return Collections.unmodifiableList(tiles);
    }

    /**
     * Interface allowing to match a file name saved in the stitching vector to
     * the actual file name on the file system.
     */
    public interface FilenameConverter {

        String convert(String fileName);
    }
}
