/**
 * Server-rendered JSON-LD. `JSON.stringify` output has its `<` escaped to guard
 * against `</script>` injection from any string that ends up in structured data.
 */
export function JsonLd({ data }: { data: Record<string, unknown> | Record<string, unknown>[] }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
