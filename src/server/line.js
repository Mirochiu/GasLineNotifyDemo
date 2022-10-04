import { getConfig } from './sheets';

export const notify = (text) => {
  if (typeof text !== 'string') throw new Error('資料錯誤');
  if (!text.trim()) throw new Error('不能傳送空白訊息');
  const result = UrlFetchApp.fetch(
    'https://notify-api.line.me/api/notify',
    {
      method: 'post',
      headers: { Authorization: `Bearer ${getConfig('lineToken')}` },
      payload: { message: `${text}` },
    }
  );
  return {
    text: result.getContentText(),
    code: result.getResponseCode()
  };
};
