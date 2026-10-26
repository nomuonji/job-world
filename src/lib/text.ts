/** 表示用テキストを、構造化データやメタ情報に入れられる素の文に直す。 */

/**
 * 本文の【見出し】マーカーを落とし、改行と連続空白を1つに畳む。
 * 画面では h3 に変換しているが、description に入れると記号だけが残るため。
 */
export function plainText(text: string): string {
  return text
    .replace(/【[^】]*】/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
