// 律師 AI 助手 — MCP 法律工具箱
// 純靜態 PWA。所有內容寫在 JS 物件，方便日後直接編輯。

const DATA = {
  overview: {
    tag: "新一代法律研究工作流",
    headline: "把 Claude 接上司法資料庫，書狀研究時間省一半",
    sub: "律師寫一份書狀，平均要切五個分頁、跑三個收費資料庫。MCP（Model Context Protocol）讓 AI 直接查司法院裁判書、全國法規、憲法法庭釋字，並把結果整理回給你。",
    paintpoints: [
      { num: "5+", label: "資料來源", desc: "裁判書、法規、釋字、函釋、商業判例需個別查詢" },
      { num: "60%", label: "事務性時間", desc: "據業界估計，書狀研究階段佔律師工時最大宗" },
      { num: "8", label: "MCP 工具", desc: "司法 MCP 提供 8 支唯讀工具，覆蓋三大公開資料源" },
      { num: "免費", label: "開源 + 公開資料", desc: "兩套 MCP 皆社群維護、僅打官方公開 API" }
    ]
  },
  toolbox: [
    {
      name: "Twinkle Hub",
      tagline: "台灣第一個 MCP Hub — 串接 data.gov.tw 全量",
      meta: [
        { type: "default", text: "政府開放資料" },
        { type: "default", text: "HTTP 雲端" },
        { type: "ok", text: "alpha 期免費" }
      ],
      features: [
        "49,343 個台灣政府開放資料集（data.gov.tw 96.6% 全量）",
        "13.5 萬筆政府採購資料（PCC 每日同步）",
        "32 個台灣專用工具（身分證、統編、民國年、地址查詢）",
        "司法、稅務、不動產、地震、醫療、教育多領域涵蓋",
        "支援 Claude Desktop、Claude Code、Cursor、Codex"
      ],
      cite: "影片中介紹的「政府開放資料 MCP」，第一次安裝需註冊取得 API key（Google／GitHub 一鍵登入）。",
      links: [
        { text: "官方網站", url: "https://hub.twinkleai.tw" },
        { text: "GitHub", url: "https://github.com/ai-twinkle/Hub" },
        { text: "申請 API key", url: "https://hub.twinkleai.tw/login" }
      ]
    },
    {
      name: "台灣法律資料庫 MCP",
      tagline: "司法院裁判書 + 全國法規 + 憲法法庭一次接好",
      meta: [
        { type: "default", text: "純司法資料" },
        { type: "default", text: "本機 stdio" },
        { type: "ok", text: "完全免註冊" }
      ],
      features: [
        "司法院裁判書全文搜尋與單筆抓取（judgment.judicial.gov.tw）",
        "全國法規資料庫，11,700+ 部法規條文／範圍／修法沿革",
        "憲法法庭 868 筆大法官解釋與憲判字（含理由書全文，離線快取）",
        "釋字引用關係圖譜，追溯憲法學說演變",
        "預設純 HTTP 直打（~0.25 秒），WAF 觸發時自動切 Playwright 備援"
      ],
      cite: "影片中介紹的「司法資料庫＋判決資料庫 MCP」，社群開源、本機執行，無認證、無流量限制。",
      links: [
        { text: "GitHub", url: "https://github.com/lawchat-oss/mcp-taiwan-legal-db" },
        { text: "Claude Plugin", url: "https://github.com/lawchat-oss/taiwan-legal-plugin" },
        { text: "PyPI 套件", url: "https://pypi.org/project/mcp-taiwan-legal-db/" }
      ]
    }
  ],
  workflow: [
    {
      step: 1,
      title: "確認事實",
      desc: "整理當事人陳述、證據時序、爭點。這一段是律師的專業判斷，AI 主要做訪談筆記與時序整理輔助。",
      tools: ["人工為主", "AI 摘要輔助"]
    },
    {
      step: 2,
      title: "找適用法條",
      desc: "依案件類型搜尋法規條文。司法 MCP 直接查全國法規資料庫，可指定條號、條號範圍、整部法規或附修法沿革。",
      tools: ["query_regulation", "search_regulations", "get_pcode"]
    },
    {
      step: 3,
      title: "找支援立場的判決",
      desc: "查找有利的實務見解。司法 MCP 支援關鍵字、案號、法院、案件類型、年份範圍篩選，自動依法院層級排序。",
      tools: ["search_judgments", "get_judgment"]
    },
    {
      step: 4,
      title: "找函釋與解釋",
      desc: "憲法層級用司法 MCP 的釋字／憲判字工具；行政函釋目前 MCP 尚未涵蓋，仍需法源等收費資料庫補充。",
      tools: ["get_interpretation", "search_interpretations", "get_citations"]
    },
    {
      step: 5,
      title: "起草與引用核對",
      desc: "AI 依事實 + 法條 + 判決草擬訴狀框架，律師審閱、修改、補充當事人專屬論述後送出。",
      tools: ["人工終稿", "AI 草稿生成"]
    }
  ],
  scenarios: [
    {
      type: "civil",
      typeLabel: "民事",
      title: "借貸糾紛 — 返還借款起訴狀",
      fact: "甲借款 200 萬給乙，立有借據，清償期屆至未還，欲提起民事訴訟。",
      actions: [
        "查民法第 478 條（消費借貸返還請求）",
        "搜尋近五年最高法院關於消費借貸舉證責任的判決",
        "查相關大法官解釋（若有）"
      ]
    },
    {
      type: "labor",
      typeLabel: "勞動",
      title: "非法解僱 — 確認僱傭關係存在訴訟",
      fact: "勞工被雇主以業務緊縮為由解僱，認為不符合勞基法第 11 條要件，欲確認僱傭關係存在。",
      actions: [
        "查勞動基準法第 11 至 14 條（雇主終止契約事由）",
        "搜尋實務上「業務緊縮」要件的高等法院判決",
        "比對近年最高法院對「最後手段性原則」的見解"
      ]
    },
    {
      type: "criminal",
      typeLabel: "刑事",
      title: "酒吧衝突 — 傷害告訴狀",
      fact: "在酒吧發生肢體衝突致對方輕傷，欲提起刑事傷害告訴。",
      actions: [
        "查刑法第 277 條（普通傷害罪）",
        "搜尋最高法院關於「傷害故意」與「正當防衛」界線的見解",
        "整理告訴狀格式所需事實要件"
      ]
    }
  ],
  install: [
    {
      title: "司法資料庫 MCP（推薦先裝這個 — 免註冊）",
      desc: "本機跑 Python 套件，Claude Code 用 stdio 直接呼叫。10 分鐘內完成。",
      blocks: [
        {
          label: "建立 Python 虛擬環境並安裝套件",
          code: "python3.12 -m venv ~/.venv-legalmcp\n~/.venv-legalmcp/bin/pip install mcp-taiwan-legal-db"
        },
        {
          label: "註冊到 Claude Code（user scope，所有專案可用）",
          code: "claude mcp add taiwan-legal-db ~/.venv-legalmcp/bin/mcp-taiwan-legal-db --scope user"
        },
        {
          label: "驗證連線（應顯示 ✓ Connected）",
          code: "claude mcp list | grep taiwan-legal-db"
        }
      ],
      tip: "<strong>選用：</strong>司法院 WAF 偶爾擋自動請求，可加裝 Playwright Chromium 作為備援，平時 idle 不耗資源：<code>~/.venv-legalmcp/bin/playwright install chromium</code>"
    },
    {
      title: "Twinkle Hub（政府開放資料 — 需先註冊取 API key）",
      desc: "雲端 HTTP 端點，Bearer token 認證。alpha 期完全免費。",
      blocks: [
        {
          label: "取得 API key（Google 或 GitHub 一鍵登入）",
          code: "# 開啟瀏覽器登入：https://hub.twinkleai.tw/login\n# 第一次登入會自動產生 sk-... 的虛擬金鑰"
        },
        {
          label: "註冊到 Claude Code（把 sk-... 換成自己的金鑰）",
          code: "claude mcp add --transport http twinkle-hub https://api.twinkleai.tw/mcp/ \\\n  --header \"Authorization: Bearer sk-...\""
        },
        {
          label: "Claude Desktop 設定（macOS 編輯這個檔案）",
          code: "# ~/Library/Application Support/Claude/claude_desktop_config.json\n{\n  \"mcpServers\": {\n    \"twinkle-hub\": {\n      \"type\": \"http\",\n      \"url\": \"https://api.twinkleai.tw/mcp/\",\n      \"headers\": {\n        \"Authorization\": \"Bearer sk-...\"\n      }\n    }\n  }\n}"
        }
      ],
      tip: "<strong>裝完後在 Claude 中的開場白：</strong>「我是律師，要寫一份○○類型的書狀，幫我用 taiwan-legal-db 跟 twinkle-hub 兩個 MCP 找相關的法條、判決、釋字。」AI 會自動規劃調用順序。"
    }
  ],
  limits: {
    can: [
      "精確查任一條法規條文與修法沿革",
      "全文搜尋裁判書，依案件類型、法院、年份過濾",
      "依案號直接抓單筆判決完整內容",
      "查大法官解釋與憲判字的爭點、解釋文、理由書",
      "追溯釋字引用關係圖譜",
      "查政府採購、開放資料、身分證／統編格式"
    ],
    cannot: [
      "行政機關函釋（目前 MCP 未收錄，仍需法源等付費庫）",
      "外國法判決與比較法（限台灣公開資料）",
      "未公開的訴訟卷宗、調解紀錄",
      "判決新鮮度有限，最高層級判決可能延後 1-2 週才上線",
      "替代律師對事實認定與訴訟策略的專業判斷",
      "保證查到「對你最有利」的判決 — AI 會找到但需律師選擇引用"
    ]
  }
};

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

function renderOverview() {
  const d = DATA.overview;
  return `
    <section class="hero">
      <span class="hero-tag">${escapeHtml(d.tag)}</span>
      <h2>${escapeHtml(d.headline)}</h2>
      <p>${escapeHtml(d.sub)}</p>
      <div class="painpoint-grid">
        ${d.paintpoints.map(p => `
          <div class="painpoint">
            <div class="label">${escapeHtml(p.label)}</div>
            <div class="num">${escapeHtml(p.num)}</div>
            <div class="desc">${escapeHtml(p.desc)}</div>
          </div>
        `).join("")}
      </div>
    </section>

    <h3 class="divider-h">為什麼這對律師很重要</h3>
    <div class="tool-grid">
      <div class="tool-card">
        <h3>從「人工查」到「AI 查」</h3>
        <p class="tagline">過去你要在判決系統裡複製案號、貼到法規系統再回查條文。MCP 讓 AI 一口氣串起來。</p>
        <ul class="feature-list">
          <li>不用切換瀏覽器分頁</li>
          <li>不用記每個資料庫的搜尋語法</li>
          <li>結果直接整理成書狀草稿可用的引用格式</li>
        </ul>
      </div>
      <div class="tool-card">
        <h3>專業仍由律師主導</h3>
        <p class="tagline">AI 是研究助理，不是當事人代理人。最關鍵的事實認定與策略選擇，仍由律師專業判斷。</p>
        <ul class="feature-list">
          <li>事實確認：律師必做，AI 輔助訪談筆記</li>
          <li>策略選擇：律師決定主張，AI 提供素材</li>
          <li>稽核引用：律師核對引用是否正確</li>
        </ul>
      </div>
    </div>
  `;
}

function renderToolbox() {
  return `
    <h2 class="section-title">兩大套法律 MCP 工具箱</h2>
    <p class="section-lead">影片中介紹的兩套 MCP，皆由台灣社群開發。一套主打政府開放資料、一套專攻司法／法規／釋字。</p>
    <div class="tool-grid">
      ${DATA.toolbox.map(t => `
        <div class="tool-card">
          <div class="tool-head">
            <h3>${escapeHtml(t.name)}</h3>
          </div>
          <div class="tool-meta">
            ${t.meta.map(m => `<span class="chip ${m.type}">${escapeHtml(m.text)}</span>`).join("")}
          </div>
          <p class="tagline">${escapeHtml(t.tagline)}</p>
          <ul class="feature-list">
            ${t.features.map(f => `<li>${escapeHtml(f)}</li>`).join("")}
          </ul>
          <p class="tagline" style="font-size:13px;font-style:italic;">${escapeHtml(t.cite)}</p>
          <div class="source-link">
            ${t.links.map(l => `<a href="${escapeHtml(l.url)}" target="_blank" rel="noopener">${escapeHtml(l.text)} →</a>`).join("")}
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderWorkflow() {
  return `
    <h2 class="section-title">律師書狀五步驟，MCP 接哪裡</h2>
    <p class="section-lead">參照影片整理的書狀撰寫流程，逐步對應到 MCP 工具呼叫。第 1 與第 5 步以律師專業為主。</p>
    <div class="flow-list">
      ${DATA.workflow.map(s => `
        <div class="flow-item">
          <div class="flow-step">${s.step}</div>
          <div class="flow-body">
            <h4>${escapeHtml(s.title)}</h4>
            <p>${escapeHtml(s.desc)}</p>
            <div class="flow-tools">
              ${s.tools.map(t => `<span class="chip">${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>
        </div>
      `).join("")}
    </div>
  `;
}

function renderScenarios() {
  return `
    <h2 class="section-title">三個實測場景</h2>
    <p class="section-lead">影片中示範的三個書狀類型，以及 MCP 在每個場景能幫上的事。</p>
    <div class="scenario-grid">
      ${DATA.scenarios.map(s => `
        <div class="scenario-card">
          <span class="case-type ${s.type}">${escapeHtml(s.typeLabel)}</span>
          <h4>${escapeHtml(s.title)}</h4>
          <p class="case-fact">${escapeHtml(s.fact)}</p>
          <p style="font-size:13px;color:var(--text-mute);margin:8px 0 0;">AI 自動執行：</p>
          <ol class="ai-action">
            ${s.actions.map(a => `<li>${escapeHtml(a)}</li>`).join("")}
          </ol>
        </div>
      `).join("")}
    </div>
  `;
}

function renderInstall() {
  return `
    <h2 class="section-title">安裝指引（複製即用）</h2>
    <p class="section-lead">先裝免註冊的司法 MCP，再考慮 Twinkle Hub。兩套並用最完整。</p>
    ${DATA.install.map((s, i) => `
      <div class="install-step">
        <h4><span class="step-num">${i + 1}</span>${escapeHtml(s.title)}</h4>
        <p>${escapeHtml(s.desc)}</p>
        ${s.blocks.map(b => `
          <p style="font-size:13.5px;color:var(--text-mute);margin:14px 0 6px;font-weight:500;">${escapeHtml(b.label)}</p>
          <div class="code-block">
            <button class="copy-btn" data-copy="${escapeHtml(b.code)}">複製</button>
            <code>${escapeHtml(b.code)}</code>
          </div>
        `).join("")}
        <div class="install-tip">${s.tip}</div>
      </div>
    `).join("")}
  `;
}

function renderLimits() {
  return `
    <h2 class="section-title">能做什麼／不能做什麼</h2>
    <p class="section-lead">影片提醒的工具邊界。MCP 是強力研究助理，但不是律師的替代品。</p>
    <div class="limit-grid">
      <div class="limit-col can">
        <h4>✓ 能做</h4>
        <ul>
          ${DATA.limits.can.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>
      <div class="limit-col cannot">
        <h4>! 限制</h4>
        <ul>
          ${DATA.limits.cannot.map(c => `<li>${escapeHtml(c)}</li>`).join("")}
        </ul>
      </div>
    </div>

    <h3 class="divider-h">建議的人機分工</h3>
    <div class="tool-grid">
      <div class="tool-card">
        <h3>用 MCP 提速的環節</h3>
        <ul class="feature-list">
          <li>初稿研究階段：法條地毯式蒐集</li>
          <li>判決資料庫主題式搜尋</li>
          <li>釋字、憲判字理由書全文擷取</li>
          <li>引用格式自動整理</li>
        </ul>
      </div>
      <div class="tool-card">
        <h3>仍需律師親自處理</h3>
        <ul class="feature-list">
          <li>當事人事實確認與策略決定</li>
          <li>關鍵法律見解的取捨</li>
          <li>引用判決是否真正有利的判讀</li>
          <li>送件前最終稽核與簽名</li>
        </ul>
      </div>
    </div>
  `;
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
    <p class="section-lead">輸入關鍵字，按下按鈕即跳到官方系統的結果頁。國定假日為本頁即時查詢。所有資料皆來自官方公開來源，免費可商用。</p>

    <div class="search-grid">
      ${SEARCH_PANELS.map(p => p.inline ? renderInlineHoliday() : renderSearchPanel(p)).join("")}
    </div>

    <div class="install-tip" style="margin-top:24px;">
      <strong>進階用法：</strong>把上述任一查詢直接打字到 Claude（已裝 MCP 的話），AI 會自動呼叫 8 個法律工具給你結構化結果，不用再切換分頁。安裝指引在<a href="#install" style="color:var(--brand-primary);font-weight:500;">安裝</a>分頁。
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
  search: renderSearch,
  overview: renderOverview,
  toolbox: renderToolbox,
  workflow: renderWorkflow,
  scenarios: renderScenarios,
  install: renderInstall,
  limits: renderLimits
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
