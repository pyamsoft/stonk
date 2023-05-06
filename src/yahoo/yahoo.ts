// https://github.com/pstadler/ticker.sh/blob/acquire-yahoo-finance-session/ticker.sh

// First we fetch YF to get a cookie

import { htmlApi } from "../util/api";
import { newLogger } from "../bot/logger";

const logger = newLogger("YahooApi");

let crumb = "";

export const authYahooFinance = async function (): Promise<string> {
  if (crumb) {
    logger.log("Cached crumb: ", crumb);
    return crumb;
  }

  try {
    // Get a cookie first
    await htmlApi("https://finance.yahoo.com");

    // Use the cookie to get a crumb
    const res = await htmlApi(
      "https://query1.finance.yahoo.com/v1/test/getcrumb"
    );
    logger.log("CRUMB: ", res);
    crumb = res as string;
  } catch (e) {
    logger.error(e, "Error getting YF crumb");
  }

  return crumb;
};
