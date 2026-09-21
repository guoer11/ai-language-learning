# ai-language-learning

AI-powered Japanese and English learning web app

## 語言小島 v0.1.0

日文與英文學習 PWA 第一版，以 React + Vite + TypeScript 建立。手機優先，介面預設繁體中文。

### 本版可操作

- 首頁 → 語言 → 初 / 中 / 高階 → 世界 1 地圖 → 8 個循序關卡。
- 每關示範 3 題：外語選中文、句子排列、口說模擬。
- 60% 以上通關；60–79% 1 星、80–99% 2 星、100% 3 星；目前每關 3 題，實際可得到 1 或 3 星，2 星供未來較多題目使用。
- 每答對 1 題 +10 XP，過關額外 +20 XP。每次新練習都可獲得 XP；星星保留各關最佳值，不重複累加。未過關不解鎖。
- XP、最佳星星、台灣日期連續天數、成就、今日任務徽章、錯題關卡複習、最近練習紀錄。
- 自由新增與切換本機體驗檔案、各自保存進度；無愛心、體力、每日練習次數上限。
- PWA manifest、PNG icons、Service Worker，首次完整載入後可離線體驗靜態課程。
- Safari 分享 → 加入主畫面；Chrome / Edge 瀏覽器選單安裝。實機安裝仍需驗證。

### 清楚區分模擬與正式能力

本版沒有 Google Login、Supabase 寫入、真實錄音、ASR、OpenAI、Azure 或自然語言 AI BOSS。口說按鈕不會啟動麥克風；使用者選擇模擬辨識結果，內容比對和固定發音示意分數分開顯示。朗讀使用裝置 speechSynthesis，可用聲音與品質取決於裝置；播放失敗時可繼續模擬流程。

BOSS / Checkpoint 目前沿用綜合示範題組，非真正 AI 對話。題庫為每語言、程度 3 組素材循環組成 8 關，用於確認操作流程，並非完整教學教材。其他題型與完整課程將於後續階段補齊。

本機體驗檔案不是身分驗證或隱私保護；相同瀏覽器可切換所有檔案。清除瀏覽器資料會遺失進度，不跨裝置同步。模擬成績不代表真實能力，不能直接轉入正式成績。

### 開發與驗證

```sh
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

Node.js 24；commit package-lock.json。`npm test` 會啟動 production preview，自動驗證手機 / 桌面過關解鎖、失敗、弱點複習、家人檔案、重玩星星、重新載入保存、英文高階路徑、PWA 離線與手機橫向溢出。Playwright Chromium mobile emulation 不等同 iOS Safari 實機。

### GitHub Pages

`vite.config.ts` base 固定 `/ai-language-learning/`，採用同頁 React state 流程，沒有子路由重新整理 404 問題。

`.github/workflows/deploy.yml`：main push → npm ci → production build → browser tests → upload pages artifact → deploy。Repository Settings → Pages → Source 需選 GitHub Actions；若尚未開啟，deploy 會失敗，需由有 repository 管理權限的帳號啟用。網站預計網址：`https://guoer11.github.io/ai-language-learning/`，須以實際 workflow deploy 成功為準。

### 後端

詳見 [共用後端檢查與資料庫設計](docs/backend-design.md)。本版完全不修改現有 ai-translator，也不建立新 Supabase Project。無 API Key、Secret 或個人帳號資料放入前端。
