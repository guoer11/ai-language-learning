# 第一版驗證

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
