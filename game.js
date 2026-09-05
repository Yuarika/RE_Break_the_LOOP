const room = document.querySelector('#room');
const scene = document.querySelector('#scene');
const door = document.querySelector('#door');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
let current = 'L', pending = null, used = [], loopClosed = false, locked = false;

const rooms = {
  L: () => target('∞', 'infinity', 'loop', 'P', '無限は、どこへ続く？'),
  P: () => loopClosed ? finalP() : [target('???L', 'sign left', 'pool', 'L'), target('???R', 'sign right', 'poor', 'R')],
  R: () => [object('roof', '屋根', 'roof', 'F'), object('room-icon', '部屋', 'room', 'M'), object('root', '根', 'root', 'T')],
  F: () => [object('foot', '足', 'foot', 'T'), object('fool', 'Baka', 'fool', 'L')],
  M: () => [target('', 'moon', 'moon', 'N', ''), target('雰囲気を壊す', 'mood', 'mood', 'D')],
  D: () => target('DOOR', 'door-target', 'door', 'R'),
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
  locked = false; pending = null; scene.innerHTML = ''; door.hidden = true; message.textContent = '';
  room.className = `room room-${current.toLowerCase()}`;
  title.innerHTML = current === 'F' ? 'RE:<span class="red">B</span>re<span class="red">a</span><span class="red">k</span> <span class="red">a</span> LOOP' : 'RE:Break the LOOP';
  const content = rooms[current](); (Array.isArray(content) ? content : [content]).forEach(x => scene.append(x));
}
function shoot(e, word, next) {
  if (locked) return;
  if (used.includes(word)) {
    if (word === 'loop' && used.at(-1) === 'tool') { loopClosed = true; used.push(word); arrive('P'); return; }
    reset('同じ言葉を選んだ。最初から。'); return;
  }
  used.push(word); locked = true; mark(e); pending = next; message.textContent = 'ガチャ… ドアの向こうへ進める。'; door.hidden = false; door.focus(); unlockSound();
  if (word === 'mood') room.classList.add('mood-broken');
}
function mark(e) { const b = document.createElement('i'); b.className = 'bullet'; const r = room.getBoundingClientRect(); b.style.left = `${e.clientX - r.left}px`; b.style.top = `${e.clientY - r.top}px`; room.append(b); }
function arrive(next) { current = next; render(); }
door.addEventListener('click', () => { if (pending) { current = pending; render(); } });
function finalP() {
  message.textContent = '長い環は、ここで終止符を待っている。';
  const el = document.createElement('button'); el.className = 'target final-loop'; el.innerHTML = 'LOOP<span>.</span>'; el.setAttribute('aria-label', 'LOOPの右下');
  el.addEventListener('click', e => { if (locked) return; locked = true; mark(e); clearSound(); message.innerHTML = '<strong>CLEAR</strong><br>RE:Break the LOOP'; scene.querySelectorAll('.target').forEach(x => x.disabled = true); }); return el;
}
function reset(text = '') { current = 'L'; used = []; loopClosed = false; render(); if (text) message.textContent = text; }
document.querySelector('#reset').addEventListener('click', () => reset('最初の部屋に戻った。'));
function tone(freq, duration, type = 'square') { const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain(); o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(.045,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+duration);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+duration); }
function unlockSound() { tone(430,.08); setTimeout(()=>tone(650,.1),90); }
function clearSound() { tone(523,.14,'sine'); setTimeout(()=>tone(659,.16,'sine'),130); setTimeout(()=>tone(784,.35,'sine'),280); }
render();
