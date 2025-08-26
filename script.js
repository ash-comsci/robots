
/* === NAV TOGGLE & SCROLLSPY === */
const nav = document.querySelector('.site-nav');
const toggle = document.querySelector('.nav-toggle');
toggle?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  toggle.setAttribute('aria-expanded', String(open));
});
const sections = [...document.querySelectorAll('main section, main article')];
const links = [...document.querySelectorAll('.nav-list a')];

function onScrollSpy() {
  const pos = window.scrollY + 120;
  let currentId = '';
  sections.forEach(sec => {
    const rect = sec.getBoundingClientRect();
    const top = rect.top + window.scrollY;
    if (pos >= top && pos < top + sec.offsetHeight) currentId = sec.id || currentId;
  });
  links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${currentId}`));
}
document.addEventListener('scroll', onScrollSpy);

/* === QUICK SEARCH (filter cards by text) === */
const q = document.getElementById('q');
q?.addEventListener('input', (e) => {
  const term = e.target.value.trim().toLowerCase();
  const cards = document.querySelectorAll('.section, .role');
  cards.forEach(card => {
    const txt = card.innerText.toLowerCase();
    card.style.display = term && !txt.includes(term) ? 'none' : '';
  });
});

/* === BACK TO TOP === */
const toTop = document.querySelector('.to-top');
window.addEventListener('scroll', () => {
  toTop.classList.toggle('show', window.scrollY > 600);
});
toTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* === FOOTER YEAR === */
document.getElementById('year').textContent = new Date().getFullYear();

/* === 5B: DATE-ALIGNED CALENDAR & GANTT === */
const form = document.getElementById('date-form');
const genBtn = document.getElementById('genBtn');
const compInput = document.getElementById('compDate');
const weekRangesEl = document.getElementById('weekRanges');
const ganttEl = document.getElementById('gantt');

/* helper: get Monday for date */
function mondayOfWeek(d) {
  const dt = new Date(d);
  const day = dt.getDay(); // 0 Sun ... 6 Sat
  const diff = (day === 0 ? -6 : 1 - day); // adjust so Monday
  dt.setDate(dt.getDate() + diff);
  dt.setHours(0,0,0,0);
  return dt;
}

/* format date */
function fmt(d) {
  return d.toLocaleDateString(undefined, { weekday:'short', month:'short', day:'numeric', year:'numeric' });
}

/* compute week ranges (Week 8 includes comp date) */
function computeWeeks(compDate) {
  const week8Mon = mondayOfWeek(compDate);
  const ranges = [];
  for (let i=7; i>=0; i--) {
    const start = new Date(week8Mon);
    start.setDate(week8Mon.getDate() - i*7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    ranges.push({ label: `Week ${8-i}`, start, end });
  }
  return ranges;
}

/* render week ranges to DOM */
function renderRanges(ranges) {
  weekRangesEl.innerHTML = '';
  ranges.forEach(r => {
    const d = document.createElement('div');
    d.className = 'range';
    d.innerHTML = `<h5>${r.label}</h5><div>${fmt(r.start)} – ${fmt(r.end)}</div>`;
    weekRangesEl.appendChild(d);
  });
}

/* Gantt: static tasks per role, but positioned by dates */
const TASKS = {
  Builder: [
    { startWeek: 1, durDays: 14, label: 'Drivetrain & Chassis', color: 'orange' },
    { startWeek: 3, durDays: 7,  label: 'Mechanism Mount & Guards', color: 'blue' },
    { startWeek: 4, durDays: 7,  label: 'System Integration', color: 'orange' },
    { startWeek: 5, durDays: 7,  label: 'Reinforce & Spares', color: 'blue' },
    { startWeek: 6, durDays: 7,  label: 'Inspection Prep', color: 'orange' },
    { startWeek: 7, durDays: 7,  label: 'Pack & Calibrate', color: 'orange' },
    { startWeek: 8, durDays: 7,  label: 'Event Support', color: 'blue' },
  ],
  Programmer: [
    { startWeek: 1, durDays: 14, label: 'Tooling & TeleOp', color: 'blue' },
    { startWeek: 3, durDays: 7,  label: 'Mechanism Control', color: 'orange' },
    { startWeek: 4, durDays: 7,  label: 'Sensors & Auto V1', color: 'blue' },
    { startWeek: 5, durDays: 7,  label: 'Failsafes & Tuning', color: 'orange' },
    { startWeek: 6, durDays: 7,  label: 'Match Sims & Docs', color: 'blue' },
    { startWeek: 7, durDays: 7,  label: 'Finalize & Backups', color: 'orange' },
    { startWeek: 8, durDays: 7,  label: 'Event Debug', color: 'blue' },
  ],
  Outreach: [
    { startWeek: 1, durDays: 7, label: 'Branding & Notebook', color: 'orange' },
    { startWeek: 2, durDays: 7, label: 'Social & Research', color: 'blue' },
    { startWeek: 3, durDays: 7, label: 'Mechanism Doc & Plan', color: 'orange' },
    { startWeek: 4, durDays: 7, label: 'Outreach Event & Sponsors', color: 'blue' },
    { startWeek: 5, durDays: 7, label: 'Portfolio Draft & Deck', color: 'orange' },
    { startWeek: 6, durDays: 7, label: 'Revisions & Practice', color: 'blue' },
    { startWeek: 7, durDays: 7, label: 'Print & Logistics', color: 'orange' },
    { startWeek: 8, durDays: 7, label: 'Judging & Comms', color: 'blue' },
  ]
};

/* Draw a simple Gantt: position bars as % across total span */
function renderGantt(ranges, compDate) {
  // container
  ganttEl.innerHTML = '';
  const inner = document.createElement('div');
  inner.className = 'gantt-inner';
  ganttEl.appendChild(inner);

  // timeline bounds
  const first = ranges[0].start;
  const last  = ranges[ranges.length-1].end;
  const totalMs = last - first;

  // rows for each role
  Object.keys(TASKS).forEach(role => {
    const row = document.createElement('div');
    row.className = 'row';

    const label = document.createElement('div');
    label.className = 'role-label';
    label.textContent = role;

    const timeline = document.createElement('div');
    timeline.className = 'timeline';

    // bars
    TASKS[role].forEach(t => {
      const ws = ranges.find(r => r.label.endsWith(String(t.startWeek)));
      const start = new Date(ws.start); // Monday of that week
      const startOffset = start - first;
      const leftPct = (startOffset / totalMs) * 100;
      const widthPct = (t.durDays * 24 * 60 * 60 * 1000) / totalMs * 100;

      const bar = document.createElement('div');
      bar.className = `bar ${t.color}`;
      bar.style.left = `${leftPct}%`;
      bar.style.width = `${widthPct}%`;
      bar.textContent = t.label;
      timeline.appendChild(bar);
    });

    // competition day vline
    const vline = document.createElement('div');
    vline.className = 'vline';
    const compMs = compDate - first;
    vline.style.left = `${(compMs / totalMs) * 100}%`;
    timeline.appendChild(vline);

    row.appendChild(label);
    row.appendChild(timeline);
    inner.appendChild(row);
  });
}

/* Hook up generation */
function generate() {
  const compDate = new Date(compInput.value);
  const ranges = computeWeeks(compDate);
  renderRanges(ranges);
  renderGantt(ranges, compDate);
}

genBtn?.addEventListener('click', generate);
/* auto-generate on load with default date */
window.addEventListener('DOMContentLoaded', generate);
