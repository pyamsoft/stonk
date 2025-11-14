import yf from "yahoo-finance2";

export const YahooFinance = new yf({
  suppressNotices: ["yahooSurvey"],
});
