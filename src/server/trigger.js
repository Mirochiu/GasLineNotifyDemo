import { getConfig, log } from './sheets';
import { notify } from './line';

// https://developers.google.com/apps-script/reference/base/weekday
const WEEKDAYS = [
  ScriptApp.WeekDay.MONDAY,
  ScriptApp.WeekDay.TUESDAY,
  ScriptApp.WeekDay.WEDNESDAY,
  ScriptApp.WeekDay.THURSDAY,
  ScriptApp.WeekDay.FRIDAY,
  ScriptApp.WeekDay.SATURDAY,
  ScriptApp.WeekDay.SUNDAY,
];

const event2date = (e) => {
  //作一下檢驗紀錄,避免後續Apps Script平台有改變策略
  if ('UTC' !== e.timezone) log('trigger event.timezone not utc:', e.timezone);
  let date = new Date(Date.UTC(
    e.year, e.month-1, e['day-of-month'],
    e.hour, e.minute, e.second
  ));
  return {
    date,
    event: e,
    hour: date.getHours(),
    wday: date.getDay() == 0 ? 7 : date.getDay(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

const fetchAndFilterStockByNumber = (list) => {
  const res = UrlFetchApp
    .fetch('https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_data');
  return Utilities
    .parseCsv(res.getContentText())
    .filter(r => list.includes(r[0]))
    .map(r => ({
      id:r[0],
      name:r[1],
      openPrice:r[4],
      closePrice:r[7],
    }));
}

//https://developers.google.com/apps-script/guides/triggers/events
const onTriggered = (event) => {
  const runAt = event2date(event);
  try {
    if (runAt.wday>=6 || runAt.hour!=14) return;
    const concerned = getConfig('ConcernedStocks').split(',');
    const filtered = fetchAndFilterStockByNumber(concerned);
    if (filtered.length !== concerned.length) {
      log(`過濾後資料數量不吻合 f:${filtered.length} !== ${concerned.length} l:${concerned.join(',')}`);
    }
    const msg = filtered
      .map(r => `${r.name}(${r.id}) 開盤:${r.openPrice} 收盤:${r.closePrice}`)
      .join('\n');
    log(msg);
    notify(msg);
  }
  catch (e) {
    log('發生錯誤', e);
  }
}

export {
  onTriggered,
};