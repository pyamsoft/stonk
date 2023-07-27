// https://github.com/pstadler/ticker.sh/blob/acquire-yahoo-finance-session/ticker.sh

// First we fetch YF to get a cookie

import { cookieJar, htmlApi } from "../util/api";
import { newLogger } from "../bot/logger";

const logger = newLogger("YahooApi");

/**
 * Hold onto this for the lifespan of our bot session
 */
let crumb = "";

export const authYahooFinance = async function (): Promise<string> {
  if (crumb) {
    logger.log("Cached crumb: ", crumb);
    return crumb;
  }

  try {
    // Get a cookie first
    // We may be able to grab the crumb from the returned HTML context here
    // https://github.com/gadicc/node-yahoo-finance2/issues/633
    const pageHtml = await htmlApi<string>("https://finance.yahoo.com");
    const cookies = await cookieJar.getCookies("yahoo.com");
    cookies.forEach((c) => logger.log("Cookie: ", c));

    // Could also match on window.YAHOO.context = { /* multi-line JSON */ }
    const match = pageHtml.match(/\nwindow.YAHOO.context = ({[\s\S]+\n});\n/);
    if (!match) {
      logger.warn("Could not find window.YAHOO.context!");
      return "";
    }

    let context;
    const maybeContextJsonString = match[1];
    try {
      context = JSON.parse(maybeContextJsonString);
    } catch (e) {
      logger.error(
        e,
        "Could not parse window.YAHOO.context.",
        maybeContextJsonString
      );
      return "";
    }

    crumb = context.crumb;
    if (!crumb) {
      logger.warn("Could not find crumb :(");
      return "";
    }

    // Use the cookie to get a crumb
    // const res = await htmlApi(
    //   "https://query1.finance.yahoo.com/v1/test/getcrumb"
    // );
    // logger.log("Auth YF with crumb: ", res);
    // crumb = res as string;
  } catch (e) {
    logger.error(e, "Error getting YF crumb");
  }

  return crumb;
};
