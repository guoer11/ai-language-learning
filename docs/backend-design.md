# 共用後端設計提案（未套用）

## 2026-09-21 實際唯讀檢查

- GitHub main 基準：`629991f3490be5b35de243a69ff5fa8951f6f762`（Initial commit），只有 README.md；未找到 AGENTS.md 或既有應用程式。
- ai-translator：專案 `mflhfttirywdsqvjhvhl`，ACTIVE_HEALTHY，Postgres 17。未新增專案。
- public 表：`translator_allowed_users`（4 筆）、`translator_session_quota`（1 筆）、`translator_glossary`（133 筆）。全部已啟用 RLS，pg_policies 查詢無 public policies；既有程式透過伺服器權限存取。
- public Function：`translator_take_session`，SECURITY INVOKER。
- Edge Function：`realtime-session`，version 23，ACTIVE，verify_jwt=false；程式內透過 `/auth/v1/user` 驗證登入，再查 translator_allowed_users 白名單。此檢查不代表全面安全稽核。
- Authentication：auth.identities 可見 3 筆 Google provider 紀錄；查詢未讀取使用者 email、token 或其他個資。auth schema 未查得 application trigger。
- 程式引用的環境變數名稱：OPENAI_API_KEY、SUPABASE_URL、SUPABASE_SERVICE_ROLE_KEY、OPENAI_REALTIME_MODEL、OPENAI_REALTIME_TAB_MODEL、ALLOWED_ORIGINS。**這只證明程式引用，不證明每個 Secret 已設定，也不代表完整 Secret 清單。**
- 目前 connector 不提供 Auth provider configuration / redirect allowlist / Edge Secrets metadata listing。未讀取或輸出 Secret 值；正式串接前仍需確認這些設定。
- 未變更任何遠端資料表、政策、函式、Auth、Secrets、Storage 或翻譯白名單。

## 第一版界線

前端使用本機 `learning-demo-v1` 儲存結構，僅供 UI 體驗，不呼叫 Supabase / OpenAI / Azure。體驗檔案不是身分驗證，也不是安全隔離；同一瀏覽器可切換。正式多人帳號和雲端保存需在下一階段實作。模擬進度不得直接當成正式成績匯入。

## 提議的關聯表

所有新表及 SQL 函式使用 learning_ 前綴；Edge Function 使用 learning-。UUID PK 預設 gen_random_uuid()，user_id 一律 uuid REFERENCES auth.users(id)。時間 timestamptz。以下僅設計，沒有 migration 自動執行。

| 表 | 主要欄位 / 約束 | 權限 |
|---|---|---|
| learning_profiles | user_id PK；display_name、avatar、timezone（預設 Asia/Taipei） | 本人 SELECT；本人僅更新顯示欄位 |
| learning_memberships | user_id PK、enabled、created_at | 本人唯讀；服務端維護家庭存取權 |
| learning_languages | id、code UNIQUE（ja/en）、name | 已授權使用者讀取 |
| learning_levels | id、language_id FK、code、position；UNIQUE(language_id,code) | 已授權使用者讀取 |
| learning_worlds | id、level_id FK、title、position；UNIQUE(level_id,position) | 已授權使用者讀取 |
| learning_units | id、world_id FK、title、position；UNIQUE(world_id,position) | 已授權使用者讀取 |
| learning_lessons | id、unit_id FK、kind（normal/checkpoint/boss）、position、pass_threshold | 已授權使用者讀取 |
| learning_questions | id、lesson_id FK、type、prompt、public_payload jsonb、position、version | 已授權使用者讀取；正解不放 public_payload |
| learning_question_answers | question_id PK FK、version、answer/rubric jsonb | RLS 開啟、無 client policy，僅服務端讀取 |
| learning_progress | user_id + lesson_id 複合 PK、best_stars CHECK 0..3、best_score CHECK 0..100、completed_at、last_attempt_at | 本人 SELECT，僅服務端寫入 |
| learning_attempts | id、user_id、lesson_id、client_request_id、started_at、completed_at、score、xp、stars、source；UNIQUE(user_id,client_request_id) | 本人 SELECT，服務端評分/寫入 |
| learning_question_attempts | id、attempt_id、user_id、question_id、recognized_text、content_score、pronunciation_accuracy/fluency/completeness/total nullable、errors jsonb、created_at | 本人 SELECT，服務端寫入；(attempt_id,user_id) 複合 FK 對應 attempts |
| learning_words | id、language_id、word、meaning、reading、tags jsonb | 已授權使用者讀取 |
| learning_weaknesses | user_id + question_id 複合 PK、wrong_count、last_practiced_at、next_review_at | 本人 SELECT，服務端寫入 |
| learning_achievements | id、code UNIQUE、title、criteria jsonb | 已授權使用者讀取 |
| learning_user_achievements | user_id + achievement_id 複合 PK、earned_at | 本人 SELECT，服務端寫入 |
| learning_daily_activity | user_id + activity_date(date) 複合 PK、completed_count、xp | 本人 SELECT，服務端寫入 |
| learning_daily_rewards | user_id + activity_date + reward_code 複合 PK、awarded_at | 本人 SELECT，服務端寫入；每日任務不得鎖住一般練習 |

課程循序 Language → Level → World → Unit → Lesson → Question。前端目前各語言 / 程度提供 1 個 world、8 個示範關卡，每關 3 題。正式 curriculum 必須建立明確版本與題目 ID，避免更改題庫導致舊紀錄錯配。課程刪除以封存優先，個人紀錄保留所用題目版本。

## RLS 與授權

每張 public 表都啟用 RLS，明確撤銷預設 client grants 後，只開放必要 SELECT 與 profile 指定欄位 UPDATE。個人 SELECT predicate 同時驗證 `(select auth.uid()) = user_id` 與 learning membership enabled；UPDATE 必須有 USING + WITH CHECK，禁止重新指定 user_id。membership 表本人 SELECT policy 只檢查本人（避免查自己造成 recursive policy），無 client 寫入。

不要授權 client 改寫 XP / 星星 / 解鎖。正式 learning-submit-attempt 驗證 auth、membership、題目版本與關卡先決條件，在一次資料庫 transaction 內結算；以 client_request_id UNIQUE 防止重送領獎。每次新練習可獲 XP，最佳星星以 MAX 更新，星星總數不能把重玩重複累加。每日 activity_date 由伺服器按 profile timezone 計算，streak 支援今天尚未練習而昨天有練習的情況。

RLS 驗證要使用 A / B 兩個真實測試帳號及匿名 client：A 不能查 B 紀錄、不能改 user_id、匿名不能查個人表、撤銷會員後禁止讀寫、不能自行增加 XP。在未具備測試環境前不宣稱 RLS 已驗證。

參考：[Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)、[Column Level Security](https://supabase.com/docs/guides/database/postgres/column-level-security)。

## Auth / Secret 的隔離方案

沿用同一 auth.users，新增 learning_memberships 由管理端選入家庭 UUID，不修改 translator_allowed_users 或複用其 quota。Google OAuth redirect allowlist 只新增學習 APP 的精確 callback URL，保留翻譯 APP 所有現有地址及 site URL。學習 APP 的 auth storage key 使用獨立名稱，避免相同 origin / domain 下互相登入登出影響。

尚未加入前端環境變數；將來僅允許 VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY，任何 Secret / Service Role / OpenAI / Azure key 不得用 VITE_。

新 server secrets 建議 LEARNING_OPENAI_API_KEY、LEARNING_AZURE_SPEECH_KEY、LEARNING_AZURE_SPEECH_REGION、LEARNING_ALLOWED_ORIGINS。先確認既有名稱再新增；不重設 OPENAI_API_KEY / ALLOWED_ORIGINS。應用程式專屬 CORS、白名單與暫態併發防護，不能把服務保護變成每日學習上限。

## 未來 API 與語音資料

- learning-transcribe：auth + learning membership 驗證，短音訊以 multipart 暫態處理，回傳辨識文字與 request ID。
- learning-assess：比對目標句內容，另呼叫 Azure 評估發音。提供 content_correct、errors 以及 pronunciation nullable；缺服務時回傳 unavailable，不能用 ASR 或固定數字冒充發音分數。
- learning-boss：根據語意允許合理回答；多輪對話狀態含 user_id / lesson_id，授權隔離，回合結束評估內容理解、回答適切度、發音、流暢度。Azure 未完成時相關維度 null。
- learning-submit-attempt：伺服器驗證、評分、transaction 結算；無限重試，但同一提交 request 不能重複領 XP。
- 錄音預設僅在瀏覽器 / Edge 記憶體存在，完成或錯誤後終止 tracks、釋放 Blob / object URL；不建立 Storage bucket、不永久保存音訊。文字、分數、錯誤、日期與題目 ID 才進 DB。不得把 raw audio、token、完整對話寫進 Edge log。服務商本身的資料保留設定需另查。

## 上線前待確認

完整 Auth 設定、redirect allowlist、Secrets 名稱清單，以及存量函式/表 snapshot。實際串接前重新唯讀查驗（不能以此報告替代最新狀態），再產生 learning-only migration、RLS 測試與 advisors 檢查。Supabase changelog.md 在本次工具回傳不支援 markdown content type，shell 抓取逾時，尚未成功檢查 breaking changes；下一階段實作前補查。
