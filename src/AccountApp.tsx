import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { LogIn, LogOut, UserRound } from "lucide-react";
import App from "./App";
import { initializeAuth, loginReturnUrl, supabase } from "./auth";

export default function AccountApp() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    let initialized = false;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!alive || !initialized || event === "INITIAL_SESSION") return;
      // No Supabase awaits inside this callback: auth callbacks run under a lock.
      setUser(session?.user ?? null);
    });
    initializeAuth()
      .then((value) => {
        if (alive) setUser(value);
      })
      .catch((e: unknown) => {
        if (alive)
          setError(
            e instanceof Error ? e.message : "登入暫時無法使用，請稍後重試。",
          );
      })
      .finally(() => {
        initialized = true;
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      if (!navigator.onLine)
        throw new Error("Google 登入需要網路，請連線後再試。");
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: loginReturnUrl(),
          queryParams: { prompt: "select_account" },
          skipBrowserRedirect: true,
        },
      });
      if (authError || !data.url)
        throw new Error("目前無法開啟 Google 登入，請稍後重試。");
      window.location.assign(data.url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "登入失敗，請重試。");
      setBusy(false);
    }
  }
  async function logout() {
    setBusy(true);
    setError("");
    try {
      // Revoke this app's current session only, not translator or other devices.
      const { error: authError } = await supabase.auth.signOut({
        scope: "local",
      });
      if (authError) throw authError;
      setUser(null);
    } catch {
      setError(
        "伺服器未能確認登出，請重新整理確認狀態。若已返回訪客模式，下次使用請重新登入。",
      );
    } finally {
      setBusy(false);
    }
  }
  const displayName = String(
    user?.user_metadata?.full_name || user?.user_metadata?.name || "冒險家",
  ).slice(0, 40);
  const accountPanel = (
    <section className="account-panel panel" aria-label="Google 帳號">
      <div className="account-heading">
        <UserRound size={22} />
        <div>
          <strong>
            {user ? `${displayName}，歡迎回來` : "登入你的冒險帳號"}
          </strong>
          <p>
            {user ? user.email : "使用 Google 登入；也可以先以訪客身分練習。"}
          </p>
        </div>
      </div>
      <p className="muted">
        {user
          ? "已登入 Google。學習進度目前依帳號儲存在這台裝置，尚未同步至雲端。"
          : "訪客進度保留在原本的體驗檔案，登入後會使用獨立的帳號進度。"}
      </p>
      <button
        className={user ? "secondary" : "primary"}
        disabled={busy || !ready}
        onClick={user ? logout : login}
      >
        {user ? <LogOut size={18} /> : <LogIn size={18} />}
        {busy ? "處理中…" : user ? "登出這個帳號" : "使用 Google 登入"}
      </button>
      {error && (
        <p className="account-error" role="alert">
          {error}
        </p>
      )}
      {user && (
        <p className="muted">
          換家人使用時，請先登出，再登入另一個 Google
          帳號。清除瀏覽器資料仍會移除本機進度。
        </p>
      )}
    </section>
  );
  if (!ready)
    return (
      <main className="auth-loading" role="status">
        🌱 正在確認登入狀態…
      </main>
    );
  return (
    <App
      key={user?.id || "guest"}
      account={user ? { id: user.id, name: displayName } : undefined}
      accountPanel={accountPanel}
    />
  );
}
