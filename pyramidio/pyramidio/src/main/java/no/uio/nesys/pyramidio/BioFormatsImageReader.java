package no.uio.nesys.pyramidio;

import java.awt.Graphics2D;
import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.util.logging.Logger;

import org.apache.commons.lang.NotImplementedException;

import gov.nist.isg.pyramidio.PartialImageReader;
import loci.formats.FormatException;
import loci.formats.ImageReader;
import loci.formats.gui.BufferedImageReader;

/**
 * 
 * @author darwinjob
 *
 */
public class BioFormatsImageReader implements PartialImageReader {

	private BufferedImageReader bufferedImageReader;
	private ImageReader imageReader;
	private boolean forceRGB;
	
	private static final Logger logger = Logger.getLogger(
			BioFormatsImageReader.class.getName());
	/**
	 * Processing non RGB888 image seems to be an issue. See https://github.com/darwinjob/pyramidio-bioformats/issues/13 
	 * If you see any output artifacts try forceRGB=true
	 * @param file
	 * @throws FormatException
	 * @throws IOException
	 */
	public BioFormatsImageReader(File file) throws FormatException, IOException {
		this (file, false);
	}

	/**
	 * 
	 * @param file
	 * @param forceRGB
	 * @throws FormatException
	 * @throws IOException
	 */
	public BioFormatsImageReader(File file, boolean forceRGB) throws FormatException, IOException {
		imageReader = new ImageReader();
		imageReader.setId(file.getPath());
		this.forceRGB = forceRGB;
		bufferedImageReader = new BufferedImageReader(imageReader);
	}

//	public BioFormatsImageReader(ImageReader imageReader) {
//		this.imageReader = imageReader;
//		bufferedImageReader = new BufferedImageReader(imageReader);
//	}

	@Override
	public BufferedImage read() throws IOException {
		throw new NotImplementedException("This method should never be called.");
	}

	@Override
	public BufferedImage read(Rectangle rectangle) throws IOException {
		try {
			logger.fine("Reading rectangle: " + rectangle);
			BufferedImage bi = bufferedImageReader.openImage(0, rectangle.x, rectangle.y, rectangle.width, rectangle.height);

			if (forceRGB) {
				return convertToRGB(bi);
			}
			return bi;
		} catch (FormatException e) {
			throw new IOException(e);
		}
	}

	private BufferedImage convertToRGB(BufferedImage src) {
		BufferedImage img= new BufferedImage(src.getWidth(), src.getHeight(), BufferedImage.TYPE_INT_RGB);
	    Graphics2D g2d= img.createGraphics();
	    g2d.drawImage(src, 0, 0, null);
	    g2d.dispose();
	    return img;
	}

	@Override
	public int getWidth() {
		return imageReader.getSizeX();
	}

	@Override
	public int getHeight() {
		return imageReader.getSizeY();
	}

}
