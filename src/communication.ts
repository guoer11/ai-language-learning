import type { Level } from "./data";

// Readings travel with newly authored Japanese material; UI receives plain text.
export const scenarioReadings: Record<string, string> = {};
type Phrase = { ja: string; en: string; meaning: string };
function phrase(ja: string, en: string, meaning: string): Phrase {
  return {
    ja: ja.replace(/([^\s{}、。？！]+)\{([^{}]+)\}/g, (_, word, kana) => {
      scenarioReadings[word] = kana;
      return word;
    }),
    en,
    meaning,
  };
}
type Scenario = {
  scene: string;
  goal: string;
  purpose: string;
  partner: Phrase;
  reply: Phrase;
};
export const scenarios: Record<Level, Scenario[]> = {
  beginner: [
    {
      scene: "第一次見面",
      goal: "告訴對方你來自台灣",
      purpose: "介紹自己來自哪裡",
      partner: phrase(
        "どちらから 来ました{きました}か。",
        "Where are you from?",
        "你來自哪裡？",
      ),
      reply: phrase(
        "台湾{たいわん}から 来ました{きました}。",
        "I am from Taiwan.",
        "我來自台灣。",
      ),
    },
    {
      scene: "咖啡店點餐",
      goal: "向店員要一杯水",
      purpose: "點一杯飲料",
      partner: phrase(
        "お 飲み物{のみもの}は 何{なに}にしますか。",
        "What would you like to drink?",
        "你想喝什麼？",
      ),
      reply: phrase(
        "水{みず}を 一杯{いっぱい}ください。",
        "A glass of water, please.",
        "請給我一杯水。",
      ),
    },
    {
      scene: "商店結帳",
      goal: "表明要用信用卡付款",
      purpose: "說明付款方式",
      partner: phrase(
        "お 支払い{しはらい}はどうしますか。",
        "How would you like to pay?",
        "你想怎麼付款？",
      ),
      reply: phrase(
        "カードでお 願い{ねがい}します。",
        "By card, please.",
        "我要刷卡。",
      ),
    },
    {
      scene: "交換名字",
      goal: "告訴新朋友你叫 Alex",
      purpose: "告訴對方自己的名字",
      partner: phrase(
        "お 名前{なまえ}は 何{なん}ですか。",
        "What is your name?",
        "你叫什麼名字？",
      ),
      reply: phrase("アレックスです。", "My name is Alex.", "我叫 Alex。"),
    },
    {
      scene: "請人指路",
      goal: "說明你要去車站",
      purpose: "說明目的地",
      partner: phrase(
        "どこに 行きたい{いきたい}ですか。",
        "Where do you want to go?",
        "你想去哪裡？",
      ),
      reply: phrase(
        "駅{えき}に 行きたい{いきたい}です。",
        "I want to go to the station.",
        "我想去車站。",
      ),
    },
    {
      scene: "購物選顏色",
      goal: "選擇藍色的商品",
      purpose: "選擇商品顏色",
      partner: phrase(
        "どの 色{いろ}がいいですか。",
        "Which color would you like?",
        "你想要哪個顏色？",
      ),
      reply: phrase(
        "青い{あおい}のをください。",
        "The blue one, please.",
        "請給我藍色的。",
      ),
    },
    {
      scene: "約朋友碰面",
      goal: "告訴朋友明天見",
      purpose: "約定見面日期",
      partner: phrase(
        "いつ 会いましょう{あいましょう}か。",
        "When shall we meet?",
        "我們什麼時候見面？",
      ),
      reply: phrase(
        "明日{あした} 会いましょう{あいましょう}。",
        "Let's meet tomorrow.",
        "我們明天見吧。",
      ),
    },
    {
      scene: "餐廳入座",
      goal: "告訴店員有兩位客人",
      purpose: "告知用餐人數",
      partner: phrase(
        "何名様{なんめいさま}ですか。",
        "How many people are in your party?",
        "請問有幾位？",
      ),
      reply: phrase(
        "二人{ふたり}です。",
        "A table for two, please.",
        "兩位用餐。",
      ),
    },
  ],
  intermediate: [
    {
      scene: "餐廳選座位",
      goal: "請店員安排靠窗的座位",
      purpose: "提出座位偏好",
      partner: phrase(
        "どちらの 席{せき}がよろしいですか。",
        "Where would you prefer to sit?",
        "你比較想坐哪裡？",
      ),
      reply: phrase(
        "窓{まど}の 近く{ちかく}の 席{せき}をお 願い{ねがい}します。",
        "Could we have a table near the window?",
        "可以幫我們安排靠窗的座位嗎？",
      ),
    },
    {
      scene: "更改訂位",
      goal: "把訂位時間改到晚上七點",
      purpose: "調整預約時間",
      partner: phrase(
        "何時{なんじ}に 変更{へんこう}しますか。",
        "What time would you like to change it to?",
        "你想改到幾點？",
      ),
      reply: phrase(
        "午後七時{ごごしちじ}に 変更{へんこう}できますか。",
        "Could I change my reservation to seven p.m.?",
        "可以把我的訂位改到晚上七點嗎？",
      ),
    },
    {
      scene: "請店員推薦",
      goal: "想吃不辣的食物，請店員推薦",
      purpose: "說明口味並請求推薦",
      partner: phrase(
        "どんな 料理{りょうり}がお 好き{すき}ですか。",
        "What kind of food do you like?",
        "你喜歡什麼樣的料理？",
      ),
      reply: phrase(
        "辛くない{からくない} 料理{りょうり}をおすすめしてもらえますか。",
        "Could you recommend something that is not spicy?",
        "可以推薦不辣的料理嗎？",
      ),
    },
    {
      scene: "雨天出門",
      goal: "告訴朋友自己會帶傘",
      purpose: "說明天氣應對方式",
      partner: phrase(
        "雨{あめ}が 降りそう{ふりそう}ですが、どうしますか。",
        "It looks like rain. What will you do?",
        "看起來快下雨了，你打算怎麼辦？",
      ),
      reply: phrase(
        "傘{かさ}を 持って{もって}いくので 大丈夫{だいじょうぶ}です。",
        "I'll bring an umbrella, so I'll be fine.",
        "我會帶傘，所以沒問題。",
      ),
    },
    {
      scene: "車站詢問",
      goal: "說明要去京都，確認這班車是否合適",
      purpose: "確認交通路線",
      partner: phrase(
        "どちらまで 行かれます{いかれます}か。",
        "Where are you traveling to?",
        "你要搭車去哪裡？",
      ),
      reply: phrase(
        "京都{きょうと}に 行きたい{いきたい}のですが、この 電車{でんしゃ}でいいですか。",
        "I'm going to Kyoto. Is this the right train?",
        "我要去京都，搭這班車對嗎？",
      ),
    },
    {
      scene: "沒聽清楚",
      goal: "請對方再慢慢說一次",
      purpose: "請對方放慢並重說",
      partner: phrase(
        "説明{せつめい}はわかりましたか。",
        "Did you understand the instructions?",
        "你聽懂說明了嗎？",
      ),
      reply: phrase(
        "もう 一度{いちど}ゆっくり 話して{はなして}もらえますか。",
        "Could you say that again more slowly?",
        "可以再慢慢說一次嗎？",
      ),
    },
    {
      scene: "和朋友聊天",
      goal: "分享昨天買了一本書",
      purpose: "分享最近的購物經驗",
      partner: phrase(
        "昨日{きのう}は 何{なに}をしましたか。",
        "What did you do yesterday?",
        "你昨天做了什麼？",
      ),
      reply: phrase(
        "昨日{きのう}、 本屋{ほんや}で 本{ほん}を 買いました{かいました}。",
        "I bought a book at a bookstore yesterday.",
        "我昨天在書店買了一本書。",
      ),
    },
    {
      scene: "點餐說明過敏",
      goal: "告訴店員你對蛋過敏",
      purpose: "告知食物過敏",
      partner: phrase(
        "食べられない{たべられない}ものはありますか。",
        "Is there anything you cannot eat?",
        "有什麼不能吃的東西嗎？",
      ),
      reply: phrase(
        "卵{たまご}アレルギーがあります。",
        "I am allergic to eggs.",
        "我對蛋過敏。",
      ),
    },
  ],
  advanced: [
    {
      scene: "討論環境",
      goal: "提議從減少塑膠垃圾開始",
      purpose: "提出具體的環保行動",
      partner: phrase(
        "環境{かんきょう}のために 何{なに}ができますか。",
        "What can we do to help the environment?",
        "我們能為環境做些什麼？",
      ),
      reply: phrase(
        "まず、プラスチックごみを 減らす{へらす}ことから 始めましょう{はじめましょう}。",
        "We could start by reducing plastic waste.",
        "我們可以先從減少塑膠垃圾開始。",
      ),
    },
    {
      scene: "評估新服務",
      goal: "肯定便利性，但提醒注意安全",
      purpose: "權衡便利與安全",
      partner: phrase(
        "このサービスについてどう 思います{おもいます}か。",
        "What do you think of this service?",
        "你覺得這項服務如何？",
      ),
      reply: phrase(
        "便利{べんり}ですが、 安全性{あんぜんせい}も 確認{かくにん}する 必要{ひつよう}があります。",
        "It is convenient, but we also need to check its security.",
        "它很方便，但我們也需要確認安全性。",
      ),
    },
    {
      scene: "意見不同",
      goal: "禮貌表達不同看法並提議另一種做法",
      purpose: "尊重對方並提出不同意見",
      partner: phrase(
        "私{わたし}の 提案{ていあん}に 賛成{さんせい}ですか。",
        "Do you agree with my proposal?",
        "你同意我的提案嗎？",
      ),
      reply: phrase(
        "お 考え{かんがえ}はわかりますが、 別{べつ}の 方法{ほうほう}も 検討{けんとう}したいです。",
        "I see your point, but I'd like to consider another approach.",
        "我了解你的想法，但我也想考慮另一種做法。",
      ),
    },
    {
      scene: "討論工作方式",
      goal: "說明科技帶來便利，同時需要適應",
      purpose: "說明改變的好處與挑戰",
      partner: phrase(
        "技術{ぎじゅつ}の 進歩{しんぽ}で 仕事{しごと}はどう 変わります{かわります}か。",
        "How will technological progress change our work?",
        "科技進步會如何改變我們的工作？",
      ),
      reply: phrase(
        "仕事{しごと}は 便利{べんり}になりますが、 新しい{あたらしい} 働き方{はたらきかた}に 慣れる{なれる} 必要{ひつよう}があります。",
        "Work will become easier, but we will need to adapt.",
        "工作會變得更方便，但我們需要適應。",
      ),
    },
    {
      scene: "購買建議",
      goal: "提醒朋友不要只用價格判斷品質",
      purpose: "提醒價格不等於品質",
      partner: phrase(
        "高い{たかい}ほうを 買う{かう}べきでしょうか。",
        "Should I buy the more expensive one?",
        "我應該買比較貴的那個嗎？",
      ),
      reply: phrase(
        "値段{ねだん}だけでなく、 品質{ひんしつ}も 比べた{くらべた}ほうがいいと 思います{おもいます}。",
        "I would compare the quality rather than decide by price alone.",
        "我會比較品質，而不是只看價格決定。",
      ),
    },
    {
      scene: "團體做決定",
      goal: "提議先聽完大家意見再決定",
      purpose: "延後決定以取得充分意見",
      partner: phrase(
        "今{いま}、 決めて{きめて}もいいですか。",
        "Can we make a decision now?",
        "我們現在可以決定了嗎？",
      ),
      reply: phrase(
        "全員{ぜんいん}の 意見{いけん}を 聞いて{きいて}から 決めません{きめません}か。",
        "Shall we hear everyone's views before deciding?",
        "我們先聽完大家的意見再決定，好嗎？",
      ),
    },
    {
      scene: "鼓勵朋友",
      goal: "鼓勵朋友先從小規模嘗試",
      purpose: "降低嘗試新事物的壓力",
      partner: phrase(
        "失敗{しっぱい}が 心配{しんぱい}で、 挑戦{ちょうせん}できません。",
        "I'm afraid of failing, so I can't bring myself to try.",
        "我擔心失敗，所以不敢嘗試。",
      ),
      reply: phrase(
        "まず 小さく{ちいさく} 始めて{はじめて}、 結果{けっか}を 見て{みて}はどうでしょうか。",
        "Why not start small and see how it goes?",
        "何不先小規模嘗試，看看結果如何？",
      ),
    },
    {
      scene: "討論預算",
      goal: "承認初期費用較高，但說明長期效益",
      purpose: "以長期效益說明投入理由",
      partner: phrase(
        "費用{ひよう}が 高すぎる{たかすぎる}と 思いません{おもいません}か。",
        "Don't you think the cost is too high?",
        "你不覺得費用太高了嗎？",
      ),
      reply: phrase(
        "初期費用{しょきひよう}は 高い{たかい}ですが、 長期的{ちょうきてき}には 節約{せつやく}できます。",
        "The initial cost is high, but it will save money in the long run.",
        "初期費用較高，但長期可以省錢。",
      ),
    },
  ],
};

// Spaces delimit annotated Japanese chunks in source only, not displayed text.
for (const entries of Object.values(scenarios))
  for (const entry of entries)
    for (const part of [entry.partner, entry.reply])
      part.ja = part.ja.replace(/ /g, "");
