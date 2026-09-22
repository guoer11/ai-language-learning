import { useEffect, useRef, useState } from "react";
import { JapaneseText, StudyHint } from "./japanese";
import { Mic, Square, RotateCcw } from "lucide-react";
import type { Question, Language } from "./data";
export type OralResult = {
  text: string;
  source: "browser" | "typed" | "demo";
  contentCorrect: boolean;
  pronunciation: null;
};
export function normalizeSpeech(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u30a1-\u30f6]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0x60),
    )
    .replace(/[\p{P}\p{S}\s]/gu, "");
}
export function compareContent(
  target: string,
  text: string,
  alternatives: string[] = [],
) {
  return (
    !!normalizeSpeech(text) &&
    [target, ...alternatives].some(
      (t) => normalizeSpeech(t) === normalizeSpeech(text),
    )
  );
}
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult:
    | ((e: {
        results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  abort: () => void;
  stop: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export default function OralPractice({
  q,
  language,
  locked,
  onChange,
}: {
  q: Question;
  language: Language;
  locked: boolean;
  onChange: (value: OralResult | null) => void;
}) {
  const [text, setText] = useState(""),
    [source, setSource] = useState<OralResult["source"]>("typed"),
    [listening, setListening] = useState(false),
    [recording, setRecording] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState(""),
    [audio, setAudio] = useState(""),
    [result, setResult] = useState<OralResult | null>(null),
    [consent, setConsent] = useState(false);
  const rec = useRef<Recognition | null>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    url = useRef(""),
    timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined),
    alive = useRef(true),
    request = useRef(0),
    callback = useRef(onChange);
  callback.current = onChange;
  const Speech =
    (window as SpeechWindow).SpeechRecognition ||
    (window as SpeechWindow).webkitSpeechRecognition;
  function stopAll() {
    request.current++;
    clearTimeout(timer.current);
    if (rec.current) {
      rec.current.onresult = null;
      rec.current.onerror = null;
      rec.current.onend = null;
      rec.current.abort();
      rec.current = null;
    }
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }
  useEffect(() => {
    alive.current = true;
    const onHidden = () => {
      if (document.hidden) {
        stopAll();
        setListening(false);
        setRecording(false);
        setPending(false);
      }
    };
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      alive.current = false;
      stopAll();
      if (url.current) URL.revokeObjectURL(url.current);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, []);
  function clearResult() {
    setResult(null);
    callback.current(null);
  }
  function recognize() {
    if (!Speech || !consent) return;
    clearTimeout(timer.current);
    if (rec.current) {
      rec.current.onresult = null;
      rec.current.onerror = null;
      rec.current.onend = null;
      rec.current.abort();
    }
    window.speechSynthesis?.cancel();
    clearResult();
    setText("");
    setError("");
    setSource("browser");
    const r = new Speech();
    rec.current = r;
    r.lang = language === "ja" ? "ja-JP" : "en-US";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      if (!alive.current) return;
      const transcript = Array.from(e.results)
        .filter((x) => x.isFinal)
        .map((x) => x[0].transcript)
        .join(" ");
      setText(transcript);
      setSource("browser");
    };
    r.onerror = (e) => {
      if (!alive.current) return;
      setError(
        (
          {
            "not-allowed":
              "麥克風或語音辨識權限未開啟。請在瀏覽器設定允許，或改用輸入。",
            "no-speech": "沒有聽到聲音，請再試一次。",
            network: "語音辨識服務連線失敗，請確認網路或改用輸入。",
            "audio-capture": "無法取得麥克風，請確認沒有被其他程式使用。",
          } as Record<string, string>
        )[e.error] || "此裝置的語音辨識暫時無法使用，可改用輸入或錄音回放。",
      );
      setListening(false);
      clearTimeout(timer.current);
    };
    r.onend = () => {
      if (alive.current) setListening(false);
      clearTimeout(timer.current);
    };
    try {
      setListening(true);
      timer.current = setTimeout(() => {
        r.stop();
        if (alive.current) setListening(false);
      }, 60000);
      r.start();
    } catch {
      clearTimeout(timer.current);
      setError("無法啟動語音辨識，請改用輸入。");
      setListening(false);
    }
  }
  async function record() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("此瀏覽器不支援錄音回放。");
      return;
    }
    setError("");
    setPending(true);
    window.speechSynthesis?.cancel();
    const id = ++request.current;
    try {
      const s = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!alive.current || id !== request.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      const m = new MediaRecorder(s);
      recorder.current = m;
      const chunks: Blob[] = [];
      m.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      m.onerror = () => {
        s.getTracks().forEach((t) => t.stop());
        if (alive.current) {
          setRecording(false);
          setError("錄音失敗，請重新嘗試。");
        }
      };
      m.onstop = () => {
        s.getTracks().forEach((t) => t.stop());
        clearTimeout(timer.current);
        if (!alive.current || id !== request.current) return;
        if (url.current) URL.revokeObjectURL(url.current);
        url.current = URL.createObjectURL(
          new Blob(chunks, {
            type: m.mimeType || chunks[0]?.type || "audio/webm",
          }),
        );
        setAudio(url.current);
        setRecording(false);
      };
      m.start();
      setRecording(true);
      setPending(false);
      timer.current = setTimeout(() => {
        if (m.state === "recording") m.stop();
      }, 60000);
    } catch {
      stream.current?.getTracks().forEach((t) => t.stop());
      if (alive.current && id === request.current) {
        setPending(false);
        setRecording(false);
        setError("無法錄音：請允許麥克風權限，或改用輸入。");
      }
    }
  }
  function evaluate() {
    const value: OralResult = {
      text: text.trim(),
      source,
      contentCorrect: compareContent(q.target, text, q.alternatives),
      pronunciation: null,
    };
    setResult(value);
    callback.current(value);
  }
  const busy = listening || recording || pending;
  return (
    <section className="speaking oral-practice">
      <div className="mock-label">
        內容比對 ≠ 發音評估。Azure 尚未串接，這裡不會產生假的發音分數。
      </div>
      <label className="speech-consent">
        <input
          type="checkbox"
          checked={consent}
          disabled={locked || busy}
          onChange={(e) => setConsent(e.target.checked)}
        />
        我同意使用瀏覽器語音辨識；聲音可能傳給瀏覽器廠商的服務，不保證離線可用。
      </label>
      <div className="oral-controls">
        <button
          className="primary"
          disabled={locked || !Speech || !consent || recording || pending}
          onClick={() => (listening ? rec.current?.stop() : recognize())}
        >
          {listening ? <Square size={18} /> : <Mic size={18} />}{" "}
          {listening ? "停止辨識" : "開始語音辨識"}
        </button>
        <button
          className="secondary"
          disabled={locked || listening || pending}
          onClick={() => (recording ? recorder.current?.stop() : record())}
        >
          {recording ? <Square size={18} /> : <Mic size={18} />}{" "}
          {pending ? "等待麥克風權限…" : recording ? "停止錄音" : "錄音回放"}
        </button>
      </div>
      {!Speech && (
        <p className="muted">
          目前瀏覽器沒有提供語音辨識，可使用錄音回放或輸入練習。
        </p>
      )}
      <p className="muted">
        錄音回放只暫存在此頁，不上傳、不永久儲存；每段最多 60
        秒，可無限重錄。離開關卡會釋放錄音。
      </p>
      {audio && (
        <div className="audio-replay">
          <audio controls src={audio} />
          <button
            className="text-button"
            disabled={recording || pending}
            onClick={() => {
              URL.revokeObjectURL(url.current);
              url.current = "";
              setAudio("");
            }}
          >
            刪除這段錄音
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="notice">
          {error}
        </p>
      )}
      <label className="transcript-label" htmlFor="oral-text">
        辨識文字／手動輸入
        <textarea
          id="oral-text"
          lang={language}
          maxLength={600}
          disabled={locked || busy}
          value={text}
          placeholder="辨識完成後會出現在這裡，也可以自行輸入。"
          onChange={(e) => {
            setText(e.target.value);
            setSource("typed");
            clearResult();
          }}
        />
      </label>
      <p className="muted">
        {source === "browser"
          ? "來源：瀏覽器辨識（修改文字後會標記為手動輸入）"
          : source === "demo"
            ? "來源：示範答案，不代表實際口說"
            : "來源：手動輸入，只練習內容，不是口說成績"}
      </p>
      <div className="oral-controls">
        <button
          className="secondary"
          disabled={locked || busy || !text.trim()}
          onClick={evaluate}
        >
          比對內容
        </button>
        <button
          className="text-button"
          disabled={locked || busy}
          onClick={() => {
            setText(q.target);
            setSource("demo");
            clearResult();
          }}
        >
          <RotateCcw size={14} />
          填入示範答案
        </button>
      </div>
      {result && (
        <div className="speech-results">
          <div
            className={"content-result " + (result.contentCorrect ? "" : "bad")}
          >
            {result.contentCorrect
              ? "✓ 文字內容符合目標句"
              : "△ 文字內容與目標句不同，請對照以下句子重試。"}
          </div>
          {!result.contentCorrect && (
            <>
              <p>
                目標：
                <JapaneseText text={q.target} enabled={language === "ja"} />
              </p>
              <p>
                你的內容：
                <JapaneseText text={result.text} enabled={language === "ja"} />
              </p>
            </>
          )}
          <p className="muted">
            目前忽略標點、空白、英文大小寫與日文片假名／平假名差異；不判斷自由回答語意。辨識錯字不一定代表你說錯。
          </p>
          <div className="score-grid">
            {[
              "Accuracy 準確度",
              "Fluency 流暢度",
              "Completeness 完整度",
              "總分",
            ].map((t) => (
              <div key={t}>
                <strong>—</strong>
                <span>{t}</span>
                <small>尚未評估</small>
              </div>
            ))}
          </div>
          <p>
            練習提示：
            <StudyHint text={q.hint} japanese={language === "ja"} />
          </p>
        </div>
      )}
    </section>
  );
}
