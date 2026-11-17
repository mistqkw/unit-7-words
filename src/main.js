import './fonts.css';
import './style.css';
import { WORDS, SECTIONS, GRAMMAR } from './data.js';

const KEY_PROGRESS = 'u7.progress.v1';
const KEY_SETTINGS = 'u7.settings.v1';
const KEY_THEME = 'u7.theme.v1';

const $ = (id) => document.getElementById(id);

const store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage may be blocked */
    }
  },
};

const defaults = { section: 'all', status: 'all', mode: 'en-pl', tab: 'study', test: false };

const savedSettings = store.read(KEY_SETTINGS, {}) || {};
const state = {
  ...defaults,
  ...savedSettings,
  index: 0,
  query: '',
  progress: store.read(KEY_PROGRESS, {}) || {},
  flipped: false,
  attempts: 0,
  revealed: false,
  mixSeed: Math.random().toString(36).slice(2),
};

if (!SECTIONS.some((s) => s.id === state.section)) state.section = 'all';
if (!['all', 'unknown', 'known'].includes(state.status)) state.status = 'all';
if (!['en-pl', 'pl-en', 'mix'].includes(state.mode)) state.mode = 'en-pl';
if (!['study', 'grammar'].includes(state.tab)) state.tab = 'study';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const normalize = (value) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N} ]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const dropBrackets = (value) => value.replace(/\([^)]*\)/g, ' ');

const answersFor = (text) => {
  const stripped = dropBrackets(text);
  const variants = new Set([normalize(text), normalize(stripped)]);
  stripped
    .split(/[/;,]|\s·\s/)
    .map((part) => normalize(part))
    .filter((part) => part.length > 1)
    .forEach((part) => variants.add(part));
  return [...variants].filter(Boolean);
};

const isCorrect = (input, expected) => {
  const value = normalize(input);
  if (!value) return false;
  return expected.includes(value);
};

const shuffledOrder = (items, seed) => {
  const arr = items.map((item, i) => ({ item, i }));
  let salt = 0;
  for (let i = 0; i < seed.length; i += 1) salt = (salt * 31 + seed.charCodeAt(i)) % 100000;
  for (let i = arr.length - 1; i > 0; i -= 1) {
    salt = (salt * 1103515245 + 12345) % 2147483648;
    const j = salt % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.map((entry) => entry.item);
};

const directionOf = (item) => {
  if (state.mode === 'en-pl') return 'en-pl';
  if (state.mode === 'pl-en') return 'pl-en';
  let hash = 0;
  for (let i = 0; i < item.id.length; i += 1) hash = (hash * 33 + item.id.charCodeAt(i)) % 1000;
  return hash % 2 === 0 ? 'en-pl' : 'pl-en';
};

let view = [];

const matchesQuery = (item) => {
  const q = normalize(state.query);
  if (!q) return true;
  return normalize(item.en).includes(q) || normalize(item.pl).includes(q);
};

const buildView = () => {
  let items = WORDS.filter((item) => {
    if (state.test && item.isFamily) return false;
    if (state.section !== 'all' && item.section !== state.section) return false;
    const status = state.progress[item.id];
    if (state.status === 'known' && status !== 'known') return false;
    if (state.status === 'unknown' && status !== 'unknown') return false;
    return matchesQuery(item);
  });
  if (state.mode === 'mix' && !state.query) items = shuffledOrder(items, state.mixSeed);
  view = items;
  if (state.index >= view.length) state.index = Math.max(0, view.length - 1);
};

const saveSettings = () => {
  const { section, status, mode, tab, test } = state;
  store.write(KEY_SETTINGS, { section, status, mode, tab, test });
};

const saveProgress = () => store.write(KEY_PROGRESS, state.progress);

const sectionLabel = (id) => SECTIONS.find((s) => s.id === id)?.label || '';

const sizeClass = (text, font) => {
  const len = (text || '').length;
  const [long, xlong] = font === 'display' ? [18, 32] : [42, 78];
  if (len > xlong) return 'is-xlong';
  if (len > long) return 'is-long';
  return '';
};

const current = () => view[state.index];

const updateFacts = () => {
  $('facts').innerHTML = [
    `${WORDS.length} слов`,
    '4 раздела',
    state.test ? 'режим теста' : '3 режима',
  ]
    .map((fact) => `<span>${fact}</span>`)
    .join('');
};

const renderRail = () => {
  const segs = $('rail-segs');
  segs.innerHTML = view
    .map((item) => {
      const status = state.progress[item.id];
      const cls = [status === 'known' ? 'is-known' : '', status === 'unknown' ? 'is-unknown' : '']
        .filter(Boolean)
        .join(' ');
      return `<span class="${cls}"></span>`;
    })
    .join('');
  const rail = $('rail');
  rail.setAttribute('aria-valuemax', String(Math.max(1, view.length)));
  rail.setAttribute('aria-valuenow', String(view.length ? state.index + 1 : 0));
  const marks = segs.children;
  if (marks[state.index]) marks[state.index].classList.add('is-current');
};

const renderStats = () => {
  const total = WORDS.length;
  const known = WORDS.filter((w) => state.progress[w.id] === 'known').length;
  const unknown = WORDS.filter((w) => state.progress[w.id] === 'unknown').length;
  $('nav-progress').textContent = `${Math.round((known / total) * 100)}%`;
  $('stats').textContent = `знаю ${known} · не знаю ${unknown} · всего ${total}`;
};

const renderCard = () => {
  const item = current();
  const front = $('front-word');
  const back = $('back-word');

  $('rail').setAttribute('aria-disabled', view.length ? 'false' : 'true');

  if (!item) {
    front.textContent = 'ничего не найдено';
    front.className = 'card__word is-long';
    back.textContent = 'измени фильтр или поиск';
    back.className = 'card__word card__word--back';
    $('counter').textContent = '0 / 0';
    $('card-tag').textContent = '—';
    $('back-tag').textContent = '—';
    $('card-state').textContent = '';
    $('back-state').textContent = '';
    $('card-state').className = 'card__state';
    $('back-state').className = 'card__state';
    return;
  }

  const dir = item.isFamily ? 'en-pl' : directionOf(item);
  const frontText = dir === 'en-pl' ? item.en : item.pl;
  const backText = dir === 'en-pl' ? item.pl : item.en;

  front.textContent = frontText;
  back.textContent = backText;
  front.className = `card__word ${sizeClass(frontText, 'display')}`;
  back.className = `card__word card__word--back ${sizeClass(backText, 'text')}`;

  $('front-side').textContent = dir === 'en-pl' ? 'EN' : 'PL';
  $('back-side').textContent = item.isFamily ? 'формы' : dir === 'en-pl' ? 'PL' : 'EN';
  $('front-label').textContent = item.isFamily ? 'tap — все формы' : 'tap — переворот';
  $('back-label').textContent = 'tap — назад';

  const tag = sectionLabel(item.section);
  $('card-tag').textContent = tag;
  $('back-tag').textContent = tag;

  const status = state.progress[item.id];
  const stateText = status === 'known' ? 'знаю' : status === 'unknown' ? 'не знаю' : 'новая';
  const stateCls = status === 'known' ? 'is-known' : status === 'unknown' ? 'is-unknown' : '';
  $('card-state').textContent = stateText;
  $('back-state').textContent = stateText;
  $('card-state').className = `card__state ${stateCls}`;
  $('back-state').className = `card__state ${stateCls}`;

  $('counter').textContent = `${state.index + 1} / ${view.length}`;
};

const renderTest = () => {
  const item = current();
  const prompt = $('test-prompt');
  if (!item) {
    prompt.textContent = state.section === 'wf' ? 'word families — только в карточках' : 'ничего не найдено';
    prompt.className = 'test__prompt is-long';
    $('test-tag').textContent = '—';
    return;
  }
  const dir = directionOf(item);
  const question = dir === 'en-pl' ? item.en : item.pl;
  const answerSide = dir === 'en-pl' ? item.pl : item.en;
  prompt.textContent = question;
  prompt.className = `test__prompt ${sizeClass(question, 'display')}`;
  $('test-tag').textContent = sectionLabel(item.section);
  $('test-hint').textContent = dir === 'en-pl' ? 'переведи на польский' : 'переведи на английский';
  $('test-input').placeholder = dir === 'en-pl' ? 'по-польски…' : 'по-английски…';
  $('test-input').dataset.answer = answerSide;
};

const resetTestFields = () => {
  state.attempts = 0;
  state.revealed = false;
  $('test-feedback').textContent = '';
  $('test-feedback').className = 'test__feedback';
  const input = $('test-input');
  input.value = '';
  input.disabled = false;
  $('test-submit').textContent = 'Проверить';
};

const applyFlipped = (flipped) => {
  state.flipped = flipped;
  $('card').classList.toggle('is-flipped', flipped);
  $('flip').textContent = flipped ? 'Свернуть' : 'Перевернуть';
};

const renderAll = ({ keepFlip = false } = {}) => {
  buildView();
  if (!keepFlip) applyFlipped(false);
  renderRail();
  renderStats();
  renderCard();
  renderTest();
  updateFacts();
  $('test').hidden = !state.test;
  $('card').classList.toggle('is-hidden', state.test);
  $('test-toggle').setAttribute('aria-pressed', String(state.test));
  $('test-toggle').classList.toggle('is-active', state.test);
  $('flip').textContent = state.test ? 'Показать ответ' : state.flipped ? 'Свернуть' : 'Перевернуть';
  document.querySelectorAll('#status-filter .chip').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.status === state.status);
  });
  document.querySelectorAll('#section-filter .chip').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.section === state.section);
  });
  document.querySelectorAll('#mode-seg button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.mode === state.mode);
  });
  if (state.test) resetTestFields();
};

let busy = false;

const withMotion = (cls, update) => {
  if (reduceMotion || busy) {
    update();
    return;
  }
  busy = true;
  const card = $('card');
  card.classList.add(cls);
  window.setTimeout(() => {
    card.classList.remove(cls);
    update();
    busy = false;
  }, 150);
};

const go = (delta) => {
  if (!view.length) return;
  withMotion(delta >= 0 ? 'is-out-left' : 'is-out-right', () => {
    state.index = (state.index + delta + view.length) % view.length;
    renderAll();
  });
};

const mark = (status) => {
  const item = current();
  if (!item) return;
  withMotion(status === 'known' ? 'is-out-up' : 'is-out-down', () => {
    const next = view[state.index + 1] || null;
    state.progress[item.id] = status;
    saveProgress();
    buildView();
    if (next) {
      const pos = view.indexOf(next);
      if (pos >= 0) state.index = pos;
    }
    renderAll();
  });
};

const toggleFlip = () => {
  if (state.test) {
    revealAnswer();
    return;
  }
  if (!current()) return;
  applyFlipped(!state.flipped);
};

const revealAnswer = () => {
  const item = current();
  if (!item || state.revealed) return;
  state.progress[item.id] = 'unknown';
  saveProgress();
  renderStats();
  renderRail();
  renderCard();
  state.revealed = true;
  const answer = $('test-input').dataset.answer || '';
  const first = answer.trim().charAt(0).toLowerCase();
  const fb = $('test-feedback');
  fb.textContent = `ответ: ${answer} · подсказка: ${first}…`;
  fb.className = 'test__feedback';
  $('test-input').value = answer.length > 60 ? answer.slice(0, 57) + '…' : answer;
  $('test-submit').textContent = 'Дальше';
};

const submitTest = () => {
  const item = current();
  if (!item) return;
  const input = $('test-input');
  const value = input.value.trim();
  if (!value) {
    input.focus();
    return;
  }
  const answerSide = input.dataset.answer || '';
  const expected = answersFor(answerSide);
  const first = dropBrackets(answerSide).trim().charAt(0).toUpperCase();
  const fb = $('test-feedback');

  if (isCorrect(value, expected)) {
    state.progress[item.id] = 'known';
    saveProgress();
    renderStats();
    renderRail();
    renderCard();
    fb.textContent = `верно · ${answerSide}`;
    fb.className = 'test__feedback is-ok';
    state.revealed = true;
    input.disabled = true;
    $('test-submit').textContent = 'Дальше';
    return;
  }

  state.attempts += 1;
  if (state.attempts === 1) {
    fb.textContent = `не совсем · подсказка: ${first.toLowerCase()}…`;
    fb.className = 'test__feedback is-bad';
    input.select();
    return;
  }

  state.progress[item.id] = 'unknown';
  saveProgress();
  renderStats();
  renderRail();
  renderCard();
  fb.textContent = `неверно · ответ: ${answerSide}`;
  fb.className = 'test__feedback is-bad';
  state.revealed = true;
  input.value = answerSide.length > 60 ? answerSide.slice(0, 57) + '…' : answerSide;
  input.disabled = true;
  $('test-submit').textContent = 'Дальше';
};

const setIndex = (index) => {
  if (!view.length) return;
  state.index = Math.min(view.length - 1, Math.max(0, index));
  renderAll();
};

const renderGrammar = () => {
  const list = $('grammar-list');
  list.innerHTML = GRAMMAR.map((block, i) => {
    const num = String(i + 1).padStart(2, '0');
    return `
      <article class="gcard">
        <div class="gcard__head">
          <span class="gcard__num">${num}</span>
          <h3>${block.title}</h3>
        </div>
        <ul>${block.rules.map((rule) => `<li>${rule}</li>`).join('')}</ul>
        <div class="gcard__examples">${block.examples.map((ex) => `<span>${ex}</span>`).join('')}</div>
      </article>`;
  }).join('');
};

const setTab = (tab) => {
  state.tab = tab;
  saveSettings();
  $('view-study').classList.toggle('is-hidden', tab !== 'study');
  $('panel').classList.toggle('is-hidden', tab !== 'study');
  $('view-grammar').hidden = tab !== 'grammar';
  document.querySelectorAll('.nav__tab').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.tab === tab);
  });
  window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  store.write(KEY_THEME, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'light' ? '#f6f6f3' : '#0a0a0c');
};

const wire = () => {
  $('prev').addEventListener('click', () => go(-1));
  $('next').addEventListener('click', () => go(1));
  $('flip').addEventListener('click', toggleFlip);
  $('know').addEventListener('click', () => mark('known'));
  $('dont-know').addEventListener('click', () => mark('unknown'));

  $('mode-seg').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-mode]');
    if (!btn) return;
    state.mode = btn.dataset.mode;
    state.mixSeed = Math.random().toString(36).slice(2);
    state.index = 0;
    saveSettings();
    renderAll();
  });

  $('status-filter').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-status]');
    if (!btn) return;
    state.status = btn.dataset.status;
    state.index = 0;
    saveSettings();
    renderAll();
  });

  $('section-filter').addEventListener('click', (event) => {
    const btn = event.target.closest('button[data-section]');
    if (!btn) return;
    state.section = btn.dataset.section;
    state.index = 0;
    saveSettings();
    renderAll();
  });

  $('test-toggle').addEventListener('click', () => {
    state.test = !state.test;
    saveSettings();
    renderAll();
    if (state.test) $('test-input').focus();
  });

  let searchTimer = 0;
  $('search').addEventListener('input', (event) => {
    const value = event.target.value;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      state.query = value;
      state.index = 0;
      renderAll();
    }, 120);
  });

  $('rail').addEventListener('click', (event) => {
    if (!view.length) return;
    const rect = $('rail-segs').getBoundingClientRect();
    if (!rect.width) return;
    const ratio = (event.clientX - rect.left) / rect.width;
    setIndex(Math.floor(ratio * view.length));
  });

  document.querySelectorAll('.nav__tab').forEach((btn) => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  $('theme-btn').addEventListener('click', () => {
    setTheme(document.documentElement.dataset.theme === 'light' ? 'dark' : 'light');
  });

  $('test-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.revealed) {
      go(1);
      return;
    }
    submitTest();
  });

  $('reset').addEventListener('click', () => {
    const dialog = $('reset-dialog');
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else if (window.confirm('Сбросить прогресс?')) clearProgress();
  });
  $('reset-cancel').addEventListener('click', () => $('reset-dialog').close());
  $('reset-confirm').addEventListener('click', () => {
    clearProgress();
    $('reset-dialog').close();
  });

  document.addEventListener('keydown', (event) => {
    const tag = event.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (state.tab !== 'study') return;
    if (document.querySelector('dialog[open]')) return;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(event.key)) return;
    if (tag === 'BUTTON') event.target.blur();
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        go(-1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        go(1);
        break;
      case ' ':
        event.preventDefault();
        toggleFlip();
        break;
      case 'ArrowUp':
        event.preventDefault();
        mark('known');
        break;
      case 'ArrowDown':
        event.preventDefault();
        mark('unknown');
        break;
      default:
        break;
    }
  });

  wireSwipe();
};

const clearProgress = () => {
  state.progress = {};
  saveProgress();
  state.index = 0;
  renderAll();
};

const wireSwipe = () => {
  const card = $('card');
  let startX = 0;
  let startY = 0;
  let active = false;
  let moved = false;
  let pointerId = null;

  card.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    if (busy) return;
    active = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    pointerId = event.pointerId;
    try {
      card.setPointerCapture(pointerId);
    } catch {
      /* ignore */
    }
  });

  card.addEventListener('pointermove', (event) => {
    if (!active) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) > 8 || Math.abs(dy) > 8) moved = true;
    if (Math.abs(dx) > Math.abs(dy)) card.style.transform = `translateX(${dx * 0.25}px)`;
    else card.style.transform = `translateY(${dy * 0.15}px)`;
  });

  const finish = (event) => {
    if (!active) return;
    active = false;
    card.style.transform = '';
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    if (absX > absY && absX > 55) {
      if (card.releasePointerCapture && pointerId !== null) {
        try {
          card.releasePointerCapture(pointerId);
        } catch {
          /* ignore */
        }
      }
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (absY > absX && absY > 55) {
      mark(dy < 0 ? 'known' : 'unknown');
      return;
    }
    if (!moved) toggleFlip();
  };

  card.addEventListener('pointerup', finish);
  card.addEventListener('pointercancel', () => {
    active = false;
    card.style.transform = '';
  });
};

const addSectionChips = () => {
  const wrap = $('section-filter');
  SECTIONS.forEach((section) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip';
    btn.dataset.section = section.id;
    btn.textContent = section.label;
    wrap.appendChild(btn);
  });
};

const init = () => {
  setTheme(store.read(KEY_THEME, 'dark') === 'light' ? 'light' : 'dark');
  addSectionChips();
  renderGrammar();
  wire();
  renderAll();
  setTab(state.tab);
  document.querySelectorAll('#mode-seg button').forEach((btn) => {
    btn.classList.toggle('is-active', btn.dataset.mode === state.mode);
  });
};

init();
