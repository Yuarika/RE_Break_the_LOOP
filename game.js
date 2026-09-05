const room = document.querySelector('#room');
const scene = document.querySelector('#scene');
const door = document.querySelector('#door');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const trail = document.querySelector('#trail');
let current = 'L', pending = null, used = [], loopClosed = false, locked = false, restartOnNext = null, loopRange = null;
const clearRoute = ['loop', 'poor', 'room', 'mood', 'door', 'roof', 'foot', 'tool'];

const rooms = {
  L: () => target('∞', 'infinity', 'loop', 'P', '無限は、どこへ続く？'),
  P: () => [target('???L', 'sign left', 'pool', 'L'), target('???R', 'sign right', 'poor', 'R')],
  R: () => [object('roof', '屋根', 'roof', 'F'), object('room-icon', '部屋', 'room', 'M'), object('root', '根', 'root', 'T')],
  F: () => object('foot', '足', 'foot', 'T'),
  M: () => [target('', 'moon', 'moon', 'N', ''), target('雰囲気を壊す', 'mood', 'mood', 'D')],
  D: () => { message.textContent = '出口は、いつもそこにある。'; return document.createElement('span'); },
  N: () => target('PM 00:00', 'clock', 'noon', 'N', '時刻は止まらない。'),
  T: () => target('TOOL', 'door-target', 'tool', 'L')
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
  title.innerHTML = current === 'F' ? 'RE:<button class="title-fool" aria-label="Baka">B</button>re<button class="title-fool" aria-label="Baka">a</button><button class="title-fool" aria-label="Baka">k</button> <button class="title-fool" aria-label="Baka">a</button> LOOP' : loopClosed && current === 'P' ? 'RE:Break the LOOP<button class="period-target" aria-label="LOOPの直後のピリオド">.</button>' : 'RE:Break the LOOP';
  if (current === 'F') title.querySelectorAll('.title-fool').forEach(el => el.addEventListener('click', e => shoot(e, 'fool', 'L')));
  if (loopClosed && current === 'P') title.querySelector('.period-target').addEventListener('click', clear);
  const content = rooms[current](); (Array.isArray(content) ? content : [content]).forEach(x => scene.append(x));
  if (loopClosed && current === 'P') message.textContent = '長い環は、ここで終止符を待っている。';
  updateTrail();
}
function shoot(e, word, next) {
  if (locked) return;
  if (used.includes(word)) {
    const first = used.indexOf(word);
    used.push(word);
    loopRange = [first, used.length - 1];
    if (word === 'loop' && clearRoute.every((value, index) => used[index] === value) && used.length === clearRoute.length + 1) {
      loopClosed = true; locked = true; mark(e); pending = 'P'; message.innerHTML = `ループが完成した！ ${loopRange[1] - loopRange[0] + 1}個の単語がつながった。`; door.classList.add('open'); door.focus(); clearSound(); updateTrail(); return;
    }
    loopClosed = false; restartOnNext = word; locked = true; mark(e); pending = next;
    message.innerHTML = `ループが完成した！ ${loopRange[1] - loopRange[0] + 1}個の単語がつながった。`;
    door.classList.add('open'); door.focus(); unlockSound(); updateTrail(); return;
  }
  used.push(word); loopRange = null; locked = true; mark(e); pending = next; message.textContent = 'ガチャ… ドアの向こうへ進める。'; door.classList.add('open'); door.focus(); unlockSound();
  if (word === 'mood') room.classList.add('mood-broken');
  updateTrail();
}
function mark(e) { const b = document.createElement('i'); b.className = 'bullet'; const r = room.getBoundingClientRect(); b.style.left = `${e.clientX - r.left}px`; b.style.top = `${e.clientY - r.top}px`; room.append(b); }
function arrive(next) { current = next; render(); }
door.addEventListener('click', () => {
  if (pending) { current = pending; if (restartOnNext) { used = [restartOnNext]; restartOnNext = null; loopRange = null; } render(); return; }
  if (current === 'D' && !locked) { const r = door.getBoundingClientRect(); shoot({ clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 }, 'door', 'R'); }
});
function clear(e) { if (locked) return; locked = true; mark(e); clearSound(); message.innerHTML = '<strong>CLEAR</strong><br>RE:Break the LOOP'; scene.querySelectorAll('.target').forEach(x => x.disabled = true); }
function updateTrail() {
  trail.innerHTML = used.length ? used.map((word, index) => {
    const inLoop = loopRange && index >= loopRange[0] && index <= loopRange[1];
    return `${index ? ' <span>→</span> ' : ''}<span class="${inLoop ? 'loop-word' : ''}">${word.toUpperCase()}</span>`;
  }).join('') : '—';
}
function reset(text = '') { current = 'L'; used = []; loopClosed = false; restartOnNext = null; loopRange = null; render(); if (text) message.textContent = text; }
document.querySelector('#reset').addEventListener('click', () => reset('最初の部屋に戻った。'));
function tone(freq, duration, type = 'square') { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration); }
function unlockSound() { tone(430,.08); setTimeout(()=>tone(650,.1),90); }
function clearSound() { tone(523,.14,'sine'); setTimeout(()=>tone(659,.16,'sine'),130); setTimeout(()=>tone(784,.35,'sine'),280); }
render();
