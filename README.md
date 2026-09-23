# ai-language-learning

AI-powered Japanese and English learning web app

## 語言小島 v0.5.0

React + Vite + TypeScript + PWA，繁體中文、手機優先的小島學習介面。已串接 Supabase Google 登入。學習進度仍存在本機，尚無雲端同步。

### v0.5.0 十題溝通練習

- 48 關全部增加為 10 題，共 480 個題目實例。每關保留單字、翻譯、排列、聽力與跟讀，再加入情境接話、句子填空、理解說話用意、對話聽力和情境口說。
- 新增 24 組雙語生活情境（每個難度 8 組），從點餐、問路、付款，進階到澄清、過敏說明、禮貌表達不同意見與討論預算。題庫會跨關輪替練習，不代表 480 個完全不同句子。
- 每關兩題口說分別練習不同句子；每次結果都保留於 oralAttempts，oral 欄位繼續保留最後一題以相容舊紀錄。任一題使用示範答案，整次練習均標記 mock。
- 情境口說明確標示參考句比對，不冒充自由回答 AI 評分；未串接新語音服務。
- 新紀錄 curriculumVersion:4；舊版 XP、星星、解鎖及歷史全部保留。

### v0.4.0 答題與教材改善（歷史）

- 確認答對後顯示 3 秒倒數，自動進下一題；最後一題自動結算。答錯保持原題，顯示作答、正解、完整句意和詞彙／文法解析，讀完再繼續。離開關卡會取消倒數。
- 每關的翻譯、排列、聽力與口說分別取不同教材，避免同一句連續重複。仍為同程度的八組教材輪替，不宣稱已新增更多句數。
- 日文排列題用人工校對的細分詞語，助詞與語尾分開；相同助詞可出現多次，各按鈕獨立管理。例：予約／を／変更／したい／の／です／が／。
- 日文教材以 ruby 顯示漢字上方平假名；涵蓋句子、單字、外語選項、排列及解析。何ですか 使用 なん，何が 使用 なに；讀音為此題庫人工資料，不是任意輸入文字的通用注音引擎。朗讀及評分仍使用原文，不把注音當答案。
- 新紀錄標記 curriculumVersion:3，保留舊版進度、星星、解鎖與歷史，不自動重算成績。

### Google 登入

點右上角原有的圓形頭像／小芽圖示，進入帳號頁使用 Google 登入、登出或管理訪客體驗檔案。首頁不再顯示大型登入卡片；登入錯誤仍會顯示提示。

- 共用 ai-translator 的 Supabase Auth；前端只使用 Publishable Key。沒有建立新 Supabase Project 或修改翻譯資料表／Functions／Secrets。
- PKCE 登入回到 APP 根路徑，適用 GitHub Pages；一次性交換 code 後清除網址參數，取消／過期／網路錯誤顯示繁體中文提示。
- 登入狀態使用 `learning-auth-v1`，不沿用翻譯 APP 的預設 session key。登出使用 `scope: local`，不全域登出同帳號其他 session。
- 訪客使用原本 `learning-demo-v1`；登入帳號使用 `learning-account-v1:<auth.users UUID>`。不自動移轉訪客或家人的紀錄；切換帳號重建練習畫面，避免進度串帳。
- 本機資料不是 RLS／雲端安全儲存。能操作同一個瀏覽器儲存空間的人仍可能讀取資料；清除瀏覽器會遺失進度。Google 驗證不代表已備份進度。
- Auth callback 與隔離測試使用合成 session／攔截 API，不代表真人 Google 授權已完成。

設定：Supabase → Authentication → URL Configuration → Redirect URLs 應包含 **`https://guoer11.github.io/ai-language-learning/`**（含結尾斜線）。只能新增此條目，保留既有 Site URL、所有 redirect URLs 與 Google provider 設定。Google OAuth 原本使用的 Supabase callback 不需替換。若 Google 專案仍為 Testing，家人的 Google 帳號也需要在 Google Auth Platform 的測試使用者名單。

### 課程與練習

- 日文／英文 × 初階／中階／高階。每條路線 1 個世界、2 個單元、8 個關卡，各關 10 題，共 48 關、480 個題目實例。
- src/data.ts 的 course() 建立語言 → 程度 → 世界 → 單元 → 關卡；questions() 提供關卡題目。48 個關卡有不同的主要句子與輪替的生活情境，不代表 480 句完全不同教材。
- 單字選擇、外語選中文、中文選外語、句子排列、聽力選擇、聽音辨字、跟讀與指定句口說。
- 聽力題預設不顯示文字，可重播；裝置無法播放時可選文字提示，不阻擋繼續練習。語音使用裝置 speechSynthesis，聲音品質／可用性依裝置而異。
- Checkpoint 與 BOSS 使用不同例句進行綜合練習。BOSS 目前是綜合題組，不是自然語言 AI 多輪對話。
- 10 題中答對 6～7 題為 1 星、8～9 題為 2 星、全對為 3 星。低於 60% 不解鎖。
- 每題答對 +10 XP，過關額外 +20 XP；最佳星星不重複累加。重玩可繼續累積 XP，沒有體力或每日練習上限。
- 各體驗檔案的 XP、星星、連續天數、每日任務徽章、成就、錯題關卡複習和最近紀錄。
- 舊版 localStorage learning-demo-v1 不清除：保留 XP、歷史、星星與解鎖，並標示舊版紀錄。舊版已解鎖關卡可重新練習新版題目。
- PWA 安裝、靜態課程離線快取、可選擇套用新版本的提示。更新不會在答題途中強制重載。

### 口說：內容比對與發音評估分開

1. 瀏覽器支援時，勾選說明並按「開始語音辨識」，可實際辨識麥克風語音。未勾選不啟動。
2. 聲音可能由瀏覽器送至其服務商處理，並非保證裝置端辨識或離線可用。APP 不將音訊存到 Supabase。
3. 「錄音回放」另使用 MediaRecorder，只暫存於此頁，可播放、刪除；每段最多 60 秒，可無限重錄。結束、離開關卡或切到背景會停止麥克風；離開／刪除時釋放 Blob URL。錄音本身不自動評分。
4. 權限遭拒、不支援辨識或服務連線失敗，可用文字輸入完成內容練習。
5. 內容比對忽略標點、空白、大小寫及平假名／片假名差異，但不做語意理解，也不保證辨識錯字等於使用者說錯。
6. Accuracy / Fluency / Completeness / 總分顯示「尚未評估」，不使用固定假分數冒充真實評估。
7. 紀錄只保存文字、來源（browser / typed / demo）、內容結果、題目 ID；發音分數為 null。填入示範答案會明確標記，不能當成正式口說成績。

Web Speech 相容性與服務端處理說明：[MDN SpeechRecognition](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition)。錄音：[MDN MediaRecorder](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)。

### 尚未完成，不能當成已有

Supabase 雲端進度與 RLS、OpenAI 多輪 AI 對話、Azure 發音評估、完整多年級教材與更多世界。訪客體驗檔案可直接切換；登入帳號的本機區隔也不等於雲端 RLS。

[共用後端設計與待確認事項](docs/backend-design.md)。現有 ai-translator 的表格、Auth、Functions、Secrets 均未因本版修改。完整 Auth redirect allowlist / Secrets metadata 仍需確認，才能安全串接 Google 登入與後端。

### 開發與驗證

Node.js 24，套件固定版本並提交 package-lock.json。

```sh
npm ci
npm run dev
npm run build
npx playwright install chromium
npm test
```

Playwright 有手機／桌面案例，涵蓋課程唯一性、五題流程、星星分級、獨立檔案、舊紀錄相容、權限拒絕、辨識文字、錄音資源清理與 PWA 離線。語音測試使用瀏覽器 API 替身驗證生命週期，不代表已在 iPhone 真實測過辨識或錄音品質。詳細見 [驗證紀錄](docs/validation.md)。

### 部署

GitHub Pages：`https://guoer11.github.io/ai-language-learning/`。

PR 執行建置／測試；main 通過後部署，Vite base 為 /ai-language-learning/。Pages Source 必須選 GitHub Actions。v0.1.0 已安裝者若仍看到舊版，先關閉所有此 APP 分頁及主畫面視窗後重開，不需要清除學習資料。
