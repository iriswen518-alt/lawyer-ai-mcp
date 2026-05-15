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
const SEARCH_PANELS = [
  {
    id: "law",
    title: "法規條文",
    icon: "📖",
    desc: "搜尋全國法規資料庫（11,700+ 部法規）。結果在新分頁開啟，會自動高亮關鍵字。",
    fields: [
      { id: "law-kw", label: "法規或關鍵字", placeholder: "例：民法、勞動基準法、消費者保護" }
    ],
    btnLabel: "查全國法規資料庫",
    handler: ({ "law-kw": kw }) => {
      if (!kw) return null;
      const url = `https://law.moj.gov.tw/Law/LawSearchResult.aspx?ty=L&kw=${encodeURIComponent(kw)}`;
      return appendTextFragment(url, kw);
    }
  },
  {
    id: "judgment",
    title: "裁判書搜尋",
    icon: "⚖",
    desc: "司法院裁判書全文檢索系統。LawSnote 結果會直接在新分頁標示關鍵字。",
    fields: [
      { id: "jud-kw", label: "關鍵字 / 法條 / 案由", placeholder: "例：預售屋 遲延交屋、刑法277" }
    ],
    btnLabel: "查 LawSnote（含關鍵字標示）",
    altBtn: {
      label: "改用司法院官方系統",
      url: kw => kw["jud-kw"] ? `https://judgment.judicial.gov.tw/FJUD/qryresultlst.aspx?ty=JUDBOOK&kw=${encodeURIComponent(kw["jud-kw"])}` : null
    },
    handler: ({ "jud-kw": kw }) => {
      if (!kw) return null;
      return `https://www.lawsnote.com/search?q=${encodeURIComponent(kw)}`;
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
      const url = `https://cons.judicial.gov.tw/judcurrentNew1.aspx?fid=156&searchValue=${encodeURIComponent(kw)}`;
      return appendTextFragment(url, kw);
    }
  },
  {
    id: "company",
    title: "公司登記查詢",
    icon: "🏢",
    desc: "g0v 公司資料庫，輸入公司名或統一編號，自動跳到該公司頁面並高亮關鍵字。",
    fields: [
      { id: "co-kw", label: "公司名稱或統一編號", placeholder: "例：聯發科、台灣積體電路、22099131" }
    ],
    btnLabel: "查公司登記（g0v）",
    altBtn: {
      label: "經濟部商業司官方",
      url: kw => {
        const v = (kw["co-kw"] || "").trim();
        if (!v) return null;
        if (/^\d{8}$/.test(v)) return `https://findbiz.nat.gov.tw/fts/query/QueryCmpyDetail/queryCmpyDetail.do?banNo=${v}`;
        return `https://findbiz.nat.gov.tw/fts/query/QueryList/queryList.do?searchTerm=${encodeURIComponent(v)}`;
      }
    },
    handler: ({ "co-kw": kw }) => {
      if (!kw) return null;
      const trimmed = kw.trim();
      if (/^\d{8}$/.test(trimmed)) {
        return `https://company.g0v.ronny.tw/id/${trimmed}`;
      }
      const url = `https://company.g0v.ronny.tw/search?q=${encodeURIComponent(trimmed)}`;
      return appendTextFragment(url, trimmed);
    }
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
    title: "國定假日（即時查）",
    icon: "📅",
    desc: "本頁直接從 TaiwanCalendar 取資料，輸入年份即時顯示連假與補班日。",
    inline: true
  }
];

function renderSearch() {
  return `
    <h2 class="section-title">立即查詢 · 直連台灣公開資料源</h2>
    <p class="section-lead">輸入關鍵字，按下按鈕即跳到官方系統的結果頁，自動高亮關鍵字。國定假日為本頁即時顯示。所有資料皆來自官方公開來源，免費可商用。</p>

    <div class="search-grid">
      ${SEARCH_PANELS.map(p => p.inline ? renderInlineHoliday() : renderSearchPanel(p)).join("")}
    </div>
  `;
}

function renderSearchPanel(p) {
  return `
    <div class="search-card" data-panel="${escapeHtml(p.id)}">
      <h3><span class="search-icon">${p.icon}</span>${escapeHtml(p.title)}</h3>
      <p class="tagline">${escapeHtml(p.desc)}</p>
      <form class="search-form" data-panel-id="${escapeHtml(p.id)}">
        ${p.fields.map(f => `
          <label class="search-label">
            <span>${escapeHtml(f.label)}</span>
            <input type="text" id="${escapeHtml(f.id)}" name="${escapeHtml(f.id)}" placeholder="${escapeHtml(f.placeholder)}" autocomplete="off">
          </label>
        `).join("")}
        <div class="search-actions">
          <button type="submit" class="search-btn primary">${escapeHtml(p.btnLabel)}</button>
          ${p.altBtn ? `<button type="button" class="search-btn secondary" data-alt-id="${escapeHtml(p.id)}">${escapeHtml(p.altBtn.label)}</button>` : ""}
        </div>
      </form>
    </div>
  `;
}

function renderInlineHoliday() {
  const thisYear = new Date().getFullYear();
  return `
    <div class="search-card" data-panel="holiday">
      <h3><span class="search-icon">📅</span>國定假日（即時查）</h3>
      <p class="tagline">本頁直接從 TaiwanCalendar 取資料，輸入年份即時顯示連假與補班日。</p>
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

const RENDERERS = {
  search: renderSearch
};

function switchTab(name) {
  $$(".main-tab").forEach(b => b.classList.toggle("active", b.dataset.tab === name));
  const fn = RENDERERS[name];
  $("#content").innerHTML = fn ? fn() : "";
  window.scrollTo({ top: 0, behavior: "smooth" });
  history.replaceState(null, "", "#" + name);
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
const initial = (location.hash || "#search").slice(1);
switchTab(RENDERERS[initial] ? initial : "search");

// ===== service worker =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  });
}
