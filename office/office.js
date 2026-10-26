// 福美 AI 事務所：總覽頁最上方的像素辦公室動畫
// 讀 window.FUMEI_STATUS（運作檢查，每小時）、FUMEI_ADVICE（每日建議）、FUMEI_STORY（每日小故事，選用）
// 座標一律用背景原圖 2752×1536，畫的時候再依畫布寬度換算。只讀資料，不改任何東西。
(function () {
  const SP = window.FUMEI_OFFICE_SPRITES;
  const mount = document.getElementById('fumei-office');
  if (!SP || !mount) return;
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/office\.js(\?.*)?$/, '');
  const W = 2752, H = 1536;
  // 網站版（院內網站首頁底部）：window.FUMEI_OFFICE_OPTS = { site: true, staleHours: 30 }
  // 運作狀態只顯示、不連結；點員工開介紹卡；器械照片讀 office/kit/；報告一天上傳一次，所以小 O 的「太久沒巡房」放寬
  const OPT = window.FUMEI_OFFICE_OPTS || {}, SITE = !!OPT.site;

  // ---------- 場景資料（量自背景圖） ----------
  const SPOTS = { // 腳底位置；每間第一個是工位
    photo: [[620, 728], [410, 730], [840, 730]],
    post: [[1500, 740], [1170, 738], [1700, 742]],
    server: [[2200, 738], [1990, 738], [2390, 740]],
    lobby: [[880, 1340], [800, 1500], [1060, 1482]],
    monitor: [[1440, 1482], [1590, 1482]],
    study: [[2290, 1478], [2440, 1478]],
  };
  // 多加的站位（給走動與小美串門子用），避免大家擠在同幾個點
  const MORE_SPOTS = { post: [[1330, 745]], monitor: [[1300, 1482]], study: [[2080, 1480]] };
  // 大廳左邊的「器械小教室」白板（board.png 原圖 1551×1560 的一半；face＝板面的左上、右上、左下角，用原圖像素）
  const BOARD = { x: 290, y: 1495, h: 430, src: [1551, 1560], face: [[204, 264], [1365, 54], [216, 936]] };
  const LESSON_SPOT = [560, 1500]; // 小美上課時站的位置（白板右邊）
  const roomSpots = room => SPOTS[room].concat(MORE_SPOTS[room] || []);
  const STAFF = [
    { id: 'kui', name: '小櫃', role: '電子病歷櫃台', room: 'lobby', home: 0, items: ['emr', 'emr_https', 'hr', 'expense'],
      line: '今天電子病歷一切正常～' },
    { id: 'dang', name: '小檔', role: '照片歸檔', room: 'photo', home: 0, items: ['photo_archive', 'photo_sync'],
      shift: [[2, 25, 2, 50], [4, 0, 4, 20]], line: '照片都依病人歸好檔了' },
    { id: 'lai', name: '小賴', role: 'LINE 公告', room: 'post', home: 1, items: ['line_archive', 'site_publish'],
      shift: [[5, 50, 6, 5], [6, 30, 6, 50]], line: '公告已經貼上院內網站囉' },
    { id: 'tui', name: '小推', role: 'CRM 推播', room: 'post', home: 0, items: ['try_report', 'slots_mon', 'slots_thu', 'crm_autologin'],
      shift: [[3, 45, 4, 5], [7, 0, 7, 20]], line: 'CRM 鑰匙在我身上，空檔表整理好了' },
    { id: 'o', name: '小 O', role: '運作檢查', room: 'monitor', home: 0, items: ['overview_sync'], self: true,
      line: '每小時巡房一次，燈號我都盯著' },
    { id: 'bei', name: '阿備', role: '備份', room: 'server', home: 0, items: ['backup', 'nas_backup'],
      shift: [[2, 0, 2, 40]], line: '備份箱子都送進倉庫了' },
    { id: 'claude', name: '顧問 Claude', role: '每日建議', room: 'study', home: 0, items: ['advice'],
      shift: [[8, 15, 8, 45]], line: '今天的建議寫好了，放在下面便條' },
    // 小美：代表診所的真人臨床同仁，不管系統；會到各房間串門子，台詞多半來自 LINE 群組的診所大小事（每日小故事 who: 'mei'）
    { id: 'mei', name: '小美', role: '臨床同仁・診所大小事', room: 'lobby', home: 2, items: [], human: true,
      roam: ['post', 'study', 'photo', 'monitor'], line: '今天也要好好照顧大家的牙齒！' }, // 小美的台詞在 talk.js
  ];
  // 名冊點開的角色介紹卡（負責系統的時段與燈號直接讀運作報告，這裡只寫個性與工作說明）
  const BIO = {
    kui: { title: '電子病歷櫃台', desc: '守在大廳櫃台，顧著電子病歷系統、https 安全連線、員工資料和支出儀表板。病歷打不開、連線出問題，她會第一個發現。', trait: '細心、記性好，耳機麥克風從不離身，隨時準備接應。' },
    dang: { title: '照片歸檔員', desc: '每天凌晨把臨床照片依病人整理進 NAS，再做一份照片鏡像，醫師要找照片時一翻就有。', trait: '整理控、愛拍照，相機掛在身上，連桌上的文件都排得整整齊齊。' },
    lai: { title: 'LINE 公告員', desc: '每天早上把 LINE 群組的訊息歸檔、整理成摘要，再把公告貼上院內網站。', trait: '消息最靈通，手機不離手，診所有什麼新鮮事都知道。' },
    tui: { title: 'CRM 推播員', desc: '負責 Try 週報、醫師空檔週報（週一、週四）和 CRM 自動登入，確保推播準時送到 LINE。', trait: '衝勁十足，脖子掛著 CRM 鑰匙；鑰匙卡住時會急著打電話求救。' },
    o: { title: '運作檢查員', desc: '每小時巡房一次，檢查所有排程與程式有沒有準時完成，也核對總覽頁跟 Mac 上的實際狀況一致。', trait: '一絲不苟，監控牆 16 格燈號都看在眼裡。他自己冒汗代表報告超過 2 小時沒更新。' },
    bei: { title: '備份管理員', desc: '每天凌晨把電子病歷等重要資料打包，送進外接硬碟與 NAS 兩個倉庫。', trait: '力氣大、最可靠，穿著反光背心搬箱子；機房紅燈一閃他就會去查。' },
    claude: { title: 'AI 顧問', desc: '每天早上讀運作報告，寫給院長的專業建議，也負責今天辦公室的小故事。', trait: '沉穩、愛喝咖啡，習慣把問題的原因和下一步講清楚。' },
    mei: { title: '臨床同仁（真人代表）', desc: '代表診所的跟診助理，不負責任何系統。會到各房間串門子，提醒跟診、櫃台、感控的注意事項和 LINE 群組裡的診所大小事；每 30 分鐘在大廳白板開一堂「器械小教室」。', trait: '熱心、愛聊天；診間消毒和器械盤準備從不馬虎。員工旅遊時第一個拖著行李出發。' },
  };
  const DOORS = { lobby: [1010, 1482], photo: [905, 740], post: [1090, 742], server: [1890, 742], monitor: [1270, 1484], study: [1890, 1482] };
  const ROOM_NAME = { lobby: '大廳', photo: '照片室', post: '公告室', server: '機房', monitor: '監控室', study: '顧問室' };
  const SCREENS = { xs: [1238, 1325, 1415, 1506], ys: [787, 858, 933, 1006], w: 64, h: 51 };
  const SIGN = [528, 885, 277, 143];
  const CLOCK = [1669, 879, 30];
  const BEACON = [2462, 268];
  const LAMPS = [[625, 900, 230], [740, 940, 230], [2208, 830, 300], [700, 75, 320], [1420, 70, 320], [1560, 1020, 260]];
  // 節慶裝飾：y 是掛點（hang，掛牆／天花板，畫在人物後面）或底部（floor，和人物一起前後排序）
  // w 或 h 擇一指定大小；glow＝暖光、twinkle＝閃爍、fu＝中間寫「福」
  const DECOR_PLACE = {
    halloween: [
      { n: '三角旗', x: 485, y: 86, w: 300, hang: true }, { n: '三角旗', x: 660, y: 812, w: 290, hang: true },
      { n: '蝙蝠串', x: 2250, y: 128, w: 430, hang: true }, { n: '幽靈', x: 1330, y: 62, h: 175, hang: true },
      { n: '大南瓜燈', x: 612, y: 1198, h: 84, glow: true }, { n: '小南瓜', x: 930, y: 744, h: 82 }, { n: '小南瓜', x: 2650, y: 1502, h: 78 },
    ],
    xmas: [
      { n: '燈串', x: 485, y: 86, w: 300, hang: true, twinkle: true }, { n: '燈串', x: 660, y: 812, w: 255, hang: true, twinkle: true },
      { n: '燈串', x: 2250, y: 128, w: 430, hang: true, twinkle: true }, { n: '花圈', x: 195, y: 990, h: 120, hang: true },
      { n: '聖誕襪', x: 505, y: 1185, h: 105, hang: true }, { n: '聖誕樹', x: 2610, y: 1495, h: 380, glow: true }, { n: '禮物堆', x: 2560, y: 1512, h: 100 },
    ],
    cny: [
      { n: '燈籠', x: 520, y: 62, h: 220, hang: true, glow: true }, { n: '燈籠', x: 2250, y: 125, h: 215, hang: true, glow: true },
      { n: '福字斗方', x: 195, y: 985, h: 150, hang: true, fu: true }, { n: '鞭炮', x: 305, y: 880, h: 260, hang: true },
      { n: '橘子', x: 600, y: 1100, h: 68, hang: true },
    ],
    newyear: [
      { n: '星星串', x: 485, y: 86, w: 300, hang: true, twinkle: true }, { n: '星星串', x: 660, y: 812, w: 255, hang: true, twinkle: true },
      { n: '煙火', x: 135, y: 18, h: 165, hang: true, twinkle: true }, { n: '氣球', x: 150, y: 1512, h: 250 },
      { n: '香檳桌', x: 2610, y: 1500, h: 150 }, { n: '拉炮', x: 1665, y: 1490, h: 85 },
    ],
    dragonboat: [
      { n: '粽子串', x: 305, y: 880, h: 250, hang: true }, { n: '艾草', x: 195, y: 960, h: 170, hang: true },
      { n: '香包', x: 2090, y: 815, h: 150, hang: true }, { n: '龍舟', x: 2590, y: 1255, h: 70 }, { n: '立蛋', x: 1300, y: 1188, h: 55 },
    ],
    midautumn: [
      { n: '月亮', x: 150, y: 12, h: 160, hang: true, glow: true }, { n: '兔子燈', x: 430, y: 840, h: 170, hang: true, glow: true },
      { n: '月餅禮盒', x: 600, y: 1088, h: 72, hang: true }, { n: '柚子', x: 2655, y: 1502, h: 88 }, { n: '烤肉架', x: 930, y: 745, h: 120 },
    ],
  };
  // 診所活動的裝飾（依活動階段：pre 預告、eve 前一天、during 當天、post 結束後）
  const POSTER = { n: '龜山島海報', x: 470, y: 140, h: 150, hang: true };
  const NOTICE = { n: '公告紙', x: 195, y: 960, h: 175, hang: true, notice: true };
  const EVENT_DECOR = {
    trip: {
      pre: [POSTER, NOTICE], eve: [POSTER, NOTICE, { n: '行李箱', x: 160, y: 1512, h: 140 }],
      during: [POSTER, NOTICE, { n: '行李箱', x: 160, y: 1512, h: 140 }, { n: '溫泉牌', x: 2655, y: 1500, h: 150 }],
      post: [POSTER, { n: '牛舌餅', x: 600, y: 1085, h: 75, hang: true }],
    },
  };
  const THEME_LINES = {
    halloween: [['lai', '萬聖節快到了！今天不搗蛋，只貼公告～'], ['bei', '南瓜燈要不要也備份一份？']],
    xmas: [['claude', '聖誕快樂！今年的備份成績單很漂亮'], ['kui', '聖誕快樂～櫃台也掛上襪子了']],
    cny: [['kui', '新年快樂，恭喜發財！'], ['o', '過年期間我照常每小時巡房']],
    newyear: [['o', '新年快樂！今年也每小時幫大家巡房'], ['bei', '跨年夜的備份也準時完成'], ['mei', '新的一年，牙齒也要健健康康！']],
    dragonboat: [['mei', '端午節快樂，中午記得立蛋！'], ['kui', '粽子吃完要記得刷牙喔']],
    midautumn: [['mei', '中秋烤肉後記得刷牙、用牙線～'], ['claude', '中秋節快樂，今晚的月亮好圓']],
  };
  const RANK = { fail: 4, warn: 3, wait: 2, ok: 1, none: 0 };
  const ST_TXT = { ok: '正常', warn: '需注意', fail: '失敗', wait: '等待中' };
  const COLOR = { ok: '#4fd18a', warn: '#ffb23a', fail: '#ff5a4a', wait: '#7cb1ea' };

  // ---------- DOM ----------
  mount.innerHTML = `<div class="fo" id="fo">
    <div class="fo-bar"><b>福美 AI 事務所</b><span class="fo-date"></span><span class="fo-hol"></span><span class="fo-hol fo-ev"></span>
      <span class="fo-sp"></span><button class="fo-btn" type="button" data-act="toggle">收合</button></div>
    <div class="fo-stage"><canvas aria-label="福美 AI 事務所動畫：每位員工代表一個院內系統，點員工看該系統的運作紀錄"></canvas><div class="fo-tip" hidden></div></div>
    <div class="fo-panels">
      <div class="fo-p"><h4>今日小記</h4><div class="fo-note"></div></div>
      <div class="fo-p"><h4>運作狀態</h4><div class="fo-counts"></div><div class="fo-lights"></div></div>
      <div class="fo-p"><h4>員工名冊</h4><div class="fo-list"></div></div>
    </div>
    <dialog class="fo-card" aria-label="角色介紹"></dialog></div>`;
  const root = mount.querySelector('.fo'), cv = root.querySelector('canvas'), ctx = cv.getContext('2d'), tip = root.querySelector('.fo-tip');
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  if (SITE) root.classList.add('site');
  try { if (localStorage.getItem('fo-collapsed') === '1') root.classList.add('collapsed'); } catch (e) { }
  root.querySelector('[data-act=toggle]').textContent = root.classList.contains('collapsed') ? '展開' : '收合';

  // ---------- 素材 ----------
  // 手機等小畫面（寬度 < 760）改用 assets/sm/ 的半尺寸 WebP（_工具/make_small.py 產生），下載量約 1/10
  const SMALL = (mount.clientWidth || window.innerWidth || 1200) < 760, SK = SMALL ? 0.5 : 1;
  const sm = src => SMALL ? 'assets/sm/' + src.replace(/^assets\//, '').replace(/\.(png|jpe?g)$/, '.webp') : src;
  // 圖片等動畫捲到畫面附近才開始下載（網站首頁的動畫在最下面，不拖慢首頁）
  let started = false; const QUEUE = [];
  const img = src => { const i = new Image(); if (started) i.src = BASE + src; else QUEUE.push([i, BASE + src]); return i; };
  function begin() { if (started) return; started = true; QUEUE.splice(0).forEach(([i, s]) => { i.src = s; }); }
  const BG = img(sm('assets/bg.jpg')), BOARD_IMG = img(sm('assets/board.png'));
  const SHEETS = {};
  Object.keys(SP.chars).forEach(id => { SHEETS[id] = img(sm(SP.chars[id].img)); });
  const CORE = () => [BG, BOARD_IMG].concat(Object.values(SHEETS));
  const AV = id => BASE + (SMALL ? `assets/sm/avatars/${id}.webp` : `assets/avatars/${id}.png`);

  const DECOR_IMG = {}; // 用到哪個主題才載入，不要一次全部下載
  const decorImg = k => (SP.decor && SP.decor[k]) ? (DECOR_IMG[k] || (DECOR_IMG[k] = img(sm(SP.decor[k].img)))) : null;
  const QS = new URLSearchParams(location.search);
  const FO_THEME = QS.get('fo-theme'); // 測試用：?fo-theme=halloween / xmas / cny / newyear / dragonboat / midautumn
  const FO_DATE = (QS.get('fo-date') || '').match(/^(\d{4})-(\d{2})-(\d{2})$/); // 測試用：?fo-date=2026-11-13 看活動當天

  // ---------- 資料 ----------
  let D = null;
  // ?fo-date 模擬別天時，status.json 的節慶與假日是「今天」的，不套用
  const cal = () => (D && D.calendar && (!FO_DATE || D.calendar.date === FO_DATE[0])) ? D.calendar : {};
  const theme = () => FO_THEME || cal().theme || '';
  // 測試用：網址加 ?fo-time=02:10 可以看指定時刻的樣子（夜間、排程加班）
  const FO_TIME = (new URLSearchParams(location.search).get('fo-time') || '').match(/^(\d{1,2}):(\d{2})$/);
  const now = () => { const d = new Date(); if (FO_DATE) d.setFullYear(+FO_DATE[1], +FO_DATE[2] - 1, +FO_DATE[3]); if (FO_TIME) d.setHours(+FO_TIME[1], +FO_TIME[2]); return d; };
  const localISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; // 用本機（台北）日期，不用 UTC
  // 診所活動（web/events.js）：算出今天在哪個階段
  const dayNum = iso => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) / 86400000; };
  function activeEvents() {
    const t = dayNum(localISO(now()));
    return (window.FUMEI_OFFICE_EVENTS || []).map(e => {
      const s0 = dayNum(e.start), s1 = dayNum(e.end); let phase = null;
      if (t >= s0 && t <= s1) phase = 'during';
      else if (t < s0 && s0 - t <= (e.pre || 0)) phase = s0 - t === 1 ? 'eve' : 'pre';
      else if (t > s1 && t - s1 <= (e.post || 0)) phase = 'post';
      return phase ? { e, phase, days: s0 - t } : null;
    }).filter(Boolean);
  }
  const awayToday = def => def.human && activeEvents().some(a => a.e.kind === 'trip' && a.phase === 'during');
  const itemsById = () => { const m = {}; (D && D.items || []).forEach(i => m[i.id] = i); return m; };
  function moodOf(def) {
    const m = itemsById();
    let worst = null;
    def.items.forEach(id => { const it = m[id]; if (it && (!worst || RANK[it.status] > RANK[worst.status])) worst = it; });
    let level = worst ? (worst.status === 'wait' ? 'ok' : worst.status) : 'ok';
    let note = '';
    if (def.self && D) { // 小 O：檢查程式自己太久沒跑
      const h = (Date.now() - new Date(D.generated_iso).getTime()) / 3600000;
      if (h > (OPT.staleHours || 2)) { level = 'fail'; note = `我已經 ${Math.floor(h)} 小時沒巡房了…`; }
    }
    return { level, item: worst, note };
  }
  const inShift = def => { const t = now(), m = t.getHours() * 60 + t.getMinutes();
    return (def.shift || []).some(([h1, m1, h2, m2]) => m >= h1 * 60 + m1 && m <= h2 * 60 + m2); };
  const isNight = () => { const h = now().getHours() + now().getMinutes() / 60; return h >= 21.5 || h < 7; };
  const darkness = () => { const h = now().getHours() + now().getMinutes() / 60;
    if (h >= 20 || h < 6) return 0.52; if (h >= 18.5) return (h - 18.5) / 1.5 * 0.52; if (h < 7) return (7 - h) * 0.52; return 0; };

  // ---------- 角色 ----------
  const rnd = (a, b) => a + Math.random() * (b - a);
  const chars = STAFF.map(def => {
    const [x, y] = SPOTS[def.room][def.home];
    return { def, room: def.room, x, y, tx: x, ty: y, mode: 'work', until: performance.now() + rnd(2000, 9000), pose: 'sit', face: 1, alpha: 1, visit: null };
  });
  function frameOf(c) { const f = SP.chars[c.def.id].frames; return f[c.pose] || f.stand; }
  function fade(c, t, dir, done) { c.mode = 'fade'; c.fadeDir = dir; c.fadeStart = t; c.fadeDone = done; }
  function startReturn(c, t) { c.visit = c.visit || {}; c.visit.stage = 'return'; goTo(c, DOORS[c.room]); }
  function goTo(c, spot) { c.tx = spot[0]; c.ty = spot[1]; c.mode = 'walk'; }
  // 挑一個沒人的站位：不能是別人的工位，也不能離別人現在的位置或正要去的位置太近
  const GAP = 150;
  function pickSpot(c, room, list, must) {
    const others = chars.filter(o => o !== c && !o.hidden);
    const dist = s => Math.min(...others.filter(o => o.room === room).map(o => Math.min(Math.hypot(o.x - s[0], o.y - s[1]), Math.hypot(o.tx - s[0], o.ty - s[1]))), 1e9);
    const ok = list.filter(s => !others.some(o => o.def.room === room && SPOTS[room][o.def.home] === s) && dist(s) > GAP
      && Math.hypot(s[0] - LESSON_SPOT[0], s[1] - LESSON_SPOT[1]) > GAP);
    if (ok.length) return ok[Math.floor(Math.random() * ok.length)];
    // 串門子一定要有地方站：挑離大家最遠的那個
    return must ? list.slice().sort((a, b) => dist(b) - dist(a))[0] : null;
  }
  function decide(c, t) {
    const md = moodOf(c.def), home = SPOTS[c.def.room][c.def.home];
    c.mood = md;
    if (c.def.human && lessonBusy()) { // 器械小教室：先回大廳，走到白板旁邊站好
      if (c.room !== c.def.room) return startReturn(c, t);
      if (Math.hypot(c.x - LESSON_SPOT[0], c.y - LESSON_SPOT[1]) > 4) return goTo(c, LESSON_SPOT);
      c.mode = 'idle'; c.pose = 'stand'; c.until = t + 2000; return;
    }
    // 串門子中：時間到就回家；晚上也要先回自己的房間
    if (c.room !== c.def.room) { if (c.visit && c.visit.stage === 'visiting' && t < c.until && !isNight()) return; return startReturn(c, t); }
    const atHome = Math.hypot(c.x - home[0], c.y - home[1]) < 4;
    if (md.level === 'fail') { if (!atHome) return goTo(c, home); c.mode = 'alarm'; c.pose = 'worry'; c.until = t + 4000; return; }
    if (isNight() && !inShift(c.def)) { if (!atHome) return goTo(c, home); c.mode = 'sleep'; c.pose = 'sleep'; c.until = t + 15000; return; }
    // 白天（或排程時段）的工作循環
    if (c.mode === 'work') {
      if (md.level === 'warn' && Math.random() < 0.6) { c.mode = 'worry'; c.pose = 'worry'; c.until = t + rnd(3500, 5000); return; }
      if (c.def.roam && Math.random() < 0.45) { // 小美：去別的房間串門子
        const to = c.def.roam[Math.floor(Math.random() * c.def.roam.length)];
        c.visit = { to, stage: 'toDoor' }; return goTo(c, DOORS[c.room]);
      }
      const to = pickSpot(c, c.room, roomSpots(c.room).filter(s => s !== home));
      if (!to) { c.until = t + rnd(4000, 8000); return; } // 沒有空位就繼續坐著工作
      return goTo(c, to);
    }
    if (c.mode === 'idle' || c.mode === 'worry' || c.mode === 'sleep' || c.mode === 'alarm') {
      if (!atHome) return goTo(c, home);
      c.mode = 'work'; c.pose = 'sit'; c.until = t + rnd(8000, 14000); return;
    }
  }
  function arriveVisit(c, t) { // 串門子各階段：走到門口 → 淡出 → 在另一間門口淡入 → 走進去逛 → 回程同理
    const v = c.visit;
    if (v.stage === 'toDoor') { fade(c, t, -1, t2 => { c.room = v.to; [c.x, c.y] = DOORS[v.to]; v.stage = 'enter';
      fade(c, t2, 1, t3 => { v.stage = 'inRoom'; goTo(c, pickSpot(c, v.to, roomSpots(v.to), true)); }); }); return true; }
    if (v.stage === 'inRoom') { v.stage = 'visiting'; c.mode = 'idle'; c.pose = 'stand'; c.until = t + rnd(6000, 10000); return true; }
    if (v.stage === 'return') { fade(c, t, -1, t2 => { c.room = c.def.room; [c.x, c.y] = DOORS[c.room]; v.stage = 'home';
      fade(c, t2, 1, () => { c.visit = null; goTo(c, c.def.human && lessonBusy() ? LESSON_SPOT : SPOTS[c.room][c.def.home]); }); }); return true; }
    return false;
  }
  function step(c, t, dt) {
    c.hidden = awayToday(c.def); // 員工旅遊當天：小美不在辦公室
    if (c.hidden) return;
    if (c.mode === 'fade') {
      const p = Math.min(1, (t - c.fadeStart) / 400); c.alpha = c.fadeDir < 0 ? 1 - p : p;
      if (p >= 1) { const f = c.fadeDone; c.fadeDone = null; c.mode = 'idle'; c.until = t + 1e9; f && f(t); }
      return;
    }
    if (c.mode === 'walk') {
      const dx = c.tx - c.x, dy = c.ty - c.y, d = Math.hypot(dx, dy), v = 85 * dt;
      if (d <= v) { c.x = c.tx; c.y = c.ty;
        if (c.visit && arriveVisit(c, t)) return;
        const home = SPOTS[c.def.room][c.def.home];
        if (c.x === home[0] && c.y === home[1]) { c.mode = 'work'; c.pose = 'sit'; c.until = t + rnd(8000, 14000); }
        else { c.mode = 'idle'; c.pose = 'stand'; c.until = t + rnd(3000, 5500); }
        decideNow(c, t, true); return; }
      c.x += dx / d * v; c.y += dy / d * v; if (Math.abs(dx) > 2) c.face = dx > 0 ? 1 : -1;
      const eve = c.def.human && activeEvents().some(a => a.e.kind === 'trip' && a.phase === 'eve');
      c.pose = eve ? 'travel' : (Math.floor(t / 230) % 2 ? 'walk1' : 'walk2'); // 員旅前一天：小美拖著行李走
      return;
    }
    if (t > c.until || (c.def.human && lessonBusy() && c.mode !== 'idle')) decide(c, t);
  }
  function decideNow(c, t, arrived) {
    const md = moodOf(c.def);
    if (md.level === 'fail' || (isNight() && !inShift(c.def))) decide(c, t);
  }

  // ---------- 器械小教室（每 30 分鐘一堂，內容來自 28_牙科器械認識，見 lessons.js） ----------
  const LESSONS = window.FUMEI_OFFICE_LESSONS || [];
  const TALK = window.FUMEI_OFFICE_TALK || { tips: {}, mei: [], meiLine: [], skits: [] };
  const slotNow = () => { const d = now(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 1800000); };
  const lessonAt = slot => LESSONS.length ? LESSONS[((slot % LESSONS.length) + LESSONS.length) % LESSONS.length] : null;
  const LESSON_IMG = {};
  const lessonImg = l => LESSON_IMG[l.id] || (LESSON_IMG[l.id] = img('assets/lessons/' + l.id + '.png'));
  // 每堂課開始後 90 秒內（白天、小美在辦公室時）小美會走到白板前講解
  const lessonWindow = () => { const d = now(); return !isNight() && (d.getMinutes() % 30) * 60 + d.getSeconds() < 90; };
  let lesson = null; // { slot, phase: 'walking' | 'talking' | 'done', t0 }
  const lessonBusy = () => !!lesson && lesson.phase !== 'done';
  function lessonBeats(l) {
    const out = [['mei', `器械小教室開始囉！今天認識「${l.zh}」${l.alias && l.alias !== l.zh ? `，院內也叫它「${l.alias}」` : ''}。`]];
    if (l.purpose) out.push(['mei', `用途：${l.purpose}`]);
    const notes = l.notes.slice(); if (notes.length) out.push(['mei', `小提醒：${notes.splice(Math.floor(Math.random() * notes.length), 1)[0]}`]);
    if (notes.length && Math.random() < 0.6) out.push(['mei', `還有：${notes[Math.floor(Math.random() * notes.length)]}`]);
    out.push(['mei', '想看照片和更多說明，點左邊的白板就有喔！']);
    return out;
  }

  // ---------- 對話框：導播（小故事、狀況回報、小叮嚀、互動小劇場、節慶台詞、器械小教室輪流播） ----------
  let bubble = null, nextBubble = performance.now() + 2500; // 等資料（含 story.js）載完再開始說話
  let queue = [], storyAt = -1e9, lastSkit = performance.now();
  // 每週話題（web/weekly.js，週三 06:00 排程任務產生）：診所 LINE 的事＋牙科議題，播放時在公告室布告欄釘一張照片／便條
  const WEEKLY = (window.FUMEI_OFFICE_WEEKLY && window.FUMEI_OFFICE_WEEKLY.events) || [];
  let lastWeekly = performance.now() - 2 * 60000, pinned = null; // pinned＝{ ev, until }
  const PIN = { x: 1490, y: 172, w: 176, h: 206 }; // 公告室布告欄上的位置（世界座標）
  const alertAt = {}; // 同一人的狀況回報至少隔 10 分鐘才再講
  const BAGS = {}; // 洗牌袋：一輪講完才會重複
  function draw1(key, arr) {
    if (!arr || !arr.length) return null;
    let b = BAGS[key]; if (!b || !b.length) { b = BAGS[key] = arr.slice().sort(() => Math.random() - 0.5); }
    return b.pop();
  }
  const awake = c => c && !c.hidden && c.mode !== 'sleep';
  const charOf = id => chars.find(c => c.def.id === id);
  function statusLine(c) {
    const md = c.mood || moodOf(c.def);
    if (md.note) return md.note;
    if (md.level === 'fail') return `糟糕！「${md.item.name}」沒有跑成功`;
    if (md.level === 'warn') return `${md.item.name}：${(md.item.summary || '').replace(/（.*$/, '').slice(0, 24)}`;
    return null;
  }
  function meiTip() {
    const news = window.FUMEI_MEI_NEWS, fresh = news && news.date && dayNum(localISO(now())) - dayNum(news.date) <= 7 && (news.items || []).length;
    const r = Math.random();
    if (fresh && r < 0.15) return draw1('news', news.items.map(x => typeof x === 'string' ? x : x.text));
    if (r < 0.55) return (draw1('meiLine', TALK.meiLine) || {}).text;
    if (r < 0.75) return (draw1('mei', TALK.mei) || {}).text;
    const l = draw1('lessonTip', LESSONS.filter(l => l.notes.length)); // 28 器械認識裡的注意事項
    return l ? `【${l.zh}】${l.notes[Math.floor(Math.random() * l.notes.length)]}` : null;
  }
  function program(t) { // 挑下一段要播的內容，放進 queue
    const today = localISO(now()), story = window.FUMEI_STORY;
    const hasStory = story && story.date === today && Array.isArray(story.beats) && story.beats.length;
    if (hasStory && t - storyAt > 25 * 60000) { storyAt = t; return story.beats.map(b => [b.who, b.text]); }
    const up = chars.filter(awake); if (!up.length) return [];
    const alerts = up.filter(c => statusLine(c) && t - (alertAt[c.def.id] || -1e9) > 10 * 60000);
    if (alerts.length && Math.random() < 0.5) { const c = alerts[Math.floor(Math.random() * alerts.length)]; alertAt[c.def.id] = t; return [[c.def.id, statusLine(c)]]; }
    if (WEEKLY.length && t - lastWeekly > rnd(3, 6) * 60000 && Math.random() < 0.5) {
      const newest = WEEKLY.reduce((m, e) => e.week > m ? e.week : m, '');
      const pool = Math.random() < 0.7 ? WEEKLY.filter(e => e.week === newest) : WEEKLY; // 七成播最新一週
      const ok = pool.filter(e => e.beats.every(([w]) => awake(charOf(w))));
      const ev = draw1('weekly:' + newest + ':' + ok.length, ok);
      if (ev) { lastWeekly = t; pinned = { ev, until: t + 90000 + ev.beats.length * 9000 }; return ev.beats.slice(); }
    }
    if (t - lastSkit > rnd(4, 8) * 60000 && Math.random() < 0.5) {
      const ok = (TALK.skits || []).filter(k => k.beats.every(([w]) => awake(charOf(w))));
      const k = draw1('skit:' + ok.length, ok); if (k) { lastSkit = t; return k.beats.slice(); }
    }
    const fest = (THEME_LINES[theme()] || []).concat(...activeEvents().map(a => ((a.e.lines || {})[a.phase] || (a.phase === 'eve' ? (a.e.lines || {}).pre : []) || [])
      .map(([w, x]) => [w, x.replace('{days}', a.days)]))).filter(([w]) => awake(charOf(w)));
    if (fest.length && Math.random() < 0.08) { const f = draw1('fest:' + theme() + fest.length, fest); if (f) return [f]; }
    // 小叮嚀：小美講的機會比較多（她有診所的大小事、LINE 公告、器械注意事項）
    const pool = []; up.forEach(c => { for (let k = c.def.human ? 5 : 1; k > 0; k--) pool.push(c); });
    const c = pool[Math.floor(Math.random() * pool.length)];
    const text = c.def.human ? meiTip() : draw1('tip:' + c.def.id, (TALK.tips || {})[c.def.id]);
    return text ? [[c.def.id, text]] : [[c.def.id, c.def.line]];
  }
  const sayFor = text => Math.min(11000, Math.max(4500, 3200 + text.length * 120)); // 字多就停久一點
  function tickBubble(t) {
    // 器械小教室：時間到就讓小美去白板（插播，清掉排隊中的對話）
    const mei = charOf('mei'), slot = slotNow();
    if (lessonWindow() && awake(mei) && LESSONS.length && (!lesson || lesson.slot !== slot)) { lesson = { slot, phase: 'walking', t0: t }; mei.until = 0; }
    if (lesson && lesson.phase === 'walking' && (Math.hypot(mei.x - LESSON_SPOT[0], mei.y - LESSON_SPOT[1]) < 6 || t - lesson.t0 > 45000)) {
      lesson.phase = 'talking'; queue = lessonBeats(lessonAt(lesson.slot)); bubble = null; nextBubble = t + 400;
    }
    if (bubble && t > bubble.until) { bubble = null; nextBubble = Math.max(nextBubble, t + (queue.length ? 700 : rnd(2500, 5000))); }
    if (bubble || t < nextBubble) return;
    if (!queue.length) {
      if (lesson && lesson.phase === 'talking') { lesson.phase = 'done'; mei.until = t + 4000; }
      if (lessonBusy()) { nextBubble = t + 1000; return; }
      queue = program(t); if (!queue.length) { nextBubble = t + 5000; return; }
    }
    const [who, text] = queue.shift(), c = charOf(who);
    if (c && !c.hidden && text) bubble = { c, text, until: t + sayFor(text) };
    else nextBubble = t + 300;
  }

  // ---------- 繪圖 ----------
  let K = 1, dpr = 1, hover = null;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = cv.clientWidth || 1180, h = cv.clientHeight || w * H / W;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  }
  function wrapText(text, maxW) {
    const out = []; let line = '';
    for (const ch of text) { if (ctx.measureText(line + ch).width > maxW && line) { out.push(line); line = ch; } else line += ch; }
    if (line) out.push(line);
    if (out.length > 5) { out.length = 5; out[4] = out[4].slice(0, -1) + '…'; }
    return out;
  }
  let lampCv = null, lampDk = -1;
  function lampLayer(dk) {
    if (!lampCv) { lampCv = document.createElement('canvas'); lampCv.width = W / 4; lampCv.height = H / 4; }
    if (Math.abs(dk - lampDk) > 0.01) {
      lampDk = dk; const c = lampCv.getContext('2d'); c.clearRect(0, 0, lampCv.width, lampCv.height); c.setTransform(0.25, 0, 0, 0.25, 0, 0);
      LAMPS.forEach(([x, y, r]) => { const g = c.createRadialGradient(x, y, 4, x, y, r); g.addColorStop(0, `rgba(255,190,110,${dk * 0.55})`); g.addColorStop(1, 'rgba(255,190,110,0)'); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); });
    }
    return lampCv;
  }
  function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function draw(t) {
    const cw = cv.width, ch = cv.height;
    // 收合時畫布以 cover 方式顯示，內容一樣畫整張世界
    K = cw / W;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    const sy = ch / H; // 收合時 cv 的長寬比和世界不同：用 K 等比，置中
    const S = Math.max(K, sy), ox = (cw - W * S) / 2, oy = (ch - H * S) * 0.7;
    ctx.setTransform(S, 0, 0, S, ox, oy);
    view = { S, ox, oy };
    const core = CORE(), ready = core.filter(i => i.complete && i.naturalWidth).length;
    if (ready < core.length) { // 載入中：深色底＋進度，不要只出現一半的人
      ctx.fillStyle = '#1d1815'; ctx.fillRect(0, 0, W, H); ctx.fillStyle = '#f0b44c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '700 72px "PingFang TC","Noto Sans TC",sans-serif'; ctx.fillText('福美 AI 事務所 準備中…', W / 2, H / 2 - 40);
      ctx.fillStyle = '#4a3d33'; ctx.fillRect(W / 2 - 500, H / 2 + 50, 1000, 26); ctx.fillStyle = '#f0b44c'; ctx.fillRect(W / 2 - 500, H / 2 + 50, 1000 * ready / core.length, 26);
      return;
    }
    ctx.drawImage(BG, 0, 0, W, H);
    const items = D ? D.items : [];
    // 監控牆 16 格
    items.slice(0, 16).forEach((it, i) => {
      const x = SCREENS.xs[i % 4], y = SCREENS.ys[Math.floor(i / 4)], col = COLOR[it.status] || '#888';
      const blink = it.status === 'fail' || it.status === 'warn' ? (0.25 + 0.25 * Math.sin(t / 300)) : 0.32;
      ctx.globalAlpha = blink; ctx.fillStyle = col; ctx.fillRect(x + 4, y + 4, SCREENS.w - 8, SCREENS.h - 8); ctx.globalAlpha = 1;
    });
    // 招牌
    ctx.fillStyle = '#f5e6c8'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '700 64px "PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif';
    ctx.fillText('福美牙醫', SIGN[0] + SIGN[2] / 2, SIGN[1] + 58);
    ctx.font = '500 30px "PingFang TC","Noto Sans TC",sans-serif'; ctx.fillStyle = '#e8b04a';
    ctx.fillText('AI 事 務 所', SIGN[0] + SIGN[2] / 2, SIGN[1] + 108);
    // 時鐘（真實時間）
    const tm = now(), [cx0, cy0, cr] = CLOCK;
    ctx.fillStyle = 'rgb(172,165,150)'; ctx.beginPath(); ctx.arc(cx0, cy0, cr, 0, Math.PI * 2); ctx.fill();
    const hand = (ang, len, w) => { ctx.strokeStyle = '#2b2420'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(cx0, cy0); ctx.lineTo(cx0 + Math.sin(ang) * len, cy0 - Math.cos(ang) * len); ctx.stroke(); };
    hand(((tm.getHours() % 12) + tm.getMinutes() / 60) / 12 * Math.PI * 2, 15, 5); hand(tm.getMinutes() / 60 * Math.PI * 2, 24, 3.5);
    // 機房警示燈
    const bk = ['backup', 'nas_backup'].map(id => (itemsById()[id] || {}).status);
    const bLevel = bk.includes('fail') ? 2 : bk.includes('warn') ? 1 : 0;
    if (bLevel) { const a = bLevel === 2 ? 0.55 + 0.45 * Math.sin(t / 160) : 0.3 + 0.2 * Math.sin(t / 600);
      const g = ctx.createRadialGradient(BEACON[0], BEACON[1], 4, BEACON[0], BEACON[1], 150);
      g.addColorStop(0, `rgba(255,60,40,${a})`); g.addColorStop(1, 'rgba(255,60,40,0)'); ctx.fillStyle = g; ctx.fillRect(BEACON[0] - 150, BEACON[1] - 150, 300, 300); }
    // 節慶：牆上／天花板的裝飾
    // 今天要擺的裝飾＝節慶主題＋進行中的診所活動（每件記住屬於哪一張裝飾圖 k）
    const th = theme(), places = (DECOR_PLACE[th] || []).map(d => Object.assign({ k: th }, d));
    activeEvents().forEach(a => (((EVENT_DECOR[a.e.kind] || {})[a.phase]) || []).forEach(d => places.push(Object.assign({ k: a.e.kind, ev: a.e }, d))));
    const decorBox = d => { const f = SP.decor[d.k].frames[d.n]; const sc = d.w ? d.w / f[2] : d.h / f[3]; return [f, f[2] * sc, f[3] * sc]; };
    function drawDecor(d) {
      const dimg = decorImg(d.k);
      if (!dimg || !dimg.complete || !dimg.naturalWidth || !SP.decor[d.k].frames[d.n]) return;
      const [f, w, h] = decorBox(d), x = d.x - w / 2, y = d.hang ? d.y : d.y - h;
      if (d.glow) { const a = 0.35 + 0.12 * Math.sin(t / 500 + d.x), g = ctx.createRadialGradient(d.x, y + h * 0.45, 4, d.x, y + h * 0.45, Math.max(w, h) * 0.9);
        g.addColorStop(0, `rgba(255,170,80,${a})`); g.addColorStop(1, 'rgba(255,170,80,0)'); ctx.fillStyle = g; ctx.fillRect(d.x - w * 1.2, y - h * 0.5, w * 2.4, h * 2); }
      ctx.globalAlpha = d.twinkle ? 0.82 + 0.18 * Math.sin(t / 260 + d.x) : 1;
      ctx.drawImage(dimg, f[0] * SK, f[1] * SK, f[2] * SK, f[3] * SK, x, y, w, h); ctx.globalAlpha = 1;
      if (d.fu) { ctx.save(); ctx.translate(d.x, y + h / 2); ctx.fillStyle = '#1f130c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = `900 ${Math.round(h * 0.42)}px "PingFang TC","Noto Sans TC","Microsoft JhengHei",serif`; ctx.fillText('福', 0, h * 0.02); ctx.restore(); }
      if (d.notice && d.ev && d.ev.notice) { // 公告紙：先蓋掉紙上的雜線，再寫活動文字
        ctx.fillStyle = '#f6f1e6'; ctx.fillRect(x + w * 0.12, y + h * 0.18, w * 0.7, h * 0.62);
        ctx.fillStyle = '#2b2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        d.ev.notice.forEach((line, i) => { ctx.font = `${i === 1 ? 800 : 600} ${Math.round(h * (i === 1 ? 0.105 : 0.085))}px "PingFang TC","Noto Sans TC",sans-serif`;
          ctx.fillStyle = i === 2 ? '#b3261e' : '#2b2420'; ctx.fillText(line, d.x - w * 0.03, y + h * (0.32 + i * 0.17), w * 0.66); }); // 最後一個參數：太長就壓窄，不超出紙
      }
    }
    places.filter(d => d.hang).forEach(drawDecor);
    drawBoard();
    drawPin(t);
    // 角色與地上裝飾（依底部 y 排序）
    const floorDecor = places.filter(d => !d.hang).map(d => ({ decor: d, y: d.y }));
    const order = chars.concat(floorDecor).sort((a, b) => a.y - b.y);
    order.forEach(c => {
      if (c.decor) { drawDecor(c.decor); return; }
      if (c.hidden) { c.box = null; return; }
      const sh = SHEETS[c.def.id]; if (!sh.complete || !sh.naturalWidth) return;
      const [fx, fy, fw, fh] = frameOf(c);
      const bob = c.pose === 'stand' ? Math.round(Math.sin(t / 400 + c.x) * 2) : 0;
      // 腳下影子
      ctx.fillStyle = 'rgba(0,0,0,.22)'; ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, fw * 0.32, 12, 0, 0, Math.PI * 2); ctx.fill();
      if (c.mood && c.mood.level === 'fail') { ctx.strokeStyle = `rgba(255,70,50,${0.5 + 0.4 * Math.sin(t / 180)})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.ellipse(c.x, c.y - 4, fw * 0.45, 22, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.save(); ctx.globalAlpha = c.alpha == null ? 1 : c.alpha; ctx.translate(c.x, c.y + bob);
      if (c.face < 0 && (c.pose === 'walk1' || c.pose === 'walk2' || c.pose === 'travel')) ctx.scale(-1, 1);
      ctx.drawImage(sh, fx * SK, fy * SK, fw * SK, fh * SK, -fw / 2, -fh, fw, fh); ctx.restore();
      c.box = [c.x - fw / 2, c.y - fh, fw, fh];
    });
    // 夜間
    const dk = darkness();
    if (dk > 0) {
      ctx.fillStyle = `rgba(14,18,48,${dk})`; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(lampLayer(dk), 0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }
    // 名牌（滑鼠指到的人）
    if (hover && hover.box) nameTag(hover);
    // 對話框
    if (bubble && bubble.c.box) drawBubble(bubble.c, bubble.text, t);
  }
  // 白板：板面是斜的平行四邊形，先換到板面座標（寬 1000 × 高 580）再畫字和像素圖
  const boardRect = () => { const s = BOARD.h / BOARD.src[1], w = BOARD.src[0] * s; return { s, x: BOARD.x - w / 2, y: BOARD.y - BOARD.h, w, h: BOARD.h }; };
  const FACE_W = 1000, FACE_H = 580;
  function faceMatrix() { // 板面座標 → 世界座標
    const r = boardRect(), [[ax, ay], [bx, by], [cx, cy]] = BOARD.face;
    return [(bx - ax) * r.s / FACE_W, (by - ay) * r.s / FACE_W, (cx - ax) * r.s / FACE_H, (cy - ay) * r.s / FACE_H, r.x + ax * r.s, r.y + ay * r.s];
  }
  function onBoard(wx, wy) { // 點在板面上嗎（換回板面座標判斷）
    const [a, b, c, d, e, f] = faceMatrix(), det = a * d - b * c, x = wx - e, y = wy - f;
    const u = (d * x - c * y) / det, v = (-b * x + a * y) / det; return u >= 0 && u <= FACE_W && v >= 0 && v <= FACE_H;
  }
  function drawBoard() {
    if (!BOARD_IMG.complete || !BOARD_IMG.naturalWidth) return;
    const r = boardRect(); ctx.drawImage(BOARD_IMG, r.x, r.y, r.w, r.h);
    const l = lessonAt(lesson && lessonBusy() ? lesson.slot : slotNow()); if (!l) return;
    ctx.save(); ctx.transform(...faceMatrix());
    ctx.fillStyle = '#6b2e8f'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '800 64px "PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif'; ctx.fillText('器械小教室', 230, 40, 720);
    ctx.fillStyle = 'rgba(107,46,143,.35)'; ctx.fillRect(230, 118, 720, 6);
    const im = lessonImg(l); if (im.complete && im.naturalWidth) { ctx.imageSmoothingEnabled = false; ctx.drawImage(im, 210, 160, 330, 330); ctx.imageSmoothingEnabled = true; }
    ctx.fillStyle = '#2b2420'; ctx.font = '800 62px "PingFang TC","Noto Sans TC",sans-serif'; ctx.fillText(l.zh, 570, 180, 410);
    ctx.font = '500 40px "PingFang TC","Noto Sans TC",sans-serif'; ctx.fillStyle = '#5a4a3e';
    if (l.alias && l.alias !== l.zh) ctx.fillText('院內叫：' + l.alias, 570, 265, 410);
    ctx.fillText(l.cat, 570, 330, 410);
    ctx.fillStyle = '#1f6fb2'; ctx.font = '700 38px "PingFang TC","Noto Sans TC",sans-serif'; ctx.fillText('點我看介紹 ▶', 570, 430, 410);
    ctx.restore();
  }
  const WEEKLY_IMG = {};
  const weeklyImg = ev => ev.img ? (WEEKLY_IMG[ev.id] || (WEEKLY_IMG[ev.id] = img(sm(ev.img)))) : null;
  const onPin = (wx, wy) => pinned && performance.now() < pinned.until && wx >= PIN.x - PIN.w / 2 && wx <= PIN.x + PIN.w / 2 && wy >= PIN.y && wy <= PIN.y + PIN.h;
  function drawPin(t) { // 每週話題播放時：布告欄釘一張拍立得（有圖）或便條（沒圖），寫上標題
    if (!pinned || t > pinned.until) { pinned = null; return; }
    const ev = pinned.ev, im = weeklyImg(ev), { x, y, w, h } = PIN;
    ctx.save(); ctx.translate(x, y + h / 2); ctx.rotate(-0.04);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 8, w, h);
    ctx.fillStyle = im ? '#fbfaf5' : '#fff3a8'; ctx.fillRect(-w / 2, -h / 2, w, h);
    if (im && im.complete && im.naturalWidth) { const s = Math.min((w - 20) / im.naturalWidth, (h - 66) / im.naturalHeight), iw = im.naturalWidth * s, ih = im.naturalHeight * s;
      ctx.fillStyle = ev.kind === 'dental' ? '#dff0f7' : '#f3e8f7'; ctx.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 66);
      ctx.drawImage(im, -iw / 2, -h / 2 + 10 + (h - 66 - ih) / 2, iw, ih); }
    ctx.fillStyle = '#2b2420'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${im ? 22 : 26}px "PingFang TC","Noto Sans TC",sans-serif`;
    const lines = wrapText(ev.title, w - 24).slice(0, im ? 2 : 5);
    lines.forEach((l, i) => ctx.fillText(l, 0, (im ? h / 2 - 44 : -h / 2 + 44) + i * (im ? 24 : 32), w - 16));
    ctx.fillStyle = ev.kind === 'dental' ? '#1f6fb2' : '#6b2e8f'; ctx.beginPath(); ctx.arc(0, -h / 2 + 4, 9, 0, Math.PI * 2); ctx.fill(); // 圖釘
    ctx.restore();
  }
  let view = { S: 1, ox: 0, oy: 0 };
  function nameTag(c) {
    const [x, y, w] = c.box; ctx.font = '700 30px "PingFang TC","Noto Sans TC",sans-serif';
    const tw = ctx.measureText(c.def.name).width + 30, bx = x + w / 2 - tw / 2, by = y - 46;
    ctx.fillStyle = 'rgba(31,25,21,.85)'; roundRect(bx, by, tw, 40, 10); ctx.fill();
    ctx.fillStyle = '#f0b44c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(c.def.name, x + w / 2, by + 21);
  }
  // 手機畫面很窄：對話框放大約 2.6 倍，字才看得清楚（約 12px）
  const BF = SMALL ? 2.6 : 1;
  function drawBubble(c, text, t) {
    ctx.font = `500 ${Math.round(32 * BF)}px "PingFang TC","Noto Sans TC","Microsoft JhengHei",sans-serif`;
    const L = wrapText(`${c.def.name}：${text}`, SMALL ? 1150 : 560), lh = 42 * BF, pad = 18 * BF;
    const bw = Math.max(...L.map(l => ctx.measureText(l).width)) + pad * 2, bh = L.length * lh + 22 * BF;
    let bx = c.box[0] + c.box[2] / 2 - bw / 2, by = c.box[1] - bh - 24;
    bx = Math.max(12, Math.min(W - bw - 12, bx)); by = Math.max(12, by);
    ctx.fillStyle = '#fffaf0'; ctx.strokeStyle = '#2b2420'; ctx.lineWidth = 5 * BF; roundRect(bx, by, bw, bh, 12 * BF); ctx.fill(); ctx.stroke();
    const tx = Math.min(Math.max(c.x, bx + 24 * BF), bx + bw - 24 * BF), aw = 12 * BF, ah = 18 * BF;
    ctx.beginPath(); ctx.moveTo(tx - aw, by + bh - 2); ctx.lineTo(tx, by + bh + ah); ctx.lineTo(tx + aw, by + bh - 2); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(tx - aw, by + bh); ctx.lineTo(tx, by + bh + ah); ctx.lineTo(tx + aw, by + bh); ctx.stroke();
    ctx.fillStyle = '#2b2420'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    L.forEach((l, i) => ctx.fillText(l, bx + pad, by + 12 * BF + i * lh));
  }

  // ---------- 互動 ----------
  function toWorld(ev) { const r = cv.getBoundingClientRect(); const px = (ev.clientX - r.left) * dpr, py = (ev.clientY - r.top) * dpr;
    return [(px - view.ox) / view.S, (py - view.oy) / view.S, r]; }
  function hit(wx, wy) { return chars.slice().sort((a, b) => b.y - a.y).find(c => c.box && !c.hidden && wx >= c.box[0] && wx <= c.box[0] + c.box[2] && wy >= c.box[1] && wy <= c.box[1] + c.box[3]); }
  cv.addEventListener('mousemove', ev => {
    const [wx, wy, r] = toWorld(ev); const c = hit(wx, wy); hover = c || null; cv.classList.toggle('hand', !!c);
    if (!c) {
      if (onPin(wx, wy)) { cv.classList.add('hand');
        tip.innerHTML = `<b>本週話題</b>　${esc(pinned.ev.title)}<br><span style="color:#bfae92">點一下看說明</span>`;
        tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top - 14) + 'px'; tip.hidden = false; return; }
      const l = onBoard(wx, wy) && lessonAt(slotNow()); cv.classList.toggle('hand', !!l);
      if (!l) { tip.hidden = true; return; }
      tip.innerHTML = `<b>器械小教室</b>　${esc(l.zh)}<br><span style="color:#bfae92">每 30 分鐘換一個，點一下看介紹</span>`;
      tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top - 14) + 'px'; tip.hidden = false; return;
    }
    const md = c.mood || moodOf(c.def), it = md.item;
    tip.innerHTML = `<b>${esc(c.def.name)}</b>　${esc(c.def.role)}<br><span class="st" style="background:${COLOR[md.level]}"></span>${esc(ST_TXT[md.level])}${it ? '：' + esc(it.summary) : ''}<br><span style="color:#bfae92">${SITE ? '點一下看介紹' : '點一下看運作紀錄'}</span>`;
    tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top - 14) + 'px'; tip.hidden = false;
  });
  cv.addEventListener('mouseleave', () => { hover = null; tip.hidden = true; });
  function openItem(id) {
    if (!id) return; const job = document.getElementById('job-' + id); if (!job) return;
    const row = job.querySelector('.jrow'); if (row && !job.classList.contains('open')) row.click();
    const el = document.getElementById('job-' + id); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 90, behavior: 'smooth' });
  }
  cv.addEventListener('click', ev => { const [wx, wy] = toWorld(ev); const c = hit(wx, wy);
    if (!c) { if (onPin(wx, wy)) return openWeekly(pinned.ev);
      if (onBoard(wx, wy) && LESSONS.length) openLesson(LESSONS.indexOf(lessonAt(slotNow()))); return; }
    if (SITE) return openCard(c.def.id);
    const md = c.mood || moodOf(c.def); openItem((md.item || {}).id || c.def.items[0]); });
  root.addEventListener('click', ev => {
    const b = ev.target.closest('[data-act]'); if (!b) return;
    if (b.dataset.act === 'toggle') { root.classList.toggle('collapsed'); const col = root.classList.contains('collapsed');
      b.textContent = col ? '展開' : '收合'; try { localStorage.setItem('fo-collapsed', col ? '1' : '0'); } catch (e) { } resize(); }
    if (b.dataset.act === 'item') { if (card.open) card.close(); openItem(b.dataset.id); }
    if (b.dataset.act === 'member') openCard(b.dataset.id);
    if (b.dataset.act === 'close') card.close();
    if (b.dataset.act === 'lesson-prev') openLesson(lessonIdx - 1);
    if (b.dataset.act === 'lesson-next') openLesson(lessonIdx + 1);
    if (b.dataset.act === 'find') { const c = chars.find(c => c.def.id === b.dataset.id); card.close();
      if (c && !c.hidden) { bubble = { c, text: c.def.line, until: performance.now() + 5000 }; nextBubble = performance.now() + 6000; }
      window.scrollTo({ top: cv.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth' }); }
  });

  // ---------- 角色介紹卡 ----------
  // 動漫大頭照放在 assets/portraits/<代號>.jpg；還沒有的人先用像素大頭照
  const card = root.querySelector('.fo-card');
  card.addEventListener('click', ev => { if (ev.target === card) card.close(); }); // 點卡片外面關閉
  function openCard(id) {
    const c = chars.find(c => c.def.id === id); if (!c) return;
    const bio = BIO[id] || {}, md = c.mood || moodOf(c.def), items = (D && D.items) || [];
    const where = c.hidden ? '員工旅遊中' : c.room !== c.def.room ? `在${ROOM_NAME[c.room]}串門子` : (MODE_TXT[c.mode] || '');
    const jobs = c.def.items.map(k => items.find(i => i.id === k)).filter(Boolean).map(i =>
      SITE ? `<div class="fo-job ${i.status}"><i class="fo-dot"></i><span class="jn">${esc(i.name)}</span><span class="js">${esc(i.schedule || '')}</span></div>`
        : `<button class="fo-job ${i.status}" type="button" data-act="item" data-id="${esc(i.id)}"><i class="fo-dot"></i><span class="jn">${esc(i.name)}</span><span class="js">${esc(i.schedule || '')}</span></button>`).join('');
    card.innerHTML = `<div class="fo-card-in">
      <div class="fo-pic"><img src="${BASE}assets/portraits/${id}.jpg" alt="${esc(c.def.name)}的大頭照"
        onerror="this.onerror=null;this.src='${AV(id)}';this.parentNode.classList.add('pixel')"></div>
      <div class="fo-info">
        <div class="fo-card-h"><b>${esc(c.def.name)}</b><span>${esc(bio.title || c.def.role)}</span></div>
        <div class="fo-card-st ${md.level}"><i class="fo-dot"></i>${esc(c.def.human ? '' : ST_TXT[md.level] + '・')}${esc(where)}・${esc(ROOM_NAME[c.def.room])}</div>
        <p>${esc(bio.desc || '')}</p>
        <p class="fo-trait"><b>個性</b>${esc(bio.trait || '')}</p>
        <p class="fo-quote">「${esc(c.def.line)}」</p>
        ${jobs ? `<div class="fo-jobs"><div class="fo-jobs-h">${SITE ? '負責的系統' : '負責的系統（點一下看運作紀錄）'}</div>${jobs}</div>` : ''}
        <div class="fo-card-act"><button class="fo-btn" type="button" data-act="find" data-id="${id}">在辦公室找${esc(c.def.name)}</button>
          <button class="fo-btn" type="button" data-act="close">關閉</button></div>
      </div></div>`;
    if (card.showModal) card.showModal(); else card.setAttribute('open', '');
  }

  // 器械小教室的介紹卡：照片直接讀 28_牙科器械認識 的圖片（讀不到就用白板上的像素圖）
  const KIT = BASE + '../../../28_牙科器械認識/';
  const photoOf = l => SITE ? BASE + 'kit/' + l.photo.split('/').pop() : KIT + l.photo; // 網站版用 28 的縮圖
  let lessonIdx = 0;
  function openLesson(i) {
    if (!LESSONS.length) return; lessonIdx = ((i % LESSONS.length) + LESSONS.length) % LESSONS.length;
    const l = LESSONS[lessonIdx], cur = lessonAt(slotNow()) === l;
    card.innerHTML = `<div class="fo-card-in fo-lesson">
      <div class="fo-pic"><img src="${esc(photoOf(l))}" alt="${esc(l.zh)}的照片"
        onerror="this.onerror=null;this.src='${BASE}assets/lessons/${esc(l.id)}.png';this.parentNode.classList.add('pixel')"></div>
      <div class="fo-info">
        <div class="fo-card-h"><b>${esc(l.zh)}</b><span>${esc(l.en)}</span></div>
        <div class="fo-tags">${cur ? '<span class="now">本堂</span>' : ''}${l.alias && l.alias !== l.zh ? `<span>院內叫：${esc(l.alias)}</span>` : ''}<span>${esc(l.cat)}</span>${l.same ? '<span class="same">院內同款照片</span>' : ''}</div>
        ${l.purpose ? `<p><b class="lb">用途</b>${esc(l.purpose)}</p>` : ''}
        ${l.notes.length ? `<div class="fo-notes"><b class="lb">注意事項</b><ul>${l.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul></div>` : ''}
        ${l.brand ? `<p><b class="lb">院內廠牌</b>${esc(l.brand)}</p>` : ''}
        ${l.procs.length ? `<div class="fo-procs"><b class="lb">用在</b>${l.procs.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
        <p class="fo-src">照片：${esc(l.photoSrc || '器械認識')}　資料：28 牙科器械認識（${lessonIdx + 1}／${LESSONS.length}）</p>
        <div class="fo-card-act"><button class="fo-btn" type="button" data-act="lesson-prev">◀ 上一個</button>
          <button class="fo-btn" type="button" data-act="lesson-next">下一個 ▶</button>
          ${SITE ? '' : `<a class="fo-btn" href="${esc(KIT)}index.html" target="_blank" rel="noopener">打開器械認識</a>`}
          <button class="fo-btn" type="button" data-act="close">關閉</button></div>
      </div></div>`;
    if (!card.open) { if (card.showModal) card.showModal(); else card.setAttribute('open', ''); }
  }

  function openWeekly(ev) {
    const name = id => (STAFF.find(s => s.id === id) || {}).name || id;
    card.innerHTML = `<div class="fo-card-in fo-lesson">
      <div class="fo-pic ${ev.img ? 'pixel' : ''}">${ev.img ? `<img src="${BASE + sm(ev.img)}" alt="" onerror="this.onerror=null;this.src='${BASE + ev.img}'">` : `<div class="fo-note-big">${esc(ev.title)}</div>`}</div>
      <div class="fo-info">
        <div class="fo-card-h"><b>${esc(ev.title)}</b></div>
        <div class="fo-tags"><span class="${ev.kind === 'dental' ? 'same' : 'now'}">${ev.kind === 'dental' ? '牙科話題' : '診所大小事'}</span><span>${esc(ev.week)} 那週</span></div>
        ${ev.card && ev.card.body ? `<p>${esc(ev.card.body)}</p>` : ''}
        <div class="fo-notes"><b class="lb">辦公室的對話</b><ul>${ev.beats.map(([w, x]) => `<li><b>${esc(name(w))}</b>：${esc(x)}</li>`).join('')}</ul></div>
        ${ev.card && ev.card.source ? `<p class="fo-src">來源：${esc(ev.card.source)}</p>` : ''}
        <div class="fo-card-act"><button class="fo-btn" type="button" data-act="close">關閉</button></div>
      </div></div>`;
    if (!card.open) { if (card.showModal) card.showModal(); else card.setAttribute('open', ''); }
  }

  // ---------- 面板 ----------
  const MODE_TXT = { work: '工作中', walk: '走動中', idle: '待命', worry: '冒汗中', alarm: '出狀況', sleep: '下班睡覺', fade: '走動中' };
  const EV_TXT = a => a.phase === 'during' ? `${a.e.name}進行中` : a.phase === 'post' ? `${a.e.name}回來了` : `${a.e.name}倒數 ${a.days} 天`;
  const setHTML = (sel, h) => { const el = root.querySelector(sel); if (el && el.__h !== h) { el.__h = h; el.innerHTML = h; } };
  function panels() {
    const today = now();
    root.querySelector('.fo-date').textContent = `${today.getMonth() + 1}/${today.getDate()}（${'日一二三四五六'[today.getDay()]}）${String(today.getHours()).padStart(2, '0')}:${String(today.getMinutes()).padStart(2, '0')}`;
    root.querySelector('.fo-hol').textContent = cal().holiday || '';
    root.querySelector('.fo-ev').textContent = activeEvents().map(EV_TXT).join('・');
    // 今日小記
    const A = window.FUMEI_ADVICE, S = window.FUMEI_STORY, iso = localISO(today);
    let h = '';
    if (S && S.date === iso) {
      h = `<div class="t">${esc(S.title || '今日小故事')}</div><ul>${(S.beats || []).map(b => { const c = STAFF.find(s => s.id === b.who);
        return `<li><span class="who">${esc(c ? c.name : b.who)}</span>：${esc(b.text)}</li>`; }).join('')}</ul>`;
    } else if (A) {
      h = `<div class="t">${esc(A.headline || 'Claude 的便條')}</div><ul>${(A.items || []).slice(0, 3).map(x => `<li>${esc(x.title)}</li>`).join('')}</ul>`;
    } else h = '<div class="t">今天還沒有小記</div>每天早上 Claude 會留一張便條在這裡。';
    h += `<div class="d">${esc((S && S.date === iso ? '' : (A && A.generated_at) || '') || '')}</div>`;
    setHTML('.fo-note', h);
    // 運作狀態
    if (D) {
      const c = D.counts;
      setHTML('.fo-counts', [['ok', '正常'], ['warn', '需注意'], ['fail', '失敗']].map(([k, n]) => `<div class="${k}"><b style="color:var(--c)">${c[k] || 0}</b><span>${n}</span></div>`).join(''));
      setHTML('.fo-lights', D.items.map(i => SITE
        ? `<div class="fo-light ${i.status}" title="${esc(i.summary)}"><i></i><span>${esc(i.name)}</span></div>` // 網站版：完整顯示、不連結
        : `<button class="fo-light ${i.status}" type="button" data-act="item" data-id="${esc(i.id)}" title="${esc(i.summary)}"><i></i><span>${esc(i.name)}</span></button>`).join(''));
    }
    // 員工名冊
    setHTML('.fo-list', chars.map(c => {
      const md = c.mood || moodOf(c.def);
      // 大頭照由 _工具/make_avatars.py 依頭部位置裁成同樣大小（頭頂到脖子）
      return `<button class="fo-member" type="button" data-act="member" data-id="${c.def.id}"><img class="fo-av" src="${AV(c.def.id)}" alt="">
        <span><span class="n">${esc(c.def.name)}</span><br><span class="r">${esc(c.def.role)}</span></span>
        <span class="s ${md.level}"><span class="fo-dot"></span>${esc(c.hidden ? '員工旅遊中' : c.room !== c.def.room ? `在${ROOM_NAME[c.room]}串門子` : (MODE_TXT[c.mode] || ''))}</span></button>`;
    }).join(''));
  }

  // ---------- 主迴圈 ----------
  let last = performance.now(), visible = true, lastPanel = 0;
  function loop(t) {
    if (SMALL && t - last < 30) { requestAnimationFrame(loop); return; } // 手機：約每秒 30 格就夠
    const dt = Math.min(0.1, (t - last) / 1000); last = t;
    if (visible && !document.hidden) {
      chars.forEach(c => step(c, t, dt)); tickBubble(t); draw(t);
      if (t - lastPanel > 5000) { panels(); lastPanel = t; }
    }
    requestAnimationFrame(loop);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(cv);
    new IntersectionObserver(es => { if (es[0].isIntersecting) begin(); }, { rootMargin: '800px 0px' }).observe(mount);
  } else begin();
  window.addEventListener('resize', resize);
  function refreshMoods() { const t = performance.now(); chars.forEach(c => { const before = c.mood && c.mood.level; c.mood = moodOf(c.def);
    if (c.mode !== 'walk' && (c.mood.level === 'fail' || before === 'fail' || isNight())) decide(c, t); }); }
  window.addEventListener('fumei-data', () => { D = window.FUMEI_STATUS || D; refreshMoods(); panels(); });
  D = window.FUMEI_STATUS || null;
  resize(); refreshMoods(); panels();
  requestAnimationFrame(loop);
  // 除錯用（唯讀）：在主控台輸入 FUMEI_OFFICE_DEBUG() 看目前誰在說話、每人在做什麼
  // 測試用：快轉 sec 秒的走位（不畫圖），每秒回傳一次每人的位置；頁面在背景、動畫不跑時也能檢查站位
  window.FUMEI_OFFICE_SIM = (sec, talk) => { let t = performance.now(); const out = [], said = []; let last = null;
    for (let i = 0; i < sec * 10; i++) { chars.forEach(c => step(c, t, 0.1));
      if (talk) { tickBubble(t); if (bubble && bubble !== last) { last = bubble; said.push(`${Math.round(i / 10)}s ${bubble.c.def.name}：${bubble.text}`); } }
      t += 100;
      if (i % 10 === 9) out.push(chars.map(c => ({ id: c.def.id, room: c.room, x: Math.round(c.x), y: Math.round(c.y), mode: c.mode, hidden: !!c.hidden }))); }
    return talk ? said : out; };
  window.FUMEI_OFFICE_DEBUG = () => ({ theme: theme(), bubble: bubble && `${bubble.c.def.name}：${bubble.text}`, modes: chars.map(c => `${c.def.name}:${c.hidden ? 'away' : c.mode}@${c.room}`), events: activeEvents().map(EV_TXT), lesson: { now: (lessonAt(slotNow()) || {}).zh, phase: lesson && lesson.phase, total: LESSONS.length }, queue: queue.length, weekly: WEEKLY.length, pinned: pinned && pinned.ev.title, pos: chars.map(c => ({ id: c.def.id, room: c.room, x: Math.round(c.x), y: Math.round(c.y), mode: c.mode, hidden: !!c.hidden })) });
})();
