# 第一版驗證

2026-09-21：`npm run build` 成功；TypeScript strict 編譯通過。Playwright Chromium 手機模擬（iPhone 13 尺寸）與桌面，各 5 個測試，全數通過：

1. 完整答題→模擬口說→結算→下一關；重整保存；新增家人檔案不繼承進度。
2. 失敗不解鎖；弱點關卡重練全對後移出複習。
3. 英文高階與日文初階路徑不同；安裝說明開關；手機無橫向溢出。
4. 重玩繼續獲得 XP，最佳星星不重複累加。
5. Service Worker 控制頁面後，可離線重新載入。

本地預設 Playwright CDN 下載不通，改以暫存 npm Chromium binary 執行同一套 Playwright 測試，透過 LEARNING_CHROMIUM_PATH 指定，沒有改弱測試斷言。CI 使用標準 Playwright Chromium 安裝。實際 iPhone Safari 麥克風、Google OAuth、Azure、OpenAI 不在本版驗證範圍，也尚未串接。

Supabase 只做 schema / provider aggregate / function source 的唯讀檢查，沒有寫入；RLS 設計尚未部署，不能宣稱已通過正式帳號隔離測試。
