import { join, dirname, basename } from "path";
import { CommandArguments, HeaderOptions } from "@models";
import {
  ArgumentsHelper,
  CliCommand,
  FileHelpers,
  FolderHelpers,
  Logger,
  execScript,
} from "@helpers";

export class HeaderHelper {
  /**
   * Set the page header based on the settings in the page's front matter
   * @param filePath
   * @param webUrl
   * @param slug
   * @param header
   * @param options
   */
  public static async set(
    filePath: string,
    webUrl: string,
    slug: string,
    header: HeaderOptions,
    options: CommandArguments,
    isCopy: boolean = false
  ) {
    const { assetLibrary, startFolder, overwriteImages } = options;

    Logger.debug(`Setting the page header for ${slug}`);

    let setPageHeader = `spo page header set --webUrl "${webUrl}" --pageName "${slug}"`;
    const headerLength = setPageHeader.length;

    if (header) {
      if (header.type) {
        setPageHeader = `${setPageHeader} --type "${header.type}"`;
      }

      if (header.image) {
        const imgDirectory = join(dirname(filePath), dirname(header.image));
        const imgPath = join(dirname(filePath), header.image);

        const uniStartPath = startFolder.replace(/\\/g, "/");
        const folders = imgDirectory
          .replace(/\\/g, "/")
          .replace(uniStartPath, "")
          .split("/");
        let crntFolder = assetLibrary;

        // Start folder creation process
        crntFolder = await FolderHelpers.create(crntFolder, folders, webUrl);
        await FileHelpers.create(crntFolder, imgPath, webUrl, overwriteImages);

        const imgUrl = FileHelpers.getRelUrl(
          webUrl,
          `${crntFolder}/${basename(header.image)}`
        );
        setPageHeader = `${setPageHeader} --imageUrl "${imgUrl}"`;

        if (header.altText) {
          setPageHeader = `${setPageHeader} --altText "${header.altText}"`;
        }

        if (typeof header.translateX !== "undefined") {
          setPageHeader = `${setPageHeader} --translateX "${header.translateX}"`;
        }

        if (typeof header.translateY !== "undefined") {
          setPageHeader = `${setPageHeader} --translateY "${header.translateY}"`;
        }
      }

      if (header.layout) {
        setPageHeader = `${setPageHeader} --layout "${header.layout}"`;
      }

      if (header.textAlignment) {
        setPageHeader = `${setPageHeader} --textAlignment "${header.textAlignment}"`;
      }

      if (header.showTopicHeader) {
        setPageHeader = `${setPageHeader} --showTopicHeader`;
      }

      if (header.topicHeader) {
        setPageHeader = `${setPageHeader} --topicHeader "${header.topicHeader}"`;
      }

      if (header.showPublishDate) {
        setPageHeader = `${setPageHeader} --showPublishDate`;
      }

      if (header.authors) {
        setPageHeader = `${setPageHeader} --authors "${header.authors.join(
          ","
        )}"`;
      }
    }

    if (header || (!header && !isCopy)) {
      // Check if header is changed
      if (headerLength === setPageHeader.length) {
        return;
      }
      await execScript(
        ArgumentsHelper.parse(`${setPageHeader}`),
        CliCommand.getRetry()
      );
    }
  }
}
