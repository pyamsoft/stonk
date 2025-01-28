/*
 * Copyright 2024 pyamsoft
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { bold, codeBlock, italic } from "../../bot/discord/format";
import { Quote } from "../model/QuoteResponse";

const NBSP = "\u00a0";

const formatSymbol = function (symbol: string): string {
  return `${symbol}`;
};

const formatCompany = function (company: string): string {
  return company;
};

const formatAmountDirection = function (changeAmount: number): string {
  return changeAmount === 0 ? "" : changeAmount > 0 ? "+" : "-";
};

const formatPrice = function (price: number): string {
  return `${price.toFixed(2)}`;
};

const formatChangePercent = function (percent: number): string {
  return `${Math.abs(percent).toFixed(2)}%`;
};

const formatChangeAmount = function (change: number): string {
  return `${Math.abs(change).toFixed(2)}`;
};

export const outputQuote = function (quote: Quote): string {
  const { symbol, companyName, normalMarket, afterMarket } = quote;

  const messageSymbol = bold(formatSymbol(symbol));
  const messageCompany = italic(formatCompany(companyName));

  const messageNormalPrice = formatPrice(normalMarket.price);
  const messageNormalDirection = formatAmountDirection(
    normalMarket.changeAmount,
  );
  const messageNormalChangeAmount = formatChangeAmount(
    normalMarket.changeAmount,
  );
  const messageNormalPercent = formatChangePercent(normalMarket.changePercent);

  const messageAfterHoursPrice = afterMarket
    ? formatPrice(afterMarket.price)
    : "";
  const messageAfterHoursDirection = afterMarket
    ? formatAmountDirection(afterMarket.changeAmount)
    : "";
  const messageAfterHoursChangeAmount = afterMarket
    ? formatChangeAmount(afterMarket.changeAmount)
    : "";
  const messageAfterHoursPercent = afterMarket
    ? formatChangePercent(afterMarket.changePercent)
    : "";
  return `
${messageSymbol}${NBSP}${NBSP}${NBSP}${NBSP}${messageCompany}
${codeBlock(`diff
${messageNormalPrice}
${messageNormalDirection} ${messageNormalChangeAmount} [${messageNormalPercent}]
${
  afterMarket
    ? `
(After Hours)
${messageAfterHoursPrice}
${messageAfterHoursDirection} ${messageAfterHoursChangeAmount} [${messageAfterHoursPercent}]
`
    : ""
}
`)}`;
};
