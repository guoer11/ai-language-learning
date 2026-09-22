# 第一版驗證

## v0.4.0 答題／注音驗證

建置通過；手機與桌面共 42 案例。新增與更新的檢查包含：答對前 2 秒仍停留、3 秒後自動下一題、答錯停留 10 秒仍保留解析、離開關卡取消倒數；全對最後一題自動結算；細分排列中的重複助詞；每關翻譯／排列／聽力／口說教材不同；所有日文教材及日文選項的漢字都有讀音資料；舊進度保留，新紀錄使用 curriculumVersion:3。

漢字讀音以人工題庫標註，處理「何ですか」的 なん 與「何が」的 なに。不是任意使用者輸入的通用日文注音或文法判定服務。既有登入、語音 API 替身、錄音清理與離線流程仍保留驗證。

## v0.3.0 登入驗證

新增手機／桌面各 7 項登入測試：Google PKCE 與正確回跳 URL、一次性 callback exchange 與重載還原、帳號與訪客進度區隔、另一帳號不繼承紀錄、取消登入與清除 URL 錯誤參數、過期 code 不顯示成功、登出伺服器失敗的本機清理與提示。確認登出要求為 scope=local，翻譯 APP 的預設 session key 未被更動。

本節使用合成帳號與攔截 Auth API，未使用真實 Google 憑證；真實 Google 授權、正式 Redirect URLs 白名單與 iPhone 主畫面登入仍需完成驗證。未新增或驗證 learning_ 雲端資料表／RLS。

## v0.2.0 驗證

`npm run build` 通過。Playwright 手機與桌面各 13 案例，共 26 項通過，涵蓋：48 個不同主要句子／240 個題目 ID、各選擇題 4 個不重複選項、1／2／3 星、五題完整流程、舊紀錄保留、家庭檔案隔離、弱點清除、累計星星、英文高階與手機寬度、瀏覽器辨識先取得同意、權限拒絕與手動替代、錄音回放 Blob 刪除、離開關卡停止 tracks、晚到的權限授予仍會立即停止 tracks，以及斷網後的 PWA 重載。

語音辨識／錄音使用可控制的 API 替身測試程式生命週期。iPhone Safari 的實際發音辨識率、麥克風裝置品質、音訊格式播放仍須實機驗證，不能以自動化通過宣稱跨裝置語音品質一致。

下列為保留的 v0.1.0 歷史驗證紀錄。

2026-09-21：`npm run build` 成功；TypeScript strict 編譯通過。Playwright Chromium 手機模擬（iPhone 13 尺寸）與桌面，各 5 個測試，全數通過：

1. 完整答題→模擬口說→結算→下一關；重整保存；新增家人檔案不繼承進度。
2. 失敗不解鎖；弱點關卡重練全對後移出複習。
3. 英文高階與日文初階路徑不同；安裝說明開關；手機無橫向溢出。
4. 重玩繼續獲得 XP，最佳星星不重複累加。
5. Service Worker 控制頁面後，可離線重新載入。

本地預設 Playwright CDN 下載不通，改以暫存 npm Chromium binary 執行同一套 Playwright 測試，透過 LEARNING_CHROMIUM_PATH 指定，沒有改弱測試斷言。CI 使用標準 Playwright Chromium 安裝。實際 iPhone Safari 麥克風、Google OAuth、Azure、OpenAI 不在本版驗證範圍，也尚未串接。

Supabase 只做 schema / provider aggregate / function source 的唯讀檢查，沒有寫入；RLS 設計尚未部署，不能宣稱已通過正式帳號隔離測試。
