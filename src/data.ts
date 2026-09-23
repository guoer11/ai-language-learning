import { extra, words } from "./extra-lessons";
import { japaneseTokens } from "./japanese";
import { explanations } from "./explanations";
import { scenarios } from "./communication";
export type Language = "ja" | "en";
export type Level = "beginner" | "intermediate" | "advanced";
export type Question = {
  id: string;
  type: "choice" | "order" | "speaking";
  prompt: string;
  target: string;
  translation: string;
  options?: string[];
  answer?: string;
  tokens?: string[];
  hint: string;
  studyText: string;
  explanation: string;
  optionsForeign?: boolean;
  optionMeanings?: Record<string, string>;
  label?: string;
  audioOnly?: boolean;
  alternatives?: string[];
  context?: string;
  hideAudio?: boolean;
};
export const levels: { id: Level; icon: string; name: string; sub: string }[] =
  [
    { id: "beginner", icon: "🌱", name: "初階", sub: "從第一句問候開始" },
    { id: "intermediate", icon: "🌿", name: "中階", sub: "把生活聊得更自在" },
    { id: "advanced", icon: "🌳", name: "高階", sub: "表達想法，探索更多" },
  ];
export const languages = {
  ja: {
    name: "日文",
    flag: "🇯🇵",
    island: "櫻花島",
    hello: "こんにちは",
    sub: "從五十音到自在對話",
    color: "pink",
  },
  en: {
    name: "英文",
    flag: "🇺🇸",
    island: "晴空島",
    hello: "Hello, world!",
    sub: "從日常問候到勇敢表達",
    color: "blue",
  },
};
// Each path has its own content and stable IDs. These are demonstration lessons, not a full curriculum.
const corpus: Record<
  Language,
  Record<Level, [string, string, string[], string][]>
> = {
  ja: {
    beginner: [
      [
        "こんにちは。",
        "你好。",
        ["こんにちは", "。"],
        "問候時自然、清楚地說出每個音節。",
      ],
      [
        "水をください。",
        "請給我水。",
        ["水", "を", "ください", "。"],
        "「水」讀作 みず。",
      ],
      [
        "ありがとうございます。",
        "謝謝您。",
        ["ありがとう", "ございます", "。"],
        "注意不要省略最後的「ます」。",
      ],
    ],
    intermediate: [
      [
        "窓の近くの席に座ってもいいですか。",
        "我可以坐在靠窗的位子嗎？",
        ["窓の近くの席に", "座っても", "いいですか", "。"],
        "「てもいいですか」用來詢問許可。",
      ],
      [
        "予約を変更したいのですが。",
        "我想更改預約。",
        ["予約を", "変更したい", "のですが", "。"],
        "「のですが」使語氣更委婉。",
      ],
      [
        "おすすめの料理は何ですか。",
        "有什麼推薦的料理？",
        ["おすすめの", "料理は", "何ですか", "。"],
        "注意「おすすめ」的音節。",
      ],
    ],
    advanced: [
      [
        "環境を守るために、何ができるでしょうか。",
        "為了保護環境，我們能做些什麼呢？",
        ["環境を守るために", "、", "何ができるでしょうか", "。"],
        "以提問語氣引出討論。",
      ],
      [
        "便利さだけでなく、安全性も大切です。",
        "不只是便利性，安全性也很重要。",
        ["便利さだけでなく", "、", "安全性も", "大切です", "。"],
        "「だけでなく」表示不僅如此。",
      ],
      [
        "異なる意見を尊重することが重要です。",
        "尊重不同意見是很重要的。",
        ["異なる意見を", "尊重することが", "重要です", "。"],
        "在詞組之間適當停頓。",
      ],
    ],
  },
  en: {
    beginner: [
      [
        "Hello, how are you?",
        "你好，你好嗎？",
        ["Hello,", "how", "are", "you?"],
        "how are you 可以自然連讀。",
      ],
      [
        "I would like some water.",
        "我想要一些水。",
        ["I", "would", "like", "some", "water."],
        "water 和 coffee 的意思不同。",
      ],
      [
        "Thank you very much.",
        "非常謝謝你。",
        ["Thank", "you", "very", "much."],
        "Thank 的 th 要注意舌尖位置。",
      ],
    ],
    intermediate: [
      [
        "Could I have a table by the window?",
        "可以給我一個靠窗的座位嗎？",
        ["Could", "I", "have", "a table", "by the window?"],
        "Could I 用來禮貌地提出請求。",
      ],
      [
        "I would like to change my reservation.",
        "我想更改我的預約。",
        ["I", "would like", "to change", "my reservation."],
        "reservation 的重音落在 va。",
      ],
      [
        "What would you recommend for dinner?",
        "晚餐你會推薦什麼？",
        ["What", "would", "you", "recommend", "for dinner?"],
        "讓問句的節奏保持自然。",
      ],
    ],
    advanced: [
      [
        "How can we reduce our environmental impact?",
        "我們該如何減少對環境的影響？",
        ["How", "can we", "reduce", "our environmental impact?"],
        "注意 environmental 的重音。",
      ],
      [
        "We should consider both convenience and safety.",
        "我們應同時考慮便利性與安全性。",
        ["We", "should consider", "both convenience", "and safety."],
        "both A and B 用於並列兩個面向。",
      ],
      [
        "It is important to respect different perspectives.",
        "尊重不同觀點是很重要的。",
        ["It is", "important", "to respect", "different perspectives."],
        "perspectives 結尾的 s 要清楚。",
      ],
    ],
  },
};
export const lessonNames = [
  "啟程・第一句話",
  "生活裡的小對話",
  "讓表達更自然",
  "CHECKPOINT・小小試煉",
  "把句子說出來",
  "開口更有自信",
  "自由練習站",
  "BOSS・綜合挑戰",
];
export type CourseLesson = {
  id: string;
  index: number;
  title: string;
  kind: "normal" | "checkpoint" | "boss";
};
export type Course = {
  id: string;
  language: Language;
  level: Level;
  worlds: {
    id: string;
    title: string;
    units: { id: string; title: string; lessons: CourseLesson[] }[];
  }[];
};
const titles: Record<Level, string[]> = {
  beginner: [
    "第一句問候",
    "禮貌與飲水",
    "表達感謝",
    "自我介紹・Checkpoint",
    "尋找車站",
    "購物問價",
    "明日行程",
    "餐廳入座・BOSS",
  ],
  intermediate: [
    "選擇座位",
    "更改預約",
    "餐點推薦",
    "天氣與原因・Checkpoint",
    "交通詢問",
    "請人說慢一點",
    "分享閱讀",
    "飲食需求・BOSS",
  ],
  advanced: [
    "環境議題",
    "便利與安全",
    "尊重觀點",
    "科技與工作・Checkpoint",
    "價格與品質",
    "證據與結論",
    "面對失敗",
    "權衡成本・BOSS",
  ],
};
export function course(language: Language, level: Level): Course {
  const base = `${language}:${level}`;
  return {
    id: base,
    language,
    level,
    worlds: [
      {
        id: `${base}:world-1`,
        title:
          level === "beginner"
            ? "日常啟程"
            : level === "intermediate"
              ? "生活交流"
              : "觀點探索",
        units: [
          {
            id: `${base}:unit-1`,
            title: "單元一 · 建立基礎",
            lessons: [0, 1, 2, 3].map(make),
          },
          {
            id: `${base}:unit-2`,
            title: "單元二 · 活用表達",
            lessons: [4, 5, 6, 7].map(make),
          },
        ],
      },
    ],
  };
  function make(index: number): CourseLesson {
    return {
      id: `${base}:lesson-${index}`,
      index,
      title: titles[level][index],
      kind: index === 3 ? "checkpoint" : index === 7 ? "boss" : "normal",
    };
  }
}
export function lessonTitle(level: Level, index: number) {
  return titles[level][index] || lessonNames[index];
}
export function starsForScore(score: number) {
  return score < 60 ? 0 : score < 80 ? 1 : score < 100 ? 2 : 3;
}
function optionsFor(answer: string, all: string[], seed: number) {
  const other = [...new Set(all)].filter((x) => x !== answer).slice(0, 3);
  const list = [...other, answer];
  const at = seed % list.length;
  return [...list.slice(at), ...list.slice(0, at)];
}
export const pathKey = (language: Language, level: Level) =>
  `${language}:${level}`;
export function questions(
  language: Language,
  level: Level,
  lesson: number,
): Question[] {
  const entries = [...corpus[language][level], ...extra[language][level]];
  const entry = entries[lesson];
  const [target, translation, , hint] = entry;
  const id = `${pathKey(language, level)}:${lesson}`;
  const vocabulary = words[language][level];
  const [word, meaning] = vocabulary[lesson];
  const reverse = lesson % 2 === 1;
  const orderIndex = (lesson + 1) % entries.length;
  const listenIndex = (lesson + 2) % entries.length;
  const speakingIndex = (lesson + 3) % entries.length;
  const arranging = entries[orderIndex];
  const listening = entries[listenIndex];
  const speaking = entries[speakingIndex];
  const [listenWord, listenMeaning] = vocabulary[listenIndex];
  const situations = scenarios[level];
  const conversation = situations[lesson];
  const listeningSituation = situations[(lesson + 1) % situations.length];
  const intent = situations[(lesson + 4) % situations.length];
  const oralSituation = situations[(lesson + 2) % situations.length];
  const gapEntry = entries[(lesson + 4) % entries.length];
  const gapWords = (text: string) =>
    language === "ja" ? japaneseTokens[text] : text.trim().split(/\s+/);
  const missingWord = (text: string) =>
    [...gapWords(text)]
      .filter((word) => /[\p{L}]/u.test(word))
      .sort((a, b) => b.length - a.length)[0]
      .replace(/[.,!?]$/, "");
  const missing = missingWord(gapEntry[0]);
  return [
    {
      id: id + ":vocabulary",
      type: "choice",
      label: "單字選擇",
      prompt: "這個單字是什麼意思？",
      target: word,
      translation: meaning,
      answer: meaning,
      options: optionsFor(
        meaning,
        vocabulary.map((v) => v[1]),
        lesson,
      ),
      hint: `「${word}」：${meaning}`,
      studyText: word,
      explanation: `這題要辨認單字的意思。「${word}」對應「${meaning}」。請先記住這組詞義，再分辨其他選項。`,
    },
    {
      id: id + ":choice",
      type: "choice",
      label: reverse ? "中文選外語" : "外語選中文",
      prompt: reverse ? "選出對應的外語句子" : "這句話的中文意思是什麼？",
      target: reverse ? translation : target,
      translation,
      options: optionsFor(
        reverse ? target : translation,
        entries.map((e) => e[reverse ? 0 : 1]),
        lesson + 1,
      ),
      answer: reverse ? target : translation,
      hint,
      studyText: target,
      explanation: explanations[language][level][lesson],
      optionsForeign: reverse,
      optionMeanings: Object.fromEntries(entries.map((e) => [e[0], e[1]])),
    },
    {
      id: id + ":order",
      type: "order",
      label: "句子排列",
      prompt: "把詞語排成正確的句子",
      target: arranging[0],
      translation: arranging[1],
      // English tiles are words; keep contractions, hyphens and punctuation intact.
      tokens:
        language === "ja"
          ? japaneseTokens[arranging[0]]
          : arranging[0].trim().split(/\s+/),
      hint: arranging[3],
      studyText: arranging[0],
      explanation: explanations[language][level][orderIndex],
    },
    {
      id: id + ":listening",
      type: "choice",
      label: reverse ? "聽音辨字" : "聽力選擇",
      audioOnly: true,
      prompt: reverse
        ? "聽發音，選出你聽到的單字"
        : "聽句子，選出正確的中文意思",
      target: reverse ? listenWord : listening[0],
      translation: reverse ? listenMeaning : listening[1],
      answer: reverse ? listenWord : listening[1],
      options: optionsFor(
        reverse ? listenWord : listening[1],
        reverse ? vocabulary.map((v) => v[0]) : entries.map((e) => e[1]),
        lesson + 2,
      ),
      hint: reverse ? `「${listenWord}」：${listenMeaning}` : listening[3],
      studyText: reverse ? listenWord : listening[0],
      explanation: reverse
        ? `聽到的單字是「${listenWord}」，意思是「${listenMeaning}」。可以對照假名或字母，再播放一次確認聲音。`
        : explanations[language][level][listenIndex],
      optionsForeign: reverse,
      optionMeanings: Object.fromEntries(vocabulary),
    },
    {
      id: id + ":speaking",
      type: "speaking",
      label: lesson % 2 === 0 ? "跟讀練習" : "指定句口說",
      prompt:
        lesson % 2 === 0 ? "聽一聽，再跟著說一次" : "請用外語說出指定的句子",
      target: speaking[0],
      translation: speaking[1],
      hint: speaking[3],
      studyText: speaking[0],
      explanation: explanations[language][level][speakingIndex],
    },
    {
      id: id + ":response",
      type: "choice",
      label: "情境接話",
      prompt: "你會怎麼回應對方？",
      context: `${conversation.scene}：${conversation.goal}。`,
      target: conversation.partner[language],
      studyText: conversation.partner[language],
      translation: conversation.partner.meaning,
      options: optionsFor(
        conversation.reply[language],
        situations.map((s) => s.reply[language]),
        lesson + 3,
      ),
      answer: conversation.reply[language],
      optionsForeign: true,
      optionMeanings: Object.fromEntries(
        situations.map((s) => [s.reply[language], s.reply.meaning]),
      ),
      hint: `「${conversation.reply[language]}」：${conversation.reply.meaning}`,
      explanation: `對方說的是：${conversation.partner.meaning}這個情境要${conversation.goal}，因此選「${conversation.reply[language]}」（${conversation.reply.meaning}）。接話時先理解問題，再確認自己的回答有達成溝通目的。`,
    },
    {
      id: id + ":gap",
      type: "choice",
      label: "句子填空",
      prompt: "選出符合意思的詞，完成句子",
      context: gapEntry[1],
      hideAudio: true,
      target: gapEntry[0].replace(missing, "＿＿＿"),
      studyText: gapEntry[0],
      translation: gapEntry[1],
      answer: missing,
      optionsForeign: true,
      options: optionsFor(
        missing,
        entries.map((e) => missingWord(e[0])),
        lesson + 4,
      ),
      hint: `完整句子：「${gapEntry[0]}」`,
      explanation: `空格應填「${missing}」，才符合題目所要求的意思。${explanations[language][level][(lesson + 4) % entries.length]}`,
    },
    {
      id: id + ":intent",
      type: "choice",
      label: "理解說話用意",
      prompt: "對方說這句話，主要想表達什麼？",
      target: intent.reply[language],
      studyText: intent.reply[language],
      translation: intent.reply.meaning,
      answer: intent.purpose,
      options: optionsFor(
        intent.purpose,
        situations.map((s) => s.purpose),
        lesson + 5,
      ),
      hint: `這句話的溝通目的：${intent.purpose}。`,
      explanation: `「${intent.reply[language]}」的意思是：${intent.reply.meaning}用在${intent.scene}的情境，目的是${intent.purpose}。理解用意能幫助你決定接下來怎麼回答。`,
    },
    {
      id: id + ":conversation-listening",
      type: "choice",
      label: "對話聽力",
      prompt: "聽懂對方的話，選出意思",
      target: listeningSituation.partner[language],
      studyText: listeningSituation.partner[language],
      translation: listeningSituation.partner.meaning,
      audioOnly: true,
      answer: listeningSituation.partner.meaning,
      options: optionsFor(
        listeningSituation.partner.meaning,
        situations.map((s) => s.partner.meaning),
        lesson + 6,
      ),
      hint: `「${listeningSituation.partner[language]}」：${listeningSituation.partner.meaning}`,
      explanation: `這句話的意思是：${listeningSituation.partner.meaning}${listeningSituation.goal}就是這個情境下合適的回應方向。聽不清楚可以重播，或在真實對話中請對方再說一次。`,
    },
    {
      id: id + ":situational-speaking",
      type: "speaking",
      label: "情境口說",
      prompt:
        lesson === 7 ? "BOSS：用一句話完成溝通任務" : "換你說：完成情境任務",
      context: `${oralSituation.scene}：${oralSituation.goal}。先練熟下方參考句；目前依參考句比對內容，還不是自由對話評分。`,
      target: oralSituation.reply[language],
      studyText: oralSituation.reply[language],
      translation: oralSituation.reply.meaning,
      hint: `這次練習的目的：${oralSituation.purpose}。先聽參考句，再試著說出完整意思。`,
      explanation: `這次任務要${oralSituation.goal}。參考句「${oralSituation.reply[language]}」表達的意思是：${oralSituation.reply.meaning}真實對話可以有其他合理說法；本題目前只比對參考句，不代表其他說法一定錯。`,
    },
  ];
}
export type Attempt = {
  id: string;
  path: string;
  lesson: number;
  date: string;
  score: number;
  xp: number;
  stars: number;
  wrong: string[];
  mock: boolean;
  curriculumVersion?: 2 | 3 | 4;
  oralAttempts?: NonNullable<Attempt["oral"]>[];
  oral?: {
    questionId: string;
    text: string;
    source: "browser" | "typed" | "demo";
    contentCorrect: boolean;
    pronunciation: null;
  };
};
export type Profile = {
  id: string;
  name: string;
  avatar: string;
  attempts: Attempt[];
};
export type Save = { version: 1; active: string; profiles: Profile[] };
export const fresh = (): Save => ({
  version: 1,
  active: "explorer",
  profiles: [
    { id: "explorer", name: "小小冒險家", avatar: "🧑‍🚀", attempts: [] },
  ],
});
export const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei" }).format(
    new Date(),
  );
export function bestStars(profile: Profile, path: string, lesson: number) {
  return Math.max(
    0,
    ...profile.attempts
      .filter((a) => a.path === path && a.lesson === lesson)
      .map((a) => a.stars),
  );
}
export function streak(profile: Profile) {
  const dates = new Set(profile.attempts.map((a) => a.date));
  let d = new Date(today() + "T12:00:00Z");
  if (!dates.has(today())) d.setUTCDate(d.getUTCDate() - 1);
  let count = 0;
  while (dates.has(d.toISOString().slice(0, 10))) {
    count++;
    d.setUTCDate(d.getUTCDate() - 1);
  }
  return count;
}
export function readSave(storageKey = "learning-demo-v1"): Save {
  try {
    const s = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (
      s?.version === 1 &&
      Array.isArray(s.profiles) &&
      s.profiles.length &&
      s.profiles.every(
        (p: Profile) =>
          typeof p.id === "string" &&
          typeof p.name === "string" &&
          Array.isArray(p.attempts) &&
          p.attempts.every(
            (a) =>
              typeof a.xp === "number" &&
              Array.isArray(a.wrong) &&
              typeof a.path === "string" &&
              typeof a.date === "string",
          ),
      ) &&
      s.profiles.some((p: Profile) => p.id === s.active)
    )
      return s;
  } catch {
    /* Use a fresh profile if storage is unavailable or corrupt. */
  }
  return fresh();
}
