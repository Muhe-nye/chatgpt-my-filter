// ==UserScript==
// @name         ChatGPT：个人对话过滤器
// @name:en      ChatGPT: My Conversations Filter (local)
// @namespace    https://your-domain.example/greasyfork
// @version      1.0.0
// @description  在本机把“我的”对话标记并一键只显示；圆形悬浮按钮；点击外部关闭；Toast 不遮挡面板；横向工具条布局
// @description:en Mark and locally filter to show only "my" chats on ChatGPT; floating FAB; click-outside-to-close; non-blocking toasts; wide toolbar UI.
// @author       Muhe-nye
// @license      MIT
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @grant        GM_addStyle
// @run-at       document-idle
// @icon         https://www.greasyfork.org/packs/media/images/blacklogo64-*.png
// @homepage     https://github.com/Muhe-nye/chatgpt-my-filter
// @supportURL   https://github.com/Muhe-nye/chatgpt-my-filter/issues
// @downloadURL https://raw.githubusercontent.com/USER/REPO/BRANCH/ChatGPT-MyFilter.user.js
// @updateURL   https://raw.githubusercontent.com/USER/REPO/BRANCH/ChatGPT-MyFilter.user.js
// ==/UserScript==
(function () {
  const STORAGE_KEY = 'cgpt_my_conversations_v1';
  const FILTER_KEY  = 'cgpt_filter_on_v1';

  const loadSet = () => { try { return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')); } catch { return new Set(); } };
  const saveSet = (set) => localStorage.setItem(STORAGE_KEY, JSON.stringify([...set]));
  const loadFilterOn = () => localStorage.getItem(FILTER_KEY) === '1';
  const saveFilterOn = (on) => localStorage.setItem(FILTER_KEY, on ? '1' : '0');

  const getConvIdFromHref = (href) => {
    if (!href) return null;
    const m = href.match(/\/c\/([0-9a-f-]{36})/i);
    return m ? m[1] : null;
  };
  const getCurrentConvId = () => getConvIdFromHref(location.pathname + location.search);

  // ===== 样式 =====
  GM_addStyle(`
    #cgpt-myfilter-ui{position:fixed; right:16px; bottom:16px; z-index:99999; font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif;}
    /* 圆形悬浮按钮 */
    #cgpt-fab{width:52px; height:52px; border-radius:50%; border:none; background:#111827; color:#fff; box-shadow:0 10px 24px rgba(0,0,0,.18);
      display:flex; align-items:center; justify-content:center; cursor:pointer; transition:transform .15s ease, box-shadow .15s ease;}
    #cgpt-fab:hover{transform:translateY(-2px); box-shadow:0 12px 28px rgba(0,0,0,.22);}
    #cgpt-fab svg{width:24px; height:24px; display:block;}
    /* 面板：放在按钮上方（bottom:60px） */
    #cgpt-myfilter-ui .cgpt-panel{position:absolute; right:0; bottom:60px; background:#fff; border:1px solid #e5e7eb; border-radius:12px;
      box-shadow:0 8px 28px rgba(0,0,0,.12); padding:12px 18px; transform-origin:bottom right;
      transform:scale(.96) translateY(6px); opacity:0; pointer-events:none; transition:all .16s ease; display:flex; align-items:center; gap:14px; flex-wrap:wrap; min-width:280px;}
    #cgpt-myfilter-ui.cgpt-open .cgpt-panel{transform:scale(1) translateY(0); opacity:1; pointer-events:auto;}
    #cgpt-myfilter-ui .cgpt-actions{display:flex; gap:8px; flex-wrap:wrap; align-items:center;}
    #cgpt-myfilter-ui .cgpt-actions-main{flex-wrap:nowrap;}
    #cgpt-myfilter-ui button.cgpt-btn{border:1px solid #e5e7eb; background:#f3f4f6; color:#111827; border-radius:8px; padding:6px 10px; cursor:pointer}
    #cgpt-myfilter-ui button.cgpt-btn:hover{background:#eef2ff}
    #cgpt-myfilter-ui .cgpt-actions-main .cgpt-btn{white-space:normal; max-width:132px; line-height:1.32; overflow:hidden;
      display:flex; align-items:center; justify-content:center; text-align:center; min-height:38px; max-height:calc(1.32em * 2 + 12px);}
    /* “只看我的”彩色状态 */
    #cgpt-myfilter-ui .cgpt-btn.toggle.cgpt-on{background:#2563eb; color:#fff; border-color:#2563eb;}
    #cgpt-myfilter-ui .cgpt-btn.toggle.cgpt-off{background:#f3f4f6; color:#111827; border-color:#e5e7eb;}
    #cgpt-myfilter-ui .cgpt-tip{font-size:12px;color:#6b7280;margin-top:0;text-align:left;white-space:nowrap;}
    .cgpt-mine-pill{display:inline-block;margin-left:6px;padding:0 6px;border-radius:999px;border:1px solid #93c5fd;font-size:11px;line-height:18px}
    /* 过滤规则：开启时隐藏未标记的会话链接 */
    .cgpt-filter-on a[href*="/c/"]:not([data-cgpt-mine="1"]) { display: none !important; }
    /* Toast：默认放在面板正上方（JS 动态更新 bottom 值） */
    #cgpt-toast-wrap{position:fixed; right:16px; z-index:100000; display:flex; flex-direction:column; gap:8px;}
    .cgpt-toast{background:#111827; color:#fff; padding:8px 12px; border-radius:10px; box-shadow:0 10px 24px rgba(0,0,0,.18);
      opacity:0; transform:translateY(8px); animation:cgpt-toast-in .18s ease forwards;}
    .cgpt-toast.ok{background:#065f46}
    .cgpt-toast.warn{background:#92400e}
    @keyframes cgpt-toast-in{to{opacity:1; transform:translateY(0)}}
    @keyframes cgpt-toast-out{to{opacity:0; transform:translateY(6px)}}
  `);

  // ===== UI =====
  const ui = document.createElement('div');
  ui.id = 'cgpt-myfilter-ui';
  ui.innerHTML = `
    <button id="cgpt-fab" aria-label="我的对话控制">
      <!-- 双用户叠放图标（SVG） -->
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3.5" fill="currentColor" opacity="0.95"></circle>
        <path d="M14.5 17c0-2.485-2.686-4.5-6-4.5s-6 2.015-6 4.5" fill="currentColor" opacity="0.95"></path>
        <circle cx="16" cy="9" r="3" fill="currentColor" opacity="0.6"></circle>
        <path d="M23 18.2c0-2.1-2.1-3.8-4.7-3.8s-4.7 1.7-4.7 3.8" fill="currentColor" opacity="0.6"></path>
      </svg>
    </button>
    <div class="cgpt-panel">
      <div class="cgpt-actions cgpt-actions-main">
        <button id="cgpt-mark"   class="cgpt-btn">标记为我的</button>
        <button id="cgpt-unmark" class="cgpt-btn">取消标记</button>
      </div>
      <div class="cgpt-actions">
        <button id="cgpt-toggle" class="cgpt-btn toggle"></button>
      </div>
      <div class="cgpt-tip">仅本机可见 · 不影响他人</div>
    </div>
  `;
  document.documentElement.appendChild(ui);

  // Toast 容器（位置由 JS 动态设置，以确保在面板上方）
  const toastWrap = document.createElement('div');
  toastWrap.id = 'cgpt-toast-wrap';
  document.documentElement.appendChild(toastWrap);

  // ===== 状态 =====
  const mySet = loadSet();
  let filterOn = loadFilterOn();

  const root  = document.getElementById('cgpt-myfilter-ui');
  const fab   = document.getElementById('cgpt-fab');
  const panel = root.querySelector('.cgpt-panel');
  const toggleBtn = document.getElementById('cgpt-toggle');

  // 动态计算 Toast 的 bottom 位置：在面板上方 8px；若面板关闭则在按钮上方 12px
  function computeToastBottomPx(){
    const base = 16;           // root 距离视口底部
    const fabH = 52;           // 按钮高度
    if (root.classList.contains('cgpt-open')) {
      const panelBottom = 60;  // 面板距离 root 底部
      const panelH = panel.offsetHeight || 140;
      return base + panelBottom + panelH + 8;  // 面板上方 8px
    } else {
      return base + fabH + 12; // 按钮上方 12px
    }
  }
  function updateToastPosition(){
    toastWrap.style.bottom = computeToastBottomPx() + 'px';
    toastWrap.style.right  = '16px';
  }
  updateToastPosition();

  function showToast(msg, type='ok', ms=1600){
    updateToastPosition();
    const t = document.createElement('div');
    t.className = `cgpt-toast ${type}`;
    t.textContent = msg;
    toastWrap.appendChild(t);
    setTimeout(()=>{ t.style.animation = 'cgpt-toast-out .22s ease forwards'; }, Math.max(600, ms-220));
    setTimeout(()=>{ t.remove(); }, ms);
  }

  // “只看我的”按钮文字与颜色
  function refreshToggleBtn(silent=false) {
    toggleBtn.textContent = `只看我的`;
    toggleBtn.classList.toggle('cgpt-on',  filterOn);
    toggleBtn.classList.toggle('cgpt-off', !filterOn);
    document.documentElement.classList.toggle('cgpt-filter-on', filterOn);
    if (!silent) showToast(`只看我的：${filterOn ? '已开启' : '已关闭'}`, 'ok');
  }
  refreshToggleBtn(true);

  // 打开/关闭面板
  function openPanel(){ root.classList.add('cgpt-open');  updateToastPosition(); }
  function closePanel(){ root.classList.remove('cgpt-open'); updateToastPosition(); }
  fab.addEventListener('click', (e)=>{ e.stopPropagation(); root.classList.toggle('cgpt-open'); updateToastPosition(); });

  // 点击外部关闭
  document.addEventListener('click', (e)=>{
    if (!root.classList.contains('cgpt-open')) return;
    const inside = root.contains(e.target);
    if (!inside) closePanel();
  }, true);
  panel.addEventListener('click', (e)=> e.stopPropagation());
  window.addEventListener('resize', updateToastPosition);

  // 侧栏打标 & “我的”小标签
  function paintSidebar(force = false) {
    if (!force) { clearTimeout(paintSidebar._t); paintSidebar._t = setTimeout(()=>paintSidebar(true), 120); return; }
    const links = document.querySelectorAll('a[href*="/c/"]');
    links.forEach(a => {
      const id = getConvIdFromHref(a.getAttribute('href'));
      if (!id) return;
      const isMine = mySet.has(id);
      if (isMine) a.setAttribute('data-cgpt-mine', '1');
      else a.removeAttribute('data-cgpt-mine');

      const titleNode = a.querySelector('div, span, p');
      if (titleNode) {
        let pill = a.querySelector('.cgpt-mine-pill');
        if (isMine && !pill) {
          pill = document.createElement('span');
          pill.className = 'cgpt-mine-pill';
          pill.textContent = '我的';
          titleNode.appendChild(pill);
        } else if (!isMine && pill) {
          pill.remove();
        }
      }
    });
  }

  function markCurrent() {
    const id = getCurrentConvId();
    if (!id) { showToast('未检测到当前对话 ID', 'warn'); return; }
    mySet.add(id); saveSet(mySet); paintSidebar(true);
    showToast('已标记为“我的”', 'ok');
  }
  function unmarkCurrent() {
    const id = getCurrentConvId();
    if (!id) { showToast('未检测到当前对话 ID', 'warn'); return; }
    mySet.delete(id); saveSet(mySet); paintSidebar(true);
    showToast('已取消标记', 'ok');
  }

  // 事件
  document.getElementById('cgpt-mark').onclick   = ()=>{ markCurrent(); };
  document.getElementById('cgpt-unmark').onclick = ()=>{ unmarkCurrent(); };
  toggleBtn.onclick = ()=>{
    filterOn = !filterOn; saveFilterOn(filterOn); refreshToggleBtn(); paintSidebar(true);
  };

  // 监听 DOM 变化，侧栏渲染后自动打标
  const obs = new MutationObserver(() => paintSidebar());
  obs.observe(document.documentElement, { subtree: true, childList: true });

  // 首次渲染
  paintSidebar(true);

  // 可选：Esc 关闭面板
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closePanel(); });
})();
