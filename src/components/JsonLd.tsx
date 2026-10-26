/**
 * JSON-LD を <script type="application/ld+json"> として出力する。
 *
 * 既存の /jobs・/rare-jobs と同じく dangerouslySetInnerHTML で出すが、
 * JSON.stringify の結果に含まれる `<` `>` `&` を Unicode エスケープしてから渡す。
 * JSON としては同じ値に戻る（JSON.parse すれば元通り）が、本文に `</script>` の
 * ような文字列が現れても script ブロックが途中で閉じない。
 */
export function JsonLd({ data }: { data: unknown }) {
  const json = JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
