// PIN-gate: служебный замок для разделов экспозиции, кроме «Персоналий».
// Подключается в /expo/index.html, /parties.html, /states.html, /brand.html.
// Не подключается в /expo/people.html — этот раздел всегда открыт.
//
// API:
//   window.MTK_PIN.require(callback)  — выполнит callback после успешного ввода
//   window.MTK_PIN.guardPage()        — блокирует страницу до ввода (для прямого захода)
//
// PIN хранится в sessionStorage — после полного перезапуска нужен ввод заново.

(function () {
  const PIN = '5553';
  const KEY = 'mtk29:pin-ok';

  function isUnlocked() {
    try { return sessionStorage.getItem(KEY) === PIN; } catch { return false; }
  }
  function setUnlocked() {
    try { sessionStorage.setItem(KEY, PIN); } catch {}
  }

  function showPinModal(opts) {
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => {
        if (opts && opts.blocking && isUnlocked()) return;
        showPinModal(opts);
      }, { once: true });
      return;
    }

    const { onSuccess, onCancel, blocking = false } = opts || {};
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: rgba(0,0,0,0.94);
      backdrop-filter: blur(12px) saturate(0.6);
      -webkit-backdrop-filter: blur(12px) saturate(0.6);
      display: flex; align-items: center; justify-content: center;
      font-family: '20 Kopeek', 'JetBrains Mono', monospace;
      animation: mtkPinFadeIn 200ms ease;
    `;
    const card = document.createElement('div');
    card.style.cssText = `
      width: 360px; max-width: 92vw;
      background: #000; color: #F7F9EF;
      border: 1px solid #D2B773;
      box-shadow: 0 0 0 1px rgba(0,0,0,.6), 0 30px 90px rgba(0,0,0,.85), 0 0 60px rgba(210,183,115,.18);
      padding: 28px 26px 22px;
    `;
    card.innerHTML = `
      <style>
        @keyframes mtkPinFadeIn { from { opacity: 0; } }
        .mtk-pin-key {
          height: 64px; border: 1px solid rgba(210,183,115,0.55);
          background: transparent; color: #F7F9EF;
          font-family: '20 Kopeek', 'JetBrains Mono', monospace;
          font-size: 26px; letter-spacing: 0.05em;
          cursor: pointer; user-select: none;
          transition: background 80ms;
        }
        .mtk-pin-key:active { background: #D2B773; color: #000; }
        .mtk-pin-key.action { font-size: 13px; letter-spacing: 0.2em; }
        .mtk-pin-shake { animation: mtkPinShake 320ms; }
        @keyframes mtkPinShake {
          10%, 90% { transform: translateX(-3px); }
          20%, 80% { transform: translateX(5px); }
          30%, 50%, 70% { transform: translateX(-7px); }
          40%, 60% { transform: translateX(7px); }
        }
      </style>
      <div style="font-size:10px;letter-spacing:0.32em;color:#D2B773;text-transform:uppercase;margin-bottom:14px;">◇ Служебный доступ</div>
      <div style="font-family:'Nolde','Playfair Display',serif;font-style:italic;font-size:22px;line-height:1.15;margin-bottom:6px;color:#F7F9EF;">Введите пин-код</div>
      <div style="font-size:11px;letter-spacing:0.2em;color:rgba(247,249,239,0.5);text-transform:uppercase;margin-bottom:18px;">Раздел временно закрыт</div>
      <div class="mtk-pin-display" style="height:54px;display:flex;align-items:center;justify-content:center;gap:14px;border:1px solid #D2B773;margin-bottom:18px;background:rgba(0,0,0,0.4);"></div>
      <div class="mtk-pin-pad" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;"></div>
      ${ blocking
        ? (opts.escapeHref ? `<a class="mtk-pin-escape" href="${opts.escapeHref}" style="display:block;text-align:center;width:100%;margin-top:14px;height:44px;line-height:44px;background:transparent;color:#D2B773;border:1px solid #D2B773;font-family:inherit;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;cursor:pointer;text-decoration:none;">${opts.escapeLabel || '→ К персоналиям'}</a>` : '')
        : '<button class="mtk-pin-cancel" style="width:100%;margin-top:14px;height:44px;background:transparent;color:rgba(247,249,239,0.6);border:1px solid rgba(247,249,239,0.3);font-family:inherit;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;cursor:pointer;">Отмена</button>'
      }
    `;
    overlay.appendChild(card);
    document.body.appendChild(overlay);

    const display = card.querySelector('.mtk-pin-display');
    const pad = card.querySelector('.mtk-pin-pad');
    let entered = '';
    let done = false;
    function cleanup() {
      document.removeEventListener('keydown', onKey);
      overlay.remove();
    }
    function renderDisplay() {
      display.textContent = '';
      const slots = 4;
      for (let i = 0; i < slots; i++) {
        const dot = document.createElement('span');
        dot.style.cssText = `width:14px;height:14px;border-radius:50%;border:1px solid #D2B773;background:${i < entered.length ? '#D2B773' : 'transparent'};display:inline-block;`;
        display.appendChild(dot);
      }
    }
    renderDisplay();

    const layout = ['1','2','3','4','5','6','7','8','9','clear','0','ok'];
    layout.forEach(k => {
      const b = document.createElement('button');
      b.className = 'mtk-pin-key' + (k === 'clear' || k === 'ok' ? ' action' : '');
      b.textContent = k === 'clear' ? '×' : k === 'ok' ? '↵' : k;
      b.addEventListener('click', () => {
        if (k === 'clear') { entered = ''; renderDisplay(); return; }
        if (k === 'ok') { tryUnlock(); return; }
        if (entered.length >= 4) return;
        entered += k;
        renderDisplay();
        if (entered.length === 4) tryUnlock();
      });
      pad.appendChild(b);
    });
    function tryUnlock() {
      if (done) return;
      if (entered === PIN) {
        done = true;
        setUnlocked();
        cleanup();
        onSuccess && onSuccess();
      } else {
        card.classList.add('mtk-pin-shake');
        setTimeout(() => { card.classList.remove('mtk-pin-shake'); entered = ''; renderDisplay(); }, 380);
      }
    }
    if (!blocking) {
      const cancel = card.querySelector('.mtk-pin-cancel');
      cancel.addEventListener('click', () => { cleanup(); onCancel && onCancel(); });
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) { cleanup(); onCancel && onCancel(); }
      });
    }
    // keyboard support
    function onKey(e) {
      if (/^[0-9]$/.test(e.key) && entered.length < 4) {
        entered += e.key;
        renderDisplay();
        if (entered.length === 4) tryUnlock();
      } else if (e.key === 'Backspace') {
        entered = entered.slice(0, -1);
        renderDisplay();
      } else if (e.key === 'Enter') {
        tryUnlock();
      } else if (e.key === 'Escape' && !blocking) {
        cleanup();
        onCancel && onCancel();
      }
    }
    document.addEventListener('keydown', onKey);
  }

  function require(callback) {
    if (isUnlocked()) { callback(); return; }
    showPinModal({ onSuccess: callback });
  }

  function guardPage(opts) {
    opts = opts || {};
    if (isUnlocked()) return;
    showPinModal({ blocking: true, escapeHref: opts.escapeHref, escapeLabel: opts.escapeLabel });
  }

  window.MTK_PIN = { require, guardPage, isUnlocked };
})();
