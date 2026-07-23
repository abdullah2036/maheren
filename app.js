/* ============================================================
   مؤسسة الماهرين — app.js (v3)
   جديد: واتساب بدل البريد، عدّاد زوّار حقيقي (Abacus)،
   قراءة config.json من المستودع لتعميم التعديلات على كل الزوّار.
   ============================================================ */

/* ---------- 1) مخزن الإعدادات ----------
   أولوية الدمج: الافتراضي ← config.json (من المستودع) ← localStorage (هذا المتصفح) */
const MF = (() => {
  const KEY = 'MF_CONFIG_V1';
  let REMOTE = {};                       /* محتوى config.json إن وُجد بجانب الملفات */

  /* ---- إصلاح لمرة واحدة: إعادة كلمة المرور إلى 1234 وتنظيف بقايا قسم الأعضاء
     من الإعدادات المحفوظة سابقًا في هذا المتصفح ---- */
  try {
    if (!localStorage.getItem('MF_FIX_2')){
      const st = JSON.parse(localStorage.getItem(KEY));
      if (st){
        st.adminPassword = '1234';
        delete st.members;
        if (Array.isArray(st.stats))
          st.stats = st.stats.filter(x => !/أعضاء/.test(x?.label || ''));
        localStorage.setItem(KEY, JSON.stringify(st));
      }
      localStorage.setItem('MF_FIX_2', '1');
    }
  } catch {}

  const DEFAULTS = {
    adminPassword: '1234',
    site: {
      title: 'مؤسسة الماهرين',
      subtitle: 'صرحٌ عائليّ يجمع مشاريعنا الصغيرة الجميلة تحت سقف واحد',
      footer: '© مؤسسة الماهرين — بُني بحبّ منذ 2004',
      about: 'مؤسسة الماهرين مبادرةٌ عائلية انطلقت من مجلس البيت قبل أن تنتقل إلى الشبكة.\nنجمع تحت سقفها مشاريعنا الصغيرة: تجارب برمجية، وصفات ضيافة، خواطر أدبية، وألعاب متصفح خفيفة.\nكل بابٍ في القاعة الكبرى يقود إلى ركنٍ من أركان هذه العائلة.',
      whatsapp: '966500000000',          /* رقم واتساب دولي بلا + أو أصفار بادئة */
      counterNs: 'mahereen-foundation'   /* معرّف عدّاد الزوّار — اجعله فريدًا (مثل نطاق موقعك) */
    },
    settings: { openMode: 'modal' },
    backgrounds: {
      entrance: { type: 'default', color: '#1b1530', image: '' },
      hall:     { type: 'default', color: '#2e2013', image: '' },
      office:   { type: 'default', color: '#1a120a', image: '' }
    },
    stats: [
      { label: 'الأقسام', value: '5' },
      { label: 'المشاريع', value: '7' },
      { label: 'سنة التأسيس', value: '2004' }
    ],
    news: [
      { date: '2026-07', title: 'افتتاح القاعة الكبرى', text: 'أعدنا بناء الموقع بالكامل بطرازٍ متحفيّ جديد: أبواب خشبية، فوانيس، ولوحة تحكم على طراز 2004.' },
      { date: '2026-06', title: 'باب قطاع الألعاب', text: 'انضمّت أول لعبة متصفح عائلية إلى الرواق — جرّبوها من باب الألعاب والترفيه.' }
    ],
    doors: [
      { id:'tech',  title:'قطاع التقنية',          desc:'تجاربنا البرمجية وألعاب المتصفح', url:'https://example.org', icon:'💻', tint:'#4da3ff', sound:'creak' },
      { id:'law',   title:'القطاع القانوني',        desc:'مقالات وأدوات قانونية مبسّطة',    url:'https://example.org', icon:'⚖️', tint:'#c9a24b', sound:'creak' },
      { id:'host',  title:'قطاع الضيافة',           desc:'وصفاتنا وقهوتنا وضيافتنا',        url:'https://example.org', icon:'☕', tint:'#ff9e3d', sound:'chime' },
      { id:'lit',   title:'قطاع الأدب والإبداع',     desc:'قصص وخواطر وخطوط عربية',          url:'https://example.org', icon:'📖', tint:'#9fe08a', sound:'creak' },
      { id:'games', title:'قطاع الألعاب والترفيه',   desc:'ألعاب عائلية خفيفة على المتصفح',   url:'https://example.org', icon:'🎮', tint:'#e08ae0', sound:'chime' }
    ]
  };
  const clone = o => JSON.parse(JSON.stringify(o));

  /* تحميل config.json المنشور مع الموقع (إن وُجد) — يجعل تعديلات المدير
     تصل لكل الزوّار بعد رفع الملف إلى المستودع */
  async function loadRemote(){
    try {
      const r = await fetch('config.json', { cache: 'no-store' });
      if (r.ok) REMOTE = await r.json();
    } catch {}
  }

  function get(){
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(KEY)) || {}; } catch {}
    const layer = (a, b) => Object.assign(clone(a), b || {});
    const cfg = layer(layer(DEFAULTS, REMOTE), stored);
    cfg.site = layer(layer(DEFAULTS.site, REMOTE.site), stored.site);
    cfg.settings = layer(layer(DEFAULTS.settings, REMOTE.settings), stored.settings);
    cfg.backgrounds = {};
    for (const k of Object.keys(DEFAULTS.backgrounds))
      cfg.backgrounds[k] = layer(layer(DEFAULTS.backgrounds[k], REMOTE.backgrounds?.[k]), stored.backgrounds?.[k]);
    delete cfg.members;
    /* تعقيم كلمة المرور: نص غير فارغ وإلا فالافتراضي 1234 */
    cfg.adminPassword = (typeof cfg.adminPassword === 'string' && cfg.adminPassword.trim())
      ? cfg.adminPassword.trim() : '1234';
    return cfg;
  }
  function save(cfg){ localStorage.setItem(KEY, JSON.stringify(cfg)); }
  function reset(){ localStorage.removeItem(KEY); }
  function exportJSON(){
    /* يُصدَّر باسم config.json مباشرة: ضعه بجانب index.html في المستودع وارفعه */
    const blob = new Blob([JSON.stringify(get(), null, 2)], {type:'application/json'});
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: 'config.json' });
    a.click(); URL.revokeObjectURL(a.href);
  }
  function importJSON(file, done){
    const r = new FileReader();
    r.onload = () => { try { save(JSON.parse(r.result)); done(true); } catch { done(false); } };
    r.readAsText(file);
  }
  return { get, save, reset, exportJSON, importJSON, loadRemote, DEFAULTS };
})();

/* ---------- 2) مؤثرات صوتية مولّدة ---------- */
const SFX = (() => {
  let ctx;
  const ac = () => (ctx ||= new (window.AudioContext || window.webkitAudioContext)());
  function env(g, t, a=.01, d=.8, peak=.25){
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(.001, t + d);
  }
  function creak(){
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain(), f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(95, t);
    o.frequency.exponentialRampToValueAtTime(52, t + .9);
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 8;
    env(g, t, .05, .95, .18);
    o.connect(f).connect(g).connect(c.destination);
    o.start(t); o.stop(t + 1);
  }
  function chime(notes = [523, 784, 1046]){
    const c = ac(), t = c.currentTime;
    notes.forEach((n, i) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = 'sine'; o.frequency.value = n;
      env(g, t + i * .12, .01, .7, .12);
      o.connect(g).connect(c.destination);
      o.start(t + i * .12); o.stop(t + i * .12 + .8);
    });
  }
  function click(){
    const c = ac(), t = c.currentTime;
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = 900;
    env(g, t, .001, .07, .08);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + .1);
  }
  return { play(name){ try { ({creak, chime, click}[name] || creak)(); } catch {} } };
})();

/* ---------- 3) أدوات ---------- */
/* توحيد الأرقام: يحوّل ٠١٢٣ و ۰۱۲۳ إلى 0123 — سبب شائع لرفض كلمة مرور صحيحة */
const normDigits = s => (s ?? '').toString().trim()
  .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
  .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
const passOK = (input, cfg) => normDigits(input) === normDigits(cfg.adminPassword || '1234');
const qs = s => document.querySelector(s);
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

/* ---------- 4) الخلفيات المخصّصة ---------- */
function applyBackground(){
  const pageToBg = { entrance:'entrance', hall:'hall', admin:'office' };
  const key = pageToBg[document.body.dataset.page];
  const scene = qs('.scene');
  if (!key || !scene) return;
  const bg = MF.get().backgrounds?.[key];
  if (!bg || bg.type === 'default') return;
  if (bg.type === 'color'){
    scene.style.backgroundImage = 'none';
    scene.style.backgroundColor = bg.color || '#14100c';
  } else if (bg.type === 'image' && bg.image){
    scene.style.backgroundImage =
      `linear-gradient(rgba(10,7,4,.45), rgba(8,5,2,.75)), url("${bg.image}")`;
  }
}

/* ---------- 5) عدّاد الزوّار (حقيقي عبر Abacus، ومحلي كبديل) ----------
   GitHub Pages استضافة ساكنة لا تستطيع العدّ بنفسها، لذا نستخدم خدمة
   Abacus المجانية (بديل CountAPI). نحسب الزيارة مرة واحدة لكل جلسة. */
async function visitorCount(target){
  const ns = encodeURIComponent(MF.get().site.counterNs || 'mahereen-foundation');
  const hit = !sessionStorage.getItem('MF_COUNTED');
  const url = `https://abacus.jasoncameron.dev/${hit ? 'hit' : 'get'}/${ns}/visits`;
  try {
    const r = await fetch(url);
    if (!r.ok) throw 0;
    const j = await r.json();
    if (hit) sessionStorage.setItem('MF_COUNTED', '1');
    target.textContent = new Intl.NumberFormat('ar-EG').format(j.value);
  } catch {
    /* بديل محلي: رقم من هذا المتصفح فقط */
    let n = +localStorage.getItem('MF_LOCAL_VISITS') || 0;
    if (hit){ n++; localStorage.setItem('MF_LOCAL_VISITS', n); sessionStorage.setItem('MF_COUNTED','1'); }
    target.textContent = new Intl.NumberFormat('ar-EG').format(n) + '+';
  }
}

/* ---------- 6) الدخول لغرفة المدير ----------
   فحص مركزي واحد لكلمة المرور يعالج أسباب "كلمة المرور غير صحيحة" الخاطئة:
   - مسافات زائدة قبل/بعد الإدخال (trim للطرفين)
   - الأرقام العربية ٠١٢٣٤ أو الفارسية ۰۱۲۳ حين تكون لوحة المفاتيح/النظام عربيًا
   - كلمة مرور محفوظة تالفة (تُستبدل بـ 1234 عبر التعقيم أعلاه) */
function normalizeDigits(s){
  return String(s ?? '')
    .replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d))
    .replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}
function checkAdminPass(input){
  if (input == null) return false;
  return normalizeDigits(input).trim() === normalizeDigits(MF.get().adminPassword).trim();
}

addEventListener('keydown', e => {
  if (e.ctrlKey && e.altKey && e.code === 'KeyM') {
    e.preventDefault();
    const modal = qs('#admin-modal');
    if (modal) { modal.hidden = false; qs('#admin-pass')?.focus(); }
    else promptAdminAccess();
  }
});

function promptAdminAccess() {
  const cfg = MF.get();
  const input = prompt('أدخل كلمة مرور غرفة المدير:');
  if (input !== null && passOK(input, cfg)) {
    sessionStorage.setItem('admin_authed', 'true');
    location.href = 'admin.html';
  } else if (input !== null) {
    alert('كلمة المرور غير صحيحة!');
  }
}

/* ---------- 7) موجّه الصفحات ---------- */
addEventListener('DOMContentLoaded', async () => {
  await MF.loadRemote();                 /* قراءة config.json قبل بناء أي شيء */
  applyBackground();
  const page = document.body.dataset.page;
  if (page === 'entrance') initEntrance();
  if (page === 'hall') initHall();
});

/* ---------- 8) المدخل ---------- */
function initEntrance(){
  const cfg = MF.get();
  qs('#site-title').textContent = cfg.site.title;
  qs('#site-sub').textContent = cfg.site.subtitle;

  const modal = qs('#admin-modal');
  const passInput = qs('#admin-pass');
  const errorMsg = qs('#admin-error');
  const closeModal = () => { modal.hidden = true; errorMsg.hidden = true; passInput.value = ''; };
  qs('#admin-trigger').addEventListener('click', () => {
    SFX.play('click'); modal.hidden = false; passInput.focus();
  });
  qs('#close-admin-modal').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
  addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) closeModal(); });
  qs('#admin-form').addEventListener('submit', e => {
    e.preventDefault();
    if (passOK(passInput.value, MF.get())) {
      SFX.play('chime');
      sessionStorage.setItem('admin_authed', 'true');
      location.href = 'admin.html';
    } else {
      SFX.play('click');
      errorMsg.hidden = false; passInput.value = ''; passInput.focus();
    }
  });

  const newsGrid = qs('#news-grid');
  (cfg.news || []).forEach(n =>
    newsGrid.appendChild(el('article', 'news-card',
      `<time>${n.date || ''}</time><h3>${n.title || ''}</h3><p>${n.text || ''}</p>`)));
  if (!cfg.news?.length)
    newsGrid.appendChild(el('p', null, 'لا أخبار بعد — أضفها من لوحة التحكم.'));

  qs('#about-text').textContent = cfg.site.about || '';

  /* مكتب الاستقبال ← واتساب: يفتح المحادثة مع الرقم المحدد والرسالة جاهزة */
  qs('#contact-form').addEventListener('submit', e => {
    e.preventDefault();
    const name = qs('#c-name').value.trim();
    const msg  = qs('#c-msg').value.trim();
    const num  = normDigits(cfg.site.whatsapp).replace(/\D/g, '');
    if (!num){ qs('#contact-status').textContent = 'لم يُحدَّد رقم واتساب بعد — أضفه من لوحة التحكم.'; return; }
    const text = encodeURIComponent(`مرحبًا، أنا ${name} 👋\n${msg}`);
    window.open(`https://wa.me/${num}?text=${text}`, '_blank', 'noopener');
    qs('#contact-status').textContent = 'فُتح واتساب — اضغط إرسال هناك لإيصال رسالتك ✓';
    SFX.play('chime');
  });

  const boot = qs('#boot');
  const skip = sessionStorage.getItem('booted') || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (skip) boot.remove();
  else {
    const lines = ['MAHEREEN BIOS v2.0.0.4', 'Memory Test .... 640K OK', 'Loading FAMILY.SYS ...', 'Welcome.'];
    let i = 0;
    const tick = setInterval(() => {
      boot.textContent += lines[i++] + '\n';
      if (i >= lines.length){
        clearInterval(tick);
        sessionStorage.setItem('booted', 1);
        setTimeout(() => boot.remove(), 600);
      }
    }, 350);
  }

  qs('#enter').addEventListener('click', () => {
    SFX.play('chime');
    document.body.classList.add('leaving');
    setTimeout(() => location.href = 'hall.html', 750);
  });
}

/* ---------- 9) القاعة ---------- */
function initHall(){
  const cfg = MF.get();
  qs('#hall-title').textContent = cfg.site.title;
  qs('#hall-sub').textContent = cfg.site.subtitle;
  qs('#footer-text').textContent = cfg.site.footer;

  const plaques = qs('#plaques');
  cfg.stats.forEach(s => plaques.appendChild(el('div', 'plaque', `<b>${s.value}</b><span>${s.label}</span>`)));
  /* لوحة عدّاد الزوّار (بدل قسم الأعضاء) */
  const visits = el('div', 'plaque', `<b id="visit-count">…</b><span>زائرًا شرّفونا</span>`);
  plaques.appendChild(visits);
  visitorCount(visits.querySelector('#visit-count'));

  const wrap = qs('#doors');
  cfg.doors.forEach(d => {
    const u = el('div', 'door-unit');
    u.style.setProperty('--tint', d.tint || '#c9a24b');
    u.style.setProperty('--icon', `'${d.icon || '✦'}'`);
    u.setAttribute('role', 'button');
    u.setAttribute('tabindex', '0');
    u.setAttribute('aria-label', `فتح ${d.title}`);
    u.innerHTML = `
      <div class="arch"><div class="door"></div></div>
      <div class="name-plate">${d.title}</div>
      <div class="door-desc">${d.desc || ''}</div>`;
    const go = () => openDoor(u, d, cfg);
    u.addEventListener('click', go);
    u.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    wrap.appendChild(u);
  });

  qs('#portal-close').addEventListener('click', closePortal);
  qs('#portal').addEventListener('click', e => { if (e.target.id === 'portal') closePortal(); });
  qs('#portal-newtab').addEventListener('click', () => window.open(qs('#portal-frame').src, '_blank', 'noopener'));
  addEventListener('keydown', e => { if (e.key === 'Escape') closePortal(); });

  qs('#secret-key').addEventListener('click', promptAdminAccess);
}

function openDoor(unit, door, cfg){
  if (unit.classList.contains('opening')) return;
  SFX.play(door.sound || 'creak');
  unit.classList.add('opening');
  setTimeout(() => {
    if (cfg.settings.openMode === 'tab') window.open(door.url, '_blank', 'noopener');
    else {
      qs('#portal-title').textContent = door.title;
      qs('#portal-frame').src = door.url;
      qs('#portal').classList.add('open');
    }
    setTimeout(() => unit.classList.remove('opening'), 900);
  }, 850);
}

function closePortal(){
  qs('#portal').classList.remove('open');
  qs('#portal-frame').src = 'about:blank';
}