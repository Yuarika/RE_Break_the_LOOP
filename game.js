
const room = document.querySelector('#room');
const scene = document.querySelector('#scene');
const door = document.querySelector('#door');
const title = document.querySelector('#title');
const message = document.querySelector('#message');
const trail = document.querySelector('#trail');
const indicator = document.querySelector('#loop-indicator');

let current = 'L';
let pending = null;
let used = [];
let loopClosed = false;
let periodAvailable = false;
let locked = false;
let restartOnNext = null;
let loopRange = null;
let doorDestroyed = false;
let moodBroken = false;
let longLoopArrivalMessagePending = false;

/*
 * 長いループ完成後、
 * 「ここでは終止符をうてない」と表示された部屋で
 * 次に何かを撃った瞬間だけ、
 * それまでのループ履歴をリセットするためのフラグ。
 *
 * Pへ到着した場合は periodAvailable を維持する。
 * PでPOOL / POORを撃った場合はここで履歴をリセットする。
 */
let restartAfterLongLoop = false;

let indicatorState = 'none';

let audioContext = null;


// ============================================================
// 長いループを構成する語の巡回順
// ============================================================

const clearRoute = [
  'loop',
  'poor',
  'room',
  'mood',
  'door',
  'roof',
  'foot',
  'tool'
];


// ============================================================
// ROOMS
// ============================================================

const rooms = {

  // ----------------------------------------------------------
  // L
  // ----------------------------------------------------------
  L: () => {
    message.textContent = '';
    return document.createElement('span');
  },


  // ----------------------------------------------------------
  // P
  // ----------------------------------------------------------
  P: () => [
    target('???L', 'sign left', 'pool', 'L'),
    target('???R', 'sign right', 'poor', 'R')
  ],


  // ----------------------------------------------------------
  // R
  // ----------------------------------------------------------
  R: () => [
    target('', 'room-background', 'room', 'M'),
    object('roof', '', 'roof', 'F'),
    object('root', '', 'root', 'T')
  ],


  // ----------------------------------------------------------
  // F
  // ----------------------------------------------------------
  F: () => object(
    'foot',
    '',
    'foot',
    'T'
  ),


  // ----------------------------------------------------------
  // M
  // ----------------------------------------------------------
  M: () => {

    const container =
      document.createElement('div');

    container.className =
      'm-scene';


    // --------------------------------------------------------
    // 「雰囲気を壊す」
    // --------------------------------------------------------

    const moodTarget =
      target(
        '雰囲気を壊す',
        'mood',
        'mood',
        'D'
      );

    container.appendChild(
      moodTarget
    );


    // --------------------------------------------------------
    // 月の窓
    // --------------------------------------------------------

    const windowFrame =
      document.createElement('div');

    windowFrame.className =
      'moon-window';


    // --------------------------------------------------------
    // 夜空
    // --------------------------------------------------------

    const sky =
      document.createElement('div');

    sky.className =
      'moon-sky';

    windowFrame.appendChild(
      sky
    );


    // --------------------------------------------------------
    // 月
    // --------------------------------------------------------

    const moonTarget =
      target(
        '',
        'moon',
        'moon',
        'N'
      );

    moonTarget.setAttribute(
      'aria-label',
      '月'
    );

    windowFrame.appendChild(
      moonTarget
    );

    container.appendChild(
      windowFrame
    );


    // --------------------------------------------------------
    // 24:00
    // ※これは撃てない
    // --------------------------------------------------------

    const clock =
      document.createElement('div');

    clock.className =
      'clock clock-24';

    clock.textContent =
      '24:00';

    container.appendChild(
      clock
    );

    return container;
  },


  // ----------------------------------------------------------
  // D
  // ----------------------------------------------------------
  D: () => {

    message.textContent =
      doorDestroyed
        ? '?∞?を壊した！'
        : '';

    return document.createElement('span');
  },


  // ----------------------------------------------------------
  // N
  // ----------------------------------------------------------
  N: () => {

    const container =
      document.createElement('div');

    container.className =
      'north-scene';


    // --------------------------------------------------------
    // 窓
    // --------------------------------------------------------

    const windowFrame =
      document.createElement('div');

    windowFrame.className =
      'north-window';


    // --------------------------------------------------------
    // 空
    // --------------------------------------------------------

    const sky =
      document.createElement('div');

    sky.className =
      'north-sky';

    windowFrame.appendChild(
      sky
    );


    // --------------------------------------------------------
    // 太陽
    // --------------------------------------------------------

    const sun =
      document.createElement('div');

    sun.className =
      'north-sun';

    sun.setAttribute(
      'aria-hidden',
      'true'
    );

    windowFrame.appendChild(
      sun
    );

    container.appendChild(
      windowFrame
    );


    // --------------------------------------------------------
    // 12:00
    // ※こちらは撃てる
    // --------------------------------------------------------

    const clock =
      target(
        '12:00',
        'clock',
        'noon',
        'N'
      );

    container.appendChild(
      clock
    );

    return container;
  },


  // ----------------------------------------------------------
  // T
  // ----------------------------------------------------------
  T: () => target(
    '',
    'tool-image',
    'tool',
    'L'
  ),


  // ----------------------------------------------------------
  // C
  // ----------------------------------------------------------
  C: () => {
  // =========================================
  // クリア画面のリンク設定
  // =========================================

  // 作者のXアカウント
  const authorXUrl = 'https://x.com/yuarikaa';

  // このサイトの告知ポスト
  // ポスト公開後、このURLだけ変更してください。
  const announcementPostUrl = '#';

  const el = document.createElement('section');
  el.className = 'clear-scene';

  el.innerHTML = `
    <h2>CLEAR!</h2>

    <p>RE: Break the LOOP.</p>

    <div class="clear-links">

      <!-- クリア結果の投稿 -->
      <a
        class="x-share"
        target="_blank"
        rel="noopener"
        href="https://twitter.com/intent/tweet?text=web%E8%AC%8E%E3%80%8CRE%3ABreak%20the%20LOOP%E3%80%8D%E3%82%92%E3%82%AF%E3%83%AA%E3%82%A2%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81%20https%3A%2F%2Fyuarika.github.io%2FRE_Break_the_LOOP%2F%20%23%E8%AC%8E%E8%A7%A3%E3%81%8D%20%23RE_BTL%20%40yuarikaa"
      >
        <span class="x-share-icon">𝕏</span>

        <span class="x-share-content">
          <span class="x-share-label">クリアをXで共有</span>
          <span class="x-share-sub">SHARE YOUR RESULT</span>
        </span>

        <span class="x-share-arrow">↗</span>
      </a>


      <!-- 作者のXアカウント -->
      <a
        class="x-share"
        target="_blank"
        rel="noopener"
        href="${authorXUrl}"
      >
        <span class="x-share-icon">𝕏</span>

        <span class="x-share-content">
          <span class="x-share-label">作者のXアカウント</span>
          <span class="x-share-sub">@yuarikaa</span>
        </span>

        <span class="x-share-arrow">↗</span>
      </a>


      <!-- 告知ポスト -->
      <a
        class="x-share announcement-link"
        href="${announcementPostUrl}"
        target="_blank"
        rel="noopener"
        aria-label="RE:Break the LOOP 告知ポスト"
      >
        <span class="x-share-icon">𝕏</span>

        <span class="x-share-content">
          <span class="x-share-label">告知ポストを見る</span>
          <span class="x-share-sub">ANNOUNCEMENT POST</span>
        </span>

        <span class="x-share-arrow">↗</span>
      </a>

    </div>
  `;

  return el;
},
};


// ============================================================
// TARGET / OBJECT
// ============================================================

function target(
  label,
  cls,
  word,
  next,
  hint = ''
) {

  const el =
    document.createElement('button');

  el.className =
    `target ${cls}`;

  el.textContent =
    label;

  el.setAttribute(
    'aria-label',
    label || word
  );


  el.addEventListener(
    'click',
    e => {

      if (locked) {
        return;
      }

      const success =
        shoot(
          e,
          word,
          next
        );

      if (success) {

        destroyTarget(
          e.currentTarget
        );
      }
    }
  );


  if (hint) {

    message.textContent =
      hint;
  }


  return el;
}


function object(
  cls,
  label,
  word,
  next
) {

  const el =
    target(
      '',
      `object ${cls}`,
      word,
      next
    );


  el.innerHTML = `
    <span class="drawing"></span>
    <span>${label}</span>
  `;


  el.setAttribute(
    'aria-label',
    label || word
  );


  return el;
}


function destroyTarget(el) {

  if (
    !el ||
    !el.parentNode
  ) {
    return;
  }


  el.classList.add(
    'shot-target'
  );

  el.disabled = true;


  setTimeout(
    () => {

      if (el.parentNode) {
        el.remove();
      }

    },
    180
  );
}


// ============================================================
// RENDER
// ============================================================

function render() {

  locked = false;
  pending = null;


  scene.innerHTML = '';


  room
    .querySelectorAll('.bullet')
    .forEach(
      b => b.remove()
    );


  door.hidden = false;

  door.classList.remove(
    'open'
  );

  door.classList.remove(
    'broken'
  );


  message.textContent = '';


  room.className = `room room-${current.toLowerCase()}`;
room.style.background = '';
room.style.color = '';

if (current === 'M' && moodBroken) {
  room.style.background = 'linear-gradient(115deg, #fafafa, #e7e7e5)';
  room.style.color = '#151515';
}

title.className = 'wall-title';


  // ==========================================================
  // TITLE
  // ==========================================================
  if (current === 'L') {

    title.innerHTML = `
      <span class="title-fixed">
        RE: Break the
      </span>

      <span>&nbsp;</span>

      <button
        class="title-loop"
        aria-label="LOOP"
      >LOOP</button>
    `;

  } else if (current === 'F') {

    title.innerHTML =
      '<span class="title-fixed">RE:</span> ' +
      '<span class="f-break">' +
        '<button class="title-baka" aria-label="B">B</button>' +
        '<span>re</span>' +
        '<button class="title-baka" aria-label="a">a</button>' +
        '<button class="title-baka" aria-label="k">k</button>' +
      '</span>' +
      '<span>&nbsp;</span>' +
      '<button class="title-baka title-baka-last" aria-label="a">a</button>' + 
'<span>&nbsp;</span>' + 
'<span class="title-fixed">LOOP</span>'; 

  } else if (
    periodAvailable &&
    current === 'P'
  ) {

    /*
     * 長いループ完成後のP。
     *
     * Pの右下に透明なピリオド判定を置く。
     */

    title.innerHTML = `
      <span class="title-fixed">
        RE: Break the
      </span>

      <span class="period-loop">
        LOO<span class="period-p">
          P
          <button
            class="period-target"
            aria-label="ピリオド"
          ></button>
        </span>
      </span>
    `;

  } else if (current === 'C') {

    title.innerHTML =
      'RE: Break the LOOP.';

  } else {

    title.innerHTML =
      'RE: Break the LOOP';
  }


  // ==========================================================
  // LのLOOP
  // ==========================================================

  if (current === 'L') {

    const loopButton =
      title.querySelector(
        '.title-loop'
      );


    if (loopButton) {

      loopButton.addEventListener(
        'click',
        e => {

          if (locked) {
            return;
          }


          const success =
            shoot(
              e,
              'loop',
              'P'
            );


          if (success) {

            destroyTarget(
              e.currentTarget
            );
          }
        }
      );
    }
  }


  // ==========================================================
  // F
  // ==========================================================

  if (current === 'F') {

    title
      .querySelectorAll(
        '.title-baka'
      )
      .forEach(
        el => {

          el.addEventListener(
            'click',
            e => {

              if (locked) {
                return;
              }


              const success =
                shoot(
                  e,
                  'fool',
                  'L'
                );


              if (!success) {
                return;
              }


              mark(e);


              title
                .querySelectorAll(
                  '.title-baka'
                )
                .forEach(
                  button => {
                    button.disabled = true;
                  }
                );


              title
                .querySelector(
                  '.f-break'
                )
                ?.classList.add(
                  'baka-shot'
                );


              const lastA =
                title.querySelector(
                  '.title-baka-last'
                );


              if (lastA) {

                lastA.classList.add(
                  'baka-shot'
                );
              }


              setTimeout(
  () => {

    title.innerHTML =
      '<span class="title-fixed">RE:</span> ' +
      '<span class="f-after">re</span> ' +
      '<span>&nbsp;</span>' +
      '<span class="title-fixed">LOOP</span>';

  },
  180
);
            }
          );
        }
      );
  }


  // ==========================================================
  // Pのピリオド
  // ==========================================================

  if (
    periodAvailable &&
    current === 'P'
  ) {

    const period =
      title.querySelector(
        '.period-target'
      );


    if (period) {

      period.addEventListener(
        'click',
        clear
      );
    }
  }


  // ==========================================================
  // 部屋の内容
  // ==========================================================

  const content =
    rooms[current]();


  (
    Array.isArray(content)
      ? content
      : [content]
  ).forEach(
    x => {

      if (x) {
        scene.append(x);
      }
    }
  );


  // ==========================================================
  // Dのドア
  // ==========================================================

  if (
    current === 'D' &&
    doorDestroyed
  ) {

    door.classList.add(
      'broken'
    );

    door.classList.add(
      'open'
    );


    door.setAttribute(
      'aria-label',
      '黒い空間へ進む'
    );


    message.textContent =
      '?∞?を壊した！';
  }



  // ==========================================================
  // CLEAR
  // ==========================================================

  if (current === 'C') {

    door.hidden = true;

    message.textContent = '';
  }


  // ==========================================================
  // HUD
  // ==========================================================

  updateTrail();

  updateIndicator();
}


// ============================================================
// SHOOT
// ============================================================

function shoot(
  e,
  word,
  next
) {

  if (locked) {
    return false;
  }


  /*
   * ==========================================================
   * 長いループ完成後の「再び繰り返す」
   * ==========================================================
   *
   * ここが今回の重要部分。
   *
   * 「ここでは終止符を打てない」
   * と言われた後、
   *
   * 実際に何かを撃った瞬間だけ
   * 以前のループ履歴を完全に捨てる。
   *
   * ただし、
   *
   * - current
   * - pending
   * - doorDestroyed
   * - locked
   *
   * などの部屋・ドアの状態は変更しない。
   *
   * そのためDのドアを撃った場合でも、
   * 履歴だけがリセットされ、
   * ドア破壊処理は通常通り動く。
   *
   * また、この処理はclear()には入らない。
   * Pでピリオドを撃った場合は
   * periodAvailableを維持したままクリアできる。
   */

  if (restartAfterLongLoop) {

    used = [];

    loopRange = null;

    loopClosed = false;

    periodAvailable = false;

    restartOnNext = null;

    restartAfterLongLoop = false;

    indicatorState = 'none';


    updateTrail();

    updateIndicator();
  }


  shootSound();


  // ==========================================================
  // D → R
  // ==========================================================

  if (
    current === 'D' &&
    word === 'door'
  ) {

    used.push(word);

    loopRange = null;

    locked = true;

    mark(e);

    doorDestroyed = true;

    pending = 'R';


    door.classList.add(
      'broken'
    );

    door.classList.add(
      'open'
    );


    door.setAttribute(
      'aria-label',
      '黒い空間へ進む'
    );


    unlockSound();


    message.textContent =
      '?∞?を壊した！';


    indicatorState =
      getShotIndicatorState();


    updateTrail();

    updateIndicator();

    return true;
  }


  // ==========================================================
  // FOOL
  // ==========================================================

  if (word === 'fool') {

    used.push(word);

    loopRange = null;

    locked = true;

    pending = next;


    message.textContent =
      '?∞?を壊した！';

    unlockSound();


    indicatorState =
      getShotIndicatorState();


    updateTrail();

    updateIndicator();

    return true;
  }


  // ==========================================================
  // 同じ単語を再び撃った
  // ==========================================================

  if (
    used.includes(word)
  ) {

    const first =
      used.indexOf(word);




    loopRange = [
      first,
      used.length - 1
    ];


    const isLongLoop =
      checkLongLoop(
        first,
        word
      );


    // ========================================================
    // 長いループ
    // ========================================================

    if (isLongLoop) {

      /*
       * 長いループ完成。
       *
       * ここでピリオドを撃てる状態にする。
       */

      loopClosed = true;

      periodAvailable = true;

      locked = true;

      mark(e);

      pending = next;


      /*
       * 長いループ完成時には
       * restartOnNext を設定しない。
       */

      restartOnNext = null;


      /*
       * 次に別のターゲットを撃ったら
       * この長いループの履歴を破棄する。
       *
       * Pでピリオドを撃った場合は
       * clear()側でこのフラグを解除する。
       */

      restartAfterLongLoop = true;


      longLoopArrivalMessagePending =
        true;


      message.innerHTML =
        '<strong>長いループを完成させた！</strong><br>' +
        'あとは終止符をうつだけだ';


      door.classList.add(
        'open'
      );

      door.focus();


      clearSound();


      indicatorState =
        'shot';


      updateTrail();

      updateIndicator();

      return true;
    }


    // ========================================================
    // 短いループ
    // ========================================================

    /*
     * 長いループではない。
     *
     * ピリオド可能状態もここで破棄する。
     *
     * PでPOOL / POORを撃った場合もここに入り、
     * 新しいループとして始める。
     */

    loopClosed = false;

    periodAvailable = false;

    restartOnNext = word;

    locked = true;

    mark(e);

    pending = next;


    message.innerHTML =
      '<strong>短いループになってしまった！</strong>';


    door.classList.add(
      'open'
    );

    door.focus();


    unlockSound();


    indicatorState =
      'repeat-shot';


    updateTrail();

    updateIndicator();

    return true;
  }


  // ==========================================================
  // 通常
  // ==========================================================

  used.push(word);

  loopRange = null;

  locked = true;

  mark(e);

  pending = next;


  message.textContent =
    '?∞?を壊した！';

  door.classList.add(
    'open'
  );

  door.focus();


  unlockSound();


  indicatorState =
    getShotIndicatorState();


  if (word === 'mood') {
  moodBroken = true;
  room.style.background = 'linear-gradient(115deg, #fafafa, #e7e7e5)';
  room.style.color = '#151515';
}


  updateTrail();

  updateIndicator();

  return true;
}
// ============================================================
// 長いループ判定
// ============================================================

function checkLongLoop(
  first,
  word
) {

  // 2回目の単語は used に追加しないので、
  // 最後の1個を仮想的に足して判定する
  const segLength =
    used.length - first + 1;


  if (
    segLength !==
    clearRoute.length + 1
  ) {

    return false;
  }


  const k =
    clearRoute.indexOf(word);


  if (k === -1) {
    return false;
  }


  for (
    let i = 0;
    i <= clearRoute.length;
    i++
  ) {

    const expected =
      clearRoute[
        (k + i) %
        clearRoute.length
      ];


    // 最後だけ、実際には used に入っていない
    // 2回目の単語を使う
    const actual =
      i === clearRoute.length
        ? word
        : used[first + i];


    if (
      actual !==
      expected
    ) {

      return false;
    }
  }


  return true;
}

// ============================================================
// 撃った直後のインジケーター状態
// ============================================================

function getShotIndicatorState() {

  return used.length === 1
    ? 'first-shot'
    : 'shot';
}


// ============================================================
// BULLET
// ============================================================

function mark(e) {

  const b =
    document.createElement('i');

  b.className =
    'bullet';


  const r =
    room.getBoundingClientRect();


  b.style.left =
    `${e.clientX - r.left}px`;


  b.style.top =
    `${e.clientY - r.top}px`;


  room.append(b);
}


// ============================================================
// DOOR
// ============================================================

door.addEventListener(
  'click',
  () => {

    // ========================================================
    // D → R
    // ========================================================

    if (
      current === 'D' &&
      doorDestroyed &&
      pending
    ) {

      current = pending;

      pending = null;

      doorDestroyed = false;


      indicatorState =
        'arrived';


      render();

      return;
    }


    // ========================================================
    // 通常移動
    // ========================================================

    if (pending) {

  current = pending;

  // Mを一度離れて、再びMに戻ってきたら
  // 「雰囲気を壊した状態」を解除する
  if (current === 'M' && moodBroken) {
    moodBroken = false;
  }

      // ======================================================
      // 短いループ後
      // ======================================================

      if (restartOnNext) {

        used = [];

        restartOnNext = null;

        loopRange = null;

        loopClosed = false;

        periodAvailable = false;


        indicatorState =
          'arrived-after-repeat';
      }


      // ======================================================
      // 長いループ完成後 → Pへ到着
      // ======================================================

      /*
       * 長いループを完成させた場合、
       * Pへ到着した時点で上の丸表示をリセットする。
       *
       * ただし、
       *
       * periodAvailable
       *
       * は維持する。
       *
       * つまり、
       *
       * 「ループの進捗」はリセット
       * 「終止符を撃てる権利」は維持
       *
       * という状態。
       */
// ======================================================
// 長いループ完成後 → 次の部屋へ到着
// ======================================================

else if (
  longLoopArrivalMessagePending
) {

  /*
   * 長いループ完成後は、
   * どの部屋に到着しても左矢印を表示しない。
   *
   * ループの進捗はリセットする。
   *
   * Pに到着した場合だけ、
   * periodAvailable は true のまま。
   */

  used = [];

  loopRange = null;

  loopClosed = false;

  if (current === 'P') {

    /*
     * Pでも文章は表示しない。
     *
     * 終止符を撃てる状態だけ維持する。
     */
    periodAvailable = true;

  } else {

    /*
     * P以外では、
     * 終止符を撃てる状態ではないので解除。
     */
    periodAvailable = false;
  }

  /*
   * 左矢印を表示しない。
   * 「？」だけ表示する。
   */
  indicatorState =
    'arrived-after-repeat';

  /*
   * 長いループ到着メッセージは
   * もう表示しないので解除。
   */
  longLoopArrivalMessagePending =
    false;
}

      // ======================================================
      // 通常到着
      // ======================================================

      else {

        indicatorState =
          'arrived';
      }


      pending = null;

      render();

      return;
    }


    // ========================================================
    // Dのドアを撃つ
    // ========================================================

    if (
      current === 'D' &&
      !locked
    ) {

      const r =
        door.getBoundingClientRect();


      shoot(
        {
          clientX:
            r.left +
            r.width / 2,

          clientY:
            r.top +
            r.height / 2
        },
        'door',
        'R'
      );
    }
  }
);


// ============================================================
// CLEAR
// ピリオドを撃つ
// ============================================================

function clear(e) {

  /*
   * ピリオドを撃てるのは
   *
   * 「長いループ完成」
   * ↓
   * 「Pへ到着」
   *
   * の状態だけ。
   */

  if (
    locked ||
    !periodAvailable ||
    current !== 'P'
  ) {

    return;
  }


locked = true;

mark(e);


/* 
 * ピリオドを撃ったので、
 * 「再び繰り返す」状態は終了。
 */

restartAfterLongLoop = false;


  /*
   * ピリオドは透明な判定なので
   * 弾痕は表示しない。
   */


  pending = 'C';


  clearSound();


  message.innerHTML =
    '<strong>終止符がうたれた！</strong><br>' +
    '扉の向こうでループが終わる。';


  door.classList.add(
    'open'
  );


  indicatorState =
    'period';


  updateIndicator();
}
// ============================================================
// TRAIL
// ============================================================

function updateTrail() {

  // まだ何も撃っていない場合は、
  // 丸を一つも表示しない
  if (used.length === 0) {

    trail.innerHTML = '';

    return;
  }


  let html = '';


  // ==========================================================
  // 撃った回数だけ丸を作る
  // ==========================================================

  for (
    let i = 0;
    i < used.length;
    i++
  ) {

    let classes =
      'trail-dot trail-dot-filled';


    // ========================================================
    // ループ部分だけ赤くする
    // ========================================================

    const inLoop =
      loopRange &&
      i >= loopRange[0] &&
      i <= loopRange[1];


    if (inLoop) {

      classes =
        'trail-dot trail-dot-loop';
    }


    html += `
      <span
        class="${classes}"
        aria-hidden="true"
      ></span>
    `;
  }


  trail.innerHTML =
    `<span class="trail-dots">${html}</span>`;
}
// ============================================================
// INDICATOR
// ============================================================

function updateIndicator() {

  if (current === 'C') {

    indicator.innerHTML =
      '';

    return;
  }


  if (
    indicatorState === 'none'
  ) {

    indicator.innerHTML =
      '';

    return;
  }


  const q =
    `<img class="hint-image" src="image/Hatena.png" alt="">`;


  const arrow =
    `<img class="arrow-image" src="image/Arrow.png" alt="">`;


  const infinity =
    `<div class="infinity-mark"></div>`;


  // ==========================================================
  // 最初のショット
  // ==========================================================

  if (
    indicatorState ===
    'first-shot'
  ) {

    indicator.innerHTML = `
      <div class="indicator-row">

        <div class="indicator-side left">
          ${q}
        </div>

        ${infinity}

        <div class="indicator-side right">
          ${q}${arrow}
        </div>

      </div>
    `;

    return;
  }


  // ==========================================================
  // 到着
  // ==========================================================

  if (
    indicatorState ===
    'arrived'
  ) {

    indicator.innerHTML = `
      <div class="indicator-row">

        <div class="indicator-side left">
          ${arrow}${q}
        </div>

        <div class="indicator-center"></div>

        <div class="indicator-side right"></div>

      </div>
    `;

    return;
  }


  // ==========================================================
  // ショット
  // ==========================================================

  if (
    indicatorState ===
    'shot'
  ) {

    indicator.innerHTML = `
      <div class="indicator-row">

        <div class="indicator-side left">
          ${arrow}${q}
        </div>

        ${infinity}

        <div class="indicator-side right">
          ${q}${arrow}
        </div>

      </div>
    `;

    return;
  }


  // ==========================================================
  // 短いループ
  // ==========================================================

  if (
    indicatorState ===
    'repeat-shot'
  ) {

    indicator.innerHTML = `
      <div class="indicator-row">

        <div class="indicator-side left">
          ${arrow}${q}
        </div>

        ${infinity}

        <div class="indicator-side right">
          ${q}
        </div>

      </div>
    `;

    return;
  }


  // ==========================================================
  // 短いループ後
  // ==========================================================

  if (
    indicatorState ===
    'arrived-after-repeat'
  ) {

    indicator.innerHTML = `
      <div class="indicator-row">

        <div class="indicator-side left">
          ${q}
        </div>

        <div class="indicator-center"></div>

        <div class="indicator-side right"></div>

      </div>
    `;

    return;
  }


  // ==========================================================
  // PERIOD
  // ==========================================================

  if (indicatorState === 'period') {
  indicator.innerHTML = `
    <div class="indicator-row">
      <div class="indicator-side left"></div>
      <div class="indicator-center">
        <span
          class="period-message"
          style="position:static; left:auto; transform:none; width:auto; text-align:center;"
        >PERIOD</span>
      </div>
      <div class="indicator-side right"></div>
    </div>
  `;
  return;
}
}


// ============================================================
// RESET
// ============================================================

function reset(
  text = ''
) {

  current = 'L';

  used = [];

  loopClosed = false;

  periodAvailable = false;

  restartOnNext = null;

  loopRange = null;

  pending = null;

  locked = false;

  doorDestroyed = false;
moodBroken = false;
  indicatorState = 'none';


  longLoopArrivalMessagePending =
    false;


  restartAfterLongLoop =
    false;


  render();


  if (text) {

    message.textContent =
      text;
  }
}


document
  .querySelector('#reset')
  .addEventListener(
    'click',
    () => {

      reset(
        '最初の部屋に戻った。'
      );
    }
  );


// ============================================================
// AUDIO
// ============================================================

function getAudioContext() {

  if (!audioContext) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();
  }


  if (
    audioContext.state ===
    'suspended'
  ) {

    audioContext.resume();
  }


  return audioContext;
}


// ============================================================
// SHOOT SOUND
// ============================================================

function shootSound() {

  const c =
    getAudioContext();

  const now =
    c.currentTime;


  const buffer =
    c.createBuffer(
      1,
      c.sampleRate * 0.07,
      c.sampleRate
    );


  const data =
    buffer.getChannelData(0);


  for (
    let i = 0;
    i < data.length;
    i++
  ) {

    const decay =
      1 - i / data.length;


    data[i] =
      (Math.random() * 2 - 1) *
      decay *
      decay;
  }


  const noise =
    c.createBufferSource();

  noise.buffer =
    buffer;


  const noiseFilter =
    c.createBiquadFilter();

  noiseFilter.type =
    'highpass';

  noiseFilter.frequency.value =
    900;


  const noiseGain =
    c.createGain();

  noiseGain.gain.setValueAtTime(
    0.0001,
    now
  );

  noiseGain.gain.exponentialRampToValueAtTime(
    0.16,
    now + 0.002
  );

  noiseGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.065
  );


  noise
    .connect(noiseFilter)
    .connect(noiseGain)
    .connect(c.destination);


  noise.start(now);

  noise.stop(
    now + 0.07
  );


  const osc =
    c.createOscillator();

  const oscGain =
    c.createGain();


  osc.type =
    'triangle';


  osc.frequency.setValueAtTime(
    150,
    now
  );


  osc.frequency.exponentialRampToValueAtTime(
    65,
    now + 0.055
  );


  oscGain.gain.setValueAtTime(
    0.0001,
    now
  );


  oscGain.gain.exponentialRampToValueAtTime(
    0.09,
    now + 0.002
  );


  oscGain.gain.exponentialRampToValueAtTime(
    0.0001,
    now + 0.06
  );


  osc
    .connect(oscGain)
    .connect(c.destination);


  osc.start(now);

  osc.stop(
    now + 0.065
  );
}


// ============================================================
// TONE
// ============================================================

function tone(
  freq,
  duration,
  type = 'square'
) {

  const c =
    getAudioContext();


  const o =
    c.createOscillator();


  const g =
    c.createGain();


  o.type =
    type;


  o.frequency.value =
    freq;


  g.gain.setValueAtTime(
    0.045,
    c.currentTime
  );


  g.gain.exponentialRampToValueAtTime(
    0.001,
    c.currentTime + duration
  );


  o
    .connect(g)
    .connect(c.destination);


  o.start();


  o.stop(
    c.currentTime + duration
  );
}


// ============================================================
// UNLOCK SOUND
// ============================================================

function unlockSound() {

  tone(
    430,
    0.08
  );


  setTimeout(
    () => tone(
      650,
      0.1
    ),
    90
  );
}


// ============================================================
// CLEAR SOUND
// ============================================================

function clearSound() {

  tone(
    523,
    0.14,
    'sine'
  );


  setTimeout(
    () => tone(
      659,
      0.16,
      'sine'
    ),
    130
  );


  setTimeout(
    () => tone(
      784,
      0.35,
      'sine'
    ),
    280
  );
}


// ============================================================
// START
// ============================================================

render();
