import { getConfig, log } from './sheets';
import { notify } from './line';

// https://developers.google.com/apps-script/guides/triggers/events#time-driven_events
const TRA_CH_TO_TRIGGER_DAYOF_WEEKEY = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  日: 7,
};

const event2date = (e) => {
  // 作一下檢驗紀錄,避免後續Apps Script平台有改變策略
  if (e.timezone !== 'UTC') log('trigger event.timezone not utc:', e.timezone);
  const date = new Date(
    Date.UTC(e.year, e.month - 1, e['day-of-month'], e.hour, e.minute, e.second)
  );
  return {
    date,
    event: e,
    hour: date.getHours(),
    wday: date.getDay() === 0 ? 7 : date.getDay(),
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const fetchAndFilterStockByNumber = (list) => {
  const URL =
    'https://www.twse.com.tw/exchangeReport/STOCK_DAY_ALL?response=open_data';
  const res = UrlFetchApp.fetch(URL);
  return Utilities.parseCsv(res.getContentText())
    .filter((r) => list.includes(r[0]))
    .map((r) => ({
      id: r[0],
      name: r[1],
      openPrice: parseFloat(r[4]),
      closePrice: parseFloat(r[7]),
    }));
};

const DELAY_MSEC = 2000;
const TRY_TIMES = 3;

const fetchStocksClosedDays = () => {
  const URL =
    'https://www.twse.com.tw/holidaySchedule/holidaySchedule?response=open_data';
  let content;
  let tries = TRY_TIMES;
  while (tries > 0) {
    const res = UrlFetchApp.fetch(URL, { muteHttpExceptions: true });
    const code = res.getResponseCode();
    if (code >= 200 || code <= 299) {
      content = res.getContentText();
      break;
    }
    tries -= 1;
    Utilities.sleep(DELAY_MSEC);
  }
  if (!content) return null;
  return Utilities.parseCsv(content)
    .shift() // 移除欄位名稱的那一列
    .map((r) => ({
      name: r[0],
      // CSV檔案內的格式是民國年月日=>XXXYYZZ
      date: new Date(
        1911 + parseInt(r[1].substring(0, 3), 10),
        parseInt(r[1].substring(3, 5), 10) - 1, // 因為Date的month是從0開始,而不是1月的1開始
        parseInt(r[1].substring(5), 10)
      ),
      wday: TRA_CH_TO_TRIGGER_DAYOF_WEEKEY[r[2]] || r[2],
      comments: r[3],
    }));
};

// https://developers.google.com/apps-script/guides/triggers/events
const onTriggered = (event) => {
  try {
    // for test or trigger from editor
    if (event === undefined) {
      log('施行觸發測試中...');
      notify('施行觸發測試中...');
    } else {
      const runAt = event2date(event);
      if (runAt.wday >= 6 || runAt.hour != 14) return;

      const closedDay = fetchStocksClosedDays();
      if (Array.isArray(closedDay)) {
        const matched = closedDay.find(
          ({ date }) =>
            date.getDate() === runAt.date.getDate() &&
            date.getMonth() === runAt.date.getMonth() &&
            date.getFullYear() === runAt.date.getFullYear()
        );
        if (matched) {
          log('今天是股票休假日', matched, runAt);
          return;
        }
      } else {
        log(`無法取得股票休息日資訊`);
        notify('無法取得股票休息日資訊');
        // 仍繼續執行
      }
    }

    const concerned = getConfig('ConcernedStocks').split(',');
    if (concerned.length < 1) {
      log('沒有設定要關注的股票號碼');
      return;
    }

    const filtered = fetchAndFilterStockByNumber(concerned);
    if (filtered.length !== concerned.length) {
      log(
        `過濾後資料數量不吻合 f:${filtered.length} !== ${
          concerned.length
        } l:${concerned.join(',')}`
      );
    }

    if (filtered.length == 0) {
      const msg = `過濾後找不到任何資料  ${concerned.length}`;
      log(msg);
      notify(msg);
      return;
    }

    const priceComp = (c, o) => {
      if (c > o) return `▲ ${(c - o).toFixed(2)}`;
      if (o > c) return `▼ ${(o - c).toFixed(2)}`;
      return '—';
    };
    const msg = filtered
      .map(
        (r) =>
          `${r.name}(${r.id}) 收盤:${r.closePrice} ${priceComp(
            r.closePrice,
            r.openPrice
          )}`
      )
      .join('\n');
    log(msg);
    notify(msg);
  } catch (e) {
    log('發生錯誤', e);
    try {
      notify(e.message);
    } catch (e2) {
      log('錯誤通知失敗', e2);
    }
  }
};

export { onTriggered };
