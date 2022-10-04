# Line Notify Demo for GAS (Google Apps Script)

## 紀錄一下開發過程

1. 初始化專案
1. 改設定
1. 加上log,讓前/後端都可以紀錄log
1. 加上儲存/讀取line通知的token功能
1. 加上傳送line的通知功能
1. 修改界面
1. 修正彈跳視窗方式與動畫

### 1. 初始化專案與第一次部屬

1. 拷貝 template

   `git clone https://github.com/Mirochiu/React-Google-Apps-Script.git`

1. 登入

   登入clasp,已有本機登入者請略過
   `npm run login`

1. 第一次部屬

  `npm run setup`
  `npm run deploy`

  deploy後會顯示2個網址
  1. 第一個是Sheet的網址
  1. 第二個是Apps Script的網址,也就是這script的那個
     `Created new Google Sheets Add-on script ....`
     網址會像 `https://script.google.com/home/projects/18F.....eT/edit`

  點擊右上角的部屬→選"新增部屬作業"
  1. 左上齒輪→選取類型→選"網頁應用程式"
  1. 右邊→誰可以存取→改"所有人"
  1. 右下方→部屬按鈕
  1. 點擊→授予存取權

  之後的過程
  1. 彈出google登入→選擇登入你的帳號
  1. 彈出→"Google hasn’t verified this app"→點擊左下的小字"Advanced"→點擊下面小字"Go to My React Project (unsafe)"
  1. 彈出→"My React Project wants to access your Google Account"→點擊"Allow"
  1. 顯示→網頁應用程式→這裡會顯示你的{部屬ID}→這裡會顯示取得{你的Webapp網址}→點擊"完成"

  - 部屬ID會類似: `AKf.....YoKA`
  - 部屬網址會是對應的: `https://script.google.com/macros/s/AKf.....YoKA/exec`

   為了不讓網址一直改,所以我們要使用同一個{部屬ID}

### 2. 使用第一次獲得的部屬ID修改

開啟package.json把你的{部屬ID}放到script裡頭

在script底下的deploy

- 從本來的

   `"deploy": "rimraf dist && npm run build && npx clasp push",`

- 改成

   `"deploy": "rimraf dist && npm run build && npx clasp push && npx clasp deploy --deploymentId {部屬ID}",`

然後在上面新增一個指令

`"web": "npx clasp open --webapp --deploymentId {部屬ID}",`

(本Repo已經調整過,是把部屬ID寫到`.clasp.json`裡頭的deployId)

修改`appsscript.json`, 加上webapp的設定
```json
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
```

若沒有加入webapp設定,會顯示成下面這樣
![](./resource/trouble_on_appscript.json_without_webapp_section.png)

- 發布版本

   `npm run deploy`

- 查看網頁

   `npm run web`

- 本機界面測試

   `npm run serve`

- 遠端界面測試

   `npm run start`

### 3. 使用按鈕寫入log

1. 新增工作表

    先在google sheet那邊新增工作表並改名'紀錄檔'

2. 改server新增一個log函數

    在server裡頭開新的函數,就叫做log,新增在`src/server/sheets.js`最下面

    ```javascript
    export const log = (...args) => {
      const s = SpreadsheetApp.getActive().getSheetByName('紀錄檔')
      s.appendRow(Array.prototype.concat(new Date(), args));
    }
    ```

    log函數解釋:宣告一個function叫做log,並匯出;從SpreadsheetApp取得綁定的試算表,再用getSheetByName抓出工作表'紀錄檔',然後插入一列,內容是先紀錄下當下時間,後面接著列出送給log函數的所有參數

3. 開放log函數給client使用

    函數開好之後要對client端開放,所以改`src/server.index.ts`檔案

    請在import後面加上函數名稱log,然後在後面的export中也加上log
    ```javascript
    import { getSheetsData, addSheet, deleteSheet, setActiveSheet, log } from './sheets';
    ...
    export {
    ...
      log,
    };
    ```
    這個動作的解釋:因為每個檔案是被當作一個模組看待,所以需要先從sheet模組匯入log函數,再匯出給client才能在網頁裡頭使用。

4. 改client網頁

    在client端網頁有個按鈕,按了之後會顯示url,我們現在想在按了按鈕的時候寫入log

    `src/client/demo-bootstrap/components/App.jsx`

    因為按按鈕會改`showBtn`這個state,所以我們用`React.useEffect`去關注這個state的變化

    ```jsx
      const onShowUrlChanged = () => {
        if (showUrl) {
          console.log('clicked');
          serverFunctions.log('clicked');
        }
      }

      React.useEffect(onShowUrlChanged, [showUrl]);
    ```

    動作解釋:我們用`React.useEffect`註冊關注變化的函數onShowUrlChanged,並在關注陣列中寫上showUrl,這樣react就會在state內容改變時通知onShowUrlChanged;而我們想要當使用者按下按鈕時紀錄一下,要用if判斷showUrl是否為true(showUrl初始化沒有給值,預設為null)

    *`React.useEffect`如果簡寫成useEffect,就需要在檔案前頭作import的動作*

    在sheet的工作表'紀錄檔',就會看到使用者按下顯示url時的log,時間,以及文字
    ![](./resource/clicked_log.png)

### 4. 加上儲存/讀取line通知的token功能(未完待續)
### 5. 加上傳送line的通知功能(未完待續)
### 6. 修改界面(未完待續)
### 6. 修正彈跳視窗方式與動畫(未完待續)
