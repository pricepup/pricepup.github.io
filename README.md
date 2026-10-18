# PricePup 格價狗：安裝方法（Android）

整個 app 只係幾個檔案，放上 GitHub Pages 就有一條免費嘅 https 網址，然後喺 Android Chrome「安裝」做 app。

## 1. 放上 GitHub Pages（一次性，大約 10 分鐘，用電腦做最方便）

1. 去 github.com 開一個免費帳戶
2. 撳右上角「+」→ New repository，名叫 `pricepup`，揀 **Public**，再撳 Create
3. 撳「uploading an existing file」，將以下檔案拖入去，再撳 Commit changes：
   `index.html`、`manifest.webmanifest`、`sw.js`、`icon-192.png`、`icon-512.png`、`icon-maskable-512.png`
4. 去 Settings → Pages，Branch 揀 `main`、`/ (root)`，然後撳 Save
5. 等一兩分鐘，網址就會係：`https://你嘅帳戶名.github.io/pricepup/`

注意：Public repo 即係其他人睇得到程式碼，但**你嘅價錢數據唔會上傳**，只會存喺電話入面。`wahhing-meat-2026-08-15.json` 唔使上傳。

## 2. 安裝落 Android 電話

1. 用 Chrome 打開上面條網址
2. 撳右上角「⋮」→「安裝應用程式」（或者「新增至主畫面」）
3. 第一次掃 barcode 時，允許使用相機

## 3. 匯入華興肉價（8 月 15 日）

1. 將 `wahhing-meat-2026-08-15.json` 傳去電話（例如經 Google Drive 或者 WhatsApp 傳畀自己）
2. 喺 app 入面去「設定」→「匯入備份（合併）」，揀呢個檔案
3. 會加入 43 件產品：牛肉、豬肉、雞肉、火鍋肉類全部按 $/lb 計，走地雞按隻計

## 4. 使用貼士

- 語言：「設定」入面可以揀繁體中文或者 English
- 肉、菜呢類冇 barcode 嘅貨，計價方式揀「按磅」或者「按公斤」，app 會自動換算埋 $/kg 或者 $/lb，方便唔同舖頭比較
- 第一次影價錢牌要上網下載文字辨識（大約 10MB），之後離線都用得
- 價錢牌嘅毫子如果印到細細個喺上面（例如 14⁹⁷），有時會讀唔到毫子，app 會叫你自己補返
- 產品填咗「類別」同「可用次數」，「比較」頁就會排邊件最抵
- 每個月去「設定 → 匯出備份」存一次去 Google Drive

## 更新 app

將新嘅 `index.html`（同其他改咗嘅檔案）上傳去 GitHub 覆蓋舊檔就得。下次開 app 會自動更新，有時要關咗再開兩次先見到。
