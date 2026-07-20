/* ============================================================
   Our Walk Challenge — static app (no backend, no build step)
   Data lives in localStorage; use Export/Import to sync phones.
   ============================================================ */

const STORAGE_KEY = 'walk-challenge-v1';

/* ---- Prize catalogue (Galaxus ~budget CHF) ----
   label = shown in app, term = Galaxus search query            */
const PRIZE_CATALOGUE = [
  { name: 'Tech & gadgets', weight: 3, enabled: true, items: [
    { label: 'USB-C cable', term: 'USB-C Kabel' },
    { label: 'Phone stand', term: 'Handy Ständer' },
    { label: 'Webcam cover', term: 'Webcam Abdeckung' },
    { label: 'Cable organizer', term: 'Kabelorganizer' },
    { label: '10000mAh power bank', term: 'Powerbank 10000' },
    { label: 'Screen cleaning kit', term: 'Display Reinigung' },
    { label: 'Magnetic phone mount', term: 'Handy Halterung Magnet' },
    { label: 'LED light strip', term: 'LED Streifen' },
    { label: 'Bluetooth tracker', term: 'Bluetooth Tracker' },
  ]},
  { name: 'Kitchen & food', weight: 1, enabled: true, items: [
    { label: 'Coffee beans 1kg', term: 'Kaffeebohnen' },
    { label: 'Tea sampler', term: 'Tee Sortiment' },
    { label: 'Swiss chocolate box', term: 'Schokolade' },
    { label: 'Spice set', term: 'Gewürz Set' },
    { label: 'Ceramic coffee mug', term: 'Kaffeebecher' },
    { label: 'Cocktail kit', term: 'Cocktail Set' },
    { label: 'Honey set', term: 'Honig Set' },
  ]},
  { name: 'Outdoor & sports', weight: 1, enabled: true, items: [
    { label: 'Water bottle 0.75L', term: 'Trinkflasche' },
    { label: 'Hiking socks', term: 'Wandersocken' },
    { label: 'Resistance band', term: 'Fitnessband' },
    { label: 'Sport towel', term: 'Sporttuch' },
    { label: 'Pedometer', term: 'Schrittzähler' },
  ]},
  { name: 'Books & games', weight: 1, enabled: true, items: [
    { label: 'Puzzle book', term: 'Rätselbuch' },
    { label: 'Card game', term: 'Kartenspiel' },
    { label: 'Bestseller novel', term: 'Bestseller Roman' },
    { label: 'Small board game', term: 'Brettspiel' },
    { label: 'Bullet journal', term: 'Bullet Journal' },
  ]},
];

function defaultData() {
  return {
    participants: ['You', 'Wife'],
    prizeBudget: 20,
    currency: 'CHF',
    categories: JSON.parse(JSON.stringify(PRIZE_CATALOGUE)),
    records: {}, // "YYYY-MM": { steps: {name: number}, prize: {category,item,term,url}|null }
  };
}

/* ---------------- State ---------------- */
let data = load();

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    const d = defaultData();
    return { ...d, ...parsed, categories: parsed.categories || d.categories, records: parsed.records || {} };
  } catch (e) {
    return defaultData();
  }
}
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

/* ---------------- Date helpers ---------------- */
function ym(date) { return date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'); }
function lastMonthYM() { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - 1); return ym(d); }
function monthName(ymStr) {
  const [y, m] = ymStr.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
function last12Months() {
  const out = []; const d = new Date(); d.setDate(1);
  for (let i = 0; i < 13; i++) { out.push(ym(d)); d.setMonth(d.getMonth() - 1); }
  return out; // newest first
}

/* ---------------- Prize logic ---------------- */
function pickPrize() {
  const enabled = data.categories.filter(c => c.enabled && c.items.length);
  if (!enabled.length) return null;
  const total = enabled.reduce((s, c) => s + (c.weight || 1), 0);
  let r = Math.random() * total, chosen = enabled[0];
  for (const c of enabled) { r -= (c.weight || 1); if (r <= 0) { chosen = c; break; } }
  const item = chosen.items[Math.floor(Math.random() * chosen.items.length)];
  return {
    category: chosen.name,
    item: item.label,
    term: item.term,
    url: 'https://www.galaxus.ch/search?q=' + encodeURIComponent(item.term)
  };
}

function computeWinner(rec) {
  const [a, b] = data.participants;
  const sa = rec.steps[a], sb = rec.steps[b];
  if (typeof sa !== 'number' || typeof sb !== 'number') return null;
  if (sa === sb) return 'tie';
  return sa > sb ? a : b;
}

/* ---------------- Render ---------------- */
const app = document.getElementById('app');
const bannerEl = document.getElementById('banner');

function render() {
  document.getElementById('participantLine').textContent = data.participants.join('  🥾  ');
  document.getElementById('budgetFoot').textContent = data.prizeBudget;
  renderBanner();
  renderApp();
}

function renderBanner() {
  const now = new Date();
  const pending = (now.getDate() <= 5) ? lastMonthYM() : null;
  let msg = null;
  if (pending) {
    const rec = data.records[pending];
    const haveBoth = data.participants.every(p => rec && typeof rec.steps[p] === 'number');
    if (!haveBoth) {
      msg = `🏁 <b>Time to check ${monthName(pending)}!</b><br>Enter both step totals to reveal the winner and unlock the surprise prize.`;
    }
  }
  if (msg) {
    bannerEl.innerHTML = `<div class="banner"><div class="b-ico">🔔</div><div class="b-text">${msg}<br><button class="ghost small" id="goEnter">Enter steps</button></div></div>`;
    document.getElementById('goEnter').onclick = () => document.getElementById('monthSelect').value = pending, renderApp(pending);
  } else {
    bannerEl.innerHTML = '';
  }
}

let selectedMonth = null;

function renderApp(forceMonth) {
  if (!selectedMonth || forceMonth) {
    const now = new Date();
    selectedMonth = (now.getDate() <= 5) ? lastMonthYM() : ym(now);
  }
  const months = last12Months();
  if (!months.includes(selectedMonth)) months.unshift(selectedMonth);

  const rec = data.records[selectedMonth] || { steps: {}, prize: null };
  const winner = computeWinner(rec);

  let html = '';

  /* ---- Enter steps card ---- */
  html += `<section class="card">
    <h2>📥 Record steps <span class="pill">${monthName(selectedMonth)}</span></h2>
    <label for="monthSelect">Month</label>
    <select id="monthSelect">${months.map(m => `<option value="${m}" ${m === selectedMonth ? 'selected' : ''}>${monthName(m)}</option>`).join('')}</select>
    ${data.participants.map(p => `
      <label for="step_${cssId(p)}">${p} — steps</label>
      <input type="number" inputmode="numeric" min="0" id="step_${cssId(p)}" placeholder="e.g. 248310" value="${rec.steps[p] != null ? rec.steps[p] : ''}" />
    `).join('')}
    <button class="primary" id="saveSteps">Save &amp; check winner</button>

    <div class="upload">
      📱 Or import from Apple Health<br>
      <label class="file" for="healthFile">Choose export (.xml or .csv)</label>
      <input type="file" id="healthFile" accept=".xml,.csv,text/xml,text/csv" />
      <div class="hint">Export from iPhone: Health → profile icon → Export All Health Data, unzip and pick <code>export.xml</code>. The app sums your steps for the selected month.</div>
    </div>
  </section>`;

  /* ---- Result card ---- */
  if (winner) {
    const [a, b] = data.participants;
    const sa = rec.steps[a], sb = rec.steps[b];
    let title, cls;
    if (winner === 'tie') { title = "It's a tie! 🤝"; cls = 'tie'; }
    else { title = `🏆 ${winner} wins!`; cls = 'win'; }
    html += `<section class="card result">
      <h2>Result <span class="pill">${monthName(selectedMonth)}</span></h2>
      <div class="winner-name ${cls}">${title}</div>
      <div class="steps-compare">
        <div class="sc ${winner === a ? 'lead' : ''}"><div class="nm">${a}</div><div class="vl">${fmt(sa)}</div></div>
        <div class="sc ${winner === b ? 'lead' : ''}"><div class="nm">${b}</div><div class="vl">${fmt(sb)}</div></div>
      </div>`;
    if (rec.prize) {
      html += `<div class="prize">
        <div class="pl">Surprise prize · ~${data.prizeBudget} ${data.currency}</div>
        <div class="pi">🎁 ${rec.prize.item}</div>
        <div class="cat">${rec.prize.category}</div>
        <a href="${rec.prize.url}" target="_blank" rel="noopener">Find on Galaxus ↗</a>
        <div><button class="ghost small" id="reroll" style="margin-top:10px">🎲 Re-roll prize</button></div>
      </div>`;
    }
    html += `</section>`;
  } else {
    html += `<section class="card"><div class="empty">Enter both step totals above to see who won ${monthName(selectedMonth)}. 👟</div></section>`;
  }

  /* ---- History ---- */
  const recs = Object.entries(data.records).sort((x, y) => y[0].localeCompare(x[0]));
  html += `<section class="card">
    <h2>📜 History</h2>
    ${recs.length ? `<table>
      <thead><tr><th>Month</th><th>${data.participants[0]}</th><th>${data.participants[1]}</th><th>Winner</th></tr></thead>
      <tbody>${recs.map(([m, r]) => {
        const w = computeWinner(r);
        return `<tr><td>${monthName(m)}</td><td>${fmt(r.steps[data.participants[0]])}</td><td>${fmt(r.steps[data.participants[1]])}</td><td class="${w && w !== 'tie' ? 'win' : ''}">${w === 'tie' ? '🤝' : (w || '—')}</td></tr>`;
      }).join('')}</tbody>
    </table>` : `<div class="empty">No months recorded yet.</div>`}
  </section>`;

  app.innerHTML = html;
  attachAppEvents();
}

/* ---------------- App events ---------------- */
function attachAppEvents() {
  const monthSel = document.getElementById('monthSelect');
  if (monthSel) monthSel.onchange = e => { selectedMonth = e.target.value; renderApp(); };

  const saveBtn = document.getElementById('saveSteps');
  if (saveBtn) saveBtn.onclick = () => {
    const steps = {};
    let ok = true;
    for (const p of data.participants) {
      const v = document.getElementById('step_' + cssId(p)).value.trim();
      if (v === '') { steps[p] = undefined; continue; }
      const n = Number(v);
      if (isNaN(n) || n < 0) { toast('Please enter a valid number for ' + p); ok = false; break; }
      steps[p] = n;
    }
    if (!ok) return;
    saveRecord(selectedMonth, steps);
    toast('Saved! ' + monthName(selectedMonth) + ' updated.');
    render();
  };

  const reroll = document.getElementById('reroll');
  if (reroll) reroll.onclick = () => {
    const rec = data.records[selectedMonth];
    if (rec) { rec.prize = pickPrize(); save(); render(); }
  };

  const file = document.getElementById('healthFile');
  if (file) file.onchange = e => handleHealthFile(e.target.files[0]);
}

function saveRecord(month, steps) {
  const rec = data.records[month] || { steps: {}, prize: null };
  for (const p of data.participants) {
    if (steps[p] !== undefined) rec.steps[p] = steps[p];
  }
  const winner = computeWinner(rec);
  if (winner && winner !== 'tie' && !rec.prize) rec.prize = pickPrize();
  data.records[month] = rec;
  save();
}

/* ---------------- Apple Health / CSV import ---------------- */
function handleHealthFile(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = reader.result;
      let total = 0;
      if (file.name.toLowerCase().endsWith('.xml')) {
        total = parseHealthXML(text, selectedMonth);
      } else {
        total = parseStepsCSV(text, selectedMonth);
      }
      if (total > 0) {
        // Ask which participant this phone belongs to
        const who = prompt(`This export has ${fmt(total)} steps for ${monthName(selectedMonth)}.\nWhich person is this device? (type exactly: ${data.participants.join(' / ')})`, data.participants[0]);
        if (who && data.participants.includes(who)) {
          const rec = data.records[selectedMonth] || { steps: {}, prize: null };
          rec.steps[who] = total;
          const w = computeWinner(rec);
          if (w && w !== 'tie' && !rec.prize) rec.prize = pickPrize();
          data.records[selectedMonth] = rec; save(); render();
          toast(`Added ${fmt(total)} steps for ${who}.`);
          return;
        }
      } else {
        toast('No steps found for ' + monthName(selectedMonth) + ' in that file.');
      }
    } catch (err) {
      toast('Could not read that file. ' + err.message);
    }
  };
  reader.readAsText(file);
}

function parseHealthXML(text, targetMonth) {
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  const records = xml.getElementsByTagName('Record');
  let total = 0, counted = 0;
  for (let i = 0; i < records.length; i++) {
    const r = records[i];
    if (r.getAttribute('type') !== 'HKQuantityTypeIdentifierStepCount') continue;
    const start = r.getAttribute('startDate') || '';
    if (start.slice(0, 7) !== targetMonth) continue;
    const v = parseFloat(r.getAttribute('value'));
    if (!isNaN(v)) { total += v; counted++; }
  }
  return Math.round(total);
}

function parseStepsCSV(text, targetMonth) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return 0;
  const header = lines[0].toLowerCase();
  let total = 0;
  if (header.includes('date') && header.includes('step')) {
    for (let i = 1; i < lines.length; i++) {
      const [d, s] = lines[i].split(',');
      if ((d || '').trim().slice(0, 7) === targetMonth) {
        const n = parseFloat((s || '').trim()); if (!isNaN(n)) total += n;
      }
    }
  } else if (header.includes('month')) {
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',');
      const mIdx = header.split(',').indexOf('month');
      const sIdx = header.split(',').findIndex(h => h.includes('step'));
      if (parts[mIdx] && parts[mIdx].trim() === targetMonth && sIdx >= 0) {
        const n = parseFloat(parts[sIdx]); if (!isNaN(n)) total += n;
      }
    }
  }
  return Math.round(total);
}

/* ---------------- Settings modal ---------------- */
const settingsModal = document.getElementById('settingsModal');
const settingsBody = document.getElementById('settingsBody');

document.getElementById('settingsBtn').onclick = openSettings;
document.getElementById('closeSettings').onclick = () => settingsModal.hidden = true;
settingsModal.onclick = e => { if (e.target === settingsModal) settingsModal.hidden = true; };

function openSettings() {
  let html = `<label>Participant 1</label><input id="p0" value="${esc(data.participants[0])}" />
    <label>Participant 2</label><input id="p1" value="${esc(data.participants[1])}" />
    <div class="hint">Names are used across history — keep them consistent.</div>
    <div class="divider"></div>
    <label>Prize budget (CHF)</label><input type="number" id="budget" min="1" value="${data.prizeBudget}" />
    <div class="divider"></div>
    <label>Prize categories (weight = how often it appears)</label>`;
  html += data.categories.map((c, i) => `
    <div class="cat-item">
      <input type="checkbox" data-cat="${i}" ${c.enabled ? 'checked' : ''} />
      <div class="ci-name">${esc(c.name)}<div class="ci-count">${c.items.length} prizes</div></div>
      <input type="number" class="ci-weight" min="1" max="10" value="${c.weight || 1}" data-weight="${i}" title="weight" />
    </div>`).join('');
  html += `<div class="divider"></div>
    <button class="ghost" id="exportBtn">⬇️ Export data (backup / sync)</button>
    <button class="ghost" id="importBtn" style="margin-top:10px">⬆️ Import data</button>
    <input type="file" id="importFile" accept="application/json" hidden />
    <button class="ghost" id="resetBtn" style="margin-top:10px;color:#f87171;border-color:#5b2330">🗑️ Reset everything</button>`;
  settingsBody.innerHTML = html;

  settingsBody.querySelector('#p0').onchange = e => { data.participants[0] = e.target.value || 'You'; save(); render(); };
  settingsBody.querySelector('#p1').onchange = e => { data.participants[1] = e.target.value || 'Wife'; save(); render(); };
  settingsBody.querySelector('#budget').onchange = e => { data.prizeBudget = Math.max(1, Number(e.target.value) || 20); save(); render(); };
  settingsBody.querySelectorAll('[data-cat]').forEach(cb => cb.onchange = e => { data.categories[+e.target.dataset.cat].enabled = e.target.checked; save(); });
  settingsBody.querySelectorAll('[data-weight]').forEach(inp => inp.onchange = e => { data.categories[+e.target.dataset.weight].weight = Math.max(1, Number(e.target.value) || 1); save(); });

  settingsBody.querySelector('#exportBtn').onclick = exportData;
  settingsBody.querySelector('#importBtn').onclick = () => settingsBody.querySelector('#importFile').click();
  settingsBody.querySelector('#importFile').onchange = importData;
  settingsBody.querySelector('#resetBtn').onclick = () => {
    if (confirm('Delete all months, steps and settings? This cannot be undone.')) {
      data = defaultData(); save(); settingsModal.hidden = true; selectedMonth = null; render(); toast('Reset complete.');
    }
  };

  settingsModal.hidden = false;
}

function exportData() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'walk-challenge-backup.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  toast('Backup downloaded.');
}

function importData(e) {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      data = { ...defaultData(), ...parsed, categories: parsed.categories || defaultData().categories, records: parsed.records || {} };
      save(); settingsModal.hidden = true; selectedMonth = null; render();
      toast('Data imported.');
    } catch (err) { toast('Invalid backup file.'); }
  };
  reader.readAsText(file);
}

/* ---------------- Utils ---------------- */
function cssId(s) { return s.replace(/[^a-zA-Z0-9]/g, '_'); }
function fmt(n) { return (n == null) ? '—' : n.toLocaleString('de-CH'); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
let toastTimer;
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.hidden = true, 2600);
}

render();
