const { DateTime, Interval } = require("luxon");

const NYSE_ZONE = "America/New_York";

// keys are formatted as year,month,day
const HOLIDAYS = {
  "2020,1,1": "New Years Day",
  "2020,1,20": "Martin Luther King, Jr. Day",
  "2020,2,17": "Washington's Birthday",
  "2020,4,10": "Good Friday",
  "2020,5,25": "Memorial Day",
  "2020,7,3": "Independence Day",
  "2020,9,7": "Labor Day",
  "2020,11,26": "Thanksgiving Day",
  "2020,12,25": "Christmas Day",
  "2021,1,1": "New Years Day",
  "2021,1,18": "Martin Luther King, Jr. Day",
  "2021,2,15": "Washington's Birthday",
  "2021,4,2": "Good Friday",
  "2021,5,31": "Memorial Day",
  "2021,7,5": "Independence Day",
  "2021,9,6": "Labor Day",
  "2021,11,25": "Thanksgiving Day",
  "2021,12,24": "Christmas Day",
  "2022,1,17": "Martin Luther King, Jr. Day",
  "2022,2,21": "Washington's Birthday",
  "2022,4,15": "Good Friday",
  "2022,5,30": "Memorial Day",
  "2022,7,4": "Independence Day",
  "2022,9,5": "Labor Day",
  "2022,11,24": "Thanksgiving Day",
  "2022,12,26": "Christmas Day",
};

function whichHoliday(date) {
  const year = date.year;
  const month = date.month;
  const day = date.day;
  return HOLIDAYS[`${year},${month},${day}`] || null;
}

function isMarketOpen(date, holiday) {
  // Closed on recognized holidays
  if (holiday) {
    return false;
  }

  // Closed on weekends
  const weekday = date.weekday;
  if (weekday <= 0 || weekday >= 6) {
    return false;
  }

  // Make sure we are within hours
  const marketOpenTime = DateTime.local()
    .setZone(NYSE_ZONE)
    .set({ hours: 9, minutes: 0, seconds: 0, milliseconds: 0 });

  const marketCloseTime = DateTime.local()
    .setZone(NYSE_ZONE)
    .set({ hours: 12 + 4, minutes: 0, seconds: 0, milliseconds: 0 });

  const interval = Interval.fromDateTimes(marketOpenTime, marketCloseTime);
  return interval.contains(date);
}

function updateActivity(callback) {
  const now = DateTime.local().setZone(NYSE_ZONE);
  const holiday = whichHoliday(now);
  callback(
    `Market ${isMarketOpen(now, holiday) ? "Open" : "Closed"}${
      holiday ? ` for ${holiday}` : ""
    }`
  );
}

// Log the bot in
module.exports = {
  watchStatus: (client, callback) => {
    updateActivity(callback);

    const timeout = 10 * 60 * 1000;
    return client.setInterval(() => {
      updateActivity(callback);
    }, timeout);
  },
};
