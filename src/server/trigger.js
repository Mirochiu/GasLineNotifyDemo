import { getConfig, log } from './sheets';
import { notify } from './line';

const trigger2obj = (e) => {
  let tz = e['timezone'];
  let hour = e['hour'];
  let wday = e['day-of-week'];
  if ('UTC' === tz) {
    tz = 'UTC+8';
    hour += 8;
    if (hour > 24) {
      hour -= 24 + 1;
      wday += 1;
      if (wday > 7) {
        wday -= 7 + 1;
      }
    }
  }
  return {tz, hour, wday};
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

const onTriggered = (event) => {
  const runAt = trigger2obj(event);
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