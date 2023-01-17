package no.uio.nesys.pyramidio.cli;

import static org.junit.Assert.assertTrue;

import java.awt.Rectangle;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.logging.Logger;

import javax.imageio.ImageIO;

import org.apache.commons.io.FileUtils;
import org.junit.Test;

import no.uio.nesys.pyramidio.DeepZoomImageReaderUrl;

public class DeepZoomImageReaderUrlTest {

	private static final Logger logger = Logger.getLogger(DeepZoomImageReaderUrlTest.class.getName());

	private static final String DZI_URL = new String(
			"https://raw.githubusercontent.com/darwinjob/pyramidio-bioformats/master/test-data/tiled256_jpg.dzi");
	private static final File OUTPUT_WHOLE_FILE = new File("output_whole.png");
	private static final File OUTPUT_REGION_FILE = new File("output_region.png");

	@Test
	public void theTest() throws IOException {

		logger.info("Test started.");

		DeepZoomImageReaderUrl reader = new DeepZoomImageReaderUrl(new URL(DZI_URL));

		BufferedImage wholeImageZoom0_03 = reader.getWholeImage(0.03);
		Path tmpFile = Files.createTempFile("DeepZoomImageReaderUrlTest", "output_whole");
		ImageIO.write(wholeImageZoom0_03, "PNG", tmpFile.toFile());
		assertTrue(FileUtils.contentEquals(tmpFile.toFile(), OUTPUT_WHOLE_FILE));

		int x = 2000;
		int y = 1500;
		int width = 100;
		int height = 100;

		BufferedImage regionAtZoom1 = reader.getSubImage(new Rectangle(x, y, width, height), 1);
		tmpFile = Files.createTempFile("DeepZoomImageReaderUrlTest", "output_region");
		ImageIO.write(regionAtZoom1, "PNG", tmpFile.toFile());
		assertTrue(FileUtils.contentEquals(tmpFile.toFile(), OUTPUT_REGION_FILE));

		logger.info("Test finished.");

	}

}
