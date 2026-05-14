# 律師 AI 助手 — MCP 法律工具箱

把 Claude 接上司法資料庫，書狀研究時間省一半。

公開單頁式 PWA。介紹兩套台灣社群開發的 MCP（Model Context Protocol）：

- **Twinkle Hub** — 串接 data.gov.tw 全量政府開放資料
- **台灣法律資料庫 MCP** — 司法院裁判書 + 全國法規 + 憲法法庭釋字

附完整安裝指引、書狀工作流對應、實測場景與工具邊界說明。

## 結構

```
.
├── index.html         # 入口
├── style.css          # 樣式
├── app.js             # 內容資料 + 渲染邏輯（純 vanilla JS）
├── manifest.json      # PWA manifest
├── service-worker.js  # 離線快取
├── icon.svg           # 主圖標（向量）
├── icon-192.png       # PWA icon
└── icon-512.png       # PWA icon
```

所有頁面內容都寫在 `app.js` 的 `DATA` 物件中，編輯後重整即更新。

## 本地預覽

```bash
python3 -m http.server 8765
# 開 http://127.0.0.1:8765
```

## 部署

GitHub Pages（任何分支的根目錄）即可，無建置步驟。

## 資料來源

- Twinkle Hub: https://hub.twinkleai.tw / https://github.com/ai-twinkle/Hub
- 台灣法律資料庫 MCP: https://github.com/lawchat-oss/mcp-taiwan-legal-db
- 影片參考: 律師寫書狀還在搜法源？Claude 接上司法 MCP 全自動找判決（YouTube：MK2jzg_YSnc）

## 免責

本頁僅為公開資訊整理與工具介紹，不構成法律意見。實際使用請以官方原文與最新版本為準。
