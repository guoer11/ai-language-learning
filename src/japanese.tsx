// Curated readings for this curriculum. Longest-match keeps compounds together.
export const readings: Record<string, string> = {
  動詞: "どうし",
  形: "けい",
  水: "みず",
  私: "わたし",
  学生: "がくせい",
  駅: "えき",
  明日: "あした",
  公園: "こうえん",
  行き: "いき",
  二人: "ふたり",
  窓: "まど",
  近く: "ちかく",
  席: "せき",
  座って: "すわって",
  予約: "よやく",
  変更: "へんこう",
  料理: "りょうり",
  何: "なに",
  雨: "あめ",
  降って: "ふって",
  傘: "かさ",
  持って: "もって",
  電車: "でんしゃ",
  京都: "きょうと",
  止まり: "とまり",
  少し: "すこし",
  話して: "はなして",
  昨日: "きのう",
  買った: "かった",
  本: "ほん",
  読んで: "よんで",
  卵: "たまご",
  入れ: "いれ",
  環境: "かんきょう",
  守る: "まもる",
  便利: "べんり",
  安全性: "あんぜんせい",
  大切: "たいせつ",
  異なる: "ことなる",
  意見: "いけん",
  尊重: "そんちょう",
  重要: "じゅうよう",
  技術: "ぎじゅつ",
  進歩: "しんぽ",
  働き方: "はたらきかた",
  変わり: "かわり",
  必ずしも: "かならずしも",
  高い: "たかい",
  商品: "しょうひん",
  良い: "よい",
  限り: "かぎり",
  十分: "じゅうぶん",
  話し合った: "はなしあった",
  上: "うえ",
  結論: "けつろん",
  出す: "だす",
  失敗: "しっぱい",
  恐れる: "おそれる",
  挑戦: "ちょうせん",
  避けて: "さけて",
  費用: "ひよう",
  増え: "ふえ",
  長期的: "ちょうきてき",
  価値: "かち",
  思い: "おもい",
};
// Context-specific reading: 何ですか is なんですか, while 何が is なにが.
const dictionary = { ...readings, 何です: "なんです" };
const keys = Object.keys(dictionary).sort((a, b) => b.length - a.length);
export function readingParts(
  text: string,
): { text: string; reading?: string }[] {
  const parts: { text: string; reading?: string }[] = [];
  for (let i = 0; i < text.length;) {
    const word = keys.find((k) => text.startsWith(k, i));
    if (word) {
      parts.push({
        text: word,
        reading: dictionary[word as keyof typeof dictionary],
      });
      i += word.length;
    } else {
      parts.push({ text: text[i] });
      i++;
    }
  }
  return parts;
}
export function JapaneseText({
  text,
  enabled = true,
  context = "",
}: {
  text: string;
  enabled?: boolean;
  context?: string;
}) {
  if (!enabled) return <>{text}</>;
  if (text === "何" && context.includes("何です"))
    return (
      <ruby lang="ja">
        何<rp>（</rp>
        <rt>なん</rt>
        <rp>）</rp>
      </ruby>
    );
  return (
    <span lang="ja" className="japanese-text">
      {readingParts(text).map((p, i) =>
        p.reading ? (
          <ruby key={i}>
            {p.text}
            <rp>（</rp>
            <rt>{p.reading}</rt>
            <rp>）</rp>
          </ruby>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}
// Only Japanese quotes receive readings; Traditional Chinese explanation stays unchanged.
export function StudyHint({
  text,
  japanese,
}: {
  text: string;
  japanese: boolean;
}) {
  return (
    <>
      {text.split(/(「[^」]+」)/g).map((s, i) =>
        japanese && s.startsWith("「") ? (
          <span key={i}>
            「<JapaneseText text={s.slice(1, -1)} context={text} />」
          </span>
        ) : (
          <span key={i}>{s}</span>
        ),
      )}
    </>
  );
}

export const japaneseTokens: Record<string, string[]> = Object.fromEntries(
  [
    "こんにちは|。",
    "水|を|ください|。",
    "ありがとう|ございます|。",
    "私|は|学生|です|。",
    "駅|は|どこ|です|か|。",
    "これ|は|いくら|です|か|。",
    "明日|、|公園|に|行き|ます|。",
    "二人|です|。",
    "窓|の|近く|の|席|に|座って|も|いい|です|か|。",
    "予約|を|変更|したい|の|です|が|。",
    "おすすめ|の|料理|は|何|です|か|。",
    "雨|が|降って|いる|ので|、|傘|を|持って|いき|ます|。",
    "この|電車|は|京都|に|止まり|ます|か|。",
    "もう|少し|ゆっくり|話して|いただけ|ます|か|。",
    "昨日|買った|本|を|読んで|い|ます|。",
    "アレルギー|が|ある|ので|、|卵|を|入れ|ない|で|ください|。",
    "環境|を|守る|ため|に|、|何|が|できる|でしょう|か|。",
    "便利|さ|だけ|で|なく|、|安全性|も|大切|です|。",
    "異なる|意見|を|尊重|する|こと|が|重要|です|。",
    "技術|の|進歩|によって|、|働き方|が|変わり|つつ|あり|ます|。",
    "必ずしも|高い|商品|が|良い|と|は|限り|ませ|ん|。",
    "十分|に|話し合った|上|で|、|結論|を|出す|べき|です|。",
    "失敗|を|恐れる|あまり|、|挑戦|を|避けて|は|いけ|ませ|ん|。",
    "費用|は|増え|ます|が|、|長期的|に|は|価値|が|ある|と|思い|ます|。",
  ].map((s) => [s.replaceAll("|", ""), s.split("|")]),
);
