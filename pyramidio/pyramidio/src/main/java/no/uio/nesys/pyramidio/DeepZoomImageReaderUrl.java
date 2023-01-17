package no.uio.nesys.pyramidio;

import gov.nist.isg.pyramidio.PartialImageReader;
import gov.nist.isg.pyramidio.tools.BufferedImageHelper;
import gov.nist.isg.pyramidio.tools.ImageResizingHelper;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.awt.image.WritableRaster;
import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;
import java.util.logging.Logger;

import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageTypeSpecifier;
import javax.imageio.stream.ImageInputStream;
import org.apache.commons.io.FilenameUtils;

/**
 * URL version of gov.nist.isg.pyramidio.DeepZoomImageReader by Antoine
 * Vandecreme. Read only.
 *
 * @author darwinjob
 */
public class DeepZoomImageReaderUrl implements PartialImageReader {

	private final URL dziURL;
	private final URL filesFolder;
	private final int tileSize;
	private final int overlap;
	private final String format;
	private final int width;
	private final int height;
	private final int maxLevel;
	private final ImageTypeSpecifier rawImageType;

	private static final Logger logger = Logger.getLogger(DeepZoomImageReaderUrl.class.getName());

	public DeepZoomImageReaderUrl(URL dziURL) throws IOException {
		this(dziURL, null);
	}

	public DeepZoomImageReaderUrl(URL dziURL, URL tileExample) throws IOException {
		this.dziURL = dziURL;
		this.filesFolder = new URL(FilenameUtils.removeExtension(dziURL.toString()) + "_files/");
		logger.info("DZI file: " + this.dziURL);
		logger.info("DZI folder: " + this.filesFolder);
		/*
		 * Can't check if URL 'folder' exists. Skipping. if (!filesFolder.exists()) {
		 * throw new IOException("No files folder found: " + filesFolder); }
		 */
		DziUrl du = new DziUrl(dziURL);
		tileSize = du.getTileSize();
		overlap = du.getOverlap();
		format = du.getFormat();
		width = du.getWidth();
		height = du.getHeight();

		if (tileExample == null) {
			tileExample = getFilesOfLevel(0).get(0);
		}
		try (ImageInputStream iis = ImageIO.createImageInputStream(tileExample.openStream())) {
			ImageReader reader = getImageReader(iis);
			reader.setInput(iis);
			this.rawImageType = reader.getRawImageType(0);
		}

		int maxDim = Math.max(width, height);
		maxLevel = (int) Math.ceil(Math.log(maxDim) / Math.log(2));
	}

	public URL getDziFile() {
		return dziURL;
	}

	public URL getFilesFolder() {
		return filesFolder;
	}

	public int getTileSize() {
		return tileSize;
	}

	public int getOverlap() {
		return overlap;
	}

	public String getFormat() {
		return format;
	}

	@Override
	public int getWidth() {
		return width;
	}

	@Override
	public int getHeight() {
		return height;
	}

	@Override
	public BufferedImage read() throws IOException {
		return getWholeImage(1);
	}

	@Override
	public BufferedImage read(Rectangle rectangle) throws IOException {
		return getRegion(rectangle, 1);
	}

	/**
	 * Get the whole image at the specified zoom level.
	 *
	 * @param zoom The desired zoom level
	 * @return
	 * @throws IOException
	 */
	public BufferedImage getWholeImage(double zoom) throws IOException {
		return getRegion(new Rectangle(width, height), zoom);
	}

	/**
	 * Get the region specified. Pixels outside of the image are filled in black.
	 *
	 * @param region
	 * @param zoom
	 * @return
	 * @throws IOException
	 */
	public BufferedImage getRegion(Rectangle region, double zoom) throws IOException {
		if (region == null || region.isEmpty()) {
			throw new IllegalArgumentException("Region cannot be empty.");
		}

		int resultWidth = (int) Math.round(region.width * zoom);
		int resultHeight = (int) Math.round(region.height * zoom);
		if (resultWidth < 1 || resultHeight < 1) {
			throw new IllegalArgumentException("Zoom too small for width or height.");
		}

		Rectangle imageArea = new Rectangle(width, height);
		Rectangle intersection = imageArea.intersection(region);
		if (region.equals(intersection)) {
			return getSubImage(region, zoom);
		}

		BufferedImage result;
		synchronized (this) {
			result = rawImageType.createBufferedImage(resultWidth, resultHeight);
		}

		if (!intersection.isEmpty()) {
			BufferedImage subimage = getSubImage(intersection, zoom);
			int intersectionX = region.x < 0 ? (int) Math.round(-region.x * zoom) : 0;
			int intersectionY = region.y < 0 ? (int) Math.round(-region.y * zoom) : 0;
			result.getRaster().setRect(intersectionX, intersectionY, subimage.getRaster());
			subimage.flush();
		}
		return result;
	}

	/**
	 * Get the sub image specified by the region. The region must be entirely inside
	 * the image.
	 *
	 * @param region
	 * @param zoom
	 * @return
	 * @throws IOException
	 */
	public BufferedImage getSubImage(Rectangle region, double zoom) throws IOException {
		if (region == null || region.isEmpty()) {
			throw new IllegalArgumentException("Region cannot be empty.");
		}

		Rectangle wholeImage = new Rectangle(width, height);
		if (!wholeImage.contains(region)) {
			throw new IllegalArgumentException("Region outside image.");
		}

		int resultWidth = (int) Math.round(region.width * zoom);
		int resultHeight = (int) Math.round(region.height * zoom);

		if (resultWidth < 1 || resultHeight < 1) {
			throw new IllegalArgumentException("Zoom too small for width or height.");
		}

		int level = getClosestLevel(zoom);
		double zoomOfLevel = getZoomOfLevel(level);
		int x = (int) Math.round(region.x * zoomOfLevel);
		int y = (int) Math.round(region.y * zoomOfLevel);
		int w = (int) Math.round(region.width * zoomOfLevel);
		int h = (int) Math.round(region.height * zoomOfLevel);

		BufferedImage image = readRegionOfLevel(new Rectangle(x, y, w, h), level);
		return ImageResizingHelper.resizeImage(image, resultWidth, resultHeight);
	}

	public BufferedImage readRegionOfLevel(Rectangle region, int level) throws IOException {
		int firstTileColumn = region.x / tileSize;
		if (tileSize * (firstTileColumn + 1) - overlap <= region.x) {
			firstTileColumn++;
		}
		int firstTileRow = region.y / tileSize;
		if (tileSize * (firstTileRow + 1) - overlap <= region.y) {
			firstTileRow++;
		}
		int lastTileColumn = (region.x + region.width) / tileSize;
		if (tileSize * lastTileColumn + overlap >= region.x + region.width && lastTileColumn != 0) {
			lastTileColumn--;
		}
		int lastTileRow = (region.y + region.height) / tileSize;
		if (tileSize * lastTileRow + overlap >= region.y + region.height && lastTileRow != 0) {
			lastTileRow--;
		}

		BufferedImage result = null;
		WritableRaster raster = null;
		int dx = 0;
		for (int i = firstTileColumn; i <= lastTileColumn; i++) {
			int x;
			int w;
			if (i == firstTileColumn) {
				x = region.x - firstTileColumn * tileSize;
				if (i == lastTileColumn) {
					w = region.width;
				} else {
					w = tileSize - x;
				}
				if (firstTileColumn != 0) {
					x += overlap;
				}
			} else {
				x = overlap;
				if (i == lastTileColumn) {
					w = region.width - dx;
				} else {
					w = tileSize;
				}
			}

			int dy = 0;
			for (int j = firstTileRow; j <= lastTileRow; j++) {
				int y;
				int h;
				if (j == firstTileRow) {
					y = region.y - firstTileRow * tileSize;
					if (j == lastTileRow) {
						h = region.height;
					} else {
						h = tileSize - y;
					}
					if (firstTileRow != 0) {
						y += overlap;
					}
				} else {
					y = overlap;
					if (j == lastTileRow) {
						h = region.height - dy;
					} else {
						h = tileSize;
					}
				}

				Rectangle area = new Rectangle(x, y, w, h);
				BufferedImage tile = readRegionOfTile(area, level, i, j);
				if (i == firstTileColumn && j == firstTileRow) {
					result = BufferedImageHelper.createBufferedImage(region.width, region.height, tile);
					raster = result.getRaster();
				}
				raster.setRect(dx, dy, tile.getRaster());
				tile.flush();
				dy += h;
			}
			dx += w;
		}
		return result;
	}

	private BufferedImage readRegionOfTile(Rectangle region, int level, int column, int row) throws IOException {
		URL levelFolder = new URL(filesFolder + Integer.toString(level) + "/");
		URL tile = new URL(levelFolder.toString() + column + "_" + row + "." + format);
		logger.info("Tile request: " + tile);
		try (ImageInputStream iis = ImageIO.createImageInputStream(tile.openStream())) {
			ImageReader reader = getImageReader(iis);
			reader.setInput(iis);
			ImageReadParam param = reader.getDefaultReadParam();
			param.setSourceRegion(region);
			return reader.read(0, param);
		}
	}

	private int getClosestLevel(double zoom) {
		if (zoom > 0.5) {
			return maxLevel;
		}
		return maxLevel + (int) Math.ceil(Math.log(zoom) / Math.log(2));
	}

	private double getZoomOfLevel(int level) {
		return Math.pow(2, level - maxLevel);
	}

	private List<URL> getFilesOfLevel(int level) throws MalformedURLException {
		int widthOfLevel = 1;
		int heightOfLevel = 1;

		if (level != 0) {
			widthOfLevel = Math.min(2 * level, width);
			heightOfLevel = Math.min(2 * level, height);
		}

		int numColumns = (int) Math.ceil(widthOfLevel / (float) tileSize);
		int numRows = (int) Math.ceil(heightOfLevel / (float) tileSize);
		URL levelFolder = new URL(filesFolder + Integer.toString(level) + "/");
		ArrayList<URL> result = new ArrayList<>(numColumns * numRows);
		for (int i = 0; i < numColumns; i++) {
			for (int j = 0; j < numRows; j++) {
				URL url = new URL(levelFolder.toString() + i + "_" + j + "." + format);
				logger.info("Added URL:  " + url);
				result.add(url);
			}
		}
		return result;
	}

	private static ImageReader getImageReader(ImageInputStream iis) throws IOException {
		Iterator<ImageReader> readers = ImageIO.getImageReaders(iis);
		if (!readers.hasNext()) {
			throw new IOException("No compatible image reader found.");
		}
		return readers.next();
	}
}
