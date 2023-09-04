package no.uio.nesys.pyramidio;

import java.io.IOException;
import java.net.URL;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NamedNodeMap;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.SAXException;

/**
 * URL version of gov.nist.isg.pyramidio.DziFile by Antoine Vandecreme
 *
 * @author darwinjob
 */
public class DziUrl {

	private final int tileSize;
	private final int overlap;
	private final String format;
	private final int width;
	private final int height;

	public DziUrl(int tileSize, int overlap, String format, int width, int height) {
		this.tileSize = tileSize;
		this.overlap = overlap;
		this.format = format;
		this.width = width;
		this.height = height;
	}

	public DziUrl(URL dziURL) throws IOException {
		try {
			DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
			DocumentBuilder db = factory.newDocumentBuilder();
			Document doc = db.parse(dziURL.openStream());
			Element imageNode = doc.getDocumentElement();
			if (!"Image".equals(imageNode.getNodeName())) {
				throw new IOException("Unsupported dzi file.");
			}

			tileSize = Integer.parseInt(imageNode.getAttribute("TileSize"));
			overlap = Integer.parseInt(imageNode.getAttribute("Overlap"));
			format = imageNode.getAttribute("Format");

			NodeList childNodes = imageNode.getChildNodes();
			int length = childNodes.getLength();
			String w = null;
			String h = null;
			for (int i = 0; i < length; i++) {
				Node node = childNodes.item(i);
				if ("Size".equals(node.getNodeName())) {
					NamedNodeMap attributes = node.getAttributes();
					w = attributes.getNamedItem("Width").getNodeValue();
					h = attributes.getNamedItem("Height").getNodeValue();
				}
			}
			width = Integer.parseInt(w);
			height = Integer.parseInt(h);
		} catch (ParserConfigurationException | SAXException ex) {
			throw new IOException(ex);
		}
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

	public int getWidth() {
		return width;
	}

	public int getHeight() {
		return height;
	}

	public int getMaxLevel() {
		int maxDim = Math.max(width, height);
		return (int) Math.ceil(Math.log(maxDim) / Math.log(2));
	}

	public String toXml() {
		StringBuilder sb = new StringBuilder();
		sb.append("<?xml version=\"1.0\" encoding=\"utf-8\"?>\n");
		sb.append("<Image TileSize=\"").append(tileSize).append("\" Overlap=\"").append(overlap).append("\" Format=\"")
				.append(format).append("\" xmlns=\"http://schemas.microsoft.com/deepzoom/2009\">\n");
		sb.append("<Size Width=\"").append(width).append("\" Height=\"").append(height).append("\" />\n");
		sb.append("</Image>\n");
		return sb.toString();
	}
}
