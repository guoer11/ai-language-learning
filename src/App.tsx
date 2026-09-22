import { useEffect, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import OralPractice, { type OralResult } from "./OralPractice";
import {
  BookOpen,
  Map as MapIcon,
  Flame,
  Star,
  ChevronRight,
  ArrowLeft,
  Volume2,
  Mic,
  Trophy,
  RotateCcw,
  BarChart3,
  Home,
  X,
  Check,
  LockKeyhole,
  Sparkles,
  Plus,
  Download,
  Compass,
  Leaf,
} from "lucide-react";
import {
  languages,
  levels,
  lessonNames,
  questions,
  course,
  lessonTitle,
  starsForScore,
  pathKey,
  bestStars,
  readSave,
  streak,
  today,
  type Language,
  type Level,
  type Attempt,
} from "./data";
type Screen =
  | "home"
  | "levels"
  | "map"
  | "lesson"
  | "result"
  | "review"
  | "stats"
  | "profiles";
export default function App({
  account,
  accountPanel,
  accountError,
}: {
  account?: { id: string; name: string };
  accountPanel?: ReactNode;
  accountError?: string;
}) {
  const storageKey = account
    ? `learning-account-v1:${account.id}`
    : "learning-demo-v1";
  const [save, setSave] = useState(() => {
    const saved = readSave(storageKey);
    if (!account) return saved;
    const profile = saved.profiles.find((p) => p.id === account.id);
    return {
      version: 1 as const,
      active: account.id,
      profiles: [
        profile || {
          id: account.id,
          name: account.name,
          avatar: "🌱",
          attempts: [],
        },
      ],
    };
  });
  const [screen, setScreen] = useState<Screen>("home");
  const [language, setLanguage] = useState<Language>("ja");
  const [level, setLevel] = useState<Level>("beginner");
  const [lesson, setLesson] = useState(0);
  const [qi, setQi] = useState(0);
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState<string[]>([]);
  const [oral, setOral] = useState<OralResult | null>(null);
  const [showAudioText, setShowAudioText] = useState(false);
  const [result, setResult] = useState<Attempt | null>(null);
  const [name, setName] = useState("");
  const [notice, setNotice] = useState("");
  const [install, setInstall] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();
  const profile = save.profiles.find((p) => p.id === save.active)!;
  const path = pathKey(language, level);
  const meta = languages[language];
  const currentWorld = course(language, level).worlds[0];
  const mapLessons = currentWorld.units.flatMap((u) => u.lessons);
  const qs = questions(language, level, lesson);
  const q = qs[qi];
  const xp = profile.attempts.reduce((n, a) => n + a.xp, 0);
  const allStars = Object.values(
    profile.attempts.reduce<Record<string, number>>(
      (r, a) => ({
        ...r,
        [`${a.path}:${a.lesson}`]: Math.max(
          r[`${a.path}:${a.lesson}`] || 0,
          a.stars,
        ),
      }),
      {},
    ),
  ).reduce((a, b) => a + b, 0);
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(save));
    } catch {
      setNotice("此瀏覽器無法儲存進度，關閉後可能遺失。");
    }
  }, [save, storageKey]);
  useEffect(() => {
    window.scrollTo(0, 0);
    window.speechSynthesis?.cancel();
  }, [screen, qi]);
  useEffect(() => {
    const fn = () => setOnline(navigator.onLine);
    window.addEventListener("online", fn);
    window.addEventListener("offline", fn);
    return () => {
      window.removeEventListener("online", fn);
      window.removeEventListener("offline", fn);
    };
  }, []);
  const go = (s: Screen) => {
    setScreen(s);
    setNotice("");
  };
  function start(n: number) {
    setLesson(n);
    setQi(0);
    setAnswer("");
    setOrder([]);
    setChecked(false);
    setCorrect(0);
    setWrong([]);
    setOral(null);
    setShowAudioText(false);
    setResult(null);
    go("lesson");
  }
  function speak() {
    if (!window.speechSynthesis) {
      setNotice("此瀏覽器不支援朗讀，仍可完成模擬練習。");
      return;
    }
    const u = new SpeechSynthesisUtterance(q.target);
    u.lang =
      q.label === "中文選外語"
        ? "zh-TW"
        : language === "ja"
          ? "ja-JP"
          : "en-US";
    u.rate = 0.85;
    u.onerror = () => setNotice("語音暫時無法播放，請確認裝置有安裝對應語音。");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }
  const isCorrect =
    q.type === "choice"
      ? answer === q.answer
      : q.type === "order"
        ? order.map((i) => q.tokens![i]).join("|") === q.tokens!.join("|")
        : oral?.contentCorrect === true;
  function check() {
    if (checked) return;
    setChecked(true);
    if (isCorrect) setCorrect((v) => v + 1);
    else setWrong((w) => [...w, q.id]);
  }
  function next() {
    if (qi < qs.length - 1) {
      setQi(qi + 1);
      setChecked(false);
      setAnswer("");
      setOrder([]);
      setOral(null);
      setShowAudioText(false);
      return;
    }
    const score = Math.round((correct / qs.length) * 100);
    const passed = score >= 60;
    const stars = starsForScore(score);
    const record: Attempt = {
      id: crypto.randomUUID(),
      path,
      lesson,
      date: today(),
      score,
      xp: passed ? 20 + correct * 10 : correct * 10,
      stars,
      wrong,
      mock: oral?.source === "demo",
      curriculumVersion: 2,
      oral: oral ? { questionId: q.id, ...oral } : undefined,
    };
    setSave((s) => ({
      ...s,
      profiles: s.profiles.map((p) =>
        p.id === s.active ? { ...p, attempts: [...p.attempts, record] } : p,
      ),
    }));
    setResult(record);
    go("result");
  }
  const completed = lessonNames.filter(
    (_, i) => bestStars(profile, path, i) > 0,
  ).length;
  const nextLesson = lessonNames.findIndex(
    (_, i) => !bestStars(profile, path, i),
  );
  const nav = [
    { s: "home" as Screen, icon: Home, label: "探索" },
    { s: "map" as Screen, icon: MapIcon, label: "冒險地圖" },
    { s: "review" as Screen, icon: RotateCcw, label: "弱點複習" },
    { s: "stats" as Screen, icon: BarChart3, label: "我的成長" },
  ];
  const recentWrong = [
    ...new Map(
      profile.attempts
        .filter((a) => a.wrong.length)
        .map((a) => [`${a.path}:${a.lesson}`, a]),
    ).values(),
  ].filter((a) => {
    const latest = profile.attempts
      .filter((b) => b.path === a.path && b.lesson === a.lesson)
      .at(-1);
    return !!latest?.wrong.length;
  });
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            go("home");
          }}
        >
          <span className="brand-icon">
            <Leaf />
          </span>
          <span>
            語言小島<small>LINGO ISLAND</small>
          </span>
        </a>
        <div className="side-caption">讓每一句話，成為新的風景</div>
        <nav>
          {nav.map((n) => (
            <button
              key={n.s}
              className={screen === n.s ? "nav active" : "nav"}
              onClick={() => go(n.s)}
            >
              <n.icon size={21} />
              {n.label}
              {screen === n.s && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="side-note">
          <span>🌱</span>
          <strong>照自己的步調就好</strong>
          <p>
            沒有體力限制。
            <br />
            每一次練習，都是前進。
          </p>
        </div>
        <button className="profile-button" onClick={() => go("profiles")}>
          <span className="avatar">{profile.avatar}</span>
          <span>
            {profile.name}
            <small>
              {account ? "Google 帳號 · 管理" : "本機體驗檔案 · 切換"}
            </small>
          </span>
          <ChevronRight size={16} />
        </button>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="mobile-brand">🌱 語言小島</span>
          <span className="breadcrumb">
            我的學習旅程 <ChevronRight size={14} />{" "}
            {screen === "home"
              ? "探索小島"
              : screen === "levels"
                ? "選擇程度"
                : screen === "profiles"
                  ? "帳號與學習檔案"
                  : meta.name + "冒險"}
          </span>
          <div className="top-stats">
            <span>
              <Flame size={18} className="orange" />
              {streak(profile)} <em>天</em>
            </span>
            <span>
              <Star size={18} className="gold" />
              {allStars}
            </span>
            <span className="xp-pill">⚡ {xp} XP</span>
            <button
              className="tiny-avatar"
              onClick={() => go("profiles")}
              aria-label="帳號與登入"
              title={account ? "管理帳號與登出" : "Google 登入與體驗檔案"}
            >
              {profile.avatar}
            </button>
          </div>
        </header>
        <main>
          <div className="demo-bar">
            <span>
              <span className="status-dot" />
              {account
                ? "已登入 · 進度暫存本機，尚未雲端同步"
                : "訪客模式 · 進度存於此瀏覽器"}
            </span>
            <button onClick={() => setInstall(true)}>
              <Download size={14} />
              安裝到主畫面
            </button>
          </div>
          {needRefresh && (
            <div className="notice" role="status">
              新版本已就緒，已完成的練習不會遺失。
              {screen === "lesson" ? (
                <span> 請先完成或離開這一關再更新。</span>
              ) : (
                <button
                  className="text-button"
                  onClick={() => updateServiceWorker(true)}
                >
                  更新並重新開啟
                </button>
              )}
            </div>
          )}
          {!online && (
            <div className="notice">目前離線，仍可使用已快取的體驗課程。</div>
          )}
          {notice && (
            <div role="status" className="notice">
              {notice}
            </div>
          )}
          {accountError && (
            <p className="account-error" role="alert">
              {accountError}
            </p>
          )}
          {screen === "profiles" && accountPanel}
          {screen === "home" && (
            <>
              <section className="hero">
                <div className="hero-copy">
                  <div className="eyebrow">YOUR NEXT ADVENTURE STARTS HERE</div>
                  <h1>
                    每天一點點，
                    <br />
                    世界<span>更靠近。</span>
                  </h1>
                  <p>
                    學一句問候，開啟一段旅程。
                    <br />
                    今天，想去哪一座語言小島？
                  </p>
                  <button className="primary" onClick={() => go("map")}>
                    開始今天的冒險 <ChevronRight size={18} />
                  </button>
                  <div className="hero-foot">
                    <span>✦ 無限次練習</span>
                    <span>✦ 用自己的步調</span>
                  </div>
                </div>
                <Island />
              </section>
              <div className="section-head">
                <div>
                  <div className="eyebrow">CHOOSE YOUR ISLAND</div>
                  <h2>選一種語言，出發吧</h2>
                </div>
                <span className="muted">兩座小島，無限可能</span>
              </div>
              <div className="language-grid">
                {(["ja", "en"] as Language[]).map((l) => (
                  <button
                    aria-label={`${languages[l].name} ${languages[l].island} 開始探索`}
                    className={"language-card " + languages[l].color}
                    key={l}
                    onClick={() => {
                      setLanguage(l);
                      go("levels");
                    }}
                  >
                    <div className="language-art">
                      <span className="sun" />
                      <span className="mountain" />
                      <span className="island-symbol">
                        {l === "ja" ? "🌸" : "🎈"}
                      </span>
                      <span className="hello">{languages[l].hello}</span>
                    </div>
                    <div className="language-info">
                      <span className="flag">{languages[l].flag}</span>
                      <div>
                        <h3>
                          {languages[l].name}
                          <small>{languages[l].island}</small>
                        </h3>
                        <p>{languages[l].sub}</p>
                      </div>
                      <span className="round-arrow">
                        <ChevronRight />
                      </span>
                    </div>
                    <div className="card-footer">
                      <span>3 個程度 · 逐步闖關</span>
                      <span>開始探索 →</span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bottom-grid">
                <section className="panel">
                  <div className="section-head">
                    <h3>🎯 今天的小目標</h3>
                    <span className="tag">獎勵任務</span>
                  </div>
                  <p>完成一關，為今天的自己鼓掌。</p>
                  <div className="quest">
                    <span>完成 1 次練習</span>
                    <strong>
                      {profile.attempts.some((a) => a.date === today())
                        ? "1"
                        : "0"}{" "}
                      / 1
                    </strong>
                  </div>
                  <div className="progress">
                    <i
                      style={{
                        width: profile.attempts.some((a) => a.date === today())
                          ? "100%"
                          : "0%",
                      }}
                    />
                  </div>
                  <small className="muted">
                    完成任務獲得「今日啟程」徽章，還能繼續無限練習。
                  </small>
                </section>
                <section className="panel tip">
                  <span className="tip-icon">💬</span>
                  <div>
                    <h3>勇敢開口，比完美更重要</h3>
                    <p>
                      聽一聽、說一說，再試一次。
                      <br />
                      每一小步，都值得被看見。
                    </p>
                    <button
                      className="text-button"
                      onClick={() => {
                        setLanguage("en");
                        setLevel("beginner");
                        start(0);
                      }}
                    >
                      體驗一堂課 <ChevronRight size={15} />
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}
          {screen === "levels" && (
            <>
              <button className="back" onClick={() => go("home")}>
                <ArrowLeft size={18} />
                回到語言選擇
              </button>
              <div className="page-title">
                <span className="big-emoji">{meta.flag}</span>
                <div className="eyebrow">{meta.island} · 選擇起點</div>
                <h1>找到舒服的學習步調</h1>
                <p>每種程度都可以自由探索，隨時切換。</p>
              </div>
              <div className="level-grid">
                {levels.map((l, i) => (
                  <button
                    key={l.id}
                    className="level-card"
                    onClick={() => {
                      setLevel(l.id);
                      go("map");
                    }}
                  >
                    <span className="big-emoji">{l.icon}</span>
                    <span className="eyebrow">LEVEL 0{i + 1}</span>
                    <h2>{l.name}</h2>
                    <p>{l.sub}</p>
                    <div className="level-topics">
                      {i === 0
                        ? "問候・日常單字・簡單句子"
                        : i === 1
                          ? "生活情境・完整句子・交流"
                          : "觀點表達・議題討論・理解"}
                    </div>
                    <span className="text-button">
                      進入小島 <ChevronRight size={18} />
                    </span>
                  </button>
                ))}
              </div>
              <p className="center muted">
                每個程度提供世界 1、2 個單元、8 關與 40 題練習，之後持續擴充。
              </p>
            </>
          )}
          {screen === "map" && (
            <>
              <button className="back" onClick={() => go("levels")}>
                <ArrowLeft size={18} />
                切換語言程度
              </button>
              <section className={"world-banner " + meta.color}>
                <div>
                  <div className="eyebrow">
                    WORLD 01 · {levels.find((l) => l.id === level)?.name}
                  </div>
                  <h1>
                    {meta.flag} {meta.island} · {currentWorld.title}
                  </h1>
                  <p>
                    {level === "beginner"
                      ? "從問候開始，把勇氣裝進行囊。"
                      : level === "intermediate"
                        ? "走進生活，練習自在交流。"
                        : "聊聊想法，探索不同觀點。"}
                  </p>
                </div>
                <span className="world-icon">
                  {level === "beginner"
                    ? "⛺"
                    : level === "intermediate"
                      ? "🏡"
                      : "🌳"}
                </span>
              </section>
              <div className="map-layout">
                {profile.attempts.some(
                  (a) => a.path === path && a.curriculumVersion !== 2,
                ) && (
                  <p className="legacy-note">
                    已保留舊版的星星與解鎖進度；這次新增的題目，可以重玩關卡補練。
                  </p>
                )}
                <section className="map-panel">
                  <div className="map-top">
                    <strong>冒險路線</strong>
                    <span>{completed} / 8 關完成</span>
                  </div>
                  <div className="trail">
                    {mapLessons.map(({ title, index: i }) => {
                      const stars = bestStars(profile, path, i);
                      const locked = i > 0 && !bestStars(profile, path, i - 1);
                      return (
                        <div className={"trail-stop stop-" + i} key={title}>
                          <button
                            disabled={locked}
                            className={
                              "node " +
                              (locked
                                ? "locked"
                                : stars
                                  ? "finished"
                                  : "available") +
                              (i === 7 ? " boss" : "")
                            }
                            onClick={() => start(i)}
                            aria-label={`${i + 1} ${title}${locked ? " 尚未解鎖" : ""}`}
                          >
                            <span>
                              {locked ? (
                                <LockKeyhole size={25} />
                              ) : stars ? (
                                <Check size={30} />
                              ) : i === 7 ? (
                                <Trophy size={30} />
                              ) : i === 3 ? (
                                <Compass size={30} />
                              ) : i === 0 ? (
                                <BookOpen size={27} />
                              ) : (
                                i + 1
                              )}
                            </span>
                          </button>
                          <div className="node-copy">
                            {(i === 0 || i === 4) && (
                              <p className="unit-label">
                                {currentWorld.units[i === 0 ? 0 : 1].title}
                              </p>
                            )}
                            <span>
                              {i === 7
                                ? "最終挑戰"
                                : i === 3
                                  ? "中途檢查"
                                  : "LESSON " + String(i + 1).padStart(2, "0")}
                            </span>
                            <strong>{title}</strong>
                            <div className={stars ? "stars" : "stars empty"}>
                              {"★".repeat(stars)}
                              {"☆".repeat(3 - stars)}
                            </div>
                          </div>
                          {!locked && !stars && (
                            <span className="start-tag">從這裡出發</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <p className="center muted">🌊 下一座世界，正在準備中</p>
                </section>
                <aside className="map-aside">
                  <section className="panel">
                    <div className="big-emoji">🎒</div>
                    <h3>你的冒險背包</h3>
                    <p>每關 5 題：單字、翻譯、排列、聽力與口說內容比對。</p>
                    <ul>
                      <li>60 分以上即可解鎖下一關</li>
                      <li>答對越多，星星越多</li>
                      <li>沒有次數限制，放心重試</li>
                    </ul>
                    <button
                      className="primary full"
                      onClick={() => start(nextLesson < 0 ? 0 : nextLesson)}
                    >
                      {nextLesson < 0 ? "再次探索" : "繼續冒險"}{" "}
                      <ChevronRight size={17} />
                    </button>
                  </section>
                  <section className="panel soft">
                    <Sparkles />
                    <h3>BOSS 正在等你</h3>
                    <p>
                      BOSS 包含綜合聽力與指定句口說。可自由回答的多輪 AI
                      對話尚未啟用。
                    </p>
                  </section>
                </aside>
              </div>
            </>
          )}
          {screen === "lesson" && (
            <section className="lesson-shell">
              <div className="lesson-top">
                <button
                  className="icon-button"
                  aria-label="離開關卡"
                  onClick={() => go("map")}
                >
                  <X />
                </button>
                <div className="progress">
                  <i style={{ width: `${(qi / qs.length) * 100}%` }} />
                </div>
                <span>
                  {qi + 1} / {qs.length}
                </span>
              </div>
              <div className="lesson-header">
                <span className="tag">{q.label}</span>
                <h1>{q.prompt}</h1>
                <p>
                  {q.type === "order"
                    ? q.translation
                    : "慢慢來，這裡可以放心練習。"}
                </p>
              </div>
              {q.type !== "order" && (
                <div className="target">
                  <button
                    className="audio-button"
                    onClick={speak}
                    aria-label="播放裝置語音"
                  >
                    <Volume2 />
                  </button>
                  <div lang={q.label === "中文選外語" ? "zh-Hant" : language}>
                    {!q.audioOnly || checked || showAudioText
                      ? q.target
                      : "先聽聲音，再選答案"}
                  </div>
                  {q.audioOnly && !checked && (
                    <button
                      className="text-button"
                      onClick={() => setShowAudioText((v) => !v)}
                    >
                      {showAudioText
                        ? "隱藏文字提示"
                        : "無法播放？改用文字提示"}
                    </button>
                  )}
                  {q.type === "speaking" && <small>{q.translation}</small>}
                </div>
              )}
              {q.type === "choice" && (
                <div className="options">
                  {q.options?.map((o, i) => (
                    <button
                      disabled={checked}
                      className={
                        "option " +
                        (answer === o ? "selected" : "") +
                        (checked && o === q.answer ? " correct" : "")
                      }
                      key={o}
                      onClick={() => setAnswer(o)}
                    >
                      <span>{i + 1}</span>
                      {o}
                      {answer === o && <Check size={18} />}
                    </button>
                  ))}
                </div>
              )}
              {q.type === "order" && (
                <>
                  <div className="sentence-slots" aria-label="已排列的句子">
                    {order.length ? (
                      order.map((idx, j) => (
                        <button
                          disabled={checked}
                          key={idx}
                          onClick={() =>
                            setOrder(order.filter((_, i) => i !== j))
                          }
                        >
                          {q.tokens![idx]}
                        </button>
                      ))
                    ) : (
                      <span>點選下方詞語，組成句子</span>
                    )}
                  </div>
                  <div className="word-bank">
                    {q
                      .tokens!.map((_, idx) => q.tokens!.length - 1 - idx)
                      .map((idx) => (
                        <button
                          key={idx}
                          disabled={checked || order.includes(idx)}
                          onClick={() => setOrder([...order, idx])}
                        >
                          {q.tokens![idx]}
                        </button>
                      ))}
                  </div>
                  <button
                    className="text-button"
                    disabled={checked}
                    onClick={() => setOrder([])}
                  >
                    重新排列
                  </button>
                </>
              )}
              {q.type === "speaking" && (
                <OralPractice
                  key={q.id}
                  q={q}
                  language={language}
                  locked={checked}
                  onChange={setOral}
                />
              )}
              {checked && (
                <div
                  role="status"
                  className={"feedback " + (isCorrect ? "good" : "bad")}
                >
                  <strong>
                    {isCorrect
                      ? "✓ 做得很好！繼續前進。"
                      : "再練一次就會更熟悉！"}
                  </strong>
                  {!isCorrect && (
                    <p>參考答案：{q.type === "choice" ? q.answer : q.target}</p>
                  )}
                  <p>{q.hint}</p>
                </div>
              )}
              <div className="lesson-actions">
                <span>
                  {checked
                    ? "每次嘗試，都是累積。"
                    : "不需要完美，只需要開始。"}
                </span>
                {checked ? (
                  <button className="primary" onClick={next}>
                    {qi === qs.length - 1 ? "查看學習成果" : "下一題"}
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    className="primary"
                    disabled={
                      q.type === "choice"
                        ? !answer
                        : q.type === "order"
                          ? order.length !== q.tokens!.length
                          : oral === null
                    }
                    onClick={check}
                  >
                    確認答案 <Check size={18} />
                  </button>
                )}
              </div>
            </section>
          )}
          {screen === "result" && result && (
            <section className="result panel">
              <div className="result-badge">{result.stars ? "🏆" : "🌱"}</div>
              <div className="eyebrow">
                {result.stars ? "ADVENTURE COMPLETE" : "KEEP GROWING"}
              </div>
              <h1>
                {result.stars ? "又向世界靠近一步！" : "這次練習，也有收穫。"}
              </h1>
              <p>
                {result.stars
                  ? lesson === 7
                    ? "世界 1 完成！可以回頭挑戰滿星。"
                    : "下一關已解鎖，新的風景等著你。"
                  : "60 分即可過關。沒有次數限制，隨時再挑戰。"}
              </p>
              <div className="result-stars">
                {"★".repeat(result.stars)}
                {"☆".repeat(3 - result.stars)}
              </div>
              <div className="result-metrics">
                <div>
                  <strong>{result.score}%</strong>
                  <span>答題正確率</span>
                </div>
                <div>
                  <strong>+{result.xp}</strong>
                  <span>XP 經驗值</span>
                </div>
                <div>
                  <strong>{streak(profile)}</strong>
                  <span>連續學習天數</span>
                </div>
              </div>
              <p className="mock-label">
                此為本機練習成果。口說僅比對文字內容，尚未評估發音。
              </p>
              <div className="result-actions">
                <button
                  className="primary"
                  onClick={() =>
                    result.stars && lesson < 7 ? start(lesson + 1) : go("map")
                  }
                >
                  {result.stars && lesson < 7 ? "前往下一關" : "回到冒險地圖"}
                  <ChevronRight size={18} />
                </button>
                <button className="secondary" onClick={() => start(lesson)}>
                  <RotateCcw size={17} />
                  再練一次
                </button>
              </div>
            </section>
          )}
          {screen === "review" && (
            <>
              <div className="page-title left">
                <div className="eyebrow">PRACTICE MAKES PROGRESS</div>
                <h1>把不熟悉，練成小超能力</h1>
                <p>答錯的關卡會留在這裡；重新全對完成，即可移出複習清單。</p>
              </div>
              {recentWrong.length ? (
                <div className="review-list">
                  {recentWrong.map((a) => (
                    <button
                      className="panel review-item"
                      key={a.id}
                      onClick={() => {
                        const [l, v] = a.path.split(":");
                        setLanguage(l as Language);
                        setLevel(v as Level);
                        start(a.lesson);
                      }}
                    >
                      <span className="big-emoji">
                        {languages[a.path.split(":")[0] as Language].flag}
                      </span>
                      <div>
                        <h3>
                          {lessonTitle(a.path.split(":")[1] as Level, a.lesson)}
                        </h3>
                        <p>
                          {
                            levels.find((l) => l.id === a.path.split(":")[1])
                              ?.name
                          }{" "}
                          · {a.wrong.length} 題需要練習
                        </p>
                      </div>
                      <ChevronRight />
                    </button>
                  ))}
                </div>
              ) : (
                <section className="empty panel">
                  <span>🌿</span>
                  <h2>目前沒有待複習的關卡</h2>
                  <p>開始一段冒險，我們會幫你記下需要多練習的地方。</p>
                  <button className="primary" onClick={() => go("map")}>
                    去練習
                  </button>
                </section>
              )}
            </>
          )}
          {screen === "stats" && (
            <>
              <div className="page-title left">
                <div className="eyebrow">EVERY LITTLE STEP COUNTS</div>
                <h1>{profile.name}的成長日記</h1>
                <p>進度屬於自己的步調，不用和誰比較。</p>
              </div>
              <div className="stats-grid">
                {[
                  ["⚡", xp, "累積 XP"],
                  ["⭐", allStars, "最佳星星總數"],
                  ["🔥", streak(profile), "連續學習天數"],
                  ["📖", profile.attempts.length, "完成練習次數"],
                ].map(([icon, value, label]) => (
                  <div className="panel stat" key={label}>
                    <span>{icon}</span>
                    <strong>{value}</strong>
                    <p>{label}</p>
                  </div>
                ))}
              </div>
              <section className="panel">
                <h3>🏅 成就收藏</h3>
                <div className="achievements">
                  {[
                    ["🌱", "勇敢啟程", profile.attempts.length > 0],
                    [
                      "🌟",
                      "滿星冒險家",
                      profile.attempts.some((a) => a.stars === 3),
                    ],
                    ["🔥", "三日小火苗", streak(profile) >= 3],
                    [
                      "☀️",
                      "今日啟程",
                      profile.attempts.some((a) => a.date === today()),
                    ],
                  ].map(([icon, title, earned]) => (
                    <div className={earned ? "earned" : ""} key={String(title)}>
                      <span>{icon}</span>
                      <strong>{title}</strong>
                      <small>{earned ? "已獲得" : "尚未獲得"}</small>
                    </div>
                  ))}
                </div>
              </section>
              <section className="panel history">
                <h3>最近的練習</h3>
                {profile.attempts.length ? (
                  profile.attempts
                    .slice(-10)
                    .reverse()
                    .map((a) => (
                      <div className="history-row" key={a.id}>
                        <span>
                          {languages[a.path.split(":")[0] as Language].flag}{" "}
                          {lessonTitle(a.path.split(":")[1] as Level, a.lesson)}
                          <small>
                            {a.date} ·{" "}
                            {a.curriculumVersion === 2
                              ? a.oral?.source === "browser"
                                ? "瀏覽器辨識"
                                : a.oral?.source === "demo"
                                  ? "示範答案"
                                  : "輸入練習"
                              : "舊版模擬紀錄"}
                          </small>
                        </span>
                        <strong>
                          +{a.xp} XP{" "}
                          <small>
                            {a.score}% · {"★".repeat(a.stars) || "繼續加油"}
                          </small>
                        </strong>
                      </div>
                    ))
                ) : (
                  <p className="muted">完成第一關後，就會有你的學習足跡。</p>
                )}
              </section>
            </>
          )}
          {screen === "profiles" && (
            <>
              <div className="page-title">
                <h1>今天是誰來冒險？</h1>
                <p>
                  {account
                    ? "這是目前 Google 帳號的學習檔案，進度暫存於此瀏覽器。"
                    : "本機體驗檔案各自保留進度。這不是登入；同一瀏覽器的人可以互相切換。"}
                </p>
              </div>
              <div className="profile-grid">
                {save.profiles.map((p) => (
                  <button
                    className={
                      "panel profile-card " +
                      (p.id === save.active ? "chosen" : "")
                    }
                    key={p.id}
                    onClick={() => {
                      setSave((s) => ({ ...s, active: p.id }));
                      go("home");
                    }}
                  >
                    <span>{p.avatar}</span>
                    <h3>{p.name}</h3>
                    <p>{p.attempts.reduce((n, a) => n + a.xp, 0)} XP</p>
                    {p.id === save.active && (
                      <span className="tag">目前使用</span>
                    )}
                  </button>
                ))}
              </div>
              {!account && (
                <form
                  className="panel new-profile"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!name.trim()) return;
                    const id = crypto.randomUUID();
                    setSave((s) => ({
                      ...s,
                      active: id,
                      profiles: [
                        ...s.profiles,
                        {
                          id,
                          name: name.trim().slice(0, 20),
                          avatar: ["🐻", "🐱", "🦊", "🐼"][
                            s.profiles.length % 4
                          ],
                          attempts: [],
                        },
                      ],
                    }));
                    setName("");
                    go("home");
                  }}
                >
                  <label htmlFor="profile-name">新增體驗檔案</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={20}
                    placeholder="輸入暱稱"
                    required
                  />
                  <button className="primary">
                    <Plus size={17} />
                    新增
                  </button>
                </form>
              )}
              <p className="center muted">
                跨裝置同步尚未啟用。清除瀏覽器資料將移除本機進度。
              </p>
            </>
          )}
          <footer>
            語言小島 <span>·</span> 一起學習，一起看見更大的世界。
            <small>v0.3.1 · 學習體驗版</small>
          </footer>
        </main>
        <nav className="mobile-nav">
          {nav.map((n) => (
            <button
              key={n.s}
              className={screen === n.s ? "active" : ""}
              onClick={() => go(n.s)}
            >
              <n.icon size={21} />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {install && (
        <div className="modal-backdrop" onClick={() => setInstall(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-label="安裝到主畫面"
            className="modal panel"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close icon-button"
              aria-label="關閉"
              onClick={() => setInstall(false)}
            >
              <X />
            </button>
            <span className="big-emoji">🏝️</span>
            <h2>把小島放進口袋</h2>
            <p>
              <strong>iPhone / iPad</strong>
              <br />
              使用 Safari 開啟網頁，點選「分享」→「加入主畫面」。
            </p>
            <p>
              <strong>Android / 電腦</strong>
              <br />
              在支援的瀏覽器選單選擇「安裝應用程式」或「新增至主畫面」。
            </p>
            <p className="muted">
              第一次載入需要網路。體驗進度僅儲存在目前瀏覽器；安裝後的資料是否共用，依裝置而異。
            </p>
            <button
              autoFocus
              className="primary full"
              onClick={() => setInstall(false)}
            >
              知道了
            </button>
          </section>
        </div>
      )}
    </div>
  );
}
function Island() {
  return (
    <div className="island-art" aria-hidden="true">
      <span className="cloud c1" />
      <span className="cloud c2" />
      <span className="art-sun" />
      <span className="speech-bubble bubble-en">Hello!</span>
      <span className="speech-bubble bubble-ja">こんにちは</span>
      <div className="floating-island">
        <div className="island-top" />
        <div className="hill hill-one" />
        <div className="hill hill-two" />
        <span className="tree tree-one">🌳</span>
        <span className="tree tree-two">🌲</span>
        <span className="house">🏡</span>
        <span className="tiny-flower">🌼</span>
        <span className="path-stone s1" />
        <span className="path-stone s2" />
        <span className="path-stone s3" />
        <div className="island-bottom" />
      </div>
      <span className="art-spark spark-one">✦</span>
      <span className="art-spark spark-two">✧</span>
      <div className="island-shadow" />
      <span className="art-caption">一座小島，裝著大大的世界。</span>
    </div>
  );
}
