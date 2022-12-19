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
package gov.nist.isg.pyramidio.cli;

import gov.nist.isg.archiver.FilesArchiver;
//@darwinjob import gov.nist.isg.pyramidio.DirectImageReader;
import gov.nist.isg.pyramidio.ScalablePyramidBuilder;
import no.uio.nesys.pyramidio.BioFormatsImageReader;

import java.io.File;
import java.util.logging.Logger;

import org.apache.commons.cli.CommandLine;
import org.apache.commons.cli.CommandLineParser;
import org.apache.commons.cli.DefaultParser;
import org.apache.commons.cli.HelpFormatter;
import org.apache.commons.cli.Option;
import org.apache.commons.cli.Options;
import org.apache.commons.cli.ParseException;
import org.apache.commons.cli.PatternOptionBuilder;
import org.apache.commons.io.FilenameUtils;

/**
 *
 * @author Antoine Vandecreme
 * @modified darwinjob
 */
public class Main {
	
	private static final Logger logger = Logger.getLogger(Main.class.getName());

    public static void main(String[] args) {
        Options options = new Options();

        Option inputOption = new Option("i", "input", true,
                "Input image to convert to dzi.");
        inputOption.setRequired(true);
        options.addOption(inputOption);

        Option outputOption = new Option("o", "output", true,
                "Output folder or file where the output will be generated.");
        outputOption.setRequired(true);
        options.addOption(outputOption);

        Option tileSizeOption = new Option("ts", "tileSize", true,
                "Tile size (default 254).");
        tileSizeOption.setType(PatternOptionBuilder.NUMBER_VALUE);
        options.addOption(tileSizeOption);

        Option tileOverlapOption = new Option("to", "tileOverlap", true,
                "Tile overlap (default 1).");
        tileOverlapOption.setType(PatternOptionBuilder.NUMBER_VALUE);
        options.addOption(tileOverlapOption);

        Option tileFormatOption = new Option("tf", "tileFormat", true,
                "Tile format such as jpg, png "
                + "(default to the same format than the input)");
        options.addOption(tileFormatOption);

        Option parallelismOption = new Option("p", "parallelism", true,
                "Number of threads to use (default to number of cpu cores).");
        parallelismOption.setType(PatternOptionBuilder.NUMBER_VALUE);
        options.addOption(parallelismOption);

        Option inputCacheRatioOption = new Option("icr", "inputCacheRatio", true,
                "Ratio of the input image which can be kept in cache "
                + "at any time. By default, the entire input image is kept "
                + "in cache (value 1). This is the fastest but consume "
                + "more memory. Set to 0 to disable the cache (will be slow "
                + "especially with compressed images such as jpg and png).");
        inputCacheRatioOption.setType(PatternOptionBuilder.NUMBER_VALUE);
        options.addOption(inputCacheRatioOption);

        Option helpOption = new Option("h", "help", false,
                "Display this help message and exit.");
        options.addOption(helpOption);

        CommandLineParser parser = new DefaultParser();
        try {
            CommandLine commandLine = parser.parse(options, args);

            if (commandLine.hasOption(helpOption.getOpt())) {
                printHelp(options);
                return;
            }

            File inputFile = new File(
                    commandLine.getOptionValue(inputOption.getOpt()));
            String inputFileBaseName = FilenameUtils.getBaseName(
                    inputFile.getName());

            String outputFolder = commandLine.getOptionValue(outputOption.getOpt());

            Number tileSizeNumber = (Number) commandLine.getParsedOptionValue(
                    tileSizeOption.getOpt());
            int tileSize = tileSizeNumber == null
                    ? 254 : tileSizeNumber.intValue();

            Number tileOverlapNumber = (Number) commandLine.getParsedOptionValue(
                    tileOverlapOption.getOpt());
            int tileOverlap = tileOverlapNumber == null
                    ? 1 : tileOverlapNumber.intValue();

            String tileFormat = commandLine.getOptionValue(
                    tileFormatOption.getOpt());
            if (tileFormat == null) {
                tileFormat = FilenameUtils.getExtension(inputFile.getName());
            }

            Number parallelismNumber = (Number) commandLine.getParsedOptionValue(
                    parallelismOption.getOpt());
            int parallelism = parallelismNumber == null
                    ? Runtime.getRuntime().availableProcessors()
                    : parallelismNumber.intValue();

            Number inputCacheRatioNumber
                    = (Number) commandLine.getParsedOptionValue(
                            inputCacheRatioOption.getOpt());
            float cachePercentage = inputCacheRatioNumber == null
                    ? 1
                    : inputCacheRatioNumber.floatValue();

            ScalablePyramidBuilder spb = new ScalablePyramidBuilder(
                    tileSize, tileOverlap, tileFormat, "dzi");

            try {
                long start = System.currentTimeMillis();
                logger.info(inputFile + " - is about to start to build a pyramid.");

                try (FilesArchiver archiver = FilesArchiverFactory
                        .createFromURI(outputFolder)) {
                    spb.buildPyramid(
                            //@darwinjob new DirectImageReader(inputFile),
                    		new BioFormatsImageReader(inputFile),
                            inputFileBaseName,
                            archiver,
                            parallelism,
                            cachePercentage);
                }
                float duration = (System.currentTimeMillis() - start) / 1000F;
                //System.out.println("Pyramid built in " + duration + "s.");
                logger.info(inputFile + " - pyramid built in " + duration + "s.");
            } catch (Exception ex) {
                //System.err.println("Error while building the pyramid.");
            	logger.severe(inputFile + " - error while building the pyramid.");
                ex.printStackTrace();
                System.exit(-1);
            }
        } catch (ParseException ex) {
            //System.err.println(ex.getMessage());
            logger.severe(ex.getMessage());
            printHelp(options);
            System.exit(-1);
        }

    }

    private static void printHelp(Options options) {
        new HelpFormatter().printHelp("pyramidio", options);
    }
}
