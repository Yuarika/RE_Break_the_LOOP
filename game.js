const room = document.querySelector('#room');
const scene = document.querySelector('#scene');
const door = document.querySelector('#door');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const trail = document.querySelector('#trail');
const indicator = document.querySelector('#loop-indicator');
let current = 'L', pending = null, used = [], loopClosed = false, locked = false, restartOnNext = null, loopRange = null;
const clearRoute = ['loop', 'poor', 'room', 'mood', 'door', 'roof', 'foot', 'tool'];

const rooms = {
  L: () => { message.textContent = '無限は、どこへ続く？'; return document.createElement('span'); },
  P: () => [target('???L', 'sign left', 'pool', 'L'), target('???R', 'sign right', 'poor', 'R')],
  R: () => [target('', 'room-background', 'room', 'M'), object('roof', '', 'roof', 'F'), object('root', '', 'root', 'T')],
  F: () => object('foot', '足', 'foot', 'T'),
  M: () => [target('', 'moon', 'moon', 'N', ''), target('雰囲気を壊す', 'mood', 'mood', 'D')],
  D: () => { message.textContent = '出口は、いつもそこにある。'; return document.createElement('span'); },
  N: () => target('PM 00:00', 'clock', 'noon', 'N'),
  T: () => target('', 'tool-image', 'tool', 'L'),
  C: () => { const el = document.createElement('section'); el.className = 'clear-scene'; el.innerHTML = '<h2>CLEAR!</h2><p>RE:Break the LOOP</p><a class="x-share" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?text=RE%3ABreak%20the%20LOOP%20%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%9F%EF%BC%81">𝕏 にポストする</a>'; return el; }
};

function target(label, cls, word, next, hint = '') {
  const el = document.createElement('button'); el.className = `target ${cls}`; el.textContent = label; el.setAttribute('aria-label', label || word);
  el.addEventListener('click', e => shoot(e, word, next)); if (hint) message.textContent = hint; return el;
}
function object(cls, label, word, next) {
  const el = target('', `object ${cls}`, word, next); el.innerHTML = `<span class="drawing"></span><span>${label}</span>`; el.setAttribute('aria-label', label); return el;
}
function render() {
  locked = false; pending = null; scene.innerHTML = ''; room.querySelectorAll('.bullet').forEach(b => b.remove()); door.hidden = false; door.classList.remove('open'); message.textContent = '';
  room.className = `room room-${current.toLowerCase()}`;
  title.className = 'wall-title';
  title.innerHTML = current === 'F' ? 'RE: <button class="title-fool" aria-label="Baka">B</button>re<button class="title-fool" aria-label="Baka">a</button><button class="title-fool" aria-label="Baka">k</button> <button class="title-fool" aria-label="Baka">a</button> LOOP' : loopClosed && current === 'P' ? 'RE: break the LOOP<button class="period-target" aria-label="LOOPの直後の位置">&nbsp;</button>' : current === 'C' ? 'RE: break the LOOP.' : 'RE: break the LOOP';
  if (current === 'F') title.querySelectorAll('.title-fool').forEach(el => el.addEventListener('click', e => shoot(e, 'fool', 'L')));
  if (loopClosed && current === 'P') title.querySelector('.period-target').addEventListener('click', clear);
  const content = rooms[current](); (Array.isArray(content) ? content : [content]).forEach(x => scene.append(x));
  if (loopClosed && current === 'P') message.textContent = '終止符を打て。でなければ再び繰り返す。';
  updateTrail();
  updateIndicator();
}
function shoot(e, word, next) {
  if (locked) return;
  if (used.includes(word)) {
    const first = used.indexOf(word);
    used.push(word);
    loopRange = [first, used.length - 1];
    if (word === 'loop' && clearRoute.every((value, index) => used[index] === value) && used.length === clearRoute.length + 1) {
      loopClosed = true; locked = true; mark(e); pending = 'P'; message.innerHTML = `${loopRange[1] - loopRange[0]}個の単語でループが完成した！<br>ドアの向こうへ進める。`; door.classList.add('open'); door.focus(); clearSound(); updateTrail(); updateIndicator(); return;
    }
    loopClosed = false; restartOnNext = word; locked = true; mark(e); pending = next;
    message.innerHTML = `${loopRange[1] - loopRange[0]}個の単語でループが完成した！<br>ドアの向こうへ進める。`;
    door.classList.add('open'); door.focus(); unlockSound(); updateTrail(); updateIndicator(); return;
  }
  used.push(word); loopRange = null; locked = true; mark(e); pending = next; message.textContent = 'ガチャ… ドアの向こうへ進める。'; door.classList.add('open'); door.focus(); unlockSound();
  if (word === 'mood') room.classList.add('mood-broken');
  updateTrail();
  updateIndicator();
}
function mark(e) { const b = document.createElement('i'); b.className = 'bullet'; const r = room.getBoundingClientRect(); b.style.left = `${e.clientX - r.left}px`; b.style.top = `${e.clientY - r.top}px`; room.append(b); }
function arrive(next) { current = next; render(); }
door.addEventListener('click', () => {
  if (pending) { current = pending; if (restartOnNext) { used = []; restartOnNext = null; loopRange = null; } render(); return; }
  if (current === 'D' && !locked) { const r = door.getBoundingClientRect(); shoot({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, 'door', 'R'); }
});
function clear(e) { if (locked) return; locked = true; mark(e); pending = 'C'; clearSound(); message.innerHTML = '<strong>終止符が打たれた！</strong><br>扉の向こうでループが終わる。'; door.classList.add('open'); }
function updateTrail() {
  trail.innerHTML = used.length ? used.map((word, index) => {
    const inLoop = loopRange && index >= loopRange[0] && index <= loopRange[1];
    return `${index ? ' <span>→</span> ' : ''}<span class="${inLoop ? 'loop-word' : ''}">${word.toUpperCase()}</span>`;
  }).join('') : '—';
}
function updateIndicator() {
  if (current === 'C') { indicator.innerHTML = ''; return; }
  const q = '<img class="hint-image" src="image/Hatena.png" alt="">';
  const arrow = '<img class="arrow-image" src="image/Arrow.png" alt="">';
  let left = '', right = '';
  if (used.length) {
    if (loopRange) { left = arrow + q; right = q; }
    else if (used.length === 1) { left = q; right = q + arrow; }
    else { left = arrow + q; right = q + arrow; }
  }
  const dots = used.length ? `<div class="steps">${Array.from({ length: 8 }, (_, i) => `<i class="${i < Math.min(used.length, 8) ? 'on' : ''}"></i>`).join('')}</div>` : '';
  const core = current === 'L' && !used.length ? '<button class="infinity-mark infinite-button" aria-label="無限を撃つ"></button>' : '<div class="infinity-mark"></div>';
  indicator.innerHTML = `<div class="indicator-row"><div class="indicator-side left">${left}</div>${core}<div class="indicator-side right">${right}</div></div>` + dots;
  if (current === 'L' && !used.length) indicator.querySelector('.infinite-button').addEventListener('click', e => shoot(e, 'loop', 'P'));
}
function reset(text = '') { current = 'L'; used = []; loopClosed = false; restartOnNext = null; loopRange = null; render(); if (text) message.textContent = text; }
document.querySelector('#reset').addEventListener('click', () => reset('最初の部屋に戻った。'));
function tone(freq, duration, type = 'square') { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration); }
function unlockSound() { tone(430,.08); setTimeout(()=>tone(650,.1),90); }
function clearSound() { tone(523,.14,'sine'); setTimeout(()=>tone(659,.16,'sine'),130); setTimeout(()=>tone(784,.35,'sine'),280); }
render();
