'use strict';
const APP_VERSION = '5.5.0';
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const fmtDate = s => { if (!s) return ''; const [y,m,d] = s.split('-'); return `${y}/${+m}/${+d}`; };
const daysAgo = s => Math.round((Date.parse(today()) - Date.parse(s)) / 864e5);
// sale/flyer validity: ended = promotion is over; upcoming = flyer preview not started yet
const isEnded = o => !!(o.until && o.until < today());
const isUpcoming = o => !!(o.date && o.date > today());
const isCurrent = o => !isEnded(o) && !isUpcoming(o);
const fmtWhen = ms => { if (!ms) return t('never'); const d = new Date(+ms), dd = daysAgo(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`); return `${dd <= 1 ? tf('ago', dd) : `${d.getMonth()+1}/${d.getDate()}`} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const lsGet = k => { try { return localStorage.getItem(k); } catch(e) { return null; } };
const lsSet = (k,v) => { try { localStorage.setItem(k, v); } catch(e) {} };
const LB_G = 453.592;
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

/* ---------- i18n ---------- */
const I18N = {
  appName:['格價狗','PricePup'], tagline:['幫你嗅出最抵價！','Sniffing out the best deals!'], hello:['今日去邊度格價？','Where are we shopping today?'],
  tabItems:['產品','Items'], tabScan:['掃描','Scan'], tabDeals:['特價','Deals'], tabSettings:['設定','Settings'],
  scanBtn:['掃描 barcode','Scan barcode'], logNoBarcode:['＋ 記錄價錢（冇 barcode）','＋ Log a price (no barcode)'],
  search:['搜尋產品、牌子、舖頭…','Search items, brands, stores…'], emptyList:['仲未有產品。登入同步之後就會見到共用數據。','No items yet. Sign in to sync to see shared data.'],
  noMatch:['狗狗搵唔到符合嘅產品','The pup found no matching items'], histLow:['歷史最低','All-time low'], bestNow:['近 30 日最平','Best last 30 days'],
  noPrice:['未有價錢','No price yet'], addPrice:['記錄價錢','Log a price'], byStore:['各舖價錢（近 30 日）','Prices by store (last 30 days)'],
  noRecent:['近 30 日冇價錢紀錄','No prices in the last 30 days'], store:['舖頭','Store'], variant:['款式','Variant'], price:['價錢','Price'], unitP:['單位價','Unit price'],
  cheapest:['最抵','Best'], sale:['特價','Sale'], trend:['單位價走勢','Unit price trend'], history:['全部紀錄','All records'], variants:['款式（牌子／容量）','Variants (brand / size)'],
  reg:['原價','Reg.'], perLb:['/lb','/lb'], perKg:['/kg','/kg'], perL:['/L','/L'], perPc:['/件','/ea'], perUse:['/次','/use'],
  chooseItem:['揀主產品','Choose item'], chooseItemHint:['呢件貨屬於邊件主產品？例如「洗衣液」、「白米」、「平椰菜」','Which main item is this? e.g. "Laundry detergent", "Rice", "Flat cabbage"'],
  newItem:['＋ 新增主產品','＋ New main item'], itemName:['主產品名稱（中文）','Item name (Chinese)'], itemEn:['英文名（選填）','English name (optional)'],
  cat:['類別','Category'], mode:['點樣比較','Compare by'], modePack:['包裝貨（比 $/L、$/kg 或 $/件）','Packaged ($/L, $/kg or $/ea)'], modeWeight:['散裝秤重（比 $/lb）','Loose by weight ($/lb)'],
  useLoads:['按可用次數比較（例如洗衣液 $/次）','Compare per use (e.g. detergent $/load)'],
  newVariant:['＋ 新款式','＋ New variant'], brand:['牌子','Brand'], desc:['款式描述（選填）','Description (optional)'], size:['容量／重量','Size'], unit:['單位','Unit'],
  uses:['可用次數（選填）','Number of uses (optional)'], barcode:['Barcode','Barcode'], unitCount:['件／個','pcs'],
  pricePack:['價錢 ($)','Price ($)'], priceLb:['價錢 ($/lb)','Price ($/lb)'], priceKg:['價錢 ($/kg)','Price ($/kg)'], perWhat:['價錢單位','Priced per'],
  multi:['幾多件呢個價（例如「2 件 $5」就填 2）','Multi-buy deal? How many for this price (normal = 1; a box with 2 inside is still 1)'], storePh:['例如 Superstore','e.g. Superstore'],
  date:['日期','Date'], note:['備註（選填）','Note (optional)'], save:['儲存','Save'], saved:['已儲存','Saved'], needPrice:['請輸入價錢','Please enter a price'],
  needName:['請填名稱','Please enter a name'], needVariant:['請揀或者新增款式','Choose or add a variant'], needSize:['請填容量／重量','Please enter the size'],
  ocrBtn:['📷 影價錢牌（自動讀價）','📷 Snap price tag (auto-read)'], ocrFirst:['🔎 第一次用要下載文字辨識（約 10MB），請等等…','🔎 First use downloads the text reader (~10MB)…'],
  ocrReading:['🔎 狗狗讀緊價錢牌…','🔎 The pup is reading the tag…'], ocrNone:['讀唔到價錢，請手動輸入','Couldn\'t read a price — please type it'],
  ocrPick:['撳選正確嘅價錢（第一個已自動填入）：','Tap the right price (first one is filled in):'], ocrCents:['讀唔到毫子，請補返','Couldn\'t read the cents — please add them'],
  ocrFail:['文字辨識載入失敗，請手動輸入','Text reader failed to load — please type it'], each:['每件','Each'],
  vType:['輸入價錢，狗狗即刻同歷史比較','Type a price and the pup compares it with history'], vFirst:['第一次記錄呢件貨','First record for this item'],
  savedLow:['汪！已儲存：歷史新低！🎉','Woof! Saved — new all-time low! 🎉'], savedEq:['已儲存：同歷史最低一樣','Saved — matches the all-time low'],
  lookingUp:['🔎 狗狗查緊產品資料…','🔎 The pup is sniffing out product info…'], found:['✅ 搵到：','✅ Found: '], notFound:['資料庫搵唔到呢個 barcode，請揀返主產品','Barcode not in the database — choose the main item'],
  dealsTitle:['今期特價','Current deals'], allStores:['全部','All'], dealsHint:['近 14 日嘅特價，按折扣排序','Sales from the last 14 days, biggest discount first'], noDeals:['近 14 日未有特價紀錄','No sales recorded in the last 14 days'],
  setTitle:['設定','Settings'], lang:['語言 Language','Language 語言'], syncTitle:['數據同步','Data sync'],
  syncDesc:['用 Google 登入之後，大家共用同一個價錢資料庫，冇網絡時都照用。','Sign in with Google to share one price database with everyone. Works offline.'],
  tabFav:['⭐ 我的最愛','⭐ Favourites'], tabAll:['全部產品','All items'], noFav:['未有最愛。撳產品右邊嘅 ☆ 就可以加入，方便追蹤價錢。','No favourites yet. Tap ☆ on an item to track it here.'],
  lastSync:['最後同步：','Last sync: '], never:['未同步過','never'], latestFlyer:['最新傳單：','Latest flyers: '], loadedOn:['入庫','loaded'],
  usersTitle:['用戶（管理員）','Users (admin)'], usersTotal:[n=>`共 ${n} 個用戶`,n=>`${n} users in total`], usersActive:[n=>`${n} 個 10 分鐘內喺度用緊`,n=>`${n} active in the last 10 min`], usersNote:['用戶開過 4.3 或之後嘅版本先會出現','Users appear after opening v4.3 or later'],
  ended:['已完','Ended'], starts:['開始','starts'], usageTitle:['Firebase 用量（管理員）','Firebase usage (admin)'],
  usageHint:['免費額度每日太平洋時間午夜重設','Free daily quota resets at midnight Pacific'], usageLoad:['載入用量','Load usage'], usageLoading:['載入中…','Loading…'],
  usageReads:['讀取','Reads'], usageWrites:['寫入','Writes'], usageDeletes:['刪除','Deletes'], usageToday:['今日','Today'], usagePeak:['近 7 日最高讀取','7-day peak reads'],
  usageNoApi:['要先喺 Google Cloud 開啟 Cloud Monitoring API','Enable the Cloud Monitoring API in Google Cloud first'], usageFail:['讀唔到用量：','Could not load usage: '], usageConsole:['喺 Firebase 控制台睇','Open in Firebase console'],
  eachP:['每件','Each'], uAuto:['自動單位','Auto unit'], unitPref:['單位價顯示','Unit price display'],
  meas_w:['重量','weight'], meas_v:['容量','volume'], meas_pc:['件數','count'], meas_use:['次數','uses'],
  gFull:['飽肚','Full'], gJoy:['開心','Happy'], gPetBtn:['摸摸 Regen','Pet Regen'], gFeedBtn:['餵零食','Give a treat'],
  gHint:['🦴 每日 3 粒免費零食 · 🪙 記錄價錢賺金幣 · 💧 每 12 個鐘換水','🦴 3 free treats a day · 🪙 log a price = 1 coin, new product = 2 · 💧 change water every 12 h'],
  gWxCredit:['天氣資料：Open-Meteo.com','Weather data: Open-Meteo.com'], gFeels:['體感','feels'],
  gWeak:['好肚餓…冇晒力…','So hungry… no energy…'], gWeakPet:['…（輕輕搖咗下尾）','…(a tiny tail wag)'], gRevive:['有力喇！多謝你救咗我！','Energy’s back! You saved me!'],
  gGrumpy:['哼！咁耐都唔嚟睇我…','Hmph! You haven’t visited for ages…'], gGrumpPet:['…唔好以為摸一下就算','…one pat won’t fix it'],
  gYawn:['呵～（伸懶腰）你返嚟喇？','Yawn~ (stretch) you’re back?'], gWelcome:['汪！我好掛住你！','Woof! I missed you!'], gHi:['汪！一齊玩呀！','Woof! Let’s play!'],
  gNoTreat:['今日零食食晒喇～記錄價錢賺金幣，再去商店買！','No treats left — log prices to earn coins and buy more at the shop!'],
  gIdle1:['嗅嗅…今日邊度有特價？','Sniff sniff… any deals today?'], gIdle2:['陪我玩多陣啦','Stay and play a bit'], gIdle3:['我幫你睇住價錢㗎！','I’m watching prices for you!'],
  gPooHint:['💩 Regen 屙咗便便，撳一下清走佢，佢先會開心返！','💩 Regen pooped — tap it to clean up so he’s happy again!'],
  gRename:['改名／換狗仔顏色','Rename / change colour'], adoptTitle:['狗仔店','Puppy shop'], adoptShop:['格價狗狗仔店','PricePup Puppy Shop'],
  adoptHello:['歡迎嚟到狗仔店！','Welcome to the puppy shop!'], adoptPickAgain:['想換顏色？','Want a different colour?'], adoptPick:['揀一隻你鍾意嘅狗仔','Pick the puppy you like'], adoptThis:['就係佢！','This one!'],
  col_white:['白色','White'], col_black:['黑色','Black'], col_brown:['啡色','Brown'], adoptName:['幫你隻狗仔改個名','Give your puppy a name'], adoptNamePh:['例如 Regen','e.g. Regen'],
  adoptBack:['返去揀','Back'], adoptDone:['完成','Done'], adoptNeedName:['請幫狗仔改個名','Please give your puppy a name'], adoptPromise:['狗仔領養同改名之後，就唔可以再改。','Once your puppy is adopted and named, it can’t be changed.'],
  gWater:['清水','Water'], gPetShort:['摸摸','Pet'], gFeedShort:['零食','Treat'], gWaterBtn:['換水','Water'], gToyBtn:['玩具','Toys'], gShopBtn:['商店','Shop'],
  gWaterDirty:['💧 水開始污糟喇，記得幫 Regen 換水。','💧 The water is getting dirty — change it for Regen.'], gWaterBad:['💧 水太污糟，Regen 唔肯飲，佢好口渴！快啲換水。','💧 The water is too dirty — Regen won’t drink and is thirsty! Change it now.'],
  gEating:['Regen 食緊','Regen is eating'], gChewing:['Regen 咬緊玩具','Regen is chewing'], gBusy:['等 Regen 做完先～','Wait till Regen is done~'], gBusyChew:['Regen 玩緊咬咬玩具，佢想自己玩一陣～','Regen is busy with the chew toy — let him play~'],
  shopTitle:['花園商店','Garden shop'], shopHint:['每記錄一個價錢賺 1 個金幣（每日最多 20 個）。每件玩具可以玩 10 次。','Log a price: 1 coin. Add a new product: 2 coins, even without a price (up to 20 a day). Each toy lasts 10 plays.'],
  shop_treat1:['1 粒零食','1 treat'], shop_treat5:['5 粒零食','5 treats'], shop_ball:['波波','Ball'], shop_rope:['拔河繩','Tug rope'], shop_chew:['咬咬玩具','Chew toy'],
  toyTitle:['玩具箱','Toy box'], toyOld:['舊咗又污糟，要買過新嘅','Old and dirty — time for a new one'], toyBin:['掉咗佢','Throw away'], toyPlay:['玩！','Play!'],
  toyNone:['仲未有玩具，去商店買啦！','No toys yet — get one at the shop!'], gToyWeak:['Regen 太肚餓，冇力玩，先餵佢食嘢啦。','Regen is too hungry to play — give a treat first.'],
  ropeHint:['㩒住繩尾粒藍波，向邊度拉都得！放手就 Regen 贏；快速大力一拉就你贏。','Hold the blue knot and pull any way! Let go and Regen wins; a quick strong yank and you win.'],
  ballHint:['👆 向上掃個波！愈快愈遠','👆 Swipe the ball up! Faster = farther'],
  tabTrack:['Tracking','Tracking'], backCats:['All categories','All categories'], trackBtn:['Track','Track'], tracking:['Tracking','Tracking'],
  trackOn:['🔔 Tracking — you’ll get an alert when it hits a 30-day low.','🔔 Tracking — you’ll get an alert when it hits a 30-day low.'], trackOff:['🔕 Stopped tracking','🔕 Stopped tracking'],
  track30:['30-day low now','30-day low now'], trackNone:['Nothing tracked yet. Tap 🔕 Track on an item or product page.','Nothing tracked yet. Tap 🔕 Track on an item or product page.'],
  trackAlertTitle:['🔔 30-day low!','🔔 30-day low!'], trackAlertHint:['These tracked prices are at their best of the last 30 days right now.','These tracked prices are at their best of the last 30 days right now.'],
  noBarcode:['No barcode? Log a price','No barcode? Log a price'], scanSeeAll:['See all prices for this item','See all prices for this item'], scanTapInfo:['Details','Details'], scanDetails:['Scanned product','Scanned product'],
  pdName:['Name','Name'], pdBrand:['Brand','Brand'], pdSize:['Size','Size'], pdBarcode:['Barcode','Barcode'], pdCats:['Type','Type'], pdOff:['View on Open Food Facts','View on Open Food Facts'],
  updTitle:['New version available','New version available'], updBtn:['Update now','Update now'], updLater:['Later','Later'], updDoing:['Updating…','Updating…'],
  notiTitle:['Notifications','Notifications'], notiHint:['Get a phone notification when your puppy needs you or a tracked price hits its 30-day low (while the app is open or in the background).','Get a phone notification when your puppy needs you or a tracked price hits its 30-day low (while the app is open or in the background).'],
  notiOn:['Turn on notifications','Turn on notifications'], notiOnDone:['Notifications are on','Notifications are on'], notiTest:['Send a test','Send a test'], notiTestBody:['🐶 Woof! Notifications work.','🐶 Woof! Notifications work.'],
  notiDenied:['Notifications are blocked. Allow them for this app in your phone’s settings.','Notifications are blocked. Allow them for this app in your phone’s settings.'],
  notiNo:['Not available here. On iPhone, add the app to your Home Screen first, then open it from there.','Not available here. On iPhone, add the app to your Home Screen first, then open it from there.'],
  needTap:['Tap to help','Tap to help'], gTapHint:['Tap the puppy to pet him','Tap the puppy to pet him'],
  allAisles:['All','All'], deptL:['Department','Department'], aisleL:['Aisle','Aisle'], itemName1:['Item name','Item name'],
  apTitle:['Add this product','Add this product'], apHint:['No database has this barcode yet. Tell the pup what it is — it will be remembered for everyone next time.','No database has this barcode yet. Tell the pup what it is — it will be remembered for everyone next time.'],
  apName:['Product name','Product name'], apSize:['Size','Size'], apSave:['Save product','Save product'], apSaved:['Saved: ','Saved: '], apThanks:['🐾 Thanks! Now pick the item it belongs to.','🐾 Thanks! Now pick the item it belongs to.'],
  notFound2:['Barcode not found in any database.','Barcode not found in any database.'],
  coinPlus:['🪙 +1 金幣！可以去花園商店買嘢俾 Regen','🪙 +1 coin! Spend it at the garden shop for Regen'],
  coinPlus2:['🪙 +2 金幣！多謝你加咗新產品','🪙 +2 coins for adding a new product! Spend them at the garden shop for Regen'],
  treatPlus:['🦴 +1 零食俾 Regen！','🦴 +1 treat for Regen!'],
  curTitle:['🏷️ 而家嘅特價同最新價錢','🏷️ Current deals & latest prices'], curHint:['傳單有效期內嘅特價，同近 7 日記錄嘅價錢，最抵排先','Valid flyer deals and prices logged in the last 7 days, cheapest first'],
  curNone:['而家冇有效特價，近 7 日亦冇人記錄價錢','No valid deals now and no prices logged in the last 7 days'], logged:['記錄','logged'],
  varHint:['撳入去睇呢款喺各舖嘅價錢、走勢同紀錄','Tap one for its prices by store, trend and history'], looseTitle:['散裝價錢（各舖）','Loose prices by store'],
  scanGot:['📷 掃描到：','📷 Scanned: '], scanLog:['記錄呢件嘅價錢','Log its price'], scanOther:['唔係，揀其他','Not this, choose another'], scanKnown:['📷 掃描到呢款，下面係佢嘅特價同價錢紀錄。想記錄新價錢就撳下面個掣。','📷 Scanned this product — its deals and price history are below. Tap the button to log a new price.'],
  showAll:[n=>`顯示全部（${n}）`,n=>`Show all (${n})`],
  suggested:['建議','Suggested'], whatsNew:['有乜新？','What’s new'], gotIt:['知道','Got it'],
  noSize:['呢款冇容量資料，計唔到單位價，只顯示價錢','No size on record, so prices are shown without unit price'],
  allCats:['全部','All'], varHist:['呢款嘅價錢紀錄','Price history for this variant'], curDeals:['而家嘅特價','Current deals'], noCurDeal:['而家冇特價','No current deal'], logThis:['記錄呢款嘅價錢','Log a price for this one'],
  install:['📲 安裝','📲 Install'], installTitle:['將格價狗加到主畫面','Add PricePup to your home screen'], installed:['已安裝！以後喺主畫面打開就得','Installed! Open it from your home screen'],
  iosSteps:['1. 撳 Safari 下面嘅「分享」掣 ⬆️<br>2. 揀「加入主畫面」<br>3. 撳「新增」','1. Tap the Share button ⬆️ in Safari<br>2. Choose “Add to Home Screen”<br>3. Tap “Add”'],
  otherSteps:['喺瀏覽器選單（⋮ 或 ⋯）揀「安裝應用程式」或者「加到主畫面」。','In the browser menu (⋮ or ⋯) choose “Install app” or “Add to Home screen”.'],
  guide:['📖 使用教學','📖 How to use'], next:['下一步','Next'], skip:['略過','Skip'], start:['開始使用','Let’s go'], close2:['關閉','Close'],
  g1t:['汪！歡迎用格價狗','Woof! Welcome to PricePup'], g1:['記低每次買餸嘅價錢，狗狗幫你搵歷史最低價，同埋邊間超市最抵。','Log what you pay and the pup finds the all-time low and the cheapest store.'],
  g2t:['先登入','Sign in first'], g2:['去「設定」用 Google 登入，就可以同大家共用價錢資料庫，你嘅最愛都會同步去其他裝置。','Go to Settings and sign in with Google to share one price database with everyone; your favourites sync too.'],
  g3t:['記價錢','Log a price'], g3:['撳下面「掃描」影 barcode，或者喺產品頁撳「記錄價錢」。仲可以影價錢牌，狗狗自動讀價。','Tap Scan to read a barcode, or tap “Log a price” on an item. You can also snap the price tag and the pup reads it.'],
  g4t:['睇價錢','Compare prices'], g4:['產品頁有歷史最低、各舖最新價錢同走勢；撳某個牌子／容量，睇嗰款自己嘅紀錄。撳 ☆ 加入最愛，首頁一撳就見到。','Each item shows the all-time low, latest prices by store and a trend; tap a brand/size to see its own history. Tap ☆ to add it to your favourites.'],
  g5t:['睇特價','Find deals'], g5:['「特價」頁有各超市今期傳單特價，逢星期三更新；「已完」嘅特價會變灰。','The Deals tab lists this week’s flyer deals, updated every Wednesday; ended deals turn grey.'],
  g6:['💡 用瀏覽器開緊？撳右上角「📲 安裝」，將格價狗加到主畫面，用起嚟好似 App 一樣。','💡 Using a browser? Tap “📲 Install” at the top right to add PricePup to your home screen.'],
  favOn:['已加入最愛','Added to favourites'], favOff:['已從最愛移除','Removed from favourites'], favBtn:['最愛','Favourite'],
  signIn:['用 Google 登入並開始同步','Sign in with Google to sync'], signOut:['登出','Sign out'], signedInAs:['已登入：','Signed in: '],
  sOff:['未開啟','Off'], sConnecting:['連接中…','Connecting…'], sSynced:['已同步','Synced'], sSyncing:['同步中…','Syncing…'], sOffline:['離線（稍後自動上傳）','Offline (uploads later)'], sError:['同步出錯','Sync error'],
  notAllowed:['呢個 Google 帳戶未獲准使用','This Google account is not allowed'], signInFail:['登入失敗，請再試','Sign-in failed, please try again'],
  data:['數據','Data'], credit:['產品資料來自 Open Food Facts 同各超市網上 flyer；新鮮食品插畫來自 OpenMoji（CC BY-SA 4.0）','Product info from PricePup users, Open Food Facts (ODbL) and UPCitemdb, plus weekly store flyers; fresh-food illustrations by OpenMoji (CC BY-SA 4.0)'],
  scanAim:['將 barcode 對準方框','Point at the barcode'], scanNo:['呢個瀏覽器唔支援即時掃描，請手動輸入','Live scanning not supported — type the barcode'],
  scanCam:['開唔到相機（請允許相機權限），可以用相片或者手動輸入','Camera unavailable — use a photo or type it'],
  torch:['電筒','Torch'], fromPhoto:['用相片讀','From photo'], close:['關閉','Close'], manualPh:['或者手動輸入 barcode 數字','Or type the barcode number'], ok:['確定','OK'],
  needCode:['請輸入 barcode 數字','Enter the barcode digits'], badCode:['barcode 唔啱','Invalid barcode'], noDetect:['呢個瀏覽器唔支援讀 barcode','Barcode reading not supported'],
  photoNoCode:['相入面搵唔到 barcode','No barcode found in the photo'], photoFail:['讀唔到相片','Couldn\'t read the photo'],
  takePhoto:['影相','Take photo'], photo:['相片','Photo'], photoHint:['網上搵到相就唔使影；影嘅相會壓縮後存入雲端','No need to shoot if a web photo was found; photos are compressed and saved to the cloud'], unnamed:['（未命名）','(unnamed)'], loose:['散裝','loose'], records:['筆紀錄','records'], items:['件產品','items'], off:['折','off']
};
const I18NF = {
  vLow:[(d,m,s)=>`汪！歷史新低！比之前最低（${m}，${s}）平 ${d}`,(d,m,s)=>`Woof! New all-time low — ${d} below the previous low (${m}, ${s})`],
  mixNote:[k=>`呢件產品嘅款式計法唔同，最平只比較按「${k}」計嘅款式。`,k=>`Variants here are measured differently; “lowest” only compares those priced per ${k}.`],
  gTreatsLine:[(f,F,b,c)=>`🦴 免費 <b>${f}/${F}</b> · 零食 <b>${b}</b> · 🪙 <b>${c}</b>`,(f,F,b,c)=>`🦴 Free <b>${f}/${F}</b> · Treats <b>${b}</b> · 🪙 <b>${c}</b>`],
  gTitle:[n=>`${n} 嘅花園`,n=>`${n}’s garden`], adoptWelcome:[n=>`🎉 歡迎 ${n} 返屋企！`,n=>`🎉 Welcome home, ${n}!`],
  shopCoins:[n=>`你有 🪙 <b>${n}</b> 個金幣`,n=>`You have 🪙 <b>${n}</b> coins`], shopBought:[n=>`買咗 ${n}`,n=>`Bought ${n}`], toyLeft:[n=>`仲可以玩 ${n} 次`,n=>`${n} plays left`], toyWorn:[n=>`${n}玩咗 10 次，舊咗喇～要買過新嘅。`,n=>`The ${n} has been played 10 times and is worn out — buy a new one.`],
  gTreatsMini:[(f,F,b,c)=>`🦴 ${f}/${F}${b ? ' +' + b : ''} · 🪙 ${c}`,(f,F,b,c)=>`🦴 ${f}/${F}${b ? ' +' + b : ''} · 🪙 ${c}`],
  bondUp:[(n,L)=>`💗 ${n}’s bond is now Lv ${L}!`,(n,L)=>`💗 ${n}’s bond is now Lv ${L}!`],
  updBody:[(v,o)=>`Version ${v} is ready (you have ${o}).`,(v,o)=>`Version ${v} is ready (you have ${o}).`],
  needTitle:[n=>`🐶 ${n} needs you`,n=>`🐶 ${n} needs you`], needWeak:[n=>`${n} is very hungry and weak!`,n=>`${n} is very hungry and weak!`],
  needThirsty:[n=>`${n} is thirsty — the water is too dirty.`,n=>`${n} is thirsty — the water is too dirty.`], needDirty:[n=>`${n} pooped — please clean it up.`,n=>`${n} pooped — please clean it up.`],
  needGrumpy:[n=>`${n} feels lonely. Come and play!`,n=>`${n} feels lonely. Come and play!`], needHungry:[n=>`${n} is getting hungry.`,n=>`${n} is getting hungry.`],
  needWater:[n=>`${n}’s water is getting dirty.`,n=>`${n}’s water is getting dirty.`],
  scanGuess:[n=>`狗狗估係「${n}」，下面係呢類產品嘅價錢。`,n=>`The pup thinks it belongs to “${n}”.`],
  vEq:[(s,dt)=>`同歷史最低一樣（${s}，${dt}）`,(s,dt)=>`Same as the all-time low (${s}, ${dt})`],
  vHigh:[(d,p,m,s,dt)=>`比歷史最低 ${m}（${s}，${dt}）貴 ${d}（+${p}%）`,(d,p,m,s,dt)=>`${d} (+${p}%) above the all-time low of ${m} (${s}, ${dt})`],
  itemsAt:[(n,pr)=>`${n} 件 ${pr}`,(n,pr)=>`${n} for ${pr}`], count:[(i,o)=>`${i} 件產品 · ${o} 筆價錢`,(i,o)=>`${i} items · ${o} prices`],
  ago:[d=>d<=0?'今日':d===1?'琴日':`${d} 日前`,d=>d<=0?'today':d===1?'yesterday':`${d} days ago`]
};
let LANG = 'en'; // English only from 5.0
const LI = () => LANG === 'zh' ? 0 : 1;
const t = k => (I18N[k] || [k, k])[LI()];
const tn = (k, n) => I18N[k][LI()](n);
const tf = (k, ...a) => I18NF[k][LI()](...a);
const CATS = [['水果蔬菜','Produce'],['肉類','Meat'],['海鮮','Seafood'],['奶類蛋','Dairy & eggs'],['麵包','Bakery'],['米麵乾貨','Rice, noodles & pantry'],['調味醬料','Sauces & seasoning'],['早餐穀物','Breakfast'],['零食','Snacks'],['飲品','Drinks'],['急凍','Frozen'],['清潔用品','Household cleaning'],['個人護理','Personal care'],['其他','Other']];
const catLabel = c => { const f = CATS.find(x => x[0] === c); return f ? f[LI()] : (c || ''); };
/* ---------- Catalogue: 15 departments, each with aisles (5.1, modelled on Superstore and Walmart) ---------- */
const DEPTS = [
  ['produce', 'Produce', '🥬', [['fruit', 'Fruit'], ['veg', 'Vegetables'], ['salad', 'Salads & herbs'], ['precut', 'Pre-cut'], ['tofu', 'Tofu & plant protein']]],
  ['meat', 'Meat', '🥩', [['chicken', 'Chicken & turkey'], ['beef', 'Beef'], ['pork', 'Pork'], ['sausage', 'Sausages & hot dogs'], ['deli', 'Deli meats'], ['lamb', 'Lamb & other']]],
  ['seafood', 'Fish & seafood', '🐟', [['fish', 'Fresh fish'], ['shellfish', 'Shellfish'], ['frozen', 'Frozen seafood'], ['canned', 'Canned & smoked']]],
  ['dairy', 'Dairy & eggs', '🥛', [['milk', 'Milk'], ['plant', 'Plant milks'], ['cream', 'Cream'], ['cheese', 'Cheese'], ['yogurt', 'Yogurt'], ['butter', 'Butter'], ['eggs', 'Eggs'], ['dips', 'Sour cream & dips']]],
  ['bakery', 'Bakery', '🍞', [['bread', 'Bread'], ['buns', 'Buns & bagels'], ['wraps', 'Tortillas & wraps'], ['asian', 'Asian bakery'], ['cakes', 'Cakes & pastries']]],
  ['pantry', 'Pantry', '🍚', [['rice', 'Rice'], ['noodles', 'Pasta & noodles'], ['canned', 'Canned & jarred'], ['grains', 'Beans & grains'], ['baking', 'Baking'], ['oils', 'Oils & vinegar'], ['spreads', 'Spreads, honey & syrup'], ['meals', 'Easy meals']]],
  ['sauces', 'Sauces & seasoning', '🧂', [['condiments', 'Condiments'], ['asian', 'Asian sauces'], ['pasta', 'Pasta sauce'], ['spices', 'Spices'], ['stock', 'Stock & bouillon']]],
  ['breakfast', 'Breakfast & hot drinks', '🥣', [['cereal', 'Cereal'], ['oatmeal', 'Oatmeal'], ['coffee', 'Coffee'], ['tea', 'Tea'], ['pancake', 'Pancake & waffle']]],
  ['snacks', 'Snacks', '🍪', [['chips', 'Chips'], ['crackers', 'Crackers'], ['cookies', 'Cookies'], ['candy', 'Chocolate & candy'], ['bars', 'Bars'], ['nuts', 'Nuts & dried fruit'], ['popcorn', 'Popcorn & pretzels']]],
  ['drinks', 'Drinks', '🧃', [['water', 'Water'], ['pop', 'Pop'], ['juice', 'Juice'], ['energy', 'Sports & energy'], ['wellness', 'Coffee, tea & wellness drinks']]],
  ['frozen', 'Frozen', '🧊', [['meals', 'Meals & pizza'], ['veg', 'Vegetables & fruit'], ['asian', 'Dumplings & Asian'], ['meat', 'Meat & seafood'], ['icecream', 'Ice cream & desserts'], ['fries', 'Fries & appetizers']]],
  ['intl', 'International', '🌏', [['eastasian', 'East Asian'], ['southasian', 'South Asian'], ['latin', 'Latin'], ['mideast', 'Middle Eastern'], ['european', 'European'], ['halal', 'Halal & kosher']]],
  ['household', 'Household', '🧴', [['paper', 'Paper towels & tissue'], ['laundry', 'Laundry'], ['dish', 'Dish'], ['cleaners', 'Cleaners'], ['bags', 'Garbage & food bags'], ['wrap', 'Foil & wrap']]],
  ['personal', 'Personal care & health', '🧼', [['oral', 'Oral care'], ['hair', 'Hair'], ['body', 'Body & soap'], ['deodorant', 'Deodorant'], ['feminine', 'Feminine care'], ['medicine', 'Medicine & vitamins']]],
  ['babypet', 'Baby & pet', '🍼', [['diapers', 'Diapers & wipes'], ['formula', 'Formula'], ['babyfood', 'Baby food'], ['dog', 'Dog food'], ['cat', 'Cat food'], ['pet', 'Pet supplies']]]
];
const DEPT = Object.fromEntries(DEPTS.map(d => [d[0], d]));
// the old one-level categories map to a department (and back, for the weekly flyer importer)
const CAT_DEPT = { '水果蔬菜': 'produce', '肉類': 'meat', '海鮮': 'seafood', '奶類蛋': 'dairy', '麵包': 'bakery', '米麵乾貨': 'pantry', '調味醬料': 'sauces', '早餐穀物': 'breakfast', '零食': 'snacks', '飲品': 'drinks', '急凍': 'frozen', '清潔用品': 'household', '個人護理': 'personal', '其他': 'pantry' };
const DEPT_CAT = { produce: '水果蔬菜', meat: '肉類', seafood: '海鮮', dairy: '奶類蛋', bakery: '麵包', pantry: '米麵乾貨', sauces: '調味醬料', breakfast: '早餐穀物', snacks: '零食', drinks: '飲品', frozen: '急凍', intl: '米麵乾貨', household: '清潔用品', personal: '個人護理', babypet: '其他' };
// aisle by item name, checked within the item's department first ([regex, 'dept/aisle'])
const AISLE_RX = {
  produce: [[/tofu|plant protein|tempeh/, 'produce/tofu'], [/salad|herb|cilantro|parsley|\bmint\b|basil|\bdill\b/, 'produce/salad'], [/cut |stir.?fry|platter|veggie tray/, 'produce/precut'],
    [/apple|banana|berr|grape|orange|mandarin|clementine|lemon|lime|mango|melon|pear|peach|nectarine|plum|cherr|kiwi|pineapple|avocado|pomegranate|persimmon|fruit|papaya|lychee|longan|coconut|fig|date/, 'produce/fruit'], [/./, 'produce/veg']],
  meat: [[/deli|\bham\b|salami|bologna|cold cut|pepperoni|prosciutto/, 'meat/deli'], [/sausage|hot ?dog|wiener|longanisa|tocino|bratwurst|chorizo|kielbasa/, 'meat/sausage'],
    [/chicken|turkey|duck|drumstick|wing|thigh/, 'meat/chicken'], [/beef|steak|brisket|veal(?!.*lamb)/, 'meat/beef'], [/pork|rib|bacon|belly|loin|chop|shoulder/, 'meat/pork'], [/./, 'meat/lamb']],
  seafood: [[/canned|smoked|tuna|sardine|anchov/, 'seafood/canned'], [/shrimp|prawn|crab|lobster|mussel|clam|scallop|oyster|squid|octopus/, 'seafood/shellfish'], [/frozen/, 'seafood/frozen'], [/./, 'seafood/fish']],
  dairy: [[/egg/, 'dairy/eggs'], [/sour cream|\bdips?\b|hummus|tzatziki|guacamole/, 'dairy/dips'], [/cheese|paneer|parmesan|mozzarella|cheddar|bocconcini|feta|ricotta|brie/, 'dairy/cheese'], [/yogh?urt|kefir/, 'dairy/yogurt'], [/butter|margarine|ghee/, 'dairy/butter'],
    [/plant|almond|oat (milk|bev)|soy|coconut (milk|bev)/, 'dairy/plant'], [/cream|creamer/, 'dairy/cream'], [/./, 'dairy/milk']],
  bakery: [[/tortilla|wrap|naan|pita|roti|chapati|paratha/, 'bakery/wraps'], [/chinese|bao|bun.*(lotus|bbq)|asian|steamed/, 'bakery/asian'], [/bun|bagel|muffin|croissant|roll|english/, 'bakery/buns'],
    [/cake|pie|pudding|dessert|pastr|donut|tart|cheesecake|brownie|danish/, 'bakery/cakes'], [/./, 'bakery/bread']],
  pantry: [[/rice(?! (cake|noodle|vinegar))/, 'pantry/rice'], [/noodle|pasta|spaghetti|ramen|udon|vermicelli|macaroni|lasagna/, 'pantry/noodles'], [/flour|sugar|baking|chocolate chip|yeast|cake mix|condensed|evaporated|cocoa|pie shell/, 'pantry/baking'],
    [/\boil\b|vinegar|olive|canola/, 'pantry/oils'], [/peanut butter|jam|honey|syrup|maple|nutella|spread/, 'pantry/spreads'], [/bean|lentil|chickpea|grain|quinoa|barley|couscous/, 'pantry/grains'],
    [/canned|soup|tomato|pulp|corn|tuna/, 'pantry/canned'], [/./, 'pantry/meals']],
  sauces: [[/stock|broth|bouillon|soup base|hot ?pot/, 'sauces/stock'], [/pasta sauce|tomato sauce|marinara|pesto|alfredo/, 'sauces/pasta'],
    [/soy|hoisin|oyster|teriyaki|chil|curry|fish sauce|asian|sriracha|gochujang|sambal|marinade|msg|seasoning powder|sesame/, 'sauces/asian'], [/spice|salt|pepper|seasoning|herb|masala|cumin|turmeric|cinnamon/, 'sauces/spices'], [/./, 'sauces/condiments']],
  breakfast: [[/coffee|espresso/, 'breakfast/coffee'], [/\btea\b|matcha/, 'breakfast/tea'], [/oat|porridge|congee/, 'breakfast/oatmeal'], [/pancake|waffle/, 'breakfast/pancake'], [/./, 'breakfast/cereal']],
  snacks: [[/popcorn|pretzel/, 'snacks/popcorn'], [/cracker|rice cake|seaweed/, 'snacks/crackers'], [/cookie|biscuit|wafer/, 'snacks/cookies'], [/chocolate|candy|gum|gumm|licorice|jelly|mints/, 'snacks/candy'],
    [/\bbars?\b|granola/, 'snacks/bars'], [/nut|almond|cashew|pistachio|dried|jerky|seed|trail/, 'snacks/nuts'], [/./, 'snacks/chips']],
  drinks: [[/water/, 'drinks/water'], [/energy|sports|gatorade|electrolyte/, 'drinks/energy'], [/juice|lemonade|cocktail/, 'drinks/juice'], [/pop|soda|cola|soft drink|ginger ale/, 'drinks/pop'], [/./, 'drinks/wellness']],
  frozen: [[/ice cream|gelato|kulfi|frozen dessert|popsicle|frozen yogh?urt|sorbet/, 'frozen/icecream'], [/fries|potato|appeti|onion ring|spring roll|samosa/, 'frozen/fries'], [/dumpling|gyoza|wonton|bao|asian|siu mai|har gow/, 'frozen/asian'],
    [/fruit|berr|veg|pea|corn|broccoli/, 'frozen/veg'], [/chicken|beef|fish|shrimp|nugget|burger|meatball|seafood|wing/, 'frozen/meat'], [/./, 'frozen/meals']],
  household: [[/paper towel|toilet|bathroom tissue|tissue|napkin/, 'household/paper'], [/laundry|detergent|softener|dryer|bleach/, 'household/laundry'], [/dish/, 'household/dish'],
    [/garbage|trash|bag|ziploc/, 'household/bags'], [/foil|wrap|parchment/, 'household/wrap'], [/./, 'household/cleaners']],
  personal: [[/tooth|oral|mouthwash|floss|dental/, 'personal/oral'], [/shampoo|conditioner|hair/, 'personal/hair'], [/deodorant|antiperspirant/, 'personal/deodorant'], [/\bpads?\b|tampon|feminine|liner/, 'personal/feminine'],
    [/vitamin|medicine|pain|cold|allergy|supplement|probiotic/, 'personal/medicine'], [/diaper|baby wipe/, 'babypet/diapers'], [/./, 'personal/body']],
  babypet: [[/formula/, 'babypet/formula'], [/baby food|puree|toddler|pouch/, 'babypet/babyfood'], [/dog/, 'babypet/dog'], [/cat\b|kitten/, 'babypet/cat'], [/pet|litter/, 'babypet/pet'], [/./, 'babypet/diapers']]
};
// names that point to another department whatever the old category says
const AISLE_ANY = [[/chocolate spread|\bhoney\b|\bjam\b|marmalade|maple syrup|peanut butter|nut butter|nutella/, 'pantry/spreads'], [/cooking oil|oil spray|vinegar|olive oil/, 'pantry/oils'],
  [/^dips?\b|hummus|sour cream/, 'dairy/dips'], [/ground .*coffee|whole bean|instant coffee|coffee pods/, 'breakfast/coffee'], [/tea bags|loose tea/, 'breakfast/tea'], [/\btofu\b/, 'produce/tofu'],
  [/halal|kosher/, 'intl/halal'], [/kimchi|korean|japanese|miso\b|furikake/, 'intl/eastasian'], [/mango pulp|rasmalai|gulab|kulfi|indian sweets|achar/, 'intl/southasian'],
  [/longanisa|tocino|filipino|mexican|plantain/, 'intl/latin'], [/tahini|halloumi|za.?atar|baklava/, 'intl/mideast']];
// English names for items that were created with a Chinese name only (the app is English-only from 5.0)
const EN_NAME = { '牛仔骨': 'Beef short ribs (flanken)', '牛腱（有骨）': 'Beef shank (bone-in)', '牛腱（無骨）': 'Beef shank (boneless)', '牛腳': 'Beef feet', '牛坑腩': 'Beef rib fingers (flank)',
  '牛筋': 'Beef tendon', '牛頸骨': 'Beef neck bones', '牛筒骨': 'Beef marrow bones', '牛尾': 'Oxtail', '新鮮瘦牛肉': 'Lean beef (fresh)', '牛柏葉': 'Beef tripe (omasum)', '牛骨': 'Beef bones', '大牛腩': 'Beef brisket',
  '豬腩肉（無骨）': 'Pork belly (boneless)', '排骨': 'Pork spare ribs', '豬扒': 'Pork chops', '豬扒（有皮）': 'Pork chops (skin-on)', '梅頭肉': 'Pork shoulder butt', '梅頭肉（有皮）': 'Pork shoulder butt (skin-on)',
  '豬髀肉': 'Pork leg', '豬手／全隻': 'Pork hock (whole)', '豬蹄／圓蹄': 'Pork trotters', '豬肚': 'Pork stomach', '豬大腸': 'Pork intestines', '豬頭骨': 'Pork head bones', '豬骨': 'Pork bones',
  '雞髀肉（去骨去皮）': 'Chicken thighs (boneless, skinless)', '雞腿（連背）': 'Chicken legs (back attached)', '小雞髀': 'Chicken drumsticks', '大雞腳': 'Chicken feet (large)', '雞爪': 'Chicken feet',
  '雞胸肉': 'Chicken breast', '雞翼': 'Chicken wings', '雞翼（斬件）': 'Chicken wings (split)', '雞肫': 'Chicken gizzards', '火鍋牛肉片': 'Hot pot beef slices', '火鍋牛腩片': 'Hot pot beef brisket slices',
  '火鍋羊肉片': 'Hot pot lamb slices', '火鍋豬肉片': 'Hot pot pork slices', '牛／豬肉丸': 'Beef / pork balls', '走地雞': 'Free-range chicken' };
const itemEn = it => it.en || EN_NAME[it.name] || it.name || '';
function aisleOf(it) {
  if (it.aisle && DEPT[it.aisle.split('/')[0]]) return it.aisle; // set by hand
  const s = `${itemEn(it)} ${it.id || ''}`.toLowerCase();
  let d = CAT_DEPT[it.cat] || 'pantry';
  if (/diaper|baby wipe|infant formula|baby food|baby care/.test(s)) d = 'babypet';
  if (/\bdog\b|\bcat food|kitten|litter|\bpet\b/.test(s)) d = 'babypet';
  for (const [rx, a] of AISLE_ANY) if (rx.test(s)) return a;
  for (const [rx, a] of AISLE_RX[d] || []) if (rx.test(s)) return a;
  return d + '/' + DEPT[d][3][0][0];
}
const deptOf = it => aisleOf(it).split('/')[0];
const deptLabel = d => (DEPT[d] || ['', d])[1];
const aisleLabel = a => { const [d, x] = a.split('/'); const f = ((DEPT[d] || [])[3] || []).find(y => y[0] === x); return f ? f[1] : ''; };
const placeLabel = it => { const a = aisleOf(it); return `${deptLabel(a.split('/')[0])} · ${aisleLabel(a)}`; };
const deptEmoji = d => (DEPT[d] || [])[2] || '🛒';
const itemName = it => itemEn(it) || t('unnamed');
const itemSub = it => ''; // English only: no second-language name
function applyStatic() {
  document.documentElement.lang = LANG === 'zh' ? 'zh-Hant' : 'en';
  document.querySelectorAll('[data-t]').forEach(el => el.textContent = t(el.dataset.t));
  $('#manualCode').placeholder = t('manualPh');
  document.title = LANG === 'zh' ? '格價狗 PricePup' : 'PricePup';
}

/*@@DOG@@*/

function toast(msg, ms = 2600) {
  const el = $('#toast'); el.textContent = msg; el.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), ms);
}

/* ---------- Local database (mirror of the shared Firestore data) ---------- */
let db;
function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('pricepup', 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('items', { keyPath: 'id' });
      const o = d.createObjectStore('obs', { keyPath: 'id' });
      o.createIndex('itemId', 'itemId');
    };
    r.onsuccess = () => { db = r.result; res(); };
    r.onerror = () => rej(r.error);
  });
}
const store = (s, mode = 'readonly') => db.transaction(s, mode).objectStore(s);
const p2 = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const getAll = s => p2(store(s).getAll());
const getOne = (s, k) => p2(store(s).get(k));
const putOne = (s, v) => p2(store(s, 'readwrite').put(v));
const delOne = (s, k) => p2(store(s, 'readwrite').delete(k));
const obsFor = id => p2(store('obs').index('itemId').getAll(id));
async function save(name, obj) { obj.updated = Date.now(); await putOne(name, obj); remotePut(name, obj); }

/* ---------- Units & unit prices ---------- */
const UNITS = { mL:{b:'mL',f:1}, L:{b:'mL',f:1000}, g:{b:'g',f:1}, kg:{b:'g',f:1000}, lb:{b:'g',f:LB_G}, oz:{b:'g',f:28.3495}, count:{b:'count',f:1} };
const money = n => (n == null || isNaN(n)) ? '—' : '$' + Number(n).toFixed(2);
const eachPrice = o => o.price / (o.multi || 1);
// Unit price of one observation. v is in a base unit: key 'w' = $ per gram, 'v' = $ per mL, 'pc' = $ per piece, 'use' = $ per use.
// It is shown in the unit the user picks (UMODE); loose produce/meat defaults to $/lb, packaged goods to $/100 g or $/100 mL like shelf tags.
function unitPrice(it, o) {
  const p = eachPrice(o);
  if (it.mode === 'weight') {
    if (o.per === 'pack') { // a bagged/packed variant of a loose item, e.g. a 3 lb bag of lemons
      const va = (it.variants || {})[o.vid], u = va && UNITS[va.unit];
      if (!u || !(va.size > 0)) return null;
      if (u.b === 'count') return { v: p / va.size, key: 'pc' };
      if (u.b !== 'g') return null;
      return { v: p / (va.size * u.f), key: 'w', loose: true };
    }
    return { v: o.per === 'kg' ? p / 1000 : p / LB_G, key: 'w', loose: true };
  }
  const va = (it.variants || {})[o.vid];
  if (!va) return null;
  if (it.cmpUses && va.uses > 0) return { v: p / va.uses, key: 'use' };
  const pn = PER_PIECE[it.id];
  if (pn) { const n = pcsOf(va), uu = UNITS[va.unit], ml = uu && uu.b === 'mL' && va.size > 0 ? va.size * uu.f : 0;
    if (n >= 1 && (!ml || ml / n <= 1000)) return { v: p / n, key: 'pc', pcName: pn, ml: ml ? ml / n : 0 }; }
  const u = UNITS[va.unit]; if (!u || !(va.size > 0)) return null;
  const amt = va.size * u.f;
  if (u.b === 'mL') return { v: p / amt, key: 'v' };
  if (u.b === 'g') return { v: p / amt, key: 'w' };
  return { v: p / amt, key: 'pc' };
}
// drinks sold in cans/bottles are compared per can or bottle (a 12-pack vs a 6-pack), big bottles (> 1 L) stay per volume
const PER_PIECE = { pop: ['罐', 'can'], 'energy-drink': ['罐', 'can'], 'na-beer': ['罐', 'can'], water: ['樽', 'bottle'], 'asian-drinks': ['樽', 'bottle'],
  'tea-drink': ['樽', 'bottle'], 'coffee-cold': ['樽', 'bottle'], 'coconut-water': ['盒', 'box'] };
function pcsOf(va) {
  if (va.pcs > 0) return va.pcs;
  const s = `${va.desc || ''} ${va.brand || ''}`, m = s.match(/(\d+)\s*[x×]/i) || s.match(/(\d+)\s*(?:-\s*)?(?:pk|pack|cans?|bottles?|ct|'s)\b/i);
  if (m && +m[1] >= 2 && +m[1] <= 48) return +m[1];
  const u = UNITS[va.unit];
  if (u && u.b === 'mL' && va.size > 0) { const ml = va.size * u.f;
    // flyers often give only the total (12 × 355 mL = 4260 mL); common can sizes divide it exactly
    for (const c of [355, 222, 473, 591]) { const n = ml / c; if (n >= 2 && n <= 48 && Math.abs(n - Math.round(n)) < .001) return Math.round(n); }
    return 1; }
  return va.unit === 'count' && va.size >= 1 ? va.size : 0;
}
let UMODE = lsGet('umode') || 'auto'; // auto | 100 | k | lb
const UMODES = ['auto', '100', 'k', 'lb'];
function uDisp(u) {
  if (u.key === 'pc') return { f: 1, label: u.pcName ? '/' + u.pcName[LI()] : t('perPc') };
  if (u.key === 'use') return { f: 1, label: t('perUse') };
  const m = UMODE === 'auto' ? (u.key === 'w' && u.loose ? 'lb' : '100') : UMODE;
  if (u.key === 'v') return m === '100' ? { f: 100, label: '/100mL' } : { f: 1000, label: '/L' };
  return m === '100' ? { f: 100, label: '/100g' } : m === 'k' ? { f: 1000, label: '/kg' } : { f: LB_G, label: '/lb' };
}
const fmtNum = x => x < 0.1 ? x.toFixed(3) : x.toFixed(2);
const fmtU = u => { if (!u) return ''; const d = uDisp(u); return `$${fmtNum(u.v * d.f)}${d.label}`; };
const altU = u => { if (u && u.key === 'pc' && u.ml) return `${Math.round(u.ml)}mL · $${fmtNum(u.v / u.ml * 100)}/100mL`;
  if (!u || (u.key !== 'w' && u.key !== 'v')) return ''; const l = uDisp(u).label;
  if (u.key === 'v') return l === '/L' ? `$${fmtNum(u.v * 100)}/100mL` : `$${fmtNum(u.v * 1000)}/L`;
  return l === '/lb' ? `$${fmtNum(u.v * 1000)}/kg` : `$${fmtNum(u.v * LB_G)}/lb`; };
const umodeLabel = () => ({ auto: t('uAuto'), '100': '/100g · /100mL', k: '/kg · /L', lb: '/lb · /L' })[UMODE];
const unitChip = () => `<button class="chip unitchip" type="button">⚖️ ${umodeLabel()}</button>`;
function bindUnitChip(rerender) { app.querySelectorAll('.unitchip').forEach(b => b.onclick = () => { UMODE = UMODES[(UMODES.indexOf(UMODE) + 1) % UMODES.length]; lsSet('umode', UMODE); toast('⚖️ ' + umodeLabel(), 1400); rerender(); }); }
const variantText = (it, vid) => {
  const va = (it.variants || {})[vid]; if (!va) return it.mode === 'weight' ? t('loose') : '';
  const sz = va.size ? `${+va.size}${va.unit === 'count' ? ' ' + t('unitCount') : ' ' + va.unit}` : '';
  return [va.brand, va.desc, sz, va.uses ? `${va.uses}${LANG === 'zh' ? ' 次' : ' uses'}` : ''].filter(Boolean).join(' · ');
};
const obsText = (it, o) => o.vid ? variantText(it, o.vid) : (o.listing && o.listing !== it.name ? `${o.listing} · ${t('loose')}` : t('loose'));
const priceText = (it, o) => (o.multi > 1 ? tf('itemsAt', o.multi, money(o.price)) : money(o.price)) + (it.mode === 'weight' && o.per !== 'pack' ? (o.per === 'kg' ? '/kg' : '/lb') : '');

// Summary of an item's observations, compared by unit price.
function summarize(it, obs) {
  const rows = obs.map(o => ({ o, u: unitPrice(it, o) })).filter(r => r.u);
  if (!rows.length) return null;
  const byDate = (a, b) => a.o.date < b.o.date ? 1 : a.o.date > b.o.date ? -1 : (b.o.ts || 0) - (a.o.ts || 0);
  rows.sort(byDate);
  // compare only within the most common unit key (e.g. /L vs /kg can't be compared)
  const keyCount = {}; rows.forEach(r => keyCount[r.u.key] = (keyCount[r.u.key] || 0) + 1);
  const key = Object.keys(keyCount).sort((a, b) => keyCount[b] - keyCount[a])[0];
  const R = rows.filter(r => r.u.key === key);
  let low = R[0]; for (const r of R) if (r.u.v < low.u.v - 1e-9) low = r;
  const recent = rows.filter(r => daysAgo(r.o.date) <= 30);
  const latestPer = {}; // latest per store+variant within 30 days (all units; main unit first)
  for (const r of recent) { const k = r.o.store + '|' + (r.o.vid || r.o.listing || ''); if (!latestPer[k]) latestPer[k] = r; }
  const rank = r => isCurrent(r.o) ? 0 : isUpcoming(r.o) ? 1 : 2; // current, then upcoming, then ended
  const board = Object.values(latestPer).sort((a, b) => (rank(a) - rank(b)) || ((a.u.key !== key) - (b.u.key !== key)) || (a.u.key < b.u.key ? -1 : a.u.key > b.u.key ? 1 : 0) || a.u.v - b.u.v);
  return { rows: R, low, best: board.find(r => isCurrent(r.o)) || null, board, key };
}
function verdict(it, o, sum) {
  const u = unitPrice(it, o);
  if (!u || !(o.price > 0)) return { cls: 'none', mood: 'sniff', acc: 'glass', text: t('vType') };
  if (!sum) return { cls: 'none', mood: 'normal', acc: 'tag', text: t('vFirst'), u };
  const m = sum.low.u.v, d = u.v - m, st = esc(sum.low.o.store || ''), dt = fmtDate(sum.low.o.date);
  const f = v => fmtU({ ...u, v });
  const eps = m * 0.002;
  if (d < -eps) return { cls: 'good', mood: 'happy', acc: 'party', text: tf('vLow', f(-d), f(m), st), u };
  if (Math.abs(d) <= eps) return { cls: 'eq', mood: 'happy', acc: '', text: tf('vEq', st, dt), u };
  return { cls: 'bad', mood: 'sad', acc: d / m > 0.15 ? 'tear' : '', text: tf('vHigh', f(d), Math.round(d / m * 100), f(m), st, dt), u };
}
const verdictHtml = (v, sub = '') => `<div class="verdict ${v.cls}">${dog(v.mood, v.acc)}<div>${v.text}${sub ? `<div class="muted" style="font-weight:500;margin-top:3px">${sub}</div>` : ''}</div></div>`;

/* ---------- Data sync (Firebase Firestore, realtime) ---------- */
const FB_CONFIG = { apiKey: 'AIzaSyCBHCl3Wd-hCblhagOwfcdUuRRFG3uxZqo', authDomain: 'pricepup-b02ce.firebaseapp.com', projectId: 'pricepup-b02ce',
  storageBucket: 'pricepup-b02ce.firebasestorage.app', messagingSenderId: '809962807683', appId: '1:809962807683:web:4679d6222913b15a4dd6b6' };
const HOUSEHOLD = 'silver-sumina';
const FB_V = '10.12.2';
let fb = null, fbUser = null, syncState = 'off', unsubs = [];
const syncOn = () => !!(fb && fbUser);
async function loadFb() {
  if (fb) return fb;
  const base = `https://www.gstatic.com/firebasejs/${FB_V}/`;
  const [A0, A, F] = await Promise.all([import(base + 'firebase-app.js'), import(base + 'firebase-auth.js'), import(base + 'firebase-firestore.js')]);
  const fapp = A0.initializeApp(FB_CONFIG);
  let fdb;
  try { fdb = F.initializeFirestore(fapp, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) }); }
  catch (e) { fdb = F.getFirestore(fapp); }
  fb = { A, F, db: fdb, auth: A.getAuth(fapp) };
  A.onAuthStateChanged(fb.auth, onAuth);
  A.getRedirectResult(fb.auth).catch(() => {});
  return fb;
}
const col = name => fb.F.collection(fb.db, 'households', HOUSEHOLD, name);
const docRef = (name, id) => fb.F.doc(fb.db, 'households', HOUSEHOLD, name, String(id));
const clean = o => JSON.parse(JSON.stringify(o));
function remotePut(name, obj) {
  if (!syncOn()) return;
  const { id, ...data } = obj;
  fb.F.setDoc(docRef(name, id), clean(data)).catch(e => setSync('error', e.code));
}
function setSync(st, detail) {
  syncState = st;
  const b = $('#syncBadge');
  if (st === 'off') b.classList.add('hidden');
  else {
    b.classList.remove('hidden');
    b.className = st === 'synced' ? 'ok' : (st === 'error' || st === 'offline') ? 'warn' : '';
    b.textContent = { connecting: '☁️ …', synced: '☁️ ✓', syncing: '☁️ ↻', offline: '☁️ ✕', error: '☁️ !' }[st] || '☁️';
  }
  if (detail) console.warn('sync', detail);
  const el = $('#syncStatus'); if (el) el.textContent = syncLabel();
  const ls = $('#lastSyncTxt'); if (ls) ls.textContent = lastSyncText();
}
const lastSyncText = () => t('lastSync') + fmtWhen(syncState === 'synced' ? Date.now() : lsGet('lastSync'));
const syncLabel = () => t({ off: 'sOff', connecting: 'sConnecting', synced: 'sSynced', syncing: 'sSyncing', offline: 'sOffline', error: 'sError' }[syncState]);
async function onAuth(user) {
  stopListeners();
  if (!user) { fbUser = null; setSync('off'); if (location.hash === '#settings') viewSettings(); return; }
  fbUser = user; lsSet('sync', '1'); setSync('connecting');
  startListeners(); listenFavs(); touchProfile(true);
  if (location.hash === '#settings') viewSettings();
}
let rerenderT = null;
function scheduleRerender() {
  clearTimeout(rerenderT);
  rerenderT = setTimeout(() => { const r = location.hash.slice(1).split('/')[0]; if (['', 'home', 'item', 'deals'].includes(r)) route(true); }, 300);
}
// Incremental sync (5.1.1): each phone keeps the whole database in IndexedDB and only downloads what changed since its
// last sync (every write stamps `updated`). One full download on the first sync and then once a week, which also drops
// rows deleted on the server. This keeps Firestore reads far below the free plan's 50,000 a day.
const SYNC_MARGIN = 10 * 60e3, FULL_EVERY = 7 * 864e5;
const putMany = (s, arr) => new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'), st = tx.objectStore(s); arr.forEach(v => st.put(v)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
const delMany = (s, ids) => new Promise((res, rej) => { const tx = db.transaction(s, 'readwrite'), st = tx.objectStore(s); ids.forEach(k => st.delete(k)); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
function startListeners() { const who = fbUser && fbUser.uid; for (const name of ['items', 'obs']) syncCollection(name, who); }
async function syncCollection(name, who) {
  const F = fb.F, kS = 'since_' + name, kF = 'full_' + name;
  let since = +lsGet(kS) || 0;
  if (!since || Date.now() - (+lsGet(kF) || 0) > FULL_EVERY) {
    try {
      setSync('syncing');
      const snap = await F.getDocsFromServer(col(name)), rows = snap.docs.map(d => ({ ...d.data(), id: d.id })), keep = new Set(rows.map(r => r.id));
      await putMany(name, rows); await delMany(name, (await getAll(name)).map(r => r.id).filter(id => !keep.has(id)));
      since = Math.max(0, ...rows.map(r => r.updated || 0)) || Date.now();
      lsSet(kS, String(since)); lsSet(kF, String(Date.now())); lsSet('lastSync', String(Date.now())); scheduleRerender(); checkTrack();
    } catch (e) { console.warn('full sync', name, e.code); if (!since) since = 1; }
  }
  if (!fbUser || fbUser.uid !== who) return; // signed out meanwhile
  const q = F.query(col(name), F.where('updated', '>', Math.max(0, since - SYNC_MARGIN)));
  unsubs.push(F.onSnapshot(q, { includeMetadataChanges: true }, async snap => {
    // set the badge in arrival order (the async loop below can finish after a newer snapshot)
    setSync(snap.metadata.fromCache ? 'offline' : snap.metadata.hasPendingWrites ? 'syncing' : 'synced');
    if (!snap.metadata.fromCache) lsSet('lastSync', String(Date.now()));
    const ch = snap.docChanges(); if (!ch.length) return;
    const gone = ch.filter(c => c.type === 'removed').map(c => c.doc.id), rows = ch.filter(c => c.type !== 'removed').map(c => ({ ...c.doc.data(), id: c.doc.id }));
    if (rows.length) await putMany(name, rows); if (gone.length) await delMany(name, gone);
    const mx = Math.max(+lsGet(kS) || 0, ...rows.filter(r => !snap.metadata.hasPendingWrites).map(r => r.updated || 0)); lsSet(kS, String(mx));
    scheduleRerender(); checkTrack();
  }, e => setSync('error', e.code)));
}
function stopListeners() { unsubs.forEach(u => u()); unsubs = []; }

/* ---------- Favourites (per user: local copy + Firestore households/<h>/users/<uid>) ---------- */
let FAVS = new Set((() => { try { return JSON.parse(lsGet('favs') || '[]'); } catch (e) { return []; } })());
const isFav = id => FAVS.has(id);
const favRef = () => fb.F.doc(fb.db, 'households', HOUSEHOLD, 'users', fbUser.uid);
function pushFavs() { lsSet('favs', JSON.stringify([...FAVS])); if (syncOn()) fb.F.setDoc(favRef(), { favs: [...FAVS], updated: Date.now() }, { merge: true }).catch(e => setSync('error', e.code)); }
function toggleFav(id) { if (FAVS.has(id)) FAVS.delete(id); else FAVS.add(id); pushFavs(); toast(t(FAVS.has(id) ? 'favOn' : 'favOff'), 1500); return FAVS.has(id); }
// profile: lets the admin see who uses the app (users/{uid}: email, name, firstSeen, lastSeen, app)
let lastTouch = 0;
async function touchProfile(first) {
  if (!syncOn() || Date.now() - lastTouch < 5 * 60e3) return; lastTouch = Date.now();
  const data = { email: fbUser.email || '', name: fbUser.displayName || '', lastSeen: Date.now(), app: APP_VERSION };
  try {
    if (first) { const s = await fb.F.getDoc(favRef()); if (!s.exists() || !s.data().firstSeen) data.firstSeen = Date.now(); }
    await fb.F.setDoc(favRef(), data, { merge: true });
  } catch (e) { console.warn('profile', e.code); }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') touchProfile(false); });
function listenFavs() {
  unsubs.push(fb.F.onSnapshot(favRef(), snap => {
    if (snap.exists() && snap.data().track && snap.data().track.join('|') !== [...TRACK].join('|')) { TRACK = new Set(snap.data().track); lsSet('track', JSON.stringify(snap.data().track)); scheduleRerender(); checkTrack(); }
    else if (snap.exists() && !snap.data().track && TRACK.size) pushTrack();
    if (!snap.exists() || !snap.data().favs) { if (FAVS.size) pushFavs(); return; }
    const remote = snap.data().favs || [];
    if (remote.join('|') !== [...FAVS].join('|')) { FAVS = new Set(remote); lsSet('favs', JSON.stringify(remote)); scheduleRerender(); }
  }, e => console.warn('favs', e.code)));
}
const starBtn = (id, big) => `<button class="star${big ? ' big' : ''}${isFav(id) ? ' on' : ''}" data-fav="${esc(id)}" aria-label="${esc(t('favBtn'))}" aria-pressed="${isFav(id)}">${isFav(id) ? '★' : '☆'}</button>`;
async function signIn() {
  try {
    await loadFb();
    const p = new fb.A.GoogleAuthProvider(); p.setCustomParameters({ prompt: 'select_account' });
    try { await fb.A.signInWithPopup(fb.auth, p); }
    catch (e) {
      if (['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment', 'auth/cancelled-popup-request'].includes(e.code)) await fb.A.signInWithRedirect(fb.auth, p);
      else if (e.code !== 'auth/popup-closed-by-user') throw e;
    }
  } catch (e) { console.warn(e); toast(t('signInFail')); }
}
async function signOutSync() { lsSet('sync', '0'); stopListeners(); FAVS = new Set(); lsSet('favs', '[]'); if (fb) await fb.A.signOut(fb.auth); fbUser = null; setSync('off'); viewSettings(); }

/* ---------- Image helpers ---------- */
async function loadBitmap(file) {
  try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { return await createImageBitmap(file); }
}
async function thumbFrom(file, max = 240) {
  const img = await loadBitmap(file);
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.7);
}
function pickFile(input) { return new Promise(res => { input.value = ''; input.onchange = () => res(input.files[0] || null); input.click(); }); }
const thumb = (src, emoji = '🛒') => src ? `<img class="thumb${src.startsWith('fresh/') ? ' ill' : ''}" src="${esc(src)}" alt="" loading="lazy">` : `<div class="thumb">${emoji}</div>`;
// Fresh food (produce, meat, seafood) shows an OpenMoji illustration instead of a brand photo
const FRESH_CATS = ['水果蔬菜', '肉類', '海鮮'];
const FRESH_ID = { apple:'1F34E', avocado:'1F951', bacon:'1F953', 'turkey-bacon':'1F953', banana:'1F34C', 'beans-fresh':'1FADB', broccoli:'1F966', cauliflower:'1F966', carrot:'1F955',
  celery:'1F96C', 'chili-pepper':'1F336', coconut:'1F965', corn:'1F33D', crab:'1F980', 'imitation-crab':'1F980', cucumber:'1F952', zucchini:'1F952', daikon:'1FADC', 'root-veg':'1FADC', 'lotus-root':'1FADC',
  duck:'1F986', eggplant:'1F346', ginger:'1FADA', grapefruit:'E0C0', grapes:'1F347', 'herbs-fresh':'1F33F', mint:'1F33F', hotdog:'1F32D', sausage:'1F32D', 'filipino-sausage':'1F32D', kiwi:'1F95D',
  lemon:'1F34B', lime:'1F34B-200D-1F7E9', lobster:'1F99E', mandarin:'1F34A', orange:'1F34A', persimmon:'1F34A', mango:'1F96D', melon:'1F348', 'winter-melon':'1F348', mushroom:'1F344-200D-1F7EB',
  mussels:'1F9AA', onion:'1F9C5', leek:'1F9C5', pear:'1F350', pineapple:'1F34D', 'tropical-fruit':'1F34D', plumcot:'1F351', pomegranate:'E0C4', potato:'1F954', raspberry:'1F353', strawberry:'1F353',
  scallop:'1F41A', shrimp:'1F990', 'sweet-pepper':'1FAD1', tomato:'1F345', turkey:'1F983', yam:'1F360', squash:'1F360', 'whole-chicken':'1F357', ham:'1F356', lamb:'1F356', 'pork-back-ribs':'1F356' };
const FRESH_RX = [[/bone|骨(?!仔)/i, '1F9B4'], [/chicken|雞/i, '1F357'], [/ribs?\b|排骨|豬手|豬蹄/i, '1F356'], [/salmon|fish|fillet|魚/i, '1F41F'], [/shrimp|prawn|蝦/i, '1F990'],
  [/cabbage|lettuce|spinach|choy|greens?\b|菜/i, '1F96C'], [/beef|pork|lamb|meat|steak|牛|豬|羊|肉/i, '1F969']];
const FRESH_CAT = { '水果蔬菜': '1F96C', '肉類': '1F969', '海鮮': '1F41F' };
const isFresh = it => FRESH_CATS.includes(it.cat);
const freshIcon = it => { if (!isFresh(it)) return ''; const s = `${it.en || ''} ${it.name || ''}`; return `fresh/${FRESH_ID[it.id] || (FRESH_RX.find(([rx]) => rx.test(s)) || [])[1] || FRESH_CAT[it.cat]}.svg`; };
const itemPhoto = it => freshIcon(it) || it.photo || Object.values(it.variants || {}).map(v => v.photo).find(Boolean) || '';
const variantPhoto = (it, va) => (va && va.photo) || freshIcon(it) || itemPhoto(it);
const lkey = (store, listing) => ((store || '') + '_' + (listing || '')).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60);
const obsPhoto = (it, o) => { const va = (it.variants || {})[o.vid]; return (va && va.photo) || (o.listing && (it.lphotos || {})[lkey(o.store, o.listing)]) || variantPhoto(it, va); };
const itemEmoji = it => deptEmoji(deptOf(it));
const unitLine = (it, u) => it.mode === 'weight' || !u ? '' : `<div class="unitp">${fmtU(u)}</div>`; // loose items are already priced per lb

/* ---------- Barcode lookup ---------- */
function normCode(raw) { const d = String(raw || '').replace(/\D/g, ''); return !d ? '' : d.length === 12 ? '0' + d : d; }
async function lookupProduct(code) {
  for (const h of ['world.openfoodfacts.org', 'world.openproductsfacts.org', 'world.openbeautyfacts.org']) {
    try {
      const r = await fetch(`https://${h}/api/v2/product/${code}.json?fields=product_name,product_name_en,brands,quantity,image_front_small_url,image_front_url,categories_tags`, { signal: AbortSignal.timeout ? AbortSignal.timeout(7000) : undefined });
      if (!r.ok) continue;
      const j = await r.json();
      if (j.status === 1 && j.product) { const p = j.product, cl = (p.categories_tags || []).map(c => c.replace(/^[a-z]{2}:/, '').replace(/-/g, ' ')); return { name: p.product_name_en || p.product_name || '', brand: (p.brands || '').split(',')[0].trim(), quantity: p.quantity || '', image: p.image_front_small_url || '', imageBig: p.image_front_url || '', cats: cl.join(' '), catsList: cl.filter(c => !/^(undefined|plant based)/.test(c)) }; }
    } catch (e) {}
  }
  return null;
}
function parseQty(s) {
  if (!s) return null;
  s = s.toLowerCase().replace(/(\d),(\d)/g, '$1.$2');
  const nu = u => ({ ml:'mL', cl:'mL', l:'L', g:'g', kg:'kg', lb:'lb', oz:'oz' }[u]);
  let m = s.match(/(\d+)\s*[x×]\s*(\d+(?:\.\d+)?)\s*(ml|cl|l|g|kg)\b/);
  if (m) { let v = +m[1] * +m[2]; if (m[3] === 'cl') v *= 10; return { size: +v.toFixed(3), unit: nu(m[3]) }; }
  m = s.match(/(\d+(?:\.\d+)?)\s*(ml|cl|l|g|kg|lb|oz)\b/);
  if (m) { let v = +m[1]; if (m[2] === 'cl') v *= 10; return { size: v, unit: nu(m[2]) }; }
  return null;
}
async function findBarcode(code) {
  for (const it of await getAll('items')) for (const [vid, va] of Object.entries(it.variants || {})) if (va.barcode === code) return { it, vid };
  return null;
}

/* ---------- Scanner (BarcodeDetector on Android, ZXing on iPhone) ---------- */
let scanStream = null, scanTimer = null, detector = null, torchOn = false, zxCore = null, zxCanvas = null, scanCb = null;
const ZX_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('load ' + src)); document.head.appendChild(s); }); }
async function loadZx() { if (!window.ZXing) await loadScript(ZX_URL); }
function zxHints() { const Z = window.ZXing, h = new Map(); h.set(Z.DecodeHintType.POSSIBLE_FORMATS, [Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A, Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.CODE_128]); h.set(Z.DecodeHintType.TRY_HARDER, true); return h; }
function zxDecodeFrame(src, w, h) {
  const Z = window.ZXing;
  if (!zxCore) { zxCore = new Z.MultiFormatReader(); zxCore.setHints(zxHints()); }
  zxCanvas = zxCanvas || document.createElement('canvas');
  const s = Math.min(1, 1280 / Math.max(w, h));
  zxCanvas.width = Math.round(w * s); zxCanvas.height = Math.round(h * s);
  zxCanvas.getContext('2d', { willReadFrequently: true }).drawImage(src, 0, 0, zxCanvas.width, zxCanvas.height);
  try { return zxCore.decodeWithState(new Z.BinaryBitmap(new Z.HybridBinarizer(new Z.HTMLCanvasElementLuminanceSource(zxCanvas)))).getText(); }
  catch (e) { return null; }
}
async function getDetector() {
  if (detector) return detector;
  if (!('BarcodeDetector' in window)) return null;
  const want = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];
  let fmts = want;
  try { const sup = await BarcodeDetector.getSupportedFormats(); fmts = want.filter(f => sup.includes(f)); } catch (e) {}
  detector = new BarcodeDetector({ formats: fmts.length ? fmts : want });
  return detector;
}
// cb(code) is called once with the scanned barcode; default opens that product.
async function openScanner(cb) {
  scanCb = cb || handleBarcode;
  $('#scanner').classList.remove('hidden');
  $('#manualCode').value = '';
  $('#scanDog').innerHTML = dog('sniff', 'glass', 'bounce');
  const msg = $('#scanMsg');
  const det = await getDetector();
  msg.textContent = t('scanAim');
  if (!det) { try { await loadZx(); } catch (e) { msg.textContent = t('scanNo'); return; } }
  clearTimeout(warmTimer); const wt = warmStream && warmStream.getVideoTracks()[0];
  if (wt && wt.readyState === 'live') { scanStream = warmStream; wt.enabled = true; } // 5.5: reuse the camera from the last scan (no new permission prompt)
  else { try { scanStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }); }
  catch (e) { msg.textContent = t('scanCam'); return; } }
  warmStream = scanStream;
  const v = $('#scanVideo'); v.srcObject = scanStream; await v.play().catch(() => {});
  const caps = scanStream.getVideoTracks()[0].getCapabilities ? scanStream.getVideoTracks()[0].getCapabilities() : {};
  $('#torchBtn').style.display = caps.torch ? '' : 'none';
  const tick = async () => {
    if (!scanStream) return;
    try {
      if (v.readyState >= 2) {
        const val = det ? ((await det.detect(v))[0] || {}).rawValue : zxDecodeFrame(v, v.videoWidth, v.videoHeight);
        if (val) { const cb2 = scanCb; closeScanner(); navigator.vibrate && navigator.vibrate(60); cb2(val); return; }
      }
    } catch (e) {}
    scanTimer = setTimeout(tick, det ? 150 : 200);
  };
  tick();
}
function closeScanner() {
  clearTimeout(scanTimer);
  if (scanStream) { const tr = scanStream.getVideoTracks()[0]; if (torchOn) { try { tr.applyConstraints({ advanced: [{ torch: false }] }); } catch (e) {} } try { tr.enabled = false; } catch (e) {} scanStream = null; clearTimeout(warmTimer); warmTimer = setTimeout(stopWarm, 120000); }
  $('#scanVideo').srcObject = null;
  $('#scanner').classList.add('hidden');
  torchOn = false;
}
['gesturestart', 'gesturechange'].forEach(ev => document.addEventListener(ev, e => e.preventDefault(), { passive: false })); // 5.5: no zooming
let warmStream = null, warmTimer = null; // keep the camera for 2 minutes after a scan, then let it go
function stopWarm() { clearTimeout(warmTimer); if (warmStream && warmStream !== scanStream) { warmStream.getTracks().forEach(tr => tr.stop()); warmStream = null; } }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && !scanStream) stopWarm(); });
$('#torchBtn').onclick = async () => { if (!scanStream) return; torchOn = !torchOn; try { await scanStream.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: torchOn }] }); } catch (e) {} };
$('#closeScanBtn').onclick = () => { closeScanner(); if (location.hash === '#scan') location.hash = '#home'; };
$('#noCodeBtn').onclick = () => { closeScanner(); location.hash = '#pick/'; };
$('#manualGo').onclick = () => { const c = $('#manualCode').value; if (!normCode(c)) return toast(t('needCode')); const cb2 = scanCb || handleBarcode; closeScanner(); cb2(c); };
$('#photoScanBtn').onclick = async () => {
  const det = await getDetector();
  const f = await pickFile($('#fileBarcode')); if (!f) return;
  const cb2 = scanCb || handleBarcode;
  if (!det) {
    const url = URL.createObjectURL(f);
    try { await loadZx(); const r = new window.ZXing.BrowserMultiFormatReader(zxHints()); const res = await r.decodeFromImageUrl(url); closeScanner(); cb2(res.getText()); }
    catch (e) { toast(window.ZXing ? t('photoNoCode') : t('noDetect')); }
    finally { URL.revokeObjectURL(url); }
    return;
  }
  try { const codes = await det.detect(await loadBitmap(f)); if (codes.length) { closeScanner(); cb2(codes[0].rawValue); } else toast(t('photoNoCode')); }
  catch (e) { toast(t('photoFail')); }
};
/* ---------- Barcode database: our own Firebase first, then free online sources; whatever is found is saved back ---------- */
const bcRef = code => fb.F.doc(fb.db, 'households', HOUSEHOLD, 'barcodes', code);
const bcLocal = () => { try { return JSON.parse(lsGet('bcache') || '{}'); } catch (e) { return {}; } };
function bcLocalPut(code, d) { const m = bcLocal(); m[code] = d; const ks = Object.keys(m); while (ks.length > 300) delete m[ks.shift()]; lsSet('bcache', JSON.stringify(m)); }
async function bcGet(code) {
  if (syncOn()) { try { const s = await fb.F.getDoc(bcRef(code)); if (s.exists()) { const d = s.data(); bcLocalPut(code, d); return d; } } catch (e) {} }
  return bcLocal()[code] || null;
}
async function bcPut(code, info) {
  const d = { name: info.name || '', brand: info.brand || '', quantity: info.quantity || '', image: info.image || '', imageBig: info.imageBig || '', cats: info.cats || '',
    catsList: (info.catsList || []).slice(0, 8), src: info.src || 'off', ts: Date.now(), by: fbUser ? fbUser.uid : '' };
  if (info.status) d.status = info.status; if (info.ocr) d.ocr = String(info.ocr).slice(0, 600); if (info.edited) d.edited = info.edited; if (info.byWeight) d.byWeight = true;
  bcLocalPut(code, d);
  if (syncOn()) fb.F.setDoc(bcRef(code), d).catch(e => console.warn('barcode save', e.code));
  return d;
}
async function upcLookup(code) { // UPCitemdb free tier: 100 lookups a day, no key
  try { const r = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${code}`, { signal: AbortSignal.timeout ? AbortSignal.timeout(7000) : undefined }); if (!r.ok) return null;
    const p = ((await r.json()).items || [])[0]; if (!p || !p.title) return null;
    return { name: p.title, brand: p.brand || '', quantity: p.size || '', image: (p.images || [])[0] || '', cats: p.category || '', catsList: p.category ? p.category.split('>').map(x => x.trim()) : [], src: 'upc' };
  } catch (e) { return null; }
}
async function findProduct(code) {
  const own = await bcGet(code); if (own) return own;
  toast(t('lookingUp'), 5000);
  let info = await lookupProduct(code); if (info) info.src = 'off'; else info = await upcLookup(code);
  return info ? bcPut(code, info) : null;
}
let scanCtx = null; // what the last barcode scan found, shown as a banner on the item / variant page
async function handleBarcodeOld(raw) {
  const code = normCode(raw);
  if (!code) return toast(t('badCode'));
  const hit = await findBarcode(code);
  if (hit) { scanCtx = { code, itemId: hit.it.id, vid: hit.vid, known: true }; location.hash = `#variant/${encodeURIComponent(hit.it.id)}/${encodeURIComponent(hit.vid)}`; return; }
  const info = await findProduct(code);
  const sug = info ? matchItems(info, await getAll('items')) : [];
  sessionStorage.setItem('pp_pending', JSON.stringify({ code, info, sug: sug.slice(0, 5).map(x => x.it.id) }));
  if (sug.length && sug[0].score >= 3 && sug[0].strong > 0) { scanCtx = { code, info, itemId: sug[0].it.id, alts: sug.slice(1, 4).map(x => x.it.id) }; location.hash = `#item/${encodeURIComponent(sug[0].it.id)}`; }
  else location.hash = `#pick/${code}`;
}
// guess the main item for a scanned product from its name, brand and categories
const STOPW = new Set(['the', 'and', 'or', 'with', 'de', 'la', 'le', 'du', 'des', 'et', 'of', 'in', 'en', 'au', 'aux', 'pack', 'ml', 'kg', 'oz', 'lb', 'food', 'foods', 'product', 'products', 'other', 'plant', 'based']);
const toks = str => (str || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z0-9一-鿿]+/)
  .filter(w => w.length > 1 && !STOPW.has(w) && !/^\d/.test(w)).map(w => w.replace(/ies$/, 'y').replace(/(?<=[a-z]{3})(es|s)$/, ''));
function matchItems(info, items) {
  // the product's own name counts most, then brand; the (often messy) database categories only a little
  const qn = new Set(toks(info.name)), qb = new Set(toks(info.brand)), qc = new Set(toks(info.cats)); if (!qn.size && !qb.size && !qc.size) return [];
  return items.map(it => {
    const nameT = new Set(toks([it.en, ...(it.aliases || [])].join(' ')));
    let score = 0, strong = 0; nameT.forEach(w => { if (qn.has(w)) { score += 4; strong++; } else if (qc.has(w)) score += 1; });
    let best = 0, bs = 0;
    for (const va of Object.values(it.variants || {})) { const vt = [...new Set(toks([va.brand, va.desc].join(' ')))]; if (!vt.length) continue; let h = 0, s2 = 0;
      vt.forEach(w => { if (qn.has(w)) { h += 2; s2++; } else if (qb.has(w)) { h += 1.5; s2++; } else if (qc.has(w)) h += .3; }); const v = h / Math.sqrt(vt.length); if (v > best) { best = v; bs = s2; } }
    return { it, score: score + best, strong: strong + bs };
  }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 6);
}

/* ---------- OCR (Tesseract.js, on the phone, free) ---------- */
let ocrWorker = null;
async function getOcr() {
  if (ocrWorker) return ocrWorker;
  if (!window.Tesseract) await loadScript('https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js');
  ocrWorker = await Tesseract.createWorker('eng');
  await ocrWorker.setParameters({ tessedit_pageseg_mode: '11' });
  return ocrWorker;
}
async function prepForOcr(file, max) {
  const img = await loadBitmap(file);
  const s = max / Math.max(img.width, img.height);
  const c = document.createElement('canvas'); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
  const ctx = c.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}
async function readPriceTag(file, weightMode) {
  const w = await getOcr(); const all = [];
  for (const max of [1600, 960, 560]) { const c = await prepForOcr(file, max); const { data } = await w.recognize(c); all.push(...extractPrices(data, c.height, weightMode)); }
  const best = {};
  for (const c of all) { const k = c.price + 'x' + c.multi + (c.partial ? 'p' : '') + c.per; if (!best[k] || best[k].score < c.score) best[k] = c; }
  return Object.values(best).sort((a, b) => b.score - a.score).slice(0, 6);
}
function extractPrices(data, H = 1, weightMode = false) {
  const words = (data.words || []).map(w => ({ raw: w.text.trim(), h: (w.bbox.y1 - w.bbox.y0) / H, x0: w.bbox.x0 / H, x1: w.bbox.x1 / H, y0: w.bbox.y0 / H })).filter(w => w.raw);
  const out = [];
  const add = (price, multi, score, partial, per) => { if (price > 0 && price < 1000) out.push({ price: Math.round(price * 100) / 100, multi, score, partial: !!partial, per: per || '' }); };
  const unitLike = /\/\s*(100|1)?\s*(ml|g|kg|l|lb|ea|un)|\b(ml|kg|lb)\b|\d\s*(l|ml|g|kg|lb|oz)\b|¢/i;
  let maxH = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i], nx = words[i + 1];
    maxH = Math.max(maxH, w.h);
    const tt = w.raw.replace(/[Oo]/g, '0').replace(/[Il|]/g, '1').replace(/S(?=\d)/g, '$');
    if (weightMode) {
      const wre = /\$?(\d{1,3})[.,](\d{2})\s*\/?\s*(lb|kg)\b/i, rw = w.raw.replace(/O(?=\d)|(?<=\d)O/g, '0');
      let wm = rw.match(wre);
      if (!wm && nx && /^\/?\s*(lb|kg)\b/i.test(nx.raw)) wm = (rw + nx.raw).match(wre);
      if (wm) { add(+(wm[1] + '.' + wm[2]), 1, w.h * 1.3, false, wm[3].toLowerCase()); continue; }
    }
    if (unitLike.test(w.raw) || (nx && /^\/|^(ml|g|kg|l|lb|ea)$/i.test(nx.raw))) continue;
    let m = tt.match(/\$?(\d{1,3})[.,](\d{2})(?!\d)/);
    if (m) { add(+(m[1] + '.' + m[2]), 1, w.h * (tt.includes('$') ? 1.1 : 1)); continue; }
    m = tt.match(/^\$?(\d{1,3})[°º"'%*^]+$/);
    if (m) { add(+m[1], 1, w.h * 1.05, true); continue; }
    m = tt.match(/^\$?(\d{1,3})$/);
    if (m) {
      if (nx) { const nt = nx.raw.replace(/[Oo]/g, '0').replace(/\D/g, ''); if (/^\d{2}$/.test(nt) && nx.h < w.h * 0.85 && nx.x0 - w.x1 < w.h && nx.y0 < w.y0 + w.h * 0.5) { add(+(m[1] + '.' + nt), 1, w.h * 1.05); i++; continue; } }
      if (m[1].length >= 3 && !tt.includes('$')) add(+m[1] / 100, 1, w.h * 0.6);
      else if (tt.includes('$')) add(+m[1], 1, w.h * 0.7);
    }
  }
  const txt = data.text || '';
  const lineAt = i => txt.slice(txt.lastIndexOf('\n', i) + 1, (txt.indexOf('\n', i + 1) + 1 || txt.length + 1) - 1);
  for (const rx of [/(?:^|\n|[ \t])(\d{1,2})[ \t]*(?:\/|\||\]|for|pour)?[ \t]*\$[ \t]*(\d{1,3}(?:[.,]\d{2})?)/gi, /(\d{1,2})[ \t]*(?:\/|for|pour)[ \t]*\$?[ \t]*(\d{1,3}(?:[.,]\d{2})?)/gi]) {
    let mm; while ((mm = rx.exec(txt))) { const n = +mm[1]; if (n >= 2 && n <= 24 && !unitLike.test(lineAt(mm.index + 1))) add(+mm[2].replace(',', '.'), n, maxH * 1.2); }
  }
  return out;
}

/* ---------- Views ---------- */
function setHeader(title, back) { $('#title').textContent = title; $('#backBtn').classList.toggle('hidden', !back); $('#headDog').innerHTML = back ? '' : dog(gLoad().pup && gMood(gLoad()) === 'weak' ? 'sad' : 'happy') + gardenDot(); }
$('#headDog').onclick = () => { if ($('#headDog').innerHTML) location.hash = '#garden'; };
$('#backBtn').onclick = () => history.length > 1 ? history.back() : (location.hash = '#home');
function setTab(tb) { document.querySelectorAll('nav.tabs a').forEach(a => a.classList.toggle('on', a.dataset.tab === tb)); }

async function loadAll() {
  const [items, obs] = await Promise.all([getAll('items'), getAll('obs')]);
  const by = {}; for (const o of obs) (by[o.itemId] || (by[o.itemId] = [])).push(o);
  return { items, obs, by };
}

let homeQ = '', homeView = lsGet('homeView') || '', homeAisle = '';
if (!['fav', 'all', 'track'].includes(homeView) && !homeView.startsWith('cat:')) homeView = '';
const catEmoji = c => itemEmoji({ cat: c });
async function viewHome() {
  setHeader(t('appName')); setTab('home');
  const { items, by } = await loadAll();
  const list = items.map(it => ({ it, s: summarize(it, by[it.id] || []), n: (by[it.id] || []).length }));
  list.sort((a, b) => ((b.s && b.s.rows[0].o.date) || '').localeCompare((a.s && a.s.rows[0].o.date) || '') || itemName(a.it).localeCompare(itemName(b.it)));
  const need = petNeed();
  app.innerHTML = `
    ${need ? `<a class="hero need" href="#garden">${dog('sad', 'tear', 'bounce')}<div class="bubble">${esc(need.msg)}<small>${t('needTap')} ›</small></div></a>`
      : `<div class="hero">${dog('happy', 'tag', 'bounce')}<div class="bubble">${t('hello')}<small>${t('tagline')}</small></div></div>`}
    <div class="chips seg3" id="hView" style="margin:4px 0 10px"></div>
    <div class="searchbox"><input id="q" type="search" placeholder="${esc(t('search'))}" value="${esc(homeQ)}" autocomplete="off"><button type="button" id="qClear" class="qclear${homeQ ? '' : ' hidden'}" aria-label="clear">✕</button></div>
    <div id="list"></div>`;
  const hay = ({ it, s }) => [it.name, it.en, ...(it.aliases || []), placeLabel(it), ...Object.values(it.variants || {}).map(v => v.brand + ' ' + (v.desc || '')), s ? s.rows.map(r => r.o.store).join(' ') : ''].join(' ').toLowerCase();
  const row = ({ it, s }) => { const b = s && (s.best || s.low);
    return `<a class="item" href="#item/${encodeURIComponent(it.id)}">${thumb(itemPhoto(it), itemEmoji(it))}
      <div class="main"><div class="name">${esc(itemName(it))}</div><div class="muted">${esc(placeLabel(it))}</div>
      ${b ? `<div class="muted">${esc(b.o.store)}${b.o.sale && isCurrent(b.o) ? ` · <span class="tag">${t('sale')}</span>` : ''}</div>` : ''}</div>
      <div class="price">${b ? fmtU(b.u) : '—'}<div class="muted">${s ? (s.best ? t('bestNow') : t('histLow')) : t('noPrice')}</div></div>${starBtn(it.id)}</a>`; };
  const depts = DEPTS.filter(d => list.some(x => deptOf(x.it) === d[0]));
  const render = () => {
    homeQ = $('#q').value; const q = homeQ.trim().toLowerCase(); $('#qClear').classList.toggle('hidden', !homeQ);
    const view = homeView || (FAVS.size ? 'fav' : 'all'), top = view.startsWith('cat:') ? 'all' : view;
    $('#hView').innerHTML = [['fav', `${t('tabFav')} (${FAVS.size})`], ['all', t('allCats')], ['track', `🔔 ${t('tabTrack')} (${TRACK.size})`]].map(([v, l]) => `<button type="button" class="chip${v === top ? ' on' : ''}" data-v="${v}">${esc(l)}</button>`).join('');
    const box = $('#list');
    if (q) { const rows = list.filter(x => hay(x).includes(q)); box.innerHTML = `<div class="card">${rows.length ? rows.slice(0, 300).map(row).join('') : `<div class="empty">${dog('sad')}<div class="muted">${t('noMatch')}</div></div>`}</div>`; return; }
    if (view === 'track') { box.innerHTML = `<div class="card">${trackRows(items, by) || `<div class="empty">${dog('sniff', 'glass')}<div class="muted">${t('trackNone')}</div></div>`}</div>`; return; }
    if (view === 'all') { // catalogue: departments first, then aisles
      box.innerHTML = list.length ? `<div class="catgrid">${depts.map(d => `<button type="button" class="catbox" data-cat="${d[0]}"><span class="ce">${d[2]}</span><b>${esc(d[1])}</b><span class="muted">${list.filter(x => deptOf(x.it) === d[0]).length}</span></button>`).join('')}</div>`
        : `<div class="card empty">${dog('sleep', 'z')}<div class="muted">${t('emptyList')}</div>${fbUser ? '' : `<button class="btn" style="margin-top:10px" onclick="signIn()">Sign in with Google</button>`}</div>`; return; }
    if (view.startsWith('cat:')) { const dp = DEPT[view.slice(4)] ? view.slice(4) : 'pantry', d = DEPT[dp], inDept = list.filter(x => deptOf(x.it) === dp);
      const aisles = d[3].filter(a => inDept.some(x => aisleOf(x.it) === dp + '/' + a[0])); if (homeAisle && !aisles.some(a => a[0] === homeAisle)) homeAisle = '';
      const shown = homeAisle ? [aisles.find(a => a[0] === homeAisle)] : aisles;
      box.innerHTML = `<button type="button" class="btn sec small" id="catBack" style="margin:0 0 8px">‹ ${t('backCats')}</button><div class="card"><h2>${d[2]} ${esc(d[1])}</h2>
        <div class="chips scroll" id="aisleChips" style="margin:0 0 6px"><button type="button" class="chip${homeAisle ? '' : ' on'}" data-aisle="">${t('allAisles')}</button>${aisles.map(a => `<button type="button" class="chip${a[0] === homeAisle ? ' on' : ''}" data-aisle="${a[0]}">${esc(a[1])}</button>`).join('')}</div>
        ${shown.map(a => { const rows = inDept.filter(x => aisleOf(x.it) === dp + '/' + a[0]); return `${homeAisle ? '' : `<div class="aislehead">${esc(a[1])} <span class="muted">${rows.length}</span></div>`}${rows.map(row).join('')}`; }).join('') || `<div class="muted">${t('noMatch')}</div>`}</div>`;
      $('#catBack').onclick = () => { homeView = 'all'; homeAisle = ''; lsSet('homeView', homeView); render(); };
      $('#aisleChips').onclick = e => { const b = e.target.closest('[data-aisle]'); if (!b) return; homeAisle = b.dataset.aisle; render(); }; return; }
    const rows = list.filter(x => FAVS.has(x.it.id));
    box.innerHTML = `<div class="card">${rows.length ? rows.map(row).join('') : `<div class="empty">${dog('sniff', 'glass')}<div class="muted">${t('noFav')}</div></div>`}</div>`;
  };
  $('#q').oninput = render;
  $('#qClear').onclick = () => { $('#q').value = ''; render(); $('#q').focus(); };
  $('#hView').onclick = e => { const b = e.target.closest('[data-v]'); if (!b) return; homeView = b.dataset.v; lsSet('homeView', homeView); render(); };
  $('#list').onclick = e => {
    const c = e.target.closest('[data-cat]'); if (c) { homeView = 'cat:' + c.dataset.cat; lsSet('homeView', homeView); render(); window.scrollTo(0, 0); return; }
    const b = e.target.closest('[data-fav]'); if (b) { e.preventDefault(); e.stopPropagation(); toggleFav(b.dataset.fav); render(); return; }
    const tr = e.target.closest('[data-track]'); if (tr) { e.preventDefault(); e.stopPropagation(); toggleTrack(tr.dataset.track); render(); } };
  render();
}

async function viewItem(id) {
  const it = await getOne('items', id);
  if (!it) { location.hash = '#home'; return; }
  setHeader(itemName(it), true); setTab('home');
  const obs = await obsFor(id);
  const s = summarize(it, obs);
  const vars = Object.entries(it.variants || {});
  const vstat = vars.map(([vid, va]) => { const vo = obs.filter(o => o.vid === vid).sort((a, b) => (b.date || '').localeCompare(a.date || '')), vs = summarize(it, vo); return { vid, va, vo, vs, vb: vs && (vs.best || vs.low) }; })
    .sort((a, b) => ((b.vs && b.vs.best ? 1 : 0) - (a.vs && a.vs.best ? 1 : 0)) || ((a.vb && a.vb.u.key === (s && s.key) ? a.vb.u.v : 1e9) - (b.vb && b.vb.u.key === (s && s.key) ? b.vb.u.v : 1e9)) || b.vo.length - a.vo.length);
  // current deals: valid flyer sales (incl. starting soon) + prices logged in the last 7 days; latest per store+variant
  const pick = {}; obs.filter(o => (o.src === 'flyer' ? !isEnded(o) : daysAgo(o.date) <= 7 && !isEnded(o)))
    .sort((a, b) => (b.date || '').localeCompare(a.date || '')).forEach(o => { const k = o.store + '|' + (o.vid || o.listing || ''); if (!pick[k]) pick[k] = o; });
  const cur = Object.values(pick).map(o => ({ o, u: unitPrice(it, o) }))
    .sort((a, b) => (isUpcoming(a.o) - isUpcoming(b.o)) || ((a.u && s && a.u.key === s.key ? a.u.v : 1e9) - (b.u && s && b.u.key === s.key ? b.u.v : 1e9)));
  const loose = obs.filter(o => !o.vid), ls = loose.length ? summarize(it, loose) : null;
  const sc = scanCtx && scanCtx.itemId === id && !scanCtx.known ? scanCtx : null;
  app.innerHTML = `
    <div class="card"><div class="item" style="padding:0;border:0">${thumb(itemPhoto(it), itemEmoji(it))}<div class="main">
      <div class="name" style="white-space:normal">${esc(itemName(it))}</div>
      <div class="muted">${esc(placeLabel(it))}</div></div><span id="favWrap" class="hbtns">${starBtn(id, true)}</span></div></div>
    ${sc ? `<div class="card scan"><a href="javascript:void 0" class="scprod">${thumb(sc.info && sc.info.image, '📷')}</a><div><a href="javascript:void 0" class="scprod scname"><b>${t('scanGot')}</b>${esc([sc.info && sc.info.brand, sc.info && sc.info.name, sc.info && sc.info.quantity].filter(Boolean).join(' ') || sc.code)} <span class="scmore">${t('scanTapInfo')} ›</span></a>
      <div class="muted" style="margin:4px 0 8px">${tf('scanGuess', esc(itemName(it)))}</div>
      <div class="row" style="flex-wrap:wrap;gap:6px"><button class="btn small" id="scLog" style="margin:0">${t('scanLog')}</button><button class="btn sec small" id="scOther" style="margin:0">${t('scanOther')}</button></div>
      ${(sc.alts || []).length ? `<div class="chips" style="margin-top:6px">${(await Promise.all(sc.alts.map(a => getOne('items', a)))).filter(Boolean).map(a => `<button class="chip" data-alt="${esc(a.id)}">${esc(itemName(a))}</button>`).join('')}</div>` : ''}</div></div>` : ''}
    ${s ? `<div class="card"><div style="text-align:right;margin:-4px 0 4px">${unitChip()}</div><div class="row" style="align-items:flex-start">
      <div><div class="muted">${t('histLow')}</div><div class="big-num">${priceText(it, s.low.o)}</div>${unitLine(it, s.low.u)}
        <div class="muted">${esc(s.low.o.store)}</div><div class="muted">${esc(obsText(it, s.low.o))} · ${fmtDate(s.low.o.date)}</div></div>
      ${s.best ? `<div><div class="muted">${t('bestNow')}</div><div class="big-num">${priceText(it, s.best.o)}</div>${unitLine(it, s.best.u)}
        <div class="muted">${esc(s.best.o.store)}</div><div class="muted">${esc(obsText(it, s.best.o))} · ${tf('ago', daysAgo(s.best.o.date))}</div></div>` : ''}
    </div>${mixNote(it, obs, s)}</div>` : `<div class="card empty">${dog('sniff', 'glass')}<div class="muted">${t('noPrice')}</div></div>`}
    ${sc ? `<button class="btn sec" id="scAll">${t('scanSeeAll')}</button>` : `<div class="card"><h2>${t('curTitle')}</h2><div class="muted" style="margin-bottom:4px">${t('curHint')}</div>
      ${cur.length ? cur.map((r, i) => { const va = (it.variants || {})[r.o.vid]; return `<a class="item${i >= 8 ? ' more hidden' : ''}" href="${r.o.vid && va ? `#variant/${encodeURIComponent(id)}/${encodeURIComponent(r.o.vid)}` : 'javascript:void 0'}">${thumb(obsPhoto(it, r.o), itemEmoji(it))}
        <div class="main"><div class="name">${esc(r.o.store)}${i === 0 && cur.length > 1 && r.u && s && r.u.key === s.key && isCurrent(r.o) ? `<span class="tag">🏆 ${t('cheapest')}</span>` : ''}${isUpcoming(r.o) ? `<span class="tag up">${fmtDate(r.o.date).slice(5)} ${t('starts')}</span>` : r.o.sale ? `<span class="tag">${t('sale')}</span>` : `<span class="tag off">${t('logged')}</span>`}</div>
        <div class="muted">${esc(obsText(it, r.o))}</div><div class="muted">${fmtDate(r.o.date)}${r.o.until ? '–' + fmtDate(r.o.until).slice(5) : ''}</div></div>
        <div class="price">${priceText(it, r.o)}<div class="muted">${r.u && it.mode !== 'weight' ? fmtU(r.u) : ''}${r.o.reg ? `<br>${t('reg')} ${money(r.o.reg)}` : ''}</div></div></a>`; }).join('') + moreBtn(cur.length, 8) : `<div class="muted">${t('curNone')}</div>`}</div>
    ${vstat.length ? `<div class="card"><h2>${t('variants')}</h2><div class="muted" style="margin-bottom:4px">${t('varHint')}</div>${vstat.map(({ vid, va, vo, vs, vb }, i) => `<a class="item${i >= 10 ? ' more hidden' : ''}" href="#variant/${encodeURIComponent(id)}/${encodeURIComponent(vid)}">${thumb(variantPhoto(it, va), itemEmoji(it))}<div class="main"><div>${esc(variantText(it, vid))}</div><div class="muted">${vo.length ? `${vo.length} ${t('records')}` : t('noPrice')}${va.barcode ? ' · ' + esc(va.barcode) : ''}</div></div><div class="price">${vb ? fmtU(vb.u) : vo.length ? priceText(it, vo[0]) : '—'}<div class="muted">${vs ? (vs.best ? t('bestNow') : t('histLow')) : vo.length ? fmtDate(vo[0].date) : ''}</div></div><span class="chev">›</span></a>`).join('') + moreBtn(vstat.length, 10)}</div>` : ''}
    ${ls ? `<div class="card"><h2>🐾 ${vstat.length ? t('looseTitle') : t('byStore')}</h2>${boardHtml(it, ls)}</div>${chartSvg(ls.rows, ls.low.u.v, ls.low.u)}` : ''}`}`;
  bindUnitChip(() => viewItem(id));
  app.querySelectorAll('.showMore').forEach(b => b.onclick = () => { b.parentElement.querySelectorAll('.more').forEach(x => x.classList.remove('hidden')); b.remove(); });
  $('#favWrap').onclick = e => { if (!e.target.closest('[data-fav]')) return; toggleFav(id); $('#favWrap').innerHTML = starBtn(id, true); };
  if (sc) {
    $('#scLog').onclick = () => location.hash = `#add/${encodeURIComponent(id)}/new`;
    $('#scOther').onclick = () => location.hash = `#pick/${sc.code}`;
    app.querySelectorAll('.scprod').forEach(a => a.onclick = () => showProduct(sc));
    $('#scAll').onclick = () => { scanCtx = null; viewItem(id); };
    app.querySelectorAll('[data-alt]').forEach(b => b.onclick = () => { scanCtx = { ...sc, itemId: b.dataset.alt, alts: [id, ...sc.alts.filter(a => a !== b.dataset.alt)] }; location.hash = `#item/${encodeURIComponent(b.dataset.alt)}`; });
  }
}
const moreBtn = (n, k) => n > k ? `<button class="btn sec small showMore" style="margin:8px 0 0">${tn('showAll', n)}</button>` : '';
// some items have brands sold by weight and others by volume (e.g. yogurt in g or mL); only the main measure is compared
function mixNote(it, obs, s) {
  const ks = new Set(obs.map(o => unitPrice(it, o)).filter(Boolean).map(u => u.key)); if (ks.size < 2) return '';
  return `<div class="muted" style="margin-top:6px;font-size:12px">ⓘ ${tf('mixNote', s.key === 'pc' && s.low.u.pcName ? s.low.u.pcName[LI()] : t('meas_' + s.key))}</div>`;
}
// table of the latest price per store (+variant) in the last 30 days
function boardHtml(it, s) {
  return s.board.length ? `<table><tr><th>${t('store')}</th><th class="r">${t('price')}</th><th class="r">${t('unitP')}</th></tr>
      ${s.board.map((r, i) => `<tr class="${isEnded(r.o) ? 'ended' : ''}"><td>${esc(r.o.store)}${i === 0 && s.board.length > 1 && r.u.key === s.key && isCurrent(r.o) ? `<span class="tag">🏆 ${t('cheapest')}</span>` : ''}${isEnded(r.o) ? `<span class="tag off">${t('ended')}</span>` : isUpcoming(r.o) ? `<span class="tag up">${fmtDate(r.o.date).slice(5)} ${t('starts')}</span>` : r.o.sale ? `<span class="tag">${t('sale')}</span>` : ''}
        <div class="muted">${fmtDate(r.o.date)}${r.o.until ? '–' + fmtDate(r.o.until).slice(5) : ''}</div></td>
        <td class="r">${priceText(it, r.o)}${r.o.reg ? `<div class="muted">${t('reg')} ${money(r.o.reg)}</div>` : ''}</td>
        <td class="r"><b>${fmtU(r.u)}</b>${altU(r.u) ? `<div class="muted">${altU(r.u)}</div>` : ''}</td></tr>`).join('')}</table>` : `<div class="muted">${t('noRecent')}</div>`;
}

function chartSvg(rowsDesc, minV0, u0) {
  const dd = uDisp(u0), label = dd.label, minV = minV0 * dd.f;
  const byDay = {}; for (const r of rowsDesc) { const d = r.o.date, v = r.u.v * dd.f; if (!(d in byDay) || v < byDay[d]) byDay[d] = v; }
  const pts = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0]));
  if (pts.length < 2) return '';
  const W = 320, H = 140, L = 44, R = 10, T = 12, B = 22;
  const ts = pts.map(p => Date.parse(p[0])), vs = pts.map(p => p[1]);
  let t0 = Math.min(...ts), t1 = Math.max(...ts); if (t1 === t0) t1 = t0 + 864e5;
  let v0 = Math.min(...vs), v1 = Math.max(...vs); if (v1 - v0 < 0.01) { v0 -= 0.5; v1 += 0.5; }
  const pv = (v1 - v0) * 0.12; v0 -= pv; v1 += pv;
  const X = x => L + (x - t0) / (t1 - t0) * (W - L - R), Y = v => T + (1 - (v - v0) / (v1 - v0)) * (H - T - B);
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${X(ts[i]).toFixed(1)},${Y(vs[i]).toFixed(1)}`).join('');
  const dots = pts.map((p, i) => `<circle cx="${X(ts[i]).toFixed(1)}" cy="${Y(vs[i]).toFixed(1)}" r="4" fill="${Math.abs(vs[i] - minV) < minV * 0.002 ? 'var(--good)' : 'var(--accent)'}" stroke="var(--card)" stroke-width="2"/>`).join('');
  return `<div class="card"><h2>📈 ${t('trend')} (${label})</h2><svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">
    <line x1="${L}" x2="${W - R}" y1="${Y(minV)}" y2="${Y(minV)}" stroke="var(--good)" stroke-dasharray="4 4"/>
    <text x="${L - 4}" y="${Y(minV) + 4}" font-size="10" text-anchor="end" fill="var(--good)">${minV.toFixed(2)}</text>
    <text x="${L - 4}" y="${T + 8}" font-size="10" text-anchor="end" fill="var(--muted)">${Math.max(...vs).toFixed(2)}</text>
    <path d="${path}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>${dots}
    <text x="${L}" y="${H - 6}" font-size="10" fill="var(--muted)">${fmtDate(pts[0][0])}</text>
    <text x="${W - R}" y="${H - 6}" font-size="10" text-anchor="end" fill="var(--muted)">${fmtDate(pts[pts.length - 1][0])}</text></svg></div>`;
}

// Choose (or create) the main item. If a barcode was scanned, its product info is attached as a new variant.
async function viewPick(code) {
  setHeader(t('chooseItem'), true); setTab('home');
  const items = await getAll('items');
  app.innerHTML = `<div class="card"><div id="pickMsg" class="muted"></div><div class="muted">${t('chooseItemHint')}</div>
    <input id="pq" type="search" placeholder="${esc(t('search'))}" style="margin-top:8px"></div>
    <div class="card hidden" id="addProd"><h2 style="margin-top:0">${t('apTitle')}</h2><div class="muted">${t('apHint')}</div>
      <label>${t('apName')}</label><input id="apName" placeholder="e.g. Baking soda">
      <div class="row"><div><label>${t('brand')}</label><input id="apBrand" placeholder="e.g. Arm & Hammer"></div><div><label>${t('apSize')}</label><input id="apSize" placeholder="e.g. 500 g"></div></div>
      <div class="row" style="align-items:center;margin-top:8px"><div id="apThumb" style="flex:0 0 54px">${thumb('', '📷')}</div><button class="btn sec small" id="apPhoto" style="flex:0 0 auto">📷 ${t('takePhoto')} (required)</button></div>
      <button class="btn" id="apSave">${t('apSave')}</button></div>
    <div class="card" id="plist"></div>
    <button class="btn sec" id="pNew">${t('newItem')}</button>`;
  let info = null; const pend0 = JSON.parse(sessionStorage.getItem('pp_pending') || '{}'); let sug = pend0.code === code ? pend0.sug || [] : [];
  if (code) {
    $('#pickMsg').textContent = t('lookingUp');
    info = pend0.code === code && pend0.info ? pend0.info : await findProduct(code);
    $('#pickMsg').textContent = info ? t('found') + [info.brand, info.name, info.quantity].filter(Boolean).join(' ') : t('notFound2');
    if (!info) { // nobody has this barcode yet: the user tells the pup what it is, and it's saved for everyone
      $('#addProd').classList.remove('hidden'); let apImg = '';
      $('#apPhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; apImg = await thumbFrom(f); $('#apThumb').innerHTML = thumb(apImg); };
      $('#apSave').onclick = async () => { const nm = $('#apName').value.trim(); if (!nm) return toast(t('needName')); if (!apImg) return toast('📷 Please take a clear photo of the product first. Everyone who scans it later will see it.', 3600);
        info = await bcPut(code, { name: nm, brand: $('#apBrand').value.trim(), quantity: $('#apSize').value.trim(), image: apImg, src: 'user' });
        $('#addProd').classList.add('hidden'); $('#pickMsg').textContent = t('apSaved') + [info.brand, info.name, info.quantity].filter(Boolean).join(' ');
        sug = matchItems(info, items).slice(0, 5).map(x => x.it.id); $('#pq').value = ''; render(); toast(t('apThanks'), 2600); };
    }
  }
  const go = id => {
    sessionStorage.setItem('pp_pending', JSON.stringify({ code: code || '', info }));
    location.hash = `#add/${encodeURIComponent(id)}/new`;
  };
  const render = () => {
    const q = $('#pq').value.trim().toLowerCase();
    const si = id => { const k = sug.indexOf(id); return !q && k >= 0 ? k : 99; };
    const rows = items.filter(it => !q || [it.name, it.en, ...(it.aliases || [])].join(' ').toLowerCase().includes(q)).sort((a, b) => (si(a.id) - si(b.id)) || itemName(a).localeCompare(itemName(b))).slice(0, 80);
    $('#plist').innerHTML = rows.map(it => `<a class="item" href="javascript:void 0" data-id="${esc(it.id)}">${thumb(itemPhoto(it), itemEmoji(it))}<div class="main"><div class="name">${esc(itemName(it))}${si(it.id) < 99 ? `<span class="tag">${t('suggested')}</span>` : ''}</div><div class="muted">${esc([itemSub(it), placeLabel(it)].filter(Boolean).join(' · '))}</div></div></a>`).join('') || `<div class="muted">${t('noMatch')}</div>`;
    $('#plist').querySelectorAll('[data-id]').forEach(a => a.onclick = () => code ? go(a.dataset.id) : (location.hash = `#add/${encodeURIComponent(a.dataset.id)}`));
  };
  $('#pq').oninput = render; render();
  $('#pNew').onclick = () => { sessionStorage.setItem('pp_pending', JSON.stringify({ code: code || '', info, newItemName: $('#pq').value.trim() })); location.hash = '#newitem'; };
}

async function viewNewItem() {
  setHeader(t('newItem').replace('＋ ', ''), true); setTab('home');
  const pend = JSON.parse(sessionStorage.getItem('pp_pending') || '{}');
  let mode = 'pack';
  app.innerHTML = `<div class="card">
    <label>${t('itemName1')}</label><input id="nName" value="${esc(pend.newItemName || '')}" placeholder="e.g. Laundry detergent">
    <label>${t('deptL')}</label><select id="nDept">${DEPTS.map(d => `<option value="${d[0]}">${d[2]} ${esc(d[1])}</option>`).join('')}</select>
    <label>${t('aisleL')}</label><select id="nAisle"></select>
    <label>${t('mode')}</label><div class="seg" id="nMode"><button type="button" data-m="pack">${t('modePack')}</button><button type="button" data-m="weight">${t('modeWeight')}</button></div>
    <label style="display:flex;gap:8px;align-items:center;color:var(--text);font-size:15px;margin-top:12px" id="nUsesRow"><input id="nUses" type="checkbox" style="width:auto"> ${t('useLoads')}</label>
    <label>${t('photo')}</label><div class="row" style="align-items:center"><div id="nThumb" style="flex:0 0 54px">${thumb(pend.info && pend.info.image, '📷')}</div><button class="btn sec small" id="nPhoto" style="flex:0 0 auto">📷 ${t('takePhoto')}</button></div>
    <div class="muted">${t('photoHint')}</div>
  </div><button class="btn" id="nSave">${t('save')}</button>`;
  const sync = () => { $('#nMode').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.m === mode)); $('#nUsesRow').classList.toggle('hidden', mode !== 'pack'); };
  $('#nMode').querySelectorAll('button').forEach(b => b.onclick = () => { mode = b.dataset.m; sync(); }); sync();
  const fillAisles = () => { $('#nAisle').innerHTML = DEPT[$('#nDept').value][3].map(a => `<option value="${a[0]}">${esc(a[1])}</option>`).join(''); };
  $('#nDept').onchange = fillAisles; fillAisles();
  let nPhoto = '';
  $('#nPhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; nPhoto = await thumbFrom(f); $('#nThumb').innerHTML = thumb(nPhoto); };
  $('#nSave').onclick = async () => {
    const name = $('#nName').value.trim(); if (!name) return toast(t('needName'));
    const id = 'I' + Date.now().toString(36);
    await save('items', { id, name, en: name, cat: DEPT_CAT[$('#nDept').value], aisle: $('#nDept').value + '/' + $('#nAisle').value, mode, cmpUses: mode === 'pack' && $('#nUses').checked, aliases: [], variants: {}, photo: nPhoto || (pend.info && pend.info.image) || '', created: today(), by: fbUser ? fbUser.uid : '' });
    location.replace(`#add/${encodeURIComponent(id)}/${pend.code || pend.info ? 'new' : ''}`);
  };
}

async function viewAdd(id, preVid) {
  const it = await getOne('items', id);
  if (!it) { location.hash = '#home'; return; }
  setHeader(t('addPrice'), true); setTab('home');
  const sum = summarize(it, await obsFor(id));
  const stores = [...new Set((await getAll('obs')).map(x => x.store).filter(Boolean))];
  const pend = preVid === 'new' ? JSON.parse(sessionStorage.getItem('pp_pending') || '{}') : {};
  const weight = it.mode === 'weight';
  const vars = Object.entries(it.variants || {});
  let vid = preVid && preVid !== 'new' ? preVid : (vars.length === 1 && preVid !== 'new' ? vars[0][0] : '');
  let per = 'lb', newPhoto = '';
  const q = pend.info ? parseQty(pend.info.quantity) : null;
  app.innerHTML = `
    <div class="card"><div class="item" style="padding:0;border:0"><span id="iThumb">${thumb(itemPhoto(it), itemEmoji(it))}</span><div class="main"><div class="name">${esc(itemName(it))}</div><div class="muted">${esc(placeLabel(it))}</div></div>
      ${!itemPhoto(it) && weight ? `<button class="btn sec small" id="iPhoto" style="flex:0 0 auto;margin:0">📷 ${t('takePhoto')}</button>` : ''}</div></div>
    ${weight ? '' : `<div class="card"><h2>${t('variant')}</h2>
      <div class="chips" id="vChips">${vars.map(([k]) => `<button class="chip" data-v="${esc(k)}">${esc(variantText(it, k))}</button>`).join('')}<button class="chip" data-v="__new">${t('newVariant')}</button></div>
      <div id="vNew" class="hidden">
        <div class="row"><div><label>${t('brand')}</label><input id="vBrand" value="${esc(pend.info ? pend.info.brand : '')}"></div><div><label>${t('desc')}</label><input id="vDesc" value="${esc(pend.info ? pend.info.name : '')}"></div></div>
        <div class="row"><div><label>${t('size')}</label><input id="vSize" inputmode="decimal" value="${esc(q ? q.size : '')}"></div>
          <div><label>${t('unit')}</label><select id="vUnit">${['mL', 'L', 'g', 'kg', 'lb', 'oz', 'count'].map(u => `<option value="${u}" ${q && q.unit === u ? 'selected' : ''}>${u === 'count' ? t('unitCount') : u}</option>`).join('')}</select></div></div>
        ${it.cmpUses ? `<label>${t('uses')}</label><input id="vUses" inputmode="numeric">` : ''}
        <label>${t('barcode')}</label><input id="vCode" inputmode="numeric" value="${esc(pend.code || '')}">
        <div class="row" style="align-items:center;margin-top:8px"><div id="vThumb" style="flex:0 0 54px">${thumb(pend.info && pend.info.image, '📷')}</div><button class="btn sec small" id="vPhoto" style="flex:0 0 auto">📷 ${t('takePhoto')}</button></div>
      </div></div>`}
    <div class="card">
      <button class="btn sec" id="ocrBtn">${t('ocrBtn')}</button>
      <div id="ocrMsg" class="muted"></div><div class="chips" id="chips"></div>
      ${weight ? `<label>${t('perWhat')}</label><div class="seg" id="perSeg"><button type="button" data-p="lb">$/lb</button><button type="button" data-p="kg">$/kg</button></div>` : ''}
      <label id="priceLbl">${weight ? t('priceLb') : t('pricePack')}</label><input id="aPrice" class="big" inputmode="decimal" placeholder="0.00">
      <div class="${weight ? 'hidden' : ''}"><label>${t('multi')}</label><input id="aMulti" inputmode="numeric" value="1"></div>
      <div id="verdict"></div>
      <label>${t('store')}</label><div class="muted" id="aGeo">📍 Finding stores near you…</div><div class="chips storechips" id="aChains"></div>
      <input id="aStore" class="hidden" list="storeList" value="" placeholder="Other store name">
      <datalist id="storeList">${stores.map(s => `<option value="${esc(s)}">`).join('')}</datalist>
      <div class="row"><div><label>${t('date')}</label><input id="aDate" type="date" value="${today()}"></div>
        <div><label>&nbsp;</label><label style="display:flex;gap:8px;align-items:center;color:var(--text);font-size:16px;margin:0;padding:11px 0"><input id="aSale" type="checkbox" style="width:auto"> ${t('sale')}</label></div></div>
      <label>${t('note')}</label><input id="aNote">
    </div>
    <button class="btn" id="aSave">${t('save')}</button>`;
  const draftVariant = () => {
    if (weight) return null;
    if (vid && vid !== '__new') return null;
    return { brand: $('#vBrand').value.trim(), desc: $('#vDesc').value.trim(), size: parseFloat($('#vSize').value) || 0, unit: $('#vUnit').value, uses: $('#vUses') ? parseInt($('#vUses').value) || 0 : 0, barcode: normCode($('#vCode').value), photo: newPhoto || (pend.info && pend.info.image) || '' };
  };
  const upd = () => {
    const price = parseFloat($('#aPrice').value), multi = parseInt($('#aMulti').value) || 1;
    let it2 = it, v2 = vid;
    const dv = draftVariant(); if (dv) { it2 = { ...it, variants: { ...(it.variants || {}), __draft: dv } }; v2 = '__draft'; }
    const o = { price, multi, per, vid: v2 };
    const v = verdict(it2, o, sum);
    $('#verdict').innerHTML = verdictHtml(v, v.u ? [fmtU(v.u), altU(v.u)].filter(Boolean).join(' · ') : '');
  };
  if (!weight) {
    const selV = k => { vid = k; $('#vChips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c.dataset.v === k)); $('#vNew').classList.toggle('hidden', k !== '__new'); upd(); };
    $('#vChips').querySelectorAll('.chip').forEach(c => c.onclick = () => selV(c.dataset.v));
    if (preVid === 'new' || !vars.length) selV('__new'); else if (vid) selV(vid);
    ['vSize', 'vUnit', 'vUses'].forEach(k => { const e = $('#' + k); if (e) e.oninput = upd; });
    $('#vPhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; newPhoto = await thumbFrom(f); $('#vThumb').innerHTML = thumb(newPhoto); };
  } else {
    const selP = p => { per = p; $('#perSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.p === p)); $('#priceLbl').textContent = p === 'kg' ? t('priceKg') : t('priceLb'); upd(); };
    $('#perSeg').querySelectorAll('button').forEach(b => b.onclick = () => selP(b.dataset.p)); selP('lb');
  }
  if ($('#iPhoto')) $('#iPhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; const ph = await thumbFrom(f); const fresh = await getOne('items', id); fresh.photo = ph; await save('items', fresh); $('#iThumb').innerHTML = thumb(ph); $('#iPhoto').remove(); };
  $('#aPrice').oninput = upd; $('#aMulti').oninput = upd; upd();
  let chain = chainOf(lsGet('lastStore') || '');
  const drawChains = list => { $('#aChains').innerHTML = list.map(x => `<button type="button" class="chip${x.c === chain ? ' on' : ''}" data-c="${esc(x.c)}">${esc(x.c)}${x.km != null ? `<small> · ${fmtKm(x.km)}</small>` : ''}</button>`).join('') + `<button type="button" class="chip${chain === '__other' ? ' on' : ''}" data-c="__other">Other…</button>`;
    $('#aChains').querySelectorAll('.chip').forEach(b => b.onclick = () => { chain = b.dataset.c; $('#aStore').classList.toggle('hidden', chain !== '__other'); drawChains(list); if (chain === '__other') $('#aStore').focus(); }); };
  drawChains(CHAINS.map(c => ({ c })));
  const findStores = async () => { try { const p = await getPos(); if (!inCalgary(p)) { $('#aGeo').innerHTML = `🗺️ You're outside Calgary. PricePup is currently for Calgary only, so prices logged here aren't counted.`; return; }
      const list = nearestChains(p); if (list[0].km != null && list[0].km <= .5) chain = list[0].c; drawChains(list); $('#aGeo').textContent = list[0].km <= .5 ? `📍 You're at ${list[0].c}` : '📍 Nearest stores first'; }
    catch (e) { $('#aGeo').innerHTML = `${esc(geoMsg(e))} <button type="button" class="btn sec small" id="aGeoRetry" style="display:inline-block;width:auto;margin:4px 0 0">Try again</button>`; $('#aGeoRetry').onclick = findStores; } };
  findStores();
  $('#ocrBtn').onclick = async () => {
    const f = await pickFile($('#fileTag')); if (!f) return;
    const msg = $('#ocrMsg'); $('#chips').innerHTML = '';
    msg.textContent = ocrWorker ? t('ocrReading') : t('ocrFirst');
    try {
      await getOcr(); msg.textContent = t('ocrReading');
      const c = await readPriceTag(f, weight);
      if (!c.length) { msg.textContent = t('ocrNone'); return; }
      msg.textContent = t('ocrPick');
      const label = x => (x.multi > 1 ? tf('itemsAt', x.multi, '') : '') + (x.partial ? '$' + x.price + '.??' : money(x.price)) + (x.per ? '/' + x.per : '');
      $('#chips').innerHTML = c.map((x, i) => `<button class="chip" data-i="${i}">${label(x)}</button>`).join('');
      const use = x => {
        $('#aMulti').value = x.multi;
        if (weight && x.per) { per = x.per; $('#perSeg').querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.p === per)); }
        if (x.partial) { const el = $('#aPrice'); el.value = Math.floor(x.price) + '.'; el.focus(); toast(t('ocrCents')); } else $('#aPrice').value = x.price.toFixed(2);
        upd();
      };
      $('#chips').querySelectorAll('.chip').forEach(b => b.onclick = () => use(c[+b.dataset.i])); use(c[0]);
    } catch (e) { msg.textContent = t('ocrFail'); }
  };
  $('#aSave').onclick = async () => {
    const price = parseFloat($('#aPrice').value); if (!(price > 0)) return toast(t('needPrice'));
    const storeName = chain === '__other' ? (chainOf($('#aStore').value) || $('#aStore').value.trim()) : chain; if (!storeName) return toast('Pick the store first');
    try { const p = await getPos(); if (!inCalgary(p)) return toast("🗺️ PricePup is for Calgary only for now. Prices logged outside Calgary aren't counted.", 4200); }
    catch (e) { return toast(geoMsg(e), 4200); }
    let useVid = '';
    if (!weight) {
      if (!vid) return toast(t('needVariant'));
      if (vid === '__new') {
        const dv = draftVariant(); if (!(dv.size > 0)) return toast(t('needSize'));
        useVid = 'V' + Date.now().toString(36);
        const fresh = await getOne('items', id);
        fresh.variants = { ...(fresh.variants || {}), [useVid]: dv };
        await save('items', fresh);
      } else useVid = vid;
    }
    const multi = weight ? 1 : (parseInt($('#aMulti').value) || 1);
    const o = { id: newId(), itemId: id, vid: useVid, price: Math.round(price * 100) / 100, multi, per: weight ? per : 'pack', store: storeName, date: $('#aDate').value || today(),
                sale: $('#aSale').checked, note: $('#aNote').value.trim(), src: 'app', by: fbUser ? fbUser.uid : '', ts: Date.now() };
    const v = verdict(await getOne('items', id), o, sum);
    await save('obs', o);
    if (earnCoin()) setTimeout(() => coinPop(1, 'Thanks for logging a price!'), 900);
    if (o.store) lsSet('lastStore', o.store);
    sessionStorage.removeItem('pp_pending');
    toast(v.cls === 'good' ? t('savedLow') : v.cls === 'eq' ? t('savedEq') : t('saved'), 3200);
    location.replace(`#item/${encodeURIComponent(id)}`);
  };
}

async function viewDeals() {
  setHeader(t('dealsTitle')); setTab('deals');
  const { items, obs } = await loadAll();
  const map = Object.fromEntries(items.map(i => [i.id, i]));
  const td = today();
  const all = obs.filter(o => o.sale && daysAgo(o.date) <= 14 && (!o.until || o.until >= td) && map[o.itemId]);
  const stores = [...new Set(all.map(o => o.store))].sort(); let atStore = '';
  if (dealNear) { const km = Object.fromEntries(dealNear.map(x => [x.c, x.km])), k = s => km[chainOf(s) || s] ?? 99; stores.sort((a, b) => k(a) - k(b));
    const s0 = stores.find(s => k(s) <= .5); if (s0) { atStore = s0; if (!dealPicked) dealStore = s0; } } // 5.5: at a store (GPS) -> its deals first
  if (dealStore && !stores.includes(dealStore)) dealStore = '';
  const deals = all.filter(o => !dealStore || o.store === dealStore).map(o => {
    const it = map[o.itemId]; const each = eachPrice(o); const off = o.reg > 0 ? 1 - each / o.reg : 0;
    return { o, it, off, u: unitPrice(it, o) };
  }).sort((a, b) => b.off - a.off);
  app.innerHTML = `<div class="card muted">${atStore && dealStore === atStore ? `<div style="font-weight:700;color:var(--text)">📍 You're at ${esc(atStore)}: here are its deals.</div>` : t('dealsHint')}<div class="chips scroll" id="dStores" style="margin-top:8px">${['', ...stores].map(s => `<button class="chip ${s === dealStore ? 'on' : ''}" data-s="${esc(s)}">${s ? esc(s) : t('allStores')}</button>`).join('')}</div></div><div class="card">${deals.length ? deals.slice(0, 200).map(d => `
    <a class="item" href="#item/${encodeURIComponent(d.it.id)}">${thumb(obsPhoto(d.it, d.o), itemEmoji(d.it))}
      <div class="main"><div class="name">${esc(itemName(d.it))}</div><div class="muted">${esc(obsText(d.it, d.o))}</div><div class="muted">${esc(d.o.store)} · ${fmtDate(d.o.date)}${d.o.until ? '–' + fmtDate(d.o.until).slice(5) : ''}${isUpcoming(d.o) ? ` <span class="tag up">${fmtDate(d.o.date).slice(5)} ${t('starts')}</span>` : ''}</div></div>
      <div class="price">${priceText(d.it, d.o)}<div class="muted">${d.off > 0 ? `<span class="tag">-${Math.round(d.off * 100)}%</span><br>${t('reg')} ${money(d.o.reg)}` : ''}${d.u && d.it.mode !== 'weight' ? '<br>' + fmtU(d.u) : ''}</div></div></a>`).join('')
    : `<div class="empty">${dog('sleep', 'z')}<div class="muted">${t('noDeals')}</div></div>`}</div>`;
  $('#dStores').querySelectorAll('.chip').forEach(b => b.onclick = () => { dealStore = b.dataset.s; dealPicked = true; viewDeals(); });
  if (Date.now() - dealNearAt > 3 * 60e3) { dealNearAt = Date.now(); locGranted().then(ok => ok && getPos().then(p => { if (!inCalgary(p)) return; dealNear = nearestChains(p); if (location.hash === '#deals') viewDeals(); })).catch(() => {}); }
}
let dealStore = '', dealPicked = false, dealNear = null, dealNearAt = 0;
const locGranted = async () => { try { return (await navigator.permissions.query({ name: 'geolocation' })).state === 'granted'; } catch (e) { return !!lsGet('locAsked'); } }; // never pop a location prompt just for deals

async function viewSettings() {
  setHeader(t('setTitle')); setTab('settings');
  const [items, obs] = await Promise.all([getAll('items'), getAll('obs')]);
  const flyer = latestFlyer(obs);
  app.innerHTML = `
    <div class="card"><h2>🔔 ${t('notiTitle')}</h2><div class="muted">${t('notiHint')}</div><div style="margin-top:8px" id="notiBox"></div></div>
    <div class="card"><h2>☁️ ${t('syncTitle')}</h2><div class="muted">${t('syncDesc')}</div>
      <div style="margin:10px 0 4px;font-weight:700">${fbUser ? t('signedInAs') + esc(fbUser.email) + ' · ' : ''}<span id="syncStatus">${syncLabel()}</span></div>
      <div class="muted" id="lastSyncTxt">${lastSyncText()}</div>
      ${flyer ? `<div class="muted" style="margin-bottom:10px">${t('latestFlyer')}${fmtDate(flyer.from)}–${fmtDate(flyer.to).slice(5)} · ${fmtWhen(flyer.ts)} ${t('loadedOn')}</div>` : '<div style="margin-bottom:10px"></div>'}
      ${fbUser ? `<button class="btn sec" id="sSignOut">${t('signOut')}</button>` : `<button class="btn" id="sSignIn">${t('signIn')}</button>`}</div>
    <div class="card"><h2>🦴 ${t('data')}</h2><div class="muted">${tf('count', items.length, obs.length)}</div></div>
    ${isAdmin() ? `<div class="card"><h2>👥 ${t('usersTitle')}</h2><div id="usersBody" class="muted">…</div></div>` : ''}
    ${isAdmin() ? `<div class="card"><h2>🗂️ Unsorted products</h2><div id="unsortedBody" class="muted">…</div></div>` : ''}
    ${isAdmin() ? `<div class="card"><h2>📊 ${t('usageTitle')}</h2><div class="muted">${t('usageHint')}</div><div id="usageBody"></div>
      <div class="row" style="margin-top:8px"><button class="btn sec small" id="usageBtn">${t('usageLoad')}</button><a class="btn sec small" style="text-align:center;text-decoration:none" target="_blank" rel="noopener" href="https://console.firebase.google.com/project/${FB_CONFIG.projectId}/firestore/databases/-default-/usage">${t('usageConsole')}</a></div></div>` : ''}
    <button class="btn sec" id="sGuide">${t('guide')}</button>
    <div class="empty">${dog('sleep', 'z')}<div class="muted"><span class="brand" style="font-weight:800;font-size:16px">${LANG === 'zh' ? '格價狗 PricePup' : 'PricePup'}</span> v${APP_VERSION}<br>${t('credit')}</div></div>`;
  $('#sGuide').onclick = () => showGuide(0);
  const notiUI = () => { const box = $('#notiBox'); if (!box) return; if (!notifySupported()) { box.innerHTML = `<div class="muted">${t('notiNo')}</div>`; return; }
    const p = Notification.permission; box.innerHTML = p === 'granted' ? `<div><b>✅ ${t('notiOnDone')}</b></div><button class="btn sec small" id="notiTest" style="margin-top:6px">${t('notiTest')}</button>` : p === 'denied' ? `<div class="muted">${t('notiDenied')}</div>` : `<button class="btn small" id="notiAsk">${t('notiOn')}</button>`;
    if ($('#notiAsk')) $('#notiAsk').onclick = async () => { await askNotify(); notiUI(); };
    if ($('#notiTest')) $('#notiTest').onclick = () => notify('PricePup', t('notiTestBody'), 'test', '#settings'); };
  notiUI();
  if ($('#sSignIn')) $('#sSignIn').onclick = signIn;
  if ($('#sSignOut')) $('#sSignOut').onclick = signOutSync;
  if ($('#usageBtn')) { $('#usageBtn').onclick = () => loadUsage(true); if (usageTok()) loadUsage(false); }
  if ($('#usersBody')) loadUsers(); if ($('#unsortedBody')) loadUnsorted();
}

/* ---------- Latest flyer week + admin usage ---------- */
async function loadUsers() {
  const box = $('#usersBody'); if (!box) return;
  try {
    const snap = await fb.F.getDocsFromServer(col('users'));
    const us = snap.docs.map(d => d.data()).filter(u => u.email).sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
    const live = us.filter(u => Date.now() - (u.lastSeen || 0) < 10 * 60e3).length;
    box.innerHTML = `<div style="font-weight:700;color:var(--text)">${tn('usersTotal', us.length)} · ${tn('usersActive', live)}</div>
      <table style="margin-top:6px">${us.map(u => `<tr><td>${Date.now() - (u.lastSeen || 0) < 10 * 60e3 ? '🟢 ' : ''}${esc(u.email)}${u.name ? `<div class="muted">${esc(u.name)}</div>` : ''}</td>
        <td class="r">${fmtWhen(u.lastSeen)}<div class="muted">v${esc(u.app || '?')}</div></td></tr>`).join('')}</table>
      <div class="muted" style="margin-top:6px">${t('usersNote')}</div>${areaStats(us)}`;
  } catch (e) { box.innerHTML = `<span style="color:var(--bad)">${esc(e.code || e.message)}</span>`; }
}
function areaStats(us) { const c = {}; us.forEach(u => { const a = u.area ? (u.inCalgary || /^calgary$/i.test(u.area.trim()) ? 'Calgary' : u.area.trim().toLowerCase().replace(/\s+/g, ' ').replace(/(^|[\s,(-])\w/g, m => m.toUpperCase()).replace(/\b(ab|bc|sk|mb|on|qc|ns|nb|nl|pe|yt|nt|nu|usa|uk)\b/gi, m => m.toUpperCase())) : 'Not shared'; c[a] = (c[a] || 0) + 1; });
  const yyc = c.Calgary || 0, none = c['Not shared'] || 0, other = us.length - yyc - none, rows = Object.entries(c).filter(([a]) => a !== 'Calgary' && a !== 'Not shared').sort((a, b) => b[1] - a[1]);
  return `<h3 style="margin:12px 0 4px">📍 Where users are</h3><div style="color:var(--text)"><b>${yyc}</b> in Calgary · <b>${other}</b> elsewhere · <b>${none}</b> not shared</div>
    ${rows.length ? `<table style="margin-top:4px">${rows.map(([a, n]) => `<tr><td>${esc(a)}</td><td class="r">${n}</td></tr>`).join('')}</table>` : ''}`; }
function latestFlyer(obs) {
  const fl = obs.filter(o => o.src === 'flyer' && o.date); if (!fl.length) return null;
  const from = fl.reduce((m, o) => o.date > m ? o.date : m, '');
  const wk = fl.filter(o => o.date === from), cnt = {}; wk.forEach(o => { if (o.until) cnt[o.until] = (cnt[o.until] || 0) + 1; });
  const to = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || from;
  return { from, to, ts: Math.max(...fl.map(o => o.ts || 0)) };
}
const ADMIN = 'silveratca@gmail.com';
const isAdmin = () => !!(fbUser && (fbUser.email || '').toLowerCase() === ADMIN);
const usageTok = () => { try { const x = JSON.parse(sessionStorage.getItem('pp_mon') || 'null'); return x && x.exp > Date.now() ? x.t : null; } catch (e) { return null; } };
async function loadUsage(interactive) {
  const box = $('#usageBody'); if (!box) return;
  let tok = usageTok();
  try {
    if (!tok) {
      if (!interactive) return;
      const p = new fb.A.GoogleAuthProvider(); p.addScope('https://www.googleapis.com/auth/monitoring.read'); p.setCustomParameters({ login_hint: fbUser.email });
      const res = await fb.A.reauthenticateWithPopup(fbUser, p);
      tok = (fb.A.GoogleAuthProvider.credentialFromResult(res) || {}).accessToken;
      if (!tok) throw new Error('no token');
      try { sessionStorage.setItem('pp_mon', JSON.stringify({ t: tok, exp: Date.now() + 50 * 60e3 })); } catch (e) {}
    }
    box.innerHTML = `<div class="muted">${t('usageLoading')}</div>`;
    const end = new Date(), start = new Date(end - 7 * 864e5);
    const pt = d => d.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }), todayPT = pt(end);
    const series = async kind => {
      const q = new URLSearchParams({ filter: `metric.type="firestore.googleapis.com/document/${kind}_count"`, 'interval.startTime': start.toISOString(), 'interval.endTime': end.toISOString(),
        'aggregation.alignmentPeriod': '3600s', 'aggregation.perSeriesAligner': 'ALIGN_SUM', 'aggregation.crossSeriesReducer': 'REDUCE_SUM' });
      const r = await fetch(`https://monitoring.googleapis.com/v3/projects/${FB_CONFIG.projectId}/timeSeries?${q}`, { headers: { Authorization: 'Bearer ' + tok } });
      if (!r.ok) { const e = new Error(String(r.status)); e.status = r.status; e.body = await r.text().catch(() => ''); throw e; }
      const byDay = {};
      for (const s of (await r.json()).timeSeries || []) for (const p of s.points || []) { const d = pt(new Date(Date.parse(p.interval.endTime) - 1000)); byDay[d] = (byDay[d] || 0) + +(p.value.int64Value || p.value.doubleValue || 0); }
      return { today: byDay[todayPT] || 0, peak: Math.max(0, ...Object.values(byDay)) };
    };
    const [rd, wr, dl] = await Promise.all(['read', 'write', 'delete'].map(series));
    const bar = (label, v, q) => { const pc = Math.min(100, v / q * 100); return `<div style="margin-top:8px"><div class="row" style="justify-content:space-between"><b>${label}</b><span class="muted">${v.toLocaleString()} / ${q.toLocaleString()} (${pc.toFixed(pc < 10 ? 1 : 0)}%)</span></div><div class="meter"><i style="width:${pc}%;background:${pc > 80 ? 'var(--bad)' : pc > 50 ? '#e8a020' : 'var(--good)'}"></i></div></div>`; };
    box.innerHTML = `<div class="muted" style="margin-top:6px">${t('usageToday')}</div>${bar(t('usageReads'), rd.today, 50000)}${bar(t('usageWrites'), wr.today, 20000)}${bar(t('usageDeletes'), dl.today, 20000)}
      <div class="muted" style="margin-top:8px">${t('usagePeak')}: ${rd.peak.toLocaleString()} / 50,000</div>`;
  } catch (e) {
    if (e.status === 401) { try { sessionStorage.removeItem('pp_mon'); } catch (x) {} }
    const noApi = e.status === 403 && /SERVICE_DISABLED|has not been used|is disabled/i.test(e.body || '');
    box.innerHTML = noApi ? `<div class="muted" style="color:var(--bad)">${t('usageNoApi')} · <a target="_blank" rel="noopener" href="https://console.cloud.google.com/apis/library/monitoring.googleapis.com?project=${FB_CONFIG.projectId}">API</a></div>`
      : `<div class="muted" style="color:var(--bad)">${t('usageFail')}${esc(e.code || e.status || e.message)}</div>`;
  }
}

/* ---------- Variant page: one brand/size of an item ---------- */
async function viewVariant(id, vid) {
  const it = await getOne('items', id); const va = it && (it.variants || {})[vid];
  if (!va) { location.hash = it ? `#item/${encodeURIComponent(id)}` : '#home'; return; }
  setHeader(variantText(it, vid) || itemName(it), true); setTab('home');
  const obs = (await obsFor(id)).filter(o => o.vid === vid), s = summarize(it, obs);
  const cur = s ? s.rows.filter(r => r.o.sale && isCurrent(r.o)).sort((a, b) => a.u.v - b.u.v) : [];
  app.innerHTML = `
    <div class="card"><div class="item" style="padding:0;border:0">${thumb(variantPhoto(it, va), itemEmoji(it))}<div class="main">
      <div class="name" style="white-space:normal">${esc(variantText(it, vid))}</div>
      <div class="muted"><a href="#item/${encodeURIComponent(id)}" style="color:inherit">${esc(itemName(it))}</a>${va.barcode ? ' · ' + esc(va.barcode) : ''}</div></div><span id="vTrack">${trackBtn(id + '|' + vid)}</span></div></div>
    ${scanCtx && scanCtx.known && scanCtx.vid === vid ? `<div class="card scan"><div>${t('scanKnown')}</div></div>` : ''}
    <button class="btn" id="vAdd">${dog('normal', 'tag')}<span>${t('logThis')}</span></button>
    ${s ? `<div class="card"><div style="text-align:right;margin:-4px 0 4px">${unitChip()}</div><div class="row" style="align-items:flex-start">
      <div><div class="muted">${t('histLow')}</div><div class="big-num">${priceText(it, s.low.o)}</div>${unitLine(it, s.low.u)}<div class="muted">${esc(s.low.o.store)} · ${fmtDate(s.low.o.date)}</div></div>
      ${s.best ? `<div><div class="muted">${t('bestNow')}</div><div class="big-num">${priceText(it, s.best.o)}</div>${unitLine(it, s.best.u)}<div class="muted">${esc(s.best.o.store)} · ${tf('ago', daysAgo(s.best.o.date))}</div></div>` : ''}</div></div>
    <div class="card"><h2>🏷️ ${t('curDeals')}</h2>${cur.length ? `<table>${cur.map(r => `<tr><td>${esc(r.o.store)}<div class="muted">${fmtDate(r.o.date)}${r.o.until ? '–' + fmtDate(r.o.until).slice(5) : ''}</div></td><td class="r">${priceText(it, r.o)}${r.o.reg ? `<div class="muted">${t('reg')} ${money(r.o.reg)}</div>` : ''}</td><td class="r"><b>${fmtU(r.u)}</b></td></tr>`).join('')}</table>` : `<div class="muted">${t('noCurDeal')}</div>`}</div>
    <div class="card"><h2>🐾 ${t('byStore')}</h2>${boardHtml(it, s)}</div>
    ${chartSvg(s.rows, s.low.u.v, s.low.u)}
    <div class="card"><h2>${t('varHist')}（${s.rows.length}）</h2><table>
      ${s.rows.slice(0, 80).map(r => `<tr class="${isEnded(r.o) ? 'ended' : ''}"><td>${fmtDate(r.o.date)}<div class="muted">${esc(r.o.store)}${r.o.sale ? ' · ' + t('sale') : ''}${isEnded(r.o) ? ' · ' + t('ended') : ''}</div></td>
        <td class="r">${priceText(it, r.o)}<div class="muted">${fmtU(r.u)}</div></td></tr>`).join('')}</table></div>` : obs.length ? rawVariant(it, obs) : `<div class="card empty">${dog('sniff', 'glass')}<div class="muted">${t('noPrice')}</div></div>`}`;
  $('#vAdd').onclick = () => location.hash = va.barcode ? `#product/${va.barcode}/log` : `#add/${encodeURIComponent(id)}/${encodeURIComponent(vid)}`; // scanned products use the quick log screen
  $('#vTrack').onclick = e => { if (!e.target.closest('[data-track]')) return; toggleTrack(id + '|' + vid); $('#vTrack').innerHTML = trackBtn(id + '|' + vid); };
  bindUnitChip(() => viewVariant(id, vid));
}

// variant without a usable size: list prices only
function rawVariant(it, obs) {
  const rows = obs.slice().sort((a, b) => (b.date || '').localeCompare(a.date || '')), cur = rows.filter(o => o.sale && isCurrent(o));
  const tr = o => `<tr class="${isEnded(o) ? 'ended' : ''}"><td>${fmtDate(o.date)}${o.until ? '–' + fmtDate(o.until).slice(5) : ''}<div class="muted">${esc(o.store)}${o.sale ? ' · ' + t('sale') : ''}${isEnded(o) ? ' · ' + t('ended') : ''}</div></td><td class="r">${priceText(it, o)}${o.reg ? `<div class="muted">${t('reg')} ${money(o.reg)}</div>` : ''}</td></tr>`;
  return `<div class="card muted">${t('noSize')}</div>
    <div class="card"><h2>🏷️ ${t('curDeals')}</h2>${cur.length ? `<table>${cur.map(tr).join('')}</table>` : `<div class="muted">${t('noCurDeal')}</div>`}</div>
    <div class="card"><h2>${t('varHist')}（${rows.length}）</h2><table>${rows.slice(0, 80).map(tr).join('')}</table></div>`;
}

/* ---------- Modal sheet, install button, first-run guide ---------- */
function showSheet(html, onClose) {
  closeSheet(); const m = document.createElement('div'); m.className = 'modal'; m.id = 'sheet';
  m.innerHTML = `<div class="box" role="dialog" aria-modal="true">${html}</div>`;
  m.addEventListener('click', e => { if (e.target === m) { closeSheet(); onClose && onClose(); } });
  document.body.appendChild(m); return m;
}
function closeSheet() { const m = $('#sheet'); if (m) m.remove(); }
let installEvt = null;
const isStandalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; updInstall(); });
window.addEventListener('appinstalled', () => { installEvt = null; updInstall(); toast(t('installed'), 3500); });
function updInstall() { const b = $('#installBtn'); if (!b) return; b.textContent = t('install'); b.classList.toggle('hidden', isStandalone()); }
$('#installBtn').onclick = async () => {
  if (installEvt) { installEvt.prompt(); try { await installEvt.userChoice; } catch (e) {} installEvt = null; updInstall(); return; }
  const m = showSheet(`<div style="text-align:center">${dog('happy', 'tag', 'bounce')}</div><h2 style="text-align:center">${t('installTitle')}</h2>
    <div style="font-size:16px;line-height:1.7;margin:8px 0 14px">${isIOS() ? t('iosSteps') : t('otherSteps')}</div><button class="btn" id="shOk">${t('close2')}</button>`);
  m.querySelector('#shOk').onclick = closeSheet;
};
const GUIDE = [['g1t', 'g1', 'happy', 'tag'], ['g2t', 'g2', 'normal', ''], ['g3t', 'g3', 'sniff', 'glass'], ['g4t', 'g4', 'happy', 'party'], ['g5t', 'g5', 'normal', 'tag']];
function showGuide(i) {
  const done = () => { lsSet('guided', '1'); closeSheet(); setTimeout(firstLocation, 700); };
  const [tt, tx, mood, acc] = GUIDE[i], last = i === GUIDE.length - 1;
  const m = showSheet(`<div class="guide"><div style="text-align:center">${dog(mood, acc, 'bounce')}</div><h2 style="text-align:center;font-size:20px">${t(tt)}</h2>
    <div style="font-size:16px;line-height:1.6;margin:6px 0 10px">${t(tx)}</div>${last && !isStandalone() ? `<div class="muted" style="margin-bottom:10px">${t('g6')}</div>` : ''}
    <div class="dots">${GUIDE.map((_, j) => `<span class="${j === i ? 'on' : ''}"></span>`).join('')}</div>
    <div class="row">${last ? '' : `<button class="btn sec" id="gSkip" style="margin:0">${t('skip')}</button>`}<button class="btn" id="gNext" style="margin:0">${last ? t('start') : t('next')}</button></div></div>`, done);
  if (m.querySelector('#gSkip')) m.querySelector('#gSkip').onclick = done;
  m.querySelector('#gNext').onclick = () => last ? done() : showGuide(i + 1);
}

/* ---------- Puppy garden (pet, feed, water, toys, coins, poo, live Calgary weather + day/night) ---------- */
const FREE_TREATS = 3, COIN_CAP = 20;           // 3 free treats a day; a price log earns 1 coin, a new product 2 more (max 20 a day)
const GKEY = 'garden';
const H = ms => (Date.now() - (ms || 0)) / 36e5;

// ---------- 5.2: every puppy is different (hidden abilities 1-100), grows up, can get sick, goes to the shelter if left alone ----------
const PUP_V = 2;
const rnd = (a, b) => a + Math.random() * (b - a);
const roll = () => Math.round((rnd(20, 100) + rnd(20, 100) + rnd(20, 100)) / 3); // most puppies 45-75; extremes are rare
const PERSONAS = ['cuddly', 'independent', 'playful', 'shy'];
const PERSONA_TXT = { cuddly: '💛 Cuddly', independent: '🧭 Independent', playful: '🎈 Playful', shy: '🌸 Shy' };
function newPup(color, name) { // potential (adult peak) of each ability; what it can do now also depends on age and training
  return { v: PUP_V, color, name, adopted: Date.now(), pot: { str: roll(), iq: roll(), hp: roll(), en: roll() },
    app: Math.random() < .3 ? 4 : 3, per: PERSONAS[Math.floor(Math.random() * 4)], kg: Math.round(rnd(8, 30) * 10) / 10,
    tr: { str: 0, iq: 0, hp: 0 }, sk: { fetch: 0 }, skLog: {} };
}
const pupAgeM = p => 2 + (Date.now() - (p.adopted || Date.now())) / 864e5 * 2 / 30.44;   // adopted at 2 months; 1 real day = 2 puppy days
const growth = p => Math.max(.3, Math.min(1, .3 + .7 * (pupAgeM(p) - 2) / 10));         // 30% at 2 months -> 100% at 12 months
function stat(g, k) { const p = (g && g.pup) || {}; if (!p.pot) return 50; if (k === 'en') return p.pot.en; // energy: highest as a puppy
  return Math.max(1, Math.min(100, Math.round(p.pot[k] * (.6 * growth(p) + .4 * Math.min(1, (p.tr || {})[k] || 0))))); }
function train(g, k, n) { if (!g.pup) return; const tr = g.pup.tr = g.pup.tr || {}; tr[k] = Math.min(1, (tr[k] || 0) + n); }
const speedK = g => .75 + stat(g, 'str') / 200;   // strong puppies run faster
function ageTxt(p) { const m = pupAgeM(p); if (m >= 12) { const y = Math.floor(m / 12), r = Math.floor(m % 12); return y + (y > 1 ? ' years' : ' year') + (r ? ` ${r} month${r > 1 ? 's' : ''}` : ''); }
  const mm = Math.floor(m), d = Math.floor((m - mm) * 30.44); return `${mm} months ${d} day${d === 1 ? '' : 's'}`; }
const stageTxt = p => pupAgeM(p) < 12 ? '🐶 Puppy' : pupAgeM(p) < 84 ? '🐕 Adult' : '🦮 Senior';
const pupKg = p => Math.round((p.kg || 15) * (.12 + .83 * Math.pow(Math.max(0, Math.min(1, (pupAgeM(p) - 2) / 10)), .8)) * 10) / 10;
const mealsPerDay = g => { const m = g.pup ? pupAgeM(g.pup) : 12; return m < 3 ? 4 : m < 6 ? 3 : 2; };
const emptyH = g => 24 / mealsPerDay(g) * 1.6 * ((g.pup && g.pup.app === 4) ? .85 : 1); // hours from a full meal to an empty tummy (big eaters sooner)
const hungerH = g => emptyH(g);
const BOWL_MAX = 2, HUNGRY = 40;   // the food bowl holds 2 meals; the puppy eats by itself when fullness drops below 40
const rndMin = (a, b) => (a + Math.random() * (b - a)) * 60e3;
const isYoung = g => !g.pup || pupAgeM(g.pup) < 6;
const holdH = g => Math.min(7, (g.pup ? pupAgeM(g.pup) : 12) + 1);  // rule of thumb: a puppy holds it about (age in months + 1) hours
const nextPee = (g, from) => { g.pendingPee = (from || Date.now()) + holdH(g) * 36e5 * (.7 + Math.random() * .4); };
const peeAfterDrink = g => { const t = Date.now() + (isYoung(g) ? rndMin(15, 40) : rndMin(30, 90)); if (!g.pendingPee || g.pendingPee > t) g.pendingPee = t; };
const pooAfterMeal = (g, at) => { if (!g.pendingPoo) g.pendingPoo = (at || Date.now()) + (isYoung(g) ? rndMin(10, 40) : rndMin(30, 120)); };
function autoEat(g) { // while nobody is watching, the puppy eats from its bowl when hungry
  let ch = false;
  while ((g.bowl || 0) > 0 && g.lastFed) { const t = g.lastFed + emptyH(g) * (1 - HUNGRY / 100) * 36e5; if (t > Date.now()) break;
    g.lastFed = t; g.bowl--; g.fedTotal = (g.fedTotal || 0) + 1; pooAfterMeal(g, t); ch = true; }
  return ch; }
// skills (0-100). Fetch: under 30 no idea ("?"), 30-60 chases the ball but keeps it, 60+ brings it back
const SKILL_DAY = 10, TOILET_OK = 80, CMD_OK = 80;
const CMDS = [ // commands unlock with the bond level; d = difficulty
  { id: 'sit', n: 'Sit', e: '🪑', L: 2, d: 1, pose: ['sit', 'happy', 'r-wiggle wagfast'] }, { id: 'down', n: 'Down', e: '⬇️', L: 3, d: 1.5, pose: ['lie', 'open', ''] },
  { id: 'paw', n: 'Paw', e: '🐾', L: 4, d: 2, pose: ['paw', 'happy', 'wagfast'] }, { id: 'up', n: 'Up', e: '⬆️', L: 5, d: 2.5, pose: ['beg', 'super', 'r-wiggle'] },
  { id: 'spin', n: 'Spin', e: '🔄', L: 6, d: 3, pose: ['run2', 'super', 'r-spin'] }, { id: 'bow', n: 'Bow', e: '🙇', L: 7, d: 3.5, pose: ['bow', 'happy', 'wagfast'] },
  { id: 'roll', n: 'Roll over', e: '🌀', L: 8, d: 4, pose: ['roll', 'happy', 'r-roll'] }, { id: 'dead', n: 'Play dead', e: '💤', L: 10, d: 5, pose: ['dead', 'dead', ''] }];
const skill = (g, k) => ((g.pup && g.pup.sk) || {})[k] || 0;
function practise(g, k, d = 1, learnAt = 60) { if (!g.pup) return false; g.pup.sk = g.pup.sk || {}; g.pup.skAt = g.pup.skAt || {}; g.pup.skAt[k] = Date.now();
  const log = g.pup.skLog = g.pup.skLog && g.pup.skLog.day === today() ? g.pup.skLog : { day: today() };
  if ((log[k] || 0) >= SKILL_DAY) return false; log[k] = (log[k] || 0) + 1;
  const before = g.pup.sk[k] || 0, gain = (4 + 8 * stat(g, 'iq') / 100) / Math.sqrt(d); g.pup.sk[k] = Math.min(100, before + gain); train(g, 'iq', .01);
  if (before < learnAt && g.pup.sk[k] >= learnAt) { train(g, 'iq', .05); return 'learned'; }
  if (before < learnAt / 2 && g.pup.sk[k] >= learnAt / 2) return 'half';
  return true; }
// sickness: one check a day. Big temperature swings (chinooks), deep cold and poor care raise the risk; health lowers it
const SICK_MS = 5 * 36e5, PILL_MS = 5 * 60e3, PILL_PRICE = 5, SHELTER_H = 24, SHELTER_FEE = 10;
const isSick = g => !!(g && g.sick && g.sick.until > Date.now());
async function calgaryTemps() { // the last 24 hours of hourly temperatures in Calgary (cached for 3 hours)
  try { const c = JSON.parse(lsGet('pp_t24') || 'null'); if (c && Date.now() - c.at < 3 * 36e5) return c.t; } catch (e) {}
  const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.0447&longitude=-114.0719&hourly=temperature_2m&past_days=1&forecast_days=1&timezone=America%2FEdmonton');
  const j = await r.json(), now = calgaryNow().slice(0, 13), i = j.hourly.time.findIndex(x => x.slice(0, 13) === now);
  const t = j.hourly.temperature_2m.slice(Math.max(0, i - 24), i + 1).filter(x => x != null);
  lsSet('pp_t24', JSON.stringify({ at: Date.now(), t })); return t;
}
function sickCheck(g, temps) { // true if the puppy just got sick
  if (!g.pup || !g.pup.pot || g.sickChk === today()) return false; g.sickChk = today();
  if (H(g.lastFed) < 24 && waterLevel(g) < 3 && !(g.poos || []).length) train(g, 'hp', .02); // good care builds health
  if (isSick(g)) return false;
  const lo = temps && temps.length ? Math.min(...temps) : 0, hi = temps && temps.length ? Math.max(...temps) : 0;
  let risk = 0, cause = '';
  if (hi - lo >= 15) { risk += .25; cause = 'swing'; }
  if (lo <= -20) { risk += .15; cause = cause || 'cold'; }
  if (waterLevel(g) >= 4) { risk += .1; cause = cause || 'water'; }
  if ((g.poos || []).length >= 2) { risk += .1; cause = cause || 'dirty'; }
  if (fullness(g) === 0) { risk += .1; cause = cause || 'hungry'; }
  if (Math.random() < risk * (1 - stat(g, 'hp') / 120)) { g.sick = { at: Date.now(), until: Date.now() + SICK_MS, cause, lo: Math.round(lo), hi: Math.round(hi) }; return true; }
  return false;
}
const SICK_WHY = { swing: s => `caught a cold after the big temperature swing (${s.lo}°C → ${s.hi}°C)`, cold: s => `caught a chill in the deep cold (${s.lo}°C)`,
  water: () => 'got a tummy bug from dirty water', dirty: () => 'got sick from the messy garden', hungry: () => 'got weak and sick from going hungry' };
const hmm = ms => { const m = Math.max(0, Math.ceil(ms / 60e3)); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
// shelter: nobody cared for the puppy (no visit) for 24 hours. The pet hotel (vacation) pauses this
const onVacation = g => !!(g && g.vac && g.vac.until > Date.now());
function shelterCheck(g) { if (!g.pup || g.shelter || onVacation(g)) return;
  const last = Math.max(g.lastVisit || 0, (g.vac && g.vac.until) || 0); if (last && H(last) >= SHELTER_H) g.shelter = { at: last + SHELTER_H * 36e5 }; }
const xpAt = L => { let x = 0, need = 40; for (let i = 1; i < L; i++) { x += need; need += 20; } return x; };
function gLoad() { let g = {}; try { g = JSON.parse(lsGet(GKEY) || '{}'); } catch (e) {} if (g.uid && fbUser && g.uid !== fbUser.uid) g = {}; return gPoo(gDay(g)); } // 5.5: a puppy saved on this phone by another account is not yours
function gDay(g) {
  if (g.pup && (g.pup.v || 0) < PUP_V) { const keep = { coins: g.coins, toys: g.toys, bonus: g.bonus, day: g.day, free: g.free, coinsToday: g.coinsToday, updated: g.updated };
    Object.keys(g).forEach(k => delete g[k]); Object.assign(g, keep); }
  if (g.day !== today()) { g.day = today(); g.free = FREE_TREATS; g.coinsToday = 0; }
  if (g.free > FREE_TREATS) g.free = FREE_TREATS;   // older versions gave 10 a day
  g.bonus = g.bonus || 0; g.coins = g.coins || 0; g.toys = g.toys || [];
  if (g.coins >= 99 && !lsGet('coinReset545') && typeof isAdmin === 'function' && isAdmin()) { g.coins = 0; g.coinsToday = 0; lsSet('coinReset545', '1'); gSave(g); } // 5.4.5: clear the old 99 test coins once per device
  if (g.pup && !g.waterAt) g.waterAt = Date.now();
  if (g.joyV == null) { g.joyV = g.lastFed ? clamp(100 - Math.min(H(g.lastFed), H(g.lastPet)) / 6 * 100) : 60; g.joyAt = Date.now(); } // happiness now builds up slowly
  g.xp = g.xp || 0; if (!g.xpLog || g.xpLog.day !== today()) g.xpLog = { day: today() };
  if (g.pup && g.bowl === undefined) g.bowl = BOWL_MAX; // 5.3: meals moved to a free food bowl
  if (g.pup && g.pup.sk && g.pup.decayDay !== today()) { g.pup.decayDay = today(); const at = g.pup.skAt || {};
    for (const k in g.pup.sk) { const v = g.pup.sk[k]; if (v > 0 && at[k] && (Date.now() - at[k]) / 864e5 > 7) g.pup.sk[k] = Math.max(v >= 60 ? 60 : 0, v - 2); } }
  return g;
}
function gSave(g) { g.updated = Date.now(); if (fbUser) g.uid = fbUser.uid; lsSet(GKEY, JSON.stringify(g)); if (syncOn()) fb.F.setDoc(favRef(), { garden: g }, { merge: true }).catch(() => {}); }
async function gSync() { // newest copy wins (phone vs cloud)
  let g = gLoad();
  if (syncOn()) { try { const s = await fb.F.getDoc(favRef()); const r = s.exists() && s.data().garden;
    const cloudPup = r && r.pup && r.pup.v >= PUP_V, samePup = cloudPup && g.pup && g.pup.adopted === r.pup.adopted;
    if (r && ((cloudPup && !samePup) || (r.updated || 0) > (g.updated || 0))) { g = gPoo(gDay({ ...r })); lsSet(GKEY, JSON.stringify(g)); } // the puppy in your account always wins over a different one on this phone
  } catch (e) {} }
  return g;
}
// 5.5 coin reward: a big gold coin pops up with "+1" / "+2" and twinkling sparkles
function coinPop(n, why) { document.querySelectorAll('.coinpop').forEach(e => e.remove());
  const sp = (x, y, s, d) => `<svg class="cp-sp" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s" viewBox="0 0 20 20"><path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z" fill="#e5383b"/></svg>`;
  const el = document.createElement('div'); el.className = 'coinpop';
  el.innerHTML = `<div class="cp-box"><svg class="cp-coin" viewBox="0 0 200 200" aria-hidden="true">
      <ellipse cx="112" cy="104" rx="80" ry="86" fill="#f0a52b"/><path d="M150 40 h14 M168 62 h12 M176 90 h10 M178 118 h10 M172 146 h12 M158 170 h12" stroke="#e08f1c" stroke-width="5" stroke-linecap="round"/>
      <circle cx="96" cy="104" r="84" fill="#f9c935"/><circle cx="96" cy="104" r="62" fill="none" stroke="#e8a92f" stroke-width="7" stroke-dasharray="300 40" stroke-linecap="round" transform="rotate(-60 96 104)"/>
      <path d="M96 62 v84 M118 82 c0 -12 -10 -18 -22 -18 c-13 0 -22 7 -22 18 c0 24 46 14 46 38 c0 12 -10 19 -24 19 c-13 0 -24 -7 -24 -19" fill="none" stroke="#e3a32b" stroke-width="9" stroke-linecap="round"/>
      <ellipse cx="62" cy="58" rx="16" ry="9" fill="#fff" opacity=".35" transform="rotate(-35 62 58)"/></svg>
    <div class="cp-plus">+${n}</div>${sp(-6, 4, 34, 0)}${sp(60, -16, 22, .25)}${sp(2, 80, 26, .45)}${sp(90, 74, 20, .15)}${sp(46, -14, 16, .35)}${sp(-16, 46, 16, .6)}</div>
    ${why ? `<div class="cp-why">${esc(why)}</div>` : ''}`;
  document.body.appendChild(el); navigator.vibrate && navigator.vibrate([30, 60, 30]);
  setTimeout(() => el.classList.add('out'), 1900); setTimeout(() => el.remove(), 2400); }
function earnCoin(n = 1) { const g = gLoad(), left = COIN_CAP - (g.coinsToday || 0); n = Math.min(n, left); if (n <= 0) return 0; g.coins += n; g.coinsToday = (g.coinsToday || 0) + n; gSave(g); return n; } // 1 coin per price log, 2 for adding a new product
// golden coin (drawn, so it looks the same on every phone)
const COIN_SVG = '<svg class="coin" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10.5" fill="#f5b70a" stroke="#a86b00" stroke-width="2"/><circle cx="12" cy="12" r="7" fill="#ffd54a" stroke="#d99a00" stroke-width="1.5"/><path d="M12.00 7.40 L13.18 10.38 L16.37 10.58 L13.90 12.62 L14.70 15.72 L12.00 14.00 L9.30 15.72 L10.10 12.62 L7.63 10.58 L10.82 10.38z" fill="#e8a200"/><path d="M7 6 q2 -2 4.5 -2.3" stroke="#fff6c8" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
const cn = s => String(s).replace(/🪙/g, COIN_SVG);
// app icon follows the puppy's colour (favicon, home-screen icon, install manifest)
function setAppIcon(c) { const s = c === 'white' || c === 'brown' ? '-' + c : '';
  const set = (rel, href) => { let l = document.querySelector(`link[rel="${rel}"]`); if (!l) { l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); } if (l.getAttribute('href') !== href) l.setAttribute('href', href); };
  set('icon', `icon${s}-192.png`); set('apple-touch-icon', `icon${s}-192.png`); set('manifest', `manifest${s}.webmanifest`); }
const treatsLeft = g => (g.free || 0) + (g.bonus || 0);
// water gets dirtier over time: level 0 (fresh) .. 5; at level 4+ (12 h) the puppy won't drink and gets thirsty
const waterLevel = g => Math.min(5, Math.floor(H(g.waterAt) / 3));
function gMood(g) {
  if (g.shelter) return 'shelter';
  if (isSick(g)) return 'sick';
  if (!g.lastFed || H(g.lastFed) >= hungerH(g)) return 'weak';
  if (waterLevel(g) >= 4) return 'thirsty';
  if ((g.poos || []).length) return 'dirty';
  if (baseJoy(g) < 15) return 'grumpy';
  if (!g.lastVisit || H(g.lastVisit) * 60 >= 10) return 'waking';
  return 'idle';
}
const clamp = x => Math.max(0, Math.min(100, Math.round(x)));
const fullness = g => g.lastFed ? clamp(100 - H(g.lastFed) / emptyH(g) * 100) : 0; // one meal fills the puppy up
// happiness: a stored level that fades about 6 points an hour; care adds a little at a time
const JOY_DECAY = 6; // 5.5: was 12, puppies were sad every morning
const baseJoy = g => clamp((g.joyV == null ? 60 : g.joyV) - H(g.joyAt) * JOY_DECAY * (g.pup && g.pup.per === 'independent' ? .75 : 1));
const joy = g => clamp(baseJoy(g) - (g.poos || []).length * 20 - (waterLevel(g) >= 4 ? 20 : 0) - (isSick(g) ? 15 : 0));
function addJoy(g, n) { g.joyV = Math.min(100, baseJoy(g) + n); g.joyAt = Date.now(); }
// bond (affection) level: earned by daily care; each kind of care has a daily cap
const XP = { visit: [5, 5], feed: [3, 9], water: [2, 4], toy: [4, 16], pet: [1, 10], poo: [2, 6] };
function addXp(g, kind) { const [n, cap] = XP[kind] || [0, 0]; const used = g.xpLog[kind] || 0; if (used >= cap) return false; const before = bondOf(g).L; g.xpLog[kind] = used + n; g.xp = (g.xp || 0) + n; return bondOf(g).L > before; }
function bondOf(g) { let x = g.xp || 0, L = 1, need = 40; while (x >= need) { x -= need; L++; need += 20; } return { L, cur: x, need }; }
const waterPct = g => clamp(100 - H(g.waterAt) / 12 * 100);

// poo: about 3 hours after a meal the puppy poos once (max 3 piles); piles stay until the user cleans them
const POO_H = 3, POO_MAX = 3;
function potty(g, k) { // one toilet trip while nobody is watching: trained (or lucky) pups use the pad
  const sk = skill(g, 'toilet'), full = (g.padUses || 0) >= 4;
  if (!full && Math.random() < (sk >= TOILET_OK ? .97 : sk / 150)) { g.padUses = (g.padUses || 0) + 1; return 'pad'; }
  if (g.poos.length < POO_MAX + 2) g.poos.push({ x: [8, 18, 28, 58, 66, 74][Math.floor(Math.random() * 6)] + Math.round(Math.random() * 4), t: Date.now(), k }); return 'floor'; }
function gPoo(g) {
  g.poos = g.poos || []; let ch = false;
  const watching = Date.now() - (window.__gTick || 0) < 15e3;
  if (g.pup && !watching && autoEat(g)) ch = true;
  if (g.pup && !g.pendingPee) { nextPee(g); ch = true; }
  for (const [key, k] of [['pendingPoo', 'poo'], ['pendingPee', 'pee']]) { const due = g[key]; if (!due || Date.now() < due) continue;
    if (watching && Date.now() - due < 3 * 60e3) continue; // the home screen shows the signal so you can help
    potty(g, k); g[key] = 0; if (k === 'pee') nextPee(g, due); ch = true; }
  if (ch) lsSet(GKEY, JSON.stringify(g));
  return g;
}
// shop and toys (each toy lasts 10 plays)
const TOY_LIFE = 10;
const SHOP = [
  { id: 'treat1', kind: 'treat', n: 1, price: 1 },
  { id: 'ball', kind: 'toy', price: 5 }, { id: 'rope', kind: 'toy', price: 8 }, { id: 'chew', kind: 'toy', price: 6 }
];
// ---------- item drawings (same line style as the puppy) ----------
const INK = '#15151a';
const toySvg = (type, old) => {
  const f = old ? 'filter="url(#oldtoy)"' : '';
  const defs = old ? '<defs><filter id="oldtoy"><feColorMatrix type="saturate" values=".15"/></filter></defs>' : '';
  if (type === 'ball') return `<svg viewBox="0 0 60 60" class="toy" aria-hidden="true">${defs}<g ${f}><circle cx="30" cy="30" r="24" fill="#ff5a4a" stroke="${INK}" stroke-width="5"/><path d="M8 26 q22 10 44 0" stroke="${INK}" stroke-width="4" fill="#fff4dc"/><path d="M8 26 q22 10 44 0 q-22 -6 -44 0z" fill="#fff4dc"/><circle cx="22" cy="18" r="4" fill="#fff" opacity=".7"/></g></svg>`;
  if (type === 'rope') return `<svg viewBox="0 0 80 40" class="toy" aria-hidden="true">${defs}<g ${f}><path d="M16 20 h48" stroke="${INK}" stroke-width="14" stroke-linecap="round"/><path d="M16 20 h48" stroke="#f2a65a" stroke-width="7" stroke-linecap="round" stroke-dasharray="6 5"/><circle cx="12" cy="20" r="10" fill="#4fa3e0" stroke="${INK}" stroke-width="4"/><circle cx="68" cy="20" r="10" fill="#4fa3e0" stroke="${INK}" stroke-width="4"/></g></svg>`;
  return `<svg viewBox="0 0 80 40" class="toy" aria-hidden="true">${defs}<g ${f}>${boneSvg(80, 40, '#7cc9a0')}<path d="M30 14 v12M40 14 v12M50 14 v12" stroke="#4f9e78" stroke-width="3" stroke-linecap="round"/></g></svg>`;
};
// a bone: four round knobs joined by a bar (outline first, then the fill on top so no inner lines show)
function boneSvg(w, h, fill) { const r = h * .22, x1 = r + 4, x2 = w - r - 4, y1 = h / 2 - r * .8, y2 = h / 2 + r * .8, bar = `<rect x="${x1}" y="${h / 2 - r * .75}" width="${x2 - x1}" height="${r * 1.5}"/>`, knobs = [[x1, y1], [x1, y2], [x2, y1], [x2, y2]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('');
  return `<g fill="${fill}" stroke="${INK}" stroke-width="7">${bar}${knobs}</g><g fill="${fill}">${bar}${knobs}</g>`; }
const treatSvg = () => `<svg viewBox="0 0 60 40" class="toy" aria-hidden="true">${boneSvg(60, 40, '#e9b872')}</svg>`;
const WATER_COL = ['#6fc8ff', '#8ccbd6', '#a5c69a', '#b4ad74', '#927d4a', '#6e5733'];
function waterSvg(level) {
  const specks = Array.from({ length: level * 2 }, (_, i) => `<circle cx="${16 + (i * 13) % 30}" cy="${17 + (i % 3)}" r="${1.4 + (i % 2)}" fill="#4a3a22" opacity=".8"/>`).join('');
  const leaf = level >= 3 ? `<path d="M34 15 q6 -6 10 0 q-6 4 -10 0z" fill="#6a8a3a" stroke="${INK}" stroke-width="1.5"/>` : '';
  return `<svg viewBox="0 0 60 34" class="waterbowl" aria-hidden="true"><path d="M4 14 h52 l-6 16 h-40z" fill="#4f8fd6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <ellipse cx="30" cy="14" rx="26" ry="6" fill="${WATER_COL[level]}" stroke="${INK}" stroke-width="3"/>${specks}${leaf}
    ${level === 0 ? '<path d="M14 12 q5 -2 10 0" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>' : ''}</svg>`;
}
// ---------- Style B: clean line art (bold rounded lines, flat colours, simple dot eyes) ----------
const PUP_COLORS = {
  black: { fur: '#35353e', ear: '#24242b', face: '#575763', earHi: '#4a4a56' },
  white: { fur: '#f7f3ec', ear: '#e6dccb', face: '#ffffff', earHi: '#fffaf3' },
  brown: { fur: '#c98a4b', ear: '#9a5f2c', face: '#ecc896', earHi: '#ddaa72' }
};
var pupColor = (() => { try { return (JSON.parse(lsGet(GKEY) || '{}').pup || {}).color || 'black'; } catch (e) { return 'black'; } })();
// collars (shop item): collar colour + tag colour
const COLLAR_COLS = { blue: '#2f6fdc', red: '#e0453a', pink: '#ff7fb0', green: '#2fa36b', purple: '#8a5cd6', yellow: '#f2c230', black: '#2a2a30' };
const TAG_COLS = { gold: '#f5b70a', silver: '#c9ced6', green: '#2fa36b', red: '#e0453a', blue: '#3d8bfd' };
var pupCollar = (() => { try { return JSON.parse(lsGet(GKEY) || '{}').wear || null; } catch (e) { return null; } })();
const collarSvg = cl => { const c = COLLAR_COLS[cl.c] || COLLAR_COLS.blue, t = TAG_COLS[cl.t] || TAG_COLS.gold, ink = '#15151a', hi = cl.t === 'silver' || cl.t === 'gold' ? '#fff8e0' : '#e9fff2';
  return `<path d="M90 140 q30 12 60 0" stroke="${ink}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M90 140 q30 12 60 0" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round"/><circle cx="120" cy="155" r="8.5" fill="${t}" stroke="${ink}" stroke-width="4"/><circle cx="120" cy="157.5" r="2.6" fill="${hi}"/><circle cx="116.3" cy="153" r="1.4" fill="${hi}"/><circle cx="120" cy="151.5" r="1.4" fill="${hi}"/><circle cx="123.7" cy="153" r="1.4" fill="${hi}"/>`; };

// food bowl (one drawing everywhere): rounded dog bowl, rim, kibble; level 2 = full mound, 1 = half, 0 = empty
function bowlSvg(cx, y, w, level = 2, part = 'all', ryK = .13) { // part: 'back' (rim + food, behind the head) | 'front' (bowl body + front lip) | 'all'
  const ink = '#15151a', h = w * .3, rx = w / 2, ry = w * ryK, k = [];
  const seed = [[-.32, .1], [-.18, -.05], [-.04, .12], [.1, -.04], [.24, .1], [.34, -.02], [-.26, -.18], [-.1, -.22], [.06, -.2], [.2, -.17], [-.02, -.36], [.13, -.32], [-.16, -.33]];
  const n = level >= 2 ? seed.length : level === 1 ? 6 : 0, lift = level >= 2 ? ry * .35 : 0;
  for (let i = 0; i < n; i++) { const [a, b] = seed[i]; const x = cx + a * w, yy = y + (level >= 2 ? b * ry * 2.6 - lift : b * ry * 1.6 + ry * .2);
    k.push(`<ellipse cx="${x.toFixed(1)}" cy="${yy.toFixed(1)}" rx="${(w * .055).toFixed(1)}" ry="${(w * .045).toFixed(1)}" fill="${i % 3 ? '#b8743a' : '#9a5a2a'}" stroke="${ink}" stroke-width="${(w * .02).toFixed(1)}"/>`); }
  const mound = level >= 2 ? `<path d="M${cx - rx * .8} ${y} Q${cx} ${y - ry * 2.6} ${cx + rx * .8} ${y} Z" fill="#c98a4b" stroke="${ink}" stroke-width="${(w * .03).toFixed(1)}" stroke-linejoin="round"/>` : '';
  const sw = (w * .045).toFixed(1);
  const hb = Math.max(h, ry * 1.6); const body = `<path d="M${cx - rx} ${y} C${cx - rx} ${y + hb * .6} ${cx - rx * .82} ${y + hb} ${cx - rx * .7} ${y + hb} L${cx + rx * .7} ${y + hb} C${cx + rx * .82} ${y + hb} ${cx + rx} ${y + hb * .6} ${cx + rx} ${y} A${rx} ${ry} 0 0 1 ${cx - rx} ${y} Z" fill="#ff7a59" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>
    <path d="M${cx - rx * .78} ${y + hb} h${rx * 1.56}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round"/>
    <path d="M${cx - rx * .8} ${y + ry + (hb - ry) * .2} q${rx * .1} ${(hb - ry) * .45} ${rx * .35} ${(hb - ry) * .55}" stroke="#ffd0c0" stroke-width="${(w * .035).toFixed(1)}" fill="none" stroke-linecap="round"/>
    <g transform="translate(${cx + rx * .32} ${y + ry + (hb - ry) * .5}) scale(${(w / 70).toFixed(3)})" fill="#ffd0c0"><circle r="4.2"/><circle cx="-5" cy="-5" r="2"/><circle cx="0" cy="-7.5" r="2"/><circle cx="5" cy="-5" r="2"/></g>`;
  const back = `<ellipse cx="${cx}" cy="${y}" rx="${rx}" ry="${ry}" fill="#c9463a" stroke="${ink}" stroke-width="${sw}"/>
    <ellipse cx="${cx}" cy="${y + ry * .25}" rx="${rx * .82}" ry="${ry * .62}" fill="#8f2f26"/>${mound}${k.join('')}`;
  // the near half of the rim, drawn over the head when the puppy has its nose in the bowl
  const lip = `<path d="M${cx - rx} ${y} A${rx} ${ry} 0 0 0 ${cx + rx} ${y} L${cx + rx * .82} ${y + ry * .25} A${rx * .82} ${ry * .62} 0 0 1 ${cx - rx * .82} ${y + ry * .25} Z" fill="#c9463a" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  return `<g class="fbowl">${part === 'back' ? back : part === 'front' ? body + lip : body + back}</g>`;
}
function regenB(pose, expr, color, collar) {
  if (collar === undefined) collar = color ? null : pupCollar;
  if (pose === 'eat') collar = null; // face is inside the bowl: the collar tag would poke out under it // the garden puppy wears its collar; shop/adoption pictures don't
  const pc = PUP_COLORS[color || pupColor] || PUP_COLORS.black;
  const ink = '#15151a', fur = pc.fur, ear = pc.ear, face = pc.face, W = 6;
  const L = (d, f = 'none', w = W) => `<path d="${d}" fill="${f}" stroke="${ink}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const eye = (x, y) => {
    if (expr === 'happy' || expr === 'super' || expr === 'eat' || expr === 'tug') return L(`M${x - 8} ${y + 2} q8 -10 16 0`, 'none', 5);
    if (expr === 'dead') return L(`M${x - 7} ${y - 7} l14 14 M${x + 7} ${y - 7} l-14 14`, 'none', 5);
    if (expr === 'strain') return x < 120 ? L(`M${x - 8} ${y - 7} l14 7 l-14 7`, 'none', 5) : L(`M${x + 8} ${y - 7} l-14 7 l14 7`, 'none', 5);
    if (expr === 'sleep' || expr === 'eatdown' || expr === 'sick') return L(`M${x - 8} ${y} q8 7 16 0`, 'none', 5);
    if (expr === 'grumpy') return L(`M${x - 8} ${y} h16`, 'none', 5);
    return `<g class="eye"><circle cx="${x}" cy="${y}" r="7" fill="${ink}"/><circle cx="${x + 2.5}" cy="${y - 2.5}" r="2.4" fill="#fff"/></g>` + (expr === 'sad' ? `<path d="M${x} ${y + 11} q-3 6 0 9 q3 -3 0 -9z" fill="#8fd0ff"/>` : '');
  };
  const mouth = {
    open: L('M108 124 q6 6 12 0 q6 6 12 0', 'none', 4.5),
    happy: L('M106 122 q7 7 14 0 q7 7 14 0', 'none', 4.5) + `<path d="M113 127 q7 14 14 0 z" fill="#ff7a59" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    super: L('M104 121 q8 8 16 0 q8 8 16 0', 'none', 4.5) + `<path d="M112 127 q8 16 16 0 z" fill="#ff7a59" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    eat: `<ellipse cx="120" cy="127" rx="7" ry="5" fill="${ink}"/>`,
    thirsty: L('M106 122 q7 7 14 0 q7 7 14 0', 'none', 4.5) + `<path d="M112 126 q8 30 16 0 z" fill="#ff7a59" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/><path d="M120 130 v12" stroke="#d9583d" stroke-width="2.5" stroke-linecap="round"/>`,
    tug: L('M106 124 q14 5 28 0', 'none', 5) + `<path d="M110 124 l3 5 l3 -4 l4 5 l4 -5 l3 4 l3 -5" fill="#fff" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`,
    dead: L('M108 124 q12 6 24 0', 'none', 4.5) + `<path d="M124 126 q4 18 12 12 q4 -4 0 -14 z" fill="#ff7a59" stroke="${ink}" stroke-width="3.5" stroke-linejoin="round"/>`,
    sick: L('M108 131 q6 -6 12 0 q6 6 12 0', 'none', 4.5),
    strain: L('M104 123 q16 -5 32 0', 'none', 5) + `<path d="M107 123 l3 6 l3 -5 l4 6 l4 -6 l4 6 l4 -6 l3 5 l3 -6" fill="#fff" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`,
    eatdown: '', sad: L('M110 130 q10 -8 20 0', 'none', 4.5), sleep: L('M114 126 q6 3 12 0', 'none', 4), grumpy: L('M110 128 h20', 'none', 4.5)
  }[expr];
  const head = (tx = 0, ty = 0, rot = 0, s = 1) => `<g class="hd" transform="translate(${tx} ${ty}) rotate(${rot} 120 100) translate(120 100) scale(${s}) translate(-120 -100)"><g class="hdi">
    ${L('M120 46 C156 46 172 70 172 98 C172 128 150 144 120 144 C90 144 68 128 68 98 C68 70 84 46 120 46 Z', fur)}
    <ellipse cx="120" cy="118" rx="27" ry="20" fill="${face}"/>
    <g class="earL">${L('M100 48 C90 31 70 28 57 36 C44 44 37 62 39 81 C41 93 52 97 59 87 C66 78 72 69 82 62 C90 58 97 55 100 48 Z', ear, 5.5)}<path d="M95 44 C85 35 70 33 59 41" stroke="${pc.earHi}" stroke-width="5" fill="none" stroke-linecap="round"/></g>
    <g class="earR">${L('M140 48 C150 31 170 28 183 36 C196 44 203 62 201 81 C199 93 188 97 181 87 C174 78 168 69 158 62 C150 58 143 55 140 48 Z', ear, 5.5)}<path d="M145 44 C155 35 170 33 181 41" stroke="${pc.earHi}" stroke-width="5" fill="none" stroke-linecap="round"/></g>

    ${eye(96, 94)}${eye(144, 94)}
    <ellipse cx="84" cy="114" rx="8" ry="5" fill="#ff8fa3" opacity=".5"/><ellipse cx="156" cy="114" rx="8" ry="5" fill="#ff8fa3" opacity=".5"/>
    <path d="M111 108 q9 -6 18 0 q-2 8 -9 9 q-7 -1 -9 -9z" fill="${ink}"/><circle cx="116" cy="108" r="2" fill="#fff" opacity=".8"/>
    ${expr === 'sad' || expr === 'thirsty' || expr === 'sick' ? L('M86 78 l12 -4M154 78 l-12 -4', 'none', 4.5) : ''}${expr === 'strain' ? L('M84 74 l14 6M156 74 l-14 6', 'none', 5) : ''}${expr === 'sick' ? '<ellipse cx="84" cy="114" rx="10" ry="6" fill="#ff5a5a" opacity=".45"/><ellipse cx="156" cy="114" rx="10" ry="6" fill="#ff5a5a" opacity=".45"/>' : ''}${expr === 'thirsty' ? '<path d="M170 66 q-7 11 0 15 q7 -4 0 -15z" fill="#8fd0ff" stroke="#15151a" stroke-width="2.5"/>' : ''}${mouth}
    ${collar ? collarSvg(collar) : ''}</g></g>`;
  const tail = d => `<g class="tail">${L(d, 'none', 14)}<path d="${d}" stroke="${fur}" stroke-width="6" fill="none" stroke-linecap="round"/></g>`;
  const shadow = `<ellipse cx="120" cy="222" rx="60" ry="6" fill="rgba(60,40,20,.14)"/>`;
  let body = '', hd = head(), front = '';
  const FOOD = '<path d="M96 203 q6 -7 12 0 M116 202 q6 -7 12 0 M134 203 q6 -6 10 0" fill="#e9b872" stroke="#15151a" stroke-width="3"/>', FOOD2 = '<path d="M82 198 q6 -8 12 0 M146 198 q6 -8 12 0 M158 197 q4 -6 8 0" fill="#e9b872" stroke="#15151a" stroke-width="3"/>';
  let lean = '', out = '';
  const leg = d => L(d, 'none', 14) + `<path d="${d}" stroke="${fur}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  if (pose === 'paw') { // sit and give a paw
    body = shadow + tail('M152 196 C174 194 180 176 174 160') + L('M98 118 C86 146 80 190 84 216 L156 216 C160 190 154 146 142 118 Z', fur) +
      L('M106 176 L106 214', 'none', 5) + L('M84 216 h72', 'none', 6);
    front = leg('M130 176 C140 172 146 166 150 160') + `<g transform="translate(152 156)"><circle r="21" fill="${fur}" stroke="${ink}" stroke-width="5"/><ellipse cx="0" cy="5" rx="9" ry="7.5" fill="#ff9fb2" stroke="${ink}" stroke-width="2.5"/><circle cx="-10" cy="-7" r="4" fill="#ff9fb2" stroke="${ink}" stroke-width="2"/><circle cx="-3" cy="-12" r="4" fill="#ff9fb2" stroke="${ink}" stroke-width="2"/><circle cx="5" cy="-12" r="4" fill="#ff9fb2" stroke="${ink}" stroke-width="2"/><circle cx="12" cy="-7" r="4" fill="#ff9fb2" stroke="${ink}" stroke-width="2"/></g>`;
    hd = head(0, 0, -8, 1);
  } else if (pose === 'beg') { // up on the hind legs, front view: paws held up in front of the chest, drooping at the wrist
    const mitt = (x, flip) => `<g transform="translate(${x} -40) scale(${flip ? -1.3 : 1.3} 1.3)"><path d="M-12 144 C-16 156 -14 168 -8 176 C-4 184 8 186 12 178 C16 170 12 160 6 150 Z" fill="${fur}" stroke="${ink}" stroke-width="4.5" stroke-linejoin="round"/><path d="M-4 181 v-5 M3 182 v-6" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></g>`;
    body = shadow + tail('M150 206 C172 204 178 188 172 174') + L('M98 96 C84 132 84 186 92 214 L148 214 C156 186 156 132 142 96 Z', fur) +
      `<ellipse cx="104" cy="214" rx="14" ry="6.5" fill="${fur}" stroke="${ink}" stroke-width="4.5"/><ellipse cx="136" cy="214" rx="14" ry="6.5" fill="${fur}" stroke="${ink}" stroke-width="4.5"/>`;
    front = mitt(104, false) + mitt(136, true);
    hd = head(0, -30, 0, 1);
  } else if (pose === 'bow') { // play bow, 3/4 view: head low in front, front paws stretched out, bottom and tail up behind
    const paw = (x, y, r = 0, f = fur) => `<g transform="translate(${x} ${y}) rotate(${r})"><ellipse rx="15" ry="9" fill="${f}" stroke="${ink}" stroke-width="4.5"/><path d="M-5 -2 v6 M2 -3 v7 M9 -2 v5" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/></g>`;
    const farLeg = d => L(d, 'none', 14) + `<path d="${d}" stroke="${ear}" stroke-width="6" fill="none" stroke-linecap="round"/>`; // the far hind leg: behind the body, a shade darker
    body = shadow + tail('M194 104 C204 80 200 58 186 46') + farLeg('M170 170 L164 210') + `<ellipse cx="162" cy="211" rx="12" ry="6.5" fill="${ear}" stroke="${ink}" stroke-width="4"/>` +
      leg('M198 160 L203 210') + L('M96 168 C104 124 146 96 178 96 C206 96 216 122 212 152 C206 170 186 180 162 184 C140 188 108 186 96 168 Z', fur) +
      leg('M90 178 C76 190 62 198 50 204') + leg('M124 184 C126 194 128 202 130 208');
    front = paw(44, 206, -12) + paw(132, 212, 4) + `<ellipse cx="205" cy="212" rx="14" ry="8" fill="${fur}" stroke="${ink}" stroke-width="4.5"/>`;
    hd = head(-18, 46, -4, .9);
  } else if (pose === 'roll' || pose === 'dead') { // on its back, legs up
    body = shadow + tail('M176 204 C196 208 206 198 204 186') +
      L('M74 206 C70 176 110 166 140 166 C170 166 186 180 184 202 C182 216 80 218 74 206 Z', fur) + `<ellipse cx="132" cy="190" rx="34" ry="12" fill="${face}"/>` +
      leg('M104 172 L96 146') + leg('M124 168 L122 140') + leg('M150 168 L156 142') + leg('M170 176 L184 154');
    hd = head(-62, 74, pose === 'dead' ? -100 : -80, .78);
  } else if (pose === 'squat') { // toilet: crouched, tail up
    body = shadow + tail('M154 178 C176 166 182 146 172 128') + L('M96 132 C82 156 78 196 84 216 L158 216 C164 196 158 156 144 132 Z', fur) +
      L('M104 186 L102 214', 'none', 5) + L('M136 186 L138 214', 'none', 5) + L('M80 216 h80', 'none', 6);
    hd = head(0, 16, 0, .96);
  } else if (pose === 'pull') { // tug of war: leaning back, front paws braced towards the rope
    body = tail('M92 196 C70 194 62 178 68 162') +
      L('M98 118 C86 146 80 190 84 216 L150 216 C156 190 152 146 140 118 Z', fur) +
      L('M84 216 h66', 'none', 6) + L('M126 176 L156 214', 'none', 9) + L('M110 180 L136 216', 'none', 9);
    hd = head(-6, 6, 4, .95); lean = 'transform="rotate(-10 100 216)"'; out = shadow;
  } else if (pose === 'sit' || pose === 'eatup') {
    body = shadow + tail('M152 196 C174 194 180 176 174 160') +
      L('M98 118 C86 146 80 190 84 216 L156 216 C160 190 154 146 142 118 Z', fur) +
      L('M106 176 L106 214', 'none', 5) + L('M134 176 L134 214', 'none', 5) + L('M84 216 h72', 'none', 6);
    if (pose === 'eatup') { body += bowlSvg(120, 200, 84, 2); hd = head(0, 38, 12, .92); }
  } else if (pose === 'eat' || pose === 'drink' || pose === 'nose') { // head down in the bowl: we see his back and the top of his head
    body = shadow + tail('M156 170 C178 160 184 140 176 124') + L('M74 214 C70 160 94 118 120 118 C146 118 170 160 166 214 Z', fur) + L('M88 196 L86 218', 'none', 8) + L('M152 196 L154 218', 'none', 8);
    hd = pose === 'eat' ? head(0, 76, 0, .8) : head(0, 76, 0, .8); // eating: head low over the bowl, chin just above the food
        if (pose === 'eat') body += bowlSvg(120, 198, 104, 1, 'back');
    front = pose === 'nose' ? '' : pose === 'eat' ? bowlSvg(120, 198, 104, 1, 'front') : `<ellipse cx="120" cy="199" rx="44" ry="5" fill="#6fc8ff" stroke="${ink}" stroke-width="3"/>` + L('M74 198 h92 l-11 24 h-70z', '#4f8fd6', 5);
  } else if (pose === 'run' || pose === 'run2') {
    // base: the version Silver picked (big head front-left, round body behind, chunky legs); body 10% bigger + a proper neck
    const big = x => `<g transform="translate(148 166) scale(1.1) translate(-148 -166)">${x}</g>`;
    const neck = `<path d="M74 118 C72 136 78 154 90 166 L124 158 C116 146 110 132 108 116 Z" fill="${fur}"/>` + L('M75 120 C73 138 78 152 87 162', 'none', 6);
    if (pose === 'run') { // running: legs stretched front and back
      body = shadow + tail('M196 158 C216 148 222 128 216 112') +
        L('M112 190 L84 212', 'none', 9) + L('M130 194 L116 216', 'none', 9) + L('M184 188 L208 208', 'none', 9) + L('M174 194 L184 216', 'none', 9) +
        big(L('M92 158 C96 136 128 128 160 132 C192 136 206 152 202 172 C198 190 176 198 146 198 C116 198 88 182 92 158 Z', fur)) + neck;
      hd = head(-28, -10, -6, .92);
    } else { // trotting: four short legs under the body
      body = shadow + tail('M196 158 C216 148 222 128 216 112') +
        L('M108 184 L104 216', 'none', 9) + L('M182 184 L186 216', 'none', 9) +
        big(L('M90 160 C92 138 124 130 156 132 C188 134 204 150 200 170 C196 188 174 196 146 196 C116 196 88 182 90 160 Z', fur)) +
        L('M126 192 L128 216', 'none', 9) + L('M164 192 L162 216', 'none', 9) + neck;
      hd = head(-30, -12, -4, .92);
    }
  } else {
    const sl = pose === 'sleep';
    body = shadow + tail('M180 208 C202 206 206 194 202 182') +
      L('M72 216 C66 188 98 170 134 170 C170 170 192 186 192 206 C192 214 186 218 172 218 L82 218 C76 218 72 218 72 216 Z', fur) +
      L('M84 218 h40', 'none', 6) + L('M158 196 q10 8 8 22', 'none', 5);
    hd = head(-14, sl ? 58 : 42, sl ? -8 : 0, sl ? .9 : .95);
  }
  if (expr === 'sick' && pose === 'lie') front += `<g transform="translate(104 92) rotate(-12)"><path d="M-30 6 C-30 -10 30 -10 30 6 C30 14 -30 14 -30 6Z" fill="#9fd8ff" stroke="${ink}" stroke-width="4"/><path d="M-6 -6 L0 -18 L6 -6" fill="#9fd8ff" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/><rect x="-5" y="-22" width="10" height="7" rx="2" fill="#ff7a59" stroke="${ink}" stroke-width="3"/><path d="M-18 2 q6 -4 12 0" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/></g><g transform="translate(118 162) rotate(28)"><rect x="0" y="-4" width="40" height="8" rx="4" fill="#fff" stroke="${ink}" stroke-width="3"/><rect x="2" y="-1.5" width="22" height="3" rx="1.5" fill="#e53935"/><circle cx="2" cy="0" r="5" fill="#e53935" stroke="${ink}" stroke-width="3"/></g><path d="M176 112 q-6 9 0 13 q6 -4 0 -13z" fill="#8fd0ff" stroke="${ink}" stroke-width="2.5"/>`;
  return `<svg class="regen" viewBox="0 0 240 240" aria-hidden="true">${out}<g class="rgAll" ${lean}><g class="bd">${body}</g>${hd}${front}</g></svg>`;
}
// poo (same in both styles, cute not gross)
const pooSvg = (ink = '#141418') => `<svg viewBox="0 0 60 50" class="poo" aria-hidden="true"><path d="M8 44 C2 44 2 34 10 33 C6 26 14 20 20 23 C18 14 30 8 34 16 C42 14 46 22 42 27 C50 28 52 38 46 40 C54 44 50 48 44 48 L12 48 C9 48 8 46 8 44 Z" fill="#8a5a33" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/><path d="M14 36 q8 4 18 0M20 26 q6 3 12 0" stroke="#b07b4f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M14 8 q-4 -4 0 -8M28 6 q-4 -4 0 -8M42 8 q-4 -4 0 -8" stroke="#8aa36a" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`;
// garden poses -> drawing: sit | lie | sleep | walk | run | eat ; expressions: open | happy | super | sad | sleep | eat | grumpy
function regenSvg(pose, expr, color) { return regenB({ walk: 'run2', stand: 'run2' }[pose] || pose, expr === 'yawn' ? 'sleep' : expr, color); }
// the user's own puppy: colour and name chosen on the first visit
const pupName = () => ((gLoad().pup || {}).name || 'Regen');
const withName = s => s.replace(/Regen/g, pupName());
/* ---------- weather + Calgary day/night ---------- */
const WX = {
  0: ['☀️', '晴', 'Clear'], 1: ['🌤️', '大致晴', 'Mostly clear'], 2: ['⛅', '間中有雲', 'Partly cloudy'], 3: ['☁️', '多雲', 'Cloudy'],
  45: ['🌫️', '有霧', 'Fog'], 48: ['🌫️', '霧凇', 'Freezing fog'], 51: ['🌦️', '毛毛雨', 'Drizzle'], 53: ['🌦️', '毛毛雨', 'Drizzle'], 55: ['🌧️', '密毛毛雨', 'Heavy drizzle'],
  56: ['🌧️', '凍毛毛雨', 'Freezing drizzle'], 57: ['🌧️', '凍毛毛雨', 'Freezing drizzle'], 61: ['🌧️', '小雨', 'Light rain'], 63: ['🌧️', '下雨', 'Rain'], 65: ['🌧️', '大雨', 'Heavy rain'],
  66: ['🌧️', '凍雨', 'Freezing rain'], 67: ['🌧️', '凍雨', 'Freezing rain'], 71: ['🌨️', '小雪', 'Light snow'], 73: ['🌨️', '落雪', 'Snow'], 75: ['❄️', '大雪', 'Heavy snow'], 77: ['🌨️', '雪粒', 'Snow grains'],
  80: ['🌦️', '驟雨', 'Showers'], 81: ['🌧️', '驟雨', 'Showers'], 82: ['⛈️', '大驟雨', 'Heavy showers'], 85: ['🌨️', '驟雪', 'Snow showers'], 86: ['❄️', '大驟雪', 'Heavy snow showers'],
  95: ['⛈️', '雷暴', 'Thunderstorm'], 96: ['⛈️', '雷暴冰雹', 'Thunderstorm, hail'], 99: ['⛈️', '雷暴冰雹', 'Thunderstorm, hail']
};
async function calgaryWeather() {
  try { const c = JSON.parse(sessionStorage.getItem('pp_wx2') || 'null'); if (c && Date.now() - c.at < 10 * 60e3) return c.w; } catch (e) {}
  const r = await fetch('https://api.open-meteo.com/v1/forecast?latitude=51.0447&longitude=-114.0719&current=temperature_2m,apparent_temperature,weather_code,is_day&daily=sunrise,sunset&forecast_days=1&timezone=America%2FEdmonton', { signal: AbortSignal.timeout ? AbortSignal.timeout(8000) : undefined });
  const j = await r.json(), w = { ...j.current, sunrise: j.daily && j.daily.sunrise[0], sunset: j.daily && j.daily.sunset[0] };
  try { sessionStorage.setItem('pp_wx2', JSON.stringify({ at: Date.now(), w })); } catch (e) {}
  return w;
}
// Calgary local time as "YYYY-MM-DDTHH:MM" (same format Open-Meteo uses for sunrise/sunset)
function calgaryNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Edmonton', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
const tmin = s => { const m = /T(\d\d):(\d\d)/.exec(s || ''); return m ? +m[1] * 60 + +m[2] : null; };
function dayPhase(w) { // night | dawn | day | dusk, by Calgary's clock and today's sunrise/sunset
  const now = tmin(calgaryNow()), rise = tmin(w && w.sunrise) ?? 7 * 60 + 30, set = tmin(w && w.sunset) ?? 18 * 60 + 30;
  if (now < rise - 30 || now > set + 30) return 'night';
  if (now < rise + 40) return 'dawn';
  if (now > set - 40) return 'dusk';
  return 'day';
}
function sky(w) {
  const c = w ? w.weather_code : 0;
  const k = c >= 95 ? 'storm' : [71, 73, 75, 77, 85, 86].includes(c) ? 'snow' : (c >= 51 && c <= 82) ? 'rain' : c === 45 || c === 48 ? 'fog' : c >= 2 ? 'cloudy' : 'clear';
  return `${dayPhase(w)} ${k}`;
}

let gBusy = false, gLastPet = -1;
const PET = [
  { a: 'r-jump', e: 'super', fx: '❤️💕❤️' }, { a: 'r-spin', e: 'super', fx: '✨⭐✨' }, { a: 'r-roll', e: 'happy', fx: '💕💗', pose: 'lie' },
  { a: 'r-wiggle', e: 'happy', fx: '🎵🎶' }, { a: 'r-bow', e: 'open', fx: '🎾' }, { a: 'r-tilt', e: 'open', fx: '💗' },
  { a: 'r-zoom', e: 'super', fx: '💨✨', pose: 'run' }, { a: 'r-jump', e: 'happy', fx: '💖🌟' }
];
const EAT_MS = 60e3, CHEW_MS = 30 * 60e3;
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
async function viewGarden() {
  let g = await gSync();
  if (!g.pup || !g.pup.name) return viewAdopt();
  pupColor = g.pup.color || 'black'; setAppIcon(pupColor); pupCollar = g.wear || null;
  if (onVacation(g)) return viewHotel();
  if (g.vac) { const back = g.vac.until; delete g.vac; g.lastFed = Math.max(g.lastFed || 0, back); g.waterAt = Math.max(g.waterAt || 0, back); g.poos = []; g.pendingPoo = 0; g.lastVisit = Math.max(g.lastVisit || 0, back); } // home from the pet hotel: fed and clean
  shelterCheck(g); if (g.shelter) { gSave(g); return viewShelter(); }
  setHeader(`${g.pup.name}'s home`, true); setTab('home');
  const mood0 = gMood(g);
  g.lastVisit = Date.now(); const lvUpVisit = addXp(g, 'visit'); gSave(g);
  app.innerHTML = `
    <div class="garden big indoor day clear" id="gScene">
      <div class="sky"><div class="stars">${Array.from({ length: 30 }, () => `<i style="left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 45).toFixed(1)}%;animation-delay:${(Math.random() * 3).toFixed(1)}s"></i>`).join('')}</div>
        <div class="sun"></div><div class="moon"></div><div class="cloud c1"></div><div class="cloud c2"></div><div class="cloud c3"></div><div class="fall"></div></div><div class="wbar"></div><i class="curt cl"></i><i class="curt cr"></i>
      <button class="door" id="gDoor" aria-label="Playground"><b>🌳 Playground</b></button><div class="nameplate">🐾 ${esc(g.pup.name.toUpperCase().slice(0, 10))}</div>
      <div class="wx" id="gWx">📍 Calgary</div>
      <div class="gneed hidden" id="gNeed"></div><button class="ginfo" id="gInfo" aria-label="About your puppy">i</button>
      <div class="gstats" id="gStats">
        <div class="gs"><span>🍖</span><i><b id="mFull"></b></i></div>
        <div class="gs"><span>💛</span><i><b id="mJoy"></b></i></div>
        <div class="gs"><span>💧</span><i><b id="mWater"></b></i></div>
        <div class="gs"><span>💗</span><i><b id="mBond"></b></i><em id="gLv"></em></div>
        <div class="gsline" id="gTreats"></div>
      </div>
      <div class="ground"></div><div class="lampw"></div>
      <svg class="bed" viewBox="0 0 110 44" aria-hidden="true"><path d="M4 30 C4 8 106 8 106 30 C106 42 4 42 4 30Z" fill="#e85d75" stroke="#15151a" stroke-width="3"/><ellipse cx="55" cy="28" rx="40" ry="9" fill="#ffd1dc" stroke="#15151a" stroke-width="2.5"/></svg>
      <div class="rug"></div><button class="pad" id="gPad" aria-label="Pee pad"></button><button class="foodbowl" id="gFoodBowl" aria-label="Food bowl"></button>
      <div id="gPoos"></div>
      <button class="bowlbtn" id="gBowl" aria-label="water"></button>
      <div class="pupwrap" id="gWrap"><div class="pflip" id="gFlip"><div class="pup" id="gPup"></div><div class="carry" id="gCarry"></div></div><div class="qbub hidden" id="gQ">?</div></div><button class="pottybtn hidden" id="gPotty">🚽 To the pad!</button><button class="pottybtn hidden" id="gReward">🦴 Reward</button>
      <div class="ballfly hidden" id="gBall">${toySvg('ball')}</div><div class="ballhand hidden" id="gHand">${toySvg('ball')}</div><div class="balltip hidden" id="gTip">${t('ballHint')}</div>
      <svg class="ropesvg hidden" id="gRope" aria-hidden="true"><path class="ro" id="gRopeO"/><path class="ri" id="gRopeI"/></svg><b class="ropeknot hidden" id="gKnot"></b>
      <div class="gtimer hidden" id="gTimer"></div>
      <div class="fx" id="gFx"></div>
    </div>
    <div class="gbtns">
      <button class="btn" id="gFeed">🥣<span>Food</span></button>
      <button class="btn sec" id="gWaterBtn">💧<span>${t('gWaterBtn')}</span></button>
      <button class="btn sec" id="gTrainBtn">🎓<span>Train</span></button>
      <button class="btn sec" id="gToyBtn">🎾<span>${t('gToyBtn')}</span></button>
      <button class="btn sec" id="gShopBtn">🛒<span>${t('gShopBtn')}</span></button>
    </div>
    <div class="ghint credit">Tap your puppy to pet it · ${t('gWxCredit')}</div>`;
  const pup = $('#gPup'), wrap = $('#gWrap'), carry = $('#gCarry');
  let state = mood0, grumpLeft = 2, night = false, walkT = null, timerT = null, play = null, pos = { x: 0, y: 0 }, eatPause = 0, petTimes = [], roaming = false, roamTok = 0;
  const vid = viewGarden._vid = (viewGarden._vid || 0) + 1; gBusy = false; // a fresh visit cancels anything left over from the last one
  const alive = () => viewGarden._vid === vid && !!$('#gPup');
  const stopWalk = () => { clearInterval(walkT); walkT = null; };
  const draw = (p, e, anim) => { if (p !== 'walk' && p !== 'run') stopWalk(); pup.innerHTML = regenSvg(p, e); pup.className = 'pup' + (anim ? ' ' + anim : ''); wrap.classList.toggle('turned', state === 'grumpy' && !play); };
  // walking / running: swap leg frames like a flip book
  const move = (e, anim, fast) => { stopWalk(); let f = 0; draw(fast ? 'run' : 'walk', e, anim); walkT = setInterval(() => { if (!alive()) return stopWalk(); f ^= 1; pup.innerHTML = regenSvg(f ? 'run' : 'walk', e); }, fast ? 140 : 260); };
  // where the puppy stands: x/y offset from his front spot (px), size, facing right?
  const place = (x, y, s, ms, right) => { pos = { x, y }; wrap.style.transition = `transform ${ms || 0}ms linear`; wrap.style.setProperty('--gx', x + 'px'); wrap.style.setProperty('--gy', y + 'px'); wrap.style.setProperty('--gs', s); $('#gFlip').classList.toggle('right', !!right); };
  const later = (ms, fn) => setTimeout(() => { if (alive()) fn(); }, ms);
  // garden geometry: the lawn runs from the hills (far, small) to the front (near, full size)
  const geo = () => { const sc = $('#gScene'), W = sc.clientWidth, SH = sc.clientHeight, gt = sc.querySelector('.ground').offsetTop; return { W, SH, homeX: W / 2 + 10, homeY: SH - 4, HZ: gt + 16 }; };
  const depth = (y, G = geo()) => .42 + .58 * Math.max(0, Math.min(1, (y - G.HZ) / (G.homeY - G.HZ)));
  const atHome = () => Math.abs(pos.x) < 4 && Math.abs(pos.y) < 4;
  // walk (or run) to a spot on the lawn given in garden coordinates (where his feet go)
  const goTo = (sx, sy, cb, fast, e) => { const G = geo(), x = sx - G.homeX, y = sy - G.homeY, d = Math.hypot(x - pos.x, y - pos.y);
    if (d < 6) { place(x, y, depth(sy, G), 0, false); cb && cb(); return; }
    const ms = Math.max(500, d / (fast ? .3 : .1)), right = x > pos.x, tok = roamTok; move(e || 'happy', 'wagfast', fast); place(x, y, depth(sy, G), ms, right);
    later(ms, () => { if (tok !== roamTok) return; place(x, y, depth(sy, G), 0, false); cb && cb(); }); return ms; };
  // stop whatever he's doing on his own (wandering, napping) right where he is, so you can play with him straight away
  const cancelRoam = () => { if (!roaming) return; roaming = false; roamTok++; stopWalk();
    const m = getComputedStyle(wrap).transform, v = m && m.startsWith('matrix(') ? m.slice(7, -1).split(',').map(Number) : null;
    if (v) place(v[4], v[5], v[0], 0, $('#gFlip').classList.contains('right')); draw('sit', 'open', ''); };
  const roam = fn => { roaming = true; fn(() => { roaming = false; }); };
  const comeHome = (cb, fast) => { if (atHome()) { place(0, 0, 1, 0, false); cb(); return; } const G = geo(); gBusy = true; goTo(G.homeX, G.homeY, cb, fast !== false); };
  const fx = (chars, n = 6, left) => { const box = $('#gFx'); if (!box) return; const G = geo(), px = left != null ? left : (G.homeX + pos.x) / G.W * 100, bottom = Math.max(60, (G.SH - (G.homeY + pos.y)) + 150 * depth(G.homeY + pos.y, G));
    const cs = [...chars].filter(c => c.trim()); cs.forEach((c, i) => { for (let k = 0; k < Math.ceil(n / cs.length); k++) { const s = document.createElement('span'); s.textContent = c; s.style.left = (px - 10 + Math.random() * 20) + '%'; s.style.bottom = bottom + 'px'; s.style.animationDelay = (i * .12 + k * .25) + 's'; s.style.fontSize = (16 + Math.random() * 14) + 'px'; box.appendChild(s); setTimeout(() => s.remove(), 2600); } }); };
  const timer = (label, until, done) => { clearInterval(timerT); const el = $('#gTimer'); el.classList.remove('hidden');
    const upd = () => { if (!alive()) return clearInterval(timerT); const left = until - Date.now(); if (left <= 0) { clearInterval(timerT); el.classList.add('hidden'); done && done(); return; } el.textContent = label + ' ' + mmss(left); };
    upd(); timerT = setInterval(upd, 1000); };
  const stopTimer = () => { clearInterval(timerT); $('#gTimer').classList.add('hidden'); };
  const bars = () => { g = gLoad(); const f = fullness(g), j = joy(g), w = waterPct(g), lv = waterLevel(g), b = bondOf(g);
    const set = (id, v, bad, col) => { const el = $('#' + id); el.style.width = v + '%'; el.style.background = bad ? 'var(--bad)' : col; };
    set('mFull', f, f < 25, 'var(--good)'); set('mJoy', j, j < 25, '#e8a020'); set('mWater', w, lv >= 4, '#3d9be0'); set('mBond', Math.round(b.cur / b.need * 100), false, '#ff6f91');
    $('#gLv').textContent = 'Lv ' + b.L;
    $('#gTreats').innerHTML = cn(tf('gTreatsMini', g.free || 0, FREE_TREATS, g.bonus || 0, g.coins || 0));
    $('#gBowl').innerHTML = waterSvg(lv);
    const need0 = !(g.bowl > 0) && fullness(g) < HUNGRY ? `🥣 ${g.pup.name} is hungry and the bowl is empty: tap Food` : (g.padUses || 0) >= 3 ? `🧻 The pee pad is dirty: tap it to change` : '';
    const fb0 = $('#gFoodBowl'); if (fb0) fb0.innerHTML = `<svg viewBox="0 0 120 80" aria-hidden="true">${bowlSvg(60, 42, 100, Math.min(2, g.bowl || 0))}</svg>`;
    const need = isSick(g) ? `🤒 ${g.pup.name} is sick · better in ${hmm(g.sick.until - Date.now())} · tap` : lv >= 4 ? t('gWaterBad') : g.poos.length ? t('gPooHint') : lv >= 3 ? t('gWaterDirty') : need0;
    const ne = $('#gNeed'); ne.classList.toggle('hidden', !need); ne.classList.toggle('sickn', isSick(g)); ne.textContent = withName(need); };
  const bondUp = () => { const b = bondOf(gLoad()); toast(tf('bondUp', pupName(), b.L), 3200); fx('💗✨💗', 6); };
  const care = (kind, joyN) => { g = gLoad(); const per = g.pup && g.pup.per; // personality: cuddly pups love pets, playful ones love toys, shy ones warm up slowly
    if (kind === 'pet' && joyN) joyN = per === 'cuddly' ? joyN + 1 : per === 'shy' ? 1 : joyN; if (kind === 'toy' && per === 'playful') joyN += 4;
    if (joyN) addJoy(g, joyN); const up = addXp(g, kind); gSave(g); bars(); if (up) later(600, bondUp); };
  // 5.5 keeping him company: +1 happiness a minute while you're here and playing (2 min without a tap = not counted; max 10 a visit, 20 a day)
  clearInterval(window.__compT); if (!window.__touchHook) { window.__touchHook = 1; document.addEventListener('pointerdown', () => { window.__lastTouch = Date.now(); }, true); }
  let compVisit = 0; window.__lastTouch = Date.now();
  window.__compT = setInterval(() => { if (location.hash !== '#garden') return clearInterval(window.__compT); if (document.visibilityState !== 'visible' || Date.now() - (window.__lastTouch || 0) > 120000) return;
    const g2 = gLoad(); if (!g2.pup || gMood(g2) === 'shelter') return; if (g2.compDay !== today()) { g2.compDay = today(); g2.compToday = 0; }
    if (compVisit >= 10 || (g2.compToday || 0) >= 20 || baseJoy(g2) >= 100) return; compVisit++; g2.compToday = (g2.compToday || 0) + 1; addJoy(g2, 1); gSave(g2); bars(); if (Math.random() < .4) fx('💕', 1); }, 60000);
  const poos = () => { g = gLoad(); const box = $('#gPoos'); if (!box) return;
    box.innerHTML = g.poos.map((p, i) => `<button class="poobtn${p.k === 'pee' ? ' pee' : ''}" data-i="${i}" style="left:${p.x}%" aria-label="${p.k === 'pee' ? 'pee' : 'poo'}">${p.k === 'pee' ? PEE_SVG : pooSvg()}</button>`).join('');
    const pd = $('#gPad'); if (pd) { pd.className = 'pad' + ((g.padUses || 0) >= 4 ? ' full' : (g.padUses || 0) ? ' used' : ''); }
    box.querySelectorAll('.poobtn').forEach(b => b.onclick = e => { e.stopPropagation(); const i = +b.dataset.i, x = g.poos[i].x; g = gLoad(); g.poos.splice(i, 1); gSave(g);
      fx('✨🧹✨', 4, x); care('poo', 4); poos();
      if (!g.poos.length && state === 'dirty') { state = 'idle'; if (!gBusy) { gBusy = true; draw('sit', 'super', 'r-jump wagfast'); fx('💖✨', 4); later(1500, () => { gBusy = false; rest(); }); } } }); };
  const chewing = () => (gLoad().chewUntil || 0) > Date.now();
  const eating = () => (gLoad().eatUntil || 0) > Date.now();
  const rest = () => { // resting look for the current state
    carry.innerHTML = '';
    if (chewing()) { draw('lie', 'eat', 'r-chompl wagfast'); carry.className = 'carry chewing'; carry.innerHTML = toySvg('chew'); return; }
    carry.className = 'carry';
    if (state === 'sick') draw('lie', 'sick', 'r-breathe weak');
    else if (state === 'weak') draw('lie', 'sad', 'r-breathe weak');
    else if (state === 'thirsty') draw('sit', 'thirsty', 'r-pant');
    else if (state === 'grumpy') draw('sit', 'grumpy', '');
    else if (state === 'dirty') draw('sit', 'sad', '');
    else if (night && Math.random() < .6) draw('sleep', 'sleep', 'r-breathe sleeping');
    else draw('sit', 'open', ''); };
  const recheck = () => { const m = gMood(gLoad()); if (m === 'sick' || m === 'weak' || m === 'thirsty' || m === 'dirty' || m === 'grumpy') state = m; else state = 'idle'; };
  // ---- eating: takes about a minute; head down in the bowl, with different moves ----
  const EAT_MOVES = [['eat', 'eatdown', 'r-chompl'], ['eat', 'eatdown', 'r-nudge'], ['eat', 'eatdown', 'r-dig'], ['eat', 'eatdown', 'r-chompl'], ['eatup', 'eat', 'r-chompl']];
  const eat = until => {
    gBusy = true; draw('eat', 'eatdown', 'r-chompl wagfast'); fx('✨🦴✨', 5);
    let last = 0; const mv = () => { if (!alive() || Date.now() >= until) return; if (Date.now() < eatPause) return later(eatPause - Date.now() + 50, mv);
      let i; do { i = Math.floor(Math.random() * EAT_MOVES.length); } while (i === last); last = i; const m = EAT_MOVES[i];
      draw(m[0], m[1], m[2] + ' wagfast'); if (Math.random() < .35) fx(m[0] === 'eatup' ? '💕' : '✨', 2);
      later(m[0] === 'eatup' ? 1600 : 2400 + Math.random() * 1600, mv); };
    later(2600, mv);
    later(until - Date.now(), () => { const wait = Math.max(0, eatPause - Date.now()); later(wait, () => { recheck(); draw('sit', state === 'idle' ? 'super' : 'open', 'r-jump wagfast'); fx('❤️💛', 4); later(1500, () => { gBusy = false; rest(); }); }); });
  };
  // ---- chewing toy: plays by himself for half an hour ----
  const chew = until => { stopTimer(); gBusy = false; rest(); timer('🦴 ' + withName(t('gChewing')), until, () => { carry.innerHTML = ''; draw('sit', 'super', 'r-jump wagfast'); fx('💖✨', 4); later(1500, rest); }); };
  // ---- arrival ----
  place(0, 0, 1, 0, false);
  const eatUntil = g.eatUntil || 0, chewUntil = g.chewUntil || 0;
  if (eatUntil > Date.now()) eat(eatUntil);
  else if (chewUntil > Date.now()) chew(chewUntil);
  else if (mood0 === 'sick') draw('lie', 'sick', 'r-breathe weak');
  else if (mood0 === 'weak') draw('lie', 'sad', 'r-breathe weak');
  else if (mood0 === 'thirsty') { draw('sit', 'thirsty', 'r-pant'); fx('💧', 2); }
  else if (mood0 === 'grumpy') draw('sit', 'grumpy', '');
  else if (mood0 === 'dirty') draw('sit', 'sad', 'r-sigh');
  else if (mood0 === 'waking') { // asleep next to his house: wakes up slowly, then walks over to you
    gBusy = true; const G = geo(), hx = 64, hy = G.HZ + 14; place(hx - G.homeX, hy - G.homeY, depth(hy, G), 0, false); draw('sleep', 'sleep', 'r-breathe sleeping');
    later(2600, () => draw('sleep', 'sleep', 'r-twitch'));
    later(3500, () => draw('lie', 'sleep', 'r-stretch'));
    later(4500, () => draw('lie', 'open', 'r-look'));
    later(5300, () => draw('sit', 'open', 'r-tilt'));
    later(6000, () => { draw('sit', 'super', 'r-wiggle wagfast'); fx('❗', 1); });
    later(6600, () => { move('happy', 'wagfast'); place(0, 0, 1, 2600, true); });
    later(9200, () => { state = 'idle'; place(0, 0, 1, 0, false); draw('sit', 'super', 'r-jump wagfast'); fx('💕💖', 4); });
    later(10200, () => { gBusy = false; rest(); });
  }
  else draw('sit', 'happy', 'r-wiggle wagfast');
  bars(); poos(); if (lvUpVisit) later(1200, bondUp);
  const gotSick = temps => { g = gLoad(); const got = sickCheck(g, temps); gSave(g); if (!got || !alive()) return;
    state = 'sick'; bars(); if (!gBusy && !play && !roaming) rest(); later(800, () => toast(`🤒 ${g.pup.name} ${SICK_WHY[g.sick.cause] ? SICK_WHY[g.sick.cause](g.sick) : 'is not feeling well'}.`, 4200)); };
  calgaryTemps().then(gotSick).catch(() => gotSick(null));
  const applySky = w => { const sc = $('#gScene'); if (!sc) return; const cls = sky(w); night = /night/.test(cls); sc.className = 'garden big indoor ' + cls;
    if (w) { const x = WX[w.weather_code] || ['🌡️', '', '']; $('#gWx').textContent = `${x[0]} ${Math.round(w.temperature_2m)}°C · ${calgaryNow().slice(11)}`; $('#gWx').title = `Calgary · ${x[2]} · ${t('gFeels')} ${Math.round(w.apparent_temperature)}°C`; }
    else $('#gWx').textContent = `📍 ${calgaryNow().slice(11)}`;
    const fall = sc.querySelector('.fall'); fall.innerHTML = /rain|storm|snow/.test(cls) ? Array.from({ length: 50 }, () => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 2).toFixed(2)}s;animation-duration:${(/snow/.test(cls) ? 3 + Math.random() * 3 : .7 + Math.random() * .5).toFixed(2)}s"></i>`).join('') : ''; };
  let wx = null; applySky(null);
  const loadWx = () => calgaryWeather().then(w => { wx = w; applySky(w); }).catch(() => applySky(wx));
  loadWx();
  $('#gWx').onclick = () => { if ($('#gWx').title) toast($('#gWx').title, 2600); };
  const busyToast = () => toast(withName(t(chewing() ? 'gBusyChew' : 'gBusy')), 2200);
  // ---- touching the puppy (no dialogue: he shows his mood with his body) ----
  const pet = () => {
    if (play && play.pet) return play.pet();
    cancelRoam(); const now = Date.now(); petTimes = petTimes.filter(x => now - x < 10 * 60e3); petTimes.push(now);
    const joyN = petTimes.length <= 5 ? 2 : 0; // only the first few pets in 10 minutes cheer him up
    if (eating() && gBusy) { // stops eating for a moment to enjoy the touch, then goes back to the bowl
      if (now < eatPause) return; eatPause = now + 1700; care('pet', joyN); draw('eatup', 'happy', 'r-wiggle wagfast'); fx('💕', 2);
      later(1700, () => { if (eating()) draw('eat', 'eatdown', 'r-chompl wagfast'); }); return; }
    if (chewing()) { care('pet', joyN); draw('lie', 'happy', 'r-wiggle wagfast'); fx('💕', 2); later(1700, () => { if (!gBusy && !play) rest(); }); return; }
    if (gBusy) return; care('pet', joyN);
    if (state === 'sick') { gBusy = true; draw('lie', 'sick', 'r-wiggle weak'); fx('💗', 1); later(1400, () => { gBusy = false; rest(); }); return; }
    if (state === 'weak') { gBusy = true; draw('lie', 'open', 'r-wiggle weak'); fx('💧', 1); later(1400, () => { gBusy = false; rest(); }); return; }
    if (state === 'thirsty') { gBusy = true; draw('sit', 'thirsty', 'r-wiggle'); fx('💧', 2); later(1400, () => { gBusy = false; rest(); }); return; }
    if (state === 'dirty') { gBusy = true; draw('sit', 'sad', 'r-shake'); fx('💩', 1); later(1300, () => { gBusy = false; rest(); }); return; }
    if (state === 'grumpy' && --grumpLeft > 0) { gBusy = true; draw('sit', 'grumpy', 'r-shake'); later(1200, () => { gBusy = false; rest(); }); return; }
    if (state === 'grumpy') state = 'idle'; wrap.classList.remove('turned');
    let i; do { i = Math.floor(Math.random() * PET.length); } while (i === gLastPet); gLastPet = i;
    const r = PET[i]; gBusy = true;
    if (r.pose === 'run') move(r.e, r.a + ' wagfast', true); else draw(r.pose || 'sit', r.e, r.a + ' wagfast');
    fx(r.fx);
    later(1500, () => { draw('sit', 'happy', 'wagfast');
      if (!atHome() && Math.random() < .4) later(600, () => comeHome(() => { gBusy = false; draw('sit', 'super', 'r-wiggle wagfast'); }, false)); // sometimes he trots over to you
      else later(1200, () => { gBusy = false; rest(); }); });
  };
  pup.onclick = pet;
  // ---- food: meals are free (fill the bowl; the puppy eats when hungry). Treats are extras: 3 free a day, more in the shop ----
  const eatMeal = () => { g = gLoad(); if (!(g.bowl > 0)) return; g.bowl--; g.lastFed = Date.now(); g.fedTotal = (g.fedTotal || 0) + 1; pooAfterMeal(g);
    g.eatUntil = Date.now() + EAT_MS + (atHome() ? 0 : 4000); gSave(g); care('feed', 6);
    if (state === 'weak' || state === 'grumpy') state = 'idle'; if (isSick(gLoad())) state = 'sick'; grumpLeft = 0; wrap.classList.remove('turned');
    gBusy = true; const G = geo(); goTo(G.W - 120, G.SH - 14, () => eat(gLoad().eatUntil), false, 'super'); };
  const giveTreat = () => { cancelRoam(); if (gBusy || play || chewing()) return busyToast(); g = gLoad(); if (!treatsLeft(g)) return toast(t('gNoTreat'), 3500);
    if (g.free > 0) g.free--; else g.bonus--; gSave(g); care('feed', 8); gBusy = true;
    comeHome(() => { draw('eatup', 'eat', 'r-chompl wagfast'); fx('🦴💖', 4); later(1600, () => { draw('sit', 'super', 'r-jump wagfast'); }); later(2800, () => { gBusy = false; rest(); bars(); }); }); };
  const openFood = () => { g = gLoad(); const bw = g.bowl || 0;
    const m = showSheet(`<h2 style="margin-top:0">🥣 Food</h2><div class="muted">Meals are free. Fill the bowl and ${esc(g.pup.name)} eats by itself when hungry (${mealsPerDay(g)} meals a day at this age).</div>
      <div class="foodrow"><span class="ic">🥣</span><div style="flex:1"><b>Food bowl</b><div class="muted">${bw >= BOWL_MAX ? 'Full' : bw ? '1 meal left' : 'Empty'} · holds ${BOWL_MAX} meals</div></div><button class="btn small" id="fdFill" ${bw >= BOWL_MAX ? 'disabled' : ''}>Fill · free</button></div>
      <div class="foodrow"><span class="ic">${treatSvg()}</span><div style="flex:1"><b>Treat</b><div class="muted">${cn(tf('gTreatsMini', g.free || 0, FREE_TREATS, g.bonus || 0, g.coins || 0))}</div></div><button class="btn sec small" id="fdTreat" ${treatsLeft(g) ? '' : 'disabled'}>Give</button></div>
      <div class="muted">Treats make your puppy happy and reward training. More treats in the shop 🛒</div><button class="btn sec" id="fdClose">${t('close')}</button>`);
    m.querySelector('#fdClose').onclick = closeSheet;
    m.querySelector('#fdTreat').onclick = () => { closeSheet(); giveTreat(); };
    m.querySelector('#fdFill').onclick = () => { g = gLoad(); g.bowl = BOWL_MAX; gSave(g); closeSheet(); fx('✨🥣✨', 4, 70); bars(); toast(`🥣 Bowl filled. ${pupName()} will eat when hungry.`, 2400);
      if (!gBusy && !play && !chewing() && fullness(gLoad()) < HUNGRY) later(900, () => { if (!gBusy && !play) { cancelRoam(); eatMeal(); } }); }; };
  $('#gFeed').onclick = () => { cancelRoam(); openFood(); }; $('#gFoodBowl').onclick = e => { e.stopPropagation(); cancelRoam(); openFood(); };
  // ---- water: change it any time; he trots over and drinks fresh water happily ----
  const changeWater = () => { g = gLoad(); const was = waterLevel(g); if (was === 0 && H(g.waterAt) < .5) return toast('💧 The water is already fresh.', 1800);
    g.waterAt = Date.now(); gSave(g); fx('💦✨', 4, 86); care('water', was >= 1 ? 3 : 0); bars(); if (state === 'thirsty') { state = 'idle'; wantDrinkNow = true; } };
  const drinkGap = () => (isYoung(gLoad()) ? 1.5 + Math.random() * 1.5 : 3 + Math.random() * 2) * 36e5;
  let drinkAt = gLoad().lastDrink ? gLoad().lastDrink + drinkGap() : Date.now() + rndMin(5, 30), wantDrinkNow = false;
  const drink = () => { gBusy = true; const G = geo(); goTo(G.W - 74, G.SH - 10, () => { draw('drink', 'eatdown', 'r-dig wagfast'); fx('💧', 3);
      later(3200, () => { g = gLoad(); g.lastDrink = Date.now(); peeAfterDrink(g); gSave(g); drinkAt = Date.now() + drinkGap(); recheck(); draw('sit', 'happy', 'wagfast'); fx('💙', 2); later(1200, () => { gBusy = false; rest(); }); }); }, false, 'open'); };
  $('#gWaterBtn').onclick = changeWater; $('#gBowl').onclick = changeWater;
  // ---- shop: spend coins on treats and toys ----
  const shopName = it => t('shop_' + it.id);
  const shopIcon = it => it.kind === 'treat' ? treatSvg() : toySvg(it.id);
  const SHOP_LV = { treat1: 1, treat5: 1, collar: 1, ball: 2, rope: 3, chew: 4 };   // more items unlock as the bond grows
  const COLLAR_IT = { id: 'collar', kind: 'collar', price: COLLAR_PRICE };
  let cart = {};
  // cart keys: an item id, or "collar|<collar colour>|<tag colour>"
  const cartRows = () => Object.entries(cart).map(([id, n]) => { if (id.startsWith('collar|')) { const [, c, t] = id.split('|'); return { it: COLLAR_IT, n, key: id, cl: { c, t } }; } return { it: SHOP.find(x => x.id === id), n, key: id }; }).filter(r => r.it && r.n > 0);
  const rowName = r => r.cl ? `Collar · ${collarName(r.cl)}` : shopName(r.it);
  const rowIcon = r => r.cl ? collarIcon(r.cl) : shopIcon(r.it);
  const cartTotal = () => cartRows().reduce((s, r) => s + r.it.price * r.n, 0);
  const openShop = () => {
    g = gLoad(); const L = bondOf(g).L, lv = it => SHOP_LV[it.id] || 1;
    const open = [...SHOP.slice(0, 2), COLLAR_IT, ...SHOP.slice(2)].filter(it => lv(it) <= L), next = SHOP.filter(it => lv(it) > L).sort((x, y) => lv(x) - lv(y))[0];
    const count = cartRows().reduce((s, r) => s + r.n, 0), total = cartTotal();
    const m = showSheet(`<h2 style="margin-top:0">🛒 ${t('shopTitle')}</h2><div class="muted">${cn(tf('shopCoins', g.coins || 0))}</div>
      <div class="shopgrid">${open.map(it => { if (it.kind === 'collar') { const n = cartRows().filter(r => r.cl).length; return `<div class="shopitem${n ? ' incart' : ''}"><span class="ic">${collarIcon({ c: 'red', t: 'gold' })}</span><b>Collar</b><span class="price">${COIN_SVG} ${it.price}</span><button class="addc" id="pickCollar">${n ? n + ' in cart' : 'Choose'}</button></div>`; }
        const n = cart[it.id] || 0; return `<div class="shopitem${n ? ' incart' : ''}"><span class="ic">${shopIcon(it)}</span><b>${shopName(it)}</b><span class="price">${COIN_SVG} ${it.price}</span>
        ${n ? `<div class="qty"><button data-dec="${it.id}" aria-label="less">−</button><b>${n}</b><button data-inc="${it.id}" aria-label="more">+</button></div>` : `<button class="addc" data-inc="${it.id}">Add</button>`}</div>`; }).join('')}</div>
      ${next ? `<div class="shopnext">🔒 ${shopName(next)} unlocks at bond Lv ${lv(next)}</div>` : ''}
      ${isSick(g) ? pillRow(g) : ''}
      <div class="cartbar"><span>🛒 ${count ? `${count} item${count > 1 ? 's' : ''} · ${total} ${COIN_SVG}` : 'Your cart is empty'}</span><button class="btn small" id="cartGo" ${count ? '' : 'disabled'}>Checkout</button></div>
      <button class="btn sec" id="shopClose">${t('close')}</button>`);
    m.querySelector('#shopClose').onclick = closeSheet; bindPill(m, openShop);
    m.querySelectorAll('[data-inc]').forEach(b => b.onclick = () => { const id = b.dataset.inc; cart[id] = Math.min(9, (cart[id] || 0) + 1); openShop(); });
    m.querySelectorAll('[data-dec]').forEach(b => b.onclick = () => { const id = b.dataset.dec; cart[id] = (cart[id] || 0) - 1; if (cart[id] <= 0) delete cart[id]; openShop(); });
    m.querySelector('#cartGo').onclick = checkout; const pc = m.querySelector('#pickCollar'); if (pc) pc.onclick = () => pickCollar();
  };
  // choose a collar colour and a tag colour, with a live preview on your own puppy
  const pickCollar = (sel = { c: 'red', t: 'gold' }) => { g = gLoad(); const own = (g.collars || []).some(x => x.c === sel.c && x.t === sel.t), key = `collar|${sel.c}|${sel.t}`, inCart = !!cart[key];
    const m = showSheet(`<h2 style="margin-top:0">🎀 Choose a collar</h2><div class="cprev">${regenB('sit', 'happy', g.pup.color, sel)}</div>
      <div class="clab">Collar</div><div class="cswatch">${Object.entries(COLLAR_COLS).map(([k, v]) => `<button class="sw${k === sel.c ? ' on' : ''}" data-c="${k}" style="background:${v}" aria-label="${k}"></button>`).join('')}</div>
      <div class="clab">Tag</div><div class="cswatch">${Object.entries(TAG_COLS).map(([k, v]) => `<button class="sw tag${k === sel.t ? ' on' : ''}" data-t="${k}" style="background:${v}" aria-label="${k}"></button>`).join('')}</div>
      <div class="muted" style="text-align:center;margin-top:6px">${collarName(sel)}${own ? ' · you already have this one' : inCart ? ' · already in your cart' : ''}</div>
      <div class="row" style="margin-top:12px"><button class="btn sec" id="cpBack" style="margin:0">‹ Back to shop</button><button class="btn" id="cpAdd" style="margin:0" ${own || inCart ? 'disabled' : ''}>Add to cart</button></div>`);
    m.querySelectorAll('[data-c]').forEach(b => b.onclick = () => pickCollar({ ...sel, c: b.dataset.c }));
    m.querySelectorAll('[data-t]').forEach(b => b.onclick = () => pickCollar({ ...sel, t: b.dataset.t }));
    m.querySelector('#cpBack').onclick = openShop; m.querySelector('#cpAdd').onclick = () => { cart[key] = 1; openShop(); }; };
  const checkout = () => {
    g = gLoad(); const rows = cartRows(), total = cartTotal(), have = g.coins || 0, ok = rows.length && have >= total;
    const m = showSheet(`<h2 style="margin-top:0">🧾 Checkout</h2>
      <div class="corder">${rows.map(r => `<div><span class="ic">${rowIcon(r)}</span><span style="flex:1">${rowName(r)} × ${r.n}</span><b>${r.it.price * r.n} ${COIN_SVG}</b></div>`).join('')}
        <div class="ctot"><span>Total</span><b>${total} ${COIN_SVG}</b></div></div>
      <div class="muted">${ok ? `You have ${have} ${COIN_SVG}. After paying: ${have - total} ${COIN_SVG}` : `Not enough coins: you have ${have} ${COIN_SVG}. Remove something, or log prices to earn more.`}</div>
      <div class="row" style="margin-top:12px"><button class="btn sec" id="coBack" style="margin:0">‹ Back to shop</button><button class="btn" id="coPay" style="margin:0" ${ok ? '' : 'disabled'}>Pay ${total} ${COIN_SVG}</button></div>`);
    m.querySelector('#coBack').onclick = openShop;
    m.querySelector('#coPay').onclick = () => { g = gLoad(); const rs = cartRows(), tot = cartTotal(); if (!rs.length || (g.coins || 0) < tot) return;
      g.coins -= tot; let wore = null; rs.forEach(({ it, n, cl }) => { for (let i = 0; i < n; i++) { if (cl) { g.collars = g.collars || []; g.collars.push({ ...cl, t0: Date.now() }); wore = g.wear = { c: cl.c, t: cl.t }; } else if (it.kind === 'treat') g.bonus += it.n; else g.toys.push({ type: it.id, uses: 0, t: Date.now() }); } });
      gSave(g); cart = {}; bars(); closeSheet(); toast('✅ ' + rs.map(r => `${rowName(r)} × ${r.n}`).join(', '), 2600); fx('🛍️✨', 3, 50);
      if (wore) { pupCollar = wore; if (!gBusy && !play) { gBusy = true; draw('sit', 'super', 'r-jump wagfast'); fx('🎀✨', 4); later(1500, () => { gBusy = false; rest(); }); } } };
  };
  $('#gShopBtn').onclick = openShop;
  // ---- sick: rest 5 hours, or a pill (5 coins) and it's better in 5 minutes ----
  function pillRow(g) { const sick = isSick(g), short = sick && g.sick.until - Date.now() <= PILL_MS;
    return `<div class="pillrow">${PILL_SVG}<div style="flex:1"><b>Puppy pill</b><div class="muted">${sick ? (short ? 'Already working…' : 'Back on its paws in 5 minutes') : 'Only needed when your puppy is sick'}</div></div>
      <button class="btn small" id="pillBuy" ${sick && !short && (g.coins || 0) >= PILL_PRICE ? '' : 'disabled'}>${PILL_PRICE} ${COIN_SVG}</button></div>`; }
  function bindPill(m, again) { const b = m.querySelector('#pillBuy'); if (!b) return; b.onclick = () => { g = gLoad(); if (!isSick(g) || (g.coins || 0) < PILL_PRICE) return;
    const c = showSheet(`<h2 style="margin-top:0">💊 Puppy pill</h2><div>Give ${esc(g.pup.name)} a pill for <b>${PILL_PRICE} ${COIN_SVG}</b>? It will feel better in 5 minutes.</div><div class="muted" style="margin-top:4px">You have ${g.coins || 0} ${COIN_SVG}</div>
      <div class="row" style="margin-top:12px"><button class="btn sec" id="plNo" style="margin:0">Not now</button><button class="btn" id="plYes" style="margin:0">Pay ${PILL_PRICE} ${COIN_SVG}</button></div>`);
    c.querySelector('#plNo').onclick = again; c.querySelector('#plYes').onclick = () => { g = gLoad(); if (!isSick(g) || (g.coins || 0) < PILL_PRICE) return closeSheet();
    g.coins -= PILL_PRICE; g.sick.until = Math.min(g.sick.until, Date.now() + PILL_MS); g.sick.pill = Date.now(); gSave(g); bars(); closeSheet(); toast(`💊 ${g.pup.name} took the pill. Feeling better in 5 minutes.`, 3000); fx('💊✨', 3); }; }; }
  const openSick = () => { g = gLoad(); if (!isSick(g)) return; const s = g.sick, why = SICK_WHY[s.cause] ? SICK_WHY[s.cause](s) : 'is not feeling well';
    const m = showSheet(`<h2 style="margin-top:0">🤒 ${esc(g.pup.name)} is sick</h2><div>${esc(g.pup.name)} ${why}. It will feel better by itself in <b>${hmm(s.until - Date.now())}</b>.</div>
      <div class="muted" style="margin-top:6px">While sick it rests: no playing or training. Feeding, water and cuddles still help.</div>${pillRow(g)}<div class="muted">${cn(tf('shopCoins', g.coins || 0))}</div>
      <button class="btn sec" id="sickClose">${t('close')}</button>`);
    m.querySelector('#sickClose').onclick = closeSheet; bindPill(m, openSick); };
  $('#gNeed').onclick = () => { if (isSick(gLoad())) openSick(); };
  $('#gInfo').onclick = () => openPupInfo();
  $('#gDoor').onclick = () => toast('🌳 The playground opens soon: ball games and walks!', 2600);
  $('#gPad').onclick = e => { e.stopPropagation(); g = gLoad(); if (!(g.padUses || 0)) return toast('🧻 The pee pad is clean.', 1800); g.padUses = 0; gSave(g); fx('✨🧻✨', 4, 80); care('poo', 3); poos(); bars(); };
  // where the pad is, in garden coordinates (his feet)
  const padSpot = () => { const sc = $('#gScene').getBoundingClientRect(), r = $('#gPad').getBoundingClientRect(); return [r.left - sc.left + r.width / 2, r.top - sc.top + r.height * .8]; };
  const pottyDue = () => { const g0 = gLoad(); for (const [key, k] of [['pendingPoo', 'poo'], ['pendingPee', 'pee']]) if (g0[key] && Date.now() >= g0[key]) return [key, k]; return null; };
  const btn = (id, ms, fn) => { const b = $('#' + id); b.classList.remove('hidden'); let used = false; b.onclick = e => { e.stopPropagation(); if (used) return; used = true; b.classList.add('hidden'); fn(); }; later(ms, () => b.classList.add('hidden')); return () => used; };
  const finishPotty = (key, onPad) => { g = gLoad(); g[key] = 0; if (key === 'pendingPee') nextPee(g); if (onPad) g.padUses = (g.padUses || 0) + 1; gSave(g); poos(); bars(); };
  // trained: walks to the pad by itself. Untrained: sniffs and circles (💦) — tap "To the pad!" within 20 s, or it has an accident
  const toilet = ([key, k]) => { cancelRoam(); gBusy = true; const trained = skill(gLoad(), 'toilet') >= TOILET_OK && (gLoad().padUses || 0) < 4;
    const onPad = (helped) => { const [px, py] = padSpot(); goTo(px, py, () => { draw('squat', 'open', ''); fx(k === 'pee' ? '💦' : '💨', 1);
      later(2400, () => { finishPotty(key, true);
        if (trained) { draw('sit', 'happy', 'wagfast'); fx('✨', 2); later(1400, () => comeHome(() => { gBusy = false; rest(); }, false)); return; }
        g = gLoad(); const r = practise(g, 'toilet', 1, TOILET_OK); gSave(g); draw('sit', 'super', 'r-wiggle wagfast'); $('#gQ').textContent = '💖'; $('#gQ').classList.remove('hidden');
        let praised = false; play = { pet: () => { if (praised) return; praised = true; g = gLoad(); const r2 = practise(g, 'toilet', 1, TOILET_OK); gSave(g); care('pet', 4); fx('💖✨💖', 6); toast('💖 Good dog!', 1600); $('#gQ').classList.add('hidden');
          if (r === 'learned' || r2 === 'learned') later(900, () => { toast(`🎉 ${pupName()} is toilet trained!`, 3500); fx('🎓✨', 6); }); } };
        toast('Tap your puppy to praise it!', 2600);
        later(5000, () => { $('#gQ').classList.add('hidden'); $('#gQ').textContent = '?'; play = null; comeHome(() => { gBusy = false; recheck(); rest(); }, false); }); }); }, false, 'open'); };
    if (trained) return onPad(false);
    draw('nose', 'eatdown', 'r-sniff'); $('#gQ').textContent = '💦'; $('#gQ').classList.remove('hidden'); fx('💦', 1);
    later(1600, () => { if (!gBusy) return; draw('nose', 'eatdown', 'r-dig'); });
    const helped = btn('gPotty', 20000, () => { $('#gQ').classList.add('hidden'); $('#gQ').textContent = '?'; onPad(true); });
    later(20200, () => { if (helped()) return; $('#gQ').classList.add('hidden'); $('#gQ').textContent = '?'; draw('squat', 'sad', ''); fx(k === 'pee' ? '💦' : '💨', 1); // accident
      later(2200, () => { g = gLoad(); const G = geo(); if (g.poos.length < POO_MAX + 2) g.poos.push({ x: Math.max(6, Math.min(78, Math.round((G.homeX + pos.x) / G.W * 100))), t: Date.now(), k }); g[key] = 0; if (key === 'pendingPee') nextPee(g); gSave(g); poos(); bars();
        state = 'dirty'; draw('sit', 'sad', 'r-sigh'); toast(`Oops! ${pupName()} had an accident. Clean it up, and next time help it to the pad.`, 3600); later(1600, () => { gBusy = false; rest(); }); }); }); };
  // ---- training: commands unlock with the bond level ----
  const openTrain = () => { g = gLoad(); const L = bondOf(g).L, ts = skill(g, 'toilet');
    const st = m => m >= CMD_OK ? 'learned' : m > 0 ? 'learning' : 'new';
    const m = showSheet(`<h2 style="margin-top:0">🎓 Train ${esc(g.pup.name)}</h2><div class="muted">Say a command. Every try trains it; reward a success with a treat to train it twice as much. ${SKILL_DAY} tries per command a day.</div>
      <div class="cmdgrid"><button class="cmdb tl" data-tl="1">🚽 Toilet<small>${ts >= TOILET_OK ? 'trained ✓' : ts > 0 ? 'learning' : 'not yet'}</small><i><b style="width:${Math.round(Math.min(100, ts / TOILET_OK * 100))}%"></b></i></button>
      ${CMDS.map(c => c.L <= L ? `<button class="cmdb" data-cmd="${c.id}">${c.e} ${c.n}<small>${st(skill(g, c.id))}${st(skill(g, c.id)) === 'learned' ? ' ✓' : ''}</small><i><b style="width:${Math.round(Math.min(100, skill(g, c.id) / CMD_OK * 100))}%"></b></i></button>` : `<button class="cmdb lk" disabled>${c.e} ${c.n}<small>🔒 Lv ${c.L}</small></button>`).join('')}</div>
      <div class="muted" style="margin-top:8px">${L < 2 ? 'The first command (Sit) unlocks at bond Lv 2.' : 'A puppy that half knows a command sometimes mixes it up with another one.'}</div><button class="btn sec" id="trClose">${t('close')}</button>`);
    m.querySelector('#trClose').onclick = closeSheet;
    m.querySelector('[data-tl]').onclick = () => toast('🚽 Toilet training happens when your puppy needs to go: watch for 💦 and help it to the pad.', 4200);
    m.querySelectorAll('[data-cmd]').forEach(b => b.onclick = () => { closeSheet(); doCmd(CMDS.find(c => c.id === b.dataset.cmd)); }); };
  const doCmd = c => { cancelRoam(); if (gBusy || play || chewing()) return busyToast(); g = gLoad();
    if (isSick(g)) return toast(`🤒 ${pupName()} is sick and needs rest. No training until it feels better.`, 3000);
    if (state === 'weak') return toast(withName(t('gToyWeak')), 2500);
    const left = SKILL_DAY - (((g.pup.skLog || {}).day === today() && g.pup.skLog[c.id]) || 0);
    gBusy = true; comeHome(() => { draw('sit', 'open', 'r-look'); $('#gQ').textContent = c.e; $('#gQ').classList.remove('hidden'); toast(`"${c.n}!"`, 1200);
      later(1100, () => { $('#gQ').classList.add('hidden'); $('#gQ').textContent = '?'; g = gLoad(); const m0 = skill(g, c.id), iq = stat(g, 'iq');
        const p = m0 < 15 ? 0 : Math.min(.97, (m0 / 100) * (.75 + iq / 200) / (1 + (c.d - 1) * .06)), ok = Math.random() < p;
        const r = left > 0 ? practise(g, c.id, c.d, CMD_OK) : false; gSave(g);
        const done = () => { gBusy = false; recheck(); rest(); };
        if (ok) { const [ps, ex, an] = c.pose; draw(ps, ex, an); fx('✨', 2);
          if (r === 'learned') later(900, () => { toast(`🎉 ${pupName()} learned "${c.n}"!`, 3500); fx('🎓✨🎉', 6); g = gLoad(); addXp(g, 'toy'); gSave(g); });
          const rewarded = btn('gReward', 4000, () => { g = gLoad(); if (!treatsLeft(g)) return toast(t('gNoTreat'), 2500); if (g.free > 0) g.free--; else g.bonus--; if (left > 1) practise(g, c.id, c.d, CMD_OK); gSave(g); care('feed', 4); draw('sit', 'super', 'r-jump wagfast'); fx('🦴💖', 4); bars(); });
          later(4300, done); return; }
        const known = CMDS.filter(x => x.id !== c.id && skill(g, x.id) >= 30);
        if (m0 >= 25 && known.length && Math.random() < .65) { const o = known[Math.floor(Math.random() * known.length)], [ps, ex, an] = o.pose; draw(ps, ex, an); // mix-up
          later(1500, () => { draw('sit', 'open', 'r-tilt'); $('#gQ').textContent = '?'; $('#gQ').classList.remove('hidden'); toast(`Oops, that was "${o.n}". ${pupName()} is still learning "${c.n}".`, 3000); });
          later(3600, () => { $('#gQ').classList.add('hidden'); done(); }); return; }
        draw('sit', 'open', 'r-tilt'); $('#gQ').classList.remove('hidden'); toast(m0 < 15 ? `${pupName()} has no idea what "${c.n}" means yet. Keep practising!` : `Not this time. Keep practising "${c.n}"!`, 3000);
        later(2600, () => { $('#gQ').classList.add('hidden'); done(); }); }); }); };
  $('#gTrainBtn').onclick = () => { cancelRoam(); if (gBusy || play) return busyToast(); openTrain(); }; viewGarden._rest = () => { if (alive() && !gBusy && !play) rest(); };
  // ---- toys: each lasts 10 plays, then it's old and dirty ----
  const openToys = () => {
    cancelRoam(); if (gBusy || play) return busyToast();
    g = gLoad();
    const list = g.toys.map((y, i) => { const old = y.uses >= TOY_LIFE;
      return `<div class="toyrow${old ? ' old' : ''}"><span class="ic">${toySvg(y.type, old)}</span><div style="flex:1"><b>${t('shop_' + y.type)}</b><div class="muted">${old ? t('toyOld') : tf('toyLeft', TOY_LIFE - y.uses)}</div></div>
        ${old ? `<button class="btn sec small" data-bin="${i}">${t('toyBin')}</button>` : `<button class="btn small" data-play="${i}">${t('toyPlay')}</button>`}</div>`; }).join('');
    const m = showSheet(`<h2 style="margin-top:0">🎾 ${t('toyTitle')}</h2>${list || `<div class="muted" style="margin:12px 0">${t('toyNone')}</div>`}
      <div class="row" style="margin-top:12px"><button class="btn sec" id="toyClose" style="margin:0">${t('close')}</button><button class="btn" id="toyShop" style="margin:0">🛒 ${t('gShopBtn')}</button></div>`);
    m.querySelector('#toyClose').onclick = closeSheet; m.querySelector('#toyShop').onclick = openShop;
    m.querySelectorAll('[data-bin]').forEach(b => b.onclick = () => { g = gLoad(); g.toys.splice(+b.dataset.bin, 1); gSave(g); openToys(); });
    m.querySelectorAll('[data-play]').forEach(b => b.onclick = () => {
      const i = +b.dataset.play; closeSheet();
      if (state === 'weak') { toast(withName(t('gToyWeak')), 2500); return; }
      if (isSick(gLoad())) { toast(`🤒 ${pupName()} is sick and needs rest. No playing until it feels better.`, 3000); return; }
      if (chewing()) return busyToast();
      g = gLoad(); const y = g.toys[i]; if (!y || y.uses >= TOY_LIFE) return;
      y.uses++; g.playTotal = (g.playTotal || 0) + 1; if (y.type === 'chew') g.chewUntil = Date.now() + CHEW_MS; gSave(g); care('toy', 10);
      const worn = y.uses >= TOY_LIFE; if (state === 'grumpy') state = 'idle'; wrap.classList.remove('turned');
      const end = () => { play = null; recheck(); bars(); if (worn) later(800, () => toast(withName(tf('toyWorn', t('shop_' + y.type))), 3500)); };
      play = { pet: () => {} };
      if (y.type === 'ball') comeHome(() => playBall(end)); else if (y.type === 'rope') comeHome(() => playRope(end)); else { play = null; chew(g.chewUntil); end(); }
    });
  };
  $('#gToyBtn').onclick = openToys;
  // ball: the ball appears at the bottom of the screen; swipe it up to throw. He runs off (gets smaller), catches it and brings it back
  const playBall = end => {
    play = { pet: () => {} }; gBusy = true; stopTimer();
    const scene = $('#gScene'), ball = $('#gBall'), hand = $('#gHand'), G = geo(), { W, homeX, homeY, HZ } = G;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    draw('sit', 'super', 'r-wiggle wagfast'); hand.classList.remove('hidden'); hand.style.cssText = ''; $('#gTip').classList.remove('hidden');
    let samples = [], down = false, start = null;
    const at = e => [performance.now(), e.clientX, e.clientY];
    hand.onpointerdown = e => { e.preventDefault(); try { hand.setPointerCapture(e.pointerId); } catch (x) {} down = true; start = [e.clientX, e.clientY]; samples = [at(e)]; hand.style.transition = 'none'; };
    hand.onpointermove = e => { if (!down) return; const s1 = at(e); samples.push(s1); samples = samples.filter(q => s1[0] - q[0] < 110);
      hand.style.transform = `translate(calc(-50% + ${(e.clientX - start[0]) * .5}px), ${(e.clientY - start[1]) * .5}px)`; };
    hand.onpointerup = hand.onpointercancel = e => { if (!down) return; down = false; samples.push(at(e)); samples = samples.filter(q => samples[samples.length - 1][0] - q[0] < 110);
      const a = samples[0], z = samples[samples.length - 1], dt = Math.max(16, z[0] - a[0]), vx = (z[1] - a[1]) / dt, vy = (z[2] - a[2]) / dt, sp = Math.hypot(vx, vy);
      if (sp < .3 || vy > -.15) { hand.style.transition = 'transform .25s'; hand.style.transform = ''; $('#gTip').classList.add('r-shake'); later(600, () => $('#gTip').classList.remove('r-shake')); return; } // too soft, or not upwards: try again
      $('#gTip').classList.add('hidden'); hand.onpointerdown = hand.onpointermove = hand.onpointerup = hand.onpointercancel = null; toss(vx / sp, -vy / sp, sp); };
    g = gLoad(); const fk = skill(g, 'fetch'), learnt = practise(g, 'fetch'), spd = speedK(g); if (fk >= 30) train(g, 'str', .01); gSave(g);
    const mode = fk < 30 ? 'lost' : fk < 60 ? 'keep' : 'fetch';
    const toss = (dx, up, sp) => {
      // where it lands: the faster the swipe the farther (higher up the lawn); left/right follows the finger
      const reach = Math.max(.08, Math.min(1, (sp - .3) / 2.4)), ly = homeY - 12 - reach * (homeY - 12 - HZ);
      const lx = Math.max(20, Math.min(W - 20, W / 2 + dx / Math.max(.35, up) * (homeY - ly + 120) * .55));
      const r0 = hand.getBoundingClientRect(), sr = scene.getBoundingClientRect(), x0 = r0.left + r0.width / 2, y0 = r0.top + r0.height / 2;
      const x1 = sr.left + lx, y1 = sr.top + ly - 12, w0 = r0.width, w1 = 34 * depth(ly, G), T = 650 + reach * 650, arc = 80 + reach * 160, t0 = performance.now();
      hand.style.transition = 'none'; hand.style.transform = 'none'; hand.style.left = x0 + 'px'; hand.style.top = y0 + 'px'; hand.style.bottom = 'auto'; hand.style.marginLeft = (-w0 / 2) + 'px'; hand.style.marginTop = (-w0 / 2) + 'px';
      const fly = now => { if (!alive()) return; const k = Math.min(1, (now - t0) / T), e = 1 - Math.pow(1 - k, 2), w = w0 + (w1 - w0) * e;
        hand.style.left = (x0 + (x1 - x0) * e) + 'px'; hand.style.top = (y0 + (y1 - y0) * e - arc * Math.sin(Math.PI * k)) + 'px'; hand.style.width = w + 'px'; hand.style.marginLeft = hand.style.marginTop = (-w / 2) + 'px';
        hand.style.transform = `rotate(${k * 540}deg)`;
        if (k < 1) requestAnimationFrame(fly); else land(lx, ly, w1, T); };
      requestAnimationFrame(fly);
      if (mode === 'lost') later(T * .5, () => { draw('sit', 'open', 'r-tilt'); $('#gQ').classList.remove('hidden'); }); // no idea what just happened
      else later(T * .35, () => { const right = lx > homeX; move('super', 'wagfast', true); place(lx - homeX + (right ? -14 : 14) * depth(ly, G), ly - homeY, depth(ly, G), (500 + Math.abs(ly - homeY) * 4 + Math.abs(lx - homeX) * 2) / spd, right); });
    };
    const land = (lx, ly, w, T) => {
      hand.classList.add('hidden'); hand.style.cssText = '';
      ball.className = 'ballfly'; ball.style.cssText = `left:${lx - w / 2}px;top:${ly - w}px;width:${w}px;bottom:auto;transform:none`;
      const runMs = (500 + Math.abs(ly - homeY) * 4 + Math.abs(lx - homeX) * 2) / spd, wait = Math.max(250, runMs - T * .65);
      const learnMsg = () => { if (learnt === 'learned') later(900, () => { toast(`🎉 ${pupName()} learned to fetch!`, 3500); fx('🎓✨🎾', 6); }); else if (learnt === 'half') later(900, () => toast(`🎾 ${pupName()} is starting to chase the ball!`, 3200)); };
      if (mode === 'lost') { // sits there with a question mark; you go and pick the ball up
        later(1800, () => { draw('sit', 'open', 'r-look'); });
        later(2600, () => { $('#gQ').classList.add('hidden'); ball.className = 'ballfly hidden'; ball.style.cssText = ''; toast(`${pupName()} has no idea what to do with the ball yet. Keep throwing to teach it!`, 3600); learnMsg(); gBusy = false; end(); rest(); });
        return; }
      if (mode === 'keep') { // runs to it, then lies down and chews it instead of bringing it back
        later(wait, () => { ball.className = 'ballfly hidden'; place(lx - homeX, ly - homeY, depth(ly, G), 0, false); draw('lie', 'happy', 'r-chompl wagfast'); carry.className = 'carry chewing'; carry.innerHTML = toySvg('ball'); fx('🎾', 2); });
        later(wait + 2800, () => { carry.innerHTML = ''; carry.className = 'carry'; toast(`${pupName()} keeps the ball to play with. Almost there!`, 3000); comeHome(() => { learnMsg(); gBusy = false; end(); rest(); }, false); });
        return; }
      later(wait, () => { // got it!
        ball.className = 'ballfly hidden'; carry.className = 'carry mouth'; carry.innerHTML = toySvg('ball'); draw('sit', 'happy', 'r-jump wagfast'); place(lx - homeX, ly - homeY, depth(ly, G), 0, false);
        later(700, () => { carry.className = 'carry mouth runm'; move('happy', 'wagfast', true); place(0, 0, 1, runMs, lx < homeX); });
        later(700 + runMs, () => { carry.innerHTML = ''; carry.className = 'carry'; place(0, 0, 1, 0, false); draw('sit', 'super', 'r-jump wagfast'); fx('🎾💖✨', 6); learnMsg();
          ball.className = 'ballfly'; ball.style.cssText = ''; });
        later(2400 + runMs, () => { ball.className = 'ballfly hidden'; ball.style.cssText = ''; gBusy = false; end(); rest(); });
      });
    };
  };
  // rope: tug-of-war. The rope hangs straight down from his mouth; hold the knot and pull any way you like —
  // even out of the garden, anywhere on the screen. Let go = he wins; a quick strong yank (or pulling far) = you win.
  const playRope = end => {
    gBusy = true; stopTimer(); const rope = $('#gRope'), knot = $('#gKnot'), ro = $('#gRopeO'), ri = $('#gRopeI');
    g = gLoad(); const S = stat(g, 'str'); train(g, 'str', .02); gSave(g); let facing = false;
    draw('sit', 'tug', 'r-tug wagfast'); place(0, 0, 1, 0, false);
    const mouth = () => { const r = pup.getBoundingClientRect(); return holding ? [r.left + r.width * (facing ? .59 : .41), r.top + r.height * .54] : [r.left + r.width * .5, r.top + r.height * (124 / 240)]; };
    const VW = () => innerWidth, VH = () => innerHeight;
    let kx = 0, ky = 0, holding = false, done = false, grab = [0, 0], samples = [], raf = 0, jig = 0;
    let [mx, my] = mouth(); const home = [mx, Math.min(VH() - 24, my + 84)]; kx = home[0]; ky = home[1];
    rope.classList.remove('hidden'); knot.classList.remove('hidden');
    const drawRope = () => { [mx, my] = mouth(); const cx = (mx + kx) / 2, cy = (my + ky) / 2 + 14; const d = `M${mx} ${my} Q${cx} ${cy} ${kx} ${ky}`; ro.setAttribute('d', d); ri.setAttribute('d', d); knot.style.left = kx + 'px'; knot.style.top = ky + 'px'; };
    const loop = () => { if (!alive() || done) return; jig++;
      if (!holding) { const w = Math.sin(jig / 9) * 4; kx = home[0] + w * .6; ky = home[1] - Math.abs(w); } // he shakes the rope while waiting
      const vx = kx - home[0], vy = ky - home[1], len = Math.hypot(vx, vy) || 1, pull = Math.min(30, len * .15) * (.6 + S / 100);
      if (holding) { const f = kx < home[0]; if (f !== facing) { facing = f; } }
      place(holding ? vx / len * pull - vx / len * 6 * Math.abs(Math.sin(jig / 5)) * (.5 + S / 100) : 0, holding ? Math.min(0, vy / len * pull * .4) : 0, 1, 120, holding && facing);
      if (holding && S >= 80 && Math.random() < (S - 75) / 25 * .004) { toast(`💪 ${pupName()} is so strong it yanked the rope away!`, 3000); finish(false); return; } // very strong pups can win
      drawRope(); raf = requestAnimationFrame(loop); };
    toast(withName(t('ropeHint')), 3200); loop();
    const finish = userWins => { if (done) return; done = true; cancelAnimationFrame(raf); clearTimeout(auto); holding = false;
      knot.onpointerdown = knot.onpointermove = knot.onpointerup = knot.onpointercancel = null; facing = false;
      if (userWins) { // you yank it away: he tumbles, then bounces up thrilled
        const vx = kx - home[0], vy = ky - home[1], len = Math.hypot(vx, vy) || 1; kx += vx / len * 260; ky += vy / len * 260;
        knot.style.transition = 'left .4s ease-out, top .4s ease-out'; drawRope(); place(-vx / len * 14, 0, 1, 300, false); draw('lie', 'super', 'r-roll');
        later(500, () => { rope.classList.add('hidden'); knot.classList.add('hidden'); knot.style.transition = ''; });
        later(900, () => { draw('sit', 'super', 'r-jump wagfast'); place(0, 0, 1, 300, false); fx('💖✨🎉', 6); });
        later(2800, () => { gBusy = false; end(); rest(); });
      } else { // you let go: he wins the rope and runs a victory lap with it
        rope.classList.add('hidden'); knot.classList.add('hidden'); carry.className = 'carry mouth rope'; carry.innerHTML = toySvg('rope'); draw('sit', 'super', 'r-shake wagfast'); place(0, 0, 1, 200, false);
        later(900, () => { carry.className = 'carry mouth runm rope'; move('super', 'wagfast', true); place(-90, -30, .85, 900, false); });
        later(1800, () => { place(90, -30, .85, 1400, true); });
        later(3200, () => { place(0, 0, 1, 900, false); });
        later(4100, () => { carry.innerHTML = ''; carry.className = 'carry'; draw('sit', 'super', 'r-jump wagfast'); fx('💖🏆✨', 6); });
        later(5800, () => { gBusy = false; end(); rest(); });
      } };
    knot.onpointerdown = e => { e.preventDefault(); try { knot.setPointerCapture(e.pointerId); } catch (x) {} holding = true; grab = [e.clientX - kx, e.clientY - ky]; samples = []; draw('pull', 'strain', 'r-tug r-tugfast'); };
    knot.onpointermove = e => { if (!holding || done) return;
      kx = Math.max(16, Math.min(VW() - 16, e.clientX - grab[0])); ky = Math.max(16, Math.min(VH() - 16, e.clientY - grab[1]));
      const now = performance.now(); samples.push([now, e.clientX, e.clientY]); samples = samples.filter(s => now - s[0] < 160);
      const far = Math.hypot(kx - home[0], ky - home[1]);
      if (samples.length > 1) { const a = samples[0], b = samples[samples.length - 1], v = Math.hypot(b[1] - a[1], b[2] - a[2]) / Math.max(1, b[0] - a[0]); if (v > 1.5 + S / 100 || far > 150 + S * 2) finish(true); } };
    knot.onpointerup = knot.onpointercancel = () => { if (holding && !done) finish(false); };
    play = { pet: () => {} };
    const auto = setTimeout(() => { if (alive()) finish(false); }, 25e3);
  };
  // ---- a living puppy: he wanders around the lawn and does all sorts of things on his own ----
  const spot = () => { const G = geo(); return [G.W * (.12 + Math.random() * .76), G.HZ + 8 + Math.random() * (G.homeY - G.HZ - 8)]; };
  const butterfly = () => { const b = document.createElement('span'); b.className = 'fly'; b.textContent = '🦋'; $('#gFx').appendChild(b); setTimeout(() => b.remove(), 4000); };
  const ACTS = [
    () => draw('sit', 'open', 'r-tilt'), () => draw('sit', 'open', 'r-look'), () => draw('sit', 'sleep', 'r-twitch'),
    () => draw('sit', 'happy', 'wagfast'), () => draw('nose', 'eatdown', 'r-dig wagfast'), () => draw('nose', 'eatdown', 'r-sniff'),
    () => draw('sit', 'sleep', 'r-stretch'), () => draw('lie', 'open', 'r-breathe'), () => draw('lie', 'happy', 'r-roll'),
    () => draw('sit', 'super', 'r-spin wagfast'), () => { draw('sit', 'super', 'r-jump wagfast'); fx('🎵', 2); },
    () => { draw('sit', 'open', 'r-look'); butterfly(); },
    () => roam(done => { draw('lie', 'sleep', 'r-breathe sleeping'); const tok = roamTok; later(7000, () => { if (tok !== roamTok) return; done(); draw('sit', 'sleep', 'r-stretch'); }); }),
    () => roam(done => { const [x1, y1] = spot(); goTo(x1, y1, () => { const [x2, y2] = spot(); goTo(x2, y2, () => { done(); draw('sit', 'super', 'r-wiggle wagfast'); fx('💨', 2); }, true, 'super'); }, true, 'super'); }) // zoomies
  ];
  const wander = () => roam(done => { const [x, y] = spot(); goTo(x, y, () => { done(); ACTS[Math.floor(Math.random() * ACTS.length)](); }, false); });
  clearInterval(viewGarden._iv); clearInterval(viewGarden._sky);
  const tick = () => { if (!alive()) { clearInterval(viewGarden._iv); stopWalk(); clearInterval(timerT); return; }
    const before = (g.poos || []).length, lv0 = waterLevel(g); g = gLoad(); if (g.poos.length !== before) poos(); if (waterLevel(g) !== lv0) bars();
    window.__gTick = Date.now();
    if (gBusy || walkT || play || roaming) return;
    if (chewing()) return;
    const pd = pottyDue(); if (pd && !eating()) { toilet(pd); return; }
    if (state !== 'sick' && fullness(g) < HUNGRY && (g.bowl || 0) > 0 && !eating()) { eatMeal(); return; }
    if (waterLevel(g) < 4 && (Date.now() > drinkAt || wantDrinkNow)) { wantDrinkNow = false; drink(); return; }
    if (g.poos.length > before && state !== 'weak') { state = 'dirty'; draw('sit', 'sad', 'r-sigh'); return; }
    if (state !== 'weak' && waterLevel(g) >= 4 && state !== 'thirsty') state = 'thirsty';
    if (state === 'sick') { if (!isSick(g)) { recheck(); bars(); gBusy = true; draw('sit', 'super', 'r-jump wagfast'); fx('💖✨', 5); toast(`🎉 ${pupName()} feels better!`, 2600); later(1500, () => { gBusy = false; rest(); }); }
      else draw('lie', 'sick', 'r-breathe weak' + (Math.random() < .3 ? ' r-sigh' : '')); return; }
    if (isSick(g)) { state = 'sick'; rest(); bars(); return; }
    if (state === 'weak') { draw('lie', 'sad', 'r-breathe weak' + (Math.random() < .3 ? ' r-sigh' : '')); return; }
    if (state === 'thirsty') { // goes to sniff the dirty bowl, then sits by it panting
      if (Math.random() < .35) { const G = geo(); roam(done => goTo(G.W - 74, G.SH - 10, () => { draw('nose', 'eatdown', 'r-sniff'); const tok = roamTok; later(1400, () => { if (tok !== roamTok) return; done(); draw('sit', 'sad', 'r-shake'); fx('💧', 1); }); }, false, 'sad')); }
      else draw('sit', 'thirsty', 'r-pant'); return; }
    if (state === 'grumpy') { draw('sit', 'grumpy', Math.random() < .5 ? 'r-look' : 'r-twitch'); return; }
    if (state === 'dirty') { draw('sit', 'sad', Math.random() < .5 ? 'r-look' : 'r-sigh'); return; }
    if (night && Math.random() < .5) { if (Math.random() < .3) { const G = geo(); roam(done => goTo(64, G.HZ + 14, () => { done(); draw('sleep', 'sleep', 'r-breathe sleeping'); }, false)); } else draw('sleep', 'sleep', 'r-breathe sleeping'); return; }
    if (Math.random() > .4 + stat(g, 'en') / 150) { Math.random() < .5 ? draw('lie', 'sleep', 'r-breathe sleeping') : draw('lie', 'open', 'r-breathe'); bars(); return; } // low-energy pups rest more
    if (Math.random() < .5) wander(); else ACTS[Math.floor(Math.random() * ACTS.length)]();
    bars(); };
  window.__gTick = Date.now(); viewGarden._iv = setInterval(tick, 4200);
  viewGarden._sky = setInterval(() => { if (!$('#gScene')) { clearInterval(viewGarden._sky); return; } loadWx(); }, 60e3);
}
// header puppy: a hint dot when the puppy needs attention
function gardenDot() { const g = gLoad(); if (!g.pup) return '<span class="gdot">🐾</span>'; const m = gMood(g); return m === 'shelter' || m === 'sick' || m === 'weak' || m === 'grumpy' || m === 'dirty' || m === 'thirsty' ? '<span class="gdot">!</span>' : ''; }

const COLLAR_PRICE = 5;
const collarName = x => `${x.c[0].toUpperCase() + x.c.slice(1)} · ${x.t} tag`;
const collarIcon = x => `<svg class="cicon" viewBox="0 0 60 44" aria-hidden="true"><ellipse cx="30" cy="16" rx="24" ry="11" fill="none" stroke="#15151a" stroke-width="9"/><ellipse cx="30" cy="16" rx="24" ry="11" fill="none" stroke="${COLLAR_COLS[x.c]}" stroke-width="4.5"/><circle cx="30" cy="33" r="8" fill="${TAG_COLS[x.t]}" stroke="#15151a" stroke-width="3.5"/></svg>`;
const PEE_SVG = '<svg viewBox="0 0 60 24" class="peesvg" aria-hidden="true"><ellipse cx="30" cy="13" rx="27" ry="9" fill="#ffe36e" stroke="#c9a400" stroke-width="2.5"/><ellipse cx="22" cy="10" rx="8" ry="2.5" fill="#fff6c0"/></svg>';
const PILL_SVG = '<svg class="pill" viewBox="0 0 60 40" aria-hidden="true"><g transform="rotate(-25 30 20)"><path d="M14 10 h16 v20 h-16 a10 10 0 0 1 0 -20z" fill="#ff7a59" stroke="#15151a" stroke-width="3.5"/><path d="M30 10 h16 a10 10 0 0 1 0 20 h-16z" fill="#fff" stroke="#15151a" stroke-width="3.5"/><path d="M12 15 q4 -3 9 -2" stroke="#fff" stroke-width="2.5" fill="none" stroke-linecap="round"/></g></svg>';
/* ---------- puppy info card (abilities stay hidden) + pet hotel ---------- */
function openPupInfo() {
  const g = gLoad(), p = g.pup; if (!p) return; const b = bondOf(g), fk = skill(g, 'fetch');
  const fetchTag = fk >= 60 ? '🎾 Fetch ✓' : fk > 0 ? '🎾 Fetch (learning)' : '🎾 Fetch (not yet)';
  const m = showSheet(`<div class="pinfo"><div class="ic"><div class="av">${regenB('sit', isSick(g) ? 'sad' : 'happy', p.color, g.wear || null)}</div><div><div class="nm">${esc(p.name)}</div>
      <span class="ptag">${stageTxt(p)}</span><span class="ptag ${isSick(g) ? 'r' : 'g'}">${isSick(g) ? '🤒 Sick' : 'Healthy'}</span><span class="ptag">${PERSONA_TXT[p.per] || ''}</span></div></div>
    <div class="prows"><div><span>Age</span><b>${ageTxt(p)}</b></div><div><span>Adopted</span><b>${new Date(p.adopted).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}</b></div>
      <div><span>Weight</span><b>${pupKg(p)} kg</b></div>
      <div class="blk"><span>Bond</span><b style="float:right">Lv ${b.L} · ${b.cur}/${b.need}</b><div class="pbond"><i style="width:${Math.round(b.cur / b.need * 100)}%"></i></div></div>
      <div class="blk"><span>Skills</span><div class="psk"><span>${fetchTag}</span><span>🚽 Toilet ${skill(g, 'toilet') >= TOILET_OK ? '✓' : skill(g, 'toilet') > 0 ? '(learning)' : '(not yet)'}</span>${CMDS.map(c => c.L > b.L ? `<span class="lk">🔒 ${c.e} ${c.n} · Lv ${c.L}</span>` : `<span>${c.e} ${c.n} ${skill(g, c.id) >= CMD_OK ? '✓' : skill(g, c.id) > 0 ? '(learning)' : '(new)'}</span>`).join('')}</div></div></div>
    <div class="prows"><div class="blk"><span>Collars</span><div class="cown"><button class="cw${!g.wear ? ' on' : ''}" data-w="-1"><span class="none">∅</span>None</button>${(g.collars || []).map((x, i) => `<button class="cw${g.wear && g.wear.c === x.c && g.wear.t === x.t ? ' on' : ''}" data-w="${i}">${collarIcon(x)}${collarName(x)}</button>`).join('')}</div>
      ${(g.collars || []).length ? '' : '<div class="muted" style="font-size:12px">Buy collars in the shop 🛒</div>'}</div></div>
    <div class="muted" style="margin-top:6px">Commands unlock as your bond grows. Train them with 🎓.</div>
    <div class="row" style="margin-top:12px"><button class="btn sec" id="piClose" style="margin:0">${t('close')}</button><button class="btn sec" id="piHotel" style="margin:0">🏨 Pet hotel</button></div></div>`);
  m.querySelector('#piClose').onclick = closeSheet; m.querySelector('#piHotel').onclick = openHotel;
  m.querySelectorAll('[data-w]').forEach(b => b.onclick = () => { const g2 = gLoad(), i = +b.dataset.w, x = (g2.collars || [])[i]; g2.wear = x ? { c: x.c, t: x.t } : null; gSave(g2); pupCollar = g2.wear; openPupInfo(); viewGarden._rest && viewGarden._rest(); });
}
function openHotel() {
  const g = gLoad(); if (!g.pup) return; let days = 3;
  const draw = () => { const m = showSheet(`<h2 style="margin-top:0">🏨 Pet hotel</h2><div>Going away? ${esc(g.pup.name)} can stay at the pet hotel for up to 7 days. It is fed and cared for, so it won't go to the shelter, but it won't learn or grow its bond while away.</div>
      <div class="hdays">${[1, 2, 3, 4, 5, 6, 7].map(d => `<button class="chip${d === days ? ' on' : ''}" data-d="${d}">${d} day${d > 1 ? 's' : ''}</button>`).join('')}</div>
      <div class="row"><button class="btn sec" id="hoCancel" style="margin:0">${t('close')}</button><button class="btn" id="hoGo" style="margin:0">Check in · free</button></div>`);
    m.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { days = +b.dataset.d; draw(); });
    m.querySelector('#hoCancel').onclick = closeSheet;
    m.querySelector('#hoGo').onclick = () => { const g2 = gLoad(); g2.vac = { from: Date.now(), until: Date.now() + days * 864e5 }; gSave(g2); closeSheet(); viewGarden(); }; };
  draw();
}
function viewHotel() {
  const g = gLoad(), p = g.pup; pupCollar = g.wear || null; setHeader('🏨 Pet hotel', true); setTab('home');
  app.innerHTML = `<div class="garden big hotelsc"><div class="hsign">🏨 Paws Inn · Pet hotel</div><div class="pupwrap"><div class="pup">${regenB('sleep', 'sleep', p.color, g.wear || null)}</div></div></div>
    <div class="card" style="text-align:center"><b>${esc(p.name)} is relaxing at the pet hotel</b><div class="muted">Pick-up: ${new Date(g.vac.until).toLocaleString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</div></div>
    <button class="btn" id="hoBack">Pick up ${esc(p.name)} now</button>`;
  $('#hoBack').onclick = () => { const g2 = gLoad(); if (g2.vac) g2.vac.until = Date.now(); gSave(g2); viewGarden(); };
}
/* ---------- shelter: no care for 24 hours. Pay 10 coins to bring the puppy home ---------- */
function viewShelter() {
  const g = gLoad(), p = g.pup; pupCollar = g.wear || null; setHeader('🏠 Pup shelter', true); setTab('home');
  const can = (g.coins || 0) >= SHELTER_FEE;
  app.innerHTML = `<div class="garden big shelsc"><div class="ssign">🏠 Calgary Pup Shelter</div><div class="pupwrap"><div class="pup">${regenB('sit', 'sad', p.color, g.wear || null)}</div></div>
      <div class="sbars"></div><div class="snote">No one took care<br>of me for a day 🥺</div></div>
    <div class="card"><b>${esc(p.name)} is at the shelter</b><div style="margin-top:4px">${esc(p.name)} went without care for over a day (no food, water or visits), so the shelter took it in to keep it safe.
      Pay the fee to bring it home. Skills are kept; your bond drops 1 level.</div><div class="muted" style="margin-top:6px">${cn(tf('shopCoins', g.coins || 0))}</div></div>
    <button class="btn" id="shBack" ${can ? '' : 'disabled'}>Bring ${esc(p.name)} home · ${SHELTER_FEE} ${COIN_SVG}</button>
    ${can ? '' : `<div class="muted" style="text-align:center;margin-top:6px">Not enough coins? Log a price for 1 coin; add a new product for 2 more (up to ${COIN_CAP} a day).</div>`}`;
  $('#shBack').onclick = () => { const g2 = gLoad(); if ((g2.coins || 0) < SHELTER_FEE) return;
    g2.coins -= SHELTER_FEE; const L = bondOf(g2).L; if (L > 1) g2.xp = xpAt(L - 1); delete g2.shelter; delete g2.sick;
    g2.lastVisit = Date.now(); g2.lastFed = Date.now(); g2.recentFeeds = 1; g2.waterAt = Date.now(); g2.poos = []; g2.pendingPoo = 0; g2.joyV = 30; g2.joyAt = Date.now(); // the shelter fed and cleaned it
    gSave(g2); toast(`🏡 ${p.name} is home! It missed you.`, 3000); viewGarden(); };
}

/* ---------- First visit: adopt a puppy at the pet shop (pick colour, then a name) ---------- */
function viewAdopt() {
  const g0 = gLoad(); if (g0.pup && g0.pup.name) return viewGarden(); // adoption is a promise: colour and name can't be changed later
  if (!syncOn()) { setHeader(t('adoptTitle'), true); setTab('home');
    app.innerHTML = `<div class="shop small"><div class="pups one"><div class="pupbox on">${regenSvg('sit', 'open', 'brown')}<span class="cushion"></span></div></div></div>
      <div class="card" style="text-align:center"><b>Sign in to adopt a puppy</b><div class="muted" style="margin-top:4px">Your puppy is saved to your Google account, so it's never lost when you change or reset your phone.</div></div>
      <button class="btn" id="adSign">Sign in with Google</button>`;
    $('#adSign').onclick = async () => { await signIn(); if (syncOn()) viewGarden(); }; return; }
  let color = '';
  setHeader(t('adoptTitle'), true); setTab('home');
  const shop = () => {
    app.innerHTML = `<div class="shop"><div class="shopsign">🐾 ${t('adoptShop')} 🐾</div><div class="shelf"></div>
      <div class="pups">${['white', 'black', 'brown'].map(c => `<button class="pupbox${c === color ? ' on' : ''}" data-c="${c}">${regenSvg('sit', c === color ? 'super' : 'open', c)}<span class="cushion"></span><b>${t('col_' + c)}</b></button>`).join('')}</div></div>
      <div class="card" style="text-align:center"><b>${t('adoptHello')}</b><div class="muted">${t('adoptPick')}</div></div>
      <button class="btn" id="adNext" ${color ? '' : 'disabled'}>${t('adoptThis')}</button>`;
    app.querySelectorAll('.pupbox').forEach(b => b.onclick = () => { color = b.dataset.c; shop(); const el = app.querySelector(`.pupbox[data-c="${color}"]`); el.classList.add('r-jump'); });
    $('#adNext').onclick = () => color && nameIt();
  };
  const nameIt = () => {
    app.innerHTML = `<div class="shop small"><div class="pups one"><div class="pupbox on">${regenSvg('sit', 'super', color)}<span class="cushion"></span></div></div></div>
      <div class="card"><label>${t('adoptName')}</label><input id="adName" maxlength="12" placeholder="${esc(t('adoptNamePh'))}"><div class="muted" style="margin-top:8px">${t('adoptPromise')}</div></div>
      <div class="row"><button class="btn sec" id="adBack" style="margin:0">‹ ${t('adoptBack')}</button><button class="btn" id="adDone" style="margin:0">${t('adoptDone')}</button></div>`;
    $('#adName').focus();
    $('#adBack').onclick = shop;
    $('#adDone').onclick = () => {
      const name = $('#adName').value.trim(); if (!name) return toast(t('adoptNeedName'));
      const g = gLoad(); if (g.pup && g.pup.name) return viewGarden(); const first = true; g.pup = newPup(color, name); delete g.sick; delete g.shelter; delete g.vac; g.coins = (g.coins || 0) + 10; g.bowl = BOWL_MAX; delete g.pendingPee; delete g.pendingPoo;
      if (first) { g.lastFed = g.lastFed || Date.now(); g.lastPet = Date.now(); g.lastVisit = Date.now(); } // a new puppy starts happy
      gSave(g); pupColor = color; setAppIcon(color);
      app.innerHTML = `<div class="shop small"><div class="pups one"><div class="pupbox on r-jump">${regenSvg('sit', 'super', color)}<span class="cushion"></span></div></div><div class="fx" id="gFx"></div></div>
        <div class="card" style="text-align:center"><b>${tf('adoptWelcome', esc(name))}</b><div class="muted" style="margin-top:4px">🎁 Welcome gift: 10 ${COIN_SVG} to spend in the shop</div></div>`;
      const box = $('#gFx'); ['💕', '🎉', '✨', '💖', '🐾'].forEach((c, i) => { const sp = document.createElement('span'); sp.textContent = c; sp.style.left = (25 + i * 12) + '%'; sp.style.animationDelay = i * .15 + 's'; box.appendChild(sp); });
      setTimeout(() => { if (location.hash === '#garden') viewGarden(); }, 2200);
    };
  };
  shop();
}


/* ---------- 5.4 Scan: one screen per product. Users never pick categories: unknown products are saved as "unsorted"
   (shared with everyone by barcode) and Claude sorts them into items when the power user asks for a data audit ---------- */
function storePicker(geoEl, chipsEl, otherEl) {
  let chain = chainOf(lsGet('lastStore') || ''), list = CHAINS.map(c => ({ c }));
  const draw = () => { chipsEl.innerHTML = list.map(x => `<button type="button" class="chip${x.c === chain ? ' on' : ''}" data-c="${esc(x.c)}">${esc(x.c)}${x.km != null ? `<small> · ${fmtKm(x.km)}</small>` : ''}</button>`).join('') + `<button type="button" class="chip${chain === '__other' ? ' on' : ''}" data-c="__other">Other…</button>`;
    chipsEl.querySelectorAll('.chip').forEach(b => b.onclick = () => { chain = b.dataset.c; otherEl.classList.toggle('hidden', chain !== '__other'); draw(); if (chain === '__other') otherEl.focus(); }); };
  const find = async () => { geoEl.textContent = '📍 Finding stores near you…';
    try { const p = await getPos(); if (!inCalgary(p)) { geoEl.textContent = "🗺️ You're outside Calgary. PricePup is for Calgary only for now, so prices logged here aren't counted."; return; }
      list = nearestChains(p); if (list[0].km != null && list[0].km <= .5) chain = list[0].c; draw(); geoEl.textContent = list[0].km <= .5 ? `📍 You're at ${list[0].c}` : '📍 Nearest stores first'; }
    catch (e) { geoEl.innerHTML = `${esc(geoMsg(e))} <button type="button" class="btn sec small" style="display:inline-block;width:auto;margin:4px 0 0">Try again</button>`; geoEl.querySelector('button').onclick = find; } };
  draw(); find();
  return { get: () => chain === '__other' ? (chainOf(otherEl.value) || otherEl.value.trim()) : chain };
}
async function checkCalgary() { try { const p = await getPos(); if (!inCalgary(p)) { toast("🗺️ PricePup is for Calgary only for now. Prices logged outside Calgary aren't counted.", 4200); return false; } return true; } catch (e) { toast(geoMsg(e), 4200); return false; } }
// read a shelf tag: product name lines, size ("10 x 130 g") and the price
// 5.5 size: a number + a unit, or "sold by weight" (priced per lb / kg)
const SIZE_UNITS = ['g', 'kg', 'mL', 'L', 'lb', 'EA'];
function qtySplit(q) { q = String(q || '').trim(); if (!q || /weight/i.test(q)) return { n: '', u: 'g' };
  const U = s => { s = (s || '').toLowerCase(); return /^(g|gr|grams?)$/.test(s) ? 'g' : s === 'kg' ? 'kg' : s === 'ml' ? 'mL' : s === 'l' ? 'L' : /^lbs?$/.test(s) ? 'lb' : s === 'oz' ? 'oz' : /^(ea|ct|count|pk|pack|pcs?|rolls?|rol|bags?|sheets?|cups?)$/.test(s) ? 'EA' : ''; };
  let m = q.match(/(\d+(?:[.,]\d+)?)\s*[x×X]\s*(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)/);
  if (m && U(m[3]) && U(m[3]) !== 'EA') { let n = parseFloat(m[1].replace(',', '.')) * parseFloat(m[2].replace(',', '.')), u = U(m[3]); if (u === 'oz') { n *= 28.35; u = 'g'; } return { n: String(+n.toFixed(2)), u }; }
  m = q.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z]+)?/); if (!m) return { n: '', u: 'g' };
  let u = U(m[2]) || 'EA', n = parseFloat(m[1].replace(',', '.')); if (u === 'oz') { n = Math.round(n * 28.35); u = 'g'; }
  return { n: String(n), u }; }
function sizeHTML(p, q, byW) { const { n, u } = qtySplit(q);
  return `<div id="${p}SizeRow"${byW ? ' class="hidden"' : ''}><label>Size</label><div style="display:flex;gap:8px"><input id="${p}SizeN" inputmode="decimal" placeholder="e.g. 500" value="${esc(n)}" style="flex:1.4"><select id="${p}SizeU" style="flex:1">${SIZE_UNITS.map(x => `<option${x === u ? ' selected' : ''}>${x}</option>`).join('')}</select></div><div class="muted">EA = pieces, cups, rolls or bags in the pack.</div></div>
    <label class="ck"><input id="${p}ByW" type="checkbox"${byW ? ' checked' : ''}> Sold by weight (priced per lb or kg), e.g. loose fruit and veg</label>`; }
function sizeWire(p, root = document) { const w = root.querySelector('#' + p + 'ByW'); w.onchange = () => root.querySelector('#' + p + 'SizeRow').classList.toggle('hidden', w.checked); }
function sizeGet(p, root = document) { const byW = root.querySelector('#' + p + 'ByW').checked, n = parseFloat((root.querySelector('#' + p + 'SizeN').value || '').replace(',', '.')), u = root.querySelector('#' + p + 'SizeU').value;
  return byW ? { quantity: 'Sold by weight', byWeight: true } : { quantity: n > 0 ? `${+n} ${u}` : '', byWeight: false }; }
function tagParse(text) {
  const lines = (text || '').split('\n').map(s => s.replace(/[|_~=]+/g, ' ').replace(/\s+/g, ' ').trim()).filter(s => s.length > 1);
  const sm = (text || '').match(/(\d+)\s*[x×X]\s*(\d+(?:[.,]\d+)?)\s*(g|kg|ml|mL|l|L|lb|oz)\b/) || (text || '').match(/(\d+(?:[.,]\d+)?)\s*(g|kg|ml|mL|l|L|lb|oz)\b/);
  const size = sm ? sm[0].replace(/\s+/g, ' ').replace(/[×X]/, 'x') : '';
  const nameL = lines.filter(s => { const letters = (s.match(/[A-Za-z]/g) || []).length; return letters >= 3 && letters / s.replace(/\s/g, '').length > .7 && !/price|per |sell|unit|save|reg\b|each|ea\b|grams?\b|limit|\$/i.test(s) && !(sm && s.includes(sm[0])); }).slice(0, 2);
  const name = nameL.join(' ').toLowerCase().replace(/(^|\s)\w/g, m => m.toUpperCase());
  return { name, size };
}
async function handleBarcode(raw) { const code = normCode(raw); if (!code) return toast(t('badCode'));
  const hit = await findBarcode(code); // already sorted: open its product page (price history, deals, log a price)
  if (hit) { scanCtx = { code, itemId: hit.it.id, vid: hit.vid, known: true }; location.hash = `#variant/${encodeURIComponent(hit.it.id)}/${encodeURIComponent(hit.vid)}`; return; }
  location.hash = `#product/${code}`; }
async function viewProduct(code, logMode) { // product page (history, deal, Log button); #product/<code>/log = the log form
  setHeader(logMode ? 'Log a price' : 'Product', true); setTab('scan');
  app.innerHTML = `<div class="card empty">${dog('sniff', 'glass', 'bounce')}<div class="muted">Looking up ${esc(code)}…</div></div>`;
  const link = await findBarcode(code); let info = await bcGet(code);
  if (!info && !link) info = await findProduct(code);
  if (location.hash !== `#product/${code}` + (logMode ? '/log' : '')) return;
  if (!info && !link) return viewNewProduct(code);
  info = info || {};
  const it = link && link.it, va = link && (it.variants || {})[link.vid];
  const name = va ? variantText(it, link.vid) : ([info.brand, info.name].filter(Boolean).join(' ') || 'Unnamed product');
  const size = va ? '' : (info.quantity || ''), photo = (va && va.photo) || info.image || info.imageBig || '';
  const byW = !!(info.byWeight || (va && va.byWeight)); // sold by weight: prices are per lb / kg
  const rows = (await getAll('obs')).filter(o => (link && o.itemId === it.id && o.vid === link.vid) || o.bc === code).sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.ts || 0) - (a.ts || 0));
  const each = o => o.price / (o.multi || 1) / (o.per === 'kg' ? 2.2046 : 1), low = rows.length ? rows.reduce((m, o) => each(o) < each(m) ? o : m) : null, deal = rows.filter(o => o.sale && (!o.until || o.until >= today())).sort((a, b) => each(a) - each(b))[0];
  app.innerHTML = `
    <div class="card"><div class="item" style="padding:0;border:0">${thumb(photo, '📦')}<div class="main"><div class="name" style="white-space:normal">${esc(name)}</div>
      <div class="muted">${size ? esc(size) + ' · ' : ''}${link ? `<a href="#variant/${encodeURIComponent(it.id)}/${encodeURIComponent(link.vid)}" style="color:inherit">${esc(itemName(it))}</a>` : '🗂️ Not sorted yet'}</div></div>
      <button class="btn sec small" id="pEdit" style="flex:0 0 auto;margin:0">✏️ Edit</button></div></div>
    ${logMode ? '' : low ? `<div class="card"><div class="row" style="align-items:flex-start"><div><div class="muted">${t('histLow')}</div><div class="big-num">${money(each(low))}${byW ? '/lb' : ''}</div><div class="muted">${esc(low.store)} · ${fmtDate(low.date)}</div></div>
      ${deal ? `<div><div class="muted">🏷️ Current deal</div><div class="big-num">${money(each(deal))}${byW ? '/lb' : ''}</div><div class="muted">${esc(deal.store)}${deal.until ? ' · until ' + fmtDate(deal.until).slice(5) : ''}</div></div>` : ''}</div></div>` : ''}
    ${logMode ? '' : `<button class="btn" id="pLog">➕ Log a price</button>`}
    ${logMode ? '' : !rows.length ? `<div class="card empty">${dog('sniff', 'glass', 'bounce')}<div class="muted">No prices logged for this product yet. Be the first!</div></div>` : ''}
    ${!logMode && rows.length ? `<div class="card"><h2>Price history (${rows.length})</h2><table>${rows.slice(0, 40).map(o => `<tr><td>${esc(o.store)}<div class="muted">${fmtDate(o.date)}${o.sale ? ' · ' + t('sale') : ''}</div></td><td class="r"><b>${o.multi > 1 ? o.multi + ' for ' : ''}${money(o.price)}${o.per === 'lb' || o.per === 'kg' ? '/' + o.per : ''}</b></td></tr>`).join('')}</table></div>` : ''}
    ${logMode ? `<div class="card"><h2>Log the price</h2>
      ${byW ? `<div class="chips" id="pPer"><button type="button" class="chip on" data-p="lb">per lb</button><button type="button" class="chip" data-p="kg">per kg</button></div>` : ''}
      <label>Price ($${byW ? ' per <span id="pPerL">lb</span>' : ''})</label><input id="pPrice" class="big" inputmode="decimal" placeholder="0.00">
      <label class="ck${byW ? ' hidden' : ''}"><input id="pMultiOn" type="checkbox"> Multi-buy deal, e.g. "2 for $5"</label>
      <div id="pMultiRow" class="hidden"><label>How many for this price?</label><input id="pMulti" inputmode="numeric" value="2"><div class="muted">A box with 2 inside counts as 1.</div></div>
      <label>Store</label><div class="muted" id="pGeo"></div><div class="chips storechips" id="pChains"></div><input id="pStore" class="hidden" placeholder="Other store name">
      <label class="ck"><input id="pSale" type="checkbox"> ${t('sale')}</label></div>
    <button class="btn" id="pSave">${t('save')}</button>` : ''}`;
  $('#pEdit').onclick = () => editProduct(code, info, link, name, size);
  if (!logMode) { $('#pLog').onclick = () => location.hash = `#product/${code}/log`; return; }
  const sp = storePicker($('#pGeo'), $('#pChains'), $('#pStore'));
  $('#pMultiOn').onchange = () => $('#pMultiRow').classList.toggle('hidden', !$('#pMultiOn').checked);
  let per = 'lb'; if (byW) $('#pPer').querySelectorAll('.chip').forEach(b => b.onclick = () => { per = b.dataset.p; $('#pPer').querySelectorAll('.chip').forEach(x => x.classList.toggle('on', x === b)); $('#pPerL').textContent = per; });
  $('#pEdit').onclick = () => editProduct(code, info, link, name, size);
  $('#pSave').onclick = async () => {
    const price = parseFloat($('#pPrice').value); if (!(price > 0)) return toast(t('needPrice'));
    const store = sp.get(); if (!store) return toast('Pick the store first');
    if (!(await checkCalgary())) return;
    const multi = $('#pMultiOn').checked ? Math.max(2, parseInt($('#pMulti').value) || 2) : 1;
    const o = { id: newId(), price: Math.round(price * 100) / 100, multi: byW ? 1 : multi, per: byW ? per : 'pack', store, date: today(), sale: $('#pSale').checked, note: '', src: 'app', by: fbUser ? fbUser.uid : '', ts: Date.now(), bc: code };
    if (link) { o.itemId = it.id; o.vid = link.vid; } else { o.itemId = ''; o.vid = ''; o.pname = name.slice(0, 80); o.psize = size; }
    await save('obs', o); lsSet('lastStore', store);
    if (earnCoin()) setTimeout(() => coinPop(1, 'Thanks for logging a price!'), 900);
    toast(link ? `✅ Saved ${o.multi > 1 ? o.multi + ' for ' : ''}${money(o.price)}${byW ? '/' + per : ''} at ${store}` : `✅ Saved. This product will be sorted into the right item soon.`, 2800);
    location.replace(link ? `#variant/${encodeURIComponent(it.id)}/${encodeURIComponent(link.vid)}` : `#product/${code}`); // back to the product page with the new price
  };
}
// nobody has this barcode: register the product only (photo + name). No price needed, so it works at home too.
// After saving (+2 coins) the user lands on the product page, where "Log a price" is a separate step (+1 coin).
function viewNewProduct(code) {
  setHeader('New product', true); setTab('scan');
  let photo = '', ocrText = '';
  app.innerHTML = `<div class="card"><b>🐾 You're the first to scan this!</b><div class="muted">Add this product so everyone can find it. No price needed. You get 2 coins, and you can log a price on the next screen if you have one.</div></div>
    <div class="card"><h2>1 · Product photo</h2><div style="display:flex;gap:10px;align-items:center"><div id="nThumb" style="flex:0 0 54px">${thumb('', '📷')}</div><button class="btn sec small" id="nPhoto" style="flex:1;margin:0">📷 Take a clear photo of the product</button></div></div>
    <div class="card"><h2>2 · Product details</h2>
      <button class="btn sec small" id="nTag" style="margin:0">🏷️ Snap the price tag to fill in the name (optional)</button><div id="nTagMsg" class="muted" style="margin-top:6px"></div>
      <label>Product name</label><input id="nName" placeholder="e.g. Shin Ramyun Black">
      <label>Brand</label><input id="nBrand" placeholder="e.g. Nongshim">
      ${sizeHTML('n', '', false)}</div>
    <button class="btn" id="nSave">Save product · 🪙 +2</button>`;
  sizeWire('n');
  $('#nPhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; photo = await thumbFrom(f); $('#nThumb').innerHTML = thumb(photo); };
  $('#nTag').onclick = async () => { const f = await pickFile($('#fileTag')); if (!f) return; const msg = $('#nTagMsg'); msg.textContent = t('ocrReading');
    try { const w = await getOcr(); const c0 = await prepForOcr(f, 1600); const { data } = await w.recognize(c0); ocrText = (data.text || '').slice(0, 600); const tp = tagParse(ocrText);
      if (tp.name && !$('#nName').value) $('#nName').value = tp.name;
      if (tp.size && !$('#nSizeN').value) { const q = qtySplit(tp.size); $('#nSizeN').value = q.n; $('#nSizeU').value = q.u; }
      if (/\/\s*(lb|kg)\b|per\s*(lb|kg)\b/i.test(ocrText)) { $('#nByW').checked = true; $('#nSizeRow').classList.add('hidden'); }
      msg.textContent = tp.name ? '✅ Read it. Please check the name below.' : t('ocrNone'); } catch (e) { msg.textContent = t('ocrFail'); } };
  $('#nSave').onclick = async () => {
    if (!photo) return toast('📷 Please take a clear photo of the product first. Everyone who scans it later will see it.', 3600);
    const name = $('#nName').value.trim(); if (!name) return toast('Type the product name (or snap the price tag)');
    const sg = sizeGet('n'); $('#nSave').disabled = true;
    await bcPut(code, { name, brand: $('#nBrand').value.trim(), quantity: sg.quantity, byWeight: sg.byWeight, image: photo, src: 'user', status: 'unsorted', ocr: ocrText });
    const c = earnCoin(2); if (c) setTimeout(() => coinPop(c, 'Thanks for adding a new product!'), 500); else toast('🐾 Thanks! Saved for everyone.', 3000);
    if (location.hash === `#product/${code}`) viewProduct(code); else location.replace(`#product/${code}`); // product page: tap "Log a price" if you have one
  };
}
// fix a wrong name, size or picture: saved to the shared barcode record (and the linked product)
function editProduct(code, info, link, name, size) {
  let photo = '';
  const m = showSheet(`<h2 style="margin-top:0">✏️ Edit product</h2><div class="muted">Fix the name, size or picture. Everyone who scans it will see your fix.</div>
    <label>Product name</label><input id="eName" value="${esc(info.name || name || '')}"><label>Brand</label><input id="eBrand" value="${esc(info.brand || '')}">${sizeHTML('e', info.quantity || size || '', info.byWeight)}
    <div style="display:flex;gap:10px;align-items:center;margin-top:10px"><div id="eThumb" style="flex:0 0 54px">${thumb(info.image || '', '📷')}</div><button class="btn sec small" id="ePhoto" style="flex:1;margin:0">📷 New photo</button></div>
    <div class="row" style="margin-top:12px"><button class="btn sec" id="eCancel" style="margin:0">${t('close')}</button><button class="btn" id="eSave" style="margin:0">${t('save')}</button></div>`);
  m.querySelector('#eCancel').onclick = closeSheet; sizeWire('e', m);
  m.querySelector('#ePhoto').onclick = async () => { const f = await pickFile($('#filePhoto')); if (!f) return; photo = await thumbFrom(f); m.querySelector('#eThumb').innerHTML = thumb(photo); };
  m.querySelector('#eSave').onclick = async () => { const nm = m.querySelector('#eName').value.trim(); if (!nm) return toast(t('needName'));
    await bcPut(code, { ...info, name: nm, brand: m.querySelector('#eBrand').value.trim(), ...(({ quantity, byWeight }) => ({ quantity, byWeight }))(sizeGet('e', m)), image: photo || info.image || '', src: info.src || 'user', edited: Date.now() });
    if (link) { const fresh = await getOne('items', link.it.id), va = (fresh.variants || {})[link.vid]; if (va) { va.desc = nm; va.brand = m.querySelector('#eBrand').value.trim(); if (photo) va.photo = photo; await save('items', fresh); } }
    closeSheet(); toast('✅ Thanks! Product updated.', 2200); viewProduct(code); };
}
async function loadUnsorted() { const box = $('#unsortedBody'); if (!box) return;
  try { const bcs = (await fb.F.getDocsFromServer(fb.F.collection(fb.db, 'households', HOUSEHOLD, 'barcodes'))).docs.map(d => ({ code: d.id, ...d.data() }));
    const linked = new Set(); (await getAll('items')).forEach(i => Object.values(i.variants || {}).forEach(v => v.barcode && linked.add(v.barcode)));
    const un = bcs.filter(b => !linked.has(b.code)).sort((a, b) => (b.ts || 0) - (a.ts || 0)), obs = await getAll('obs'), np = c => obs.filter(o => o.bc === c && !o.itemId).length;
    box.innerHTML = `<div style="font-weight:700;color:var(--text)">${un.length} product${un.length === 1 ? '' : 's'} waiting · ${obs.filter(o => o.bc && !o.itemId).length} prices</div>
      <table style="margin-top:6px">${un.slice(0, 40).map(b => `<tr><td>${esc([b.brand, b.name].filter(Boolean).join(' ') || b.code)}<div class="muted">${esc(b.quantity || '')} · ${esc(b.code)}</div></td><td class="r">${np(b.code)}</td></tr>`).join('')}</table>
      <div class="muted" style="margin-top:6px">Ask Claude for a "data audit" to sort these into items.</div>`;
  } catch (e) { box.innerHTML = `<span style="color:var(--bad)">${esc(e.code || e.message)}</span>`; } }
/* ---------- 5.3 Location: PricePup is for Calgary. GPS is only used to check the city and find the nearest store; it is never saved ---------- */
const CHAINS = ['Superstore', 'Sobeys', 'Save-On-Foods', 'T&T', 'Costco', 'FreshCo', 'Safeway', 'Walmart', 'Co-op', 'No Frills', 'Wholesale Club', 'H Mart', 'Shoppers', 'London Drugs'];
const CHAIN_RX = [/superstore/i, /sobeys/i, /save[- ]?on/i, /t\s*&\s*t\b/i, /costco/i, /freshco/i, /safeway/i, /walmart/i, /co-?op/i, /no ?frills/i, /wholesale club/i, /h ?mart/i, /shoppers/i, /london drugs/i];
const BRANCHES = '8,5108816,-11413098;6,5110645,-11416198;8,5114148,-11413021;6,5101455,-11416805;0,5111583,-11406937;6,5112709,-11407239;3,5114063,-11406863;1,5115523,-11405777;6,5110157,-11407268;6,5094255,-11404784;1,5097859,-11401367;1,5104795,-11418678;5,5108285,-11398278;1,5091723,-11395981;6,5109936,-11396237;8,5106854,-11393323;8,5101902,-11415883;6,5102069,-11414199;8,5116167,-11412275;3,5106164,-11398402;7,5105366,-11397851;6,5093034,-11396373;9,5096147,-11408551;6,5097416,-11409724;7,5104114,-11413911;2,5088153,-11395883;8,5112371,-11420086;8,5096265,-11400786;6,5104338,-11413976;5,5117559,-11410971;8,5090291,-11406352;9,5093105,-11402506;1,5090524,-11411325;6,5108450,-11415652;6,5094044,-11411906;9,5108521,-11395575;2,5101976,-11416261;2,5103829,-11408228;0,5104744,-11405506;1,5111126,-11403989;2,5107733,-11414697;8,5118116,-11415767;1,5086291,-11402785;0,5108213,-11418692;11,5106310,-11399268;9,5104549,-11408825;5,5105270,-11410325;11,5103997,-11406062;1,5106527,-11421012;6,5112626,-11420104;1,5115147,-11421292;8,5110278,-11414638;6,5105619,-11408523;1,5111153,-11403996;0,5106906,-11398405;0,5113647,-11416125;2,5111254,-11405389;6,5107494,-11416610;0,5101954,-11417435;7,5115365,-11421339;0,5116205,-11406952;10,5107867,-11400277;6,5102273,-11411661;10,5100199,-11406084;7,5110754,-11403780;4,5107932,-11399062;0,5093430,-11396717;4,5098964,-11404630;7,5090092,-11406128;0,5091002,-11406764;6,5090558,-11406429;6,5095273,-11406165;0,5110973,-11397165;1,5091534,-11407216;5,5098452,-11401430;6,5104235,-11408011;0,5096185,-11407443;8,5097455,-11406928;7,5098410,-11404611;3,5098534,-11404616;0,5098646,-11404193;1,5088088,-11397668;6,5103030,-11407265;8,5104356,-11408822;1,5103722,-11396084;1,5087943,-11407326;2,5087494,-11403867;2,5106533,-11395617;11,5115780,-11415748;9,5103663,-11396934;7,5103856,-11391088;5,5112365,-11394526;8,5092888,-11402890;0,5087474,-11396044;2,5116715,-11408872;4,5115478,-11415532;1,5089733,-11394115;3,5116982,-11415164;1,5117349,-11415691;4,5104331,-11391745;8,5089551,-11394433;7,5109705,-11414383;8,5108835,-11413083;2,5107974,-11419670;1,5112479,-11424866;5,5115598,-11393929;6,5106834,-11406099;8,5103891,-11398808;8,5114713,-11425635;6,5104101,-11420886;9,5118324,-11409378;8,5105840,-11421279;9,5106001,-11421022;2,5097440,-11407268;6,5106569,-11410300;5,5108533,-11412416;8,5106738,-11405207;8,5096272,-11412060;12,5110504,-11416059;13,5112722,-11407478;13,5108063,-11398287;13,5101676,-11416160;13,5115361,-11421505;13,5093148,-11396732;12,5115495,-11405383;12,5110226,-11407062;12,5097824,-11401336;12,5111683,-11420519;12,5101438,-11416844;12,5098581,-11408252;12,5116283,-11412520;12,5107444,-11398475;12,5106411,-11406316;12,5120291,-11399196;12,5112576,-11394545;12,5103768,-11407957;12,5105510,-11395542;12,5096088,-11410512;12,5097862,-11406062;12,5103744,-11396380;12,5114971,-11421197;12,5102387,-11410928;12,5094249,-11404704;12,5103718,-11414389;12,5088108,-11395994;12,5095346,-11406686;12,5117411,-11411017;12,5103867,-11406071;13,5097850,-11406991;12,5108507,-11415683;12,5092973,-11402980;12,5094096,-11412124;12,5087589,-11403651;12,5090210,-11405730;12,5087837,-11407339;12,5099592,-11407457;12,5118114,-11415992;12,5103138,-11407123;12,5099642,-11411950;12,5104655,-11407006;12,5103969,-11414008;12,5112740,-11419831;12,5107860,-11414458;12,5116195,-11406657;13,5090093,-11406638;7,5092934,-11396681;12,5090411,-11406899;12,5090800,-11410970;4,5121121,-11398327;12,5091532,-11407323;7,5096605,-11406917;12,5109773,-11395550;12,5115770,-11416043;12,5098406,-11401421;7,5116975,-11414247;12,5089916,-11394323;12,5103890,-11399091;12,5105279,-11409369;12,5091237,-11395363;4,5093816,-11414467;12,5115590,-11394122;12,5103887,-11420551;12,5106039,-11421275;12,5106617,-11410161;13,5108503,-11412359'.split(';').map(s => { const [c, a, b] = s.split(',').map(Number); return { c: CHAINS[c], lat: a / 1e5, lon: b / 1e5 }; }); // Calgary branches (OpenStreetMap, Oct 2026)
const YYC = { lat: 51.0447, lon: -114.0719 }, YYC_KM = 30;
const kmBetween = (a, b) => { const r = x => x * Math.PI / 180, dA = r(b.lat - a.lat), dO = r(b.lon - a.lon), h = Math.sin(dA / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dO / 2) ** 2; return 12742 * Math.asin(Math.sqrt(h)); };
const inCalgary = p => kmBetween(p, YYC) <= YYC_KM;
const chainOf = s => { const i = CHAIN_RX.findIndex(rx => rx.test(s || '')); return i < 0 ? '' : CHAINS[i]; }; // "Seton Superstore" -> "Superstore"
let geoLast = null;
function getPos(maxAge = 3 * 60e3) { return new Promise((res, rej) => {
  if (!navigator.geolocation) return rej({ code: 'nogeo' }); if (geoLast && Date.now() - geoLast.t < maxAge) return res(geoLast);
  navigator.geolocation.getCurrentPosition(p => { geoLast = { lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy, t: Date.now() }; res(geoLast); }, e => rej(e), { enableHighAccuracy: true, timeout: 15000, maximumAge: maxAge }); }); }
const nearestChains = p => { const best = {}; for (const b of BRANCHES) { const d = kmBetween(p, b); if (best[b.c] == null || d < best[b.c]) best[b.c] = d; } return CHAINS.map(c => ({ c, km: best[c] })).sort((a, b) => (a.km ?? 99) - (b.km ?? 99)); };
const fmtKm = km => km == null ? '' : km < 1 ? Math.round(km * 1000 / 50) * 50 + ' m' : km.toFixed(1) + ' km';
const geoMsg = e => e && e.code === 1 ? '📍 Location is off for PricePup. Turn it on in your phone settings to log prices.' : '📍 Could not get your location. Check that location is on and try again.';
function setArea(area, inYyc) { lsSet('area', area); if (syncOn()) { fb.F.setDoc(favRef(), { area, inCalgary: !!inYyc, areaAt: Date.now() }, { merge: true }).catch(() => {}); lsSet('areaSynced', '1'); } }
function firstLocation() {
  if (lsGet('locAsked')) { if (syncOn() && lsGet('area') && !lsGet('areaSynced')) setArea(lsGet('area'), lsGet('area') === 'Calgary'); return; }
  const m = showSheet(`<h2 style="margin-top:0">📍 PricePup is made for Calgary</h2><div>Prices come from Calgary stores and from people shopping in Calgary. We use your location only to check that you're in Calgary and to find the nearest store when you log a price. Your location is never saved.</div>
    <button class="btn" id="locYes" style="margin-top:12px">Share my location</button><button class="btn sec" id="locNo">Not now</button>`);
  m.querySelector('#locNo').onclick = () => { lsSet('locAsked', '1'); closeSheet(); };
  m.querySelector('#locYes').onclick = async () => { lsSet('locAsked', '1'); try { const p = await getPos(0); if (inCalgary(p)) { setArea('Calgary', true); closeSheet(); toast('📍 Welcome, Calgarian! 🐾', 2600); } else askArea(); } catch (e) { closeSheet(); toast(geoMsg(e), 4200); } }; }
function askArea() {
  const m = showSheet(`<h2 style="margin-top:0">🗺️ Not in Calgary yet</h2><div>PricePup is currently designed for Calgarians, so prices logged outside Calgary aren't counted. More cities are coming! Where do you live? It helps us choose the next city.</div>
    <label>City / region</label><input id="arIn" placeholder="e.g. Edmonton, AB" maxlength="40"><button class="btn" id="arOk" style="margin-top:10px">Send</button><button class="btn sec" id="arSkip">Skip</button>`);
  m.querySelector('#arSkip').onclick = closeSheet;
  m.querySelector('#arOk').onclick = () => { const v = m.querySelector('#arIn').value.trim(); if (!v) return toast('Type your city first'); setArea(v, false); closeSheet(); toast(`Thanks! We'll let you know when PricePup comes to ${v} 🐾`, 3200); }; }

/* ---------- Price tracking: alert when a tracked item or product hits its 30-day low ---------- */
let TRACK = new Set((() => { try { return JSON.parse(lsGet('track') || '[]'); } catch (e) { return []; } })());
function pushTrack() { lsSet('track', JSON.stringify([...TRACK])); if (syncOn()) fb.F.setDoc(favRef(), { track: [...TRACK], updated: Date.now() }, { merge: true }).catch(() => {}); }
function toggleTrack(k) { if (TRACK.has(k)) TRACK.delete(k); else TRACK.add(k); pushTrack(); toast(t(TRACK.has(k) ? 'trackOn' : 'trackOff'), 2600);
  if (TRACK.has(k)) { askNotify(); checkTrack(true); } return TRACK.has(k); }
const trackBtn = k => `<button class="trackbtn${TRACK.has(k) ? ' on' : ''}" data-track="${esc(k)}" aria-label="${esc(t('trackBtn'))}" aria-pressed="${TRACK.has(k)}">${TRACK.has(k) ? '🔔' : '🔕'}<span>${t(TRACK.has(k) ? 'tracking' : 'trackBtn')}</span></button>`;
// is something on sale / just logged right now at (or below) the best price of the last 30 days?
function trackStatus(it, obs, vid) {
  const mine = vid ? obs.filter(o => o.vid === vid) : obs; const s = summarize(it, mine); if (!s || !s.best) return { s };
  const live = s.rows.filter(r => r.u.key === s.best.u.key && (r.o.src === 'flyer' ? isCurrent(r.o) : daysAgo(r.o.date) <= 7 && !isEnded(r.o)));
  const hit = live.filter(r => r.u.v <= s.best.u.v * 1.002).sort((a, b) => a.u.v - b.u.v)[0];
  return { s, hit };
}
function trackRows(items, by) {
  const map = Object.fromEntries(items.map(i => [i.id, i]));
  return [...TRACK].map(k => { const [id, vid] = k.split('|'), it = map[id]; if (!it || (vid && !(it.variants || {})[vid])) return '';
    const st = trackStatus(it, by[id] || [], vid), b = st.hit || (st.s && (st.s.best || st.s.low)), va = vid ? it.variants[vid] : null;
    return `<a class="item" href="${vid ? `#variant/${encodeURIComponent(id)}/${encodeURIComponent(vid)}` : `#item/${encodeURIComponent(id)}`}">${thumb(vid ? variantPhoto(it, va) : itemPhoto(it), itemEmoji(it))}
      <div class="main"><div class="name">${esc(vid ? variantText(it, vid) : itemName(it))}</div><div class="muted">${esc(vid ? itemName(it) : placeLabel(it))}</div>
      ${st.hit ? `<div><span class="tag hot">🔥 ${t('track30')}</span> <span class="muted">${esc(st.hit.o.store)}</span></div>` : b ? `<div class="muted">${esc(b.o.store)}</div>` : ''}</div>
      <div class="price">${b ? fmtU(b.u) : '—'}<div class="muted">${st.hit ? priceText(it, st.hit.o) : b ? t('bestNow') : t('noPrice')}</div></div>${trackBtn(k)}</a>`; }).join('');
}
let trackT = null;
async function checkTrack(now) {
  clearTimeout(trackT); trackT = setTimeout(async () => {
    if (!TRACK.size) return; const { items, by } = await loadAll(); const map = Object.fromEntries(items.map(i => [i.id, i]));
    let seen = {}; try { seen = JSON.parse(lsGet('trackSeen') || '{}'); } catch (e) {}
    const hits = [];
    for (const k of TRACK) { const [id, vid] = k.split('|'), it = map[id]; if (!it) continue; const st = trackStatus(it, by[id] || [], vid);
      if (st.hit && seen[k] !== st.hit.o.id) { seen[k] = st.hit.o.id; hits.push({ k, it, vid, r: st.hit }); } }
    lsSet('trackSeen', JSON.stringify(seen)); if (!hits.length) return;
    const line = h => `${h.vid ? variantText(h.it, h.vid) : itemName(h.it)}: ${priceText(h.it, h.r.o)} (${fmtU(h.r.u)}) @ ${h.r.o.store}`;
    notify(t('trackAlertTitle'), hits.map(line).join('\n'), 'track', hits.length === 1 ? (hits[0].vid ? `#variant/${encodeURIComponent(hits[0].it.id)}/${encodeURIComponent(hits[0].vid)}` : `#item/${encodeURIComponent(hits[0].it.id)}`) : '#home');
    const m = showSheet(`<h2 style="margin-top:0">${t('trackAlertTitle')}</h2><div class="muted" style="margin-bottom:8px">${t('trackAlertHint')}</div>
      ${hits.map(h => `<a class="item" href="${h.vid ? `#variant/${encodeURIComponent(h.it.id)}/${encodeURIComponent(h.vid)}` : `#item/${encodeURIComponent(h.it.id)}`}">${thumb(h.vid ? variantPhoto(h.it, h.it.variants[h.vid]) : itemPhoto(h.it), itemEmoji(h.it))}<div class="main"><div class="name">${esc(h.vid ? variantText(h.it, h.vid) : itemName(h.it))}</div><div class="muted">${esc(h.r.o.store)} · ${esc(obsText(h.it, h.r.o))}</div></div><div class="price">${priceText(h.it, h.r.o)}<div class="muted">${fmtU(h.r.u)}</div></div></a>`).join('')}
      <button class="btn" id="taOk">${t('gotIt')}</button>`);
    m.querySelector('#taOk').onclick = closeSheet; m.querySelectorAll('a.item').forEach(a => a.addEventListener('click', closeSheet));
  }, now ? 300 : 1500);
}

/* ---------- Notifications: phone notification when allowed (app open or in the background), otherwise in-app ---------- */
const notifyOK = () => 'Notification' in window && Notification.permission === 'granted';
const notifySupported = () => 'Notification' in window && 'serviceWorker' in navigator;
async function askNotify() { if (!notifySupported() || Notification.permission !== 'default') return Notification && Notification.permission; try { return await Notification.requestPermission(); } catch (e) { return 'denied'; } }
async function notify(title, body, tag, url) {
  if (!notifyOK()) return false;
  try { const reg = await navigator.serviceWorker.getRegistration(); const icon = (document.querySelector('link[rel="icon"]') || {}).href || 'icon-192.png';
    if (reg) { await reg.showNotification(title, { body, tag, icon, badge: icon, data: { url: url || '#home' } }); return true; }
    new Notification(title, { body, tag, icon }); return true; } catch (e) { return false; }
}
// what the puppy needs right now (null if he's fine)
function petNeed() { const g = gLoad(); if (!g.pup) return null; const m = gMood(g), n = g.pup.name;
  if (m === 'shelter') return { k: 'needShelter', msg: `${n} is waiting for you at the shelter.` };
  if (m === 'sick') return { k: 'needSick', msg: `${n} is sick and needs you.` };
  if (!onVacation(g) && g.lastVisit && H(g.lastVisit) >= SHELTER_H) return { k: 'needShelter', msg: `${n} was taken to the shelter. Bring it home!` };
  if (!onVacation(g) && g.lastVisit && H(g.lastVisit) >= 18) return { k: 'needMiss', msg: `${n} misses you! Visit soon, or it will be taken to the shelter.` };
  const k = m === 'weak' ? 'needWeak' : m === 'thirsty' ? 'needThirsty' : m === 'dirty' ? 'needDirty' : m === 'grumpy' ? 'needGrumpy' : fullness(g) < 20 ? 'needHungry' : waterLevel(g) >= 3 ? 'needWater' : '';
  return k ? { k, msg: tf(k, n) } : null; }
function checkPet() { const need = petNeed(); if (!need || location.hash === '#garden') return;
  let at = {}; try { at = JSON.parse(lsGet('notiAt') || '{}'); } catch (e) {}
  if (Date.now() - (at[need.k] || 0) < 3 * 36e5) return; at[need.k] = Date.now(); lsSet('notiAt', JSON.stringify(at));
  notify(tf('needTitle', gLoad().pup.name), need.msg, 'pet', '#garden'); }
setInterval(checkPet, 10 * 60e3);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') checkPet(); else { checkVersion(); checkTrack(); } });
navigator.serviceWorker && navigator.serviceWorker.addEventListener && navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.url) location.hash = e.data.url; });

/* ---------- Version check: make sure everyone is on the latest app ---------- */
let verAsked = '';
async function checkVersion() {
  try { const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; const v = (await r.json()).v;
    const vnum = x => (x || '0').split('.').map(Number).reduce((s, y) => s * 1000 + y, 0);
    if (!v || vnum(v) <= vnum(APP_VERSION) || verAsked === v) return; verAsked = v;
    const r0 = location.hash.slice(1).split('/')[0], ae = document.activeElement, busy = (ae && /INPUT|TEXTAREA|SELECT/.test(ae.tagName)) || !$('#scanner').classList.contains('hidden') || !!document.querySelector('.sheet:not(.hidden)');
    if (!busy && ['', 'home', 'items', 'deals', 'settings', 'garden', 'item', 'variant', 'product'].includes(r0) && !sessionStorage.getItem('autoUpd' + v)) { // 5.5: update by itself once, no button needed
      sessionStorage.setItem('autoUpd' + v, '1'); toast('🐾 Updating to ' + v + '…', 3000);
      try { for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister(); for (const k of await caches.keys()) if (/pricepup/.test(k)) await caches.delete(k); } catch (e) {}
      location.replace(location.pathname + '?v=' + v + location.hash); return; }
    const m = showSheet(`<div style="text-align:center">${dog('happy', 'party', 'bounce')}</div><h2 style="text-align:center">${t('updTitle')}</h2>
      <div class="muted" style="text-align:center;margin-bottom:12px">${tf('updBody', v, APP_VERSION)}</div>
      <button class="btn" id="updGo">${t('updBtn')}</button><button class="btn sec" id="updLater">${t('updLater')}</button>`);
    m.querySelector('#updLater').onclick = closeSheet;
    m.querySelector('#updGo').onclick = async () => { m.querySelector('#updGo').disabled = true; m.querySelector('#updGo').textContent = t('updDoing');
      try { for (const reg of await navigator.serviceWorker.getRegistrations()) await reg.unregister(); for (const k of await caches.keys()) if (/pricepup/.test(k)) await caches.delete(k); } catch (e) {}
      location.replace(location.pathname + '?v=' + v + location.hash); };
  } catch (e) {}
}

/* ---------- Scanned product details ---------- */
function showProduct(sc) {
  const i = sc.info || {};
  const cats = (i.cats || '').split(' ').length ? (i.catsList || []) : [];
  const m = showSheet(`<h2 style="margin-top:0">${t('scanDetails')}</h2>
    ${i.image ? `<div style="text-align:center"><img src="${esc(i.imageBig || i.image)}" alt="" style="max-width:60%;max-height:220px;border-radius:12px"></div>` : ''}
    <table class="kv">
      ${i.name ? `<tr><td>${t('pdName')}</td><td><b>${esc(i.name)}</b></td></tr>` : ''}
      ${i.brand ? `<tr><td>${t('pdBrand')}</td><td>${esc(i.brand)}</td></tr>` : ''}
      ${i.quantity ? `<tr><td>${t('pdSize')}</td><td>${esc(i.quantity)}</td></tr>` : ''}
      <tr><td>${t('pdBarcode')}</td><td>${esc(sc.code)}</td></tr>
      ${(i.catsList || []).length ? `<tr><td>${t('pdCats')}</td><td>${esc(i.catsList.slice(0, 5).join(', '))}</td></tr>` : ''}
    </table>
    <a class="btn sec" target="_blank" rel="noopener" href="https://world.openfoodfacts.org/product/${encodeURIComponent(sc.code)}" style="text-align:center;text-decoration:none">${t('pdOff')}</a>
    <button class="btn" id="pdClose">${t('close')}</button>`);
  m.querySelector('#pdClose').onclick = closeSheet;
}

/* ---------- What's new (shown once after each update) ---------- */
const CHANGES = {
  '5.5.0': [['New products: type the size as a number and pick the unit (g, kg, mL, L, lb, EA), or tick "Sold by weight" for loose fruit and veg. Snap the price tag to fill in the name for you.', 'Logging a price is just the number now. Sold-by-weight products ask for the price per lb or kg.', 'The camera stays ready for 2 minutes after a scan, so you can scan several things in a row.', 'At a store? Deals opens that store first.', 'Your puppy\'s happiness fades more slowly, and spending time with him makes him a little happier.', 'The app updates itself when there is a new version.', 'No more zooming in by accident when you tap twice.'],
            ['New products: type the size as a number and pick the unit (g, kg, mL, L, lb, EA), or tick "Sold by weight" for loose fruit and veg. Snap the price tag to fill in the name for you.', 'Logging a price is just the number now. Sold-by-weight products ask for the price per lb or kg.', 'The camera stays ready for 2 minutes after a scan, so you can scan several things in a row.', 'At a store? Deals opens that store first.', 'Your puppy\'s happiness fades more slowly, and spending time with him makes him a little happier.', 'The app updates itself when there is a new version.', 'No more zooming in by accident when you tap twice.']],
  '5.4.5': [['Small fix: the old 99 test coins of the power user are cleared.'], ['Small fix: the old 99 test coins of the power user are cleared.']],
  '5.4.4': [['Adding a new product is now its own quick step: a photo and the name, no price needed (great for scanning at home). You get 2 coins.', 'Then you land on the product page, where you can log a price for 1 more coin.'],
            ['Adding a new product is now its own quick step: a photo and the name, no price needed (great for scanning at home). You get 2 coins.', 'Then you land on the product page, where you can log a price for 1 more coin.']],
  '5.4.3': [['Coins: logging or updating a price gives 1 coin. Adding a new product that nobody has scanned before gives 2 coins, even if you don\'t know the price yet (plus 1 if you log one).', 'Everyone earns coins the same way (up to 20 a day).'],
            ['Coins: logging or updating a price gives 1 coin. Adding a new product that nobody has scanned before gives 2 coins, even if you don\'t know the price yet (plus 1 if you log one).', 'Everyone earns coins the same way (up to 20 a day).']],
  '5.4.2': [['Scanning a product you already have now opens its product page: lowest price, current deal and price history. Tap ➕ Log a price to add a new one.', 'After logging, you go back to the product page and see your new price.'],
            ['Scanning a product you already have now opens its product page: lowest price, current deal and price history. Tap ➕ Log a price to add a new one.', 'After logging, you go back to the product page and see your new price.']],
  '5.4.1': [['Scanning a product you already have now opens its page: price history, latest deal and a button to log a new price.', 'After logging, you go back to that product page. New products also show their lowest price and history.'],
            ['Scanning a product you already have now opens its page: price history, latest deal and a button to log a new price.', 'After logging, you go back to that product page. New products also show their lowest price and history.']],
  '5.4.0': [['Scanning is much simpler: one screen per product. Known products go straight to "log the price"; no more picking categories or sizes.', 'New products: snap the price tag and the product, the pup fills in the details. They are shared with everyone right away and sorted into the right item later.', 'Wrong name or picture? Tap ✏️ Edit on a scanned product. New food bowl drawing.'],
            ['Scanning is much simpler: one screen per product. Known products go straight to "log the price"; no more picking categories or sizes.', 'New products: snap the price tag and the product, the pup fills in the details. They are shared with everyone right away and sorted into the right item later.', 'Wrong name or picture? Tap ✏️ Edit on a scanned product. New food bowl drawing.']],
  '5.3.0': [['Meals are now free: fill the food bowl and your puppy eats when hungry. Treats are extras for rewards. Water is just refreshed; your puppy drinks when it wants.', 'Toilet times now follow your puppy\'s age, like a real dog. New puppies come with a 10-coin welcome gift (sign in with Google to adopt, so your puppy is never lost).', 'PricePup is for Calgary: logging a price checks your location (never saved) and shows the nearest stores first.', 'Flyer products now show their photo. Scanning a product nobody knows yet asks for a photo, so everyone sees it next time.', 'Fixes: no more repeated $/lb, wrong "Reg." prices from flyers, and the store list on Deals now uses two rows.'],
            ['Meals are now free: fill the food bowl and your puppy eats when hungry. Treats are extras for rewards. Water is just refreshed; your puppy drinks when it wants.', 'Toilet times now follow your puppy\'s age, like a real dog. New puppies come with a 10-coin welcome gift (sign in with Google to adopt, so your puppy is never lost).', 'PricePup is for Calgary: logging a price checks your location (never saved) and shows the nearest stores first.', 'Flyer products now show their photo. Scanning a product nobody knows yet asks for a photo, so everyone sees it next time.', 'Fixes: no more repeated $/lb, wrong "Reg." prices from flyers, and the store list on Deals now uses two rows.']],
  '5.2.0': [['Every puppy is now unique, with its own hidden strength, smarts, health and personality. It grows up (1 day = 2 puppy days).', 'Teach fetch: at first your puppy has no idea what the ball is for. Keep throwing!', 'Strong puppies pull the rope harder. Puppies can catch a cold after big temperature swings; rest 5 hours or give a pill.', 'Leave your puppy without care for a day and it goes to the shelter (10 coins to bring it home). Going away? Use the pet hotel.', 'New ⓘ puppy info card. All puppies were reset, so adopt a new one!', 'Your puppy now lives indoors: toilet training with a pee pad, and 8 commands to train (🎓) as your bond grows. Collars in the shop!'],
            ['Every puppy is now unique, with its own hidden strength, smarts, health and personality. It grows up (1 day = 2 puppy days).', 'Teach fetch: at first your puppy has no idea what the ball is for. Keep throwing!', 'Strong puppies pull the rope harder. Puppies can catch a cold after big temperature swings; rest 5 hours or give a pill.', 'Leave your puppy without care for a day and it goes to the shelter (10 coins to bring it home). Going away? Use the pet hotel.', 'New ⓘ puppy info card. All puppies were reset, so adopt a new one!', 'Your puppy now lives indoors: toilet training with a pee pad, and 8 commands to train (🎓) as your bond grows. Collars in the shop!']],
  '5.1.1': [['Faster, lighter syncing: the app now downloads only prices that changed since your last visit.'],
            ['Faster, lighter syncing: the app now downloads only prices that changed since your last visit.']],
  '5.1.0': [['New catalogue: 15 departments with aisles, like Superstore and Walmart. Tap All, pick a department, then an aisle.',
             'Six more stores in the weekly flyers: Calgary Co-op, No Frills, Wholesale Club, H Mart, Shoppers Drug Mart and London Drugs.',
             'Scanning remembers products: PricePup checks its own barcode list first, then Open Food Facts and UPCitemdb. If nobody knows a barcode, you can add the product yourself.',
             'Price tracking is now only on specific product pages.'],
            ['New catalogue: 15 departments with aisles, like Superstore and Walmart. Tap All, pick a department, then an aisle.',
             'Six more stores in the weekly flyers: Calgary Co-op, No Frills, Wholesale Club, H Mart, Shoppers Drug Mart and London Drugs.',
             'Scanning remembers products: PricePup checks its own barcode list first, then Open Food Facts and UPCitemdb. If nobody knows a barcode, you can add the product yourself.',
             'Price tracking is now only on specific product pages.']],
  '5.0.0': [['Bigger garden: the puppy wanders around the lawn and does lots of things on his own. Stats are now in the top-right corner of the garden.',
             'Touch the puppy to pet him (no Pet button). He stops eating or chewing for a moment to enjoy it, then carries on.',
             'Happiness now builds up slowly, and there’s a new Bond level 💗 you earn by caring for your puppy every day.',
             'Tug rope: pull the rope anywhere on the screen, even outside the garden.',
             'Price tracking 🔔: track an item or product and get an alert when it hits its 30-day low. See them all under Tracking.',
             'Home: Favourites / All (browse by category) / Tracking; ✕ clears the search. Log a price without a barcode from the Scan screen.',
             'Scanning: better guesses, tap the scanned product for details, and only the item summary is shown.',
             'Notifications for your puppy and price alerts (turn on in Settings), version check on open, English only.'],
            ['Bigger garden: the puppy wanders around the lawn and does lots of things on his own. Stats are now in the top-right corner of the garden.',
             'Touch the puppy to pet him (no Pet button). He stops eating or chewing for a moment to enjoy it, then carries on.',
             'Happiness now builds up slowly, and there’s a new Bond level 💗 you earn by caring for your puppy every day.',
             'Tug rope: pull the rope anywhere on the screen, even outside the garden.',
             'Price tracking 🔔: track an item or product and get an alert when it hits its 30-day low. See them all under Tracking.',
             'Home: Favourites / All (browse by category) / Tracking; ✕ clears the search. Log a price without a barcode from the Scan screen.',
             'Scanning: better guesses, tap the scanned product for details, and only the item summary is shown.',
             'Notifications for your puppy and price alerts (turn on in Settings), version check on open, English only.']],
  '4.9.1': [['掟波：撳個波之後，波會出現喺畫面底部，用手指向上掃出去。方向跟你手指，掃得愈快丟得愈遠。',
             '狗仔食嘢會低頭埋落碗度食，仲會有唔同動作。',
             '金幣改為金色。',
             '狗仔領養咗之後，App 入面嘅狗仔圖案同 App 圖示都會跟返你隻狗仔嘅顏色（已經加咗落主畫面嘅圖示要刪咗再加一次先會變）。'],
            ['Throwing the ball: tap the ball, it appears at the bottom of the screen — swipe it up to throw. It follows your finger; the faster the swipe, the farther it goes.',
             'Your puppy now eats with his head down in the bowl, with different moves.',
             'Coins are now golden.',
             'After adopting, the puppy pictures in the app and the app icon match your puppy’s colour (re-add the app to your home screen to update an installed icon).']],
  '4.9.0': [['新增金幣：每記錄一個價錢賺 1 個金幣，去花園商店買零食同玩具。每日免費零食改為 3 粒。',
             '新增清水：水會慢慢變污糟（5 級），超過 12 個鐘冇換水，狗仔唔肯飲會口渴。隨時撳「換水」或者水兜換新水。',
             '新增玩具（每件玩 10 次）：波波（狗仔跑去遠處咬返嚟）、拔河繩（㩒住繩尾向任何方向拉，同佢拔河）、咬咬玩具（佢自己玩半個鐘）。',
             '狗仔食零食要大約 1 分鐘；入花園時佢會慢慢醒，再由屋仔行過嚟搵你。'],
            ['New: coins. Earn 1 coin for each price you log and spend them at the garden shop on treats and toys. Free treats are now 3 a day.',
             'New: water. It slowly gets dirty (5 levels); after 12 hours without a change your puppy won’t drink and gets thirsty. Tap “Water” or the bowl any time.',
             'New toys (10 plays each): ball (he runs far to fetch it), tug rope (hold the rope end and pull any way for tug-of-war) and chew toy (he plays on his own for half an hour).',
             'Eating a treat now takes about a minute, and when you arrive he wakes up slowly and walks over from his house.']],
  '4.8.0': [['狗仔店：第一次入花園，可以揀白色、黑色或者啡色狗仔，再幫佢改名。揀咗就唔可以再改。',
             '狗仔換咗新造型：跟返 App icon 嘅耳仔同樣貌，簡約線條風格，大頭短腳；行路同跑步會郁腳。',
             '新增便便：餵完大約 3 個鐘，狗仔會喺花園屙便便（最多 3 堆）。撳便便清走佢，有便便嘅時候佢會唔開心。'],
            ['Puppy shop: on your first visit to the garden, pick a white, black or brown puppy and give it a name. It can’t be changed later.',
             'New puppy look: the app icon’s ears and face in a clean line style, big head and short legs; legs move when walking or running.',
             'New: poo. About 3 hours after a meal your puppy poos in the garden (up to 3 piles). Tap to clean up — it’s unhappy while there’s poo around.']],
  '4.7.0': [['Regen 變成動畫風格：會眨眼、呼吸、側頭、郁耳仔、聞嘢、行來行去、追蝴蝶；夜晚會瞓覺。佢唔再講嘢，用身體表達心情。',
             '花園按 Calgary 時間分清晨、日頭、黃昏同夜晚（跟日出日落），加上即時天氣。',
             '汽水、能量飲品、樽裝水等改為比較每罐／每樽嘅價錢。',
             '設定頁拎走咗單位選項；產品頁會按產品自動揀單位，右上角「⚖️」仍然可以轉。'],
            ['Regen is now anime style: he blinks, breathes, tilts his head, twitches his ears, sniffs around, walks about and chases butterflies, and sleeps at night. No more speech — he shows his mood with his body.',
             'The garden follows Calgary time — dawn, day, dusk and night by sunrise and sunset — plus live weather.',
             'Pop, energy drinks, bottled water and similar now compare the price per can or bottle.',
             'The unit setting is gone from Settings; item pages pick the right unit automatically, and “⚖️” still switches it.']],
  '4.6.0': [['單位價重新整理：包裝貨預設顯示 $/100g 或 $/100mL（同超市價錢牌一樣），散裝肉同蔬果顯示 $/lb；產品頁右上角「⚖️」可以轉 /kg、/lb，最低價下面亦會顯示每件價錢。',
             '如果一件產品有啲牌子用重量、有啲用容量計，會註明只比較邊種。',
             '新增 Regen 花園：撳左上角狗仔入去，可以摸佢、餵零食，佢會因應你幾耐冇嚟同 Calgary 即時天氣有唔同反應。',
             '每日 10 粒免費零食；每記錄一個價錢多 1 粒（每日最多多 10 粒）。超過 12 個鐘冇餵，Regen 會好肚餓冇晒力。'],
            ['Unit prices reworked: packaged goods show $/100g or $/100mL like shelf tags, loose meat and produce show $/lb; tap “⚖️” on an item to switch to /kg or /lb, and the price per item is shown under the lows.',
             'When an item mixes brands sold by weight and by volume, it says which ones are compared.',
             'New: Regen’s garden — tap the puppy at the top left to pet him and give treats; he reacts to how long you’ve been away and to Calgary’s live weather.',
             '10 free treats a day, +1 for every price you log (up to 10 extra a day). If Regen isn’t fed for 12 hours he gets very hungry and weak.']],
  '4.5.1': [['產品頁嘅特價同牌子列表太長時，先顯示頭幾個，撳「顯示全部」先展開。'], ['Long deal and brand lists on an item page now show the first few, with “Show all” to expand.']],
  '4.5.0': [['產品頁重新設計：頂部係歷史最低同近 30 日最平，跟住係而家有效嘅特價同近 7 日記錄嘅價錢（有舖名同產品相），再下面係各個牌子。',
             '各舖價錢、走勢同全部紀錄搬咗入每個牌子嘅頁面，撳牌子就睇到。',
             '掃 barcode：認得嘅產品直接打開嗰款嘅頁面睇特價同歷史價錢；新產品狗狗會自動估係邊件主產品，一撳就記錄價錢。',
             '每次更新都會彈出呢個「有乜新」。'],
            ['Item page redesigned: all-time low and best of the last 30 days on top, then valid deals and prices logged in the last 7 days (with store and product photo), then each brand.',
             'Prices by store, the trend and all records now live on each brand’s page — tap a brand to see them.',
             'Barcode scan: a known product opens its page with deals and price history; for a new product the pup guesses the main item so you can log the price in one tap.',
             'This “What’s new” pops up after every update.']],
};
function showWhatsNew() {
  const seen = lsGet('seenVer'); lsSet('seenVer', APP_VERSION);
  if (seen === APP_VERSION) return;
  const vnum = v => (v || '0').split('.').map(Number).reduce((s, x) => s * 1000 + x, 0);
  const vs = Object.keys(CHANGES).filter(v => vnum(v) > vnum(seen) && vnum(v) <= vnum(APP_VERSION)).sort((x, y) => vnum(y) - vnum(x));
  if (!vs.length) return;
  const notes = [0, 1].map(k => vs.flatMap(v => CHANGES[v][k]));
  const m = showSheet(`<div style="text-align:center">${dog('happy', 'party', 'bounce')}</div><h2 style="text-align:center;font-size:20px">${t('whatsNew')} v${APP_VERSION}</h2>
    <ul class="news">${notes[LI()].map(x => `<li>${esc(x)}</li>`).join('')}</ul><button class="btn" id="wnOk" style="margin:0">${t('gotIt')}</button>`);
  m.querySelector('#wnOk').onclick = closeSheet;
}

/* ---------- Router ---------- */
async function route(bg) {
  const parts = location.hash.slice(1).split('/').map(decodeURIComponent);
  const r = parts[0];
  if (!bg) window.scrollTo(0, 0);
  if (r !== 'scan' && scanStream && !bg) closeScanner();
  if (!bg && !['item', 'variant', 'add', 'pick', 'newitem', 'product'].includes(r)) scanCtx = null;
  switch (r) {
    case 'item': return viewItem(parts[1]);
    case 'pick': return viewPick(normCode(parts[1] || ''));
    case 'newitem': return viewNewItem();
    case 'add': return viewAdd(parts[1], parts[2] || '');
    case 'deals': return viewDeals();
    case 'settings': return viewSettings();
    case 'variant': return viewVariant(parts[1], parts[2]);
    case 'product': return viewProduct(normCode(parts[1] || ''), parts[2] === 'log');
    case 'garden': return viewGarden();
    case 'scan': await viewHome(); setTab('scan'); return openScanner();
    default: return viewHome();
  }
}
window.addEventListener('hashchange', () => route());

(async () => {
  applyStatic();
  await openDB();
  try { if (navigator.storage && navigator.storage.persist) await navigator.storage.persist(); } catch (e) {}
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) navigator.serviceWorker.register('sw.js').catch(() => {});
  route();
  if (lsGet('sync') !== '0') { setSync('connecting'); loadFb().catch(e => setSync('error', e.message)); }
  updInstall();
  if (!lsGet('guided')) { lsSet('seenVer', APP_VERSION); setTimeout(() => showGuide(0), 600); }
  else setTimeout(showWhatsNew, 800);
  setTimeout(() => { if (lsGet('guided') && !document.getElementById('sheet')) firstLocation(); }, 3500);
  setTimeout(checkVersion, 2500); checkTrack(); setTimeout(checkPet, 4000);
})();
