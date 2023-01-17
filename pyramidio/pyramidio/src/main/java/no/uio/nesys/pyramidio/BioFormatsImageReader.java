package no.uio.nesys.pyramidio;

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
	
	private static final Logger logger = Logger.getLogger(
			BioFormatsImageReader.class.getName());

	public BioFormatsImageReader(File file) throws FormatException, IOException {
		imageReader = new ImageReader();
		imageReader.setId(file.getPath());
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
			return bufferedImageReader.openImage(0, rectangle.x, rectangle.y, rectangle.width, rectangle.height);
		} catch (FormatException e) {
			throw new IOException(e);
		}
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
