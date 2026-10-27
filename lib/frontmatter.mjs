import { isMap, LineCounter, parseDocument } from 'yaml';

// Keep line numbers in the original SKILL.md for actionable diagnostics.
export function parseFrontmatter(text) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/);
  if (lines[0]?.trim() !== '---') return null;
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === '---');
  const invalid = (error, line = 2) => ({ error, errorLine: line, keys: [], data: {}, bodyStartLine: end + 2 });
  if (end < 0) return invalid('unterminated frontmatter fence');
  const lineCounter = new LineCounter();
  const doc = parseDocument(lines.slice(1, end).join('\n'), { lineCounter, uniqueKeys: true });
  if (doc.errors.length) {
    const error = doc.errors[0];
    return invalid(error.message, (error.linePos?.[0]?.line ?? 1) + 1);
  }
  if (!isMap(doc.contents)) return invalid('frontmatter must be a YAML mapping');
  try {
    const data = doc.toJS({ maxAliasCount: 100 });
    const keys = doc.contents.items.map(({ key }) => ({ key: String(key.value), line: lineCounter.linePos(key.range[0]).line + 1 }));
    for (const field of ['name', 'description']) if (typeof data[field] !== 'string') return invalid(`${field} must be a string`, keys.find(k => k.key === field)?.line);
    if (data.metadata !== undefined && (data.metadata === null || typeof data.metadata !== 'object' || Array.isArray(data.metadata))) return invalid('metadata must be a mapping');
    if (data['disable-model-invocation'] !== undefined && typeof data['disable-model-invocation'] !== 'boolean') return invalid('disable-model-invocation must be a boolean');
    return { data, keys, bodyStartLine: end + 2, text };
  } catch (error) { return invalid(error.message); }
}
