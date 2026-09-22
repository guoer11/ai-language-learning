import { createClient } from "@supabase/supabase-js";

// Public project configuration only. Never place server/secret keys here.
export const supabaseUrl = "https://mflhfttirywdsqvjhvhl.supabase.co";
export const authStorageKey = "learning-auth-v1";
export const supabase = createClient(
  supabaseUrl,
  "sb_publishable_HoBklXdtiYtbpRa0T_qwBg_9gqMd0BT",
  {
    auth: {
      storageKey: authStorageKey,
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
    },
    global: {
      fetch: async (input, init) => {
        const controller = new AbortController();
        const abort = () => controller.abort();
        if (init?.signal?.aborted) abort();
        init?.signal?.addEventListener("abort", abort, { once: true });
        const timer = setTimeout(abort, 12000);
        try {
          return await fetch(input, { ...init, signal: controller.signal });
        } finally {
          clearTimeout(timer);
          init?.signal?.removeEventListener("abort", abort);
        }
      },
    },
  },
);

export function loginReturnUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

// A single promise prevents a StrictMode double mount from exchanging a one-use code twice.
let initialization: ReturnType<typeof initialize> | undefined;
async function initialize() {
  const url = new URL(window.location.href);
  const hash = new URLSearchParams(url.hash.slice(1));
  const code = url.searchParams.get("code");
  const oauthError = url.searchParams.get("error") || hash.get("error");
  if (code || oauthError) {
    window.history.replaceState({}, "", loginReturnUrl());
    if (oauthError)
      throw new Error(
        "這次 Google 登入未完成。可以再試一次，或先使用訪客模式。",
      );
    const { error } = await supabase.auth.exchangeCodeForSession(code!);
    if (error)
      throw new Error(
        "登入連結已失效或瀏覽器狀態已改變，請在同一個瀏覽器重新登入。",
      );
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("無法恢復登入狀態，請重新登入。");
  if (!data.session) return null;
  const verified = await supabase.auth.getUser();
  if (verified.error)
    throw new Error("無法確認登入狀態。請連上網路後重試；訪客練習仍可使用。");
  return verified.data.user;
}
export function initializeAuth() {
  return (initialization ??= initialize());
}
