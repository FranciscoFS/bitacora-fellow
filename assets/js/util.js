/* ════════ util.js · helpers de DOM, fechas, storage y avisos ════════ */
window.BF = window.BF || {};

(function () {
  const prefix = () => BF.CONFIG.LS_PREFIX;

  /* ---------- DOM ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function el(tag, attrs = {}, children = []) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'text') node.textContent = v;
      else if (k === 'html') node.innerHTML = v;
      else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
      else if (v === true) node.setAttribute(k, '');
      else node.setAttribute(k, v);
    }
    for (const c of [].concat(children)) {
      if (c === null || c === undefined || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* ---------- Identificadores y fechas ---------- */
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  const localDateISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const todayISO = () => localDateISO(new Date());
  const nowISO = () => new Date().toISOString();

  /** 'YYYY-MM-DD' → 'dd/mm/aaaa' sin desfase por zona horaria. */
  function fmtDate(iso) {
    if (!iso) return '—';
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
  }

  /** 'YYYY-MM' de una fecha ISO. */
  const monthKey = (iso) => (iso || '').slice(0, 7);

  /** '2025-03' → 'mar 25' */
  function fmtMonth(key) {
    const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const m = /^(\d{4})-(\d{2})$/.exec(key || '');
    if (!m) return key || '';
    return `${MESES[Number(m[2]) - 1]} ${m[1].slice(2)}`;
  }

  /** Lista continua de meses entre dos claves 'YYYY-MM'. */
  function monthRange(fromKey, toKey) {
    const out = [];
    const [fy, fm] = fromKey.split('-').map(Number);
    const [ty, tm] = toKey.split('-').map(Number);
    let y = fy, m = fm;
    let guard = 0;
    while ((y < ty || (y === ty && m <= tm)) && guard++ < 240) {
      out.push(`${y}-${String(m).padStart(2, '0')}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return out;
  }

  const daysAgoISO = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return localDateISO(d); };

  const num = (v) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

  function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);
  const median = (arr) => {
    if (!arr.length) return null;
    const sorted = arr.slice().sort((a, b) => a - b), mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  const pct = (part, total) => (total ? Math.round((part / total) * 100) : 0);

  /** Cuenta ocurrencias y devuelve [{name, value}] ordenado desc. */
  function tally(items, keyFn) {
    const map = new Map();
    for (const it of items) {
      const keys = [].concat(keyFn(it) ?? []).filter((k) => k !== '' && k !== null && k !== undefined);
      for (const k of keys) map.set(k, (map.get(k) || 0) + 1);
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }

  /* ---------- Almacenamiento local seguro (file:// puede bloquearlo) ---------- */
  const memory = new Map();
  const failedKeys = new Set();
  function storageFailure(key) {
    failedKeys.add(key);
    const banner = $('#storageWarning');
    if (banner) banner.hidden = false;
  }

  const store = {
    get(key, fallback = null) {
      if (failedKeys.has(key) && memory.has(key)) return memory.get(key);
      try {
        const raw = localStorage.getItem(prefix() + key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch (_) {
        return memory.has(key) ? memory.get(key) : fallback;
      }
    },
    set(key, value) {
      memory.set(key, value);
      try {
        localStorage.setItem(prefix() + key, JSON.stringify(value));
        failedKeys.delete(key);
        return true;
      } catch (_) { storageFailure(key); return false; }
    },
    del(key) {
      memory.delete(key);
      try { localStorage.removeItem(prefix() + key); failedKeys.delete(key); return true; }
      catch (_) { storageFailure(key); return false; }
    },
    reliable: () => failedKeys.size === 0
  };

  /* ---------- Avisos ---------- */
  function toast(message, kind = '', ms = 3600) {
    const box = $('#toasts');
    if (!box) return;
    const node = el('div', { class: `toast ${kind}`, text: message });
    box.append(node);
    setTimeout(() => {
      node.style.transition = 'opacity .25s';
      node.style.opacity = '0';
      setTimeout(() => node.remove(), 260);
    }, ms);
  }

  /* ---------- Varios ---------- */
  function debounce(fn, ms) {
    let t;
    return function (...args) {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  function download(filename, content, mime = 'application/octet-stream') {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: filename });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  function choose({ title, message, choices, confirmText = '' }) {
    return new Promise((resolve) => {
      const previousFocus = document.activeElement;
      const dialog = el('dialog', { class: 'action-dialog', 'aria-labelledby': 'actionTitle', 'aria-describedby': 'actionMessage' });
      dialog.innerHTML = `<h2 id="actionTitle">${esc(title)}</h2><p id="actionMessage">${esc(message)}</p>
        ${confirmText ? `<label class="field"><span>Escribe ${esc(confirmText)} para confirmar</span><input id="actionConfirm" autocomplete="off" spellcheck="false"></label>` : ''}
        <div class="dialog-actions"></div>`;
      let settled = false;
      const finish = (value) => {
        if (settled) return;
        settled = true;
        dialog.close(); dialog.remove();
        if (previousFocus && document.contains(previousFocus)) previousFocus.focus();
        resolve(value);
      };
      for (const choice of choices) {
        const button = el('button', { type: 'button', class: 'btn ' + (choice.className || ''), text: choice.label });
        if (confirmText && choice.value !== null) button.disabled = true;
        button.addEventListener('click', () => finish(choice.value));
        dialog.querySelector('.dialog-actions').append(button);
      }
      dialog.addEventListener('cancel', (e) => { e.preventDefault(); finish(null); });
      dialog.addEventListener('close', () => finish(null));
      document.body.append(dialog);
      if (confirmText) dialog.querySelector('input').addEventListener('input', (e) => {
        dialog.querySelectorAll('button').forEach((b, i) => { if (choices[i].value !== null) b.disabled = e.target.value === '' || e.target.value.trim() !== confirmText; });
      });
      dialog.showModal();
      (dialog.querySelector('input') || dialog.querySelector('button:last-child')).focus();
    });
  }

  BF.util = {
    $, $$, el, esc, uuid, todayISO, nowISO, fmtDate, fmtDateTime, fmtMonth,
    monthKey, monthRange, daysAgoISO, localDateISO, num, avg, median, pct, tally,
    store, toast, debounce, download, wait, choose
  };
})();
