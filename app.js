// 律師 AI 助手 — MCP 法律工具箱
// 純靜態 PWA。所有內容寫在 JS 物件，方便日後直接編輯。

// ===== rendering =====
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
}

// 用瀏覽器內建 Text Fragment 跳到並高亮關鍵字（Chrome/Safari/Edge 支援）
// https://developer.mozilla.org/en-US/docs/Web/Text_fragments
function appendTextFragment(url, keyword) {
  if (!keyword) return url;
  const sep = url.includes("#") ? "" : "#";
  const fragment = `${sep}:~:text=${encodeURIComponent(String(keyword).split(/\s+/)[0])}`;
  return url + fragment;
}

// ===== Search panels — 直接呼叫公開資料源 =====
// ===== 主分頁設定（仿 morning_board）=====
const MAIN_TABS = [
  {
    id: "query",
    label: "法律查詢",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>`
  },
  {
    id: "calc",
    label: "計算試算",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 11h6M9 15h2M13 15h2M9 19h6"/></svg>`
  },
  {
    id: "tools",
    label: "常用工具",
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4l-5.6 5.6a2 2 0 0 0 2.8 2.8l5.6-5.6a4 4 0 0 0 5.4-5.4l-2.7 2.7-2.4-2.4 2.3-3.1z"/></svg>`
  }
];

const SEARCH_PANELS = [
  {
    id: "law",
    group: "query",
    title: "法規條文",
    icon: "📖",
    desc: "搜尋全國法規資料庫（11,700+ 部法規）。結果在新分頁開啟，會自動高亮關鍵字。",
    fields: [
      { id: "law-kw", label: "法規或關鍵字", placeholder: "例：民法、勞動基準法、消費者保護" }
    ],
    btnLabel: "查全國法規資料庫",
    handler: ({ "law-kw": kw }) => {
      if (!kw) return null;
      const url = `https://law.moj.gov.tw/Law/LawSearchResult.aspx?ty=ONEBAR&kw=${encodeURIComponent(kw)}&sSearch=`;
      return appendTextFragment(url, kw);
    }
  },
  {
    id: "judgment",
    title: "裁判書搜尋",
    icon: "⚖",
    desc: "司法院裁判書全文檢索。可同時指定法院別與案類，LawSnote 結果會自動標示關鍵字。",
    fields: [
      {
        id: "jud-court", label: "法院別（可選）", type: "select",
        options: [
          { value: "", label: "全部法院" },
          { value: "最高法院", label: "最高法院" },
          { value: "最高行政法院", label: "最高行政法院" },
          { value: "高等法院", label: "高等法院" },
          { value: "高等行政法院", label: "高等行政法院" },
          { value: "地方法院", label: "地方法院" },
          { value: "智慧財產及商業法院", label: "智財及商業法院" },
          { value: "懲戒法院", label: "懲戒法院" }
        ]
      },
      {
        id: "jud-type", label: "案類（可選）", type: "select",
        options: [
          { value: "", label: "全部案類" },
          { value: "民事", label: "民事" },
          { value: "刑事", label: "刑事" },
          { value: "行政", label: "行政" },
          { value: "家事", label: "家事" }
        ]
      },
      { id: "jud-kw", label: "關鍵字 / 法條 / 案由", placeholder: "例：預售屋 遲延交屋、刑法277、110台上1234" }
    ],
    btnLabel: "查 LawSnote（含關鍵字標示）",
    altBtn: {
      label: "改用司法院官方系統",
      url: ({ "jud-kw": kw, "jud-court": court, "jud-type": type }) => {
        const combined = [court, type, kw].filter(Boolean).join(" ");
        if (!combined) return null;
        return `https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?ty=JUDBOOK&kw=${encodeURIComponent(combined)}`;
      }
    },
    handler: ({ "jud-kw": kw, "jud-court": court, "jud-type": type }) => {
      const combined = [court, type, kw].filter(Boolean).join(" ");
      if (!combined) return null;
      return `https://www.lawsnote.com/search?q=${encodeURIComponent(combined)}`;
    }
  },
  {
    id: "interp",
    title: "釋字／憲判字",
    icon: "🏛",
    desc: "憲法法庭 868 筆大法官解釋與憲判字。可填字號或關鍵字。",
    fields: [
      { id: "int-kw", label: "釋字號或關鍵字", placeholder: "例：748、婚姻平權、集會自由" }
    ],
    btnLabel: "查憲法法庭",
    handler: ({ "int-kw": kw }) => {
      if (!kw) return null;
      const url = `https://cons.judicial.gov.tw/Search.aspx?fid=2126&cx=005132724086774517517:yimqgql50oj&q=${encodeURIComponent(kw)}`;
      return appendTextFragment(url, kw);
    }
  },
  {
    id: "company",
    title: "公司登記查詢（即時 API）",
    icon: "🏢",
    desc: "直接從 g0v 公司資料庫拉取登記資料，輸入公司名或統一編號，本頁立即顯示董事、營業項目、地址。",
    inline: "company"
  },
  {
    id: "treaty",
    title: "國際公約",
    icon: "🌐",
    desc: "28 部國際公約 1,914 條中英雙語對照（人權、海洋法、外交、條約法、國際刑法、難民法）。",
    fields: [
      { id: "tr-kw", label: "公約名稱或代碼", placeholder: "例：iccpr、unclos、cedaw" }
    ],
    btnLabel: "在 open-treaties 站開啟",
    handler: ({ "tr-kw": kw }) => {
      const trimmed = (kw || "").trim().toLowerCase();
      if (!trimmed) return "https://lawchat-oss.github.io/open-treaties/";
      return `https://lawchat-oss.github.io/open-treaties/treaties/${encodeURIComponent(trimmed)}.html`;
    }
  },
  {
    id: "holiday",
    title: "國定假日（即時 API）",
    icon: "📅",
    desc: "本頁直接從 TaiwanCalendar 取資料，輸入年份即時顯示連假與補班日。",
    inline: "holiday"
  },
  {
    id: "deadline",
    title: "法定期間計算機",
    icon: "⏱",
    desc: "輸入起算日與期間（上訴 20 日、抗告 10 日…），自動依民訴法 §161 扣除週末與國定假日，算出最後一日。",
    inline: "deadline"
  },
  {
    id: "interest",
    title: "利息／訴訟費試算",
    icon: "💰",
    desc: "民法 §203 法定遲延利息（年息 5%）、民訴法 §77-13 訴訟費用、提存利息等常用公式即時試算。",
    inline: "interest"
  },
  {
    id: "common-laws",
    title: "常用法規快速跳轉",
    icon: "📚",
    desc: "點一下直接開法規全文，免再輸關鍵字。律師日常 25 部高頻法規。",
    inline: "commonLaws"
  }
];

// panel id → tab group 對應表（在 SEARCH_PANELS 後集中設定，避免散落各處）
const PANEL_GROUPS = {
  law: "query",
  judgment: "query",
  interp: "query",
  company: "query",
  treaty: "query",
  deadline: "calc",
  interest: "calc",
  "common-laws": "tools",
  holiday: "tools"
};
SEARCH_PANELS.forEach(p => { p.group = PANEL_GROUPS[p.id] || "query"; });

// 多個 inline 面板的 dispatcher：每種 inline 各自一個 renderer
const INLINE_RENDERERS = {
  holiday: renderInlineHoliday,
  company: renderInlineCompany,
  deadline: renderInlineDeadline,
  interest: renderInlineInterest,
  commonLaws: renderInlineCommonLaws
};

const GROUP_INTRO = {
  query: { title: "法律查詢 · 直連台灣公開資料源", lead: "輸入關鍵字，跳到官方系統結果頁並自動標示。公司登記為即時 API。" },
  calc: { title: "計算試算工具", lead: "依民法 §120-122、民訴法 §161 / §77-13 公式即時試算，可作律師備忘參考。" },
  tools: { title: "常用工具", lead: "高頻法規一鍵跳轉，國定假日即時查。" }
};

function renderGroup(groupId) {
  const intro = GROUP_INTRO[groupId] || { title: "", lead: "" };
  const panels = SEARCH_PANELS.filter(p => p.group === groupId);
  return `
    <h2 class="section-title">${escapeHtml(intro.title)}</h2>
    <p class="section-lead">${escapeHtml(intro.lead)}</p>

    <div class="search-grid">
      ${panels.map(p => p.inline ? (INLINE_RENDERERS[p.inline]?.() ?? "") : renderSearchPanel(p)).join("")}
    </div>
  `;
}

function renderSearchPanel(p) {
  return `
    <div class="search-card" data-panel="${escapeHtml(p.id)}">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <form class="search-form" data-panel-id="${escapeHtml(p.id)}">
        ${p.fields.map(f => renderField(f)).join("")}
        <div class="search-actions">
          <button type="submit" class="search-btn primary">${escapeHtml(p.btnLabel)}</button>
          ${p.altBtn ? `<button type="button" class="search-btn secondary" data-alt-id="${escapeHtml(p.id)}">${escapeHtml(p.altBtn.label)}</button>` : ""}
        </div>
      </form>
    </div>
  `;
}

function renderField(f) {
  if (f.type === "select") {
    return `
      <label class="search-label">
        <span>${escapeHtml(f.label)}</span>
        <select id="${escapeHtml(f.id)}" name="${escapeHtml(f.id)}">
          ${f.options.map(o => `<option value="${escapeHtml(o.value)}">${escapeHtml(o.label)}</option>`).join("")}
        </select>
      </label>
    `;
  }
  return `
    <label class="search-label">
      <span>${escapeHtml(f.label)}</span>
      <input type="text" id="${escapeHtml(f.id)}" name="${escapeHtml(f.id)}" placeholder="${escapeHtml(f.placeholder || "")}" autocomplete="off">
    </label>
  `;
}

function renderInlineHoliday() {
  const thisYear = new Date().getFullYear();
  const p = SEARCH_PANELS.find(x => x.id === "holiday");
  return `
    <div class="search-card" data-panel="holiday">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <form class="search-form" id="holiday-form">
        <label class="search-label">
          <span>年份</span>
          <input type="number" id="holiday-year" name="year" value="${thisYear}" min="2017" max="2030">
        </label>
        <div class="search-actions">
          <button type="submit" class="search-btn primary">即時查詢</button>
        </div>
      </form>
      <div id="holiday-result" class="inline-result"></div>
    </div>
  `;
}

function renderInlineCompany() {
  const p = SEARCH_PANELS.find(x => x.id === "company");
  return `
    <div class="search-card" data-panel="company">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <form class="search-form" id="company-form">
        <label class="search-label">
          <span>公司名稱或統一編號</span>
          <input type="text" id="company-kw" name="kw" placeholder="例：聯發科、台灣積體電路、22099131" autocomplete="off">
        </label>
        <div class="search-actions">
          <button type="submit" class="search-btn primary">即時查詢</button>
          <button type="button" class="search-btn secondary" id="company-alt-btn">經濟部商業司官方</button>
        </div>
      </form>
      <div id="company-result" class="inline-result"></div>
    </div>
  `;
}

// 常用律師期間預設值（民訴／刑訴／行政訴訟混合，依案件類型律師再判斷）
const DEADLINE_PRESETS = [
  { label: "上訴 20 日（民訴）", days: 20 },
  { label: "抗告 10 日", days: 10 },
  { label: "再審 30 日", days: 30 },
  { label: "聲明異議 10 日", days: 10 },
  { label: "刑事上訴 20 日", days: 20 },
  { label: "行政訴訟 2 個月", days: 60 },
  { label: "支付命令異議 20 日", days: 20 },
  { label: "強制執行抗告 10 日", days: 10 }
];

function renderInlineDeadline() {
  const p = SEARCH_PANELS.find(x => x.id === "deadline");
  const today = new Date().toISOString().slice(0, 10);
  return `
    <div class="search-card" data-panel="deadline">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <form class="search-form" id="deadline-form">
        <label class="search-label">
          <span>起算日（不計入當日）</span>
          <input type="date" id="deadline-start" value="${today}">
        </label>
        <label class="search-label">
          <span>期間（日）</span>
          <input type="number" id="deadline-days" value="20" min="1" max="365">
        </label>
        <div class="deadline-presets">
          ${DEADLINE_PRESETS.map(p => `<button type="button" class="chip" data-deadline-days="${p.days}">${escapeHtml(p.label)}</button>`).join("")}
        </div>
        <div class="search-actions">
          <button type="submit" class="search-btn primary">計算</button>
        </div>
      </form>
      <div id="deadline-result" class="inline-result"></div>
    </div>
  `;
}

function renderInlineInterest() {
  const p = SEARCH_PANELS.find(x => x.id === "interest");
  const today = new Date().toISOString().slice(0, 10);
  const sixMonthsAgo = new Date(Date.now() - 180 * 86400000).toISOString().slice(0, 10);
  return `
    <div class="search-card" data-panel="interest">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>

      <div class="calc-tabs">
        <button type="button" class="calc-tab active" data-calc="interest">遲延利息</button>
        <button type="button" class="calc-tab" data-calc="court-fee">訴訟費用</button>
      </div>

      <form class="search-form calc-form" id="interest-form" data-calc="interest">
        <label class="search-label">
          <span>本金（元）</span>
          <input type="number" id="int-principal" value="1000000" min="1" step="1">
        </label>
        <label class="search-label">
          <span>年利率（%）</span>
          <input type="number" id="int-rate" value="5" min="0" max="50" step="0.1">
          <small class="hint">法定 5%（民法 §203），約定不得逾 16%（民法 §205）</small>
        </label>
        <label class="search-label">
          <span>起息日（含當日）</span>
          <input type="date" id="int-from" value="${sixMonthsAgo}">
        </label>
        <label class="search-label">
          <span>截止日（含當日）</span>
          <input type="date" id="int-to" value="${today}">
        </label>
        <div class="search-actions">
          <button type="submit" class="search-btn primary">計算遲延利息</button>
        </div>
      </form>

      <form class="search-form calc-form" id="court-fee-form" data-calc="court-fee" style="display:none">
        <label class="search-label">
          <span>訴訟標的金額（元）</span>
          <input type="number" id="cf-amount" value="1000000" min="1" step="1">
          <small class="hint">第一審依民訴法 §77-13 累進計算</small>
        </label>
        <div class="search-actions">
          <button type="submit" class="search-btn primary">計算第一審裁判費</button>
        </div>
      </form>

      <div id="interest-result" class="inline-result"></div>
    </div>
  `;
}

// 律師日常高頻 25 部法規（含法務部 pcode）
const COMMON_LAWS = [
  { name: "民法", code: "B0000001" },
  { name: "民事訴訟法", code: "B0010001" },
  { name: "刑法", code: "C0000001" },
  { name: "刑事訴訟法", code: "C0010001" },
  { name: "行政程序法", code: "A0030055" },
  { name: "行政訴訟法", code: "A0030154" },
  { name: "行政罰法", code: "A0030058" },
  { name: "公司法", code: "J0080001" },
  { name: "公平交易法", code: "J0150002" },
  { name: "消費者保護法", code: "J0170001" },
  { name: "勞動基準法", code: "N0030001" },
  { name: "勞工退休金條例", code: "N0030027" },
  { name: "性別工作平等法", code: "N0030014" },
  { name: "個人資料保護法", code: "I0050021" },
  { name: "著作權法", code: "J0070017" },
  { name: "商標法", code: "J0070001" },
  { name: "專利法", code: "J0070007" },
  { name: "土地法", code: "D0060001" },
  { name: "土地登記規則", code: "D0060037" },
  { name: "強制執行法", code: "B0010013" },
  { name: "破產法", code: "B0010030" },
  { name: "公司重整", code: "J0080014" },
  { name: "稅捐稽徵法", code: "G0340001" },
  { name: "所得稅法", code: "G0340003" },
  { name: "遺產及贈與稅法", code: "G0340072" }
];

function renderInlineCommonLaws() {
  const p = SEARCH_PANELS.find(x => x.id === "common-laws");
  return `
    <div class="search-card" data-panel="common-laws">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <div class="laws-chips">
        ${COMMON_LAWS.map(l => `<a class="chip law-chip" href="https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=${l.code}" target="_blank" rel="noopener">${escapeHtml(l.name)}</a>`).join("")}
      </div>
      <p class="data-credit">資料來源：法務部全國法規資料庫；連結直接開啟法規全文頁</p>
    </div>
  `;
}

function renderMainNav(activeId) {
  return MAIN_TABS.map(t => `
    <button class="main-tab${t.id === activeId ? " active" : ""}" data-tab="${escapeHtml(t.id)}">
      <span class="tab-icon" aria-hidden="true">${t.icon}</span>
      <span>${escapeHtml(t.label)}</span>
    </button>
  `).join("");
}

function switchTab(name) {
  const isValid = MAIN_TABS.some(t => t.id === name);
  const tabId = isValid ? name : MAIN_TABS[0].id;
  const navEl = document.getElementById("main-nav");
  if (navEl) navEl.innerHTML = renderMainNav(tabId);
  const contentEl = document.getElementById("content");
  if (contentEl) contentEl.innerHTML = renderGroup(tabId);
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", "#" + tabId);
}

// ===== copy buttons =====
document.addEventListener("click", e => {
  const btn = e.target.closest(".copy-btn");
  if (!btn) return;
  const text = btn.dataset.copy;
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    const original = btn.textContent;
    btn.textContent = "已複製";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove("copied");
    }, 1600);
  });
});

// ===== nav =====
document.addEventListener("click", e => {
  const tab = e.target.closest(".main-tab");
  if (!tab) return;
  switchTab(tab.dataset.tab);
});

// ===== search forms =====
document.addEventListener("submit", e => {
  const form = e.target.closest(".search-form");
  if (!form) return;
  e.preventDefault();
  const panelId = form.dataset.panelId;

  if (form.id === "holiday-form") {
    runHolidayLookup();
    return;
  }
  if (form.id === "company-form") {
    runCompanyLookup();
    return;
  }
  if (form.id === "deadline-form") {
    runDeadlineCalc();
    return;
  }
  if (form.id === "interest-form") {
    runInterestCalc();
    return;
  }
  if (form.id === "court-fee-form") {
    runCourtFeeCalc();
    return;
  }

  const panel = SEARCH_PANELS.find(p => p.id === panelId);
  if (!panel) return;
  const data = {};
  panel.fields.forEach(f => { data[f.id] = (form.elements[f.id]?.value || "").trim(); });
  const url = panel.handler(data);
  if (url) window.open(url, "_blank", "noopener");
});

document.addEventListener("click", e => {
  const altBtn = e.target.closest("[data-alt-id]");
  if (!altBtn) return;
  const panelId = altBtn.dataset.altId;
  const panel = SEARCH_PANELS.find(p => p.id === panelId);
  if (!panel?.altBtn) return;
  const form = altBtn.closest(".search-form");
  const data = {};
  panel.fields.forEach(f => { data[f.id] = (form.elements[f.id]?.value || "").trim(); });
  const url = panel.altBtn.url(data);
  if (url) window.open(url, "_blank", "noopener");
});

document.addEventListener("click", e => {
  if (!e.target.closest("#company-alt-btn")) return;
  const v = (document.getElementById("company-kw")?.value || "").trim();
  if (!v) return;
  const url = /^\d{8}$/.test(v)
    ? `https://findbiz.nat.gov.tw/fts/query/QueryCmpyDetail/queryCmpyDetail.do?banNo=${v}`
    : `https://findbiz.nat.gov.tw/fts/query/QueryList/queryList.do?searchTerm=${encodeURIComponent(v)}`;
  window.open(url, "_blank", "noopener");
});

// ===== holiday inline lookup =====
async function runHolidayLookup() {
  const year = parseInt(document.getElementById("holiday-year")?.value, 10);
  const out = document.getElementById("holiday-result");
  if (!out) return;
  if (!year || year < 2017 || year > 2030) {
    out.innerHTML = `<p class="error">請輸入 2017–2030 之間的西元年份</p>`;
    return;
  }
  out.innerHTML = `<p class="loading">查詢 ${year} 年中…</p>`;
  try {
    const res = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${year}.json`);
    if (!res.ok) throw new Error("資料來源回傳 " + res.status);
    const days = await res.json();
    // 國定假日 = isHoliday && description 非空（週末本身 description 為空）
    const namedHolidays = days.filter(d => d.isHoliday && d.description);
    // 補班 = 該日為週六/週日但 isHoliday=false（即原本應休卻被改為上班）
    const makeUp = days.filter(d => !d.isHoliday && (d.week === "六" || d.week === "日"));
    // 連假 = 所有 isHoliday 連續日，三天以上
    const allOff = days.filter(d => d.isHoliday);
    const grouped = groupConsecutive(allOff).filter(g => g.length >= 3);
    out.innerHTML = `
      <div class="holiday-summary">
        <div><span class="num">${namedHolidays.length}</span><span class="lbl">國定假日</span></div>
        <div><span class="num">${makeUp.length}</span><span class="lbl">補班日</span></div>
        <div><span class="num">${grouped.length}</span><span class="lbl">三天以上連假</span></div>
      </div>
      ${grouped.length ? `
        <h5 class="holiday-h5">三天以上連假</h5>
        <ul class="holiday-list">
          ${grouped.map(g => {
            const names = g.filter(d => d.description).map(d => d.description);
            const label = names.length ? Array.from(new Set(names)).join("／") : "週末";
            return `
              <li>
                <span class="hday">${formatDateRange(g)}</span>
                <span class="hname">${escapeHtml(label)}</span>
              </li>`;
          }).join("")}
        </ul>
      ` : ""}
      <h5 class="holiday-h5">${year} 年國定假日列表</h5>
      <ul class="holiday-list">
        ${namedHolidays.map(d => `
          <li>
            <span class="hday">${formatDateStr(d.date)}（${weekDay(d.week)}）</span>
            <span class="hname">${escapeHtml(d.description)}</span>
          </li>
        `).join("")}
      </ul>
      ${makeUp.length ? `
        <h5 class="holiday-h5">補班日（原假日改上班）</h5>
        <ul class="holiday-list">
          ${makeUp.map(d => `
            <li>
              <span class="hday">${formatDateStr(d.date)}（${weekDay(d.week)}）</span>
              <span class="hname makeup">補班</span>
            </li>
          `).join("")}
        </ul>
      ` : ""}
      <p class="data-credit">資料來源：<a href="https://github.com/ruyut/TaiwanCalendar" target="_blank" rel="noopener">TaiwanCalendar</a>（行政院人事行政總處公告）</p>
    `;
  } catch (err) {
    out.innerHTML = `<p class="error">查詢失敗：${escapeHtml(String(err.message || err))}</p>`;
  }
}

// ===== company inline lookup =====
async function runCompanyLookup() {
  const kw = (document.getElementById("company-kw")?.value || "").trim();
  const out = document.getElementById("company-result");
  if (!out) return;
  if (!kw) {
    out.innerHTML = `<p class="error">請輸入公司名稱或 8 碼統一編號</p>`;
    return;
  }
  out.innerHTML = `<p class="loading">查詢中…（資料來自 g0v 公司資料庫）</p>`;
  try {
    const isId = /^\d{8}$/.test(kw);
    const apiUrl = isId
      ? `https://company.g0v.ronny.tw/api/show/${kw}`
      : `https://company.g0v.ronny.tw/api/search?q=${encodeURIComponent(kw)}&page=1`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error("資料源回傳 " + res.status);
    const r = await res.json();

    if (isId) {
      const d = r.data;
      if (!d || !d["公司名稱"]) {
        out.innerHTML = `<p class="error">查無此統一編號 ${escapeHtml(kw)}</p>`;
        return;
      }
      out.innerHTML = renderCompanyCard(d, kw);
    } else {
      const list = Array.isArray(r.data) ? r.data : [];
      if (list.length === 0) {
        out.innerHTML = `<p class="error">查無 「${escapeHtml(kw)}」 的公司</p>`;
        return;
      }
      if (list.length === 1) {
        out.innerHTML = renderCompanyCard(list[0], list[0]["統一編號"] || "");
      } else {
        out.innerHTML = renderCompanyList(list, kw, r.found);
      }
    }
  } catch (err) {
    out.innerHTML = `<p class="error">查詢失敗：${escapeHtml(String(err.message || err))}</p>`;
  }
}

function normCompany(c) {
  // 公司 (公司名稱) 與 商業 (商業名稱) 兩類資料結構不同，這裡合併欄位
  return {
    name: c["公司名稱"] || c["商業名稱"] || "—",
    representative: c["代表人姓名"] || c["負責人姓名"] || "",
    address: c["公司所在地"] || c["地址"] || "",
    capital: c["實收資本額(元)"] || c["資本額(元)"] || "",
    capitalTotal: c["資本總額(元)"] || "",
    shares: c["已發行股份總數(股)"] || "",
    status: (c["登記現況"] || c["現況"] || "").trim(),
    founded: fmtTwDate(c["核准設立日期"]),
    lastChange: fmtTwDate(c["最後核准變更日期"] || c["最近異動日期"]),
    authority: c["登記機關"] || "",
    orgType: c["組織類型"] || "",
    enName: c["章程所訂外文公司名稱"] || "",
    isShop: !!c["商業名稱"] && !c["公司名稱"]
  };
}

function renderCompanyList(list, kw, total) {
  return `
    <p class="company-list-hint">找到 ${escapeHtml(String(total || list.length))} 筆，顯示前 ${list.length} 筆，點名稱看詳情：</p>
    <ul class="company-list">
      ${list.slice(0, 10).map(c => {
        const n = normCompany(c);
        const tag = n.isShop ? "（商業）" : "";
        return `
        <li>
          <button type="button" class="company-pick" data-id="${escapeHtml(c["統一編號"] || "")}">${escapeHtml(n.name)}${tag ? ` <span class="company-tag">${tag}</span>` : ""}</button>
          <span class="company-meta">${escapeHtml(c["統一編號"] || "")}${n.status ? " · " + escapeHtml(n.status) : ""}${n.address ? " · " + escapeHtml(n.address) : ""}</span>
        </li>`;
      }).join("")}
    </ul>
  `;
}

function renderCompanyCard(d, id) {
  const n = normCompany(d);
  const items = Array.isArray(d["所營事業資料"]) ? d["所營事業資料"] : [];
  const dirs = Array.isArray(d["董監事名單"]) ? d["董監事名單"] : [];
  const mgrs = Array.isArray(d["經理人名單"]) ? d["經理人名單"] : [];
  // 商業類「營業項目」是大字串，要解析
  const shopItems = (!items.length && typeof d["營業項目"] === "string")
    ? parseShopBusinessItems(d["營業項目"]) : [];
  const statusClass = /設立|核准/.test(n.status) ? "ok"
    : /撤銷|解散|廢止|停業|歇業/.test(n.status) ? "bad" : "";

  return `
    <div class="company-card">
      <div class="company-head">
        <h4 class="company-name">${escapeHtml(n.name)}${n.isShop ? ' <span class="company-tag">商業</span>' : ""}</h4>
        ${n.status ? `<span class="company-status ${statusClass}">${escapeHtml(n.status)}</span>` : ""}
      </div>
      ${n.enName ? `<p class="company-en">${escapeHtml(n.enName)}</p>` : ""}

      <dl class="company-facts">
        ${id ? `<dt>統一編號</dt><dd>${escapeHtml(id)}</dd>` : ""}
        ${n.orgType ? `<dt>組織類型</dt><dd>${escapeHtml(n.orgType)}</dd>` : ""}
        ${n.representative ? `<dt>${n.isShop ? "負責人" : "代表人"}</dt><dd>${escapeHtml(n.representative)}</dd>` : ""}
        ${n.address ? `<dt>地址</dt><dd>${escapeHtml(n.address)}</dd>` : ""}
        ${n.capital ? `<dt>${n.isShop ? "資本額" : "實收資本"}</dt><dd>NT$ ${escapeHtml(n.capital)}</dd>` : ""}
        ${n.capitalTotal ? `<dt>資本總額</dt><dd>NT$ ${escapeHtml(n.capitalTotal)}</dd>` : ""}
        ${n.shares ? `<dt>已發行股數</dt><dd>${escapeHtml(n.shares)} 股</dd>` : ""}
        ${n.founded ? `<dt>核准設立</dt><dd>${escapeHtml(n.founded)}</dd>` : ""}
        ${n.lastChange ? `<dt>${n.isShop ? "最近異動" : "最後變更"}</dt><dd>${escapeHtml(n.lastChange)}</dd>` : ""}
        ${n.authority ? `<dt>登記機關</dt><dd>${escapeHtml(n.authority)}</dd>` : ""}
      </dl>

      ${dirs.length ? `
        <details class="company-section" open>
          <summary>董監事名單（${dirs.length} 人）</summary>
          <ul class="company-people">
            ${dirs.slice(0, 20).map(p => `
              <li>
                <span class="role">${escapeHtml(p["職稱"] || "")}</span>
                <span class="name">${escapeHtml(p["姓名"] || "")}</span>
                ${p["所代表法人"] ? `<span class="rep">代表 ${escapeHtml(p["所代表法人"])}</span>` : ""}
                ${p["出資額"] ? `<span class="share">${escapeHtml(p["出資額"])}</span>` : ""}
              </li>
            `).join("")}
            ${dirs.length > 20 ? `<li class="more">…另有 ${dirs.length - 20} 人</li>` : ""}
          </ul>
        </details>
      ` : ""}

      ${mgrs.length ? `
        <details class="company-section">
          <summary>經理人名單（${mgrs.length} 人）</summary>
          <ul class="company-people">
            ${mgrs.slice(0, 15).map(p => `
              <li>
                <span class="name">${escapeHtml(p["姓名"] || "")}</span>
                ${p["到職日期"] ? `<span class="rep">到職 ${escapeHtml(fmtTwDate(p["到職日期"]))}</span>` : ""}
              </li>
            `).join("")}
            ${mgrs.length > 15 ? `<li class="more">…另有 ${mgrs.length - 15} 人</li>` : ""}
          </ul>
        </details>
      ` : ""}

      ${items.length ? `
        <details class="company-section">
          <summary>所營事業（${items.length} 項）</summary>
          <ul class="company-items">
            ${items.slice(0, 20).map(it => Array.isArray(it) ? `<li><code>${escapeHtml(it[0] || "")}</code> ${escapeHtml(it[1] || "")}</li>` : `<li>${escapeHtml(String(it))}</li>`).join("")}
            ${items.length > 20 ? `<li class="more">…另有 ${items.length - 20} 項</li>` : ""}
          </ul>
        </details>
      ` : ""}

      ${shopItems.length ? `
        <details class="company-section" open>
          <summary>營業項目（${shopItems.length} 項）</summary>
          <ul class="company-items">
            ${shopItems.map(it => `<li><code>${escapeHtml(it.code)}</code> ${escapeHtml(it.name)}</li>`).join("")}
          </ul>
        </details>
      ` : ""}

      <p class="data-credit">資料來源：<a href="https://company.g0v.ronny.tw/id/${escapeHtml(id || "")}" target="_blank" rel="noopener">g0v 公司資料庫</a>（資料同步自經濟部商業司）</p>
    </div>
  `;
}

function parseShopBusinessItems(s) {
  // 商業類「營業項目」是大字串，含序號 + 行業代碼（F213060 等）+ 行業名稱，以多重換行分隔
  // 例：" 1\n\nF213060\n\n電信器材零售業 \n 2\n\nF...\n\n..."
  const lines = s.split(/\n+/).map(x => x.trim()).filter(Boolean);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    // 行業代碼：1 個英文字母 + 6 位數字
    if (/^[A-Z]\d{6}$/.test(lines[i])) {
      out.push({ code: lines[i], name: lines[i + 1] || "" });
      i++; // 跳過下一行（行業名稱）
    }
  }
  return out;
}

function fmtTwDate(o) {
  if (!o) return "";
  if (typeof o === "string") return o;
  if (typeof o === "object" && o.year) {
    const m = String(o.month || 1).padStart(2, "0");
    const d = String(o.day || 1).padStart(2, "0");
    return `${o.year}/${m}/${d}`;
  }
  return "";
}

document.addEventListener("click", e => {
  const pick = e.target.closest(".company-pick");
  if (!pick) return;
  const id = pick.dataset.id;
  if (!id) return;
  const input = document.getElementById("company-kw");
  if (input) input.value = id;
  runCompanyLookup();
});

function groupConsecutive(days) {
  const groups = [];
  let cur = [];
  for (const d of days) {
    if (cur.length === 0 || daysBetween(cur[cur.length - 1].date, d.date) === 1) {
      cur.push(d);
    } else {
      groups.push(cur);
      cur = [d];
    }
  }
  if (cur.length) groups.push(cur);
  return groups.filter(g => g.length >= 1);
}

function daysBetween(a, b) {
  const da = new Date(a.slice(0,4) + "-" + a.slice(4,6) + "-" + a.slice(6,8));
  const db = new Date(b.slice(0,4) + "-" + b.slice(4,6) + "-" + b.slice(6,8));
  return Math.round((db - da) / 86400000);
}

function formatDateStr(s) {
  return `${s.slice(0,4)}/${s.slice(4,6)}/${s.slice(6,8)}`;
}

function formatDateRange(g) {
  if (g.length === 1) return formatDateStr(g[0].date);
  return `${formatDateStr(g[0].date)} – ${formatDateStr(g[g.length - 1].date)}（${g.length} 天）`;
}

function weekDay(w) {
  const map = { "一":"一", "二":"二", "三":"三", "四":"四", "五":"五", "六":"六", "日":"日" };
  return map[w] || w;
}

// ===== deadline calc =====
// 依民訴法 §161 準用民法 §120-122：期間以日定者不計算始日，期間末日為例假日者順延至次日
async function runDeadlineCalc() {
  const startStr = document.getElementById("deadline-start")?.value;
  const days = parseInt(document.getElementById("deadline-days")?.value, 10);
  const out = document.getElementById("deadline-result");
  if (!out) return;
  if (!startStr || !days || days < 1) {
    out.innerHTML = `<p class="error">請輸入有效起算日與期間</p>`;
    return;
  }
  out.innerHTML = `<p class="loading">計算中…</p>`;
  try {
    const start = new Date(startStr + "T00:00:00");
    // 起算日不計入，從次日起算 → 算術上即「+days」（即第 days 日為末日）
    let end = new Date(start.getTime() + days * 86400000);

    // 需要查詢起算年、結束年、可能跨年的國定假日
    const years = new Set([start.getFullYear(), end.getFullYear()]);
    const holidayMap = await fetchHolidays(years);

    // 末日順延：若末日為週六、週日、國定假日，則順延至次一營業日
    const originalEnd = new Date(end);
    let postponedDays = 0;
    while (isOffDay(end, holidayMap)) {
      end = new Date(end.getTime() + 86400000);
      postponedDays++;
      // 跨年的話加查
      if (!years.has(end.getFullYear())) {
        years.add(end.getFullYear());
        const more = await fetchHolidays(new Set([end.getFullYear()]));
        Object.assign(holidayMap, more);
      }
    }

    out.innerHTML = renderDeadlineResult(start, days, originalEnd, end, postponedDays, holidayMap);
  } catch (err) {
    out.innerHTML = `<p class="error">計算失敗：${escapeHtml(String(err.message || err))}</p>`;
  }
}

async function fetchHolidays(years) {
  const map = {};
  for (const y of years) {
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/gh/ruyut/TaiwanCalendar/data/${y}.json`);
      if (!res.ok) continue;
      const arr = await res.json();
      for (const d of arr) {
        map[d.date] = { isHoliday: !!d.isHoliday, name: d.description || "", week: d.week };
      }
    } catch {}
  }
  return map;
}

function isOffDay(date, holidayMap) {
  const key = date.getFullYear() + String(date.getMonth() + 1).padStart(2, "0") + String(date.getDate()).padStart(2, "0");
  if (holidayMap[key]) return holidayMap[key].isHoliday;
  // 無資料時 fallback 用日期 weekday
  const wd = date.getDay();
  return wd === 0 || wd === 6;
}

function renderDeadlineResult(start, days, originalEnd, end, postponedDays, holidayMap) {
  const fmtJs = d => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`;
  const weekStr = ["日","一","二","三","四","五","六"][end.getDay()];
  const postponeNote = postponedDays > 0
    ? `<p class="deadline-note">原末日為 <b>${fmtJs(originalEnd)}</b>，因為例假日／國定假日，依民法 §122 順延 ${postponedDays} 日。</p>`
    : "";
  // 列出順延日當天屬於什麼
  const key = end.getFullYear() + String(end.getMonth()+1).padStart(2,"0") + String(end.getDate()).padStart(2,"0");
  const info = holidayMap[key];
  let endStateNote = "";
  if (info && info.isHoliday && info.name) {
    endStateNote = `（最後日為 ${info.name}? 不會，依法已順延）`;
  }

  return `
    <div class="deadline-card">
      <div class="deadline-headline">
        <div class="deadline-label">最後期間</div>
        <div class="deadline-date">${fmtJs(end)}<span class="deadline-week">（星期${weekStr}）</span></div>
      </div>
      <dl class="deadline-facts">
        <dt>起算日</dt><dd>${fmtJs(start)}（不計入當日）</dd>
        <dt>期間</dt><dd>${days} 日</dd>
        <dt>原末日</dt><dd>${fmtJs(originalEnd)}</dd>
        ${postponedDays > 0 ? `<dt>順延</dt><dd>+${postponedDays} 日 → ${fmtJs(end)}</dd>` : ""}
      </dl>
      ${postponeNote}
      <p class="data-credit">依民法 §120-122 / 民訴法 §161 / 行政程序法 §48；資料來源：<a href="https://github.com/ruyut/TaiwanCalendar" target="_blank" rel="noopener">TaiwanCalendar</a>（行政院人事行政總處公告）。實際適用請以審理法院認定為準。</p>
    </div>
  `;
}

document.addEventListener("click", e => {
  const chip = e.target.closest("[data-deadline-days]");
  if (!chip) return;
  const days = chip.dataset.deadlineDays;
  const input = document.getElementById("deadline-days");
  if (input) {
    input.value = days;
    runDeadlineCalc();
  }
});

// ===== interest calc =====
// 民法 §203 法定遲延利息年息 5%；計算 = 本金 × 年利率 × 日數 / 365
function runInterestCalc() {
  const principal = parseFloat(document.getElementById("int-principal")?.value);
  const rate = parseFloat(document.getElementById("int-rate")?.value);
  const fromStr = document.getElementById("int-from")?.value;
  const toStr = document.getElementById("int-to")?.value;
  const out = document.getElementById("interest-result");
  if (!out) return;
  if (!principal || principal <= 0 || rate < 0 || rate > 100 || !fromStr || !toStr) {
    out.innerHTML = `<p class="error">請輸入有效本金、利率與日期</p>`;
    return;
  }
  const from = new Date(fromStr + "T00:00:00");
  const to = new Date(toStr + "T00:00:00");
  if (to < from) {
    out.innerHTML = `<p class="error">截止日不得早於起息日</p>`;
    return;
  }
  // 含當日：日數 = 兩日之差 + 1
  const days = Math.round((to - from) / 86400000) + 1;
  const interest = principal * (rate / 100) * days / 365;
  const total = principal + interest;

  const fmt = n => n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
  out.innerHTML = `
    <div class="calc-card">
      <div class="calc-headline">
        <div class="calc-label">遲延利息</div>
        <div class="calc-amount">NT$ ${fmt(interest)}</div>
      </div>
      <dl class="deadline-facts">
        <dt>本金</dt><dd>NT$ ${fmt(principal)}</dd>
        <dt>年利率</dt><dd>${rate}%</dd>
        <dt>起息日</dt><dd>${fromStr}</dd>
        <dt>截止日</dt><dd>${toStr}</dd>
        <dt>計息天數</dt><dd>${days} 日（含首尾）</dd>
        <dt>本息合計</dt><dd><b>NT$ ${fmt(total)}</b></dd>
      </dl>
      <p class="data-credit">公式：本金 × 年利率 × 日數 / 365（民法 §203 法定 5%；最高 16% 民法 §205）。書狀引用請以實際法院認定為準。</p>
    </div>
  `;
}

// ===== court fee calc =====
// 民訴法 §77-13：第一審依訴訟標的金額累進計算
// - 10 萬以下：1,000 元
// - 10 萬 ~ 100 萬：每 1 萬加收 110 元（即 1.1%）
// - 100 萬 ~ 1000 萬：每 1 萬加收 99 元（即 0.99%）
// - 1000 萬 ~ 1 億：每 1 萬加收 88 元（即 0.88%）
// - 1 億 ~ 10 億：每 1 萬加收 77 元（即 0.77%）
// - 10 億以上：每 1 萬加收 66 元（即 0.66%）
function calcFirstInstanceCourtFee(amount) {
  if (amount <= 0) return 0;
  if (amount <= 100000) return 1000;
  let fee = 1000;
  // 10 萬 ~ 100 萬：再加 (amount-10萬) × 1.1%
  const tiers = [
    { from: 100000, to: 1000000, ratePerWan: 110 },
    { from: 1000000, to: 10000000, ratePerWan: 99 },
    { from: 10000000, to: 100000000, ratePerWan: 88 },
    { from: 100000000, to: 1000000000, ratePerWan: 77 },
    { from: 1000000000, to: Infinity, ratePerWan: 66 }
  ];
  for (const t of tiers) {
    if (amount <= t.from) break;
    const upper = Math.min(amount, t.to);
    const wanInTier = (upper - t.from) / 10000;
    fee += wanInTier * t.ratePerWan;
  }
  return Math.ceil(fee);
}

function runCourtFeeCalc() {
  const amount = parseFloat(document.getElementById("cf-amount")?.value);
  const out = document.getElementById("interest-result");
  if (!out) return;
  if (!amount || amount <= 0) {
    out.innerHTML = `<p class="error">請輸入有效訴訟標的金額</p>`;
    return;
  }
  const first = calcFirstInstanceCourtFee(amount);
  const second = Math.ceil(first * 1.5); // 第二、三審加徵 1/2 → 1.5 倍（§77-16）
  const third = second;
  const fmt = n => n.toLocaleString("zh-TW", { maximumFractionDigits: 0 });
  out.innerHTML = `
    <div class="calc-card">
      <div class="calc-headline">
        <div class="calc-label">第一審裁判費</div>
        <div class="calc-amount">NT$ ${fmt(first)}</div>
      </div>
      <dl class="deadline-facts">
        <dt>訴訟標的金額</dt><dd>NT$ ${fmt(amount)}</dd>
        <dt>第一審</dt><dd>NT$ ${fmt(first)}</dd>
        <dt>第二審（+1/2）</dt><dd>NT$ ${fmt(second)}</dd>
        <dt>第三審（+1/2）</dt><dd>NT$ ${fmt(third)}</dd>
      </dl>
      <p class="data-credit">依民訴法 §77-13（第一審累進）、§77-16（第二、三審加徵 1/2）。家事、刑事附帶民事、行政訴訟另有規定。</p>
    </div>
  `;
}

// 切換利息／訴訟費 tab
document.addEventListener("click", e => {
  const tab = e.target.closest(".calc-tab");
  if (!tab) return;
  const which = tab.dataset.calc;
  document.querySelectorAll(".calc-tab").forEach(t => t.classList.toggle("active", t.dataset.calc === which));
  document.querySelectorAll(".calc-form").forEach(f => {
    f.style.display = f.dataset.calc === which ? "" : "none";
  });
  const out = document.getElementById("interest-result");
  if (out) out.innerHTML = "";
});

// ===== back to top =====
const backTop = $("#back-to-top");
window.addEventListener("scroll", () => {
  backTop.classList.toggle("visible", window.scrollY > 400);
});
backTop.addEventListener("click", e => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===== boot =====
const initial = (location.hash || "#query").slice(1);
switchTab(MAIN_TABS.some(t => t.id === initial) ? initial : "query");

// ===== service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
