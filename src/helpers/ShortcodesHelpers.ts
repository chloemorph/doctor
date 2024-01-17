import { join } from "path";
import * as fg from "fast-glob";
import * as cheerio from "cheerio";
import {
  IconRenderer,
  CalloutRenderer,
  TableOfContentsRenderer,
} from "../shortcodes";
import { Shortcode, TocPosition } from "@models";
import { Logger, TelemetryHelper } from "@helpers";
import { existsAsync } from "@utils";

export class ShortcodesHelpers {
  private static shortcodes: Shortcode = {
    icon: IconRenderer,
    callout: CalloutRenderer,
    toc: TableOfContentsRenderer,
  };

  /**
   * Initialize the shortcodes
   * @param shortcodes
   */
  public static async init(shortcodes: string = "./shortcodes") {
    let files: string[] = [];
    if (await existsAsync(shortcodes)) {
      files = await fg(`${shortcodes}/**/*.js`.replace(/\\/g, "/"));
    }

    Logger.debug(`Doctor found ${files.length} custom shortcodes`);

    // Load all the custom shortcodes
    if (files && files.length > 0) {
      for (const file of files) {
        const sc = await require(join(process.cwd(), file));
        if (sc && sc.name && sc.render) {
          ShortcodesHelpers.shortcodes[sc.name] = {
            render: sc.render,
            beforeMarkdown: !!sc.beforeMarkdown,
          };
        }
      }
    }

    TelemetryHelper.trackCustomShortcodes(files.length);
  }

  /**
   * Parse shortcodes before markdown was processed
   * @param htmlMarkup
   */
  public static async parseBefore(markdown: string): Promise<string> {
    return this.parse(markdown, true);
  }

  /**
   * Parse shortcodes after markdown was processed
   * @param htmlMarkup
   */
  public static async parseAfter(htmlMarkup: string): Promise<string> {
    return this.parse(htmlMarkup, false);
  }

  /**
   * Parse the markdown or HTML with the shortcodes
   * @param htmlMarkup
   */
  private static async parse(
    htmlMarkup: string,
    beforeMarkdown: boolean
  ): Promise<string> {
    if (!ShortcodesHelpers.shortcodes) return htmlMarkup;

    let tags = Object.getOwnPropertyNames(ShortcodesHelpers.get());
    if (!tags || tags.length < 1) return htmlMarkup;

    for (const tag of tags) {
      if (typeof ShortcodesHelpers.shortcodes[tag].render !== "function") {
        throw new Error(`Missing render function for shortcode tag: "${tag}"`);
      }
    }

    tags = tags.filter(
      (tag) =>
        ShortcodesHelpers.shortcodes[tag].beforeMarkdown === beforeMarkdown
    );

    Logger.debug(`Doctor uses ${tags.length} shortcodes for HTML parsing.`);
    TelemetryHelper.trackShortcodeUsage(tags.length);

    const $ = cheerio.load(htmlMarkup, {
      xmlMode: true,
      decodeEntities: false,
    });

    for (const tag of tags) {
      const elms = $(tag).toArray();
      Logger.debug(
        `Doctor found ${elms.length} element(s) for "${tag}" shortcode.`
      );
      if (elms && elms.length > 0) {
        const shortcode = ShortcodesHelpers.shortcodes[tag];

        let tocPostProcessing: string | null = null;
        for (const elm of elms) {
          if (elm && shortcode && shortcode.render) {
            Logger.debug(`Executing shortcode "${tag}"`);

            const $elm = $(elm);
            const attributes: any = this.getAllAttributes($elm.get(0));

            if (
              tag === "toc" &&
              attributes &&
              attributes.position &&
              (attributes.position.toLowerCase() === TocPosition.left ||
                attributes.position.toLowerCase() === TocPosition.right)
            ) {
              tocPostProcessing = attributes.position;
            }

            const scHtml = await shortcode.render(attributes, $elm.html());
            $elm.replaceWith(scHtml);

            Logger.debug(`Shortcode "${tag}" its HTML:`);
            Logger.debug(scHtml);
            Logger.debug(``);
          }
        }

        if (tocPostProcessing) {
          const $parent = $(".doctor__container");
          const $elm = $(".doctor__container__toc");
          if ($elm && $parent) {
            $elm.prependTo($parent);
            $parent
              .find(".doctor__container__markdown")
              .addClass(
                `doctor__container__markdown_${tocPostProcessing.toLowerCase()}_padding`
              );
          }
        }
      }
    }

    Logger.debug(`The HTML after shortcode convertion`);
    Logger.debug($.html());
    Logger.debug(``);

    return $.html();
  }

  /**
   * Get all attributes
   * @param $elm
   */
  public static getAllAttributes($elm: any) {
    const allAttr = {};

    if ($elm.attribs) {
      const names = Object.keys($elm.attribs);

      for (const name of names) {
        allAttr[`${name}`] = $elm.attribs[name];
      }
    }
    return allAttr;
  }

  /**
   * Retrieve all registered shortcodes
   */
  public static get() {
    return ShortcodesHelpers.shortcodes;
  }
}
